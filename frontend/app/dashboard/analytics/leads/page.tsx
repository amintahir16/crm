'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Target,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  UserCheck,
  Clock,
} from 'lucide-react';

interface LeadAnalytics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  leadsBySource: Array<{ source: string; count: number; percentage: number }>;
  leadsByPriority: Array<{ priority: string; count: number; percentage: number }>;
  leadsByStatus: Array<{ status: string; count: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; leads: number; converted: number }>;
  topPerformers: Array<{ name: string; leads: number; converted: number; rate: number }>;
}

export default function LeadAnalyticsPage() {
  const { user, isAuthenticated, isLoading, canAccessCRM } = useAuth();
  const router = useRouter();
  const [leadData, setLeadData] = useState<LeadAnalytics | null>(null);
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
      fetchLeadAnalytics();
    }
  }, [isAuthenticated, isLoading, canAccessCRM, router, dateRange]);

  const fetchLeadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch leads data
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const leadsResponse = await fetch(`${apiUrl}/leads`, { headers });
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        
        // Process the leads data to create analytics
        const processedData = processLeadsData(leadsData);
        setLeadData(processedData);
      } else {
        console.error('Failed to fetch lead analytics');
      }
    } catch (error) {
      console.error('Error fetching lead analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processLeadsData = (leads: any[]): LeadAnalytics => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'new').length;
    const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    const lostLeads = leads.filter(lead => lead.status === 'lost').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Group by source
    const sourceGroups = leads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const leadsBySource = Object.entries(sourceGroups).map(([source, count]) => ({
      source,
      count: count as number,
      percentage: totalLeads > 0 ? ((count as number) / totalLeads) * 100 : 0
    }));

    // Group by priority
    const priorityGroups = leads.reduce((acc, lead) => {
      const priority = lead.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const leadsByPriority = Object.entries(priorityGroups).map(([priority, count]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count: count as number,
      percentage: totalLeads > 0 ? ((count as number) / totalLeads) * 100 : 0
    }));

    // Group by status
    const statusGroups = leads.reduce((acc, lead) => {
      const status = lead.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const leadsByStatus = Object.entries(statusGroups).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count as number,
      percentage: totalLeads > 0 ? ((count as number) / totalLeads) * 100 : 0
    }));

    // Group by assigned user for top performers
    const userGroups = leads.reduce((acc, lead) => {
      const userName = lead.assignedToUser?.fullName || 'Unassigned';
      if (!acc[userName]) {
        acc[userName] = { total: 0, converted: 0 };
      }
      acc[userName].total += 1;
      if (lead.status === 'converted') {
        acc[userName].converted += 1;
      }
      return acc;
    }, {});

    const topPerformers = Object.entries(userGroups).map(([name, data]: [string, any]) => ({
      name,
      leads: data.total,
      converted: data.converted,
      rate: data.total > 0 ? (data.converted / data.total) * 100 : 0
    })).sort((a, b) => b.converted - a.converted).slice(0, 5);

    // Monthly trend (simplified)
    const monthlyTrend = [
      { month: '2024-09', leads: Math.floor(totalLeads * 0.3), converted: Math.floor(convertedLeads * 0.3) },
      { month: '2024-10', leads: Math.floor(totalLeads * 0.7), converted: Math.floor(convertedLeads * 0.7) },
    ];

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      leadsBySource,
      leadsByPriority,
      leadsByStatus,
      monthlyTrend,
      topPerformers
    };
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

  if (!leadData) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Lead Data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load lead analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive lead performance metrics and insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchLeadAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                <dd className="text-lg font-medium text-gray-900">{leadData.totalLeads}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">New Leads</dt>
                <dd className="text-lg font-medium text-gray-900">{leadData.newLeads}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Qualified</dt>
                <dd className="text-lg font-medium text-gray-900">{leadData.qualifiedLeads}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Converted</dt>
                <dd className="text-lg font-medium text-gray-900">{leadData.convertedLeads}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                <dd className="text-lg font-medium text-gray-900">{leadData.conversionRate.toFixed(1)}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leads by Source</h3>
          <div className="space-y-3">
            {leadData.leadsBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">{source.source}</div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">{source.count} leads</div>
                  <div className="text-sm font-medium text-gray-900">{source.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Priority */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leads by Priority</h3>
          <div className="space-y-3">
            {leadData.leadsByPriority.map((priority, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">{priority.priority}</div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">{priority.count} leads</div>
                  <div className="text-sm font-medium text-gray-900">{priority.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads by Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leads by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {leadData.leadsByStatus.map((status, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{status.count}</div>
              <div className="text-sm text-gray-500">{status.status}</div>
              <div className="text-xs text-gray-400">{status.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Performers</h3>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Converted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leadData.topPerformers.map((performer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {performer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {performer.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {performer.converted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {performer.rate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
