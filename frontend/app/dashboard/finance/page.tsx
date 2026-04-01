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
  ArrowDownRight,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface FinanceSummary {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalBookings: number;
  activePaymentPlans: number;
  overduePayments: number;
  overdueAmount?: number;
  monthlyGrowthText?: string;
  totalExpenses?: number;
  collectionRate?: number;
  cashFlow?: number;
  growthIndicator?: 'up' | 'down';
  currentMonthRevenue?: number;
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
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/finance/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        console.error('Failed to fetch finance summary');
        // Fallback to error state or empty summary
      }
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
                {summary.growthIndicator === 'up' ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{summary.monthlyGrowthText}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">{summary.monthlyGrowthText}</span>
                  </>
                )}
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
                  {(summary.collectionRate || 0).toFixed(1)}% of total revenue
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
                  {(100 - (summary.collectionRate || 0)).toFixed(1)}% of total revenue
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-800 font-medium">
                    {summary.overduePayments} overdue payments require attention
                  </span>
                </div>
                {summary.overdueAmount && (
                  <span className="text-red-700 font-semibold">
                    Amount: {formatPKR(summary.overdueAmount)}
                  </span>
                )}
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
                    {(summary.collectionRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profit Margin:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {summary.totalRevenue > 0 
                      ? `${(((summary.totalRevenue - (summary.totalExpenses || 0)) / summary.totalRevenue) * 100).toFixed(1)}%`
                      : '0.0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cash Flow:</span>
                  <span className={`text-sm font-medium ${(summary.cashFlow || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {(summary.cashFlow || 0) > 0 ? 'Positive' : (summary.cashFlow || 0) < 0 ? 'Negative' : 'Neutral'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview (Real) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Financial Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Revenue Performance (Collected vs Total)</span>
                  <span className="font-semibold">{formatPKR(summary.totalPaid)} / {formatPKR(summary.totalRevenue)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, summary.collectionRate || 0)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {summary.totalRevenue > 0 
                    ? `You've collected ${(summary.collectionRate || 0).toFixed(1)}% of total projected revenue.`
                    : 'No revenue data currently available.'
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Expense Ratio (Expenses vs Collected)</span>
                  <span className="font-semibold">{formatPKR(summary.totalExpenses || 0)} / {formatPKR(summary.totalPaid)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-red-400 h-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (summary.totalPaid > 0 ? ((summary.totalExpenses || 0) / summary.totalPaid) * 100 : 0))}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {summary.totalPaid > 0 
                    ? `Expenses represent ${((summary.totalExpenses || 0) / summary.totalPaid * 100).toFixed(1)}% of your collected funds.`
                    : 'No collected funds to calculate ratio.'
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}