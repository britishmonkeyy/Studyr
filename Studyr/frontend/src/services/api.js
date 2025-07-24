import axios from 'axios';

// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're in development and get the current host
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development
    return 'http://localhost:5000/api';
  } else {
    // Network access - use the same IP as the frontend but with backend port
    return `http://${hostname}:5000/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL); // For debugging

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Cannot connect to server. Please check if the backend is running.');
    } else if (error.response?.status === 401) {
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
  complete: (id, data = {}) => api.post(`/sessions/${id}/complete`, data),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getStats: (timeframe = '30days') => api.get(`/analytics?timeframe=${timeframe}`),
  getStreak: () => api.get('/analytics/streak'),
  getGoals: (goalType = 'weekly', targetValue = null) => {
    const params = new URLSearchParams({ goalType });
    if (targetValue) params.append('targetValue', targetValue);
    return api.get(`/analytics/goals?${params}`);
  },
  updateSessionAnalytics: (sessionId) => api.post(`/analytics/session/${sessionId}`),
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

// Test connection function
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('Connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

export default api;