import { addTaskAttachment } from "./addTaskAttachment.js";
import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { getTasksByAgent } from "./getTasksByAgent.js";
import { postToMainLane } from "./postToMainLane.js";
import { selectAndSetTaskEmoji } from "./selectTaskEmoji.js";
import { updateTaskMessage } from "./updateTaskMessage.js";

export type { Attachment } from "./attachment.js";

export const taskService = {
  addTaskAttachment,
  createTask,
  getAllTasks,
  getTask,
  getTasksByAgent,
  postToMainLane,
  selectAndSetTaskEmoji,
  updateTaskMessage,
};

export type TaskService = typeof taskService;
