import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kaslot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/auth') {
      // Don't redirect if already on auth page, if it's an auth request, or if it's a public report page
      const isAuthRequest = error.config?.url?.includes('/auth/');
      const isPublicReportPage = window.location.pathname.includes('/supplier-report/') || 
                               window.location.pathname.includes('/partner-report/');
                               
      if (!isAuthRequest && !isPublicReportPage) {
        localStorage.removeItem('kaslot_token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
