import axiosClient from "./axiosClient";

export const listShorts = (params) =>
  axiosClient.get("/shorts", { params }).then((res) => res.data.data);

export const getShortById = (videoId) =>
  axiosClient.get(`/shorts/${videoId}`).then((res) => res.data.data);
