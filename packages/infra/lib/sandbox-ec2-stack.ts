import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import type * as efs from "aws-cdk-lib/aws-efs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cr from "aws-cdk-lib/custom-resources";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface SandboxEc2StackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  serverSecurityGroup: ec2.ISecurityGroup;
  fileSystem: efs.IFileSystem;
  accessPoint: efs.IAccessPoint;
  notifyHookRoleArn: string;
  serverElasticIp: string;
}

export class SandboxEc2Stack extends cdk.Stack {
  readonly sandboxSecurityGroup: ec2.ISecurityGroup;
  readonly instanceProfileArn: string;

  constructor(scope: Construct, id: string, props: SandboxEc2StackProps) {
    super(scope, id, props);

    // ── Docker image asset (same Dockerfile used by BrowserStack) ──
    const imageAsset = new ecr_assets.DockerImageAsset(this, "SandboxImage", {
      directory: REPO_ROOT,
      file: "apps/sandbox/Dockerfile.ec2",
      exclude: ["**/cdk.out"],
      platform: ecr_assets.Platform.LINUX_ARM64,
    });

    // ── Security group ─────────────────────────────────────
    const sandboxSg = new ec2.SecurityGroup(this, "SandboxEc2Sg", {
      vpc: props.vpc,
      description: "Gremlin sandbox EC2 instances",
    });
    sandboxSg.addIngressRule(
      props.serverSecurityGroup,
      ec2.Port.tcp(8080),
      "WebSocket from server",
    );
    sandboxSg.addIngressRule(
      props.serverSecurityGroup,
      ec2.Port.tcp(8083),
      "Health check from server",
    );

    // ── IAM role + instance profile ────────────────────────
    const sandboxRole = new iam.Role(this, "SandboxEc2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // EFS mount permissions
    sandboxRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
        ],
        resources: ["*"],
      }),
    );

    // CloudWatch Logs permissions
    sandboxRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/gremlin/sandbox:*`,
        ],
      }),
    );

    // Allow sandbox to assume the notify hook role
    sandboxRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [props.notifyHookRoleArn],
      }),
    );

    // Allow sandbox to read its own tags and modify metadata options (for Docker IMDS access)
    sandboxRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["ec2:DescribeTags", "ec2:ModifyInstanceMetadataOptions"],
        resources: ["*"],
      }),
    );

    // ECR pull permissions
    imageAsset.repository.grantPull(sandboxRole);

    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      "SandboxInstanceProfile",
      { roles: [sandboxRole.roleName] },
    );

    // ── CloudWatch log group ───────────────────────────────
    new logs.LogGroup(this, "SandboxLogGroup", {
      logGroupName: "/gremlin/sandbox",
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Launch template ────────────────────────────────────
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "set -euo pipefail",
      "exec > /var/log/sandbox-userdata.log 2>&1",

      // Install Docker (Amazon Linux 2023)
      "dnf install -y docker amazon-efs-utils",
      "systemctl enable docker && systemctl start docker",

      // Authenticate to ECR and pull sandbox image
      `aws ecr get-login-password --region ${this.region} | docker login --username AWS --password-stdin ${imageAsset.repository.repositoryUri}`,
      `docker pull ${imageAsset.imageUri}`,

      // Mount EFS at /workspace
      "mkdir -p /workspace",
      `mount -t efs -o tls,accesspoint=${props.accessPoint.accessPointId} ${props.fileSystem.fileSystemId}:/ /workspace`,

      // Allow Docker containers to reach instance metadata (IMDSv2)
      "TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600')",
      `aws ec2 modify-instance-metadata-options --region ${this.region} --instance-id $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id) --http-put-response-hop-limit 2 --http-endpoint enabled`,

      // Read instance tags to get agentId
      `INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)`,
      `AGENT_ID=$(aws ec2 describe-tags --region ${this.region} --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=gremlin:agentId" --query "Tags[0].Value" --output text)`,

      // Run the sandbox container
      [
        "docker run -d --restart always",
        "--name sandbox-relay",
        `--log-driver awslogs`,
        `--log-opt awslogs-region=${this.region}`,
        `--log-opt awslogs-group=/gremlin/sandbox`,
        `--log-opt awslogs-create-group=false`,
        `-p 8080:8080`,
        `-p 8083:8083`,
        `-v /workspace:/workspace`,
        `-e WS_PORT=8080`,
        `-e HEALTH_PORT=8083`,
        `-e DISABLE_BROWSER_BRIDGE=true`,
        `-e NODE_ENV=production`,
        `-e AWS_REGION=${this.region}`,
        `-e NOTIFY_HOOK_ROLE_ARN=${props.notifyHookRoleArn}`,
        `-e NOTIFY_HOOK_URL=http://${props.serverElasticIp}:3001/notifyHook`,
        `-e INSTANCE_ID=$INSTANCE_ID`,
        `-e AGENT_ID=$AGENT_ID`,
        imageAsset.imageUri,
      ].join(" "),
    );

    // Use a private subnet (VPC-only, no public IP needed)
    const subnet = props.vpc.privateSubnets[0] ?? props.vpc.publicSubnets[0];

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      "SandboxLaunchTemplate",
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.SMALL,
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023({
          cpuType: ec2.AmazonLinuxCpuType.ARM_64,
        }),
        securityGroup: sandboxSg,
        role: sandboxRole,
        userData,
        blockDevices: [
          {
            deviceName: "/dev/xvda",
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
            }),
          },
        ],
      },
    );

    // ── SSM parameters ─────────────────────────────────────
    new ssm.StringParameter(this, "LaunchTemplateIdParam", {
      parameterName: "/gremlin/sandbox-launch-template-id",
      stringValue: launchTemplate.launchTemplateId!,
    });
    new ssm.StringParameter(this, "SubnetIdParam", {
      parameterName: "/gremlin/sandbox-ec2-subnet-id",
      stringValue: subnet.subnetId,
    });

    // ── Terminate old sandbox instances on deploy ──────────
    const cleanupFn = new lambda_nodejs.NodejsFunction(
      this,
      "SandboxCleanupFn",
      {
        entry: path.join(
          REPO_ROOT,
          "packages/functions/src/sandboxCleanup.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(60),
        bundling: {
          format: lambda_nodejs.OutputFormat.ESM,
          mainFields: ["module", "main"],
        },
      },
    );
    cleanupFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ec2:DescribeInstances", "ec2:TerminateInstances"],
        resources: ["*"],
      }),
    );

    new cdk.CustomResource(this, "SandboxCleanup", {
      serviceToken: new cr.Provider(this, "SandboxCleanupProvider", {
        onEventHandler: cleanupFn,
      }).serviceToken,
      // Change this property whenever the launch template updates to trigger cleanup
      properties: {
        launchTemplateVersion: launchTemplate.versionNumber,
      },
    });

    // ── Periodic sandbox sweeper — stop idle instances ────
    // Runs every 5 minutes. Stops any gremlin-sandbox-* instance
    // that has been running for longer than 30 minutes.
    const sweeperFn = new lambda_nodejs.NodejsFunction(
      this,
      "SandboxSweeperFn",
      {
        entry: path.join(
          REPO_ROOT,
          "packages/functions/src/sandboxSweeper.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(60),
        bundling: {
          format: lambda_nodejs.OutputFormat.ESM,
          mainFields: ["module", "main"],
        },
      },
    );
    sweeperFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ec2:DescribeInstances", "ec2:StopInstances"],
        resources: ["*"],
      }),
    );

    new events.Rule(this, "SandboxSweeperRule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(sweeperFn)],
    });

    // ── Exports ────────────────────────────────────────────
    this.sandboxSecurityGroup = sandboxSg;
    this.instanceProfileArn = instanceProfile.attrArn;

    new cdk.CfnOutput(this, "SandboxLaunchTemplateId", {
      value: launchTemplate.launchTemplateId!,
    });
    new cdk.CfnOutput(this, "SandboxSgId", {
      value: sandboxSg.securityGroupId,
    });
    new cdk.CfnOutput(this, "SandboxInstanceProfileArn", {
      value: instanceProfile.attrArn,
    });
  }
}
