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

  // If the active model was this Bedrock model, clear it
  const { Item: setting } = await resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: "activeModel" })
    .send();

  if (setting) {
    const activeModel = JSON.parse(setting.value);
    if (
      activeModel.providerId === "bedrock" &&
      activeModel.modelId === modelId
    ) {
      await resources.ddb.entities.Setting.build(DeleteItemCommand)
        .key({ key: "activeModel" })
        .send();
      invalidateModelCache();
    }
  }

  return true;
}
