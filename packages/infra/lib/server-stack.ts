import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface ServerStackProps extends cdk.StackProps {
  tables: dynamodb.ITable[];
  tablePrefix: string;
  userPoolId: string;
  userPoolClientId: string;
  mediaCdnUrl: string;
}

export class ServerStack extends cdk.Stack {
  readonly cluster: ecs.ICluster;
  readonly service: ecs.IBaseService;

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

    for (const table of props.tables) {
      table.grantReadWriteData(taskDef.taskRole);
    }

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
        TABLE_PREFIX: props.tablePrefix,
        NODE_ENV: "production",
        AWS_REGION: this.region,
        COGNITO_USER_POOL_ID: props.userPoolId,
        COGNITO_CLIENT_ID: props.userPoolClientId,
        MEDIA_CDN_URL: props.mediaCdnUrl,
      },
    });

    container.addPortMappings({ containerPort: 3001 });

    const service = new ecs.FargateService(this, "Svc", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    this.cluster = cluster;
    this.service = service;

    new cdk.CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new cdk.CfnOutput(this, "ServiceName", { value: service.serviceName });
  }
}
