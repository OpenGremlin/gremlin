import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { getBedrockEnabledModels } from "./getBedrockEnabledModels.js";

export async function disableBedrockModel(
  resources: Resources,
  modelId: string,
): Promise<boolean> {
  const enabled = await getBedrockEnabledModels(resources);
  const updated = enabled.filter((id) => id !== modelId);

  await resources.ddb.entities.Setting.build(PutItemCommand)
    .item({
      key: "bedrockEnabledModels",
      value: JSON.stringify(updated),
    })
    .send();

  // If the default model was this Bedrock model, clear it
  const { Item: setting } = await resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: "defaultModel" })
    .send();

  if (setting) {
    const defaultModel = JSON.parse(setting.value);
    if (
      defaultModel.providerId === "bedrock" &&
      defaultModel.modelId === modelId
    ) {
      await resources.ddb.entities.Setting.build(DeleteItemCommand)
        .key({ key: "defaultModel" })
        .send();
      invalidateModelCache();
    }
  }

  return true;
}
