import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";

interface CreateAgentInput {
  id: string;
  name: string;
  personality?: string | null;
}

export async function createAgent(
  ctx: ServiceContext,
  input: CreateAgentInput,
): Promise<AgentItem> {
  const id = input.id.toLowerCase();

  await ctx.resources.ddb.entities.Agent.build(PutItemCommand)
    .item({
      id,
      name: input.name,
      personality: input.personality ?? "",
      avatar: "default",
      portraitId: "default",
    })
    .options({ returnValues: "NONE" })
    .send();

  return {
    id,
    name: input.name,
    personality: input.personality ?? "",
    avatar: "default",
    portraitId: "default",
  };
}
