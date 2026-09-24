import logger from "../utils/logger.js";
import * as notificationService from "../services/notification.service.js";

/**
 * Thin fire-and-forget wrappers around notification.service so callers
 * (controllers, other jobs) never have to block a request/response cycle
 * on notification fan-out or worry about an unhandled rejection crashing
 * the process.
 */
export function queueNewVideoNotifications(channel, video) {
  notificationService
    .notifySubscribersOfNewVideo(channel, video)
    .catch((err) =>
      logger.error(`notification.job (new video): ${err.message}`),
    );
}

export function queueNotification(payload) {
  notificationService
    .createNotification(payload)
    .catch((err) => logger.error(`notification.job (single): ${err.message}`));
}

export default { queueNewVideoNotifications, queueNotification };
