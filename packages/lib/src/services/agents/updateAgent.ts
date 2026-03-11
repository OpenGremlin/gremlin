import {
  $remove,
  $set,
  UpdateItemCommand,
} from "dynamodb-toolbox/entity/actions/update";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import { nullsToUndefined } from "../../utils/nullsToUndefined.js";
import type { ServiceContext } from "../context.js";

interface UpdateAgentInput {
  name?: string | null;
  soul?: string | null;
  avatar?: string | null;
  sandboxInstanceId?: string | null;
  ttsVoice?: string | null;
  config?: {
    model?: { type: string; modelId?: string; connectionId?: string } | null;
    sandbox?: { enabled: boolean } | null;
    webSearch?: { enabled: boolean; provider?: string } | null;
    browser?: { enabled: boolean } | null;
  } | null;
}

export async function updateAgent(
  ctx: ServiceContext,
  id: string,
  input: UpdateAgentInput,
): Promise<AgentItem> {
  const updates: Record<string, unknown> = { id };

  if (input.name != null) updates.name = input.name;
  if (input.soul != null) updates.soul = input.soul;
  if (input.avatar != null) updates.avatar = input.avatar;
  if (input.sandboxInstanceId != null)
    updates.sandboxInstanceId = input.sandboxInstanceId;
  if (input.ttsVoice !== undefined)
    updates.ttsVoice = input.ttsVoice === null ? $remove() : input.ttsVoice;
  if (input.config != null)
    updates.config = $set(nullsToUndefined(input.config));

  const { Attributes } = await ctx.resources.ddb.entities.Agent.build(
    UpdateItemCommand,
  )
    .item(updates as { id: string })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Agent ${id} not found`);
  ctx.resources.pubsub.publish(`agentUpdated:${id}`, Attributes);
  return Attributes;
}
