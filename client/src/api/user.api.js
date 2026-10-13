import axiosClient from "./axiosClient";

export const getCurrentUser = () =>
  axiosClient.get("/users/me").then((res) => res.data.data);

export const getUserByUsername = (username) =>
  axiosClient.get(`/users/${username}`).then((res) => res.data.data);

export const updateAccount = (payload) =>
  axiosClient.patch("/users/me", payload).then((res) => res.data.data);

export const changePassword = (payload) =>
  axiosClient.patch("/users/me/password", payload).then((res) => res.data.data);

export const deleteAccount = (password) =>
  axiosClient
    .delete("/users/me", { data: { password } })
    .then((res) => res.data.data);

export const updateAvatar = (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return axiosClient
    .patch("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};

export const updateCoverImage = (file) => {
  const formData = new FormData();
  formData.append("coverImage", file);
  return axiosClient
    .patch("/users/me/cover-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};

export const listUsers = (params) =>
  axiosClient.get("/users", { params }).then((res) => res.data.data);
