import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

export interface MemoryTopicSummary {
  topic: string;
  updatedAt: string;
}

export async function listMemoryTopics(
  ctx: ServiceContext,
  agentId: string,
): Promise<MemoryTopicSummary[]> {
  const table = ctx.resources.ddb.table;

  const { Items } = await table.getDocumentClient().send(
    new QueryCommand({
      TableName: table.getName(),
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `MEM_AGENT#${agentId}`,
      },
      ScanIndexForward: false,
    }),
  );

  return (Items ?? []).map((item) => ({
    topic: item.topic as string,
    updatedAt: item.updatedAt as string,
  }));
}
