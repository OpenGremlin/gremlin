import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";

export async function getJobs(ctx: ServiceContext): Promise<AgentJobItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.AgentJob)
    .query({ partition: "AGENT_JOB" })
    .send();

  return Items ?? [];
}
