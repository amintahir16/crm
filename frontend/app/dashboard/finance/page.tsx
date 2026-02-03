'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface FinanceSummary {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalBookings: number;
  activePaymentPlans: number;
  overduePayments: number;
  recentPayments: any[];
}

export default function FinanceManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFinanceSummary();
    }
  }, [isAuthenticated]);

  const fetchFinanceSummary = async () => {
    try {
      // For now, we'll create mock data since we haven't implemented the summary API yet
      // In a real implementation, you'd fetch from: /api/v1/finance/summary
      setSummary({
        totalRevenue: 15750000,
        totalPaid: 8900000,
        totalPending: 6850000,
        totalBookings: 45,
        activePaymentPlans: 8,
        overduePayments: 3,
        recentPayments: [],
      });
    } catch (error) {
      console.error('Error fetching finance summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  if (isLoading || isLoadingSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/dashboard/finance/expenses')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Company Expenses
          </button>
          <button
            onClick={() => router.push('/dashboard/finance/reports')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Financial Reports
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPKR(summary.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">12% from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Amount Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPKR(summary.totalPaid)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  {((summary.totalPaid / summary.totalRevenue) * 100).toFixed(1)}% of total revenue
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPKR(summary.totalPending)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  {((summary.totalPending / summary.totalRevenue) * 100).toFixed(1)}% of total revenue
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalBookings}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  {summary.activePaymentPlans} payment plans active
                </span>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {summary.overduePayments > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-800 font-medium">
                  {summary.overduePayments} overdue payments require attention
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Management</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/bookings/payments')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Plot Sales Revenue
                </button>
                <button
                  onClick={() => router.push('/dashboard/payment-plans')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Payment Plans
                </button>
                <button
                  onClick={() => router.push('/dashboard/finance/reports')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Revenue Reports
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Expenses</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/dashboard/finance/expenses')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Construction Expenses
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  Marketing Expenses
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  Administrative Costs
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue Collection:</span>
                  <span className="text-sm font-medium text-green-600">
                    {((summary.totalPaid / summary.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profit Margin:</span>
                  <span className="text-sm font-medium text-gray-900">
                    Coming Soon
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cash Flow:</span>
                  <span className="text-sm font-medium text-blue-600">
                    Positive
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview Placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Financial Overview</h3>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Complete financial overview including expenses, profit/loss, and cash flow</p>
              <p className="text-sm mt-2">This comprehensive finance management system will be implemented soon</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}