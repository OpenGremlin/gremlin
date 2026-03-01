import { getTask } from "./getTask.js";
import { getTasks } from "./getTasks.js";

export const taskService = { getTasks, getTask };

export type TaskService = typeof taskService;
