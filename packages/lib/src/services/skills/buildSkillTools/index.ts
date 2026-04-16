import type { ServiceContext } from "../../context.js";
import { getAgentSkills } from "../getAgentSkills.js";
import { getSkillsBucket } from "../getSkillsBucket.js";
import { authenticate } from "./authenticate.js";
import { readSkill } from "./readSkill.js";
import { readSkillReference } from "./readSkillReference.js";
import type { SkillToolsResult } from "./types.js";

export type { SkillToolsResult } from "./types.js";

/**
 * Build readSkill, readSkillReference, and authenticate tools for the agent.
 * readSkill returns instructions + available references.
 * readSkillReference returns detailed docs for a specific command.
 * authenticate resolves auth tokens (idempotent — also serves as refresh).
 */
export async function buildSkillTools(
  ctx: ServiceContext,
  agentId: string,
): Promise<SkillToolsResult> {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  const tools: Record<string, any> = {};
  const currentEnv: Record<string, string> = {};

  const agentSkills = await getAgentSkills(ctx, agentId);
  if (agentSkills.length === 0) {
    return { tools, getEnv: () => currentEnv };
  }

  const bucketName = getSkillsBucket();

  tools.readSkill = readSkill(ctx, agentId, agentSkills, bucketName);
  tools.readSkillReference = readSkillReference(
    ctx,
    agentId,
    agentSkills,
    bucketName,
  );
  tools.authenticate = authenticate(
    ctx,
    agentId,
    agentSkills,
    bucketName,
    currentEnv,
  );

  return { tools, getEnv: () => ({ ...currentEnv }) };
}
