'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardSidebar from './dashboard/DashboardSidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check if this is a dashboard route
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/auth');
  const isMarketingRoute = pathname === '/' || pathname.startsWith('/marketing');

  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading) {
      // If authenticated and on auth pages, redirect to dashboard
      if (isAuthenticated && isAuthRoute) {
        router.push('/dashboard');
      }
      // If not authenticated and on dashboard routes, redirect to login
      else if (!isAuthenticated && isDashboardRoute) {
        router.push('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, isDashboardRoute, isAuthRoute, router]);

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

  // If not authenticated and on dashboard route, show loading (will redirect)
  if (!isAuthenticated && isDashboardRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated and on auth route, show loading (will redirect)
  if (isAuthenticated && isAuthRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // If authenticated and on dashboard route, show dashboard layout
  if (isAuthenticated && isDashboardRoute) {
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

  // For marketing pages or auth pages (when not authenticated), render normally
  return <>{children}</>;
} 