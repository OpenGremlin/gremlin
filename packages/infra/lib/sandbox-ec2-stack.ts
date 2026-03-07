import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface SandboxEc2StackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  serverSecurityGroup: ec2.ISecurityGroup;
}

export class SandboxEc2Stack extends cdk.Stack {
  readonly sandboxSecurityGroup: ec2.ISecurityGroup;
  readonly instanceProfileArn: string;

  constructor(scope: Construct, id: string, props: SandboxEc2StackProps) {
    super(scope, id, props);

    // ── Docker image asset (same Dockerfile used by BrowserStack) ──
    const imageAsset = new ecr_assets.DockerImageAsset(this, "SandboxImage", {
      directory: REPO_ROOT,
      file: "apps/sandbox/Dockerfile",
      exclude: ["**/cdk.out"],
      platform: ecr_assets.Platform.LINUX_AMD64,
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
      // EFS mount will be configured per-agent via fstab or mount command

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
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL,
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
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
