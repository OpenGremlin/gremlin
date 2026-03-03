import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface ServerStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  tableName: string;
  secretsTable: dynamodb.ITable;
  secretsTableName: string;
  userPoolId: string;
  userPoolClientId: string;
  mediaCdnUrl: string;
}

export class ServerStack extends cdk.Stack {
  readonly cluster: ecs.ICluster;
  readonly service: ecs.IBaseService;
  readonly albDnsName: string;
  readonly vpc: ec2.IVpc;
  readonly serverSecurityGroup: ec2.ISecurityGroup;
  readonly serverTaskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: ServerStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "Public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      ],
    });

    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    const taskDef = new ecs.FargateTaskDefinition(this, "Task", {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    props.table.grantReadWriteData(taskDef.taskRole);
    props.secretsTable.grantReadWriteData(taskDef.taskRole);

    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/*`,
        ],
      }),
    );

    const container = taskDef.addContainer("gremlin-server", {
      image: ecs.ContainerImage.fromAsset(REPO_ROOT, {
        file: "Dockerfile",
        exclude: ["**/cdk.out"],
      }),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "gremlin-server",
        logRetention: logs.RetentionDays.TWO_WEEKS,
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:3001/api/health || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
      environment: {
        PORT: "3001",
        TABLE_NAME: props.tableName,
        SECRETS_TABLE_NAME: props.secretsTableName,
        NODE_ENV: "production",
        AWS_REGION: this.region,
        COGNITO_USER_POOL_ID: props.userPoolId,
        COGNITO_CLIENT_ID: props.userPoolClientId,
        MEDIA_CDN_URL: props.mediaCdnUrl,
        S3_VECTORS_BUCKET_NAME: "gremlin-vectors",
        ECS_CLUSTER_NAME: cluster.clusterName,
        SUBNET_IDS: vpc.publicSubnets.map(s => s.subnetId).join(","),
      },
    });

    container.addPortMappings({ containerPort: 3001 });

    const serverSg = new ec2.SecurityGroup(this, "ServerSg", {
      vpc,
      description: "Gremlin server Fargate service",
    });

    const service = new ecs.FargateService(this, "Svc", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [serverSg],
    });

    // ── ALB in front of Fargate ────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener("HttpListener", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets("FargateTarget", {
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: "/api/health",
        interval: cdk.Duration.seconds(30),
      },
    });

    // Grant task role permission to read config from SSM
    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/gremlin/*`,
        ],
      }),
    );

    // Grant task role permissions for sandbox ECS and EC2 operations
    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["ecs:RunTask", "ecs:StopTask", "ecs:DescribeTasks"],
        resources: ["*"],
      }),
    );

    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["s3vectors:*"],
        resources: ["*"],
      }),
    );

    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: ["*"],
        conditions: {
          StringLike: {
            "iam:PassedToService": "ecs-tasks.amazonaws.com",
          },
        },
      }),
    );


    this.cluster = cluster;
    this.service = service;
    this.albDnsName = alb.loadBalancerDnsName;
    this.vpc = vpc;
    this.serverSecurityGroup = serverSg;
    this.serverTaskDefinition = taskDef;

    new cdk.CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new cdk.CfnOutput(this, "ServiceName", { value: service.serviceName });
    new cdk.CfnOutput(this, "AlbDnsName", { value: alb.loadBalancerDnsName });
  }
}
