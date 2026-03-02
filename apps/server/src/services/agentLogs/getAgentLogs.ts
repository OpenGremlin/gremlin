import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { ServiceContext } from "../context.js";
import {
  type AgentLogConnectionModel,
  type PaginationArgs,
  buildConnection,
  decodeCursor,
} from "./pagination.js";

export async function getAgentLogs(
  ctx: ServiceContext,
  agentId: string,
  args: PaginationArgs = {},
): Promise<AgentLogConnectionModel> {
  const isBackward = args.last != null;
  const limit = args.first ?? args.last ?? 50;
  const fetchLimit = limit + 1;

  const partition = `LOG_AGENT#${agentId}`;

  let query;
  if (args.after) {
    query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.AgentLog)
      .query({ index: "gsi1", partition, range: { gt: decodeCursor(args.after) } })
      .options({ limit: fetchLimit, reverse: isBackward });
  } else if (args.before) {
    query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.AgentLog)
      .query({ index: "gsi1", partition, range: { lt: decodeCursor(args.before) } })
      .options({ limit: fetchLimit, reverse: isBackward });
  } else {
    query = ctx.resources.ddb.table
      .build(QueryCommand)
      .entities(ctx.resources.ddb.entities.AgentLog)
      .query({ index: "gsi1", partition })
      .options({ limit: fetchLimit, reverse: isBackward });
  }

  const { Items } = await query.send();
  let items = (Items ?? []).filter((i) => !i.internal);

  const hasMore = items.length > limit;
  if (hasMore) {
    items = items.slice(0, limit);
  }

  if (isBackward) {
    items.reverse();
  }

  return buildConnection(items, args, hasMore);
}
