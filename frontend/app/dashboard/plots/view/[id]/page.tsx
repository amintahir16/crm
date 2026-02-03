'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Building,
  DollarSign,
  Ruler,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Plot {
  id: string;
  plotNumber: string;
  sizeMarla: number;
  sizeSqm: number;
  phase: string;
  block: string;
  pricePkr: number;
  status: 'available' | 'reserved' | 'sold' | 'transferred';
  coordinates: string;
  createdAt: string;
  updatedAt: string;
}

interface OwnershipHistory {
  id: string;
  ownershipType: string;
  salePrice?: number;
  registrationDate?: string;
  registrationNumber?: string;
  transferDate?: string;
  transferDocumentNumber?: string;
  customer?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export default function ViewPlotPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const plotId = params.id as string;
  
  const [plot, setPlot] = useState<Plot | null>(null);
  const [isLoadingPlot, setIsLoadingPlot] = useState(true);
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated && plotId) {
      fetchPlot();
      fetchOwnershipHistory();
    }
  }, [isAuthenticated, plotId]);

  const fetchOwnershipHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/plots/${plotId}/ownership-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOwnershipHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching ownership history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchPlot = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/plots/${plotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlot(data);
      } else {
        console.error('Failed to fetch plot');
        router.push('/dashboard/plots');
      }
    } catch (error) {
      console.error('Error fetching plot:', error);
      router.push('/dashboard/plots');
    } finally {
      setIsLoadingPlot(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'transferred':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'sold':
        return 'Sold';
      case 'transferred':
        return 'Transferred';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reserved':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sold':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'transferred':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoadingPlot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Plot not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The plot you're looking for doesn't exist.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard/plots')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Plots
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Plot Details</h1>
            <p className="text-gray-600">View plot information for {plot.plotNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/dashboard/plots/edit/${plot.id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Plot</span>
          </button>
        </div>
      </div>

      {/* Plot Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plot Number
                </label>
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{plot.plotNumber}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center">
                  {getStatusIcon(plot.status)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plot.status)}`}>
                    {getStatusLabel(plot.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase
                </label>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{plot.phase}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{plot.block}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Size Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size (Marla)
                </label>
                <div className="flex items-center">
                  <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{plot.sizeMarla} Marla</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size (SQM)
                </label>
                <div className="flex items-center">
                  <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{plot.sizeSqm} sqm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinates
              </label>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                <span className="text-sm text-gray-900">{plot.coordinates}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (PKR)
              </label>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(plot.pricePkr)}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {new Date(plot.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {new Date(plot.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/plots/${plotId}/record-sale`)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Record Sale
              </button>
              <button
                onClick={() => router.push(`/dashboard/plots/${plotId}/record-transfer`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Record Transfer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ownership History */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership History</h3>
        {isLoadingHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : ownershipHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No ownership history recorded
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration/Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ownershipHistory.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {record.ownershipType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.customer?.fullName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.salePrice ? formatCurrency(record.salePrice) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.registrationNumber || record.transferDocumentNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(record.registrationDate || record.transferDate || record.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
