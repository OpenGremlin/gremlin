import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { UserInputRequestStatus } from "../../enums.js";
import type { UserInputRequestItem } from "../../resources/ddb/schema/userInputRequest.js";
import type { ServiceContext } from "../context.js";
import { getUserInputRequest } from "./getUserInputRequest.js";

export async function dismissUserInputRequest(
  ctx: ServiceContext,
  id: string,
): Promise<UserInputRequestItem> {
  const existing = await getUserInputRequest(ctx, id);
  if (!existing) throw new Error(`UserInputRequest ${id} not found`);

  const updated = { ...existing, status: UserInputRequestStatus.Dismissed };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...updated,
        _et: "UserInputRequest",
        pk: "USER_INPUT_REQUEST",
        sk: `USER_INPUT_REQUEST#${id}`,
        gsi1pk: `INPUT_REQUEST_STATUS#${UserInputRequestStatus.Dismissed}`,
        gsi1sk: existing.createdAt,
      },
    }),
  );

  ctx.resources.pubsub.publish("pendingItemsUpdated");

  return updated;
}
