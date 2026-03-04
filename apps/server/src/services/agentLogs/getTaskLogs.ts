import type { ServiceContext } from "../context.js";
import { queryLogs } from "./getAgentLogs.js";
import type { AgentLogConnectionModel, PaginationArgs } from "./pagination.js";

export async function getTaskLogs(
  ctx: ServiceContext,
  taskId: string,
  args: PaginationArgs = {},
): Promise<AgentLogConnectionModel> {
  return queryLogs(ctx, `LOG_TASK#${taskId}`, args);
}
