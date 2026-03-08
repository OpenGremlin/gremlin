import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function getTask(
  ctx: ServiceContext,
  id: string,
): Promise<TaskItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Task.build(GetItemCommand)
    .key({ id })
    .send();

  return Item ?? null;
}
