import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { chatLaneId } from "../../resources/ddb/schema/chatLane.js";
import type { ServiceContext } from "../context.js";

/**
 * Clear visible agent log history for a lane. Sets `clearedAt` to now
 * so that subsequent log queries exclude everything before this point.
 */
export async function clearAgentLog(
  ctx: ServiceContext,
  agentId: string,
  taskId?: string | null,
): Promise<{ clearedAt: string }> {
  const lane = taskId ? `task:${taskId}` : "main";
  const id = chatLaneId(agentId, lane);
  const clearedAt = new Date().toISOString();

  await ctx.resources.ddb.entities.ChatLane.build(PutItemCommand)
    .item({ id, agentId, lane, clearedAt })
    .send();

  return { clearedAt };
}
