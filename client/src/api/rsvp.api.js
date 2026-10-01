import api from './axiosInstance.js';

export const createRsvpApi = (eventId) => api.post('/rsvps', { eventId });
export const deleteRsvpApi = (eventId) => api.delete(`/rsvps/${eventId}`);
export const getUserRsvpsApi = () => api.get('/rsvps');
