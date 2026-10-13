import axiosClient from "./axiosClient";

export const searchVideos = (params) =>
  axiosClient.get("/search/videos", { params }).then((res) => res.data.data);

export const searchChannels = (params) =>
  axiosClient.get("/search/channels", { params }).then((res) => res.data.data);

export const getSearchSuggestions = (query) =>
  axiosClient
    .get("/search/suggestions", { params: { q: query } })
    .then((res) => res.data.data);
