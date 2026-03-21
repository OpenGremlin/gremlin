import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";
import type { AllowlistEntry, AllowlistProvider } from "./types.js";

/**
 * DynamoDB-backed AllowlistProvider.
 *
 * Stores entries as:
 *   pk: SHELL_GUARD_ALLOWLIST#<agentId>
 *   sk: PATTERN#<pattern>
 */
export function createAllowlistStore(ctx: ServiceContext): AllowlistProvider {
  const table = ctx.resources.ddb.table;

  return {
    async getEntries(agentId: string): Promise<AllowlistEntry[]> {
      const result = await table.getDocumentClient().send(
        new QueryCommand({
          TableName: table.getName(),
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: {
            ":pk": `SHELL_GUARD_ALLOWLIST#${agentId}`,
          },
        }),
      );

      return (result.Items ?? []).map((item) => ({
        pattern: item.pattern as string,
      }));
    },

    async addEntry(agentId: string, entry: AllowlistEntry): Promise<void> {
      await table.getDocumentClient().send(
        new PutCommand({
          TableName: table.getName(),
          Item: {
            pk: `SHELL_GUARD_ALLOWLIST#${agentId}`,
            sk: `PATTERN#${entry.pattern.toLowerCase()}`,
            _et: "ShellGuardAllowlist",
            agentId,
            pattern: entry.pattern.toLowerCase(),
            createdAt: new Date().toISOString(),
          },
        }),
      );
    },

    async removeEntry(agentId: string, pattern: string): Promise<void> {
      const { DeleteCommand } = await import("@aws-sdk/lib-dynamodb");
      await table.getDocumentClient().send(
        new DeleteCommand({
          TableName: table.getName(),
          Key: {
            pk: `SHELL_GUARD_ALLOWLIST#${agentId}`,
            sk: `PATTERN#${pattern.toLowerCase()}`,
          },
        }),
      );
    },
  };
}
