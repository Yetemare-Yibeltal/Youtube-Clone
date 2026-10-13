import axiosClient from "./axiosClient";

export const submitReport = (payload) =>
  axiosClient.post("/reports", payload).then((res) => res.data.data);
