'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  BarChart3, 
  Activity,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  workloadScore: number;
  isActive: boolean;
  createdAt: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  averageWorkload: number;
}

export default function TeamManagement() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

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
      fetchTeamData();
    }
  }, [isAuthenticated, isLoading, isSalesManager, router]);

  const fetchTeamData = async () => {
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('access_token');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/sales-team/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
        
        // Calculate stats
        const stats: TeamStats = {
          totalMembers: data.length,
          activeMembers: data.filter((member: TeamMember) => member.isActive).length,
          averageWorkload: data.length > 0 
            ? data.reduce((sum: number, member: TeamMember) => sum + member.workloadScore, 0) / data.length 
            : 0
        };
        setTeamStats(stats);
      } else {
        console.error('Failed to fetch team data');
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleToggleActive = async (memberId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this team member?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/sales-team/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus
        }),
      });

      if (response.ok) {
        await fetchTeamData(); // Refresh data
        alert(`Team member ${action}d successfully`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to ${action} team member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing team member:`, error);
      alert(`Error ${action}ing team member`);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member? This will deactivate them.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/sales-team/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchTeamData(); // Refresh data
        alert('Team member removed successfully');
      } else {
        alert('Failed to remove team member');
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Error removing team member');
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-2">Manage your sales team members</p>
            </div>
            <a
              href="/dashboard/team/add"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Team Member</span>
            </a>
          </div>
        </div>

        {/* Team Stats */}
        {teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.activeMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive Members</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers - teamStats.activeMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Workload</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.averageWorkload.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>
          <div className="p-6">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first team member.</p>
                <a
                  href="/dashboard/team/add"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Team Member</span>
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workload
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member) => (
                      <tr 
                        key={member.id}
                        className={member.isActive ? '' : 'bg-gray-50 opacity-75'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.department || 'Sales'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.email}</div>
                          {member.phone && (
                            <div className="text-sm text-gray-500">{member.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.employeeId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(member.workloadScore * 10, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{member.workloadScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(member.id, member.isActive)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                              member.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                            title={member.isActive ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/dashboard/team/${member.id}/activity`)}
                              className="text-purple-600 hover:text-purple-900"
                              title="View Activity Timeline"
                            >
                              <Activity className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/team/${member.id}`)}
                              className="text-green-600 hover:text-green-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/team/${member.id}/edit`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Member"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/team/add"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add Team Member</p>
              <p className="text-sm text-gray-600">Create new sales team member account</p>
            </div>
          </a>
          <a
            href="/dashboard/team/performance"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Team Performance</p>
              <p className="text-sm text-gray-600">View team performance metrics</p>
            </div>
          </a>
          <a
            href="/dashboard/team/activities"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Team Activities</p>
              <p className="text-sm text-gray-600">Monitor team member activities</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
