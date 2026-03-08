import { ringDoorbell } from "./consumer.js";
import { createCronSchedule } from "./createCronSchedule.js";
import { createFollowUpSchedule } from "./createFollowUpSchedule.js";
import { deleteCronSchedule } from "./deleteCronSchedule.js";
import { enqueueWork } from "./enqueueWork.js";
import { getStaleUnreadAgentIds } from "./getStaleUnreadAgentIds.js";
import { getUnreadItems } from "./getUnreadItems.js";
import { markRead } from "./markRead.js";
import { ringSqsDoorbells } from "./ringSqsDoorbells.js";

export const inboxService = {
  enqueueWork,
  getStaleUnreadAgentIds,
  getUnreadItems,
  markRead,
  ringDoorbell,
  ringSqsDoorbells,
  createCronSchedule,
  createFollowUpSchedule,
  deleteCronSchedule,
};

export type InboxService = typeof inboxService;
