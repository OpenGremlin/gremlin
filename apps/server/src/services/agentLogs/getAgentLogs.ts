import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentLogItem } from "../../resources/ddb/schema/agentLog.js";
import type { ServiceContext } from "../context.js";

export async function getAgentLogs(
  ctx: ServiceContext,
  agentId: string,
): Promise<AgentLogItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.AgentLog)
    .query({
      index: "gsi1",
      partition: `LOG_AGENT#${agentId}`,
    })
    .send();

  return Items ?? [];
}
