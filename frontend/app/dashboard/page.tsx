'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Map,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Building,
  CreditCard,
  AlertCircle,
  Hammer,
  FileImage,
  MessageSquare,
  Bell,
  Shield,
  Activity,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  Database,
  Zap,
  Target,
  ClipboardList,
  Archive,
  UserCheck,
  Mail,
  Phone,
  Wrench,
  Globe,
  Home,
  Briefcase,
  Search,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface DashboardStats {
  totalPlots: number;
  soldPlots: number;
  availablePlots: number;
  totalRevenue: number;
  pendingReceivables: number;
  totalCustomers: number;
  totalBookings: number;
  overdueInstallments: number;
  activeProjects: number;
  completedProjects: number;
  pendingDocuments: number;
  unreadMessages: number;
  systemAlerts: number;
  monthlyRevenue: number;
  quarterlyGrowth: number;
  customerSatisfaction: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'plot_sold' | 'customer_added' | 'project_started' | 'document_uploaded' | 'message_received' | 'task_completed';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

interface WidgetData {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, getDefaultDashboard, isSalesManager } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [salesManagerData, setSalesManagerData] = useState<any>(null);

  const quickActions: QuickAction[] = [
    {
      label: 'Add New Plot',
      href: '/dashboard/plots/add',
      icon: Building,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Add a new plot to the inventory'
    },
    {
      label: 'Add Customer',
      href: '/dashboard/customers/add',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Register a new customer'
    },
    {
      label: 'Add Lead',
      href: '/dashboard/customers/leads/new',
      icon: Search,
      color: 'bg-teal-600 hover:bg-teal-700',
      description: 'Add a new sales lead'
    },
    {
      label: 'Import Leads',
      href: '/dashboard/customers/leads?import=csv',
      icon: Upload,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      description: 'Import leads from CSV file'
    },
    {
      label: 'Create Booking',
      href: '/dashboard/bookings/new',
      icon: Calendar,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Create a new booking'
    },
    {
      label: 'Start Project',
      href: '/dashboard/construction/projects',
      icon: Hammer,
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Start a construction project'
    },
    {
      label: 'Upload Document',
      href: '/dashboard/documents/upload',
      icon: Upload,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      description: 'Upload a new document'
    },
    {
      label: 'Send Message',
      href: '/dashboard/communication/messages',
      icon: MessageSquare,
      color: 'bg-pink-600 hover:bg-pink-700',
      description: 'Send a message to customer'
    }
  ];

  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      // Redirect sales persons to their dedicated dashboard
      const defaultDashboard = getDefaultDashboard();
      if (defaultDashboard !== '/dashboard') {
        console.log(`Redirecting ${user.role} to ${defaultDashboard}`);
        router.push(defaultDashboard);
        return;
      }
      
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading, user, router, getDefaultDashboard]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      if (!token) {
        console.error('No access token found in localStorage');
        return;
      }
      
      const endpoint = isSalesManager() ? 'dashboard/sales-manager' : 'dashboard/stats';
      console.log('Fetching dashboard data from:', `${apiUrl}/${endpoint}`);
      console.log('Is sales manager:', isSalesManager());
      
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard data received:', data);
        
        if (isSalesManager()) {
          // Sales manager dashboard returns different structure
          console.log('Setting sales manager data:', data);
          setSalesManagerData(data);
          setRecentActivities(data.recentActivities || []);
        } else {
          // Admin dashboard
          setStats(data.stats);
          setRecentActivities(data.recentActivities);
        }
      } else {
        console.error('Failed to fetch dashboard data. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleQuickAction = (href: string) => {
    router.push(href);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'plot_sold':
        return <Building className="h-4 w-4 text-purple-500" />;
      case 'customer_added':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'project_started':
        return <Hammer className="h-4 w-4 text-orange-500" />;
      case 'document_uploaded':
        return <FileImage className="h-4 w-4 text-indigo-500" />;
      case 'message_received':
        return <MessageSquare className="h-4 w-4 text-pink-500" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600">
          {isSalesManager() 
            ? "Here's your sales team performance overview and CRM metrics."
            : "Here's what's happening with Queen Hills Murree today."
          }
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSalesManager() ? (
          // Sales Manager Stats
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesManagerData?.teamStats?.totalMembers || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {salesManagerData?.teamStats?.activeMembers || 0} active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesManagerData?.leadStats?.totalLeads || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {salesManagerData?.leadStats?.conversionRate?.toFixed(1) || 0}% conversion rate
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesManagerData?.customerStats?.totalCustomers || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {salesManagerData?.customerStats?.newCustomers || 0} new this month
                </span>
              </div>
            </div>

          </>
        ) : (
          // Admin Stats
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Plots</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalPlots || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Map className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {stats?.soldPlots || 0} sold • {stats?.availablePlots || 0} available
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPKR(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {formatPKR(stats?.pendingReceivables || 0)} pending
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalCustomers || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {stats?.totalBookings || 0} bookings
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.overdueInstallments || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Requires attention</span>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {isSalesManager() ? (
          // Sales Manager Secondary Stats
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">New Leads</p>
                  <p className="text-lg font-bold text-gray-900">
                    {salesManagerData?.leadStats?.newLeads || 0}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>


            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Confirmed Bookings</p>
                  <p className="text-lg font-bold text-gray-900">
                    {salesManagerData?.bookingStats?.confirmedBookings || 0}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending Bookings</p>
                  <p className="text-lg font-bold text-gray-900">
                    {salesManagerData?.bookingStats?.pendingBookings || 0}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending Payments</p>
                  <p className="text-lg font-bold text-gray-900">
                    {salesManagerData?.paymentStats?.pendingPayments || 0}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <CreditCard className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Admin Secondary Stats
          <>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Active Projects</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.activeProjects || 0}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Hammer className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Pending Docs</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.pendingDocuments || 0}
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileImage className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Unread Messages</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.unreadMessages || 0}
              </p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <MessageSquare className="h-4 w-4 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">System Alerts</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.systemAlerts || 0}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {formatPKR(stats?.monthlyRevenue || 0)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Growth Rate</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.quarterlyGrowth || 0}%
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Charts and Analytics - Only for Admin */}
      {!isSalesManager() && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Sales analytics chart</p>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Revenue breakdown</p>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="text-sm font-medium text-gray-900">{Math.min(100, stats?.customerSatisfaction || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, stats?.customerSatisfaction || 0)}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Project Completion</span>
                <span className="text-sm font-medium text-gray-900">{stats?.completedProjects || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats?.completedProjects || 0) * 10}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Document Processing</span>
                <span className="text-sm font-medium text-gray-900">{100 - (stats?.pendingDocuments || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${100 - (stats?.pendingDocuments || 0)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity and System Status - Only for Admin */}
      {!isSalesManager() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        {activity.status && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {activity.amount && (
                      <div className="flex-shrink-0">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPKR(activity.amount)}
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

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Database</span>
                </div>
                <span className="text-sm text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">API Services</span>
                </div>
                <span className="text-sm text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">File Storage</span>
                </div>
                <span className="text-sm text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Backup System</span>
                </div>
                <span className="text-sm text-yellow-600">Scheduled</span>
              </div>
              {stats?.systemAlerts && stats.systemAlerts > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">System Alerts</span>
                  </div>
                  <span className="text-sm text-red-600">{stats.systemAlerts} active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Only for Admin */}
      {!isSalesManager() && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.href)}
                className={`flex items-center justify-center space-x-2 px-4 py-3 ${action.color} text-white rounded-lg transition-colors`}
              >
                <action.icon className="h-5 w-5" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Click any action above to navigate to the respective page
            </p>
          </div>
        </div>
      )}

      {/* Module Overview - Only for Admin */}
      {!isSalesManager() && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <Map className="h-6 w-6 text-blue-600" />
                <h4 className="font-medium text-gray-900">Plot Management</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Manage plot inventory, pricing, and availability</p>
              <button 
                onClick={() => router.push('/dashboard/plots')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Plots →
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="h-6 w-6 text-green-600" />
                <h4 className="font-medium text-gray-900">Customer Management</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Manage customer relationships and interactions</p>
              <button 
                onClick={() => router.push('/dashboard/customers')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View Customers →
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <Hammer className="h-6 w-6 text-orange-600" />
                <h4 className="font-medium text-gray-900">Construction</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Manage construction projects and tasks</p>
              <button 
                onClick={() => router.push('/dashboard/construction')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View Projects →
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <h4 className="font-medium text-gray-900">Analytics</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">View reports and performance metrics</p>
              <button 
                onClick={() => router.push('/dashboard/analytics')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View Analytics →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
