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
  Target,
  Save,
  X
} from 'lucide-react';

interface TeamMemberData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  address?: string;
  isActive: boolean;
}

export default function EditTeamMember() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;

  const [memberData, setMemberData] = useState<TeamMemberData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      fetchMemberData();
    }
  }, [isAuthenticated, isLoading, isSalesManager, memberId, router]);

  const fetchMemberData = async () => {
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
        setMemberData({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || '',
          department: data.department || '',
          employeeId: data.employeeId || '',
          address: data.address || '',
          isActive: data.isActive
        });
      } else {
        console.error('Failed to fetch member data');
        router.push('/dashboard/team');
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      router.push('/dashboard/team');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMemberData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!memberData) return false;
    
    const newErrors: Record<string, string> = {};

    if (!memberData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!memberData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(memberData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (memberData.phone && !/^\+?[\d\s-()]+$/.test(memberData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberData || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

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
          fullName: memberData.fullName,
          email: memberData.email,
          phone: memberData.phone || undefined,
          department: memberData.department || undefined,
          employeeId: memberData.employeeId || undefined,
          address: memberData.address || undefined,
        }),
      });

      if (response.ok) {
        alert('Team member updated successfully!');
        router.push(`/dashboard/team/${memberId}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update team member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      alert('Error updating team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!memberData) {
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Team Member</h1>
              <p className="text-gray-600 mt-2">Update team member information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={memberData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={memberData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={memberData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={memberData.employeeId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={memberData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={memberData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update Team Member'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
