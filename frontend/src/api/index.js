import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000/api';

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

export const progressReportAPI = {
  submit: (data) => api.post('/progress-reports', data),
  getAll: () => api.get('/progress-reports'),
  review: (id, data) => api.put(`/progress-reports/${id}/review`, data)
};

export const literatureReviewAPI = {
  submit: (data) => api.post('/literature-reviews', data),
  getAll: () => api.get('/literature-reviews'),
  feedback: (id, data) => api.put(`/literature-reviews/${id}/feedback`, data)
};

export const thesisMaterialAPI = {
  upload: (data) => api.post('/thesis-materials', data),
  updateVersion: (id, data) => api.put(`/thesis-materials/${id}`, data),
  getAll: () => api.get('/thesis-materials')
};

export const meetingAPI = {
  request: (data) => api.post('/meetings', data),
  getAll: (params) => api.get('/meetings', { params }),
  respond: (id, data) => api.put(`/meetings/${id}/respond`, data),
  cancel: (id) => api.put(`/meetings/${id}/cancel`),
  complete: (id, data) => api.put(`/meetings/${id}/complete`, data)
};

export const researchGroupAPI = {
  create: (data) => api.post('/research-groups', data),
  getAll: () => api.get('/research-groups'),
  getById: (id) => api.get(`/research-groups/${id}`),
  join: (id) => api.post(`/research-groups/${id}/join`),
  leave: (id) => api.post(`/research-groups/${id}/leave`),
  createPost: (groupId, data) => api.post(`/research-groups/${groupId}/posts`, data),
  getPosts: (groupId) => api.get(`/research-groups/${groupId}/posts`),
  addReply: (groupId, postId, data) => api.post(`/research-groups/${groupId}/posts/${postId}/replies`, data)
};

export default api;
