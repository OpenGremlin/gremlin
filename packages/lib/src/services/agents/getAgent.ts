import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

export async function getAgent(
  ctx: ServiceContext,
  id: string,
): Promise<AgentItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Agent.build(GetItemCommand)
    .key({ id })
    .send();

  return Item ?? null;
}
