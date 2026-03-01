import { createTask } from "./createTask.js";
import { getTask } from "./getTask.js";
import { getTasks } from "./getTasks.js";
import { updateTaskStatus } from "./updateTaskStatus.js";

export const taskService = { createTask, getTasks, getTask, updateTaskStatus };

export type TaskService = typeof taskService;
