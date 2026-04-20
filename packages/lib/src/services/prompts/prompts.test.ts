import { describe, expect, it } from "vitest";
import {
  renderSystemPrompt,
  renderTaskSystemPrompt,
  resolvePromptFlags,
} from "./index.js";

describe("resolvePromptFlags", () => {
  it("returns all false for undefined config", () => {
    const flags = resolvePromptFlags(undefined, {
      modelSupportsImages: true,
      hasSkills: false,
    });
    expect(flags).toEqual({
      viewImage: false,
      sandbox: false,
      webSearch: false,
      imageGeneration: false,
      speech: false,
      manager: false,
      hasSkills: false,
    });
  });

  it("returns all false for null config", () => {
    const flags = resolvePromptFlags(null, {
      modelSupportsImages: true,
      hasSkills: false,
    });
    expect(flags.viewImage).toBe(false);
    expect(flags.sandbox).toBe(false);
    expect(flags.webSearch).toBe(false);
  });

  it("enables viewImage only when config enabled AND model supports images", () => {
    expect(
      resolvePromptFlags(
        { viewImage: { enabled: true } },
        { modelSupportsImages: true, hasSkills: false },
      ).viewImage,
    ).toBe(true);

    expect(
      resolvePromptFlags(
        { viewImage: { enabled: true } },
        { modelSupportsImages: false, hasSkills: false },
      ).viewImage,
    ).toBe(false);

    expect(
      resolvePromptFlags(
        { viewImage: { enabled: false } },
        { modelSupportsImages: true, hasSkills: false },
      ).viewImage,
    ).toBe(false);
  });

  it("resolves sandbox and webSearch from config", () => {
    const flags = resolvePromptFlags(
      {
        sandbox: { enabled: true },
        webSearch: { enabled: true },
      },
      { modelSupportsImages: false, hasSkills: true },
    );
    expect(flags.sandbox).toBe(true);
    expect(flags.webSearch).toBe(true);
    expect(flags.hasSkills).toBe(true);
  });
});

const baseData = {
  agentId: "agent-test-123",
  name: "TestAgent",
  personality: "You are helpful.",
  userDisplayName: "Alice",
};

describe("renderSystemPrompt", () => {
  const allOff = {
    viewImage: false,
    sandbox: false,
    webSearch: false,
    hasSkills: false,
  };

  it("includes identity section with interpolated values", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("<identity>");
    expect(result).toContain("You are TestAgent");
    expect(result).toContain("You are helpful.");
    expect(result).toContain("Alice");
    expect(result).toContain("</identity>");
  });

  it("includes role field when provided", () => {
    const result = renderSystemPrompt(
      { ...baseData, role: "You are a senior engineer." },
      allOff,
    );
    expect(result).toContain("You are a senior engineer.");
  });

  it("omits role field when not provided", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).not.toContain("senior engineer");
  });

  it("omits viewImage section when disabled", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).not.toContain("viewImage");
    expect(result).not.toContain("<images>");
  });

  it("includes viewImage section when enabled", () => {
    const result = renderSystemPrompt(baseData, { ...allOff, viewImage: true });
    expect(result).toContain("<images>");
    expect(result).toContain("viewImage");
  });

  it("uses task framing instead of legacy backgrounding/delegation", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("create tasks");
    expect(result).toContain("<tasks>");
    expect(result).not.toContain("delegateTask");
    expect(result).not.toContain("backgroundTask");
  });

  it("includes the clear tasks-first rule", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("answer directly");
    expect(result).toContain("creating a task");
  });

  it("mentions task dispatch", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("dispatches ready work automatically");
  });

  it("includes userAbout when provided", () => {
    const result = renderSystemPrompt(
      { ...baseData, userAbout: "Loves cats" },
      allOff,
    );
    expect(result).toContain("Loves cats");
  });

  it("omits userAbout line when not provided", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).not.toContain("About them:");
  });

  it("renders manager team roster with delegationHint when available", () => {
    const result = renderSystemPrompt(
      {
        ...baseData,
        manager: {
          team: [
            {
              id: "researcher",
              name: "Researcher",
              delegationHint: "Web research and summarization",
              skillBlurb: "brave-search",
            },
            {
              id: "sre",
              name: "SRE",
              role: "reliability engineer",
              skillBlurb: "",
            },
          ],
          activeDelegations: [],
        },
      },
      { ...allOff, manager: true },
    );
    expect(result).toContain("<manager>");
    expect(result).toContain("@Researcher");
    expect(result).toContain("Web research and summarization");
    // Falls back to role when delegationHint is absent.
    expect(result).toContain("@SRE");
    expect(result).toContain("reliability engineer");
  });
});

describe("renderTaskSystemPrompt", () => {
  const taskData = { ...baseData, taskTitle: "Do the thing", taskId: "t-1" };
  const allOff = {
    viewImage: false,
    sandbox: false,
  };

  it("includes task preamble with interpolated values", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("Do the thing");
    expect(result).toContain("t-1");
  });

  it("omits sandbox section when disabled", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).not.toContain("<sandbox_instructions>");
    expect(result).not.toContain("ensureSandbox");
  });

  it("includes sandbox section when enabled", () => {
    const result = renderTaskSystemPrompt(taskData, {
      ...allOff,
      sandbox: true,
    });
    expect(result).toContain("<sandbox_instructions>");
    expect(result).toContain("ensureSandbox");
    expect(result).toContain("runCommand");
  });

  it("always includes workflow and memory sections", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("saveMemory");
    expect(result).toContain("<jobs>");
  });

  it("always includes file editor guidance", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("<file_tools>");
    expect(result).toContain("readFile");
    expect(result).toContain("editFile");
    expect(result).toContain("writeFile");
    expect(result).toContain("listFiles");
    expect(result).toContain("glob");
    expect(result).toContain("grep");
    // The "prefer dedicated tools over shell" rule is load-bearing — without
    // it, agents reach for cat/sed/find when they have the typed tools.
    expect(result).toMatch(/do not use shell commands/i);
  });

  // These guard the load-bearing instructions that fix the Pokédex-style
  // "parent does subtasks' work" bug. Do not remove without explicitly
  // re-verifying the workflow.
  it("always includes the coordinator rule so delegation is safe", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("coordinator");
    expect(result).toContain("do NOT do the subtasks' work yourself");
  });

  it("always includes the escalation instruction", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("escalate");
    expect(result).toContain("escalate: true");
  });

  it("always includes the close instruction with required notes", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain('status: "closed"');
    expect(result).toContain("notes");
  });

  it("tells the agent output flows through attachments, not chat", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("attachFile");
    expect(result).toContain("attachLink");
  });
});
