import React, { createContext, useEffect, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
  } | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  register: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Decode JWT token
   */
  const decodeToken = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  /**
   * Extract user info and roles from token
   */
  const updateUserInfo = useCallback(() => {
    const accessToken = sessionStorage.getItem('access_token');

    if (accessToken) {
      const tokenParsed = decodeToken(accessToken);

      if (tokenParsed) {
        const roles = tokenParsed.realm_access?.roles || [];
        setUser({
          username: tokenParsed.preferred_username,
          email: tokenParsed.email,
          firstName: tokenParsed.given_name,
          lastName: tokenParsed.family_name,
          roles,
        });
        setToken(accessToken);
        setIsAuthenticated(true);
        return;
      }
    }

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Initialize auth on component mount
   */
  useEffect(() => {
    setIsLoading(true);
    updateUserInfo();
    setIsLoading(false);
  }, [updateUserInfo]);

  /**
   * Token refresh strategy
   * Checks and refreshes token every 60 seconds
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const refreshToken = sessionStorage.getItem('refresh_token');
      const accessToken = sessionStorage.getItem('access_token');

      if (!refreshToken || !accessToken) return;

      // Check if token is close to expiring
      const tokenParsed = decodeToken(accessToken);
      if (tokenParsed && tokenParsed.exp) {
        const expiresIn = tokenParsed.exp * 1000 - Date.now();

        // Refresh if expires in < 70 seconds
        if (expiresIn < 70000) {
          try {
            const response = await fetch('http://localhost:3000/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
              const tokens = await response.json();
              sessionStorage.setItem('access_token', tokens.access_token);
              sessionStorage.setItem('refresh_token', tokens.refresh_token);
              updateUserInfo();
              console.log('Token refreshed');
            } else {
              // Refresh failed, logout
              sessionStorage.clear();
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            sessionStorage.clear();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, updateUserInfo]);


  /**
   * Login handler (placeholder - actual login happens in LoginPage)
   */
  const login = useCallback(() => {
    window.location.href = '/login';
  }, []);

  /**
   * Logout handler
   * Clears session storage and redirects to home
   */
  const logout = useCallback(() => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    window.location.href = '/';
  }, []);

  /**
   * Register handler (placeholder - actual registration happens in RegisterPage)
   */
  const register = useCallback(() => {
    window.location.href = '/register';
  }, []);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles.includes(role) || false;
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => user?.roles.includes(role)) || false;
    },
    [user]
  );

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    token,
    login,
    logout,
    register,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
