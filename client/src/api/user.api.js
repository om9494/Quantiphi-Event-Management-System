import api from './axiosInstance.js';

export const getProfileApi = () => api.get('/users/profile');
export const updateProfileApi = (data) => api.put('/users/profile', data);
