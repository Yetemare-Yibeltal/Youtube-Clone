import axiosClient from "./axiosClient";

export const uploadImageAsset = (file, folder = "misc") => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);
  return axiosClient
    .post("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};

export const deleteUploadedAsset = (publicId, resourceType = "image") =>
  axiosClient
    .delete(`/uploads/${encodeURIComponent(publicId)}`, {
      params: { resourceType },
    })
    .then((res) => res.data.data);
