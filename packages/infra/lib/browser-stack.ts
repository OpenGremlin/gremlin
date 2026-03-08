import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface BrowserStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  serverSecurityGroup: ec2.ISecurityGroup;
}

export class BrowserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrowserStackProps) {
    super(scope, id, props);

    // Security group: allow inbound 9090 from server only
    const browserSg = new ec2.SecurityGroup(this, "BrowserSg", {
      vpc: props.vpc,
      description: "Gremlin browser Fargate tasks",
    });
    browserSg.addIngressRule(
      props.serverSecurityGroup,
      ec2.Port.tcp(9090),
      "Browser bridge from server",
    );

    // Task definition: 1 vCPU / 2 GB, x86_64 for Chromium
    const taskDef = new ecs.FargateTaskDefinition(this, "BrowserTask", {
      cpu: 1024,
      memoryLimitMiB: 2048,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Headless Chromium sidecar (CDP on port 9222)
    taskDef.addContainer("browser", {
      image: ecs.ContainerImage.fromAsset(
        path.join(REPO_ROOT, "packages/sandbox-browser"),
      ),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "gremlin-browser",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:9222/json/version || exit 1",
        ],
        interval: cdk.Duration.seconds(15),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });

    // Browser bridge container (talks to CDP, exposes HTTP on 9090)
    const bridgeContainer = taskDef.addContainer("browser-bridge", {
      image: ecs.ContainerImage.fromAsset(REPO_ROOT, {
        file: "packages/sandbox/Dockerfile",
        exclude: ["**/cdk.out"],
      }),
      essential: true,
      environment: {
        DISABLE_BROWSER_BRIDGE: "false",
        // Only run the browser bridge, not the shell relay
        WS_PORT: "0",
        HEALTH_PORT: "8083",
        BROWSER_BRIDGE_PORT: "9090",
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "gremlin-browser-bridge",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:8083/health || exit 1",
        ],
        interval: cdk.Duration.seconds(15),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });

    bridgeContainer.addPortMappings({ containerPort: 9090 });

    // SSM params for server to discover at runtime
    new ssm.StringParameter(this, "BrowserTaskDefArnParam", {
      parameterName: "/gremlin/browser-task-def-arn",
      stringValue: taskDef.taskDefinitionArn,
    });
    new ssm.StringParameter(this, "BrowserSgIdParam", {
      parameterName: "/gremlin/browser-sg-id",
      stringValue: browserSg.securityGroupId,
    });

    new cdk.CfnOutput(this, "BrowserTaskDefArn", {
      value: taskDef.taskDefinitionArn,
    });
    new cdk.CfnOutput(this, "BrowserSgId", {
      value: browserSg.securityGroupId,
    });
  }
}
