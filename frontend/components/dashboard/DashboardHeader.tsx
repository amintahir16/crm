'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin',
      accountant: 'Accountant',
      sales_agent: 'Sales Agent',
      investor: 'Investor',
      buyer: 'Buyer',
      auditor: 'Auditor',
    };
    return roleMap[role] || role;
  };

  return (
    <header className="fixed top-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 h-16 backdrop-blur-sm">
      <div className="px-6 h-full flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/marketing_assets/logos/4.png"
                alt="Queen Hills Murree Logo"
                width={40}
                height={40}
                className="rounded"
              />
              <h1 className="text-xl font-semibold text-gray-900">Queen Hills Murree</h1>
            </div>
            <div className="hidden md:block">
              <span className="text-sm text-gray-500">Management Dashboard</span>
            </div>
          </div>


          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role || '')}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
      </div>
    </header>
  );
} 