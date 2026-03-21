import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { UserInputRequestStatus } from "../../enums.js";
import type { UserInputRequestItem } from "../../resources/ddb/schema/userInputRequest.js";
import type { ServiceContext } from "../context.js";
import { getUserInputRequest } from "./getUserInputRequest.js";

export async function resolveUserInputRequest(
  ctx: ServiceContext,
  id: string,
  action: string,
): Promise<UserInputRequestItem> {
  const existing = await getUserInputRequest(ctx, id);
  if (!existing) throw new Error(`UserInputRequest ${id} not found`);

  const updated = {
    ...existing,
    status: UserInputRequestStatus.Resolved,
    resolvedAction: action,
  };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...updated,
        _et: "UserInputRequest",
        pk: "USER_INPUT_REQUEST",
        sk: `USER_INPUT_REQUEST#${id}`,
        gsi1pk: `INPUT_REQUEST_STATUS#${UserInputRequestStatus.Resolved}`,
        gsi1sk: existing.createdAt,
      },
    }),
  );

  ctx.resources.pubsub.publish("pendingItemsUpdated");

  // Enqueue the reply — the consumer writes it to the log with full context
  ctx.services.inbox
    .enqueueWork(ctx, existing.agentId, existing.lane, {
      type: "user_input_request_reply",
      payload: { requestId: id, action },
    })
    .catch((err) =>
      ctx.log.error(
        { err, requestId: id, component: "userInputRequests" },
        "Failed to enqueue user input request reply",
      ),
    );

  return updated;
}
