// ── Layout Modes ──────────────────────────────────────────────
export type LayoutMode = "idle" | "focus" | "split" | "fullscreen";

// ── Avatar ───────────────────────────────────────────────────
export type AvatarState = "dormant" | "attentive" | "active" | "waiting";

// ── Modules ──────────────────────────────────────────────────
export type ModuleType =
  | "video-player"
  | "news-card"
  | "chart"
  | "image-gallery"
  | "spotify-player"
  | "task-checklist"
  | "weather"
  | "calendar"
  | "email-digest"
  | "news-ticker"
  | "traffic"
  | "clock";

export type ModuleLifecycle =
  | "spawned"
  | "loading"
  | "active"
  | "minimized"
  | "completed"
  | "dismissed";

export interface ScreenModule {
  id: string;
  type: ModuleType;
  lifecycle: ModuleLifecycle;
  data: Record<string, unknown>;
}

// ── Phone → Server Messages ──────────────────────────────────
export interface CommandMessage {
  type: "command";
  text: string;
  inputType: "text" | "voice";
  profileId: string;
}

export interface ProfileActivateMessage {
  type: "profile_activate";
  profileId: string;
}

export interface ProfileDeactivateMessage {
  type: "profile_deactivate";
}

export interface PermissionResponseMessage {
  type: "permission_response";
  requestId: string;
  approved: boolean;
  scope?: string;
}

export interface ModuleActionMessage {
  type: "module_action";
  moduleId: string;
  action: "dismiss" | "pin" | "expand" | "minimize";
}

export type PhoneToServerMessage =
  | CommandMessage
  | ProfileActivateMessage
  | ProfileDeactivateMessage
  | PermissionResponseMessage
  | ModuleActionMessage;

// ── Server → Phone Messages ──────────────────────────────────
export interface PermissionRequestMessage {
  type: "permission_request";
  requestId: string;
  resource: string;
  agent: string;
  taskContext: string;
}

export interface TaskUpdateMessage {
  type: "task_update";
  taskId: string;
  status: "running" | "complete" | "failed";
  summary: string;
}

export type ServerToPhoneMessage = PermissionRequestMessage | TaskUpdateMessage;

// ── Server → Screen Messages ─────────────────────────────────
export interface LayoutStateMessage {
  type: "layout_state";
  mode: LayoutMode;
  modules: ScreenModule[];
  avatar: AvatarState;
  profileId: string;
}

export interface AvatarStateMessage {
  type: "avatar_state";
  state: AvatarState;
  message?: string;
}

export type ServerToScreenMessage = LayoutStateMessage | AvatarStateMessage;
