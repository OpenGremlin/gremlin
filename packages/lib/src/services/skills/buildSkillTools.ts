import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import {
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../tools/toolResult.js";
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
    execute: wrapExecute("readSkill", async ({ skillId }) => {
      const agentSkill = agentSkills.find((s) => s.skillId === skillId);
      if (!agentSkill) {
        return toolErr(
          ToolErrorCode.Unauthorized,
          `Skill "${skillId}" is not assigned to this agent.`,
          "Ask the user to assign this skill in settings, or pick a skill that has been assigned to you.",
        );
      }

      const template = await getSkillTemplateFromS3(bucketName, skillId);
      if (!template) {
        return toolErr(
          ToolErrorCode.NotFound,
          `Skill "${skillId}" not found.`,
          "Double-check the skill ID. Only skills assigned to you are available.",
        );
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

      return toolOk(result);
    }),
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
    execute: wrapExecute(
      "readSkillReference",
      async ({ skillId, reference }) => {
        const agentSkill = agentSkills.find((s) => s.skillId === skillId);
        if (!agentSkill) {
          return toolErr(
            ToolErrorCode.Unauthorized,
            `Skill "${skillId}" is not assigned to this agent.`,
            "Ask the user to assign this skill in settings, or pick a skill that has been assigned to you.",
          );
        }

        const content = await getSkillReferenceFromS3(
          bucketName,
          skillId,
          reference,
        );
        if (!content) {
          return toolErr(
            ToolErrorCode.NotFound,
            `Reference "${reference}" not found for skill "${skillId}".`,
            "Call `readSkill` to see the list of available references for this skill.",
          );
        }

        log.info(
          { agentId, skillId, reference },
          "readSkillReference: returning file",
        );

        return toolOk({ content });
      },
    ),
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
    execute: wrapExecute<
      { skillId: string; connectionId?: string },
      | { message: string }
      | {
          envDescriptions: string[];
          activeConnection: string;
          connectionLabel: string | undefined;
        }
    >("authenticate", async ({ skillId, connectionId }) => {
      const agentSkill = agentSkills.find((s) => s.skillId === skillId);
      if (!agentSkill) {
        return toolErr(
          ToolErrorCode.Unauthorized,
          `Skill "${skillId}" is not assigned to this agent.`,
          "Ask the user to assign this skill in settings, or pick a skill that has been assigned to you.",
        );
      }

      const template = await getSkillTemplateFromS3(bucketName, skillId);
      if (!template) {
        return toolErr(
          ToolErrorCode.NotFound,
          `Skill "${skillId}" not found.`,
          "Double-check the skill ID. Only skills assigned to you are available.",
        );
      }

      if (!template.connections?.length) {
        return toolOk({
          message: "This skill does not require authentication.",
        });
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
        return toolErr(
          ToolErrorCode.ConfigMissing,
          `This skill requires connected accounts that are not set up:\n${list}`,
          "Ask the user to connect these providers in their settings, then call `authenticate` again.",
        );
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
          return toolErr(
            ToolErrorCode.NotFound,
            `Connection "${connectionId}" not found or not bound to skill "${skillId}".`,
            "Omit `connectionId` to use the default connection, or verify the ID with `listConnections`.",
          );
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
          return toolErr(
            ToolErrorCode.UpstreamError,
            `Authentication failed for connection "${connectionId}": ${message}`,
            "The connection provider may be down or the credentials may be invalid. Ask the user to reconnect the account in settings.",
          );
        }

        const accounts = await loadActiveConnectionLabels(ctx.resources, [
          connectionId,
        ]);
        const label = accounts[0]?.label ?? connectionId;
        connectionLabel = label;

        if (Object.keys(resolved).length === 0) {
          return toolErr(
            ToolErrorCode.ConfigMissing,
            `No credentials were returned for connection "${label}". The connection may be misconfigured.`,
            "Ask the user to reconnect the account in settings, then call `authenticate` again.",
          );
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
          return toolErr(
            ToolErrorCode.UpstreamError,
            `Authentication failed for skill "${skillId}":\n${errors.join("\n")}`,
            "One or more connection providers rejected the credentials. Ask the user to reconnect affected accounts, then call `authenticate` again.",
          );
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
          return toolErr(
            ToolErrorCode.ConfigMissing,
            `Failed to resolve credentials for: ${missing.join(", ")}. No environment variables were set.`,
            "Check that the connection is properly configured. Ask the user to reconnect these providers in settings.",
          );
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

      return toolOk({
        envDescriptions,
        activeConnection: connectionId ?? "default (first available)",
        connectionLabel,
      });
    }),
  });

  return { tools, getEnv: () => ({ ...currentEnv }) };
}
