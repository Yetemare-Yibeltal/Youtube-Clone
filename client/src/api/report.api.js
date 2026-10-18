import axiosClient from './axiosClient';

export const submitReport = (payload) => axiosClient.post('/reports', payload).then((res) => res.data.data);

export const listReports = (params) => axiosClient.get('/reports', { params }).then((res) => res.data.data);

export const reviewReport = (reportId, payload) =>
  axiosClient.patch(`/reports/${reportId}`, payload).then((res) => res.data.data);
