import type { TaskItem } from "../../resources/ddb/schema/task.js";

export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface TaskEdgeModel {
  cursor: string;
  node: TaskItem;
}

export interface TaskPageInfoModel {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface TaskConnectionModel {
  edges: TaskEdgeModel[];
  pageInfo: TaskPageInfoModel;
}

export function encodeCursor(createdAt: string): string {
  return Buffer.from(createdAt).toString("base64");
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

export function buildConnection(
  items: TaskItem[],
  args: PaginationArgs,
  hasMore: boolean,
): TaskConnectionModel {
  const isBackward = args.last != null;

  const edges: TaskEdgeModel[] = items.map((item) => ({
    cursor: encodeCursor(item.createdAt),
    node: item,
  }));

  const pageInfo: TaskPageInfoModel = {
    hasNextPage: isBackward ? args.before != null : hasMore,
    hasPreviousPage: isBackward ? hasMore : args.after != null,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
  };

  return { edges, pageInfo };
}
