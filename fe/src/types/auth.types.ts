export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: {
    _id: string;
    name: string;
    permissions: Permission[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  resource: string;
  action: string;
  description: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setUser: (user: User) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface UpdateUserProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface UpdateUserProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleName: string;
  isActive: boolean;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ role: string; count: number }>;
  };
}
