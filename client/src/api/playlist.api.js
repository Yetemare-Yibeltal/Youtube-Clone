import axiosClient from "./axiosClient";

export const createPlaylist = (payload) =>
  axiosClient.post("/playlists", payload).then((res) => res.data.data);

export const listMyPlaylists = (params) =>
  axiosClient.get("/playlists", { params }).then((res) => res.data.data);

export const getPlaylistById = (playlistId) =>
  axiosClient.get(`/playlists/${playlistId}`).then((res) => res.data.data);

export const updatePlaylist = (playlistId, payload) =>
  axiosClient
    .patch(`/playlists/${playlistId}`, payload)
    .then((res) => res.data.data);

export const deletePlaylist = (playlistId) =>
  axiosClient.delete(`/playlists/${playlistId}`).then((res) => res.data.data);

export const addVideoToPlaylist = (playlistId, videoId) =>
  axiosClient
    .post(`/playlists/${playlistId}/videos/${videoId}`)
    .then((res) => res.data.data);

export const removeVideoFromPlaylist = (playlistId, videoId) =>
  axiosClient
    .delete(`/playlists/${playlistId}/videos/${videoId}`)
    .then((res) => res.data.data);
