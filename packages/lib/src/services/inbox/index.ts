import { ringDoorbell } from "./consumer.js";
import { createCronSchedule } from "./createCronSchedule.js";
import { deleteCronSchedule } from "./deleteCronSchedule.js";
import { enqueueWork } from "./enqueueWork.js";
import { getStaleUnreadTargets } from "./getStaleUnreadAgentIds.js";
import { getUnreadItems } from "./getUnreadItems.js";
import { markRead } from "./markRead.js";
export const inboxService = {
  enqueueWork,
  getStaleUnreadTargets,
  getUnreadItems,
  markRead,
  ringDoorbell,
  createCronSchedule,
  deleteCronSchedule,
};

export type InboxService = typeof inboxService;
