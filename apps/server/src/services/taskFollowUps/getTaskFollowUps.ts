import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { TaskFollowUpItem } from "../../resources/ddb/schema/taskFollowUp.js";
import type { ServiceContext } from "../context.js";

export async function getTaskFollowUps(
  ctx: ServiceContext,
  taskId: string,
): Promise<TaskFollowUpItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.TaskFollowUp)
    .query({
      partition: "TASK_FOLLOW_UP",
    })
    .send();

  return (Items ?? []).filter((item) => item.taskId === taskId);
}
