import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { getEnabledModels } from "./getEnabledModels.js";

export async function disableModel(
  resources: Resources,
  providerId: string,
  modelId: string,
): Promise<boolean> {
  const enabled = await getEnabledModels(resources, providerId);
  const updated = enabled.filter((m) => m.id !== modelId);

  await resources.ddb.entities.EnabledModels.build(PutItemCommand)
    .item({ providerId, models: updated })
    .send();

  // If the default model was this model, clear it
  const { Item: defaultModel } =
    await resources.ddb.entities.DefaultModel.build(GetItemCommand)
      .key({ modelType: "chat" })
      .send();

  if (
    defaultModel &&
    defaultModel.providerId === providerId &&
    defaultModel.modelId === modelId
  ) {
    await resources.ddb.entities.DefaultModel.build(DeleteItemCommand)
      .key({ modelType: "chat" })
      .send();
    invalidateModelCache();
  }

  return true;
}
