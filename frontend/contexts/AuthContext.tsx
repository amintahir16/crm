'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'sales_manager' | 'sales_person' | 'accountant' | 'investor' | 'buyer' | 'auditor';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isSalesManager: () => boolean;
  isSalesPerson: () => boolean;
  canAccessCRM: () => boolean;
  getDefaultDashboard: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on mount
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        validateToken(token);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('AuthContext useEffect error:', error);
      setIsLoading(false);
    }
  }, []);

  // Professional background refresh every 13 minutes (before 15m expiry)
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        console.log('Background refreshing token...');
        refreshToken();
      }, 13 * 60 * 1000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  const validateToken = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), 
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Access token expired, try to refresh immediately
        const newToken = await refreshToken();
        if (!newToken) {
          logout();
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      const rt = localStorage.getItem('refresh_token');
      if (!rt) return null;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        setUser(data.user);
        return data.access_token;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Professional Fetch Wrapper: Auto-retries on 401
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem('access_token');
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If 401, token might have expired. Try to refresh and retry ONCE.
    if (response.status === 401) {
      console.log('Access token expired. Attempting silent refresh...');
      const newToken = await refreshToken();
      
      if (newToken) {
        // Retry the original request
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        response = await fetch(url, { ...options, headers: retryHeaders });
      } else {
        // Refresh failed, user must log in again
        logout();
      }
    }

    return response;
  };

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token, refresh_token, user: userData } = data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setUser(userData);
        
        const defaultDashboard = getDefaultDashboardForRole(userData.role);
        router.push(defaultDashboard);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login exception:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/auth/login');
  };

  const getDefaultDashboardForRole = (role: UserRole): string => {
    switch (role) {
      case 'admin': return '/dashboard';
      case 'sales_manager': return '/dashboard/sales';
      case 'sales_person': return '/dashboard/sales';
      case 'accountant': return '/dashboard/finance';
      default: return '/dashboard';
    }
  };

  // Role checks...
  const hasRole = (role: UserRole): boolean => user?.role === role;
  const hasAnyRole = (roles: UserRole[]): boolean => user ? roles.includes(user.role) : false;
  const isAdmin = (): boolean => user?.role === 'admin';
  const isSalesManager = (): boolean => user?.role === 'sales_manager';
  const isSalesPerson = (): boolean => user?.role === 'sales_person';
  const canAccessCRM = (): boolean => user ? ['admin', 'sales_manager', 'sales_person'].includes(user.role) : false;
  const getDefaultDashboard = (): string => user ? getDefaultDashboardForRole(user.role) : '/dashboard';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshToken,
      fetchWithAuth,
      isLoading,
      isAuthenticated: !!user,
      hasRole,
      hasAnyRole,
      isAdmin,
      isSalesManager,
      isSalesPerson,
      canAccessCRM,
      getDefaultDashboard,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 