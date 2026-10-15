import axiosClient from "./axiosClient";

export const uploadVideo = (payload, onUploadProgress) => {
  const formData = new FormData();
  formData.append("video", payload.videoFile);
  formData.append("thumbnail", payload.thumbnailFile);
  formData.append("title", payload.title);
  formData.append("description", payload.description || "");
  formData.append("category", payload.category || "other");
  formData.append("visibility", payload.visibility || "public");
  formData.append("isShort", String(Boolean(payload.isShort)));
  formData.append("ageRestricted", String(Boolean(payload.ageRestricted)));
  if (payload.tags?.length) formData.append("tags", payload.tags.join(","));

  return axiosClient
    .post("/videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
    .then((res) => res.data.data);
};

export const getVideoById = (videoId) =>
  axiosClient.get(`/videos/${videoId}`).then((res) => res.data.data);

export const listVideos = (params) =>
  axiosClient.get("/videos", { params }).then((res) => res.data.data);

export const updateVideo = (videoId, payload) =>
  axiosClient.patch(`/videos/${videoId}`, payload).then((res) => res.data.data);

export const updateVideoThumbnail = (videoId, file) => {
  const formData = new FormData();
  formData.append("thumbnail", file);
  return axiosClient
    .patch(`/videos/${videoId}/thumbnail`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};

export const deleteVideo = (videoId) =>
  axiosClient.delete(`/videos/${videoId}`).then((res) => res.data.data);

export const recordVideoView = (videoId) =>
  axiosClient.post(`/videos/${videoId}/view`).then((res) => res.data.data);

export const recordWatchProgress = (videoId, progressSeconds) =>
  axiosClient
    .post(`/history/${videoId}`, { progressSeconds })
    .then((res) => res.data.data);