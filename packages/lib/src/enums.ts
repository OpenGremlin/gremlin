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
  // Legacy task tools — kept so old AgentLog entries still parse through
  // GraphQL without crashing the client. Do not use in new code.
  /** @deprecated Use taskCreate instead */
  BackgroundTask = "backgroundTask",
  /** @deprecated Use taskCreate instead */
  Delegate = "delegate",
  /** @deprecated Use taskClose instead */
  CompleteTask = "completeTask",
  /** @deprecated Use taskUpdate instead */
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

  // Posts
  CreatePost = "createPost",

  // Memory & jobs
  SaveMemory = "saveMemory",
  RecallMemory = "recallMemory",
  ListJobs = "listJobs",
  ScheduleJob = "scheduleJob",
  UpdateJob = "updateJob",

  // Time
  GetCurrentTime = "getCurrentTime",
}
