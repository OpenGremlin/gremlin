import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { TaskFollowUpItem } from "../../resources/ddb/schema/taskFollowUp.js";
import type { ServiceContext } from "../context.js";

export async function getActiveFollowUps(
  ctx: ServiceContext,
): Promise<TaskFollowUpItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.TaskFollowUp)
    .query({
      index: "gsi1",
      partition: "FOLLOWUP_ACTIVE",
    })
    .send();

  return Items ?? [];
}
