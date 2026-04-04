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
      programs: false,
      imageGeneration: false,
      speech: false,
      hasSkills: false,
      hasPlan: false,
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

  it("resolves sandbox, webSearch, and programs from config", () => {
    const flags = resolvePromptFlags(
      {
        sandbox: { enabled: true },
        webSearch: { enabled: true },
        programs: { enabled: true },
      },
      { modelSupportsImages: false, hasSkills: true },
    );
    expect(flags.sandbox).toBe(true);
    expect(flags.webSearch).toBe(true);
    expect(flags.programs).toBe(true);
    expect(flags.hasSkills).toBe(true);
  });

  it("defaults programs to true when sandbox is enabled", () => {
    const flags = resolvePromptFlags(
      { sandbox: { enabled: true } },
      { modelSupportsImages: false, hasSkills: false },
    );
    expect(flags.programs).toBe(true);
  });

  it("defaults programs to false when sandbox is disabled", () => {
    const flags = resolvePromptFlags(
      { sandbox: { enabled: false } },
      { modelSupportsImages: false, hasSkills: false },
    );
    expect(flags.programs).toBe(false);
  });

  it("respects explicit programs: false even with sandbox enabled", () => {
    const flags = resolvePromptFlags(
      { sandbox: { enabled: true }, programs: { enabled: false } },
      { modelSupportsImages: false, hasSkills: false },
    );
    expect(flags.programs).toBe(false);
  });
});

const baseData = {
  name: "TestAgent",
  soul: "You are helpful.",
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

  it("includes identity field when provided", () => {
    const result = renderSystemPrompt(
      { ...baseData, identity: "You are a senior engineer." },
      allOff,
    );
    expect(result).toContain("You are a senior engineer.");
  });

  it("omits identity field when not provided", () => {
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

  it("uses backgrounding framing instead of delegation", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("background tasks");
    expect(result).toContain("<backgrounding>");
    expect(result).not.toContain("delegateTask");
  });

  it("includes the clear backgrounding rule", () => {
    const result = renderSystemPrompt(baseData, {
      ...allOff,
      sandbox: true,
    });
    expect(result).toContain("answer directly");
    expect(result).toContain("background it");
  });

  it("mentions conversation inheritance", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("inherits the full conversation");
  });

  it("builds dynamic task capabilities list", () => {
    const result = renderSystemPrompt(baseData, {
      viewImage: false,
      sandbox: true,
      webSearch: true,
      hasSkills: true,
    });
    expect(result).toContain(
      "file editing, web search, a Linux sandbox, skills",
    );
  });

  it("lists only file editing when nothing else enabled", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("**file editing**");
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
});

describe("renderTaskSystemPrompt", () => {
  const taskData = { ...baseData, taskTitle: "Do the thing", taskId: "t-1" };
  const allOff = {
    viewImage: false,
    sandbox: false,
    programs: false,
    hasPlan: false,
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
    expect(result).toContain("postToMainLane");
    expect(result).toContain("updateTaskMessage");
    expect(result).toContain("saveMemory");
    expect(result).toContain("<jobs>");
  });

  it("omits programs section when disabled", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).not.toContain("<programs>");
  });

  it("includes programs section when enabled", () => {
    const result = renderTaskSystemPrompt(taskData, {
      ...allOff,
      programs: true,
    });
    expect(result).toContain("<programs>");
    expect(result).toContain("/workspace/programs/");
    expect(result).toContain("README.md");
    expect(result).toContain("operation-logs/");
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
    expect(result).toContain("NOT cat");
    expect(result).toContain("NOT sed");
    expect(result).toContain("NOT find");
  });
});
