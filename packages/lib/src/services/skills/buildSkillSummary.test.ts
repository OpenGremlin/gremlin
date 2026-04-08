import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";

// Mock the underlying data sources so we can drive resolveAgentSkills
// without hitting DDB or S3.
vi.mock("./getAgentSkills.js", () => ({
  getAgentSkills: vi.fn(),
}));
vi.mock("./getSkillsBucket.js", () => ({
  getSkillsBucket: vi.fn().mockReturnValue("test-bucket"),
}));
vi.mock("./skillScanner/index.js", () => ({
  getSkillTemplateFromS3: vi.fn(),
}));
vi.mock("./loadActiveConnections.js", () => ({
  loadActiveConnectionLabels: vi.fn(),
  filterRevokedBindings: vi.fn(async (_resources, bindings) => bindings),
}));

import { buildSkillBlurb, buildSkillSummary } from "./buildSkillSummary.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { loadActiveConnectionLabels } from "./loadActiveConnections.js";
import { getSkillTemplateFromS3 } from "./skillScanner/index.js";

const mockGetAgentSkills = vi.mocked(getAgentSkills);
const mockGetSkillTemplate = vi.mocked(getSkillTemplateFromS3);
const mockLoadConnectionLabels = vi.mocked(loadActiveConnectionLabels);

describe("buildSkillSummary / buildSkillBlurb", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    mockLoadConnectionLabels.mockResolvedValue([]);
  });

  it("returns empty for an agent with no skills", async () => {
    mockGetAgentSkills.mockResolvedValue([]);

    const summary = await buildSkillSummary(ctx, "agent-1");
    const blurb = await buildSkillBlurb(ctx, "agent-1");

    expect(summary).toEqual({ promptSection: "", mainLaneSection: "" });
    expect(blurb).toBe("");
  });

  it("includes connection-free skills in both formats", async () => {
    mockGetAgentSkills.mockResolvedValue([
      { skillId: "pdf-toolkit", connectionBindings: null } as any,
    ]);
    mockGetSkillTemplate.mockResolvedValue({
      id: "pdf-toolkit",
      name: "pdf-toolkit",
      displayName: "PDF Toolkit",
      description: "Manipulate PDFs",
      connections: [],
    } as any);

    const summary = await buildSkillSummary(ctx, "agent-1");
    const blurb = await buildSkillBlurb(ctx, "agent-1");

    expect(summary.promptSection).toContain("PDF Toolkit");
    expect(summary.promptSection).toContain("readSkill");
    expect(summary.mainLaneSection).toContain("PDF Toolkit");
    expect(summary.mainLaneSection).not.toContain("readSkill");
    expect(summary.mainLaneSection).not.toContain("runCommand");
    expect(summary.mainLaneSection).not.toContain("authenticate");
    expect(summary.mainLaneSection).toContain("backgroundTask");
    expect(blurb).toBe("pdf-toolkit");
  });

  it("renders bound connections with labels for the blurb", async () => {
    mockGetAgentSkills.mockResolvedValue([
      {
        skillId: "linear",
        connectionBindings: JSON.stringify({ linear: ["conn-1"] }),
      } as any,
    ]);
    mockGetSkillTemplate.mockResolvedValue({
      id: "linear",
      name: "linear",
      displayName: "Linear",
      description: "Manage issues",
      connections: [{ provider: "linear" }],
    } as any);
    mockLoadConnectionLabels.mockResolvedValue([
      { id: "conn-1", label: "Eng team" },
    ]);

    const blurb = await buildSkillBlurb(ctx, "agent-1");

    expect(blurb).toBe("linear (Eng team)");
  });

  it("collapses multiple bound connections per provider into one entry", async () => {
    mockGetAgentSkills.mockResolvedValue([
      {
        skillId: "slack",
        connectionBindings: JSON.stringify({ slack: ["c1", "c2"] }),
      } as any,
    ]);
    mockGetSkillTemplate.mockResolvedValue({
      id: "slack",
      name: "slack",
      displayName: "Slack",
      description: "Send messages",
      connections: [{ provider: "slack" }],
    } as any);
    mockLoadConnectionLabels.mockResolvedValue([
      { id: "c1", label: "Acme" },
      { id: "c2", label: "Personal" },
    ]);

    const blurb = await buildSkillBlurb(ctx, "agent-1");

    expect(blurb).toBe("slack (Acme, Personal)");
  });

  it("filters skills with required-but-unbound connections from the blurb", async () => {
    mockGetAgentSkills.mockResolvedValue([
      // Has Slack installed but no connection bound — should NOT appear in blurb
      { skillId: "slack", connectionBindings: null } as any,
      // Has PDF Toolkit which needs no connections — should appear
      { skillId: "pdf-toolkit", connectionBindings: null } as any,
    ]);
    mockGetSkillTemplate.mockImplementation(async (_bucket, skillId) => {
      if (skillId === "slack") {
        return {
          id: "slack",
          name: "slack",
          displayName: "Slack",
          description: "Send messages",
          connections: [{ provider: "slack" }],
        } as any;
      }
      if (skillId === "pdf-toolkit") {
        return {
          id: "pdf-toolkit",
          name: "pdf-toolkit",
          displayName: "PDF Toolkit",
          description: "Manipulate PDFs",
          connections: [],
        } as any;
      }
      return null;
    });

    const blurb = await buildSkillBlurb(ctx, "agent-1");
    const summary = await buildSkillSummary(ctx, "agent-1");

    expect(blurb).toBe("pdf-toolkit");
    // Same filter applies to the main-lane section.
    expect(summary.mainLaneSection).toContain("PDF Toolkit");
    expect(summary.mainLaneSection).not.toContain("Slack");
  });

  it("joins multiple usable skills with comma-space in the blurb", async () => {
    mockGetAgentSkills.mockResolvedValue([
      {
        skillId: "slack",
        connectionBindings: JSON.stringify({ slack: ["c1"] }),
      } as any,
      {
        skillId: "linear",
        connectionBindings: JSON.stringify({ linear: ["c2"] }),
      } as any,
      { skillId: "pdf-toolkit", connectionBindings: null } as any,
    ]);
    mockGetSkillTemplate
      .mockResolvedValueOnce({
        id: "slack",
        name: "slack",
        displayName: "Slack",
        description: "x",
        connections: [{ provider: "slack" }],
      } as any)
      .mockResolvedValueOnce({
        id: "linear",
        name: "linear",
        displayName: "Linear",
        description: "x",
        connections: [{ provider: "linear" }],
      } as any)
      .mockResolvedValueOnce({
        id: "pdf-toolkit",
        name: "pdf-toolkit",
        displayName: "PDF Toolkit",
        description: "x",
        connections: [],
      } as any);
    mockLoadConnectionLabels
      .mockResolvedValueOnce([{ id: "c1", label: "Acme" }])
      .mockResolvedValueOnce([{ id: "c2", label: "Eng" }]);

    const blurb = await buildSkillBlurb(ctx, "agent-1");

    expect(blurb).toBe("slack (Acme), linear (Eng), pdf-toolkit");
  });

  it("task-lane section includes runCommand/authenticate instructions", async () => {
    mockGetAgentSkills.mockResolvedValue([
      {
        skillId: "slack",
        connectionBindings: JSON.stringify({ slack: ["c1"] }),
      } as any,
    ]);
    mockGetSkillTemplate.mockResolvedValue({
      id: "slack",
      name: "slack",
      displayName: "Slack",
      description: "Send messages",
      connections: [{ provider: "slack" }],
    } as any);
    mockLoadConnectionLabels.mockResolvedValue([{ id: "c1", label: "Acme" }]);

    const summary = await buildSkillSummary(ctx, "agent-1");

    expect(summary.promptSection).toContain("readSkill");
    expect(summary.promptSection).toContain("runCommand");
    expect(summary.promptSection).toContain("authenticate('slack', 'c1')");
  });

  it("main-lane section never references skill execution tools", async () => {
    mockGetAgentSkills.mockResolvedValue([
      {
        skillId: "slack",
        connectionBindings: JSON.stringify({ slack: ["c1"] }),
      } as any,
    ]);
    mockGetSkillTemplate.mockResolvedValue({
      id: "slack",
      name: "slack",
      displayName: "Slack",
      description: "Send messages",
      connections: [{ provider: "slack" }],
    } as any);
    mockLoadConnectionLabels.mockResolvedValue([{ id: "c1", label: "Acme" }]);

    const summary = await buildSkillSummary(ctx, "agent-1");

    expect(summary.mainLaneSection).not.toContain("readSkill");
    expect(summary.mainLaneSection).not.toContain("readSkillReference");
    expect(summary.mainLaneSection).not.toContain("runCommand");
    expect(summary.mainLaneSection).not.toContain("authenticate");
    // But it should still convey the routing-relevant info
    expect(summary.mainLaneSection).toContain("Slack");
    expect(summary.mainLaneSection).toContain("Acme");
    expect(summary.mainLaneSection).toContain("backgroundTask");
  });
});
