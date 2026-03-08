import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

export async function retireAgent(
  ctx: ServiceContext,
  id: string,
): Promise<AgentItem> {
  const { Attributes } = await ctx.resources.ddb.entities.Agent.build(
    UpdateItemCommand,
  )
    .item({ id, retired: true })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Agent ${id} not found`);
  ctx.resources.pubsub.publish(`agentUpdated:${id}`, Attributes);
  return Attributes;
}
