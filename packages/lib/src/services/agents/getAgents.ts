import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

export async function getAgents(ctx: ServiceContext): Promise<AgentItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Agent)
    .query({ partition: "AGENT" })
    .send();

  return (Items ?? []).slice().sort((a, b) => {
    if (a.lastLogAt && b.lastLogAt)
      return b.lastLogAt.localeCompare(a.lastLogAt);
    if (a.lastLogAt) return -1;
    if (b.lastLogAt) return 1;
    return a.id.localeCompare(b.id);
  });
}
