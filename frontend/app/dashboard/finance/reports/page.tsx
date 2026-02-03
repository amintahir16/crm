'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface FinancialReport {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueByMonth: Array<{ month: string; amount: number }>;
  expensesByMonth: Array<{ month: string; amount: number }>;
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
  overdueAmount: number;
  collectionRate: number;
  cashFlow: Array<{ date: string; inflow: number; outflow: number; balance: number }>;
}

export default function FinancialReportsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFinancialReport();
    }
  }, [isAuthenticated, startDate, endDate]);

  const fetchFinancialReport = async () => {
    try {
      setIsLoadingReport(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${apiUrl}/analytics/financial?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching financial report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement PDF/Excel export
    alert('Export functionality will be implemented soon');
  };

  if (isLoading) {
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analysis and reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {isLoadingReport ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPKR(report.totalRevenue || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPKR(report.totalExpenses || 0)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${(report.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPKR(report.netProfit || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((report.collectionRate || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
            <div className="space-y-4">
              {report.revenueByMonth && report.revenueByMonth.length > 0 ? (
                report.revenueByMonth.map((item, index) => {
                  const expense = report.expensesByMonth[index];
                  const maxAmount = Math.max(item.amount, expense?.amount || 0);
                  
                  return (
                    <div key={item.month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.month}</span>
                        <div className="flex gap-4">
                          <span className="text-green-600">Revenue: {formatPKR(item.amount)}</span>
                          <span className="text-red-600">Expenses: {formatPKR(expense?.amount || 0)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 h-4">
                        <div
                          className="bg-green-500 rounded"
                          style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                        />
                        <div
                          className="bg-red-500 rounded"
                          style={{ width: `${((expense?.amount || 0) / maxAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {report.paymentMethods && report.paymentMethods.length > 0 ? (
                report.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{method.method.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">{method.count} transactions</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{formatPKR(method.amount)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No payment data available</p>
              )}
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inflow</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outflow</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.cashFlow && report.cashFlow.length > 0 ? (
                    report.cashFlow.map((flow) => (
                      <tr key={flow.date}>
                        <td className="px-4 py-3 text-sm text-gray-900">{flow.date}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{formatPKR(flow.inflow)}</td>
                        <td className="px-4 py-3 text-sm text-red-600">{formatPKR(flow.outflow)}</td>
                        <td className={`px-4 py-3 text-sm font-medium ${flow.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPKR(flow.balance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No cash flow data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load financial report</p>
        </div>
      )}
    </div>
  );
}
