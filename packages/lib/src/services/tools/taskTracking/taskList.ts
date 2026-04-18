import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { toolOk, wrapExecute } from "../toolResult.js";

export function taskList(ctx: ServiceContext) {
  return tool({
    description:
      "List tasks, optionally filtered by status, assignee, priority, or parent.",
    inputSchema: z.object({
      status: z
        .enum(["open", "in_progress", "closed"])
        .optional()
        .describe("Filter by status"),
      assignee: z.string().optional().describe("Filter by assignee agent ID"),
      priority: z
        .number()
        .int()
        .min(0)
        .max(4)
        .optional()
        .describe("Filter by priority level"),
      parentId: z
        .string()
        .optional()
        .describe("Filter to children of a specific parent task"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Max results to return"),
    }),
    execute: wrapExecute(
      "taskList",
      async ({ status, assignee, priority, parentId, limit }) => {
        const tasks = await ctx.services.tasks.listTasks(ctx, {
          status,
          assignee,
          priority,
          parentId,
        });
        return toolOk(tasks.slice(0, limit));
      },
    ),
  });
}
