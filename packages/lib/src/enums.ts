export enum UserInputRequestStatus {
  Dismissed = "DISMISSED",
  Pending = "PENDING",
  Resolved = "RESOLVED",
}

export enum CommandApprovalStatus {
  Pending = "PENDING",
  Resolved = "RESOLVED",
}

export enum CommandApprovalDecision {
  AllowOnce = "ALLOW_ONCE",
  AllowAlways = "ALLOW_ALWAYS",
  Deny = "DENY",
}

export enum ToolName {
  // Legacy task tools — removed in beads upgrade but kept in the enum so old
  // AgentLog entries (which store toolName as a string) still parse through
  // GraphQL without crashing the client. Do not use in new code.
  /** @deprecated Use beads_create_issue instead */
  BackgroundTask = "backgroundTask",
  /** @deprecated Use beads_create_issue instead */
  Delegate = "delegate",
  /** @deprecated Use beads_close_issue instead */
  CompleteTask = "completeTask",
  /** @deprecated Use beads_update_issue instead */
  UpdateTask = "updateTask",

  // Task & messaging
  RequestUserInput = "requestUserInput",

  // File editor
  ReadFile = "readFile",
  WriteFile = "writeFile",
  EditFile = "editFile",
  ListFiles = "listFiles",
  Glob = "glob",
  Grep = "grep",

  // Attachments
  AttachFile = "attachFile",
  AttachLink = "attachLink",

  // Sandbox
  EnsureSandbox = "ensureSandbox",
  RunCommand = "runCommand",
  ReadCommandOutput = "readCommandOutput",

  // Media
  ViewImage = "viewImage",
  GenerateImage = "generateImage",
  GenerateSpeech = "generateSpeech",

  // Web
  WebSearch = "webSearch",
  WebFetch = "webFetch",

  // Skills
  ReadSkill = "readSkill",
  ReadSkillReference = "readSkillReference",
  Authenticate = "authenticate",

  // Memory & jobs
  SaveMemory = "saveMemory",
  RecallMemory = "recallMemory",
  ListJobs = "listJobs",
  ScheduleJob = "scheduleJob",
  UpdateJob = "updateJob",
}
