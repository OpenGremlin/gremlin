import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function getTasksByParent(
  ctx: ServiceContext,
  parentId: string,
): Promise<TaskItem[]> {
  const { Items } = await ctx.resources.ddb.chatTable
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Task)
    .query({ index: "gsi3", partition: `TASK_PARENT#${parentId}` })
    .send();

  return Items ?? [];
}
