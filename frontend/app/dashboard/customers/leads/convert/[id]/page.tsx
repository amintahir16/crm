'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  priority: string;
  interests: string;
  budgetRange: number;
  tags: string[];
}

export default function ConvertLeadPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    cnic: '',
    address: '',
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && leadId) {
      fetchLead();
    }
  }, [isAuthenticated, isLoading, leadId]);

  const fetchLead = async () => {
    try {
      setIsLoadingLead(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const leadData = await response.json();
        if (leadData.status === 'converted') {
          alert('This lead has already been converted to a customer.');
          router.push(`/dashboard/customers/leads/view/${leadId}`);
          return;
        }
        setLead(leadData);
      } else {
        console.error('Failed to fetch lead');
        router.push('/dashboard/customers/leads');
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      router.push('/dashboard/customers/leads');
    } finally {
      setIsLoadingLead(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cnic.trim()) {
      alert('CNIC is required');
      return;
    }

    if (!formData.address.trim()) {
      alert('Address is required');
      return;
    }

    // Basic CNIC validation (13 digits)
    const cnicPattern = /^\d{13}$/;
    if (!cnicPattern.test(formData.cnic.replace(/-/g, ''))) {
      alert('Please enter a valid 13-digit CNIC');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnic: formData.cnic.replace(/-/g, ''), // Remove dashes for storage
          address: formData.address,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Lead successfully converted to customer!');
        router.push(`/dashboard/customers/view/${result.customer.id}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to convert lead');
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Error converting lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCnic = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as XXXXX-XXXXXXX-X
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnic(e.target.value);
    setFormData(prev => ({
      ...prev,
      cnic: formatted,
    }));
  };

  if (isLoading || isLoadingLead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Convert Lead to Customer</h1>
          <p className="text-gray-600">Convert {lead.fullName} from a lead to a customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Current Lead Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{lead.fullName}</p>
                  <p className="text-sm text-gray-600 capitalize">{lead.status} Lead</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                lead.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                lead.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lead.priority} Priority
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {lead.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{lead.phone}</span>
                </div>
              )}
            </div>

            {lead.interests && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Interests:</p>
                <p className="text-sm text-gray-600">{lead.interests}</p>
              </div>
            )}

            {lead.budgetRange && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Budget Range:</p>
                <p className="text-sm text-gray-600">PKR {lead.budgetRange.toLocaleString()}</p>
              </div>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Conversion Notice</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Once converted, this lead will become a customer record and can be used for bookings and payments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Customer Information
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Auto-filled Information</p>
                  <p className="text-xs text-green-700 mt-1">
                    Name, email, and phone will be automatically transferred from the lead.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-1">
                CNIC Number *
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  id="cnic"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleCnicChange}
                  required
                  maxLength={15} // 13 digits + 2 dashes
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter 13-digit CNIC number</p>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter complete address"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Convert to Customer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Conversion Benefits */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">After Conversion</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Customer Record</p>
              <p className="text-xs text-blue-700">Full customer profile with all details</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Booking Eligible</p>
              <p className="text-xs text-blue-700">Can create plot bookings and payments</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Sales Tracking</p>
              <p className="text-xs text-blue-700">Conversion tracked for sales performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
