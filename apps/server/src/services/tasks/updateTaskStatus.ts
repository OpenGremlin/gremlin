import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

type TaskStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "ABANDONED";

export async function updateTaskStatus(
  ctx: ServiceContext,
  taskId: string,
  status: TaskStatus,
  statusReason?: string,
) {
  const now = new Date().toISOString();
  const isTerminal = status === "COMPLETED" || status === "FAILED" || status === "ABANDONED";

  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  await ctx.resources.ddb.entities.Task.build(UpdateItemCommand)
    .item({
      id: taskId,
      agentId: task.agentId,
      createdAt: task.createdAt,
      status,
      statusReason: statusReason ?? null,
      updatedAt: now,
      ...(isTerminal ? { completedAt: now } : {}),
    })
    .options({ returnValues: "NONE" })
    .send();
}
