import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as efs from "aws-cdk-lib/aws-efs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

/** Props for the {@link DoltServerConstruct}. */
export interface DoltServerConstructProps {
  /** VPC in which the Fargate service and EFS file system are placed. */
  vpc: ec2.IVpc;
  /** Security group of the sandbox EC2 instances that need MySQL access. */
  sandboxSecurityGroup: ec2.ISecurityGroup;
  /** Subnets to place the Fargate tasks and EFS mount targets in. */
  subnets: ec2.SubnetSelection;
}

/**
 * CDK construct that runs a Dolt SQL server as an ECS Fargate service.
 *
 * Persistent data is stored on an encrypted EFS volume so it survives task
 * restarts. The server endpoint is published to SSM Parameter Store at
 * `/gremlin/dolt-server-host` for service discovery by sandbox instances
 * and the gremlin server.
 */
export class DoltServerConstruct extends Construct {
  /** Security group attached to the Dolt Fargate tasks. */
  readonly securityGroup: ec2.ISecurityGroup;
  /** EFS file system backing Dolt's data directory. */
  readonly fileSystem: efs.IFileSystem;
  /** The Fargate service running dolt-sql-server. */
  readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: DoltServerConstructProps) {
    super(scope, id);

    const { vpc, sandboxSecurityGroup, subnets } = props;

    // ── EFS file system for persistent Dolt data ──────────
    const fileSystem = new efs.FileSystem(this, "DoltEfs", {
      vpc,
      vpcSubnets: subnets,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const accessPoint = new efs.AccessPoint(this, "DoltAccessPoint", {
      fileSystem,
      path: "/dolt-data",
      createAcl: { ownerGid: "1000", ownerUid: "1000", permissions: "755" },
      posixUser: { gid: "1000", uid: "1000" },
    });

    // ── Security group ────────────────────────────────────
    const doltSg = new ec2.SecurityGroup(this, "DoltSg", {
      vpc,
      description: "Dolt SQL server (Fargate)",
    });
    doltSg.addIngressRule(
      sandboxSecurityGroup,
      ec2.Port.tcp(3306),
      "MySQL from sandbox instances",
    );

    // Allow the Dolt tasks to reach EFS
    fileSystem.connections.allowDefaultPortFrom(doltSg);

    // ── ECS cluster ───────────────────────────────────────
    const cluster = new ecs.Cluster(this, "DoltCluster", {
      vpc,
      defaultCloudMapNamespace: {
        name: "gremlin.local",
        vpc,
      },
    });

    // ── Task definition ───────────────────────────────────
    const taskDef = new ecs.FargateTaskDefinition(this, "DoltTaskDef", {
      cpu: 1024,
      memoryLimitMiB: 2048,
    });

    taskDef.addVolume({
      name: "dolt-data",
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: "ENABLED",
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: "ENABLED",
        },
      },
    });

    // Grant the task role EFS client mount/write
    fileSystem.grant(
      taskDef.taskRole,
      "elasticfilesystem:ClientMount",
      "elasticfilesystem:ClientWrite",
    );

    const container = taskDef.addContainer("dolt", {
      image: ecs.ContainerImage.fromRegistry("dolthub/dolt-sql-server:latest"),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: new logs.LogGroup(this, "DoltLogGroup", {
          logGroupName: "/gremlin/dolt-server",
          retention: logs.RetentionDays.TWO_WEEKS,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        streamPrefix: "dolt",
      }),
      portMappings: [{ containerPort: 3306, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: [
          "CMD-SHELL",
          "mysqladmin ping -h 127.0.0.1 -P 3306 -u root --silent || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
      environment: {
        DOLT_ROOT_PATH: "/var/lib/dolt",
      },
    });

    container.addMountPoints({
      sourceVolume: "dolt-data",
      containerPath: "/var/lib/dolt",
      readOnly: false,
    });

    // ── Fargate service ───────────────────────────────────
    const service = new ecs.FargateService(this, "DoltService", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
      securityGroups: [doltSg],
      vpcSubnets: subnets,
      enableExecuteCommand: true,
    });

    // Use Cloud Map for service discovery so sandbox can resolve the host
    service.enableCloudMap({ name: "dolt" });

    // ── SSM parameter for endpoint discovery ──────────────
    new ssm.StringParameter(this, "DoltHostParam", {
      parameterName: "/gremlin/dolt-server-host",
      description: "Dolt SQL server Cloud Map DNS name",
      stringValue: "dolt.gremlin.local",
    });

    // ── Exports ───────────────────────────────────────────
    this.securityGroup = doltSg;
    this.fileSystem = fileSystem;
    this.service = service;
  }
}
