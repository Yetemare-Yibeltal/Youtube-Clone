import axiosClient from "./axiosClient";

export const createChannel = (payload) =>
  axiosClient.post("/channels", payload).then((res) => res.data.data);

export const getChannelById = (channelId) =>
  axiosClient.get(`/channels/${channelId}`).then((res) => res.data.data);

export const getChannelByHandle = (handle) =>
  axiosClient.get(`/channels/handle/${handle}`).then((res) => res.data.data);

export const getMyChannel = () =>
  axiosClient.get("/channels/me").then((res) => res.data.data);

export const updateChannel = (channelId, payload) =>
  axiosClient
    .patch(`/channels/${channelId}`, payload)
    .then((res) => res.data.data);

export const updateChannelAvatar = (channelId, file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return axiosClient
    .patch(`/channels/${channelId}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};

export const updateChannelBanner = (channelId, file) => {
  const formData = new FormData();
  formData.append("banner", file);
  return axiosClient
    .patch(`/channels/${channelId}/banner`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};

export const getChannelVideos = (channelId, params) =>
  axiosClient
    .get(`/channels/${channelId}/videos`, { params })
    .then((res) => res.data.data);

export const deleteChannel = (channelId) =>
  axiosClient.delete(`/channels/${channelId}`).then((res) => res.data.data);
