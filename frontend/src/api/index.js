import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

export const proposalAPI = {
  submit: (data) => api.post('/proposals', data),
  getAll: (params) => api.get('/proposals', { params }),
  getById: (id) => api.get(`/proposals/${id}`),
  review: (id, data) => api.put(`/proposals/${id}/review`, data)
};

export const supervisionAPI = {
  assign: (data) => api.post('/supervisions', data),
  getAll: (params) => api.get('/supervisions', { params }),
  getById: (id) => api.get(`/supervisions/${id}`),
  reassign: (id, data) => api.put(`/supervisions/${id}/reassign`, data)
};

export const milestoneAPI = {
  create: (data) => api.post('/milestones', data),
  getAll: (params) => api.get('/milestones', { params }),
  getById: (id) => api.get(`/milestones/${id}`),
  submit: (id, data) => api.put(`/milestones/${id}/submit`, data),
  review: (id, data) => api.put(`/milestones/${id}/review`, data),
  update: (id, data) => api.put(`/milestones/${id}`, data),
  delete: (id) => api.delete(`/milestones/${id}`)
};

export default api;
