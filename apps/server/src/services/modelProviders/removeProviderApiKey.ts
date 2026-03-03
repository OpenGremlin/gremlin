import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";
import { invalidateModelCache } from "../orchestrator/model.js";

export async function removeProviderApiKey(
  ctx: ServiceContext,
  providerId: string,
): Promise<void> {
  await ctx.resources.ddb.entities.ModelProviderKey.build(DeleteItemCommand)
    .key({ providerId })
    .send();

  // Clear active model if it was using this provider
  const { Item: setting } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: "activeModel" })
    .send();

  if (setting) {
    const activeModel = JSON.parse(setting.value);
    if (activeModel.providerId === providerId) {
      await ctx.resources.ddb.entities.Setting.build(DeleteItemCommand)
        .key({ key: "activeModel" })
        .send();
    }
  }

  invalidateModelCache();
}
