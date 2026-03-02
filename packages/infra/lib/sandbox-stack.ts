import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface SandboxStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  serverSecurityGroup: ec2.ISecurityGroup;
  serverContainer: ecs.ContainerDefinition;
}

export class SandboxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SandboxStackProps) {
    super(scope, id, props);

    // Security group: allow inbound 8080 from server only
    const sandboxSg = new ec2.SecurityGroup(this, "SandboxSg", {
      vpc: props.vpc,
      description: "Gremlin sandbox Fargate tasks",
    });
    sandboxSg.addIngressRule(
      props.serverSecurityGroup,
      ec2.Port.tcp(8080),
      "WebSocket from server",
    );

    // Task definition: x86_64 for Playwright/Chromium
    const taskDef = new ecs.FargateTaskDefinition(this, "SandboxTask", {
      cpu: 1024,
      memoryLimitMiB: 2048,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Configure EBS volume for /workspace
    taskDef.addVolume({
      name: "workspace",
      configuredAtLaunch: true,
    });

    const container = taskDef.addContainer("sandbox", {
      image: ecs.ContainerImage.fromAsset(REPO_ROOT, {
        file: "apps/sandbox/Dockerfile",
        exclude: ["**/cdk.out"],
      }),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "gremlin-sandbox",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:8081/health || exit 1",
        ],
        interval: cdk.Duration.seconds(15),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });

    container.addPortMappings(
      { containerPort: 8080 },
      { containerPort: 8081 },
    );

    container.addMountPoints({
      sourceVolume: "workspace",
      containerPath: "/workspace",
      readOnly: false,
    });

    // Inject sandbox config into server container
    props.serverContainer.addEnvironment(
      "SANDBOX_TASK_DEF_ARN",
      taskDef.taskDefinitionArn,
    );
    props.serverContainer.addEnvironment(
      "SANDBOX_SG_ID",
      sandboxSg.securityGroupId,
    );

    new cdk.CfnOutput(this, "SandboxTaskDefArn", {
      value: taskDef.taskDefinitionArn,
    });
    new cdk.CfnOutput(this, "SandboxSgId", {
      value: sandboxSg.securityGroupId,
    });
  }
}
