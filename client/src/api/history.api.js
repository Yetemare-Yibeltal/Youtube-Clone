import axiosClient from './axiosClient';

export const listWatchHistory = (params) => axiosClient.get('/history', { params }).then((res) => res.data.data);

export const removeFromHistory = (videoId) => axiosClient.delete(`/history/${videoId}`).then((res) => res.data.data);

export const clearWatchHistory = () => axiosClient.delete('/history').then((res) => res.data.data);

export const pauseWatchHistory = (isEnabled) =>
  axiosClient.patch('/history/toggle', { isEnabled }).then((res) => res.data.data);
