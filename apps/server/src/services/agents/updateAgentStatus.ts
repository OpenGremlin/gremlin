import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { AgentStatus } from "../../gql/resolverTypes.js";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

export async function updateAgentStatus(
  ctx: ServiceContext,
  id: string,
  status: AgentStatus,
): Promise<AgentItem> {
  const blocked = status === AgentStatus.Blocked;

  const { Attributes } = await ctx.resources.ddb.entities.Agent.build(
    UpdateItemCommand,
  )
    .item({ id, blocked })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Agent ${id} not found`);
  return Attributes;
}
