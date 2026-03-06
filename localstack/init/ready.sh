#!/bin/bash
# Auto-creates local AWS resources when LocalStack starts.
# Mounted at /etc/localstack/init/ready.d/ in docker-compose.yml.

set -euo pipefail

REGION=us-east-1
ENDPOINT=http://localhost:4566

echo "Creating DynamoDB tables..."

awslocal dynamodb create-table \
  --table-name gremlin \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=gsi1pk,AttributeType=S \
    AttributeName=gsi1sk,AttributeType=S \
    AttributeName=gsi2pk,AttributeType=S \
    AttributeName=gsi2sk,AttributeType=S \
  --global-secondary-indexes \
    '[{"IndexName":"gsi1","KeySchema":[{"AttributeName":"gsi1pk","KeyType":"HASH"},{"AttributeName":"gsi1sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"gsi2","KeySchema":[{"AttributeName":"gsi2pk","KeyType":"HASH"},{"AttributeName":"gsi2sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" 2>/dev/null || echo "  gremlin table already exists"

awslocal dynamodb create-table \
  --table-name gremlin-secrets \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" 2>/dev/null || echo "  gremlin-secrets table already exists"

echo "Creating SQS queue..."
awslocal sqs create-queue --queue-name gremlin-doorbell --region "$REGION" 2>/dev/null || echo "  gremlin-doorbell queue already exists"

echo "Creating EventBridge Scheduler group..."
awslocal scheduler create-schedule-group --name gremlin --region "$REGION" 2>/dev/null || echo "  gremlin scheduler group already exists"

echo "LocalStack init complete."
