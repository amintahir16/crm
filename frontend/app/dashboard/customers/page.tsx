'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  UserPlus,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

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

export default function CustomersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatPKR(amount);
  };

  const formatCNIC = (cnic: string) => {
    // Format CNIC as 00000-0000000-0
    if (cnic.length === 13) {
      return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
    }
    return cnic;
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      console.log('Deleting customer:', customerId, customerName);
      console.log('API URL:', `${apiUrl}/customers/${customerId}`);
      
      const response = await fetch(`${apiUrl}/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        // Remove customer from state
        setCustomers(prev => prev.filter(customer => customer.id !== customerId));
        setDeleteConfirm(null);
        setOpenDropdown(null);
        setSuccessMessage(`Customer ${customerName} deleted successfully`);
        console.log('Customer deleted successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to delete customer:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.cnic.includes(searchTerm) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading || isLoadingCustomers) {
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage all customers and leads</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/customers/leads')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>View Leads</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/customers/add')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.bookingsCount > 0).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.reduce((sum, c) => sum + c.bookingsCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(customers.reduce((sum, c) => sum + c.totalInvested, 0))}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Customers
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, CNIC, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Customers</option>
              <option value="active">Active (with bookings)</option>
              <option value="inactive">Inactive (no bookings)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Customers ({filteredCustomers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Invested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCNIC(customer.cnic)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.bookingsCount} bookings
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(customer.totalInvested)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          console.log('View customer:', customer.id);
                          router.push(`/dashboard/customers/view/${customer.id}`);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Customer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Edit customer:', customer.id);
                          router.push(`/dashboard/customers/edit/${customer.id}`);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <div className="relative dropdown-container">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === customer.id ? null : customer.id);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="More Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openDropdown === customer.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(customer.id);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Customer
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
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new customer.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/customers/add')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Customer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Customer
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this customer? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const customer = customers.find(c => c.id === deleteConfirm);
                  if (customer) {
                    handleDeleteCustomer(customer.id, customer.fullName);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white text-black px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-black" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
} 