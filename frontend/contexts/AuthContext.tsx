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

  const validateToken = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      console.log('API URL:', apiUrl); // Debug log
      console.log('Full URL:', `${apiUrl}/auth/me`); // Debug log
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      console.log('API URL:', apiUrl); // Debug log
      console.log('Login API URL:', `${apiUrl}/auth/login`); // Debug log
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

        // Store tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        setUser(userData);
        
        // Route to appropriate dashboard based on role
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

  // Helper function to get default dashboard for role
  const getDefaultDashboardForRole = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/dashboard';
      case 'sales_manager':
        return '/dashboard/sales';
      case 'sales_person':
        return '/dashboard/sales';
      case 'accountant':
        return '/dashboard/finance';
      default:
        return '/dashboard';
    }
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isSalesManager = (): boolean => {
    return user?.role === 'sales_manager';
  };

  const isSalesPerson = (): boolean => {
    return user?.role === 'sales_person';
  };

  const canAccessCRM = (): boolean => {
    return user ? ['admin', 'sales_manager', 'sales_person'].includes(user.role) : false;
  };

  const getDefaultDashboard = (): string => {
    return user ? getDefaultDashboardForRole(user.role) : '/dashboard';
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
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