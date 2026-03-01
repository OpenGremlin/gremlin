import { dismissNotification } from "./dismissNotification.js";
import { getNotifications } from "./getNotifications.js";
import { resolveNotification } from "./resolveNotification.js";

export const notificationService = {
  getNotifications,
  resolveNotification,
  dismissNotification,
};

export type NotificationService = typeof notificationService;
