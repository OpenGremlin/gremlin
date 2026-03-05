import type { ServiceContext } from "../context.js";
import type { SkillDef } from "./registry.js";
import { resolveSkillEnv } from "./resolveSkillEnv.js";
import { getSkillDef } from "./skillCatalog.js";

interface McpServerStdioConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface McpServerRemoteConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface McpConfigResult {
  mcpServers: Record<string, McpServerStdioConfig | McpServerRemoteConfig>;
  warnings: Array<{ skillId: string; missingProviders: string[] }>;
  skillInstructions: string[];
}

/**
 * Build MCP configuration from all installed skills.
 * Returns server configs, warnings for missing connections, and
 * concatenated skill instructions for the system prompt.
 */
export async function buildMcpConfig(
  ctx: ServiceContext,
): Promise<McpConfigResult> {
  const allSkills = await ctx.services.skills.getSkills(ctx);
  const installedSkills = allSkills.filter((s) => s.installed);

  const mcpServers: McpConfigResult["mcpServers"] = {};
  const warnings: McpConfigResult["warnings"] = [];
  const skillInstructions: string[] = [];

  for (const skillItem of installedSkills) {
    const skillDef = getSkillDef(skillItem.id);
    if (!skillDef) continue;

    // Collect instructions regardless of MCP
    if (skillDef.instructions) {
      skillInstructions.push(
        `## ${skillDef.name} Skill\n${skillDef.instructions}`,
      );
    }

    // Skip MCP config if skill has no MCP or MCP is disabled
    if (!skillDef.mcp || skillItem.mcpEnabled === false) continue;

    const { env, missing } = await resolveSkillEnv(
      ctx.resources,
      skillDef,
      skillItem,
    );

    if (missing.length > 0) {
      warnings.push({ skillId: skillItem.id, missingProviders: missing });
      continue;
    }

    const transport = skillDef.mcp.transport;
    if (transport.type === "stdio") {
      mcpServers[skillItem.id] = {
        command: transport.command,
        args: transport.args,
        env,
      };
    } else {
      mcpServers[skillItem.id] = {
        url: transport.url,
        headers: transport.headers,
      };
    }
  }

  return { mcpServers, warnings, skillInstructions };
}
