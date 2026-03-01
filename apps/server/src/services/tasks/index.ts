import { createTask } from "./createTask.js";
import { getAllTasks } from "./getAllTasks.js";
import { getTask } from "./getTask.js";
import { getTasks } from "./getTasks.js";
import { updateTaskStatus } from "./updateTaskStatus.js";

export const taskService = { createTask, getAllTasks, getTasks, getTask, updateTaskStatus };

export type TaskService = typeof taskService;
