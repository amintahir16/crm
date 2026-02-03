'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Map,
  Edit,
  Eye,
  MoreHorizontal,
  Building,
  MapPin,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

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

export default function PlotsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlots();
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (openDropdown && !target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchPlots = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/plots?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlots(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch plots:', error);
    } finally {
      setIsLoadingPlots(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatPKR(amount);
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

  const handleDeletePlot = async (plotId: string, plotNumber: string) => {
    console.log('Attempting to delete plot:', plotId, plotNumber);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      console.log('Making DELETE request to:', `${apiUrl}/plots/${plotId}`);
      
      const response = await fetch(`${apiUrl}/plots/${plotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        // Remove the plot from the local state
        setPlots(prev => prev.filter(plot => plot.id !== plotId));
        setDeleteConfirm(null);
        setOpenDropdown(null);
        setSuccessMessage(`Plot ${plotNumber} deleted successfully`);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete plot:', errorData);
        alert(`Failed to delete plot: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting plot:', error);
      alert('An error occurred while deleting the plot.');
    }
  };

  const filteredPlots = plots.filter((plot) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Create combined search strings for multi-field searches
    const sizeMarlaText = `${plot.sizeMarla} marla`;
    const sizeSqmText = `${plot.sizeSqm} sqm`;
    const blockText = `block ${plot.block.toLowerCase()}`;
    const phaseText = `${plot.phase.toLowerCase()} block ${plot.block.toLowerCase()}`;
    const locationText = `${plot.phase.toLowerCase()} ${plot.block.toLowerCase()}`;
    
    const matchesSearch = 
      plot.plotNumber.toLowerCase().includes(searchLower) ||
      plot.phase.toLowerCase().includes(searchLower) ||
      plot.block.toLowerCase().includes(searchLower) ||
      plot.sizeMarla.toString().includes(searchLower) ||
      plot.sizeSqm.toString().includes(searchLower) ||
      plot.pricePkr.toString().includes(searchLower) ||
      plot.status.toLowerCase().includes(searchLower) ||
      plot.coordinates.toLowerCase().includes(searchLower) ||
      sizeMarlaText.includes(searchLower) ||
      sizeSqmText.includes(searchLower) ||
      blockText.includes(searchLower) ||
      phaseText.includes(searchLower) ||
      locationText.includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || plot.status === statusFilter;
    const matchesPhase = phaseFilter === 'all' || plot.phase === phaseFilter;
    
    return matchesSearch && matchesStatus && matchesPhase;
  });

  if (isLoading || isLoadingPlots) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plot Management</h1>
          <p className="text-gray-600">Manage all plots in Queen Hills Murree</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/plots/map')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Map className="h-4 w-4" />
            <span>View Map</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/plots/add')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Plot</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search plots, size, price, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-10"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase
            </label>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-10"
            >
              <option value="all">All Phases</option>
              <option value="Phase 1">Phase 1</option>
              <option value="Phase 2">Phase 2</option>
              <option value="Phase 3">Phase 3</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPhaseFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Plots Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Plots ({filteredPlots.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plot Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlots.map((plot) => (
                <tr key={plot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {plot.plotNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {plot.sizeMarla} Marla
                    </div>
                    <div className="text-sm text-gray-500">
                      {plot.sizeSqm} sqm
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {plot.phase} • Block {plot.block}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(plot.pricePkr)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plot.status)}`}>
                      {getStatusLabel(plot.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => router.push(`/dashboard/plots/view/${plot.id}`)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Plot"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => router.push(`/dashboard/plots/edit/${plot.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Plot"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <div className="relative dropdown-container">
                        <button 
                          onClick={() => setOpenDropdown(openDropdown === plot.id ? null : plot.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="More Options"
                        >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                        
                        {openDropdown === plot.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(plot.id);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                <span className="font-medium">Delete Plot</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPlots.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No plots found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new plot using the "Add Plot" button above.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 w-96 shadow-2xl rounded-xl bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Plot</h3>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to delete this plot? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">
                    Plot: {plots.find(p => p.id === deleteConfirm)?.plotNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {plots.find(p => p.id === deleteConfirm)?.phase} • {plots.find(p => p.id === deleteConfirm)?.block}
                  </p>
                </div>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              <button
                  onClick={() => {
                    const plot = plots.find(p => p.id === deleteConfirm);
                    if (plot) {
                      handleDeletePlot(plot.id, plot.plotNumber);
                    }
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Confirm
              </button>
              </div>
            </div>
            </div>
          </div>
        )}

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white text-black px-6 py-4 rounded-lg shadow-xl border border-gray-200 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-black" />
            <span className="font-medium text-sm">{successMessage}</span>
      </div>
        </div>
      )}
    </div>
  );
} 