import { addTaskArtifact } from "./addTaskArtifact.js";
import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { getTasksByAgent } from "./getTasksByAgent.js";
import { updateTaskStatus } from "./updateTaskStatus.js";

export const taskService = {
  addTaskArtifact,
  createTask,
  getAllTasks,
  getTask,
  getTasksByAgent,
  updateTaskStatus,
};

export type TaskService = typeof taskService;
