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
    expect(result).toContain("You are TestAgent");
    expect(result).toContain("You are helpful.");
    expect(result).toContain("Alice");
  });

  it("omits viewImage section when disabled", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).not.toContain("viewImage");
    expect(result).not.toContain("### Images");
  });

  it("includes viewImage section when enabled", () => {
    const result = renderSystemPrompt(baseData, { ...allOff, viewImage: true });
    expect(result).toContain("### Images");
    expect(result).toContain("viewImage");
  });

  it("omits missing-capabilities caveat when nothing is task-only", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).not.toContain("You do NOT have");
  });

  it("includes web search caveat when webSearch enabled", () => {
    const result = renderSystemPrompt(baseData, { ...allOff, webSearch: true });
    expect(result).toContain("You do NOT have web search");
    expect(result).toContain("web search");
  });

  it("includes shell access caveat when sandbox enabled", () => {
    const result = renderSystemPrompt(baseData, { ...allOff, sandbox: true });
    expect(result).toContain("shell access");
  });

  it("lists both caveats when both enabled", () => {
    const result = renderSystemPrompt(baseData, {
      ...allOff,
      webSearch: true,
      sandbox: true,
    });
    expect(result).toContain("web search or shell access");
  });

  it("builds dynamic task capabilities list", () => {
    const result = renderSystemPrompt(baseData, {
      viewImage: false,
      sandbox: true,
      webSearch: true,
      hasSkills: true,
    });
    expect(result).toContain(
      "document creation, web search, a sandbox (Linux VM), skills",
    );
  });

  it("lists only document creation when nothing else enabled", () => {
    const result = renderSystemPrompt(baseData, allOff);
    expect(result).toContain("**document creation**");
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
  const allOff = { viewImage: false, sandbox: false };

  it("includes task preamble with interpolated values", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("Do the thing");
    expect(result).toContain("t-1");
  });

  it("omits sandbox section when disabled", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).not.toContain("### Sandbox");
    expect(result).not.toContain("ensureSandbox");
  });

  it("includes sandbox section when enabled", () => {
    const result = renderTaskSystemPrompt(taskData, {
      ...allOff,
      sandbox: true,
    });
    expect(result).toContain("### Sandbox");
    expect(result).toContain("ensureSandbox");
    expect(result).toContain("runCommand");
  });

  it("always includes workflow and memory sections", () => {
    const result = renderTaskSystemPrompt(taskData, allOff);
    expect(result).toContain("postToMainLane");
    expect(result).toContain("updateTaskMessage");
    expect(result).toContain("saveMemory");
    expect(result).toContain("### Jobs");
  });
});
