'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

interface Customer {
  id: string;
  fullName: string;
  cnic: string;
}

export default function RecordPlotTransferPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const plotId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    newCustomerId: '',
    transferDate: new Date().toISOString().split('T')[0],
    transferDocumentNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (isAuthenticated && plotId) {
      fetchCustomers();
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

    if (!formData.newCustomerId) {
      newErrors.newCustomerId = 'New customer is required';
    }

    if (!formData.transferDate) {
      newErrors.transferDate = 'Transfer date is required';
    }

    if (!formData.transferDocumentNumber.trim()) {
      newErrors.transferDocumentNumber = 'Transfer document number is required';
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

      const response = await fetch(`${apiUrl}/plots/${plotId}/record-transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/plots/view/${plotId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to record plot transfer');
      }
    } catch (error) {
      console.error('Error recording plot transfer:', error);
      alert('Failed to record plot transfer');
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
            <h1 className="text-2xl font-bold text-gray-900">Record Plot Transfer</h1>
            <p className="text-gray-600">Record the transfer of this plot to a new owner</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Customer */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Owner (Customer) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.newCustomerId}
              onChange={(e) => setFormData({ ...formData, newCustomerId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.newCustomerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select New Owner</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} ({customer.cnic})
                </option>
              ))}
            </select>
            {errors.newCustomerId && <p className="mt-1 text-sm text-red-600">{errors.newCustomerId}</p>}
          </div>

          {/* Transfer Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.transferDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.transferDate && <p className="mt-1 text-sm text-red-600">{errors.transferDate}</p>}
          </div>

          {/* Transfer Document Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Document Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.transferDocumentNumber}
              onChange={(e) => setFormData({ ...formData, transferDocumentNumber: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.transferDocumentNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter transfer document number"
            />
            {errors.transferDocumentNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.transferDocumentNumber}</p>
            )}
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
              placeholder="Additional notes about this transfer"
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Recording...' : 'Record Transfer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

