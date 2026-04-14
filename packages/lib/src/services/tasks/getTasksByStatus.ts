import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function getTasksByStatus(
  ctx: ServiceContext,
  status: string,
): Promise<TaskItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Task)
    .query({ index: "gsi4", partition: `TASK_STATUS#${status}` })
    .send();

  return Items ?? [];
}
