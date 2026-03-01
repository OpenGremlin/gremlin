import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { JobStatus } from "../../gql/resolverTypes.js";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";

export async function updateJobStatus(
  ctx: ServiceContext,
  id: string,
  status: JobStatus,
): Promise<AgentJobItem> {
  const { Attributes } = await ctx.resources.ddb.entities.AgentJob.build(
    UpdateItemCommand,
  )
    .item({ id, status })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Job ${id} not found`);
  return Attributes;
}
