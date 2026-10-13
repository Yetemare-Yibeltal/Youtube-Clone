import axiosClient from "./axiosClient";

export const listNotifications = (params) =>
  axiosClient.get("/notifications", { params }).then((res) => res.data.data);

export const getUnreadNotificationCount = () =>
  axiosClient.get("/notifications/unread-count").then((res) => res.data.data);

export const markNotificationRead = (notificationId) =>
  axiosClient
    .patch(`/notifications/${notificationId}/read`)
    .then((res) => res.data.data);

export const markAllNotificationsRead = () =>
  axiosClient.patch("/notifications/read-all").then((res) => res.data.data);

export const deleteNotification = (notificationId) =>
  axiosClient
    .delete(`/notifications/${notificationId}`)
    .then((res) => res.data.data);
