import { randomUUID } from "node:crypto";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { createLogger } from "../../logger.js";
import type { Resources } from "../../resources/index.js";
import { providers } from "./providers.js";

const log = createLogger("integrations:aws-iam-role");

const ARN_REGEX = /^arn:aws(-cn|-us-gov)?:iam::(\d{12}):role\/.+$/;

export async function connectAwsIamRole(
  resources: Resources,
  roleArn: string,
  displayName?: string,
  region?: string,
): Promise<string> {
  const def = providers.find((p) => p.id === "aws");
  if (!def) throw new Error("AWS provider not found");

  const match = ARN_REGEX.exec(roleArn);
  if (!match) {
    throw new Error(
      "Invalid role ARN format. Expected: arn:aws:iam::<account-id>:role/<role-name>",
    );
  }
  const accountId = match[2];

  // Validate by attempting to assume the role
  const sts = new STSClient({});
  try {
    await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: "gremlin-validation",
        DurationSeconds: 900,
      }),
    );
  } catch (err) {
    log.error(
      { roleArn, error: (err as Error).message },
      "AssumeRole validation failed",
    );
    throw new Error(
      `Cannot assume role ${roleArn}. Ensure the role's trust policy allows this account to assume it.`,
    );
  }

  const id = randomUUID();

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      id,
      providerId: "aws",
      connectionType: "aws_iam_role",
      connectedAt: new Date().toISOString(),
      isRevoked: false,
      connectionMeta: {
        roleArn,
        accountId,
        roleRegion: region,
        displayName,
      },
    })
    .send();

  log.info({ connectionId: id, accountId }, "AWS IAM role connection created");

  return id;
}
