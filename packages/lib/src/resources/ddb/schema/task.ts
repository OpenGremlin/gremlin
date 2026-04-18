import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { number } from "dynamodb-toolbox/schema/number";
import { string } from "dynamodb-toolbox/schema/string";

import { ChatTable } from "../chatTable.js";

export const TaskEntity = new Entity({
  name: "Task",
  table: ChatTable,
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
    // Pure instructions for the assignee — what to do (not the input data).
    // Undefined for background tasks (which inherit context implicitly).
    instructions: string().optional(),
    // Natural-language description of what data the assignee needs to start.
    // Null means no specific input is required beyond the instructions.
    expectedInput: anyOf(string(), nul()).optional(),
    // Natural-language description of what the assignee should produce.
    // Be specific: comments, attachments, file formats, etc.
    // Null means no specific output contract.
    expectedOutput: anyOf(string(), nul()).optional(),
    // Number of times this task has been escalated (blocked by worker or
    // rejected by assigner). Circuit breaker to prevent infinite loops.
    // Also used to distinguish first dispatch (0) from resume (> 0).
    escalationCount: number().optional().default(0),

    // ── Tracking fields ─────────────────────────────────────
    // "open" | "in_progress" | "closed"
    status: string().optional().default("open"),
    // 0=critical, 1=high, 2=medium, 3=low, 4=backlog
    priority: number().optional(),
    // Parent task ID for epic/subtask hierarchy
    parentId: string().optional(),
    // ISO timestamp set on close
    closedAt: string().optional(),
    // Why the task was closed
    closeReason: string().optional(),
    // Hide from ready queue until this date (ISO string)
    deferUntil: string().optional(),
    // Longer description (separate from `instructions`)
    description: string().optional(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: `TASK#${id}`,
    sk: "TASK",
  }),
});

export type TaskItem = FormattedItem<typeof TaskEntity>;
