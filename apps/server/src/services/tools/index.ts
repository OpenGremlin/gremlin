export { webSearch } from "./webSearch.js";
export { sendEmail, checkInbox } from "./email.js";
export { requestApprovalTool } from "./requestApproval.js";
export { delegateTaskTool } from "./delegateTask.js";
export { updateTaskMessageTool } from "./updateTaskMessage.js";
export {
  createDocumentTool,
  updateDocumentTool,
  getWorkspacePath,
  slugify,
  uniqueFilePath,
  parseFrontmatter,
  formatWithFrontmatter,
} from "./documents.js";
export { saveMemoryTool, recallMemoryTool } from "./memory.js";

import { webSearch } from "./webSearch.js";
import { sendEmail, checkInbox } from "./email.js";

export const defaultTools = { webSearch, sendEmail, checkInbox };
