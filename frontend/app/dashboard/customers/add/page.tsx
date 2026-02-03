'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';

interface CustomerFormData {
  cnic: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export default function AddCustomerPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    cnic: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });

  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/dashboard/login');
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC must be in format 12345-1234567-1';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+92|0)?[0-9]{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid Pakistani phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cnic: formData.cnic.replace(/[-\s]/g, ''), // Remove dashes for backend
        }),
      });

      if (response.ok) {
        const successData = await response.json();
        console.log('Customer created successfully:', successData);
        router.push('/dashboard/customers');
      } else {
        const errorData = await response.json();
        console.error('Failed to create customer:', errorData);
        
        // Handle specific validation errors
        if (errorData.message && Array.isArray(errorData.message)) {
          const validationErrors: Partial<CustomerFormData> = {};
          errorData.message.forEach((error: string) => {
            if (error.includes('CNIC')) validationErrors.cnic = error;
            if (error.includes('email')) validationErrors.email = error;
            if (error.includes('phone')) validationErrors.phone = error;
          });
          setErrors(validationErrors);
        } else {
          alert(errorData.message || 'Failed to create customer. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('An error occurred while creating the customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    let processedValue = value;
    
    // Apply formatting for specific fields
    if (field === 'cnic') {
      processedValue = formatCNIC(value);
    } else if (field === 'phone') {
      processedValue = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Handle Pakistani phone number formatting
    if (digits.startsWith('92')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      return digits;
    } else if (digits.length > 0) {
      return `0${digits}`;
    }
    return digits;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
            <p className="text-gray-600">Create a new customer profile</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNIC *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.cnic}
                  onChange={(e) => handleInputChange('cnic', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.cnic ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="12345-1234567-1"
                maxLength={15}
                pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
                />
              </div>
              {errors.cnic && (
                <p className="mt-1 text-sm text-red-600">{errors.cnic}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0300-1234567"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete address"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
