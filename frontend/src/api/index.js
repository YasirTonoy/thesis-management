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
  me: () => api.get('/auth/me'),
  getSupervisors: () => api.get('/auth/supervisors')
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

export const noticeAPI = {
  create: (data) => api.post('/notices', data),
  mine: () => api.get('/notices/mine'),
  bySupervisor: (supervisorId) => api.get(`/notices/by-supervisor/${supervisorId}`)
};

// ---- Feature: Progress Reports ----
export const progressReportAPI = {
  // formData must be a FormData instance (fields: proposalId, phase, description, document?)
  submit: (formData) => api.post('/progress-reports', formData),
  getAll: (proposalId) => api.get('/progress-reports', { params: { proposalId } })
};

// ---- Feature: Literature Review ----
export const literatureReviewAPI = {
  submit: (data) => api.post('/literature-reviews', data),
  getAll: (proposalId) => api.get('/literature-reviews', { params: { proposalId } })
};

// ---- Feature: Thesis Materials / Datasets ----
export const materialAPI = {
  // formData fields: proposalId, title, description, file
  create: (formData) => api.post('/materials', formData),
  // formData fields: note, file
  addVersion: (materialId, formData) => api.post(`/materials/${materialId}/versions`, formData),
  getAll: (proposalId) => api.get('/materials', { params: { proposalId } })
};
export const publicationAPI = {
  submit: (formData) => api.post('/publications', formData),
  getAll: (proposalId) => api.get('/publications', { params: { proposalId } })
};

export const conferenceAPI = {
  submit: (formData) => api.post('/conferences', formData),
  getAll: (proposalId) => api.get('/conferences', { params: { proposalId } })
};
// ---- Feature: Thesis Version Control & Revision History ----
export const thesisVersionAPI = {
  // formData fields: proposalId, changeSummary, file
  upload: (formData) => api.post('/thesis-versions', formData),
  getAll: (proposalId) => api.get('/thesis-versions', { params: { proposalId } }),
  review: (versionId, data) => api.put(`/thesis-versions/${versionId}/review`, data),
  restore: (versionId) => api.put(`/thesis-versions/${versionId}/restore`)
};

// ---- Feature: Plagiarism Reports ----
export const plagiarismReportAPI = {
  // formData fields: proposalId, similarityPercentage, toolName, notes, thesisVersionId, file
  upload: (formData) => api.post('/plagiarism-reports', formData),
  getAll: (proposalId) => api.get('/plagiarism-reports', { params: { proposalId } }),
  review: (reportId, data) => api.put(`/plagiarism-reports/${reportId}/review`, data),
  delete: (reportId) => api.delete(`/plagiarism-reports/${reportId}`)
};

// ---- Feature: Final Thesis Submission ----
export const finalSubmissionAPI = {
  submit: (data) => api.post('/final-submissions', data),
  get: (proposalId) => api.get('/final-submissions', { params: { proposalId } }),
  review: (submissionId, data) => api.put(`/final-submissions/${submissionId}/review`, data),
  downloadPdf: (submissionId) => api.get(`/final-submissions/${submissionId}/pdf`, { responseType: 'blob' })
};

// ---- Feature: Defense Scheduling & Examiner Assignment ----
export const defenseAPI = {
  schedule: (data) => api.post('/defenses', data),
  get: (proposalId) => api.get('/defenses', { params: { proposalId } }),
  mine: () => api.get('/defenses/mine'),
  update: (defenseId, data) => api.put(`/defenses/${defenseId}`, data),
  respond: (defenseId, data) => api.put(`/defenses/${defenseId}/respond`, data),
  recordResult: (defenseId, data) => api.put(`/defenses/${defenseId}/result`, data)
};

// ---- Feature: Deadline Reminders & Notifications ----
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  sweep: () => api.post('/notifications/sweep')
};

// ---- Feature: Department Research Analytics ----
export const analyticsAPI = {
  overview: (department) => api.get('/analytics/overview', { params: department ? { department } : {} }),
  downloadCsv: (department) => api.get('/analytics/report.csv', { params: department ? { department } : {}, responseType: 'blob' }),
  downloadPdf: (department) => api.get('/analytics/report.pdf', { params: department ? { department } : {}, responseType: 'blob' })
};

export default api;

export const researchGroupAPI = {
  create: (data) => api.post('/research-groups', data),
  getAll: () => api.get('/research-groups'),
  getById: (id) => api.get(`/research-groups/${id}`),
  join: (id) => api.post(`/research-groups/${id}/join`),
  leave: (id) => api.post(`/research-groups/${id}/leave`),
  createPost: (id, data) => api.post(`/research-groups/${id}/posts`, data),
  getPosts: (id) => api.get(`/research-groups/${id}/posts`),
  addReply: (id, postId, data) => api.post(`/research-groups/${id}/posts/${postId}/replies`, data)
};

export const meetingAPI = {
  request: (data) => api.post('/meetings', data),
  getAll: (params) => api.get('/meetings', { params }),
  respond: (id, data) => api.put(`/meetings/${id}/respond`, data),
  cancel: (id) => api.put(`/meetings/${id}/cancel`),
  complete: (id, data) => api.put(`/meetings/${id}/complete`, data)
};

export const labResourceAPI = {
  getAll: (params) => api.get('/lab-resources', { params }),
  getById: (id) => api.get(`/lab-resources/${id}`),
  create: (data) => api.post('/lab-resources', data),
  update: (id, data) => api.put(`/lab-resources/${id}`, data),
  delete: (id) => api.delete(`/lab-resources/${id}`),
  getAnalytics: () => api.get('/lab-resources/analytics/stats')
};

export const resourceBookingAPI = {
  getAll: (params) => api.get('/resource-bookings', { params }),
  create: (data) => api.post('/resource-bookings', data),
  respond: (id, data) => api.put(`/resource-bookings/${id}/respond`, data),
  checkIn: (id) => api.put(`/resource-bookings/${id}/check-in`),
  checkOut: (id, data) => api.put(`/resource-bookings/${id}/check-out`, data),
  cancel: (id, data) => api.put(`/resource-bookings/${id}/cancel`, data)
};

export default api;
