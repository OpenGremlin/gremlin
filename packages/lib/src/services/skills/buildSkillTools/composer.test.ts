import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../__testing__/mockContext.js";
import type { ServiceContext } from "../../context.js";

vi.mock("../getAgentSkills.js", () => ({
  getAgentSkills: vi.fn(),
}));
vi.mock("../getSkillsBucket.js", () => ({
  getSkillsBucket: vi.fn(() => "test-bucket"),
}));

import { getAgentSkills } from "../getAgentSkills.js";
import { buildSkillTools } from "./index.js";

const mockGetAgentSkills = vi.mocked(getAgentSkills);

describe("buildSkillTools composer", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("returns an empty tool set when the agent has no skills", async () => {
    mockGetAgentSkills.mockResolvedValue([]);
    const result = await buildSkillTools(ctx, "agent-1");
    expect(result.tools).toEqual({});
    expect(result.getEnv()).toEqual({});
  });

  it("exposes readSkill, readSkillReference, and authenticate when the agent has at least one skill", async () => {
    mockGetAgentSkills.mockResolvedValue([
      { skillId: "slack", connectionBindings: "{}" } as any,
    ]);

    const result = await buildSkillTools(ctx, "agent-1");

    expect(Object.keys(result.tools).sort()).toEqual([
      "authenticate",
      "readSkill",
      "readSkillReference",
    ]);
  });

  it("getEnv() returns a copy so callers can't mutate the backing registry", async () => {
    mockGetAgentSkills.mockResolvedValue([
      { skillId: "slack", connectionBindings: "{}" } as any,
    ]);
    const result = await buildSkillTools(ctx, "agent-1");

    const snapshot = result.getEnv();
    (snapshot as Record<string, string>).EVIL = "tampered";
    expect(result.getEnv()).toEqual({});
  });
});
