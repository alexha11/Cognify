import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const isServer = typeof window === 'undefined';
const API_URL = isServer 
  ? (process.env.INTERNAL_API_URL || 'http://localhost:3001/api')
  : (process.env.NEXT_PUBLIC_API_URL || '/api');

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

import { toast } from '@/components/ui/toast';

// Response interceptor to handle auth and other errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error?.message || error.message || "An unexpected error occurred";

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we are NOT on a public route
        const publicRoutes = ['/', '/login', '/register', '/courses'];
        const isPublicRoute = publicRoutes.some(route => 
          window.location.pathname === route || window.location.pathname.startsWith('/courses/') || window.location.pathname.startsWith('/quiz/share/')
        );
        
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
        if (!isAuthPage) {
          toast.error("Session expired or unauthorized. Please sign in.");
          if (!isPublicRoute) {
            window.location.href = '/login';
          }
        }
      }
    } else if (status === 403) {
      toast.error("Access denied. You do not have permission to perform this action.");
    } else if (status === 429) {
      toast.warning("Too many requests. Please try again later.");
    } else if (status >= 500) {
      toast.error("Internal Server Error. Please contact support.");
    } else {
      // General errors (like 400 Bad Request)
      const isAuthPage = typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register');
      if (!isAuthPage) {
        toast.error(message);
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
