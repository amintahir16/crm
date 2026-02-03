'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  DollarSign, 
  Calendar,
  PieChart,
  BarChart3,
  Activity,
  Target,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface DashboardAnalytics {
  totalCustomers: number;
  totalPlots: number;
  availablePlots: number;
  soldPlots: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  activeProjects: number;
  completedProjects: number;
  totalDocuments: number;
  unreadNotifications: number;
  recentActivity: any[];
}

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

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [dashboardResponse, salesResponse] = await Promise.all([
        fetch('/api/v1/analytics/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/v1/analytics/sales', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        setDashboardData(dashboard);
      }

      if (salesResponse.ok) {
        const sales = await salesResponse.json();
        setSalesData(sales);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'sales', name: 'Sales', icon: TrendingUp },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'construction', name: 'Construction', icon: Building },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600">Comprehensive insights into your business performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.totalCustomers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Plots</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.totalPlots}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatPKR(dashboardData.totalRevenue)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Bookings</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.activeBookings}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plot Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Plot Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.availablePlots}</div>
                  <div className="text-sm text-gray-500">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.soldPlots}</div>
                  <div className="text-sm text-gray-500">Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {dashboardData.totalPlots - dashboardData.availablePlots - dashboardData.soldPlots}
                  </div>
                  <div className="text-sm text-gray-500">Reserved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Construction Projects */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Construction Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.activeProjects}</div>
                  <div className="text-sm text-gray-500">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.completedProjects}</div>
                  <div className="text-sm text-gray-500">Completed Projects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'booking' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {activity.type === 'payment' && <DollarSign className="h-5 w-5 text-blue-500" />}
                      {activity.type === 'construction' && <Building className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} - {formatPKR(activity.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          {/* Sales Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatPKR(salesData.totalSales)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{salesData.conversionRate.toFixed(1)}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Deal Size</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatPKR(salesData.averageDealSize)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Customers</h3>
              <div className="space-y-3">
                {salesData.topCustomers.slice(0, 5).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{customer.customer}</div>
                        <div className="text-sm text-gray-500">{customer.bookings} bookings</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{formatPKR(customer.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sales by Plot Size */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sales by Plot Size</h3>
              <div className="space-y-3">
                {salesData.salesByPlotSize.map((size, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{size.size} Marla</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">{size.count} plots</div>
                      <div className="text-sm font-medium text-gray-900">{formatPKR(size.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {activeTab === 'financial' && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Financial Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Customer Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}

      {activeTab === 'construction' && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Construction Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}
    </div>
  );
}
