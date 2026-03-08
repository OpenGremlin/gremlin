import { addTaskArtifact } from "./addTaskArtifact.js";
import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { getTasksByAgent } from "./getTasksByAgent.js";
import { selectAndSetTaskImage } from "./selectTaskImage.js";
import { updateTaskMessage } from "./updateTaskMessage.js";

export const taskService = {
  addTaskArtifact,
  createTask,
  getAllTasks,
  getTask,
  getTasksByAgent,
  selectAndSetTaskImage,
  updateTaskMessage,
};

export type TaskService = typeof taskService;
