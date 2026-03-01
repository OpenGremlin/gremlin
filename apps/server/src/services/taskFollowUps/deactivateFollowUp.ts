import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { ServiceContext } from "../context.js";

export async function deactivateFollowUp(
  ctx: ServiceContext,
  followUpId: string,
) {
  await ctx.resources.ddb.entities.TaskFollowUp.build(UpdateItemCommand)
    .item({
      id: followUpId,
      active: false,
      scheduledAt: new Date().toISOString(),
    })
    .options({ returnValues: "NONE" })
    .send();
}
