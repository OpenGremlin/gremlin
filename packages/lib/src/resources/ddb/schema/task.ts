import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";

import { GremlinTable } from "../table.js";

export const TaskEntity = new Entity({
  name: "Task",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    title: string(),
    message: anyOf(string(), nul()),
    createdAt: string(),
    updatedAt: string(),
    originJobId: anyOf(string(), nul()),
    emoji: anyOf(string(), nul()).optional(),
    // When set, identifies the agent that assigned this task. Absent for
    // background tasks created by the agent itself; runtime code reads
    // `task.assignerAgentId ?? task.agentId` so old rows behave as background.
    assignerAgentId: string().optional(),
    // Self-contained brief for delegated tasks. Undefined for background
    // tasks (which inherit context implicitly via the conversation).
    brief: string().optional(),
    successCriteria: string().optional(),

    // ── Tracking fields ─────────────────────────────────────
    // "open" | "in_progress" | "blocked" | "closed"
    status: string().optional().default("open"),
    // 0=critical, 1=high, 2=medium, 3=low, 4=backlog
    priority: number().optional(),
    // Parent task ID for epic/subtask hierarchy
    parentId: string().optional(),
    // "task" | "epic" | "bug" | "feature"
    issueType: string().optional().default("task"),
    // ISO timestamp set on close
    closedAt: string().optional(),
    // Why the task was closed
    closeReason: string().optional(),
    // Hide from ready queue until this date (ISO string)
    deferUntil: string().optional(),
    // Longer description (separate from `brief`)
    description: string().optional(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: "TASK",
    sk: `TASK#${id}`,
  }),
});

export type TaskItem = FormattedItem<typeof TaskEntity>;
