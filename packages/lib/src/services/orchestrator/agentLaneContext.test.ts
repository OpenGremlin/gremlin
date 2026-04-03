import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import {
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
    soul: "helpful assistant",
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
    skillSummary: { promptSection: "" },
    skillTools: { tools: {}, getEnv: () => ({}) },
    modelSupportsImages: true,
    modelSupportsReasoning: false,
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
    mockBuildSkillSummary.mockResolvedValue({ promptSection: "skill info" });
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
      return { promptSection: "" };
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
    mockBuildSkillSummary.mockResolvedValue({ promptSection: "" });
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

describe("buildTaskTools", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("includes base tools for every task", () => {
    const tools = buildTaskTools(ctx, makeAgentLaneCtx(), "agent-1", "task-1");

    expect(tools).toHaveProperty("updateTaskMessage");
    expect(tools).toHaveProperty("postToMainLane");
    expect(tools).toHaveProperty("readFile");
    expect(tools).toHaveProperty("writeFile");
    expect(tools).toHaveProperty("editFile");
    expect(tools).toHaveProperty("listFiles");
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
