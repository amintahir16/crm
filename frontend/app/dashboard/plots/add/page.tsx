'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  MapPin,
  Building,
  DollarSign,
  Ruler,
} from 'lucide-react';

interface PlotFormData {
  plotNumber: string;
  sizeMarla: number;
  sizeSqm: number;
  phase: string;
  block: string;
  pricePkr: number;
  status: 'available' | 'reserved' | 'sold' | 'transferred';
  coordinates: string;
}

export default function AddPlotPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PlotFormData>({
    plotNumber: '',
    sizeMarla: 0,
    sizeSqm: 0,
    phase: '',
    block: '',
    pricePkr: 0,
    status: 'available',
    coordinates: '',
  });

  const [errors, setErrors] = useState<Partial<PlotFormData>>({});

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
    const newErrors: Record<string, string> = {};

    if (!formData.plotNumber.trim()) {
      newErrors.plotNumber = 'Plot number is required';
    }

    if (formData.sizeMarla <= 0) {
      newErrors.sizeMarla = 'Size in Marla must be greater than 0';
    }

    if (formData.sizeSqm <= 0) {
      newErrors.sizeSqm = 'Size in SQM must be greater than 0';
    }

    if (!formData.phase.trim()) {
      newErrors.phase = 'Phase is required';
    }

    if (!formData.block.trim()) {
      newErrors.block = 'Block is required';
    }

    if (formData.pricePkr <= 0) {
      newErrors.pricePkr = 'Price must be greater than 0';
    }

    if (!formData.coordinates.trim()) {
      newErrors.coordinates = 'Coordinates are required';
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
      
      const response = await fetch(`${apiUrl}/plots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/plots');
      } else {
        const errorData = await response.json();
        console.error('Failed to create plot:', errorData);
        alert('Failed to create plot. Please try again.');
      }
    } catch (error) {
      console.error('Error creating plot:', error);
      alert('An error occurred while creating the plot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PlotFormData, value: string | number) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      
      // Auto-calculate conversions
      if (field === 'sizeMarla') {
        if (typeof value === 'number' && value > 0) {
          // Convert Marla to SQM (1 Marla = 25.2929 SQM)
          newFormData.sizeSqm = Math.round(value * 25.2929 * 100) / 100;
        } else {
          // Clear SQM when Marla is empty or zero
          newFormData.sizeSqm = 0;
        }
      } else if (field === 'sizeSqm') {
        if (typeof value === 'number' && value > 0) {
          // Convert SQM to Marla (1 SQM = 0.0395 Marla)
          newFormData.sizeMarla = Math.round(value * 0.0395 * 100) / 100;
        } else {
          // Clear Marla when SQM is empty or zero
          newFormData.sizeMarla = 0;
        }
      }
      
      return newFormData;
    });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
            <h1 className="text-2xl font-bold text-gray-900">Add New Plot</h1>
            <p className="text-gray-600">Create a new plot in Queen Hills Murree</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plot Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plot Number *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.plotNumber}
                  onChange={(e) => handleInputChange('plotNumber', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.plotNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., A-001, B-015"
                />
              </div>
              {errors.plotNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.plotNumber}</p>
              )}
            </div>

            {/* Phase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phase *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.phase}
                  onChange={(e) => handleInputChange('phase', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.phase ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Phase 1, Phase 2"
                />
              </div>
              {errors.phase && (
                <p className="mt-1 text-sm text-red-600">{errors.phase}</p>
              )}
            </div>

            {/* Block */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.block}
                  onChange={(e) => handleInputChange('block', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.block ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Block A, Block B"
                />
              </div>
              {errors.block && (
                <p className="mt-1 text-sm text-red-600">{errors.block}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as PlotFormData['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            {/* Size in Marla */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size (Marla) *
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.sizeMarla || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value === '' ? 0 : parseFloat(value);
                    handleInputChange('sizeMarla', isNaN(numericValue) ? 0 : numericValue);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.sizeMarla ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="5.0"
                />
              </div>
              {errors.sizeMarla && (
                <p className="mt-1 text-sm text-red-600">{errors.sizeMarla}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                SQM will be calculated automatically
              </p>
            </div>

            {/* Size in SQM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size (SQM) *
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sizeSqm || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value === '' ? 0 : parseFloat(value);
                    handleInputChange('sizeSqm', isNaN(numericValue) ? 0 : numericValue);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.sizeSqm ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="139.35"
                />
              </div>
              {errors.sizeSqm && (
                <p className="mt-1 text-sm text-red-600">{errors.sizeSqm}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Marla will be calculated automatically
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (PKR) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.pricePkr || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value === '' ? 0 : parseFloat(value);
                    handleInputChange('pricePkr', isNaN(numericValue) ? 0 : numericValue);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.pricePkr ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="2500000"
                />
              </div>
              {errors.pricePkr && (
                <p className="mt-1 text-sm text-red-600">{errors.pricePkr}</p>
              )}
              {formData.pricePkr > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(formData.pricePkr)}
                </p>
              )}
            </div>

            {/* Coordinates */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinates *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.coordinates}
                  onChange={(e) => handleInputChange('coordinates', e.target.value)}
                  rows={3}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.coordinates ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter GPS coordinates or location description"
                />
              </div>
              {errors.coordinates && (
                <p className="mt-1 text-sm text-red-600">{errors.coordinates}</p>
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
              <span>{isSubmitting ? 'Creating...' : 'Create Plot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
