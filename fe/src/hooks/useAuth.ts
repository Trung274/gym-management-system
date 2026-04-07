import { useAuthStore } from '@/src/stores/authStore';

export const useAuth = () => {
  const authStore = useAuthStore();
  
  return {
    user: authStore.user,
    token: authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    login: authStore.login,
    logout: authStore.logout,
    setUser: authStore.setUser,
    clearError: authStore.clearError,
    checkAuth: authStore.checkAuth,
  };
};