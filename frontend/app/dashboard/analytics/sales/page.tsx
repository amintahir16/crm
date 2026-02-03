'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface SalesAnalytics {
  totalSales: number;
  monthlySales: Array<{ month: string; amount: number; count: number }>;
  salesByPlotSize: Array<{ size: string; amount: number; count: number }>;
  salesByPaymentType: Array<{ type: string; amount: number; count: number }>;
  topCustomers: Array<{ customer: string; amount: number; bookings: number }>;
  conversionRate: number;
  averageDealSize: number;
  salesTrend: Array<{ date: string; amount: number }>;
}

export default function SalesAnalyticsPage() {
  const { user, isAuthenticated, isLoading, canAccessCRM } = useAuth();
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!isLoading && !canAccessCRM()) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && canAccessCRM()) {
      fetchSalesAnalytics();
    }
  }, [isAuthenticated, isLoading, canAccessCRM, router, dateRange]);

  const fetchSalesAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      let url = `${apiUrl}/analytics/sales`;
      if (dateRange.startDate && dateRange.endDate) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      } else {
        console.error('Failed to fetch sales analytics');
      }
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Sales Data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load sales analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive sales performance metrics and insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSalesAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            />
          </div>
          <button
            onClick={resetDateRange}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                <dd className="text-lg font-medium text-gray-900">{formatPKR(salesData.totalSales)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                <dd className="text-lg font-medium text-gray-900">{salesData.conversionRate.toFixed(1)}%</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Deal Size</dt>
                <dd className="text-lg font-medium text-gray-900">{formatPKR(salesData.averageDealSize)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Monthly Sales</dt>
                <dd className="text-lg font-medium text-gray-900">{salesData.monthlySales.length} months</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Sales Trend</h3>
          <div className="space-y-3">
            {salesData.monthlySales.slice(0, 6).map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">{month.month}</div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">{month.count} sales</div>
                  <div className="text-sm font-medium text-gray-900">{formatPKR(month.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Plot Size */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sales by Plot Size</h3>
          <div className="space-y-3">
            {salesData.salesByPlotSize.map((size, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">{size.size}</div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">{size.count} plots</div>
                  <div className="text-sm font-medium text-gray-900">{formatPKR(size.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Customers</h3>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.topCustomers.map((customer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.bookings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPKR(customer.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sales by Payment Method</h3>
        <div className="space-y-3">
          {salesData.salesByPaymentType.map((method, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">{method.type}</div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">{method.count} payments</div>
                <div className="text-sm font-medium text-gray-900">{formatPKR(method.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
