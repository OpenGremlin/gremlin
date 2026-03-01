import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { AgentJobItem } from "../../resources/ddb/schema/agentJob.js";
import type { ServiceContext } from "../context.js";

export async function getJob(
  ctx: ServiceContext,
  id: string,
): Promise<AgentJobItem | null> {
  const { Item } = await ctx.resources.ddb.entities.AgentJob.build(
    GetItemCommand,
  )
    .key({ id })
    .send();

  return Item ?? null;
}
