import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const isServer = typeof window === 'undefined';
const API_URL = isServer 
  ? (process.env.INTERNAL_API_URL || 'http://backend:3001/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we are NOT on a public route
        const publicRoutes = ['/', '/login', '/register', '/courses'];
        const isPublicRoute = publicRoutes.some(route => 
          window.location.pathname === route || window.location.pathname.startsWith('/courses/')
        );
        
        if (!isPublicRoute) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
