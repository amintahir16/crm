'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import RealPlotMap from '@/components/RealPlotMap';
import { ArrowLeft, Map, Info } from 'lucide-react';

export default function PlotMapPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/plots')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Plots</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Map className="h-5 w-5 text-primary-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Queen Hills Murree - Interactive Master Plan
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                <span>Use mouse to pan, scroll to zoom</span>
              </div>
              <div className="text-sm text-gray-500 border-l pl-4">
                Welcome, {user?.fullName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RealPlotMap />
      </div>

      {/* Information Footer */}
      <div className="bg-white border-t mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">Total Plots</h4>
              <p className="text-2xl font-bold text-primary-600">71</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">Plot Sizes</h4>
              <p className="text-gray-600">4 Marla to 1 Kanal</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">Total Blocks</h4>
              <p className="text-2xl font-bold text-blue-600">7</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">Development Phases</h4>
              <p className="text-2xl font-bold text-green-600">3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
