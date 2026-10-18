import axiosClient from './axiosClient';

export const toggleVideoLike = (videoId, type) =>
  axiosClient.post(`/likes/video/${videoId}`, { type }).then((res) => res.data.data);

export const toggleCommentLike = (commentId, type) =>
  axiosClient.post(`/likes/comment/${commentId}`, { type }).then((res) => res.data.data);

export const getVideoLikeStatus = (videoId) =>
  axiosClient.get(`/likes/video/${videoId}/status`).then((res) => res.data.data);

export const listLikedVideos = (params) => axiosClient.get('/likes/videos', { params }).then((res) => res.data.data);
