import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('studyr_token');
      localStorage.removeItem('studyr_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  create: (subjectData) => api.post('/subjects', subjectData),
  getById: (id) => api.get(`/subjects/${id}`),
  update: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  create: (sessionData) => api.post('/sessions', sessionData),
  getById: (id) => api.get(`/sessions/${id}`),
  update: (id, sessionData) => api.put(`/sessions/${id}`, sessionData),
  delete: (id) => api.delete(`/sessions/${id}`),
  complete: (id) => api.post(`/sessions/${id}/complete`),
};

// Helper functions
export const setAuthToken = (token) => {
  localStorage.setItem('studyr_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('studyr_token');
  localStorage.removeItem('studyr_user');
};

export const getAuthToken = () => {
  return localStorage.getItem('studyr_token');
};

export default api;