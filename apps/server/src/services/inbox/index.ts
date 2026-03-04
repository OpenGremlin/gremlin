import { ringDoorbell } from "./consumer.js";
import { enqueueWork } from "./enqueueWork.js";
import { getUnreadItems } from "./getUnreadItems.js";
import { markRead } from "./markRead.js";
import {
  createCronSchedule,
  createFollowUpSchedule,
  deleteCronSchedule,
} from "./scheduler.js";

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
