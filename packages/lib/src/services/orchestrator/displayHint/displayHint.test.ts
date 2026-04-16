import { describe, expect, it } from "vitest";
import { computeDisplayHint } from "./index.js";

// Tool names are hard-coded literals in expected outputs — the ToolName enum
// is exercised indirectly. If an enum value drifts, the matching test fails.

describe("computeDisplayHint — task tracking", () => {
  it("taskCreate uses input.title", () => {
    expect(
      computeDisplayHint("taskCreate", { title: "Write PR" }, null),
    ).toEqual({
      text: "Creating task: Write PR",
    });
  });

  it("taskCreate falls back to 'task' when no title", () => {
    expect(computeDisplayHint("taskCreate", null, null)).toEqual({
      text: "Creating task: task",
    });
  });

  it("taskShow prefers result.title, then result.task.title, then input.taskId", () => {
    expect(
      computeDisplayHint(
        "taskShow",
        { taskId: "t1" },
        { title: "From result" },
      ),
    ).toEqual({ text: "Viewing task: From result" });

    expect(
      computeDisplayHint(
        "taskShow",
        { taskId: "t1" },
        { task: { title: "Nested" } },
      ),
    ).toEqual({ text: "Viewing task: Nested" });

    expect(computeDisplayHint("taskShow", { taskId: "t1" }, null)).toEqual({
      text: "Viewing task: t1",
    });
  });

  it("taskUpdate marks close as success", () => {
    expect(
      computeDisplayHint(
        "taskUpdate",
        { taskId: "t1", status: "closed" },
        { title: "Ship" },
      ),
    ).toEqual({ text: "Closing task: Ship → closed", variant: "success" });
  });

  it("taskUpdate for non-close shows 'Updating task'", () => {
    expect(
      computeDisplayHint(
        "taskUpdate",
        { taskId: "t1", status: "in_progress" },
        { title: "Ship" },
      ),
    ).toEqual({ text: "Updating task: Ship → in_progress" });
  });

  it("taskList has a fixed string", () => {
    expect(computeDisplayHint("taskList", null, null)).toEqual({
      text: "Listing tasks",
    });
  });

  it("taskReady has a fixed string", () => {
    expect(computeDisplayHint("taskReady", null, null)).toEqual({
      text: "Checking ready work",
    });
  });

  it("taskDep distinguishes add vs remove", () => {
    expect(computeDisplayHint("taskDep", { action: "add" }, null)?.text).toBe(
      "Adding dependency",
    );
    expect(
      computeDisplayHint("taskDep", { action: "remove" }, null)?.text,
    ).toBe("Removing dependency");
  });

  it("taskBlocked has a fixed string", () => {
    expect(computeDisplayHint("taskBlocked", null, null)).toEqual({
      text: "Checking blocked tasks",
    });
  });

  it("legacy taskClose marks variant=success", () => {
    expect(computeDisplayHint("taskClose", { taskId: "t1" }, null)).toEqual({
      text: "Closing task: t1",
      variant: "success",
    });
  });
});

describe("computeDisplayHint — file editor", () => {
  it("readFile uses input.file_path", () => {
    expect(
      computeDisplayHint("readFile", { file_path: "/w/a.ts" }, null)?.text,
    ).toBe("Reading file: /w/a.ts");
  });

  it("writeFile prefers result.path, falls back to input.file_path", () => {
    expect(
      computeDisplayHint(
        "writeFile",
        { file_path: "/w/a.ts" },
        { path: "/abs/a.ts" },
      )?.text,
    ).toBe("Writing file: /abs/a.ts");

    expect(
      computeDisplayHint("writeFile", { file_path: "/w/a.ts" }, null)?.text,
    ).toBe("Writing file: /w/a.ts");
  });

  it("listFiles defaults to '.'", () => {
    expect(computeDisplayHint("listFiles", null, null)?.text).toBe(
      "Listing files: .",
    );
  });

  it("glob and grep use input.pattern", () => {
    expect(computeDisplayHint("glob", { pattern: "**/*.ts" }, null)?.text).toBe(
      "Searching files: **/*.ts",
    );
    expect(computeDisplayHint("grep", { pattern: "TODO" }, null)?.text).toBe(
      "Searching for: TODO",
    );
  });
});

describe("computeDisplayHint — sandbox", () => {
  it("ensureSandbox success → variant=success", () => {
    expect(
      computeDisplayHint("ensureSandbox", null, { status: "ready" }),
    ).toEqual({ text: "Preparing sandbox", variant: "success" });
  });

  it("ensureSandbox other → variant=warning", () => {
    expect(computeDisplayHint("ensureSandbox", null, {})).toEqual({
      text: "Connecting to sandbox",
      variant: "warning",
    });
  });

  it("runCommand has no hint (frontend renders custom widget)", () => {
    expect(
      computeDisplayHint("runCommand", { command: "ls" }, null),
    ).toBeNull();
  });
});

describe("computeDisplayHint — attachments / media / web / skills / memory", () => {
  it("attachFile and attachLink", () => {
    expect(
      computeDisplayHint("attachFile", { path: "/w/a.png" }, null)?.text,
    ).toBe("Attaching file: /w/a.png");
    expect(
      computeDisplayHint(
        "attachLink",
        { title: "Docs", url: "https://x" },
        null,
      )?.text,
    ).toBe("Attaching link: Docs");
    expect(
      computeDisplayHint("attachLink", { url: "https://x" }, null)?.text,
    ).toBe("Attaching link: https://x");
  });

  it("generateImage / generateSpeech prefer result.path", () => {
    expect(
      computeDisplayHint(
        "generateImage",
        { outputPath: "/w/in.png" },
        { path: "/w/out.png" },
      )?.text,
    ).toBe("Generating image: /w/out.png");
  });

  it("web search and fetch", () => {
    expect(
      computeDisplayHint("webSearch", { query: "vitest" }, null)?.text,
    ).toBe("Searching: vitest");
    expect(
      computeDisplayHint("webFetch", { url: "https://x" }, null)?.text,
    ).toBe("Fetching: https://x");
  });

  it("authenticate includes connectionLabel if present", () => {
    expect(
      computeDisplayHint(
        "authenticate",
        { skillId: "slack" },
        { connectionLabel: "Acme" },
      )?.text,
    ).toBe("Authenticating slack (Acme)");
    expect(
      computeDisplayHint("authenticate", { skillId: "slack" }, null)?.text,
    ).toBe("Authenticating slack");
  });

  it("memory tools", () => {
    expect(computeDisplayHint("saveMemory", { key: "prefs" }, null)?.text).toBe(
      "Saving memory: prefs",
    );
    expect(
      computeDisplayHint("saveMemory", { topic: "meetings" }, null)?.text,
    ).toBe("Saving memory: meetings");
    expect(
      computeDisplayHint("recallMemory", { query: "who signed up" }, null)
        ?.text,
    ).toBe("Recalling: who signed up");
  });

  it("job tools", () => {
    expect(computeDisplayHint("listJobs", null, null)?.text).toBe(
      "Listing jobs",
    );
    expect(
      computeDisplayHint("scheduleJob", { schedule: "0 9 * * *" }, null)?.text,
    ).toBe("Scheduling job: 0 9 * * *");
    expect(computeDisplayHint("updateJob", {}, null)?.text).toBe(
      "Updating job",
    );
  });
});

describe("computeDisplayHint — unwrapping + error handling", () => {
  it("unwraps {ok:true,data} payload", () => {
    expect(
      computeDisplayHint(
        "taskShow",
        { taskId: "t1" },
        {
          ok: true,
          data: { title: "Unwrapped" },
        },
      ),
    ).toEqual({ text: "Viewing task: Unwrapped" });
  });

  it("surfaces typed GremlinToolError", () => {
    const hint = computeDisplayHint(
      "readFile",
      { file_path: "/x.ts" },
      {
        ok: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: "no such file",
          hint: "check path",
        },
      },
    );
    expect(hint).toEqual({
      text: "Reading file: /x.ts",
      error: "FILE_NOT_FOUND: no such file check path",
      variant: "error",
    });
  });

  it("surfaces typed error without hint", () => {
    const hint = computeDisplayHint(
      "readFile",
      { file_path: "/x.ts" },
      { ok: false, error: { code: "E", message: "bad" } },
    );
    expect(hint?.error).toBe("E: bad");
  });

  it("surfaces legacy error string", () => {
    const hint = computeDisplayHint(
      "readFile",
      { file_path: "/x.ts" },
      { error: "legacy failure" },
    );
    expect(hint?.error).toBe("legacy failure");
    expect(hint?.variant).toBe("error");
  });

  it("returns null for unknown tool names", () => {
    expect(computeDisplayHint("nonexistentTool", {}, {})).toBeNull();
  });

  it("returns null for requestUserInput (custom widget)", () => {
    expect(computeDisplayHint("requestUserInput", {}, {})).toBeNull();
  });
});
