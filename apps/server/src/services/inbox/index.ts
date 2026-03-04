import { ringDoorbell } from "./consumer.js";
import { enqueueWork } from "./enqueueWork.js";
import { getUnreadItems } from "./getUnreadItems.js";
import { markRead } from "./markRead.js";

export const inboxService = {
  enqueueWork,
  getUnreadItems,
  markRead,
  ringDoorbell,
};

export type InboxService = typeof inboxService;
