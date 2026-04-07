import Cookies from 'js-cookie';

// Cookie names
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Cookie options
const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const,
  path: '/',
};

// Token storage functions
export const tokenStorage = {
  // Save access token
  setToken: (token: string, rememberMe: boolean = false) => {
    const expires = rememberMe ? 7 : undefined; // 7 days if remember me, session otherwise
    Cookies.set(TOKEN_KEY, token, {
      ...COOKIE_OPTIONS,
      expires,
    });
  },

  // Get access token
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  // Remove access token
  removeToken: () => {
    Cookies.remove(TOKEN_KEY, { path: '/' });
  },

  // Save refresh token
  setRefreshToken: (token: string, rememberMe: boolean = false) => {
    const expires = rememberMe ? 30 : undefined; // 30 days if remember me, session otherwise
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      ...COOKIE_OPTIONS,
      expires,
    });
  },

  // Get refresh token
  getRefreshToken: (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  // Remove refresh token
  removeRefreshToken: () => {
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
  },

  // Save user data
  setUser: (user: any, rememberMe: boolean = false) => {
    const expires = rememberMe ? 7 : undefined;
    Cookies.set(USER_KEY, JSON.stringify(user), {
      ...COOKIE_OPTIONS,
      expires,
    });
  },

  // Get user data
  getUser: (): any | null => {
    const userData = Cookies.get(USER_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  },

  // Remove user data
  removeUser: () => {
    Cookies.remove(USER_KEY, { path: '/' });
  },

  // Clear all auth data
  clearAll: () => {
    tokenStorage.removeToken();
    tokenStorage.removeRefreshToken();
    tokenStorage.removeUser();
  },
};