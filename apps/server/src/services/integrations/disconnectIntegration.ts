import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import type { ServiceContext } from "../context.js";

export async function disconnectIntegration(
  ctx: ServiceContext,
  id: string,
): Promise<boolean> {
  await ctx.resources.ddb.entities.Integration.build(DeleteItemCommand)
    .key({ id })
    .send();

  return true;
}
