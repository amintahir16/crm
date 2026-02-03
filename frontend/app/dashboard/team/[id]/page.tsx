'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Edit,
  Trash2,
  DollarSign,
  Receipt
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TeamMemberDetails {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  address?: string;
  createdAt: string;
  isActive: boolean;
  workloadScore: number;
  performance: {
    totalLeads: number;
    convertedLeads: number;
    activeLeads: number;
    lostLeads: number;
    notInterestedLeads: number;
    conversionRate: number;
    totalBookings: number;
    totalRevenue: number;
    averageDealSize: number;
    activitiesCount: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    entityId: string;
    entityType: string;
    isSuccessful: boolean;
    potentialValue: number;
  }>;
  recentSales: Array<{
    id: string;
    bookingNumber: string;
    customerName: string;
    customerId: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    plotNumber: string;
    plotSize: string;
  }>;
}

export default function TeamMemberView() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;

  const [memberDetails, setMemberDetails] = useState<TeamMemberDetails | null>(null);
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

    if (isAuthenticated && isSalesManager() && memberId) {
      fetchMemberDetails();
    }
  }, [isAuthenticated, isLoading, isSalesManager, memberId, router]);

  const fetchMemberDetails = async () => {
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('access_token');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/sales-team/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMemberDetails(data);
      } else {
        console.error('Failed to fetch member details');
        router.push('/dashboard/team');
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      router.push('/dashboard/team');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirm('Are you sure you want to remove this team member?')) {
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
        alert('Team member removed successfully');
        router.push('/dashboard/team');
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

  if (!memberDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Member Not Found</h1>
          <button
            onClick={() => router.push('/dashboard/team')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{memberDetails.fullName}</h1>
              <p className="text-gray-600 mt-2">Team Member Details & Performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/dashboard/team/${memberId}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleRemoveMember}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Member Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{memberDetails.fullName}</p>
                    <p className="text-sm text-gray-500">{memberDetails.department || 'Sales'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{memberDetails.email}</span>
                  </div>
                  
                  {memberDetails.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{memberDetails.phone}</span>
                    </div>
                  )}
                  
                  {memberDetails.employeeId && (
                    <div className="flex items-center space-x-3">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">ID: {memberDetails.employeeId}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      Joined {formatDistanceToNow(new Date(memberDetails.createdAt))} ago
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`h-4 w-4 rounded-full ${memberDetails.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-gray-900">
                      {memberDetails.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {memberDetails.address && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-900">{memberDetails.address}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workload */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Workload</h2>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {memberDetails.workloadScore}
                </div>
                <p className="text-sm text-gray-600">Active Leads</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(memberDetails.workloadScore * 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{memberDetails.performance.totalLeads}</div>
                  <div className="text-sm text-gray-600">Total Leads</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{memberDetails.performance.convertedLeads}</div>
                  <div className="text-sm text-gray-600">Converted</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{memberDetails.performance.conversionRate}%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{memberDetails.performance.totalBookings}</div>
                  <div className="text-sm text-gray-600">Bookings</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">{memberDetails.performance.activeLeads}</div>
                  <div className="text-sm text-gray-600">Active Leads</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">{memberDetails.performance.lostLeads}</div>
                  <div className="text-sm text-gray-600">Lost Leads</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">{memberDetails.performance.notInterestedLeads}</div>
                  <div className="text-sm text-gray-600">Not Interested</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      ₨{memberDetails.performance.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      ₨{memberDetails.performance.averageDealSize.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Average Deal Size</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
              
              {memberDetails.recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberDetails.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <Activity className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.entityType} • {formatDistanceToNow(new Date(activity.createdAt))} ago
                          {activity.isSuccessful && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Success
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>
              
              {memberDetails.recentSales.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sales recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberDetails.recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <Receipt className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Booking #{sale.bookingNumber}
                          </p>
                          <span className="text-sm font-semibold text-green-600">
                            ₨{sale.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {sale.customerName} • Plot {sale.plotNumber} ({sale.plotSize})
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sale.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : sale.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(sale.createdAt))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
