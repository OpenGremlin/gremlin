import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { AgentSkillItem } from "../../resources/ddb/schema/agentSkill.js";
import type { ServiceContext } from "../context.js";
import { createAllowlistStore } from "../shellGuard/allowlistStore.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { getSkillTemplateFromS3 } from "./skillScanner.js";

/**
 * Assign a skill to an agent with optional connection bindings.
 * Also adds the skill's allowedCommands to the agent's shell guard allowlist.
 */
export async function assignSkill(
  ctx: ServiceContext,
  agentId: string,
  skillId: string,
  connectionBindings?: Record<string, string>,
): Promise<AgentSkillItem> {
  const item: AgentSkillItem = {
    agentId,
    skillId,
    connectionBindings: connectionBindings
      ? JSON.stringify(connectionBindings)
      : null,
    assignedAt: new Date().toISOString(),
  };

  await ctx.resources.ddb.entities.AgentSkill.build(PutItemCommand)
    .item(item)
    .send();

  // Add skill's allowedCommands to the agent's shell guard allowlist
  const template = await getSkillTemplateFromS3(getSkillsBucket(), skillId);
  if (template?.allowedCommands?.length) {
    const store = createAllowlistStore(ctx);
    await Promise.all(
      template.allowedCommands.map((pattern) =>
        store.addEntry(agentId, { pattern }),
      ),
    );
  }

  return item;
}
