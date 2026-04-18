import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { toolOk, wrapExecute } from "../toolResult.js";

/**
 * @param currentTaskId  When set, new tasks are created as children of this
 *                       task. Pass the caller's taskId in a task lane; omit
 *                       in the main lane (tasks become top-level).
 */
export function taskCreate(ctx: ServiceContext, currentTaskId?: string) {
  return tool({
    description:
      "Create a new task in the project tracker. The UI renders a rich card automatically — do NOT repeat the task structure or IDs in your text response.",
    inputSchema: z.object({
      title: z.string().describe("Brief title, 3-5 words"),
      instructions: z
        .string()
        .optional()
        .describe(
          "What to do. Must be self-contained when assigning to another agent (they can't see your conversation).",
        ),
      description: z
        .string()
        .optional()
        .describe(
          "Additional context or background. Use instructions for the actual assignment.",
        ),
      expectedInput: z
        .string()
        .nullable()
        .optional()
        .describe(
          "What data the assignee needs to start work. Describe what should be provided (e.g. 'list of file paths', 'customer error log'). Null means no specific input required.",
        ),
      expectedOutput: z
        .string()
        .nullable()
        .optional()
        .describe(
          "What the assignee should produce. Be specific: should it be a comment, an attachment, or both? What file format (markdown, JSON, CSV)? Example: 'attach a JSON file with {passed: number, failed: number} and add a summary comment'. Null means no specific output contract.",
        ),
      priority: z
        .number()
        .int()
        .min(0)
        .max(4)
        .optional()
        .describe("Priority 0 (critical) to 4 (backlog)"),
      assignee: z
        .string()
        .describe(
          "Agent ID to assign this task to. Required — every task must have an owner.",
        ),
      emoji: z.string().describe("A single emoji that best fits the task"),
      blockedBy: z
        .array(z.string())
        .optional()
        .describe("Task IDs that must complete before this task can start"),
    }),
    execute: wrapExecute(
      "taskCreate",
      async ({
        title,
        description,
        instructions,
        expectedInput,
        expectedOutput,
        priority,
        assignee,
        emoji,
        blockedBy,
      }) => {
        const task = await ctx.services.tasks.createTask(ctx, {
          agentId: assignee,
          title,
          description,
          instructions,
          expectedInput,
          expectedOutput,
          priority,
          parentId: currentTaskId,
          emoji,
        });

        if (blockedBy && blockedBy.length > 0) {
          for (const depId of blockedBy) {
            await ctx.services.tasks.addTaskDep(ctx, task.id, depId);
          }
        }

        return toolOk(task);
      },
    ),
  });
}
