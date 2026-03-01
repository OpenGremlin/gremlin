import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function getTask(
  ctx: ServiceContext,
  id: string,
): Promise<TaskItem | null> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Task)
    .query({ partition: "TASK", range: { eq: `TASK#${id}` } })
    .send();

  return Items?.[0] ?? null;
}
