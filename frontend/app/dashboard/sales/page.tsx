'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  Plus,
  Eye,
  Edit,
  Search,
  Filter,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface SalesStats {
  totalLeads: number;
  convertedLeads: number;
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingFollowUps: number;
  callsMade: number;
  emailsSent: number;
  meetingsScheduled: number;
  conversionRate: number;
}

interface LeadStatusMetric {
  id: string;
  name: string;
  displayName: string;
  color: string;
  count: number;
}

interface LeadStatusMetrics {
  statuses: LeadStatusMetric[];
  total: number;
}

interface RecentActivity {
  id: string;
  type: 'lead_created' | 'lead_converted' | 'customer_created' | 'booking_created' | 'call_made' | 'email_sent';
  description: string;
  timestamp: Date;
  entityId?: string;
  potentialValue?: number;
}

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

export default function SalesDashboard() {
  const { user, isAuthenticated, isLoading, canAccessCRM, isSalesPerson } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [leadStatusMetrics, setLeadStatusMetrics] = useState<LeadStatusMetrics | null>(null);

  const quickActions: QuickAction[] = [
    {
      label: 'Add New Lead',
      href: '/dashboard/customers/leads/new',
      icon: UserPlus,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Add a new sales lead'
    },
    {
      label: 'Add Customer',
      href: '/dashboard/customers/add',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Register a new customer'
    },
    {
      label: 'Create Booking',
      href: '/dashboard/bookings/new',
      icon: Calendar,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Create a new booking'
    },
    {
      label: 'View Customers',
      href: '/dashboard/customers',
      icon: Users,
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'View all customers'
    },
    {
      label: 'View Leads',
      href: '/dashboard/customers/leads',
      icon: Target,
      color: 'bg-teal-600 hover:bg-teal-700',
      description: 'Manage your leads'
    },
    {
      label: 'My Performance',
      href: '/dashboard/sales/performance',
      icon: BarChart3,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      description: 'View your sales metrics'
    }
  ];

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
      fetchSalesData();
    }
  }, [isAuthenticated, isLoading, canAccessCRM, router]);

  const fetchSalesData = async () => {
    try {
      setIsLoadingStats(true);
      
      // Fetch sales statistics
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      if (user?.role === 'sales_manager') {
        // For sales manager, fetch status metrics, basic stats, and recent activities
        const [statsResponse, statusMetricsResponse] = await Promise.all([
          fetch(`${apiUrl}/sales-team/manager-stats`, { headers }),
          fetch(`${apiUrl}/leads/status-metrics`, { headers })
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const transformedStats: SalesStats = {
            totalLeads: statsData.totalLeads || statsData.leadsCreated || 0,
            convertedLeads: statsData.convertedLeads || statsData.leadsConverted || 0,
            totalCustomers: statsData.totalCustomers || statsData.customersCreated || 0,
            totalBookings: statsData.totalBookings || statsData.bookingsCreated || 0,
            totalRevenue: 0,
            pendingFollowUps: 0,
            callsMade: 0,
            emailsSent: 0,
            meetingsScheduled: 0,
            conversionRate: 0,
          };
          setStats(transformedStats);
          
          // Set recent activities if available
          if (statsData.recentActivities && Array.isArray(statsData.recentActivities)) {
            setRecentActivities(statsData.recentActivities.map((activity: any) => ({
              id: activity.id,
              type: activity.type || 'lead_created',
              description: activity.description || `${activity.userName || 'Team member'}: Activity`,
              timestamp: new Date(activity.createdAt || activity.timestamp),
              entityId: activity.leadId || activity.id,
              potentialValue: activity.potentialValue
            })));
          }
        }

        if (statusMetricsResponse && statusMetricsResponse.ok) {
          const statusMetricsData = await statusMetricsResponse.json();
          setLeadStatusMetrics(statusMetricsData);
        }
      } else {
        // For sales person, fetch all data
        const [statsResponse, activitiesResponse] = await Promise.all([
          fetch(`${apiUrl}/sales-team/agent-stats`, { headers }),
          fetch(`${apiUrl}/sales-activities/my-activities?limit=10`, { headers })
        ]);

        if (statsResponse.ok && activitiesResponse.ok) {
          const statsData = await statsResponse.json();
          const activitiesData = await activitiesResponse.json();
          
          const transformedStats: SalesStats = {
            totalLeads: statsData.totalLeads || statsData.leadsCreated || 0,
            convertedLeads: statsData.convertedLeads || statsData.leadsConverted || 0,
            totalCustomers: statsData.totalCustomers || statsData.customersCreated || 0,
            totalBookings: statsData.totalBookings || statsData.bookingsCreated || 0,
            totalRevenue: statsData.totalRevenue || statsData.totalPotentialValue || 0,
            pendingFollowUps: statsData.pendingFollowUps || 0,
            callsMade: statsData.callsMade || 0,
            emailsSent: statsData.emailsSent || 0,
            meetingsScheduled: statsData.meetingsScheduled || statsData.meetingsHeld || 0,
            conversionRate: statsData.conversionRate || (statsData.totalLeads > 0 ? (statsData.convertedLeads / statsData.totalLeads) * 100 : 0) || (statsData.leadsCreated > 0 ? (statsData.leadsConverted / statsData.leadsCreated) * 100 : 0),
          };

          setStats(transformedStats);
          setRecentActivities(activitiesData.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.createdAt)
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Set default stats to prevent UI breaking
      setStats({
        totalLeads: 0,
        convertedLeads: 0,
        totalCustomers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingFollowUps: 0,
        callsMade: 0,
        emailsSent: 0,
        meetingsScheduled: 0,
        conversionRate: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (isLoading || isLoadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your sales dashboard...</p>
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
          <p className="text-gray-600">You don't have permission to access the sales dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Only for Sales Manager */}
      {user?.role === 'sales_manager' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's your sales performance overview
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics - Only for Sales Manager */}
      {user?.role === 'sales_manager' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalLeads || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Status Metrics - Only for Sales Manager */}
      {user?.role === 'sales_manager' && leadStatusMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {leadStatusMetrics.statuses.map((status) => (
              <div key={status.id} className="text-center">
                <div 
                  className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${status.color}20` }}
                >
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: status.color }}
                  ></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                <p className="text-xs text-gray-600 mt-1">{status.displayName}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Leads</span>
              <span className="text-lg font-bold text-gray-900">{leadStatusMetrics.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity - For Sales Manager */}
      {user?.role === 'sales_manager' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Team Activity</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                  {activity.potentialValue && (
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPKR(activity.potentialValue)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Helper function to get activity icon
function getActivityIcon(type: string) {
  switch (type) {
    case 'lead_created':
      return <Target className="h-4 w-4 text-blue-500" />;
    case 'lead_converted':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'customer_created':
      return <Users className="h-4 w-4 text-orange-500" />;
    case 'booking_created':
      return <Calendar className="h-4 w-4 text-purple-500" />;
    case 'call_made':
      return <Phone className="h-4 w-4 text-blue-500" />;
    case 'email_sent':
      return <Mail className="h-4 w-4 text-indigo-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
}
