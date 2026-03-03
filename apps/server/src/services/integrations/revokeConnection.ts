import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";
import { invalidateModelCache } from "../orchestrator/model.js";
import { providers } from "./providers.js";

export async function revokeConnection(
  resources: Resources,
  id: string,
): Promise<boolean> {
  const { Item } =
    await resources.ddb.entities.IntegrationConnection.build(GetItemCommand)
      .key({ id })
      .send();

  if (!Item) throw new Error(`Connection not found: ${id}`);

  await resources.ddb.entities.IntegrationConnection.build(PutItemCommand)
    .item({
      ...Item,
      isRevoked: true,
      connectionMeta: {
        accountId: Item.connectionMeta?.accountId,
      },
    })
    .send();

  // If this was an AI provider connection, clear active model if it references the same provider
  const provider = providers.find((p) => p.id === Item.providerId);
  if (provider?.category === "ai") {
    const { Item: setting } = await resources.ddb.entities.Setting.build(
      GetItemCommand,
    )
      .key({ key: "activeModel" })
      .send();

    if (setting) {
      const activeModel = JSON.parse(setting.value);
      if (activeModel.providerId === Item.providerId) {
        await resources.ddb.entities.Setting.build(DeleteItemCommand)
          .key({ key: "activeModel" })
          .send();
      }
    }

    invalidateModelCache();
  }

  return true;
}
