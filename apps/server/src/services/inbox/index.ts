import { ringDoorbell } from "./consumer.js";
import { createCronSchedule } from "./createCronSchedule.js";
import { createFollowUpSchedule } from "./createFollowUpSchedule.js";
import { deleteCronSchedule } from "./deleteCronSchedule.js";
import { enqueueWork } from "./enqueueWork.js";
import { getUnreadItems } from "./getUnreadItems.js";
import { markRead } from "./markRead.js";

export const inboxService = {
  enqueueWork,
  getUnreadItems,
  markRead,
  ringDoorbell,
  createCronSchedule,
  createFollowUpSchedule,
  deleteCronSchedule,
};

export type InboxService = typeof inboxService;
