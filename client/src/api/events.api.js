import api from './axiosInstance.js';

export const getEventsApi = (params) => api.get('/events', { params });
export const getEventByIdApi = (id) => api.get(`/events/${id}`);
export const getCalendarDatesApi = (params) => api.get('/events/calendar', { params });
export const getEventsByDateApi = (date, params) => api.get(`/events/date/${date}`, { params });
