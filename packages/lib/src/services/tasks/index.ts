import { addTaskAttachment } from "./addTaskAttachment.js";
import { completeTask } from "./completeTask.js";
import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { getTasksByAgent } from "./getTasksByAgent.js";
import { selectAndSetTaskEmoji } from "./selectTaskEmoji.js";
import { updateTaskMessage } from "./updateTaskMessage.js";

export type { Attachment } from "./attachment.js";

export const taskService = {
  addTaskAttachment,
  completeTask,
  createTask,
  getAllTasks,
  getTask,
  getTasksByAgent,
  selectAndSetTaskEmoji,
  updateTaskMessage,
};

export type TaskService = typeof taskService;
