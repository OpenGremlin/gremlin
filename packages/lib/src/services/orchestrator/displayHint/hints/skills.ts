import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

const readSkill: HintBuilder = (input) => ({
  text: `Reading skill: ${(input?.skillId as string) ?? "skill"}`,
});

const readSkillReference: HintBuilder = (input) => ({
  text: `Reading reference: ${(input?.reference as string) ?? "unknown"}`,
});

const authenticate: HintBuilder = (input, result) => {
  const skillId = (input?.skillId as string) ?? "skill";
  const connLabel = result?.connectionLabel as string | undefined;
  return {
    text: `Authenticating ${skillId}${connLabel ? ` (${connLabel})` : ""}`,
  };
};

export const skillsHints: Record<string, HintBuilder> = {
  [ToolName.ReadSkill]: readSkill,
  [ToolName.ReadSkillReference]: readSkillReference,
  [ToolName.Authenticate]: authenticate,
};
