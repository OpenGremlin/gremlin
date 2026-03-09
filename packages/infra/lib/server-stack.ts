import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ecs from "aws-cdk-lib/aws-ecs";
import type * as efs from "aws-cdk-lib/aws-efs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface ServerStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  table: dynamodb.ITable;
  tableName: string;
  secretsTable: dynamodb.ITable;
  secretsTableName: string;
  fileSystem: efs.IFileSystem;
  accessPoint: efs.IAccessPoint;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
  mediaCdnUrl: string;
  uploadsBucket: s3.IBucket;
  uploadsBucketName: string;
}

export class ServerStack extends cdk.Stack {
  readonly cluster: ecs.ICluster;
  readonly serverRole: iam.IRole;
  readonly notifyHookRoleArn: string;
  readonly elasticIp: string;
  readonly serverDns: string;
  readonly serverSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: ServerStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // ECS cluster is still needed for sandbox RunTask
    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    // ── Docker image asset (builds & pushes to ECR) ──────────
    const imageAsset = new ecr_assets.DockerImageAsset(this, "ServerImage", {
      directory: REPO_ROOT,
      file: "Dockerfile",
      exclude: ["**/cdk.out"],
      platform: ecr_assets.Platform.LINUX_ARM64,
    });

    // ── IAM role for EC2 instance ────────────────────────────
    const serverRole = new iam.Role(this, "ServerRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // ── Notify hook role (assumed by sandbox EC2 to call /notifyHook) ──
    const notifyHookRole = new iam.Role(this, "NotifyHookRole", {
      roleName: "gremlin-notify-hook-role",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      // No permissions — just an identity for authentication
    });

    new cdk.aws_ssm.StringParameter(this, "NotifyHookRoleArnParam", {
      parameterName: "/gremlin/notify-hook-role-arn",
      stringValue: notifyHookRole.roleArn,
    });

    props.table.grantReadWriteData(serverRole);
    props.secretsTable.grantReadWriteData(serverRole);

    serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          // Foundation models (all regions — cross-region inference routes to other regions)
          "arn:aws:bedrock:*::foundation-model/*",
          // Cross-region inference profiles (us.*, eu.*, etc.)
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      }),
    );

    props.uploadsBucket.grantReadWrite(serverRole);

    props.fileSystem.grant(serverRole, "elasticfilesystem:ClientMount");

    serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/gremlin/*`,
        ],
      }),
    );

    // EC2 permissions (for sandbox instances)
    serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "ec2:RunInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2:CreateTags",
          "ec2:TerminateInstances",
        ],
        resources: ["*"],
      }),
    );

    serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["s3vectors:*"],
        resources: ["*"],
      }),
    );

    // PassRole for both ECS tasks and EC2 sandbox instances
    serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: ["*"],
        conditions: {
          StringLike: {
            "iam:PassedToService": [
              "ecs-tasks.amazonaws.com",
              "ec2.amazonaws.com",
            ],
          },
        },
      }),
    );

    // ECR pull permissions
    imageAsset.repository.grantPull(serverRole);

    // CloudWatch Logs permissions
    serverRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
        resources: ["*"],
      }),
    );

    // ── Log group ────────────────────────────────────────────
    const logGroup = new logs.LogGroup(this, "ServerLogGroup", {
      logGroupName: "/gremlin/server",
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Security group ───────────────────────────────────────
    const serverSg = new ec2.SecurityGroup(this, "ServerSg", {
      vpc,
      description: "Gremlin server EC2 instance",
    });

    serverSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3001),
      "CloudFront to server",
    );

    // ── EC2 instance ─────────────────────────────────────────
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "set -euo pipefail",

      // Install Docker
      "dnf install -y docker amazon-efs-utils",
      "systemctl enable docker && systemctl start docker",

      // Authenticate to ECR and pull server image
      `aws ecr get-login-password --region ${this.region} | docker login --username AWS --password-stdin ${imageAsset.repository.repositoryUri}`,
      `docker pull ${imageAsset.imageUri}`,

      // Mount EFS
      "mkdir -p /workspace",
      `mount -t efs -o tls,accesspoint=${props.accessPoint.accessPointId} ${props.fileSystem.fileSystemId}:/ /workspace`,

      // Run the container
      [
        "docker run -d --restart always",
        `--log-driver awslogs`,
        `--log-opt awslogs-region=${this.region}`,
        `--log-opt awslogs-group=${logGroup.logGroupName}`,
        `--log-opt awslogs-create-group=false`,
        `-p 3001:3001`,
        `-v /workspace:/workspace`,
        `-e PORT=3001`,
        `-e TABLE_NAME=${props.tableName}`,
        `-e SECRETS_TABLE_NAME=${props.secretsTableName}`,
        `-e NODE_ENV=production`,
        `-e AWS_REGION=${this.region}`,
        `-e COGNITO_USER_POOL_ID=${props.userPoolId}`,
        `-e COGNITO_CLIENT_ID=${props.userPoolClientId}`,
        `-e COGNITO_DOMAIN=${props.cognitoDomain}`,
        `-e MEDIA_CDN_URL=${props.mediaCdnUrl}`,
        `-e S3_VECTORS_BUCKET_NAME=gremlin-vectors`,
        `-e UPLOADS_BUCKET_NAME=${props.uploadsBucketName}`,
        `-e WORKSPACE_PATH=/workspace`,
        `-e ECS_CLUSTER_NAME=${cluster.clusterName}`,
        `-e SUBNET_IDS=${vpc.publicSubnets.map((s) => s.subnetId).join(",")}`,
        imageAsset.imageUri,
      ].join(" "),
    );

    const instance = new ec2.Instance(this, "Server", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.NANO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      role: serverRole,
      securityGroup: serverSg,
      userData,
      userDataCausesReplacement: true,
    });

    // ── Elastic IP ───────────────────────────────────────────
    const eip = new ec2.CfnEIP(this, "ServerEip");
    new ec2.CfnEIPAssociation(this, "ServerEipAssoc", {
      allocationId: eip.attrAllocationId,
      instanceId: instance.instanceId,
    });

    // ── Exports ──────────────────────────────────────────────
    this.cluster = cluster;
    this.serverRole = serverRole;
    this.notifyHookRoleArn = notifyHookRole.roleArn;
    this.elasticIp = eip.attrPublicIp;
    // CloudFront requires a domain name, not an IP. Construct EC2 public DNS
    // from the EIP: ec2-1-2-3-4.compute-1.amazonaws.com (us-east-1)
    const dashedIp = cdk.Fn.join("-", cdk.Fn.split(".", eip.attrPublicIp));
    this.serverDns = cdk.Fn.join("", [
      "ec2-",
      dashedIp,
      this.region === "us-east-1"
        ? ".compute-1.amazonaws.com"
        : `.${this.region}.compute.amazonaws.com`,
    ]);
    this.serverSecurityGroup = serverSg;

    new cdk.CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new cdk.CfnOutput(this, "ServerInstanceId", { value: instance.instanceId });
    new cdk.CfnOutput(this, "ServerElasticIp", { value: eip.attrPublicIp });
  }
}
