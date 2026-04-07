import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import apiClient from '@/src/lib/axios';
import { tokenStorage } from '@/src/lib/storage';
import type { AuthState, LoginCredentials, LoginResponse, User } from '@/src/types/auth.types';

// Initialize state from cookies
const getInitialState = () => {
  const token = tokenStorage.getToken();
  const refreshToken = tokenStorage.getRefreshToken();
  const user = tokenStorage.getUser();

  return {
    user: user || null,
    token: token || null,
    refreshToken: refreshToken || null,
    isAuthenticated: !!(token && user),
    isLoading: false,
    error: null,
  };
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state from cookies
        ...getInitialState(),

        // Login action
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiClient.post<LoginResponse>('/auth/login', {
              email: credentials.email,
              password: credentials.password,
            });

            const { user, token, refreshToken } = response.data.data;

            // Save tokens and user to cookies
            const rememberMe = credentials.rememberMe || false;
            tokenStorage.setToken(token, rememberMe);
            tokenStorage.setRefreshToken(refreshToken, rememberMe);
            tokenStorage.setUser(user, rememberMe);

            // Update state
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        // Logout action
        logout: async () => {
          set({ isLoading: true });

          try {
            // Call logout API (optional, backend may invalidate token)
            await apiClient.post('/auth/logout');
          } catch (error) {
            console.error('Logout API error:', error);
            // Continue with logout even if API fails
          } finally {
            // Clear all auth data
            tokenStorage.clearAll();

            // Reset state
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        // Refresh access token
        refreshAccessToken: async () => {
          const currentRefreshToken = tokenStorage.getRefreshToken();

          if (!currentRefreshToken) {
            return false;
          }

          try {
            const response = await apiClient.post('/auth/refresh-token', {
              refreshToken: currentRefreshToken,
            });

            const { token: newAccessToken } = response.data.data;

            // Update token in cookies
            tokenStorage.setToken(newAccessToken, true);

            // Update state
            set({ token: newAccessToken });

            return true;
          } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear auth data on refresh failure
            tokenStorage.clearAll();
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            return false;
          }
        },

        // Set user (for updates)
        setUser: (user: User) => {
          set({ user });
          tokenStorage.setUser(user, !!tokenStorage.getRefreshToken());
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Check authentication on app init
        checkAuth: async () => {
          set({ isLoading: true });

          const token = tokenStorage.getToken();
          const refreshToken = tokenStorage.getRefreshToken();
          const user = tokenStorage.getUser();

          if (!token || !refreshToken || !user) {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          try {
            // Verify token by calling /auth/me
            const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
            const userData = response.data.data;

            set({
              user: userData,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Auth check failed:', error);
            // Try to refresh token
            const refreshed = await get().refreshAccessToken();

            if (refreshed) {
              // Retry getting user data
              try {
                const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
                const userData = response.data.data;

                set({
                  user: userData,
                  token: tokenStorage.getToken() || null,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });
              } catch (retryError) {
                // Failed again, clear auth
                tokenStorage.clearAll();
                set({
                  user: null,
                  token: null,
                  refreshToken: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            } else {
              // Refresh failed, clear auth
              tokenStorage.clearAll();
              set({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        },
      }),
      {
        name: 'auth-storage',
        // Only persist essential auth data
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);