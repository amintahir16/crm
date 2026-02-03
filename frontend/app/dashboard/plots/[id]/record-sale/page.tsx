'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';

interface Customer {
  id: string;
  fullName: string;
  cnic: string;
}

interface Booking {
  id: string;
  bookingNumber?: string;
}

export default function RecordPlotSalePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const plotId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    customerId: '',
    bookingId: '',
    salePrice: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrationNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (isAuthenticated && plotId) {
      fetchCustomers();
      fetchBookings();
    }
  }, [isAuthenticated, plotId]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${apiUrl}/customers?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${apiUrl}/bookings?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter bookings for this plot
        const plotBookings = (data.data || []).filter((b: any) => b.plotId === plotId);
        setBookings(plotBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.bookingId) {
      newErrors.bookingId = 'Booking is required';
    }

    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      newErrors.salePrice = 'Valid sale price is required';
    }

    if (!formData.registrationDate) {
      newErrors.registrationDate = 'Registration date is required';
    }

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${apiUrl}/plots/${plotId}/record-sale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salePrice: parseFloat(formData.salePrice),
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/plots/view/${plotId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to record plot sale');
      }
    } catch (error) {
      console.error('Error recording plot sale:', error);
      alert('Failed to record plot sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Plot Sale</h1>
            <p className="text-gray-600">Record the sale and registration of this plot</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} ({customer.cnic})
                </option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
          </div>

          {/* Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bookingId}
              onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.bookingId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Booking</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.bookingNumber || booking.id}
                </option>
              ))}
            </select>
            {errors.bookingId && <p className="mt-1 text-sm text-red-600">{errors.bookingId}</p>}
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Price (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.salePrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.salePrice && <p className="mt-1 text-sm text-red-600">{errors.salePrice}</p>}
          </div>

          {/* Registration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.registrationDate}
              onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.registrationDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.registrationDate && <p className="mt-1 text-sm text-red-600">{errors.registrationDate}</p>}
          </div>

          {/* Registration Number */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter registration/document number"
            />
            {errors.registrationNumber && <p className="mt-1 text-sm text-red-600">{errors.registrationNumber}</p>}
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional notes about this sale"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Recording...' : 'Record Sale'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

