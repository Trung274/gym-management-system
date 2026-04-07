import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/src/lib/storage';
import type { RefreshTokenResponse, ApiError } from '@/src/types/auth.types';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - attach token to every request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and auto-refresh token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Mark as retrying
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      // No refresh token, logout
      isRefreshing = false;
      tokenStorage.clearAll();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Call refresh token API
      const response = await axios.post<RefreshTokenResponse>(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`,
        { refreshToken }
      );

      const { token: newAccessToken } = response.data.data;

      // Save new token (keep same remember me setting)
      tokenStorage.setToken(newAccessToken, !!tokenStorage.getRefreshToken());
      tokenStorage.setRefreshToken(refreshToken);

      // Update original request header
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      // Process queued requests
      processQueue(null, newAccessToken);

      isRefreshing = false;

      // Retry original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh token failed, logout
      processQueue(refreshError, null);
      isRefreshing = false;
      tokenStorage.clearAll();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;