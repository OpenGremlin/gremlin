import { addTaskArtifact } from "./addTaskArtifact.js";
import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { updateTaskStatus } from "./updateTaskStatus.js";

export const taskService = { addTaskArtifact, createTask, getAllTasks, getTask, updateTaskStatus };

export type TaskService = typeof taskService;
