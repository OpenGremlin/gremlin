import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import {
  DeleteParameterCommand,
  GetParameterCommand,
  PutParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import type { GremlinConfig } from "./config.js";

function clientConfig(config: GremlinConfig | null) {
  const opts: Record<string, string> = {};
  if (config?.aws?.region) opts.region = config.aws.region;
  return opts;
}

/** Get current AWS identity (account, ARN, user ID). */
export async function getCallerIdentity(config: GremlinConfig | null) {
  const sts = new STSClient(clientConfig(config));
  const res = await sts.send(new GetCallerIdentityCommand({}));
  return {
    accountId: res.Account ?? "",
    arn: res.Arn ?? "",
    userId: res.UserId ?? "",
  };
}

/** Check if the current identity has the required permissions. */
export async function checkPermissions(
  config: GremlinConfig | null,
  callerArn: string,
): Promise<{ service: string; allowed: boolean }[]> {
  const iam = new IAMClient(clientConfig(config));
  const checks = [
    {
      service: "DynamoDB",
      actions: ["dynamodb:CreateTable", "dynamodb:DescribeTable"],
    },
    { service: "SQS", actions: ["sqs:CreateQueue", "sqs:GetQueueAttributes"] },
    { service: "EC2", actions: ["ec2:DescribeInstances", "ec2:RunInstances"] },
    { service: "IAM", actions: ["iam:CreateRole", "iam:AttachRolePolicy"] },
    {
      service: "CloudFormation",
      actions: ["cloudformation:CreateStack", "cloudformation:DescribeStacks"],
    },
    {
      service: "CloudFront",
      actions: ["cloudfront:CreateDistribution", "cloudfront:GetDistribution"],
    },
  ];

  const results: { service: string; allowed: boolean }[] = [];

  for (const check of checks) {
    try {
      const res = await iam.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: callerArn,
          ActionNames: check.actions,
        }),
      );
      const allAllowed = res.EvaluationResults?.every(
        (r) => r.EvalDecision === "allowed",
      );
      results.push({ service: check.service, allowed: !!allAllowed });
    } catch {
      // SimulatePrincipalPolicy requires iam:SimulateCustomPolicy permission.
      // If the caller doesn't have it, assume allowed and let CDK fail if not.
      results.push({ service: check.service, allowed: true });
    }
  }

  return results;
}

/** Read CloudFormation stack outputs to recover state. */
export async function getStackOutputs(
  config: GremlinConfig | null,
  stackName: string,
): Promise<Record<string, string> | null> {
  const cf = new CloudFormationClient(clientConfig(config));
  try {
    const res = await cf.send(
      new DescribeStacksCommand({ StackName: stackName }),
    );
    const stack = res.Stacks?.[0];
    if (!stack) return null;
    const outputs: Record<string, string> = {};
    for (const o of stack.Outputs ?? []) {
      if (o.OutputKey && o.OutputValue) {
        outputs[o.OutputKey] = o.OutputValue;
      }
    }
    return outputs;
  } catch {
    return null;
  }
}

/** Find existing Gremlin stacks in the current region. */
export async function findGremlinStacks(
  config: GremlinConfig | null,
): Promise<string[]> {
  const cf = new CloudFormationClient(clientConfig(config));
  try {
    const res = await cf.send(new DescribeStacksCommand({}));
    return (res.Stacks ?? [])
      .filter((s) => s.StackName?.startsWith("Gremlin"))
      .map((s) => s.StackName ?? "")
      .sort();
  } catch {
    return [];
  }
}

/** Read an SSM parameter. */
export async function getSsmParam(
  config: GremlinConfig | null,
  name: string,
): Promise<string | null> {
  const ssm = new SSMClient(clientConfig(config));
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: name }));
    return res.Parameter?.Value ?? null;
  } catch {
    return null;
  }
}

/** Write an SSM parameter. */
export async function putSsmParam(
  config: GremlinConfig | null,
  name: string,
  value: string,
): Promise<void> {
  const ssm = new SSMClient(clientConfig(config));
  await ssm.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Type: "String",
      Overwrite: true,
    }),
  );
}

/** Delete an SSM parameter. */
export async function deleteSsmParam(
  config: GremlinConfig | null,
  name: string,
): Promise<void> {
  const ssm = new SSMClient(clientConfig(config));
  try {
    await ssm.send(new DeleteParameterCommand({ Name: name }));
  } catch {
    // Ignore if already deleted
  }
}
