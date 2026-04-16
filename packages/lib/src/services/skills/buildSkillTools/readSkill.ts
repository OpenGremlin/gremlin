import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import {
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../../tools/toolResult.js";
import {
  getSkillTemplateFromS3,
  listSkillReferencesFromS3,
} from "../skillScanner/index.js";
import type { AgentSkills } from "./types.js";

export function readSkill(
  ctx: ServiceContext,
  agentId: string,
  agentSkills: AgentSkills,
  bucketName: string | null,
) {
  return tool({
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

      ctx.log.info(
        { agentId, skillId, references, component: "skills:tools" },
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
}
