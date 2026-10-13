import axiosClient from "./axiosClient";

export const toggleSubscription = (channelId) =>
  axiosClient.post(`/subscriptions/${channelId}`).then((res) => res.data.data);

export const getSubscriptionStatus = (channelId) =>
  axiosClient
    .get(`/subscriptions/${channelId}/status`)
    .then((res) => res.data.data);

export const listMySubscriptions = (params) =>
  axiosClient.get("/subscriptions", { params }).then((res) => res.data.data);

export const listChannelSubscribers = (channelId, params) =>
  axiosClient
    .get(`/subscriptions/${channelId}/subscribers`, { params })
    .then((res) => res.data.data);

export const updateSubscriptionPreference = (channelId, notificationsEnabled) =>
  axiosClient
    .patch(`/subscriptions/${channelId}/preference`, { notificationsEnabled })
    .then((res) => res.data.data);
