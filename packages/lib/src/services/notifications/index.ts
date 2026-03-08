import { dismissNotification } from "./dismissNotification.js";
import { getNotification } from "./getNotification.js";
import { getNotifications } from "./getNotifications.js";
import { resolveNotification } from "./resolveNotification.js";

export const notificationService = {
  getNotification,
  getNotifications,
  resolveNotification,
  dismissNotification,
};

export type NotificationService = typeof notificationService;
