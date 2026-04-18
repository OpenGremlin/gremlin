import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { AgentItem } from "../../resources/ddb/schema/agent.js";
import type { ServiceContext } from "../context.js";
import { assignSkill } from "../skills/assignSkill.js";

interface CreateAgentInput {
  id: string;
  name: string;
  personality?: string | null;
  delegationHint?: string | null;
}

/** Skills auto-assigned to every new agent. */
const DEFAULT_SKILLS = ["basic-programming"];

/**
 * Middle of the agent hue slider's 0–360 range = cyan/teal at bright
 * saturation, readable against both light and dark backgrounds. Also used
 * as the fallback color for agents created before the hue picker shipped.
 */
export const DEFAULT_AGENT_HEX_COLOR = "#0BA6A6";

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
      hexColor: DEFAULT_AGENT_HEX_COLOR,
      ...(input.delegationHint ? { delegationHint: input.delegationHint } : {}),
    })
    .options({ returnValues: "NONE" })
    .send();

  // Best-effort default skill assignment. Failures (e.g. transient S3 outage)
  // shouldn't block agent creation — the user can assign manually later.
  for (const skillId of DEFAULT_SKILLS) {
    try {
      await assignSkill(ctx, id, skillId);
    } catch (err) {
      ctx.log.warn(
        { err, agentId: id, skillId, component: "createAgent" },
        "Failed to assign default skill",
      );
    }
  }

  return {
    id,
    name: input.name,
    personality: input.personality ?? "",
    avatar: "default",
    portraitId: "default",
    hexColor: DEFAULT_AGENT_HEX_COLOR,
    ...(input.delegationHint ? { delegationHint: input.delegationHint } : {}),
  };
}
