'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardSidebar from './dashboard/DashboardSidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar on navigation change (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Check if this is a dashboard route
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/auth');
  const isMarketingRoute = pathname === '/' || pathname.startsWith('/marketing');

  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && isAuthRoute) {
        router.push('/dashboard');
      }
      else if (!isAuthenticated && isDashboardRoute) {
        router.push('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, isDashboardRoute, isAuthRoute, router]);

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
        <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex relative">
          {/* Desktop Spacer */}
          <div className="hidden lg:block w-72 flex-shrink-0" />
          
          <DashboardSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
          
          <main className="flex-1 pt-24 pb-6 px-4 md:px-6 lg:px-8 min-h-[calc(100vh-6rem)] relative">
            <div className="w-full max-w-full overflow-x-auto">
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