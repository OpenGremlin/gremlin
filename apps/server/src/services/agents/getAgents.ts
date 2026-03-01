import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

export async function getAgents(ctx: ServiceContext): Promise<AgentItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Agent)
    .query({ partition: "AGENT" })
    .send();

  return Items ?? [];
}
