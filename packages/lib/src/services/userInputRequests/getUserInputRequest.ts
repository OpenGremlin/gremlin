import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { UserInputRequestItem } from "../../resources/ddb/schema/userInputRequest.js";
import type { ServiceContext } from "../context.js";

export async function getUserInputRequest(
  ctx: ServiceContext,
  id: string,
): Promise<UserInputRequestItem | null> {
  const { Items } = await ctx.resources.ddb.chatTable
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.UserInputRequest)
    .query({
      partition: "USER_INPUT_REQUEST",
      range: { eq: `USER_INPUT_REQUEST#${id}` },
    })
    .send();

  return Items?.[0] ?? null;
}
