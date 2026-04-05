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
import {
  getSkillReferenceFromS3,
  getSkillTemplateFromS3,
  listSkillReferencesFromS3,
} from "./skillScanner/index.js";

const log = createLogger("skills:tools");

export interface SkillToolsResult {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  tools: Record<string, any>;
  /** Current skill env — call getEnv() to get the latest after a load/refresh */
  getEnv: () => Record<string, string>;
}

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

  tools.readSkill = tool({
    description:
      "Read a skill's instructions. Returns an overview of the skill and lists available references. To get detailed docs for a specific command, call readSkillReference with the reference name. Does NOT set up auth — call authenticate separately.",
    inputSchema: z.object({
      skillId: z.string().describe("The skill ID to read"),
    }),
    execute: async ({ skillId }) => {
      const agentSkill = agentSkills.find((s) => s.skillId === skillId);
      if (!agentSkill) {
        return { error: `Skill "${skillId}" is not assigned to this agent.` };
      }

      const template = await getSkillTemplateFromS3(bucketName, skillId);
      if (!template) {
        return { error: `Skill "${skillId}" not found.` };
      }

      const references = await listSkillReferencesFromS3(bucketName, skillId);

      log.info(
        { agentId, skillId, references },
        "readSkill: returning instructions",
      );

      const result: Record<string, unknown> = {
        instructions: template.instructions ?? "",
      };

      if (template.install) {
        result.install = template.install;
      }
      if (template.allowedCommands?.length) {
        result.allowedCommands = template.allowedCommands;
      }

      if (references.length > 0) {
        result.availableReferences = references;
        result.hint = references
          .map((r) => `readSkillReference("${skillId}", "${r}")`)
          .join("\n");
      }

      return result;
    },
  });

  tools.readSkillReference = tool({
    description:
      "Read detailed documentation for a specific skill command. Call readSkill first to see available references, then use this to load the one you need.",
    inputSchema: z.object({
      skillId: z.string().describe("The skill ID the reference belongs to"),
      reference: z
        .string()
        .describe('The reference name to read, e.g. "send", "triage", "read"'),
    }),
    execute: async ({ skillId, reference }) => {
      const agentSkill = agentSkills.find((s) => s.skillId === skillId);
      if (!agentSkill) {
        return { error: `Skill "${skillId}" is not assigned to this agent.` };
      }

      const content = await getSkillReferenceFromS3(
        bucketName,
        skillId,
        reference,
      );
      if (!content) {
        return {
          error: `Reference "${reference}" not found for skill "${skillId}".`,
        };
      }

      log.info(
        { agentId, skillId, reference },
        "readSkillReference: returning file",
      );

      return { content };
    },
  });

  tools.authenticate = tool({
    description:
      "Set up or refresh auth tokens for a skill. Call this after ensureSandbox and readSkill, right before your first runCommand. Tokens expire quickly so don't call this until the sandbox is ready. If you get auth errors, call this again to get fresh tokens.",
    inputSchema: z.object({
      skillId: z.string().describe("The skill ID to authenticate"),
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

      if (!template.connections?.length) {
        return { message: "This skill does not require authentication." };
      }

      const rawBindings = parseConnectionBindings(
        agentSkill.connectionBindings,
      );
      const bindings = await filterRevokedBindings(ctx.resources, rawBindings);

      // Check for missing required connections
      const missingProviders = template.connections
        .filter((c) => !c.optional && (bindings[c.provider] ?? []).length === 0)
        .map((c) => c.provider);

      if (missingProviders.length > 0) {
        const list = missingProviders.map((p) => `- ${p}`).join("\n");
        return {
          error: `This skill requires connected accounts that are not set up. Ask the user to connect the following in their settings:\n${list}`,
        };
      }

      const envDescriptions: string[] = [];
      let connectionLabel: string | undefined;

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

        let resolved: Record<string, string>;
        try {
          resolved = await resolveConnectionEnv(
            ctx.resources,
            connReq,
            connectionId,
          );
        } catch (err) {
          const message = (err as Error).message ?? String(err);
          return {
            error: `Authentication failed for connection "${connectionId}": ${message}`,
          };
        }

        const accounts = await loadActiveConnectionLabels(ctx.resources, [
          connectionId,
        ]);
        const label = accounts[0]?.label ?? connectionId;
        connectionLabel = label;

        if (Object.keys(resolved).length === 0) {
          return {
            error: `No credentials were returned for connection "${label}". The connection may be misconfigured.`,
          };
        }

        Object.assign(currentEnv, resolved);

        for (const envVar of Object.keys(resolved)) {
          envDescriptions.push(`${envVar} set for ${label}`);
        }

        log.info(
          {
            agentId,
            skillId,
            connectionId,
            resolvedEnvKeys: Object.keys(resolved),
          },
          "authenticate: resolved specific connection",
        );
      } else {
        // Resolve env using first available connection per provider
        const filteredBindingsRaw = JSON.stringify(bindings);
        const { env, missing, errors } = await resolveSkillEnv(
          ctx.resources,
          template,
          filteredBindingsRaw,
        );
        Object.assign(currentEnv, env);

        if (errors.length > 0) {
          return {
            error: `Authentication failed for skill "${skillId}":\n${errors.join("\n")}`,
          };
        }

        // Build env descriptions
        for (const connReq of template.connections) {
          const boundIds = bindings[connReq.provider] ?? [];
          if (boundIds.length === 0) continue;
          const accounts = await loadActiveConnectionLabels(ctx.resources, [
            boundIds[0],
          ]);
          const label = accounts[0]?.label ?? boundIds[0];
          connectionLabel ??= label;

          for (const envVar of Object.keys(connReq.env)) {
            if (env[envVar]) {
              envDescriptions.push(`${envVar} set for ${label}`);
            }
          }
        }

        if (missing.length > 0) {
          return {
            error: `Failed to resolve credentials for: ${missing.join(", ")}. No environment variables were set. Check that the connection is properly configured.`,
          };
        }

        log.info(
          {
            agentId,
            skillId,
            resolvedEnvKeys: Object.keys(env),
          },
          "authenticate: resolved default connections",
        );
      }

      return {
        envDescriptions,
        activeConnection: connectionId ?? "default (first available)",
        connectionLabel,
      };
    },
  });

  return { tools, getEnv: () => ({ ...currentEnv }) };
}
