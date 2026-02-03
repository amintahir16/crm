'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Edit,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';
import CustomerBookings from '@/components/CustomerBookings';
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

export default function ViewCustomerPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customerId) {
      fetchCustomer();
      fetchCustomerPayments();
    }
  }, [isAuthenticated, customerId]);

  const fetchCustomerPayments = async () => {
    try {
      setIsLoadingPayments(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      // Get customer bookings first
      const bookingsResponse = await fetch(`${apiUrl}/bookings?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const customerBookings = (bookingsData.data || []).filter((b: any) => b.customerId === customerId);

        // Get payments for each booking
        const allPayments: any[] = [];
        for (const booking of customerBookings) {
          try {
            const paymentsResponse = await fetch(`${apiUrl}/payments/booking/${booking.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (paymentsResponse.ok) {
              const bookingPayments = await paymentsResponse.json();
              allPayments.push(...(bookingPayments || []));
            }
          } catch (error) {
            console.error('Error fetching payments for booking:', error);
          }
        }

        setPayments(allPayments);
      }
    } catch (error) {
      console.error('Error fetching customer payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const formatCNIC = (cnic: string) => {
    if (cnic.length === 13) {
      return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
    }
    return cnic;
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
            <p className="text-gray-600">View customer information and history</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/customers/edit/${customer.id}`)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <Edit className="-ml-1 mr-2 h-5 w-5" />
          Edit Customer
        </button>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <Users className="h-10 w-10 text-primary-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{customer.fullName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{customer.email}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{formatCNIC(customer.cnic)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{customer.address}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">
                    Joined {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Bookings:</span>
              <span className="font-medium text-gray-900">{customer.bookingsCount} bookings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Invested:</span>
              <span className="font-medium text-gray-900">{formatCurrency(customer.totalInvested)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer ID:</span>
              <span className="font-medium text-gray-900">{customer.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-gray-900">
                {new Date(customer.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Bookings */}
      <CustomerBookings customerId={customerId} />

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        {isLoadingPayments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment history available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatPKR(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                      {payment.paymentMethod?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {payment.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {payment.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {payment.referenceNumber || payment.transactionId || '-'}
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
