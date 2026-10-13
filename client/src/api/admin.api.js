import axiosClient from "./axiosClient";

export const getDashboardStats = () =>
  axiosClient.get("/admin/stats").then((res) => res.data.data);

export const listAuditLogs = (params) =>
  axiosClient.get("/admin/audit-logs", { params }).then((res) => res.data.data);

export const listVideosForModeration = (params) =>
  axiosClient.get("/admin/videos", { params }).then((res) => res.data.data);

export const deleteVideoAsAdmin = (videoId) =>
  axiosClient.delete(`/admin/videos/${videoId}`).then((res) => res.data.data);

export const deleteCommentAsAdmin = (commentId) =>
  axiosClient
    .delete(`/admin/comments/${commentId}`)
    .then((res) => res.data.data);

export const banUser = (userId, reason) =>
  axiosClient
    .patch(`/admin/users/${userId}/ban`, { reason })
    .then((res) => res.data.data);

export const unbanUser = (userId) =>
  axiosClient
    .patch(`/admin/users/${userId}/unban`)
    .then((res) => res.data.data);

export const setChannelVerification = (channelId, isVerified) =>
  axiosClient
    .patch(`/admin/channels/${channelId}/verify`, { isVerified })
    .then((res) => res.data.data);
