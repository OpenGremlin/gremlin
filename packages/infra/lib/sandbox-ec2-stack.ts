import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export interface SandboxEc2StackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  serverSecurityGroup: ec2.ISecurityGroup;
}

export class SandboxEc2Stack extends cdk.Stack {
  readonly sandboxSecurityGroup: ec2.ISecurityGroup;
  readonly instanceProfileArn: string;

  constructor(scope: Construct, id: string, props: SandboxEc2StackProps) {
    super(scope, id, props);

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

      // System packages
      "apt-get update -y",
      "apt-get install -y build-essential git python3 python3-pip jq curl unzip amazon-efs-utils",

      // Node.js 20
      "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
      "apt-get install -y nodejs",
      "npm install -g pnpm",

      // Go
      "curl -fsSL https://go.dev/dl/go1.22.5.linux-amd64.tar.gz | tar -C /usr/local -xzf -",
      'echo "export PATH=$PATH:/usr/local/go/bin" >> /etc/profile.d/go.sh',

      // Rust
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
      'echo "source /root/.cargo/env" >> /etc/profile.d/rust.sh',

      // Mount EFS at /workspace
      "mkdir -p /workspace",
      // EFS mount will be configured per-agent via fstab or mount command

      // Clone and build sandbox relay
      "mkdir -p /opt/gremlin",
      "cd /opt/gremlin",
      "git clone --depth 1 https://github.com/your-org/gremlin.git repo || true",
      "cd repo/apps/sandbox",
      "pnpm install --frozen-lockfile",
      "pnpm build",

      // Create systemd service for sandbox relay (logs to file for CloudWatch)
      `cat > /etc/systemd/system/sandbox-relay.service << 'SYSTEMD_EOF'
[Unit]
Description=Gremlin Sandbox Relay
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/gremlin/repo/apps/sandbox
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=WS_PORT=8080
Environment=HEALTH_PORT=8083
Environment=DISABLE_BROWSER_BRIDGE=true
Environment=NODE_ENV=production
StandardOutput=append:/var/log/sandbox-relay.log
StandardError=append:/var/log/sandbox-relay.log

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF`,
      "systemctl daemon-reload",
      "systemctl enable sandbox-relay",
      "systemctl start sandbox-relay",

      // Install and configure CloudWatch agent
      "wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "dpkg -i amazon-cloudwatch-agent.deb",
      "rm -f amazon-cloudwatch-agent.deb",
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CW_EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/sandbox-relay.log",
            "log_group_name": "/gremlin/sandbox",
            "log_stream_name": "{instance_id}/sandbox-relay"
          },
          {
            "file_path": "/var/log/sandbox-userdata.log",
            "log_group_name": "/gremlin/sandbox",
            "log_stream_name": "{instance_id}/userdata"
          }
        ]
      }
    }
  }
}
CW_EOF`,
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
    );

    // Use a private subnet (VPC-only, no public IP needed)
    const subnet = props.vpc.privateSubnets[0] ?? props.vpc.publicSubnets[0];

    const launchTemplate = new ec2.LaunchTemplate(this, "SandboxLaunchTemplate", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL,
      ),
      machineImage: ec2.MachineImage.fromSsmParameter(
        "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id",
      ),
      securityGroup: sandboxSg,
      role: sandboxRole,
      userData,
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

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
