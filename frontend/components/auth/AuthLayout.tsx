'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // If user is authenticated and on auth pages, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname.startsWith('/auth')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

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

  // If authenticated, show loading (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show auth pages with clean layout
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 