import axios from 'axios';

// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  console.log('🔍 API Debug - Hostname:', hostname);
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔍 Using localhost API');
    return 'http://localhost:5000/api';
  } else {
    const networkUrl = `http://${hostname}:5000/api`;
    console.log('🔍 Using network API:', networkUrl);
    return networkUrl;
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
  getStats: () => api.get('/subjects/stats'),
};

// Enhanced Sessions API
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  create: (sessionData) => api.post('/sessions', sessionData),
  getById: (id) => api.get(`/sessions/${id}`),
  update: (id, updateData) => {
    console.log('Updating session:', id, updateData);
    return api.put(`/sessions/${id}`, updateData);
  },
  delete: (id) => api.delete(`/sessions/${id}`),
  complete: (id, completionData = {}) => {
    console.log('Completing session:', id, completionData);
    return api.post(`/sessions/${id}/complete`, completionData);
  },
  // Additional session management methods
  start: (id) => api.put(`/sessions/${id}`, { status: 'inProgress' }),
  pause: (id) => api.put(`/sessions/${id}`, { status: 'scheduled' }),
  cancel: (id) => api.put(`/sessions/${id}`, { status: 'cancelled' }),
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

// Session management utilities
export const sessionUtils = {
  canStart: (session) => {
    if (!session || session.status !== 'scheduled') return false;
    
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
    
    return now >= fifteenMinutesBefore && now <= endTime;
  },
  
  isActive: (session) => {
    return session?.status === 'inProgress';
  },
  
  isOverdue: (session) => {
    if (!session || session.status !== 'scheduled') return false;
    const now = new Date();
    const endTime = new Date(session.endTime);
    return now > endTime;
  },
  
  formatDuration: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },
  
  getStatusColor: (status) => {
    const colors = {
      'scheduled': '#9E9E9E',
      'inProgress': '#FF9800',
      'completed': '#4CAF50',
      'cancelled': '#757575'
    };
    return colors[status] || '#9E9E9E';
  }
};
// Study Partners API
export const studyPartnersAPI = {
  // Get partnership requests (sent and received)
  getRequests: () => api.get('/partners/requests'),
  
  // Get accepted study partners
  getAccepted: () => api.get('/partners/accepted'),
  
  // Search for potential study partners
  search: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.studyLevel) searchParams.append('studyLevel', params.studyLevel);
    if (params.subject) searchParams.append('subject', params.subject);
    
    return api.get(`/partners/search?${searchParams}`);
  },
  
  // Send partnership request
  sendRequest: (recipientId, requestMessage) => 
    api.post('/partners/request', { recipientId, requestMessage }),
  
  // Respond to partnership request
  respond: (partnershipId, response) => 
    api.put(`/partners/${partnershipId}/respond`, { response }),
  
  // Remove partnership
  remove: (partnershipId, action = 'remove') => 
    api.delete(`/partners/${partnershipId}`, { data: { action } })
};

// Messages API
export const messagesAPI = {
  // Get conversations list
  getConversations: () => api.get('/messages/conversations'),
  
  // Get messages with specific partner
  getWithPartner: (partnerId, page = 1, limit = 50) => 
    api.get(`/messages/${partnerId}?page=${page}&limit=${limit}`),
  
  // Send message
  send: (recipientId, messageText, messageType = 'text') => 
    api.post('/messages', { recipientId, messageText, messageType }),
  
  // Mark messages as read
  markAsRead: (partnerId) => api.put(`/messages/${partnerId}/read`),
  
  // Delete message
  delete: (messageId) => api.delete(`/messages/${messageId}`),
  
  // Get message statistics
  getStats: () => api.get('/messages/stats')
};

export default api;