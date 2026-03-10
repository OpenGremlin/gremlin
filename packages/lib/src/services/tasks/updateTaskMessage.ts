import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

export async function updateTaskMessage(
  ctx: ServiceContext,
  taskId: string,
  message: string,
  opts?: { completed?: boolean },
) {
  const now = new Date().toISOString();

  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
    .item({
      id: taskId,
      agentId: task.agentId,
      createdAt: task.createdAt,
      message,
      updatedAt: now,
      ...(opts?.completed ? { completedAt: now } : {}),
    })
    .options({ returnValues: "NONE" })
    .send();

  ctx.resources.pubsub.publish(`taskUpdated:${taskId}`, {
    ...task,
    message,
    updatedAt: now,
    ...(opts?.completed ? { completedAt: now } : {}),
  });

  // Notify main lane when task completes
  if (opts?.completed) {
    const artifacts = task.artifacts ?? [];
    const artifactList =
      artifacts.length > 0 ? `\nArtifacts: ${artifacts.join(", ")}` : "";

    await ctx.services.orchestrator.writeAgentLog(ctx, {
      agentId: task.agentId,
      taskId: null,
      role: "SYSTEM",
      content: `Task "${task.title}" completed: ${message}${artifactList}`,
    });

    void ctx.services.orchestrator
      .runMainLane(ctx, task.agentId)
      .catch((err) =>
        ctx.log.error(
          { err, taskId, component: "task-completion" },
          "Main lane notification failed",
        ),
      );
  }
}
