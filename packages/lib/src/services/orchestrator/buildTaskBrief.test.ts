import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { buildTaskBrief } from "./buildTaskBrief.js";

const makeTask = (overrides: Record<string, unknown> = {}) => ({
  id: "task-1",
  agentId: "agent-1",
  title: "Write Pokédex Entry",
  status: "open",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("buildTaskBrief", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([]);
    ctx.services.tasks.getLatestComment.mockResolvedValue(undefined);
  });

  it("uses instructions as the body when present", async () => {
    const task = makeTask({ instructions: "Do the thing thoroughly." }) as any;

    const brief = await buildTaskBrief(ctx, task);

    expect(brief).toContain("Do the thing thoroughly.");
    // Title is shown via system prompt — the brief shouldn't repeat it as body.
    expect(brief).not.toContain("Write Pokédex Entry");
  });

  it("falls back to description, then title, when instructions missing", async () => {
    const descTask = makeTask({ description: "Backfill context." }) as any;
    expect(await buildTaskBrief(ctx, descTask)).toContain("Backfill context.");

    const titleOnly = makeTask() as any;
    expect(await buildTaskBrief(ctx, titleOnly)).toContain(
      "Write Pokédex Entry",
    );
  });

  it("includes expectedInput and expectedOutput when set", async () => {
    const task = makeTask({
      instructions: "Draft it",
      expectedInput: "A list of names",
      expectedOutput: "Markdown attachment",
    }) as any;

    const brief = await buildTaskBrief(ctx, task);

    expect(brief).toContain("Expected input:\nA list of names");
    expect(brief).toContain("Expected output:\nMarkdown attachment");
  });

  it("labels scheduled-job origin when originJobId resolves", async () => {
    const task = makeTask({
      instructions: "Post daily entry",
      originJobId: "job-xyz",
    }) as any;
    ctx.services.jobs.getJob.mockResolvedValue({
      id: "job-xyz",
      name: "Daily Pokédex",
    } as any);

    const brief = await buildTaskBrief(ctx, task);

    expect(brief).toContain(
      `From scheduled job "Daily Pokédex" (id: job-xyz).`,
    );
  });

  it("silently omits scheduled-job line when the job no longer exists", async () => {
    const task = makeTask({
      instructions: "Post daily entry",
      originJobId: "job-ghost",
    }) as any;
    ctx.services.jobs.getJob.mockResolvedValue(null as any);

    const brief = await buildTaskBrief(ctx, task);

    expect(brief).not.toContain("From scheduled job");
    expect(brief).toContain("Post daily entry");
  });

  it("lists attachments and the latest comment when present", async () => {
    const task = makeTask({ instructions: "Finish it" }) as any;
    ctx.services.tasks.getTaskAttachments.mockResolvedValue([
      { type: "file", path: "/workspace/report.md" },
      { type: "link", url: "https://example.com/dash" },
    ] as any);
    ctx.services.tasks.getLatestComment.mockResolvedValue({
      text: "Please adjust tone.",
    } as any);

    const brief = await buildTaskBrief(ctx, task);

    expect(brief).toContain("Attachments on this task:");
    expect(brief).toContain("/workspace/report.md");
    expect(brief).toContain("https://example.com/dash");
    expect(brief).toContain("Latest comment: Please adjust tone.");
  });
});
