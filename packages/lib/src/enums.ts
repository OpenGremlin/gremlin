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
  // Task & messaging
  UpdateTaskMessage = "updateTaskMessage",
  ReplyToAssigner = "replyToAssigner",
  BackgroundTask = "backgroundTask",
  Delegate = "delegate",
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
