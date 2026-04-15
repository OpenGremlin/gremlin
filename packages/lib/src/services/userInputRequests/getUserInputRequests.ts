import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { UserInputRequestItem } from "../../resources/ddb/schema/userInputRequest.js";
import type { ServiceContext } from "../context.js";

export async function getUserInputRequests(
  ctx: ServiceContext,
): Promise<UserInputRequestItem[]> {
  const { Items } = await ctx.resources.ddb.chatTable
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.UserInputRequest)
    .query({ partition: "USER_INPUT_REQUEST" })
    .send();

  return Items ?? [];
}
