import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { skillResolvers } from "./resolvers.js";

describe("Skill resolvers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skillTemplates reads the bucket then scans the catalog", async () => {
    const templates = [{ id: "sk-1", name: "GitHub" }];
    const ctx = buildTestContext();
    ctx.services.skills.getSkillsBucket = vi
      .fn()
      .mockReturnValue("skill-bucket");
    ctx.services.skills.scanSkillCatalog = vi.fn().mockResolvedValue(templates);

    const result = await invokeResolver(skillResolvers.Query.skillTemplates, {
      ctx,
    });

    expect(result).toBe(templates);
    expect(ctx.services.skills.scanSkillCatalog).toHaveBeenCalledWith(
      "skill-bucket",
    );
  });

  it("agentSkills delegates agentId to the service", async () => {
    const skills = [{ skillId: "sk-1", agentId: "a-1" }];
    const ctx = buildTestContext();
    ctx.services.skills.getAgentSkills = vi.fn().mockResolvedValue(skills);

    const result = await invokeResolver(skillResolvers.Query.agentSkills, {
      args: { agentId: "a-1" },
      ctx,
    });

    expect(result).toBe(skills);
    expect(ctx.services.skills.getAgentSkills).toHaveBeenCalledWith(ctx, "a-1");
  });

  it("assignSkill forwards agentId + skillId", async () => {
    const assigned = { agentId: "a-1", skillId: "sk-1" };
    const ctx = buildTestContext();
    ctx.services.skills.assignSkill = vi.fn().mockResolvedValue(assigned);

    const result = await invokeResolver(skillResolvers.Mutation.assignSkill, {
      args: { agentId: "a-1", skillId: "sk-1" },
      ctx,
    });

    expect(result).toBe(assigned);
    expect(ctx.services.skills.assignSkill).toHaveBeenCalledWith(
      ctx,
      "a-1",
      "sk-1",
    );
  });

  it("removeSkill fetches existing skills, removes, and returns the removed one", async () => {
    const existing = [
      { skillId: "sk-1", agentId: "a-1" },
      { skillId: "sk-2", agentId: "a-1" },
    ];
    const ctx = buildTestContext();
    ctx.services.skills.getAgentSkills = vi.fn().mockResolvedValue(existing);
    ctx.services.skills.removeSkill = vi.fn().mockResolvedValue(undefined);

    const result = await invokeResolver(skillResolvers.Mutation.removeSkill, {
      args: { agentId: "a-1", skillId: "sk-1" },
      ctx,
    });

    expect(result).toEqual({ skillId: "sk-1", agentId: "a-1" });
    expect(ctx.services.skills.removeSkill).toHaveBeenCalledWith(
      ctx,
      "a-1",
      "sk-1",
    );
  });
});
