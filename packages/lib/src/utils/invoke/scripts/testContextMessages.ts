// biome-ignore-all lint: Debug-only code

/**
 * Reproduce the viewImage retry failure using the real doorbell/consumer path.
 *
 * 1. Creates a task
 * 2. Pre-seeds the agent log with the exact state from the failing production task:
 *      SYSTEM (task prompt) → TOOL (viewImage success) → SYSTEM (API error)
 * 3. Enqueues a resume_task inbox item and rings the doorbell
 * 4. Watches the agent log to see what the retry produces
 *
 * Usage: pnpm --filter @opengremlin/lib invoke testContextMessages [agentId]
 */
import { ringDoorbell } from "../../../services/inbox/consumer.js";
import { writeAgentLog } from "../../../services/orchestrator/writeAgentLog.js";
import type { InvokeContext } from "../index.js";

export default async function testContextMessages(invokeCtx: InvokeContext) {
  const { ctx, agentId } = invokeCtx;

  console.log("=== Reproducing viewImage retry via doorbell ===\n");

  // ── 1. Create a test task ────────────────────────────────────────
  const task = await ctx.services.tasks.createTask(ctx, {
    agentId,
    title: "Test: viewImage retry",
  });
  const taskId = task.id;
  console.log(`Created task: ${taskId}`);

  // ── 2. Seed log with the production failure state ────────────────
  //    This matches what the agent log looks like after the first
  //    generateText throw + runLane catch writes the SYSTEM error.

  await writeAgentLog(ctx, {
    agentId,
    taskId,
    role: "SYSTEM",
    content:
      "Examine the uploaded image and find all hidden objects. The image is at /workspace/uploads/2026-03-27/photo.jpg",
  });

  await writeAgentLog(ctx, {
    agentId,
    taskId,
    role: "TOOL",
    toolName: "viewImage" as any,
    toolInput: { path: "/workspace/uploads/2026-03-27/photo.jpg" },
    toolResult: {
      type: "image",
      path: "/workspace/uploads/2026-03-27/photo.jpg",
      mediaType: "image/jpeg",
      sizeKB: 9500,
    },
  });

  await writeAgentLog(ctx, {
    agentId,
    taskId,
    role: "SYSTEM",
    content: JSON.stringify({
      type: "error",
      message:
        "An error occurred while processing your last action: The model returned the following errors: messages.2.content.1.tool_result.content.0.image.source.base64: image exceeds 5 MB maximum: 12725568 bytes > 5242880 bytes",
    }),
  });

  console.log(
    "Seeded 3 log entries (SYSTEM prompt, TOOL viewImage, SYSTEM error)",
  );

  // ── 3. Enqueue a resume_task and ring the doorbell ───────────────
  const lane = `task:${taskId}`;

  await ctx.services.inbox.enqueueWork(
    ctx,
    agentId,
    lane,
    {
      type: "resume_task",
      payload: { taskId },
    },
    { skipDoorbell: true },
  );

  console.log("Enqueued resume_task inbox item");
  console.log("Ringing doorbell...\n");

  await ringDoorbell(ctx, agentId, lane);

  console.log("\nDoorbell finished. Fetching task logs...\n");

  // ── 4. Read back all log entries for this task ───────────────────
  const logs = await ctx.services.agentLogs.getTaskLogs(ctx, taskId, {
    first: 50,
  });

  const entries = logs.edges.map((e) => e.node);
  console.log(`Total log entries: ${entries.length}\n`);

  for (const entry of entries) {
    const content =
      entry.content.length > 120
        ? entry.content.slice(0, 120) + "..."
        : entry.content;

    const extra = entry.toolName ? ` [${entry.toolName}]` : "";
    console.log(`  ${entry.role}${extra}: ${content}`);
  }

  // ── 5. Analyze ───────────────────────────────────────────────────
  const seededCount = 3;
  const newEntries = entries.slice(seededCount);
  console.log(`\n--- New entries after retry (${newEntries.length}) ---`);
  if (newEntries.length === 0) {
    console.log("  ⚠ NO new entries — retry produced nothing visible");
  }
  for (const entry of newEntries) {
    const content =
      entry.content.length > 200
        ? entry.content.slice(0, 200) + "..."
        : entry.content;
    const extra = entry.toolName ? ` [${entry.toolName}]` : "";
    console.log(`  ${entry.role}${extra}: ${content}`);
  }
}
