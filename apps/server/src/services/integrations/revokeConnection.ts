import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { Resources } from "../../resources/index.js";

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

  return true;
}
