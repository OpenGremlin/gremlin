import { getStatus } from "./getStatus.js";
import { getStatuses } from "./getStatuses.js";

export const statusService = { getStatuses, getStatus };

export type StatusService = typeof statusService;
