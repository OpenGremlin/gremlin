import type { ServiceContext } from "../../../context.js";
import { buildSkillSummary } from "../../../skills/buildSkillSummary.js";
import type { SkillToolsResult } from "../../../skills/buildSkillTools/index.js";
import { buildSkillTools } from "../../../skills/buildSkillTools/index.js";
import { loadAgentContext } from "../../loadAgentContext.js";
import {
  getImageModelFromConfig,
  getSpeechConnectionId,
  getSpeechModelFromConfig,
} from "../../model/index.js";
import type { AgentLaneContext } from "../types.js";
import { loadActiveDelegations } from "./loadActiveDelegations.js";
import { loadTeamRoster } from "./loadTeamRoster.js";
import { resolveModelCapabilities } from "./resolveModelCapabilities.js";

/**
 * Build the per-agent context. Call once per drain loop (or once in a CLI
 * script) and pass into every lane function.
 */
export async function buildAgentLaneContext(
  ctx: ServiceContext,
  agentId: string,
): Promise<AgentLaneContext> {
  const { agent, profile, displayName, timezone } = await loadAgentContext(
    ctx,
    agentId,
  );

  // Skills require the sandbox (every current skill ships `install` /
  // `allowedCommands`). Without sandbox tools the model would see skill
  // instructions telling it to run shell commands it can't actually call
  // and get stuck. Suppress both the tools and the preamble when sandbox
  // is off — revisit if/when non-sandbox skills exist.
  const sandboxEnabled = !!agent.config?.sandbox?.enabled;

  const [
    skillSummary,
    skillTools,
    modelCapabilities,
    imageModel,
    speechModel,
    speechConnectionId,
  ] = await Promise.all([
    sandboxEnabled
      ? buildSkillSummary(ctx, agentId).catch((err) => {
          ctx.log.error(
            { err, component: "skills" },
            "Failed to build skill summary",
          );
          return { promptSection: "", mainLaneSection: "" };
        })
      : Promise.resolve({ promptSection: "", mainLaneSection: "" }),
    sandboxEnabled
      ? buildSkillTools(ctx, agentId).catch((err) => {
          ctx.log.error(
            { err, component: "skills" },
            "Failed to build skill tools",
          );
          return { tools: {}, getEnv: () => ({}) } as SkillToolsResult;
        })
      : Promise.resolve<SkillToolsResult>({ tools: {}, getEnv: () => ({}) }),
    resolveModelCapabilities(ctx, agent.config?.model),
    agent.config?.imageGeneration?.enabled
      ? getImageModelFromConfig(ctx, agent.config?.imageModel).catch((err) => {
          ctx.log.warn(
            { err, component: "imageModel" },
            "Failed to resolve image model",
          );
          return null;
        })
      : Promise.resolve(null),
    agent.config?.speech?.enabled
      ? getSpeechModelFromConfig(ctx, agent.config?.speechModel).catch(
          (err) => {
            ctx.log.warn(
              { err, component: "speechModel" },
              "Failed to resolve speech model",
            );
            return null;
          },
        )
      : Promise.resolve(null),
    agent.config?.speech?.enabled
      ? getSpeechConnectionId(ctx, agent.config?.speechModel).catch(() => null)
      : Promise.resolve(null),
  ]);

  const teamIds = agent.config?.manager?.enabled
    ? (agent.config.manager.team ?? [])
    : [];
  const team = await loadTeamRoster(ctx, agentId, teamIds);
  const activeDelegations = await loadActiveDelegations(ctx, agentId, team);

  return {
    agentId,
    agent,
    profile,
    displayName,
    timezone,
    skillSummary,
    skillTools,
    modelSupportsImages: modelCapabilities.supportsImages,
    modelSupportsReasoning: modelCapabilities.supportsReasoning,
    imageModel,
    speechModel,
    speechVoice: agent.config?.speech?.voice ?? agent.ttsVoice,
    speechConnectionId: speechConnectionId ?? undefined,
    team,
    activeDelegations,
  };
}
