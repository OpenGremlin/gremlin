import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import {
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../../tools/toolResult.js";
import { getSkillReferenceFromS3 } from "../skillScanner/index.js";
import type { AgentSkills } from "./types.js";

export function readSkillReference(
  ctx: ServiceContext,
  agentId: string,
  agentSkills: AgentSkills,
  bucketName: string | null,
) {
  return tool({
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

        ctx.log.info(
          { agentId, skillId, reference, component: "skills:tools" },
          "readSkillReference: returning file",
        );

        return toolOk({ content });
      },
    ),
  });
}
