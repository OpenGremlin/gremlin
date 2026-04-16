import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { type GremlinToolResult, toolOk, wrapExecute } from "../toolResult.js";

export function taskDep(ctx: ServiceContext) {
  return tool({
    description:
      "Add or remove a dependency between tasks. A dependency means taskId is blocked by dependsOnId.",
    inputSchema: z.object({
      taskId: z.string().describe("The task that is (or will be) blocked"),
      dependsOnId: z.string().describe("The task that must complete first"),
      action: z
        .enum(["add", "remove"])
        .describe("Whether to add or remove the dependency"),
    }),
    execute: wrapExecute(
      "taskDep",
      async ({
        taskId,
        dependsOnId,
        action,
      }): Promise<
        GremlinToolResult<
          | {
              dependency: Awaited<
                ReturnType<typeof ctx.services.tasks.addTaskDep>
              >;
            }
          | { removed: { taskId: string; dependsOnId: string } }
        >
      > => {
        if (action === "add") {
          const dep = await ctx.services.tasks.addTaskDep(
            ctx,
            taskId,
            dependsOnId,
          );
          return toolOk({ dependency: dep });
        }
        await ctx.services.tasks.removeTaskDep(ctx, taskId, dependsOnId);
        return toolOk({ removed: { taskId, dependsOnId } });
      },
    ),
  });
}
