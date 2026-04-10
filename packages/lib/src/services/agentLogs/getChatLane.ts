import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import {
  type ChatLaneItem,
  chatLaneId,
} from "../../resources/ddb/schema/chatLane.js";
import type { ServiceContext } from "../context.js";

/** Fetch the ChatLane record for a given agent + lane, or null if none. */
export async function getChatLane(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
): Promise<ChatLaneItem | null> {
  const id = chatLaneId(agentId, lane);
  const { Item } = await ctx.resources.ddb.entities.ChatLane.build(
    GetItemCommand,
  )
    .key({ id })
    .send();
  return Item ?? null;
}
