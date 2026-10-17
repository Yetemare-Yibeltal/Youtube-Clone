import axiosClient from './axiosClient';

export const searchVideos = (params) => axiosClient.get('/search/videos', { params }).then((res) => res.data.data);

export const searchChannels = (params) => axiosClient.get('/search/channels', { params }).then((res) => res.data.data);

export const getSearchSuggestions = (query) =>
  axiosClient.get('/search/suggestions', { params: { q: query } }).then((res) => res.data.data);

export const getTrendingVideos = (params) =>
  axiosClient.get('/search/trending', { params }).then((res) => res.data.data);

export const getRelatedVideos = (videoId, params) =>
  axiosClient.get(`/search/related/${videoId}`, { params }).then((res) => res.data.data);

export const getSubscriptionFeed = (params) => axiosClient.get('/search/feed', { params }).then((res) => res.data.data);
