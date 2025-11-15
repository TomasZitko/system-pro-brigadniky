import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Services
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/users/me'),
};

export const workersService = {
  getAll: () => api.get('/workers'),
  create: (data: any) => api.post('/workers/contracts', data),
  getContracts: (workerId: string) => api.get(`/workers/${workerId}/contracts`),
  getAvailability: (workerId: string) => api.get(`/workers/${workerId}/availability`),
};

export const shiftsService = {
  getAll: (startDate?: string, endDate?: string) =>
    api.get('/shifts', { params: { startDate, endDate } }),
  create: (data: any) => api.post('/shifts', data),
  update: (id: string, data: any) => api.put(`/shifts/${id}`, data),
  delete: (id: string) => api.delete(`/shifts/${id}`),
  approveApplication: (applicationId: string) =>
    api.post(`/shifts/applications/${applicationId}/approve`),
};

export const attendanceService = {
  getAll: (startDate?: string, endDate?: string) =>
    api.get('/attendance', { params: { startDate, endDate } }),
  approve: (id: string, data: any) => api.put(`/attendance/${id}/approve`, data),
};

export const payrollService = {
  getPeriods: () => api.get('/payroll/periods'),
  createPeriod: (data: any) => api.post('/payroll/periods', data),
  calculate: (periodId: string) =>
    api.post(`/payroll/periods/${periodId}/calculate`),
  lock: (periodId: string) => api.put(`/payroll/periods/${periodId}/lock`),
  getCalculations: (periodId: string) =>
    api.get(`/payroll/periods/${periodId}/calculations`),
  exportCSSZ: (periodId: string) =>
    api.get(`/payroll/periods/${periodId}/export/cssz`, { responseType: 'blob' }),
  exportCSV: (periodId: string) =>
    api.get(`/payroll/periods/${periodId}/export/csv`, { responseType: 'blob' }),
};

export const gamificationService = {
  getAchievements: () => api.get('/gamification/achievements'),
  createAchievement: (data: any) => api.post('/gamification/achievements', data),
  getLeaderboard: () => api.get('/gamification/leaderboard'),
  awardAchievement: (achievementId: string, workerId: string) =>
    api.post(`/gamification/achievements/${achievementId}/award/${workerId}`),
};

export const feedbackService = {
  generateQR: (data: any) => api.post('/feedback/qr-codes', data),
  getAll: () => api.get('/feedback'),
};
