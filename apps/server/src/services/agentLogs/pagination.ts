import type { AgentLogItem } from "../../resources/ddb/schema/agentLog.js";

export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface AgentLogEdgeModel {
  cursor: string;
  node: AgentLogItem;
}

export interface PageInfoModel {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface AgentLogConnectionModel {
  edges: AgentLogEdgeModel[];
  pageInfo: PageInfoModel;
}

export function encodeCursor(createdAt: string): string {
  return Buffer.from(createdAt).toString("base64");
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

export function buildConnection(
  items: AgentLogItem[],
  args: PaginationArgs,
  hasMore: boolean,
): AgentLogConnectionModel {
  const isBackward = args.last != null;

  const edges: AgentLogEdgeModel[] = items.map((item) => ({
    cursor: encodeCursor(item.createdAt),
    node: item,
  }));

  const pageInfo: PageInfoModel = {
    hasNextPage: isBackward ? args.before != null : hasMore,
    hasPreviousPage: isBackward ? hasMore : args.after != null,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
  };

  return { edges, pageInfo };
}
