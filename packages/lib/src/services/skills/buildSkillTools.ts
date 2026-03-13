import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { Resources } from "../../resources/index.js";
import type { ServiceContext } from "../context.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import { resolveConnectionEnv, resolveSkillEnv } from "./resolveSkillEnv.js";
import { getSkillTemplateFromS3 } from "./skillScanner.js";

const log = createLogger("skills:tools");

export interface SkillToolsResult {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  tools: Record<string, any>;
  /** Current skill env — call getEnv() to get the latest after a switch */
  getEnv: () => Record<string, string>;
}

/**
 * Build switch-connection tools for agents with multi-connection skills.
 * Also resolves the initial env for all skills.
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

  for (const agentSkill of agentSkills) {
    const template = await getSkillTemplateFromS3(
      bucketName,
      agentSkill.skillId,
    );
    if (!template?.connections?.length) continue;

    const bindings = parseConnectionBindings(agentSkill.connectionBindings);

    // Resolve initial env (using first connection per provider)
    const { env: initialEnv } = await resolveSkillEnv(
      ctx.resources,
      template,
      agentSkill.connectionBindings,
    );
    Object.assign(currentEnv, initialEnv);

    // Create switch tools for multi-connection providers with 2+ connections
    for (const connReq of template.connections) {
      if (!connReq.multi) continue;

      const boundIds = bindings[connReq.provider] ?? [];
      if (boundIds.length < 2) continue;

      const toolName = `switch_${agentSkill.skillId}_${connReq.provider}`;

      // Load connection accounts for the tool description
      const accounts = await loadConnectionLabels(
        ctx.resources,
        boundIds,
      );

      const accountList = accounts
        .map((d) => `- ${d.id}: ${d.label}`)
        .join("\n");

      tools[toolName] = tool({
        description: `Switch which ${connReq.provider} account to use for the ${template.name} skill. Available accounts:\n${accountList}`,
        inputSchema: z.object({
          connectionId: z
            .enum(boundIds as [string, ...string[]])
            .describe("The connection ID to switch to"),
        }),
        execute: async ({ connectionId }) => {
          log.info(
            {
              agentId,
              skillId: agentSkill.skillId,
              provider: connReq.provider,
              connectionId,
            },
            "Agent switching connection",
          );

          const resolved = await resolveConnectionEnv(
            ctx.resources,
            connReq,
            connectionId,
          );
          Object.assign(currentEnv, resolved);

          const desc = accounts.find((d) => d.id === connectionId);
          return {
            status: "switched",
            message: `Now using ${desc?.label ?? connectionId} for ${template.name}.`,
          };
        },
      });
    }
  }

  return { tools, getEnv: () => ({ ...currentEnv }) };
}

async function loadConnectionLabels(
  resources: Resources,
  connectionIds: string[],
): Promise<Array<{ id: string; label: string }>> {
  const { QueryCommand } = await import("dynamodb-toolbox/table/actions/query");
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  type ConnItem = {
    id: string;
    connectionMeta?: { accountId?: string };
  };
  const connMap = new Map((Items as ConnItem[]).map((c) => [c.id, c]));

  return connectionIds.map((id) => {
    const conn = connMap.get(id);
    const accountId = conn?.connectionMeta?.accountId;
    return {
      id,
      label: accountId && accountId !== "unknown" ? accountId : id,
    };
  });
}
