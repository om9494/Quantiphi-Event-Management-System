import api from './axiosInstance.js';

export const upsertReminderApi = (eventId, data) => api.put(`/reminders/${eventId}`, data);
export const getUserRemindersApi = () => api.get('/reminders');
export const getNotificationsApi = () => api.get('/reminders/notifications');
