import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import {
  _clearTeamCache,
  type AgentLaneContext,
  buildAgentLaneContext,
  buildTaskTools,
} from "./agentLaneContext.js";

// ---------------------------------------------------------------------------
// Mock the dependencies so we can control what loadAgentContext / buildSkill*
// return without hitting DynamoDB or S3.
// ---------------------------------------------------------------------------
vi.mock("./loadAgentContext.js", () => ({
  loadAgentContext: vi.fn(),
}));
vi.mock("../skills/buildSkillSummary.js", () => ({
  buildSkillSummary: vi.fn(),
}));
vi.mock("../skills/buildSkillTools.js", () => ({
  buildSkillTools: vi.fn(),
}));

import { buildSkillSummary } from "../skills/buildSkillSummary.js";
import { buildSkillTools } from "../skills/buildSkillTools.js";
// Grab the mocked functions so we can set return values per test.
import { loadAgentContext } from "./loadAgentContext.js";

const mockLoadAgentContext = vi.mocked(loadAgentContext);
const mockBuildSkillSummary = vi.mocked(buildSkillSummary);
const mockBuildSkillTools = vi.mocked(buildSkillTools);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: "agent-1",
    name: "TestBot",
    personality: "helpful assistant",
    avatar: "default",
    portraitId: "default",
    config: null,
    ...overrides,
  };
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    displayName: "Alice",
    about: "a developer",
    timezone: "America/New_York",
    ...overrides,
  };
}

function makeAgentLaneCtx(
  overrides: Partial<AgentLaneContext> = {},
): AgentLaneContext {
  return {
    agent: makeAgent() as any,
    profile: makeProfile() as any,
    displayName: "Alice",
    timezone: "America/New_York",
    skillSummary: { promptSection: "", mainLaneSection: "" },
    skillTools: { tools: {}, getEnv: () => ({}) },
    modelSupportsImages: true,
    modelSupportsReasoning: false,
    imageModel: null,
    speechModel: null,
    speechVoice: undefined,
    speechConnectionId: undefined,
    team: [],
    activeDelegations: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("buildAgentLaneContext", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
  });

  it("returns agent, profile, displayName, timezone from loadAgentContext", async () => {
    const agent = makeAgent();
    const profile = makeProfile();
    mockLoadAgentContext.mockResolvedValue({
      agent: agent as any,
      profile: profile as any,
      displayName: "Alice",
      timezone: "America/New_York",
    });
    mockBuildSkillSummary.mockResolvedValue({
      promptSection: "skill info",
      mainLaneSection: "",
    });
    mockBuildSkillTools.mockResolvedValue({
      tools: { readSkill: {} as any },
      getEnv: () => ({}),
    });

    const result = await buildAgentLaneContext(ctx, "agent-1");

    expect(result.agent).toEqual(agent);
    expect(result.profile).toEqual(profile);
    expect(result.displayName).toBe("Alice");
    expect(result.timezone).toBe("America/New_York");
  });

  it("includes skillSummary and skillTools in the result", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: makeAgent() as any,
      profile: makeProfile() as any,
      displayName: "Alice",
      timezone: undefined,
    });
    mockBuildSkillSummary.mockResolvedValue({
      promptSection: "## Skills\nDo stuff",
      mainLaneSection: "",
    });
    const getEnv = () => ({ TOKEN: "abc" });
    mockBuildSkillTools.mockResolvedValue({
      tools: { readSkill: {} as any },
      getEnv,
    });

    const result = await buildAgentLaneContext(ctx, "agent-1");

    expect(result.skillSummary.promptSection).toBe("## Skills\nDo stuff");
    expect(result.skillTools.tools).toHaveProperty("readSkill");
    expect(result.skillTools.getEnv()).toEqual({ TOKEN: "abc" });
  });

  it("fetches skills in parallel with loadAgentContext", async () => {
    const callOrder: string[] = [];

    mockLoadAgentContext.mockImplementation(async () => {
      callOrder.push("loadAgentContext");
      return {
        agent: makeAgent() as any,
        profile: null,
        displayName: "the user",
        timezone: undefined,
      };
    });
    mockBuildSkillSummary.mockImplementation(async () => {
      callOrder.push("buildSkillSummary");
      return { promptSection: "", mainLaneSection: "" };
    });
    mockBuildSkillTools.mockImplementation(async () => {
      callOrder.push("buildSkillTools");
      return { tools: {}, getEnv: () => ({}) };
    });

    await buildAgentLaneContext(ctx, "agent-1");

    // loadAgentContext must resolve before skills are called (they need agentId
    // which is passed in, but the skills calls wait on the agent context)
    expect(mockLoadAgentContext).toHaveBeenCalledOnce();
    expect(mockBuildSkillSummary).toHaveBeenCalledOnce();
    expect(mockBuildSkillTools).toHaveBeenCalledOnce();
  });

  it("gracefully handles buildSkillSummary failure", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: makeAgent() as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    mockBuildSkillSummary.mockRejectedValue(new Error("S3 down"));
    mockBuildSkillTools.mockResolvedValue({
      tools: {},
      getEnv: () => ({}),
    });

    const result = await buildAgentLaneContext(ctx, "agent-1");

    expect(result.skillSummary.promptSection).toBe("");
    expect(ctx.log.error).toHaveBeenCalled();
  });

  it("gracefully handles buildSkillTools failure", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: makeAgent() as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    mockBuildSkillSummary.mockResolvedValue({
      promptSection: "",
      mainLaneSection: "",
    });
    mockBuildSkillTools.mockRejectedValue(new Error("S3 down"));

    const result = await buildAgentLaneContext(ctx, "agent-1");

    expect(result.skillTools.tools).toEqual({});
    expect(result.skillTools.getEnv()).toEqual({});
    expect(ctx.log.error).toHaveBeenCalled();
  });

  it("propagates loadAgentContext errors (agent not found)", async () => {
    mockLoadAgentContext.mockRejectedValue(new Error("Agent bad-id not found"));

    await expect(buildAgentLaneContext(ctx, "bad-id")).rejects.toThrow(
      "Agent bad-id not found",
    );
  });
});

// ---------------------------------------------------------------------------
// Manager-mode roster + active delegations
// ---------------------------------------------------------------------------
describe("buildAgentLaneContext — manager mode", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  function managerAgent(team: string[]) {
    return makeAgent({
      id: "manager",
      config: { manager: { enabled: true, team } },
    });
  }

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    _clearTeamCache();

    mockBuildSkillSummary.mockResolvedValue({
      promptSection: "",
      mainLaneSection: "",
    });
    mockBuildSkillTools.mockResolvedValue({ tools: {}, getEnv: () => ({}) });

    // No tasks / skills by default — individual tests override.
    ctx.services.tasks.getTasksByAgent.mockResolvedValue([]);
    ctx.services.skills.buildSkillBlurb.mockResolvedValue("");
  });

  it("returns empty team for non-manager agents", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: makeAgent() as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });

    const result = await buildAgentLaneContext(ctx, "agent-1");

    expect(result.team).toEqual([]);
    expect(result.activeDelegations).toEqual([]);
    expect(ctx.services.agents.getAgent).not.toHaveBeenCalled();
  });

  it("loads team members in parallel and projects them to TeamMember shape", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["researcher", "writer"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent
      .mockResolvedValueOnce({
        id: "researcher",
        name: "Researcher",
        delegationHint: "Web research",
        role: "investigator",
        retired: false,
      } as any)
      .mockResolvedValueOnce({
        id: "writer",
        name: "Writer",
        delegationHint: "Drafts briefs",
        retired: false,
      } as any);
    ctx.services.skills.buildSkillBlurb
      .mockResolvedValueOnce("brave-search, linear (Eng)")
      .mockResolvedValueOnce("");

    const result = await buildAgentLaneContext(ctx, "manager");

    expect(result.team).toEqual([
      {
        id: "researcher",
        name: "Researcher",
        delegationHint: "Web research",
        role: "investigator",
        skillBlurb: "brave-search, linear (Eng)",
      },
      {
        id: "writer",
        name: "Writer",
        delegationHint: "Drafts briefs",
        role: undefined,
        skillBlurb: "",
      },
    ]);
    expect(ctx.services.agents.getAgent).toHaveBeenCalledTimes(2);
    expect(ctx.services.skills.buildSkillBlurb).toHaveBeenCalledTimes(2);
  });

  it("tolerates buildSkillBlurb failures per member", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["a"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent.mockResolvedValue({
      id: "a",
      name: "A",
      retired: false,
    } as any);
    ctx.services.skills.buildSkillBlurb.mockRejectedValue(
      new Error("S3 outage"),
    );

    const result = await buildAgentLaneContext(ctx, "manager");

    expect(result.team).toEqual([
      {
        id: "a",
        name: "A",
        delegationHint: undefined,
        role: undefined,
        skillBlurb: "",
      },
    ]);
    expect(ctx.log.warn).toHaveBeenCalled();
  });

  it("filters out retired team members", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["a", "b"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent
      .mockResolvedValueOnce({ id: "a", name: "A", retired: false } as any)
      .mockResolvedValueOnce({ id: "b", name: "B", retired: true } as any);

    const result = await buildAgentLaneContext(ctx, "manager");

    expect(result.team.map((m) => m.id)).toEqual(["a"]);
  });

  it("tolerates failed member fetches without breaking the drain", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["a", "b"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent
      .mockResolvedValueOnce({ id: "a", name: "A", retired: false } as any)
      .mockRejectedValueOnce(new Error("DDB outage"));

    const result = await buildAgentLaneContext(ctx, "manager");

    expect(result.team.map((m) => m.id)).toEqual(["a"]);
    expect(ctx.log.warn).toHaveBeenCalled();
  });

  it("caches the resolved roster across drain loops", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["a"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent.mockResolvedValue({
      id: "a",
      name: "A",
      delegationHint: "p",
      retired: false,
    } as any);

    await buildAgentLaneContext(ctx, "manager");
    await buildAgentLaneContext(ctx, "manager");

    // Second call should hit cache and skip getAgent.
    expect(ctx.services.agents.getAgent).toHaveBeenCalledTimes(1);
  });

  it("populates activeDelegations from open tasks assigned by self", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["researcher"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent.mockResolvedValue({
      id: "researcher",
      name: "Researcher",
      delegationHint: "Web research",
      retired: false,
    } as any);
    ctx.services.tasks.getTasksByAgent.mockResolvedValue([
      // Open delegation from this manager — should be included
      {
        id: "task-open",
        agentId: "researcher",
        title: "Find pricing",
        assignerAgentId: "manager",
        completedAt: null,
      },
      // Completed delegation from this manager — should be excluded
      {
        id: "task-done",
        agentId: "researcher",
        title: "Old work",
        assignerAgentId: "manager",
        completedAt: "2026-01-10T00:00:00.000Z",
      },
      // Open task NOT assigned by this manager — should be excluded
      {
        id: "task-other",
        agentId: "researcher",
        title: "Direct chat work",
        assignerAgentId: undefined,
        completedAt: null,
      },
      // Open delegation from a different manager — should be excluded
      {
        id: "task-foreign",
        agentId: "researcher",
        title: "Other manager's work",
        assignerAgentId: "other-manager",
        completedAt: null,
      },
    ] as any);

    const result = await buildAgentLaneContext(ctx, "manager");

    expect(result.activeDelegations).toEqual([
      {
        taskId: "task-open",
        targetId: "researcher",
        targetName: "Researcher",
        title: "Find pricing",
      },
    ]);
  });

  it("tolerates getTasksByAgent failures per member", async () => {
    mockLoadAgentContext.mockResolvedValue({
      agent: managerAgent(["a", "b"]) as any,
      profile: null,
      displayName: "the user",
      timezone: undefined,
    });
    ctx.services.agents.getAgent
      .mockResolvedValueOnce({ id: "a", name: "A", retired: false } as any)
      .mockResolvedValueOnce({ id: "b", name: "B", retired: false } as any);
    ctx.services.tasks.getTasksByAgent
      .mockRejectedValueOnce(new Error("DDB outage"))
      .mockResolvedValueOnce([
        {
          id: "t1",
          agentId: "b",
          title: "Open",
          assignerAgentId: "manager",
          completedAt: null,
        },
      ] as any);

    const result = await buildAgentLaneContext(ctx, "manager");

    expect(result.activeDelegations.map((d) => d.taskId)).toEqual(["t1"]);
    expect(ctx.log.warn).toHaveBeenCalled();
  });
});

describe("buildTaskTools", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("includes base tools for every task", () => {
    const tools = buildTaskTools(ctx, makeAgentLaneCtx(), "agent-1", "task-1");

    expect(tools).toHaveProperty("updateTaskMessage");
    expect(tools).toHaveProperty("replyToAssigner");
    expect(tools).toHaveProperty("readFile");
    expect(tools).toHaveProperty("writeFile");
    expect(tools).toHaveProperty("editFile");
    expect(tools).toHaveProperty("listFiles");
    expect(tools).toHaveProperty("glob");
    expect(tools).toHaveProperty("grep");
    expect(tools).toHaveProperty("saveMemory");
    expect(tools).toHaveProperty("recallMemory");
    expect(tools).toHaveProperty("listJobs");
    expect(tools).toHaveProperty("scheduleJob");
    expect(tools).toHaveProperty("updateJob");
  });

  it("excludes sandbox tools when sandbox is not enabled", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({ agent: makeAgent({ config: null }) as any }),
      "agent-1",
      "task-1",
    );

    expect(tools).not.toHaveProperty("ensureSandbox");
    expect(tools).not.toHaveProperty("runCommand");
  });

  it("includes sandbox tools when sandbox is enabled", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({
        agent: makeAgent({
          config: { sandbox: { enabled: true } },
        }) as any,
      }),
      "agent-1",
      "task-1",
    );

    expect(tools).toHaveProperty("ensureSandbox");
    expect(tools).toHaveProperty("runCommand");
  });

  it("excludes web search tools when webSearch is not enabled", () => {
    const tools = buildTaskTools(ctx, makeAgentLaneCtx(), "agent-1", "task-1");

    expect(tools).not.toHaveProperty("webSearch");
    expect(tools).not.toHaveProperty("webFetch");
  });

  it("includes web search tools when webSearch is enabled (default brave)", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({
        agent: makeAgent({
          config: { webSearch: { enabled: true } },
        }) as any,
      }),
      "agent-1",
      "task-1",
    );

    expect(tools).toHaveProperty("webSearch");
    expect(tools).toHaveProperty("webFetch");
  });

  it("excludes viewImage when viewImage is not enabled", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({ agent: makeAgent({ config: null }) as any }),
      "agent-1",
      "task-1",
    );

    expect(tools).not.toHaveProperty("viewImage");
  });

  it("includes viewImage when viewImage is enabled without sandbox", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({
        agent: makeAgent({
          config: { viewImage: { enabled: true } },
        }) as any,
      }),
      "agent-1",
      "task-1",
    );

    expect(tools).toHaveProperty("viewImage");
    expect(tools).not.toHaveProperty("ensureSandbox");
    expect(tools).not.toHaveProperty("runCommand");
  });

  it("excludes viewImage when enabled but model does not support images", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({
        agent: makeAgent({
          config: { viewImage: { enabled: true } },
        }) as any,
        modelSupportsImages: false,
      }),
      "agent-1",
      "task-1",
    );

    expect(tools).not.toHaveProperty("viewImage");
  });

  it("includes both viewImage and sandbox tools when both enabled", () => {
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({
        agent: makeAgent({
          config: {
            sandbox: { enabled: true },
            viewImage: { enabled: true },
          },
        }) as any,
      }),
      "agent-1",
      "task-1",
    );

    expect(tools).toHaveProperty("viewImage");
    expect(tools).toHaveProperty("ensureSandbox");
    expect(tools).toHaveProperty("runCommand");
  });

  it("includes skill tools from the agent lane context", () => {
    const customTool = { description: "custom", execute: vi.fn() };
    const tools = buildTaskTools(
      ctx,
      makeAgentLaneCtx({
        skillTools: {
          tools: { myCustomTool: customTool },
          getEnv: () => ({}),
        },
      }),
      "agent-1",
      "task-1",
    );

    expect(tools.myCustomTool).toBe(customTool);
  });
});
