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
          window.location.pathname === route || window.location.pathname.startsWith('/courses/') || window.location.pathname.startsWith('/quiz/share/')
        );
        
        if (!isPublicRoute) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const apiGet = async <T>(url: string): Promise<T> => {
  const response = await api.get(url);
  return response.data.data;
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post(url, data);
  return response.data.data;
};

export const apiPut = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put(url, data);
  return response.data.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response.data.data;
};

export const apiUpload = async <T>(url: string, formData: FormData): Promise<T> => {
  const response = await api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export default api;
