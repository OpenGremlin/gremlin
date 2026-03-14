import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import {
  filterRevokedBindings,
  loadActiveConnectionLabels,
} from "./loadActiveConnections.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import { resolveConnectionEnv, resolveSkillEnv } from "./resolveSkillEnv.js";
import { getSkillTemplateFromS3 } from "./skillScanner.js";

const log = createLogger("skills:tools");

export interface SkillToolsResult {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  tools: Record<string, any>;
  /** Current skill env — call getEnv() to get the latest after a load/refresh */
  getEnv: () => Record<string, string>;
}

/**
 * Build loadSkill and refreshSkillAuth tools for the agent.
 * Env is resolved lazily when the agent calls loadSkill.
 */
export async function buildSkillTools(
  ctx: ServiceContext,
  agentId: string,
  _taskId: string,
): Promise<SkillToolsResult> {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  const tools: Record<string, any> = {};
  const currentEnv: Record<string, string> = {};

  const agentSkills = await getAgentSkills(ctx, agentId);
  if (agentSkills.length === 0) {
    return { tools, getEnv: () => currentEnv };
  }

  const bucketName = getSkillsBucket();

  tools.loadSkill = tool({
    description:
      "Load a skill to get its usage/install instructions and set up auth env vars. Must be called before using any skill via runCommand.",
    inputSchema: z.object({
      skillId: z.string().describe("The skill ID to load"),
      connectionId: z
        .string()
        .optional()
        .describe(
          "Specific connection ID to use. If omitted, the first available connection is used.",
        ),
    }),
    execute: async ({ skillId, connectionId }) => {
      const agentSkill = agentSkills.find((s) => s.skillId === skillId);
      if (!agentSkill) {
        return { error: `Skill "${skillId}" is not assigned to this agent.` };
      }

      const template = await getSkillTemplateFromS3(bucketName, skillId);
      if (!template) {
        return { error: `Skill "${skillId}" not found.` };
      }

      const rawBindings = parseConnectionBindings(
        agentSkill.connectionBindings,
      );
      const bindings = await filterRevokedBindings(ctx.resources, rawBindings);

      const envDescriptions: string[] = [];

      if (template.connections?.length) {
        // Check for missing required connections before resolving
        const missingProviders = template.connections
          .filter(
            (c) => !c.optional && (bindings[c.provider] ?? []).length === 0,
          )
          .map((c) => c.provider);

        if (missingProviders.length > 0) {
          const list = missingProviders.map((p) => `- ${p}`).join("\n");
          return {
            error: `This skill requires connected accounts that are not set up. Ask the user to connect the following in their settings:\n${list}`,
          };
        }

        if (connectionId) {
          // Resolve env for a specific connection
          const connReq = template.connections.find((c) => {
            const boundIds = bindings[c.provider] ?? [];
            return boundIds.includes(connectionId);
          });

          if (!connReq) {
            return {
              error: `Connection "${connectionId}" not found or not bound to skill "${skillId}".`,
            };
          }

          const resolved = await resolveConnectionEnv(
            ctx.resources,
            connReq,
            connectionId,
          );
          Object.assign(currentEnv, resolved);

          const accounts = await loadActiveConnectionLabels(ctx.resources, [
            connectionId,
          ]);
          const label = accounts[0]?.label ?? connectionId;

          for (const envVar of Object.keys(resolved)) {
            envDescriptions.push(`${envVar} has been set for ${label}`);
          }

          log.info(
            {
              agentId,
              skillId,
              connectionId,
              resolvedEnvKeys: Object.keys(resolved),
            },
            "loadSkill: resolved specific connection",
          );
        } else {
          // Resolve env using first available connection per provider
          const filteredBindingsRaw = JSON.stringify(bindings);
          const { env, missing } = await resolveSkillEnv(
            ctx.resources,
            template,
            filteredBindingsRaw,
          );
          Object.assign(currentEnv, env);

          // Build env descriptions
          for (const connReq of template.connections) {
            const boundIds = bindings[connReq.provider] ?? [];
            if (boundIds.length === 0) continue;
            const accounts = await loadActiveConnectionLabels(ctx.resources, [
              boundIds[0],
            ]);
            const label = accounts[0]?.label ?? boundIds[0];

            for (const envVar of Object.keys(connReq.env)) {
              if (env[envVar]) {
                envDescriptions.push(`${envVar} has been set for ${label}`);
              }
            }
          }

          log.info(
            {
              agentId,
              skillId,
              resolvedEnvKeys: Object.keys(env),
              missingProviders: missing,
            },
            "loadSkill: resolved default connections",
          );
        }
      }

      return {
        instructions: template.instructions ?? "",
        envDescriptions,
        activeConnection: connectionId ?? "default (first available)",
      };
    },
  });

  tools.refreshSkillAuth = tool({
    description:
      "Re-resolve auth tokens for a skill. Call this if you get auth errors while using a skill.",
    inputSchema: z.object({
      skillId: z.string().describe("The skill ID to refresh auth for"),
      connectionId: z.string().describe("The connection ID to refresh"),
    }),
    execute: async ({ skillId, connectionId }) => {
      const agentSkill = agentSkills.find((s) => s.skillId === skillId);
      if (!agentSkill) {
        return { error: `Skill "${skillId}" is not assigned to this agent.` };
      }

      const template = await getSkillTemplateFromS3(bucketName, skillId);
      if (!template) {
        return { error: `Skill "${skillId}" not found.` };
      }

      if (!template.connections?.length) {
        return { error: `Skill "${skillId}" has no connections to refresh.` };
      }

      const rawBindings = parseConnectionBindings(
        agentSkill.connectionBindings,
      );
      const bindings = await filterRevokedBindings(ctx.resources, rawBindings);

      const connReq = template.connections.find((c) => {
        const boundIds = bindings[c.provider] ?? [];
        return boundIds.includes(connectionId);
      });

      if (!connReq) {
        return {
          error: `Connection "${connectionId}" not found or not bound to skill "${skillId}".`,
        };
      }

      const resolved = await resolveConnectionEnv(
        ctx.resources,
        connReq,
        connectionId,
      );
      Object.assign(currentEnv, resolved);

      const accounts = await loadActiveConnectionLabels(ctx.resources, [
        connectionId,
      ]);
      const label = accounts[0]?.label ?? connectionId;

      const refreshedVars: string[] = [];
      for (const envVar of Object.keys(resolved)) {
        refreshedVars.push(`${envVar} has been refreshed for ${label}`);
      }

      log.info(
        { agentId, skillId, connectionId, refreshedVars },
        "refreshSkillAuth: tokens refreshed",
      );

      return { refreshedVars };
    },
  });

  return { tools, getEnv: () => ({ ...currentEnv }) };
}
