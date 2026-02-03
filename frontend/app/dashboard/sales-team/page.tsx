'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  BarChart3,
  TrendingUp,
  Target,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Activity,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface SalesTeamMember {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  stats: {
    totalLeads: number;
    convertedLeads: number;
    totalCustomers: number;
    totalBookings: number;
    totalRevenue: number;
    callsMade: number;
    emailsSent: number;
    meetingsHeld: number;
    conversionRate: number;
    lastActivity: Date;
  };
}

interface TeamOverview {
  totalMembers: number;
  activeMembers: number;
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  averageConversionRate: number;
  topPerformer: string;
  teamActivity: number;
}

export default function SalesTeamManagementPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<SalesTeamMember[]>([]);
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!isLoading && !isAdmin()) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && isAdmin()) {
      fetchSalesTeamData();
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  const fetchSalesTeamData = async () => {
    try {
      setIsLoadingData(true);
      
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch sales team members
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const usersResponse = await fetch(`${apiUrl}/users?role=sales_person`, { headers });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        
        // Fetch stats for each team member
        const membersWithStats = await Promise.all(
          users.map(async (user: any) => {
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
              const statsResponse = await fetch(`${apiUrl}/sales-activities/user/${user.id}/stats`, { headers });
              const activitiesResponse = await fetch(`${apiUrl}/sales-activities/user/${user.id}/activities?limit=1`, { headers });
              
              let stats = {
                totalLeads: 0,
                convertedLeads: 0,
                totalCustomers: 0,
                totalBookings: 0,
                totalRevenue: 0,
                callsMade: 0,
                emailsSent: 0,
                meetingsHeld: 0,
                conversionRate: 0,
                lastActivity: new Date(),
              };

              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                stats = {
                  totalLeads: statsData.leadsCreated || 0,
                  convertedLeads: statsData.leadsConverted || 0,
                  totalCustomers: statsData.customersCreated || 0,
                  totalBookings: statsData.bookingsCreated || 0,
                  totalRevenue: statsData.totalPotentialValue || 0,
                  callsMade: statsData.callsMade || 0,
                  emailsSent: statsData.emailsSent || 0,
                  meetingsHeld: statsData.meetingsHeld || 0,
                  conversionRate: statsData.leadsCreated > 0 ? (statsData.leadsConverted / statsData.leadsCreated) * 100 : 0,
                  lastActivity: new Date(),
                };
              }

              if (activitiesResponse.ok) {
                const activities = await activitiesResponse.json();
                if (activities.length > 0) {
                  stats.lastActivity = new Date(activities[0].createdAt);
                }
              }

              return {
                ...user,
                createdAt: new Date(user.createdAt),
                stats,
              };
            } catch (error) {
              console.error(`Error fetching stats for user ${user.id}:`, error);
              return {
                ...user,
                createdAt: new Date(user.createdAt),
                stats: {
                  totalLeads: 0,
                  convertedLeads: 0,
                  totalCustomers: 0,
                  totalBookings: 0,
                  totalRevenue: 0,
                  callsMade: 0,
                  emailsSent: 0,
                  meetingsHeld: 0,
                  conversionRate: 0,
                  lastActivity: new Date(),
                },
              };
            }
          })
        );

        setTeamMembers(membersWithStats);

        // Calculate team overview
        const overview: TeamOverview = {
          totalMembers: membersWithStats.length,
          activeMembers: membersWithStats.filter(m => m.isActive).length,
          totalLeads: membersWithStats.reduce((sum, m) => sum + m.stats.totalLeads, 0),
          totalConversions: membersWithStats.reduce((sum, m) => sum + m.stats.convertedLeads, 0),
          totalRevenue: membersWithStats.reduce((sum, m) => sum + m.stats.totalRevenue, 0),
          averageConversionRate: membersWithStats.length > 0 
            ? membersWithStats.reduce((sum, m) => sum + m.stats.conversionRate, 0) / membersWithStats.length 
            : 0,
          topPerformer: membersWithStats.length > 0 
            ? membersWithStats.reduce((prev, current) => 
                prev.stats.convertedLeads > current.stats.convertedLeads ? prev : current
              ).fullName
            : 'N/A',
          teamActivity: membersWithStats.reduce((sum, m) => sum + m.stats.callsMade + m.stats.emailsSent + m.stats.meetingsHeld, 0),
        };

        setTeamOverview(overview);
      }
    } catch (error) {
      console.error('Error fetching sales team data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.isActive) ||
                         (filterStatus === 'inactive' && !member.isActive);
    return matchesSearch && matchesFilter;
  });

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales team data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access sales team management.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Sales Team Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your sales team and track their performance
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Sales Person</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      {teamOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview.totalMembers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">
                {teamOverview.activeMembers} active members
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview.totalLeads}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">
                {teamOverview.totalConversions} converted ({teamOverview.averageConversionRate.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPKR(teamOverview.totalRevenue)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-yellow-600">
                Potential revenue
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Activity</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview.teamActivity}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600">
                Total interactions
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Performer */}
      {teamOverview && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Performer</h3>
              <p className="text-gray-600">
                <span className="font-medium text-yellow-600">{teamOverview.topPerformer}</span> is leading with the most conversions this month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Members</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredMembers.length} of {teamMembers.length} members
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.stats.totalLeads}</div>
                    <div className="text-xs text-gray-500">
                      {member.stats.conversionRate.toFixed(1)}% conversion
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {member.stats.convertedLeads}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatPKR(member.stats.totalRevenue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{member.stats.callsMade}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.stats.emailsSent}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{member.stats.meetingsHeld}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {member.stats.lastActivity.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/sales-team/performance"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Reports</h3>
              <p className="text-gray-600">View detailed performance analytics</p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/sales-team/activities"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Activity Tracking</h3>
              <p className="text-gray-600">Monitor team activities in real-time</p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/settings/users/add"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add Team Member</h3>
              <p className="text-gray-600">Invite new sales team members</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
