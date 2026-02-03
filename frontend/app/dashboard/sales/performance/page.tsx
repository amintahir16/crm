'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface PerformanceMetrics {
  totalActivities: number;
  leadsCreated: number;
  leadsConverted: number;
  customersCreated: number;
  bookingsCreated: number;
  callsMade: number;
  emailsSent: number;
  meetingsHeld: number;
  totalPotentialValue: number;
  averageActivityDuration: number;
  successRate: number;
  conversionRate: number;
}

interface ActivityTrend {
  date: string;
  count: number;
  potentialValue: number;
}

export default function SalesPerformancePage() {
  const { user, isAuthenticated, isLoading, canAccessCRM } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<ActivityTrend[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');

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
      fetchPerformanceData();
    }
  }, [isAuthenticated, isLoading, canAccessCRM, router, selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoadingData(true);
      
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod));

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const [metricsResponse, trendsResponse] = await Promise.all([
        fetch(`${apiUrl}/sales-activities/my-stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, { headers }),
        fetch(`${apiUrl}/sales-activities/my-trends?days=${selectedPeriod}`, { headers })
      ]);

      if (metricsResponse.ok && trendsResponse.ok) {
        const metricsData = await metricsResponse.json();
        const trendsData = await trendsResponse.json();
        
        const transformedMetrics: PerformanceMetrics = {
          totalActivities: metricsData.totalActivities || 0,
          leadsCreated: metricsData.leadsCreated || 0,
          leadsConverted: metricsData.leadsConverted || 0,
          customersCreated: metricsData.customersCreated || 0,
          bookingsCreated: metricsData.bookingsCreated || 0,
          callsMade: metricsData.callsMade || 0,
          emailsSent: metricsData.emailsSent || 0,
          meetingsHeld: metricsData.meetingsHeld || 0,
          totalPotentialValue: metricsData.totalPotentialValue || 0,
          averageActivityDuration: metricsData.averageActivityDuration || 0,
          successRate: metricsData.successRate || 0,
          conversionRate: metricsData.leadsCreated > 0 ? (metricsData.leadsConverted / metricsData.leadsCreated) * 100 : 0,
        };

        setMetrics(transformedMetrics);
        setTrends(trendsData);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!canAccessCRM()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access performance data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Performance</h1>
            <p className="text-gray-600 mt-1">
              Track your sales activities and performance metrics
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as '7' | '30' | '90')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics?.conversionRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {metrics?.leadsConverted || 0} of {metrics?.leadsCreated || 0} leads converted
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics?.successRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Of all activities
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Activity Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(metrics?.averageActivityDuration || 0)}m
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Per activity
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.totalActivities || 0}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Last {selectedPeriod} days
            </span>
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Leads Created</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{metrics?.leadsCreated || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Leads Converted</span>
              </div>
              <span className="text-lg font-bold text-green-600">{metrics?.leadsConverted || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Customers Added</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{metrics?.customersCreated || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-gray-900">Bookings Created</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{metrics?.bookingsCreated || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Activities</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Calls Made</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{metrics?.callsMade || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Emails Sent</span>
              </div>
              <span className="text-lg font-bold text-green-600">{metrics?.emailsSent || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Meetings Held</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{metrics?.meetingsHeld || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Potential Value</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {formatPKR(metrics?.totalPotentialValue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
        {trends.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Daily Activity Count</h4>
                <div className="space-y-2">
                  {trends.slice(-7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(trend.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (trend.count / Math.max(...trends.map(t => t.count))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{trend.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Daily Potential Value</h4>
                <div className="space-y-2">
                  {trends.slice(-7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(trend.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (trend.potentialValue / Math.max(...trends.map(t => t.potentialValue))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPKR(trend.potentialValue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activity data available</p>
            <p className="text-sm">Start logging activities to see trends</p>
          </div>
        )}
      </div>

      {/* Performance Goals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(100, (metrics?.conversionRate || 0))}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {(metrics?.conversionRate || 0).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Conversion Rate</p>
            <p className="text-xs text-gray-500">Goal: 25%</p>
          </div>

          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(100, ((metrics?.leadsCreated || 0) / 50) * 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {metrics?.leadsCreated || 0}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Leads Created</p>
            <p className="text-xs text-gray-500">Goal: 50/month</p>
          </div>

          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(100, ((metrics?.totalActivities || 0) / 100) * 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {metrics?.totalActivities || 0}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Total Activities</p>
            <p className="text-xs text-gray-500">Goal: 100/month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
