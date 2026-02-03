'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, user, getDefaultDashboard } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check if this is a dashboard route
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // If not a dashboard route, just render children (marketing page or auth page)
  if (!isDashboardRoute) {
    return <>{children}</>;
  }

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and on dashboard route, redirect to auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isDashboardRoute) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, isDashboardRoute, router]);

  // Role-based dashboard redirection
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && isDashboardRoute) {
      const defaultDashboard = getDefaultDashboard();
      
      // If user is on the generic /dashboard route, redirect to their role-specific dashboard
      if (pathname === '/dashboard' && defaultDashboard !== '/dashboard') {
        console.log(`Redirecting ${user.role} from /dashboard to ${defaultDashboard}`);
        router.push(defaultDashboard);
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, isDashboardRoute, router, getDefaultDashboard]);

  // If not authenticated, show loading (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated and on dashboard route, show dashboard layout
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <div className="w-72 flex-shrink-0"></div>
        <DashboardSidebar />
        <main className="flex-1 ml-1 mr-4 pt-24 pb-6 pl-6 pr-6 min-h-[calc(100vh-6rem)]">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 