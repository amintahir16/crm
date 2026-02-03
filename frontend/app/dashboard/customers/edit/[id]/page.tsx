'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Users,
} from 'lucide-react';

interface Customer {
  id: string;
  cnic: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  bookingsCount: number;
  totalInvested: number;
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  cnic: string;
  address: string;
}

export default function EditCustomerPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    cnic: '',
    address: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customerId) {
      fetchCustomer();
    }
  }, [isAuthenticated, customerId]);

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        const formData = {
          fullName: data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          cnic: data.cnic ? formatCNIC(data.cnic) : '',
          address: data.address || '',
        };
        console.log('Setting form data:', formData);
        setFormData(formData);
      } else {
        console.error('Failed to fetch customer');
        router.push('/dashboard/customers');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      router.push('/dashboard/customers');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const formatCNIC = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as 00000-0000000-0
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
    
    // For CNIC field, format with dashes
    const processedValue = name === 'cnic' ? formatCNIC(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC must be in format 12345-1234567-1';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cnic: formData.cnic.replace(/[-\s]/g, ''), // Send clean CNIC to backend
        }),
      });

      if (response.ok) {
        router.push('/dashboard/customers');
      } else {
        console.error('Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !customer) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
            <p className="text-gray-600">Update customer information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.fullName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* CNIC */}
            <div>
              <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-2">
                CNIC *
              </label>
              <input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                onFocus={() => console.log('CNIC field focused')}
                onBlur={() => console.log('CNIC field blurred')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.cnic ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345-1234567-1"
                maxLength={15}
              />
              {errors.cnic && (
                <p className="mt-1 text-sm text-red-600">{errors.cnic}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/customers')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
