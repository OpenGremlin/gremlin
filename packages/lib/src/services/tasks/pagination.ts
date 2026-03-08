import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { Connection, Edge } from "../pagination.js";

export type {
  PageInfo as TaskPageInfoModel,
  PaginationArgs,
} from "../pagination.js";
export { buildConnection, decodeCursor, encodeCursor } from "../pagination.js";

export type TaskEdgeModel = Edge<TaskItem>;
export type TaskConnectionModel = Connection<TaskItem>;
