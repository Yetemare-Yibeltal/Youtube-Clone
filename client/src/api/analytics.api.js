import axiosClient from "./axiosClient";

export const getChannelAnalytics = (channelId, params) =>
  axiosClient
    .get(`/analytics/channels/${channelId}`, { params })
    .then((res) => res.data.data);

export const getTopVideos = (channelId, params) =>
  axiosClient
    .get(`/analytics/channels/${channelId}/top-videos`, { params })
    .then((res) => res.data.data);

export const getVideoAnalytics = (videoId, params) =>
  axiosClient
    .get(`/analytics/videos/${videoId}`, { params })
    .then((res) => res.data.data);
