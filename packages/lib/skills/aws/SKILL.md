---
name: aws
description: >-
  Access an AWS account via the AWS CLI. Use when the user
  asks to create, manage, troubleshoot, or inspect AWS
  resources like DynamoDB, S3, Lambda, EC2, CloudWatch, etc.
metadata:
  version: 1.0.0
  displayName: AWS
  author: gremlin
  category: cloud
  icon: aws
  tags: [aws, cloud, infrastructure, devops]
  allowedCommands:
    - aws
  connections:
    - provider: aws
      # env values are not used for aws_iam_role — credentials are
      # injected directly by the server via STS AssumeRole
      env:
        AWS_ACCESS_KEY_ID: roleArn
      reason: Access an AWS account to manage cloud resources.
---

# AWS

You have access to an AWS account via the `aws` CLI.

## First steps

Before doing anything else, verify your access:

```bash
aws sts get-caller-identity
```

Check the `Arn` in the output — it looks like `arn:aws:sts::123456:assumed-role/MyRoleName/session`. Extract the role name (the segment after `assumed-role/`), then check what policies are attached using that role name:

```bash
aws iam list-attached-role-policies --role-name "MyRoleName" --output table
aws iam list-role-policies --role-name "MyRoleName" --output table
```

Always do this at the start of a session so you know your permissions before attempting operations. If a call fails with AccessDenied, check your policies rather than retrying.

## Common patterns

### DynamoDB
```bash
aws dynamodb list-tables
aws dynamodb describe-table --table-name MyTable
aws dynamodb scan --table-name MyTable --max-items 10
aws dynamodb put-item --table-name MyTable --item '{"id": {"S": "123"}, "name": {"S": "Alice"}}'
aws dynamodb query --table-name MyTable --key-condition-expression "id = :id" --expression-attribute-values '{":id": {"S": "123"}}'
```

### S3
```bash
aws s3 ls
aws s3 ls s3://my-bucket/
aws s3 cp localfile.txt s3://my-bucket/
aws s3 cp s3://my-bucket/file.txt ./
aws s3 sync ./local-dir s3://my-bucket/prefix/
```

### Lambda
```bash
aws lambda list-functions --output table
aws lambda invoke --function-name MyFunction --payload '{"key": "value"}' /dev/stdout
aws lambda create-function --function-name NewFunc --runtime nodejs20.x --role ROLE_ARN --handler index.handler --zip-file fileb://function.zip
```

### CloudWatch Logs
```bash
aws logs describe-log-groups --output table
aws logs filter-log-events --log-group-name /my/log-group --start-time $(date -d '1 hour ago' +%s000) --filter-pattern "ERROR"
aws logs tail /my/log-group --follow
```

### EC2
```bash
aws ec2 describe-instances --output table
aws ec2 describe-instances --filters "Name=tag:Name,Values=*web*" --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' --output table
```

## Security

Follow these rules when creating or modifying AWS resources:

- **Never expose resources to the public internet** unless the user explicitly asks for it. S3 buckets must block public access. Security groups must not allow 0.0.0.0/0 ingress on sensitive ports. API Gateway endpoints should be private or require authentication.
- **Use least-privilege IAM policies.** When creating roles for Lambda or other services, only grant the specific actions and resources needed. Never attach AdministratorAccess or use `"Action": "*"`.
- **Do not store secrets in plaintext.** Never put credentials, API keys, or passwords in environment variables, S3 objects, or DynamoDB items as plaintext. Use AWS Secrets Manager or SSM Parameter Store (SecureString) instead.
- **Enable encryption.** Use `--server-side-encryption` for S3 objects, encrypted EBS volumes, and encryption at rest for DynamoDB tables and RDS instances.
- **Do not delete or modify resources you didn't create** unless the user explicitly asks. Check tags and naming before modifying existing infrastructure.
- **Never disable logging or monitoring.** Do not turn off CloudTrail, VPC Flow Logs, or CloudWatch alarms.
- **Prefer private subnets** for compute resources. Use VPC endpoints for AWS service access when possible.

## Tips

- Use `--output table` for human-readable output, `--output json` when you need to parse results.
- Use `--query` (JMESPath) to filter output: `--query 'Items[].{id: id.S, name: name.S}'`
- Use `--dry-run` where supported (EC2, etc.) to preview actions without executing.
- Use `--no-cli-pager` to prevent paging in non-interactive mode.
- If an operation fails with AccessDenied, tell the user which permission is missing so they can update the role policy.
- Tag resources you create with `--tags Key=CreatedBy,Value=gremlin` so they can be tracked and cleaned up.
- For long-running operations, use `aws ... wait` commands (e.g., `aws ec2 wait instance-running`).
