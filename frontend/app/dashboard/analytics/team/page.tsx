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
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  averageWorkload: number;
  topPerformers: Array<{
    name: string;
    leads: number;
    converted: number;
    conversionRate: number;
    revenue: number;
  }>;
  teamStats: {
    totalLeads: number;
    convertedLeads: number;
    totalRevenue: number;
    averageDealSize: number;
  };
  recentActivities: Array<{
    user: string;
    activity: string;
    timestamp: string;
  }>;
}

export default function TeamAnalyticsPage() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const [teamData, setTeamData] = useState<TeamPerformance | null>(null);
  const [loading, setLoading] = useState(true);

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
      fetchTeamAnalytics();
    }
  }, [isAuthenticated, isLoading, isSalesManager, router]);

  const fetchTeamAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/dashboard/sales-manager`, { headers });

      if (response.ok) {
        const data = await response.json();
        
        // Transform the data to match our interface
        const transformedData: TeamPerformance = {
          totalMembers: data.teamStats?.totalMembers || 0,
          activeMembers: data.teamStats?.activeMembers || 0,
          averageWorkload: data.teamStats?.averageWorkload || 0,
          topPerformers: data.teamPerformance?.map((member: any) => ({
            name: member.name,
            leads: member.totalLeads || 0,
            converted: member.convertedLeads || 0,
            conversionRate: member.conversionRate || 0,
            revenue: member.totalRevenue || 0,
          })) || [],
          teamStats: {
            totalLeads: data.leadStats?.totalLeads || 0,
            convertedLeads: data.leadStats?.convertedLeads || 0,
            totalRevenue: data.paymentStats?.totalRevenue || 0,
            averageDealSize: data.paymentStats?.averageDealSize || 0,
          },
          recentActivities: data.recentActivities?.map((activity: any) => ({
            user: activity.user?.fullName || 'Unknown',
            activity: activity.description || 'Unknown activity',
            timestamp: activity.createdAt || new Date().toISOString(),
          })) || [],
        };

        setTeamData(transformedData);
      } else {
        console.error('Failed to fetch team analytics');
      }
    } catch (error) {
      console.error('Error fetching team analytics:', error);
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

  if (!teamData) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Team Data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load team analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Performance Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive team performance metrics and insights
          </p>
        </div>
        <button
          onClick={fetchTeamAnalytics}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Team Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                <dd className="text-lg font-medium text-gray-900">{teamData.totalMembers}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Members</dt>
                <dd className="text-lg font-medium text-gray-900">{teamData.activeMembers}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Workload</dt>
                <dd className="text-lg font-medium text-gray-900">{teamData.averageWorkload.toFixed(1)}</dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Team Revenue</dt>
                <dd className="text-lg font-medium text-gray-900">{formatPKR(teamData.teamStats.totalRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Team Performance Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Total Leads</span>
              <span className="text-sm font-medium text-gray-900">{teamData.teamStats.totalLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Converted Leads</span>
              <span className="text-sm font-medium text-gray-900">{teamData.teamStats.convertedLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {teamData.teamStats.totalLeads > 0 
                  ? ((teamData.teamStats.convertedLeads / teamData.teamStats.totalLeads) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Average Deal Size</span>
              <span className="text-sm font-medium text-gray-900">{formatPKR(teamData.teamStats.averageDealSize)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {teamData.topPerformers.slice(0, 5).map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {performer.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                    <div className="text-xs text-gray-500">{performer.leads} leads, {performer.converted} converted</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{formatPKR(performer.revenue)}</div>
                  <div className="text-xs text-gray-500">{performer.conversionRate.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Team Activities */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Team Activities</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {teamData.recentActivities.slice(0, 10).map((activity, index) => (
              <li key={index}>
                <div className="relative pb-8">
                  {index !== teamData.recentActivities.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <Activity className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                          {activity.activity}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
