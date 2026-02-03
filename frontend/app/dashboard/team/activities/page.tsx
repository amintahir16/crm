'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Target,
  DollarSign,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  Eye,
  BarChart3,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  activityType: string;
  description: string;
  createdAt: string;
  isSuccessful: boolean;
  potentialValue: number;
  relatedEntityType: string;
  relatedEntityId: string;
  metadata: any;
}

interface ActivityFilter {
  user: string;
  type: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function TeamActivitiesPage() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>({
    user: '',
    type: '',
    dateRange: {
      startDate: '',
      endDate: ''
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

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
      fetchTeamActivities();
    }
  }, [isAuthenticated, isLoading, isSalesManager, router, filter]);

  const fetchTeamActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch team activities from dedicated endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/team-activities`, { headers });

      if (response.ok) {
        const data = await response.json();
        
        // Transform activities data
        const transformedActivities: TeamActivity[] = data.data?.map((activity: any) => ({
          id: activity.id,
          userId: activity.userId,
          userName: activity.userName || activity.user?.fullName || 'Unknown',
          activityType: activity.activityType,
          description: activity.description,
          createdAt: activity.createdAt,
          isSuccessful: activity.isSuccessful || true,
          potentialValue: activity.potentialValue || 0,
          relatedEntityType: activity.entityType || activity.relatedEntityType || 'unknown',
          relatedEntityId: activity.entityId || activity.relatedEntityId || '',
          metadata: activity.metadata || {}
        })) || [];

        setActivities(transformedActivities);
      } else {
        console.error('Failed to fetch team activities');
      }
    } catch (error) {
      console.error('Error fetching team activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ActivityFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilter(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const resetFilters = () => {
    setFilter({
      user: '',
      type: '',
      dateRange: {
        startDate: '',
        endDate: ''
      }
    });
    setSearchTerm('');
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call_made':
      case 'call':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'email_sent':
      case 'email':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'meeting_scheduled':
      case 'meeting':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'lead_created':
      case 'lead':
        return <Target className="h-4 w-4 text-orange-500" />;
      case 'booking_created':
      case 'booking':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'document_uploaded':
      case 'document':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'interaction_logged':
      case 'interaction':
        return <MessageSquare className="h-4 w-4 text-pink-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call_made':
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email_sent':
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'meeting_scheduled':
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'lead_created':
      case 'lead':
        return 'bg-orange-100 text-orange-800';
      case 'booking_created':
      case 'booking':
        return 'bg-green-100 text-green-800';
      case 'document_uploaded':
      case 'document':
        return 'bg-indigo-100 text-indigo-800';
      case 'interaction_logged':
      case 'interaction':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = filter.user === '' || activity.userName === filter.user;
    const matchesType = filter.type === '' || activity.activityType.toLowerCase().includes(filter.type.toLowerCase());
    
    const matchesDateRange = (!filter.dateRange.startDate || new Date(activity.createdAt) >= new Date(filter.dateRange.startDate)) &&
      (!filter.dateRange.endDate || new Date(activity.createdAt) <= new Date(filter.dateRange.endDate));

    return matchesSearch && matchesUser && matchesType && matchesDateRange;
  });

  const uniqueUsers = Array.from(new Set(activities.map(activity => activity.userName)));
  const uniqueTypes = Array.from(new Set(activities.map(activity => activity.activityType)));

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
          <h1 className="text-2xl font-bold text-gray-900">Team Activities</h1>
          <p className="text-gray-600 mt-1">
            Track and monitor all activities performed by your sales team
          </p>
        </div>
        <button
          onClick={fetchTeamActivities}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User Filter */}
          <select
            value={filter.user}
            onChange={(e) => handleFilterChange('user', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filter.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={filter.dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filter.dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Activities</dt>
                <dd className="text-lg font-medium text-gray-900">{filteredActivities.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                <dd className="text-lg font-medium text-gray-900">{uniqueUsers.length}</dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Potential Value</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatPKR(filteredActivities.reduce((sum, activity) => sum + activity.potentialValue, 0))}
                </dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Today's Activities</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredActivities.filter(activity => {
                    const today = new Date();
                    const activityDate = new Date(activity.createdAt);
                    return activityDate.toDateString() === today.toDateString();
                  }).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Key Achievements Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Key Achievements & Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Most Active User */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Most Active</h4>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const userActivityCounts = filteredActivities.reduce((acc, activity) => {
                  acc[activity.userName] = (acc[activity.userName] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                const mostActive = Object.entries(userActivityCounts).reduce((max, [user, count]) => 
                  count > max.count ? { user, count } : max, { user: 'None', count: 0 });
                return mostActive.count > 0 ? `${mostActive.user} (${mostActive.count} activities)` : 'No data';
              })()}
            </p>
          </div>

          {/* Top Activity Type */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Top Activity</h4>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const activityCounts = filteredActivities.reduce((acc, activity) => {
                  acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                const topActivity = Object.entries(activityCounts).reduce((max, [type, count]) => 
                  count > max.count ? { type, count } : max, { type: 'None', count: 0 });
                return topActivity.count > 0 ? `${topActivity.type.replace(/_/g, ' ')} (${topActivity.count})` : 'No data';
              })()}
            </p>
          </div>

          {/* Success Rate */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Success Rate</h4>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const successfulActivities = filteredActivities.filter(activity => activity.isSuccessful).length;
                const successRate = filteredActivities.length > 0 ? (successfulActivities / filteredActivities.length) * 100 : 0;
                return `${successRate.toFixed(1)}% (${successfulActivities}/${filteredActivities.length})`;
              })()}
            </p>
          </div>

          {/* Revenue Generated */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Revenue Impact</h4>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const totalValue = filteredActivities.reduce((sum, activity) => sum + activity.potentialValue, 0);
                const avgValue = filteredActivities.length > 0 ? totalValue / filteredActivities.length : 0;
                return totalValue > 0 ? `Avg: ${formatPKR(avgValue)} per activity` : 'No revenue data';
              })()}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <Clock className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Recent Activity</h4>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const recentActivity = filteredActivities[0];
                if (recentActivity) {
                  const timeAgo = new Date().getTime() - new Date(recentActivity.createdAt).getTime();
                  const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
                  return hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
                }
                return 'No recent activity';
              })()}
            </p>
          </div>

          {/* Activity Distribution */}
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <BarChart3 className="h-8 w-8 text-pink-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Activity Types</h4>
            <p className="text-sm text-gray-600 mt-1">
              {uniqueTypes.length} different types of activities recorded
            </p>
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activity Timeline</h3>
            <div className="text-sm text-gray-500">
              Showing {filteredActivities.length} activities
            </div>
          </div>
        </div>
        <div className="flow-root">
          <ul className="-mb-8">
            {filteredActivities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index !== filteredActivities.length - 1 && (
                    <span
                      className="absolute top-12 left-6 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-4">
                    {/* Avatar and Icon */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {activity.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white border-2 border-white flex items-center justify-center">
                          <span className={`h-4 w-4 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType)}`}>
                            {getActivityIcon(activity.activityType)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Content */}
                    <div className="min-w-0 flex-1">
                      <div 
                        className={`bg-gray-50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-100 ${
                          expandedActivity === activity.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* User and Activity Type */}
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {activity.userName}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(activity.activityType)}`}>
                                {activity.activityType.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              {activity.isSuccessful && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  ✓ Success
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-700 mb-2">
                              {activity.description}
                            </p>

                            {/* Metadata and Results */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {activity.potentialValue > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatPKR(activity.potentialValue)}
                                </span>
                              )}
                              {activity.relatedEntityType && activity.relatedEntityType !== 'unknown' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                                  <Target className="h-3 w-3 mr-1" />
                                  {activity.relatedEntityType}
                                </span>
                              )}
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {Object.keys(activity.metadata).length} details
                                </span>
                              )}
                            </div>

                            {/* Expanded Details */}
                            {expandedActivity === activity.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="space-y-3">
                                  <div className="text-xs text-gray-500">
                                    <strong>Activity ID:</strong> {activity.id}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <strong>User ID:</strong> {activity.userId}
                                  </div>
                                  {activity.relatedEntityId && (
                                    <div className="text-xs text-gray-500">
                                      <strong>Related Entity:</strong> {activity.relatedEntityType} #{activity.relatedEntityId}
                                    </div>
                                  )}
                                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      <strong>Additional Details:</strong>
                                      <div className="mt-1 bg-white p-2 rounded border">
                                        {Object.entries(activity.metadata).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="font-medium">{key}:</span>
                                            <span>{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    <strong>Timestamp:</strong> {new Date(activity.createdAt).toLocaleString()}
                                  </div>
                                  <div className="flex space-x-2 pt-2">
                                    <button className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Add Note
                                    </button>
                                    <button className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      Follow-up
                                    </button>
                                    <button className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100">
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Timestamp and Expand Indicator */}
                          <div className="text-right text-xs text-gray-500 ml-4">
                            <div className="font-medium">
                              {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div>
                              {new Date(activity.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="mt-1">
                              <span className="text-blue-600 text-xs">
                                {expandedActivity === activity.id ? '▼ Less' : '▶ More'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Activities Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filter.user || filter.type || filter.dateRange.startDate || filter.dateRange.endDate
                ? 'Try adjusting your filters to see more activities.'
                : 'No team activities have been recorded yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
