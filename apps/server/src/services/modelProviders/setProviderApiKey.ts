import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";

export async function setProviderApiKey(
  ctx: ServiceContext,
  providerId: string,
  apiKey: string,
): Promise<void> {
  await ctx.resources.ddb.entities.ModelProviderKey.build(PutItemCommand)
    .item({
      providerId,
      apiKey,
      createdAt: new Date().toISOString(),
    })
    .send();
}
