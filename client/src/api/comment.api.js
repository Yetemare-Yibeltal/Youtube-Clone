import axiosClient from "./axiosClient";

export const listComments = (videoId, params) =>
  axiosClient
    .get(`/comments/video/${videoId}`, { params })
    .then((res) => res.data.data);

export const listReplies = (commentId, params) =>
  axiosClient
    .get(`/comments/${commentId}/replies`, { params })
    .then((res) => res.data.data);

export const addComment = (videoId, content, parentComment) =>
  axiosClient
    .post(`/comments/video/${videoId}`, { content, parentComment })
    .then((res) => res.data.data);

export const updateComment = (commentId, content) =>
  axiosClient
    .patch(`/comments/${commentId}`, { content })
    .then((res) => res.data.data);

export const deleteComment = (commentId) =>
  axiosClient.delete(`/comments/${commentId}`).then((res) => res.data.data);
