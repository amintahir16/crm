'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Search,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  plotId: string;
  createdById: string;
  downPayment: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentType?: 'full_payment' | 'installment';
  installmentCount?: number;
  notes?: string;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
  };
  plot?: {
    id: string;
    plotNumber: string;
    sizeMarla: number;
    sizeSqm: number;
    pricePkr: number;
    phase: string;
    block: string;
    coordinates: string;
  };
}

interface FormData {
  customerId: string;
  plotId: string;
  downPayment: number | string;
  totalAmount: number | string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentType: 'full_payment' | 'installment';
  installmentCount?: number;
  notes?: string;
  bookingDate: string;
}

export default function EditBookingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    plotId: '',
    downPayment: 0,
    totalAmount: 0,
    status: 'pending',
    paymentType: 'installment',
    installmentCount: 24,
    notes: '',
    bookingDate: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      fetchBooking();
    }
  }, [isAuthenticated, bookingId]);

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
        setFormData({
          customerId: data.customerId || '',
          plotId: data.plotId || '',
          downPayment: data.downPayment ? data.downPayment.toString() : '',
          totalAmount: data.totalAmount ? data.totalAmount.toString() : '',
          status: data.status || 'pending',
          paymentType: data.paymentType || 'installment',
          installmentCount: data.installmentCount || 24,
          notes: data.notes || '',
          bookingDate: data.bookingDate ? new Date(data.bookingDate).toISOString().split('T')[0] : '',
        });
      } else {
        console.error('Failed to fetch booking');
        router.push('/dashboard/bookings');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      router.push('/dashboard/bookings');
    } finally {
      setIsLoadingBooking(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatPKR(amount);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    console.log(`=== INPUT CHANGE: ${field} ===`);
    console.log('Previous value:', formData[field]);
    console.log('New value:', value);
    console.log('Value type:', typeof value);
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-adjust down payment when payment type changes
      if (field === 'paymentType' && booking?.plot) {
        if (value === 'full_payment') {
          updated.downPayment = booking.plot.pricePkr;
        } else {
          updated.downPayment = booking.plot.pricePkr * 0.2; // 20% down payment
        }
      }
      
      console.log('Updated form data:', updated);
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.plotId) {
      newErrors.plotId = 'Plot is required';
    }

    if (formData.downPayment === undefined || formData.downPayment === null || formData.downPayment === '' || Number(formData.downPayment) <= 0) {
      newErrors.downPayment = 'Down payment must be greater than 0';
    }

    if (formData.totalAmount === undefined || formData.totalAmount === null || formData.totalAmount === '' || Number(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0';
    }

    if (formData.downPayment && formData.totalAmount && formData.downPayment !== '' && formData.totalAmount !== '' && Number(formData.downPayment) > Number(formData.totalAmount)) {
      newErrors.downPayment = 'Down payment cannot be greater than total amount';
    }

    if (formData.paymentType === 'installment' && (!formData.installmentCount || formData.installmentCount < 1)) {
      newErrors.installmentCount = 'Installment count must be at least 1' as any;
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
      
      const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          downPayment: formData.downPayment === '' ? 0 : Number(formData.downPayment),
          totalAmount: formData.totalAmount === '' ? 0 : Number(formData.totalAmount),
        }),
      });

      if (response.ok) {
        router.push('/dashboard/bookings');
      } else {
        const errorData = await response.json();
        console.error('Failed to update booking:', errorData);
        
        // Handle specific validation errors
        if (errorData.message && Array.isArray(errorData.message)) {
          const validationErrors: Partial<FormData> = {};
          errorData.message.forEach((error: string) => {
            if (error.includes('customer')) validationErrors.customerId = error;
            if (error.includes('plot')) validationErrors.plotId = error;
            if (error.includes('amount')) validationErrors.totalAmount = error;
          });
          setErrors(validationErrors);
        } else {
          alert(errorData.message || 'Failed to update booking. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('An error occurred while updating the booking.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingBooking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !booking) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/bookings')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
            <p className="text-gray-600">Update booking information</p>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{booking.customer?.fullName}</div>
                    <div className="text-sm text-gray-500">{booking.customer?.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plot Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plot *
              </label>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{booking.plot?.plotNumber}</div>
                    <div className="text-sm text-gray-500">
                      {booking.plot?.sizeMarla} Marla - {booking.plot?.phase}, {booking.plot?.block}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => handleInputChange('paymentType', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="installment">Installment Plan (24 months)</option>
                <option value="full_payment">Full Payment</option>
              </select>
            </div>

            {/* Installment Count */}
            {formData.paymentType === 'installment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installment Count (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.installmentCount || 24}
                  onChange={(e) => handleInputChange('installmentCount', parseInt(e.target.value) || 24)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.installmentCount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="24"
                />
                {errors.installmentCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.installmentCount}</p>
                )}
                {formData.installmentCount && formData.totalAmount && formData.downPayment && formData.totalAmount !== '' && formData.downPayment !== '' && Number(formData.totalAmount) > 0 && Number(formData.downPayment) > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Monthly installment: {formatCurrency((Number(formData.totalAmount) - Number(formData.downPayment)) / formData.installmentCount)}
                  </p>
                )}
              </div>
            )}

            {/* Down Payment / Amount Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.paymentType === 'full_payment' ? 'Amount Paid (PKR) *' : 'Down Payment (PKR) *'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="1000"
                  min="0"
                  max={formData.paymentType === 'full_payment' ? formData.totalAmount : undefined}
                  value={formData.downPayment}
                  onChange={(e) => handleInputChange('downPayment', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.downPayment ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={formData.paymentType === 'full_payment' ? formData.totalAmount.toString() : '500000'}
                />
              </div>
              {errors.downPayment && (
                <p className="mt-1 text-sm text-red-600">{errors.downPayment}</p>
              )}
              {formData.downPayment && formData.downPayment !== '' && Number(formData.downPayment) > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(Number(formData.downPayment))}
                </p>
              )}
              {formData.paymentType === 'full_payment' && (
                <p className="mt-1 text-sm text-blue-600">
                  For full payment, enter the complete amount paid at booking
                </p>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (PKR) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="2500000"
                />
              </div>
              {errors.totalAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
              )}
              {formData.totalAmount && formData.totalAmount !== '' && Number(formData.totalAmount) > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(Number(formData.totalAmount))}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as FormData['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Booking Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => handleInputChange('bookingDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional notes about the booking..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/bookings')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="-ml-1 mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}