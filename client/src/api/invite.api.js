import api from './axiosInstance.js';

export const createInviteApi = (eventId) => api.post(`/invites/${eventId}`);
export const resolveInviteApi = (token) => api.get(`/invites/token/${token}`);
export const getLinkStatsApi = (eventId) => api.get(`/invites/${eventId}/stats`);
