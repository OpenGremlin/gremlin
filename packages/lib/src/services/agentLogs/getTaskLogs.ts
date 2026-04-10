import type { ServiceContext } from "../context.js";
import { queryLogs } from "./getAgentLogs.js";
import { getChatLane } from "./getChatLane.js";
import type { AgentLogConnectionModel, PaginationArgs } from "./pagination.js";

export async function getTaskLogs(
  ctx: ServiceContext,
  taskId: string,
  args: PaginationArgs = {},
  agentId?: string,
): Promise<AgentLogConnectionModel> {
  let clearedAt: string | undefined;
  if (agentId) {
    const chatLane = await getChatLane(ctx, agentId, `task:${taskId}`);
    clearedAt = chatLane?.clearedAt;
  }
  return queryLogs(ctx, `LOG_TASK#${taskId}`, args, clearedAt);
}
