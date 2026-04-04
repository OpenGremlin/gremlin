#!/usr/bin/env bash
#
# Build a custom AMI for Gremlin sandbox EC2 instances.
#
# Pre-installs Docker and amazon-efs-utils so they don't need to be
# installed on every boot. Also pre-pulls the latest sandbox Docker
# image so most layers are cached on disk.
#
# Prerequisites:
#   - AWS CLI configured with appropriate permissions
#   - The sandbox CDK stack must be deployed (needs the ECR image)
#
# Usage:
#   ./build-sandbox-ami.sh [--image-uri <ecr-image-uri>] [--region <aws-region>]
#
# The resulting AMI ID is stored in SSM at /gremlin/sandbox-ami-id.

set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
IMAGE_URI=""
INSTANCE_TYPE="t4g.medium"
SSM_PARAM="/gremlin/sandbox-ami-id"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image-uri) IMAGE_URI="$2"; shift 2 ;;
    --region)    REGION="$2"; shift 2 ;;
    *)           echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$IMAGE_URI" ]]; then
  echo "Error: --image-uri is required (ECR URI of the sandbox image)"
  echo "You can find this in the CDK output or in the ECR console."
  exit 1
fi

ECR_REGISTRY="${IMAGE_URI%%/*}"

echo "==> Configuration"
echo "    Region:        $REGION"
echo "    Image URI:     $IMAGE_URI"
echo "    Instance type: $INSTANCE_TYPE"
echo ""

# Find latest Amazon Linux 2023 ARM64 AMI
echo "==> Finding latest AL2023 ARM64 AMI..."
BASE_AMI=$(aws ec2 describe-images \
  --region "$REGION" \
  --owners amazon \
  --filters \
    "Name=name,Values=al2023-ami-2023.*-kernel-*-arm64" \
    "Name=state,Values=available" \
    "Name=architecture,Values=arm64" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

echo "    Base AMI: $BASE_AMI"

# Look up the default VPC and a public subnet for the build instance
echo "==> Finding a public subnet for the build instance..."
SUBNET_ID=$(aws ec2 describe-subnets \
  --region "$REGION" \
  --filters "Name=defaultForAz,Values=true" \
  --query 'Subnets[0].SubnetId' \
  --output text)

echo "    Subnet: $SUBNET_ID"

# Create a temporary security group (no inbound rules needed — we use SSM)
echo "==> Creating temporary security group..."
VPC_ID=$(aws ec2 describe-subnets \
  --region "$REGION" \
  --subnet-ids "$SUBNET_ID" \
  --query 'Subnets[0].VpcId' \
  --output text)

SG_ID=$(aws ec2 create-security-group \
  --region "$REGION" \
  --group-name "gremlin-ami-builder-$(date +%s)" \
  --description "Temporary SG for AMI build" \
  --vpc-id "$VPC_ID" \
  --output text --query 'GroupId')

echo "    Security group: $SG_ID"

# Look up the instance profile ARN from SSM (created by CDK stack)
echo "==> Looking up instance profile ARN from SSM..."
INSTANCE_PROFILE_ARN=$(aws ssm get-parameter \
  --region "$REGION" \
  --name "/gremlin/sandbox-instance-profile-arn" \
  --query 'Parameter.Value' \
  --output text 2>/dev/null) || {
  echo "Error: SSM parameter /gremlin/sandbox-instance-profile-arn not found."
  echo "Deploy the CDK sandbox stack first."
  exit 1
}
# Extract the instance profile name from the ARN
INSTANCE_PROFILE_NAME="${INSTANCE_PROFILE_ARN##*/}"
echo "    Instance profile: $INSTANCE_PROFILE_NAME"

# User data script to install Docker, pull image, and signal completion
USER_DATA=$(cat <<USERDATA
#!/bin/bash
set -euo pipefail
exec > /var/log/ami-build.log 2>&1

echo "==> Installing Docker and EFS utils..."
dnf install -y docker amazon-efs-utils
systemctl enable docker
systemctl start docker

echo "==> Authenticating to ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "==> Pulling sandbox image (pre-caching layers)..."
docker pull ${IMAGE_URI}

echo "==> Stopping Docker (clean state for AMI)..."
docker stop \$(docker ps -aq) 2>/dev/null || true
systemctl stop docker

echo "==> Cleaning up..."
# Remove temporary credentials and logs that shouldn't be in the AMI
rm -f /root/.docker/config.json
cloud-init clean --logs

echo "AMI_BUILD_COMPLETE" > /tmp/ami-build-status
USERDATA
)

# Launch build instance
echo "==> Launching build instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --region "$REGION" \
  --image-id "$BASE_AMI" \
  --instance-type "$INSTANCE_TYPE" \
  --subnet-id "$SUBNET_ID" \
  --security-group-ids "$SG_ID" \
  --associate-public-ip-address \
  --iam-instance-profile "Name=$INSTANCE_PROFILE_NAME" \
  --user-data "$USER_DATA" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3","Encrypted":true}}]' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=gremlin-ami-builder}]" \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "    Instance: $INSTANCE_ID"

cleanup() {
  echo "==> Cleaning up build instance and security group..."
  aws ec2 terminate-instances --region "$REGION" --instance-ids "$INSTANCE_ID" 2>/dev/null || true
  # Wait for termination before removing SG
  aws ec2 wait instance-terminated --region "$REGION" --instance-ids "$INSTANCE_ID" 2>/dev/null || true
  aws ec2 delete-security-group --region "$REGION" --group-id "$SG_ID" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for the build to complete
echo "==> Waiting for instance to be running..."
aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"

echo "==> Waiting for build to complete (checking via SSM)..."
echo "    This typically takes 3-5 minutes..."

RESULT=""
for i in $(seq 1 60); do
  sleep 15
  STATUS=$(aws ssm send-command \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cat /tmp/ami-build-status 2>/dev/null || echo PENDING"]' \
    --query 'Command.CommandId' \
    --output text 2>/dev/null) || continue

  sleep 5
  RESULT=$(aws ssm get-command-invocation \
    --region "$REGION" \
    --command-id "$STATUS" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text 2>/dev/null) || continue

  if [[ "$RESULT" == *"AMI_BUILD_COMPLETE"* ]]; then
    echo "    Build completed!"
    break
  fi
  echo "    Still building... (attempt $i/60)"
done

if [[ "$RESULT" != *"AMI_BUILD_COMPLETE"* ]]; then
  echo "Error: Build did not complete within 15 minutes"
  exit 1
fi

# Stop the instance before creating AMI (cleaner snapshot)
echo "==> Stopping instance for AMI creation..."
aws ec2 stop-instances --region "$REGION" --instance-ids "$INSTANCE_ID"
aws ec2 wait instance-stopped --region "$REGION" --instance-ids "$INSTANCE_ID"

# Create AMI
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
AMI_NAME="gremlin-sandbox-${TIMESTAMP}"

echo "==> Creating AMI: $AMI_NAME ..."
AMI_ID=$(aws ec2 create-image \
  --region "$REGION" \
  --instance-id "$INSTANCE_ID" \
  --name "$AMI_NAME" \
  --description "Gremlin sandbox with Docker + pre-pulled image" \
  --query 'ImageId' \
  --output text)

echo "    AMI: $AMI_ID"
echo "==> Waiting for AMI to be available..."
aws ec2 wait image-available --region "$REGION" --image-ids "$AMI_ID"

# Store AMI ID in SSM
echo "==> Storing AMI ID in SSM ($SSM_PARAM)..."
aws ssm put-parameter \
  --region "$REGION" \
  --name "$SSM_PARAM" \
  --value "$AMI_ID" \
  --type String \
  --overwrite

echo ""
echo "==> Done!"
echo "    AMI ID: $AMI_ID"
echo "    SSM Parameter: $SSM_PARAM"
echo ""
echo "Next steps:"
echo "  1. Deploy the CDK stack to pick up the new AMI"
echo "  2. Re-run this script after updating the sandbox Docker image"
