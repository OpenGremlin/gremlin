import type { AgentLogItem } from "../../resources/ddb/schema/agentLog.js";
import type { Connection, Edge } from "../pagination.js";

export type {
  PageInfo as PageInfoModel,
  PaginationArgs,
} from "../pagination.js";
export { buildConnection, decodeCursor, encodeCursor } from "../pagination.js";

export type AgentLogEdgeModel = Edge<AgentLogItem>;
export type AgentLogConnectionModel = Connection<AgentLogItem>;
