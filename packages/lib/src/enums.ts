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
  UpdateTaskMessage = "updateTaskMessage",
  PostToMainLane = "postToMainLane",
  CreateDocument = "createDocument",
  UpdateDocument = "updateDocument",
  ReadDocument = "readDocument",
  AttachFile = "attachFile",
  AttachLink = "attachLink",
  EnsureSandbox = "ensureSandbox",
  RunCommand = "runCommand",
  ViewImage = "viewImage",
  WebSearch = "webSearch",
  WebFetch = "webFetch",
  ReadSkill = "readSkill",
  ReadSkillReference = "readSkillReference",
  Authenticate = "authenticate",
  SaveMemory = "saveMemory",
  RecallMemory = "recallMemory",
  ListJobs = "listJobs",
  ScheduleJob = "scheduleJob",
  UpdateJob = "updateJob",
  DelegateTask = "delegateTask",
  RequestUserInput = "requestUserInput",
}
