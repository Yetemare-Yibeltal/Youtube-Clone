import axiosClient from './axiosClient';

export const registerUser = (payload) => axiosClient.post('/auth/register', payload).then((res) => res.data.data);

export const loginUser = (payload) => axiosClient.post('/auth/login', payload).then((res) => res.data.data);

export const logoutUser = () => axiosClient.post('/auth/logout').then((res) => res.data.data);

export const refreshSession = () => axiosClient.post('/auth/refresh').then((res) => res.data.data);

export const getCurrentSession = () => axiosClient.get('/auth/me').then((res) => res.data.data);

export const resendVerificationEmail = () => axiosClient.post('/auth/resend-verification').then((res) => res.data.data);

export const verifyEmail = (token) => axiosClient.post('/auth/verify-email', { token }).then((res) => res.data.data);

export const requestPasswordReset = (email) =>
  axiosClient.post('/auth/forgot-password', { email }).then((res) => res.data.data);

export const resetPassword = (token, newPassword) =>
  axiosClient.post('/auth/reset-password', { token, newPassword }).then((res) => res.data.data);