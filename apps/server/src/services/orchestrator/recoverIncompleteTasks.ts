import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";
import { createFollowUp } from "../taskFollowUps/createFollowUp.js";
import { runTaskLane } from "./runTaskLane.js";

/**
 * On server startup, find all incomplete tasks and ensure they
 * will be resumed. See docs/agent-orchestration.md "Service Restart Recovery".
 */
export async function recoverIncompleteTasks(ctx: ServiceContext) {
  // Query all tasks — filter in-memory for non-terminal status
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Task)
    .query({ partition: "TASK" })
    .send();

  const incomplete = (Items ?? []).filter((t: TaskItem) =>
    ["pending", "running", "waiting"].includes(t.status),
  );

  if (incomplete.length === 0) return;
  console.log(
    `[orchestrator] Recovering ${incomplete.length} incomplete task(s)`,
  );

  for (const task of incomplete) {
    if (task.status === "waiting") {
      // Check if there's already an active follow-up
      const followUps =
        await ctx.services.taskFollowUps.getTaskFollowUps(ctx, task.id);
      const hasActive = followUps.some((f) => f.active);

      if (hasActive) {
        // Follow-up timer will handle it naturally
        console.log(
          `[orchestrator] Task ${task.id} has active follow-up, skipping`,
        );
        continue;
      }

      // No active follow-up — create an immediate one
      await createFollowUp(ctx, {
        taskId: task.id,
        agentId: task.agentId,
        delayMs: 0,
        prompt:
          "Task was waiting but had no scheduled follow-up. Review AgentLog and resume.",
      });
    } else if (task.status === "running") {
      // Was mid-execution when server died — schedule immediate resume
      await createFollowUp(ctx, {
        taskId: task.id,
        agentId: task.agentId,
        delayMs: 0,
        prompt: "Task was interrupted. Review AgentLog and resume.",
      });
    } else if (task.status === "pending") {
      // Never started — dispatch now
      runTaskLane(ctx, task.id, "Begin this task.").catch((err) => {
        console.error(
          `[orchestrator] Failed to start pending task ${task.id}:`,
          err,
        );
      });
    }
  }
}
