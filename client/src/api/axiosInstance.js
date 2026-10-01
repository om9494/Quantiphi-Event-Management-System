// Axios instance — base URL from env, auto-attaches JWT Bearer token.
// All API modules import from here so headers are always consistent.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor — attach stored JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — on 401, wipe token so AuthContext logs out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Dispatch a custom event; AuthContext listens and clears state
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;
