import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as efs from "aws-cdk-lib/aws-efs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface SandboxStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  serverSecurityGroup: ec2.ISecurityGroup;
}

export class SandboxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SandboxStackProps) {
    super(scope, id, props);

    // Security group: allow inbound 8080 + 9090 from server only
    const sandboxSg = new ec2.SecurityGroup(this, "SandboxSg", {
      vpc: props.vpc,
      description: "Gremlin sandbox Fargate tasks",
    });
    sandboxSg.addIngressRule(
      props.serverSecurityGroup,
      ec2.Port.tcp(8080),
      "WebSocket from server",
    );
    sandboxSg.addIngressRule(
      props.serverSecurityGroup,
      ec2.Port.tcp(9090),
      "Browser bridge from server",
    );

    // ── EFS for shared /workspace ──────────────────────────
    const fsSg = new ec2.SecurityGroup(this, "EfsSg", {
      vpc: props.vpc,
      description: "Gremlin sandbox EFS",
    });
    fsSg.addIngressRule(sandboxSg, ec2.Port.tcp(2049), "NFS from sandbox");

    const fileSystem = new efs.FileSystem(this, "WorkspaceFs", {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: fsSg,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const accessPoint = fileSystem.addAccessPoint("WorkspaceAp", {
      path: "/workspace",
      createAcl: { ownerGid: "1000", ownerUid: "1000", permissions: "755" },
      posixUser: { gid: "1000", uid: "1000" },
    });

    // Task definition: x86_64 for Playwright/Chromium + browser sidecar
    const taskDef = new ecs.FargateTaskDefinition(this, "SandboxTask", {
      cpu: 2048,
      memoryLimitMiB: 4096,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    taskDef.addVolume({
      name: "workspace",
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: "ENABLED",
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: "ENABLED",
        },
      },
    });

    fileSystem.grant(
      taskDef.taskRole,
      "elasticfilesystem:ClientMount",
      "elasticfilesystem:ClientWrite",
    );

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
      { containerPort: 9090 },
    );

    container.addMountPoints({
      sourceVolume: "workspace",
      containerPath: "/workspace",
      readOnly: false,
    });

    // ── Browser sidecar (headless Chromium with CDP) ─────────
    taskDef.addContainer("sandbox-browser", {
      image: ecs.ContainerImage.fromAsset(
        path.join(REPO_ROOT, "apps/sandbox-browser"),
      ),
      essential: false,
      memoryLimitMiB: 1024,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "gremlin-sandbox-browser",
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

    // Store sandbox config in SSM so the server can read at runtime
    // (avoids cyclic cross-stack reference via serverContainer.addEnvironment)
    new ssm.StringParameter(this, "SandboxTaskDefArnParam", {
      parameterName: "/gremlin/sandbox-task-def-arn",
      stringValue: taskDef.taskDefinitionArn,
    });
    new ssm.StringParameter(this, "SandboxSgIdParam", {
      parameterName: "/gremlin/sandbox-sg-id",
      stringValue: sandboxSg.securityGroupId,
    });

    new cdk.CfnOutput(this, "SandboxTaskDefArn", {
      value: taskDef.taskDefinitionArn,
    });
    new cdk.CfnOutput(this, "SandboxSgId", {
      value: sandboxSg.securityGroupId,
    });
  }
}
