import { addTaskAttachment } from "./addTaskAttachment.js";
import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { getTaskAttachments } from "./getTaskAttachments.js";
import { getTasksByAgent } from "./getTasksByAgent.js";
import { getTasksByParent } from "./getTasksByParent.js";
import { getTasksByStatus } from "./getTasksByStatus.js";
import { selectAndSetTaskEmoji } from "./selectTaskEmoji.js";
import { addComment, getComments, getLatestComment } from "./taskComments.js";
import {
  addTaskDep,
  getBlockedTasks,
  getReadyWork,
  getTaskDepTree,
  removeTaskDep,
} from "./taskDeps.js";
import {
  closeTask,
  incrementEscalationCount,
  reopenTask,
  updateTaskFields,
  updateTaskStatus,
} from "./taskLifecycle.js";
import { getChildren, listTasks, showTask } from "./taskQueries.js";
import { updateAttachmentPaths } from "./updateAttachmentPaths.js";
import { updateTaskMessage } from "./updateTaskMessage.js";

export type { Attachment } from "./attachment.js";
export type {
  BlockedTasksFilter,
  DepTreeNode,
  ReadyWorkFilter,
} from "./taskDeps.js";
export type { ListTasksFilters, TaskDetails } from "./taskQueries.js";

export const taskService = {
  addComment,
  addTaskAttachment,
  addTaskDep,
  closeTask,
  createTask,
  getAllTasks,
  getChildren,
  getComments,
  incrementEscalationCount,
  getLatestComment,
  getTask,
  getTaskAttachments,
  getBlockedTasks,
  getReadyWork,
  getTaskDepTree,
  getTasksByAgent,
  getTasksByParent,
  getTasksByStatus,
  listTasks,
  removeTaskDep,
  reopenTask,
  selectAndSetTaskEmoji,
  showTask,
  updateAttachmentPaths,
  updateTaskFields,
  updateTaskMessage,
  updateTaskStatus,
};

export type TaskService = typeof taskService;
