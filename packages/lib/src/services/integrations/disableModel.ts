import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { getEnabledModels } from "./getEnabledModels.js";

export async function disableModel(
  resources: Resources,
  providerId: string,
  modelId: string,
): Promise<boolean> {
  // Check if this model is set as any default — reject if so
  const [{ Item: defaultChat }, { Item: defaultImage }] = await Promise.all([
    resources.ddb.entities.DefaultModel.build(GetItemCommand)
      .key({ modelType: "chat" })
      .send(),
    resources.ddb.entities.DefaultModel.build(GetItemCommand)
      .key({ modelType: "image" })
      .send(),
  ]);

  if (
    defaultChat?.providerId === providerId &&
    defaultChat?.modelId === modelId
  ) {
    throw new Error(
      "Cannot disable the default chat model. Set a different default first.",
    );
  }

  if (
    defaultImage?.providerId === providerId &&
    defaultImage?.modelId === modelId
  ) {
    throw new Error(
      "Cannot disable the default image model. Set a different default first.",
    );
  }

  const enabled = await getEnabledModels(resources, providerId);
  const updated = enabled.filter((m) => m.id !== modelId);

  await resources.ddb.entities.EnabledModels.build(PutItemCommand)
    .item({ providerId, models: updated })
    .send();

  return true;
}
