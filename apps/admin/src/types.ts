/** A document artifact created by an agent */
export interface Document {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

/** A chat log entry */
export interface AgentLogEntry {
  id: string;
  role: "AGENT" | "USER" | "SYSTEM" | "TOOL";
  content: string;
  toolName: string | null;
  toolInput: string | null;
  toolResult: string | null;
  taskId: string | null;
  createdAt: string;
}

/** A task created by an agent */
export interface Task {
  id: string;
  agent: Pick<Agent, "id" | "name" | "status" | "imageUrl">;
  title: string;
  status:
    | "pending"
    | "running"
    | "waiting"
    | "completed"
    | "failed"
    | "abandoned";
  message: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  originJobId: string | null;
  artifacts: string[];
  documents: Document[];
  logs?: {
    edges: { cursor?: string; node: AgentLogEntry }[];
    pageInfo?: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
}

/** A scheduled agent job */
export interface AgentJob {
  id: string;
  name: string;
  description: string;
  recurrence: string;
  cronExpression: string | null;
  agent: Pick<Agent, "id" | "name" | "status" | "imageUrl">;
  status: "running" | "idle" | "error" | "paused";
  lastRun: string | null;
  nextRun: string | null;
  tasks: Task[];
}

export type AuthMethod = "OAUTH" | "API_KEY" | "TOKEN";

/** A linked third-party service */
export interface Integration {
  id: string;
  service: string;
  icon: string;
  description: string;
  account: string;
  connectedAt: string;
  authMethod: AuthMethod;
  permissions: Permission[];
}

export interface Permission {
  scope: string;
  label: string;
  enabled: boolean;
}

/** An agent persona */
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  portraitId: string;
  imageUrl: string;
  soul: string;
  status: "ACTIVE" | "SCHEDULED" | "IDLE" | "BLOCKED";
  statusReason: string | null;
}

/** A notification from an agent */
export interface Notification {
  id: string;
  agent: Pick<Agent, "id" | "name" | "status" | "imageUrl">;
  type: "PERMISSION" | "APPROVAL";
  turnId: string | null;
  message: string;
  actions: NotificationAction[];
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  resolvedAction: string | null;
  createdAt: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  style: "primary" | "secondary";
}

/** An installed agent skill */
export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  installed: boolean;
  category: string;
  homepage: string | null;
  requiredEnv: string[];
}
