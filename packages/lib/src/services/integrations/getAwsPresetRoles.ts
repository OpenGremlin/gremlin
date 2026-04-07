import { GetParametersByPathCommand, SSMClient } from "@aws-sdk/client-ssm";
import { createLogger } from "../../logger.js";

const log = createLogger("integrations:aws-preset-roles");

export interface AwsPresetRole {
  id: string;
  name: string;
  description: string;
  roleArn: string;
}

const PRESET_DEFS: Array<{ id: string; name: string; description: string }> = [
  {
    id: "troubleshooting",
    name: "Troubleshooting",
    description:
      "Read-only access to CloudWatch, EC2, ECS, and Lambda for troubleshooting",
  },
  {
    id: "database-admin",
    name: "Database Admin",
    description: "Full DynamoDB and RDS access with CloudWatch monitoring",
  },
  {
    id: "app-builder",
    name: "App Builder",
    description: "Create and manage DynamoDB, S3, and RDS/Aurora resources",
  },
  {
    id: "read-only",
    name: "Read Only",
    description: "Broad read-only access across AWS services",
  },
];

let cachedRoles: AwsPresetRole[] | undefined;

export async function getAwsPresetRoles(): Promise<AwsPresetRole[]> {
  if (cachedRoles) return cachedRoles;

  try {
    const ssm = new SSMClient({});
    const result = await ssm.send(
      new GetParametersByPathCommand({
        Path: "/gremlin/preset-roles/",
        Recursive: false,
      }),
    );

    const arnMap = new Map<string, string>();
    for (const param of result.Parameters ?? []) {
      // Parameter name is like /gremlin/preset-roles/troubleshooting
      const id = param.Name?.split("/").pop();
      if (id && param.Value) {
        arnMap.set(id, param.Value);
      }
    }

    cachedRoles = PRESET_DEFS.filter((def) => arnMap.has(def.id)).map(
      (def) => ({
        ...def,
        roleArn: arnMap.get(def.id) ?? "",
      }),
    );

    return cachedRoles;
  } catch (err) {
    log.warn(
      { error: (err as Error).message },
      "Failed to load preset roles from SSM",
    );
    return [];
  }
}
