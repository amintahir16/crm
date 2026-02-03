'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  Award,
  Clock,
  DollarSign,
  Calendar,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  workloadScore: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalBookings: number;
  totalRevenue: number;
  averageDealSize: number;
  activitiesCount: number;
  lastActivity: string;
  performanceScore: number;
}

interface TeamPerformanceMetrics {
  totalMembers: number;
  averageConversionRate: number;
  totalRevenue: number;
  topPerformer: string;
  teamGoal: number;
  goalProgress: number;
  monthlyTarget: number;
  monthlyProgress: number;
}

export default function TeamPerformancePage() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMemberPerformance[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamPerformanceMetrics | null>(null);
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

    if (!isLoading && !isSalesManager()) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && isSalesManager()) {
      fetchTeamPerformance();
    }
  }, [isAuthenticated, isLoading, isSalesManager, router, dateRange]);

  const fetchTeamPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch team performance data from dedicated endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/sales-team/performance`, { headers });

      if (response.ok) {
        const data = await response.json();
        
        // Use the data directly from the backend
        const transformedMembers: TeamMemberPerformance[] = data.members || [];
        const transformedMetrics: TeamPerformanceMetrics = {
          totalMembers: data.totalMembers || 0,
          averageConversionRate: data.averageConversionRate || 0,
          totalRevenue: data.totalRevenue || 0,
          topPerformer: data.topPerformer || '',
          teamGoal: data.teamGoal || 1000000,
          goalProgress: data.goalProgress || 0,
          monthlyTarget: data.monthlyTarget || 500000,
          monthlyProgress: data.monthlyProgress || 0
        };

        setTeamMembers(transformedMembers);
        setTeamMetrics(transformedMetrics);
      } else {
        console.error('Failed to fetch team performance data');
      }
    } catch (error) {
      console.error('Error fetching team performance:', error);
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

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Performance</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive performance metrics and analytics for your sales team
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchTeamPerformance}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="h-4 w-4 mr-2" />
            Export Report
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

      {/* Team Overview Metrics */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.totalMembers}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Conversion</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.averageConversionRate.toFixed(1)}%</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatPKR(teamMetrics.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Top Performer</dt>
                  <dd className="text-lg font-medium text-gray-900">{teamMetrics.topPerformer || 'N/A'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Progress */}
      {teamMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Annual Goal Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Target: {formatPKR(teamMetrics.teamGoal)}</span>
                <span className="text-sm font-medium text-gray-900">{teamMetrics.goalProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(teamMetrics.goalProgress, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                Current: {formatPKR(teamMetrics.totalRevenue)} / {formatPKR(teamMetrics.teamGoal)}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Target Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Target: {formatPKR(teamMetrics.monthlyTarget)}</span>
                <span className="text-sm font-medium text-gray-900">{teamMetrics.monthlyProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(teamMetrics.monthlyProgress, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                Current: {formatPKR(teamMetrics.totalRevenue)} / {formatPKR(teamMetrics.monthlyTarget)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Performance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Individual Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workload
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{member.totalLeads}</div>
                      <div className="text-gray-500">{member.convertedLeads} converted</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(member.conversionRate)}`}>
                      {member.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.totalBookings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{formatPKR(member.totalRevenue)}</div>
                      <div className="text-gray-500">Avg: {formatPKR(member.averageDealSize)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(member.performanceScore)}`}>
                      {getPerformanceBadge(member.performanceScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((member.workloadScore / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{member.workloadScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Conversion Trend</h4>
            <p className="text-sm text-gray-600 mt-1">
              {teamMetrics && teamMetrics.averageConversionRate > 60 ? 'Strong performance' : 'Room for improvement'}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Revenue Growth</h4>
            <p className="text-sm text-gray-600 mt-1">
              {teamMetrics && teamMetrics.totalRevenue > 500000 ? 'Meeting targets' : 'Below target'}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Team Health</h4>
            <p className="text-sm text-gray-600 mt-1">
              {teamMembers.length > 0 ? 'Active team' : 'No team members'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
