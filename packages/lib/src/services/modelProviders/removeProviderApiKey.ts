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

  // Clear default model if it was using this provider
  const { Item: setting } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: "defaultModel" })
    .send();

  if (setting) {
    const defaultModel = JSON.parse(setting.value);
    if (defaultModel.providerId === providerId) {
      await ctx.resources.ddb.entities.Setting.build(DeleteItemCommand)
        .key({ key: "defaultModel" })
        .send();
    }
  }

  invalidateModelCache();
}
