'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  CreditCard,
  Home,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface Plot {
  id: string;
  plotNumber: string;
  sizeMarla: number;
  sizeSqm: number;
  pricePkr: number;
  phase: string;
  block: string;
  status: string;
}

interface PaymentSchedule {
  id: string;
  paymentType: 'full_payment' | 'installment';
  status: string;
  installmentCount?: number;
  installmentAmount?: number;
  startDate?: string;
  endDate?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  totalAmount: number;
  downPayment: number;
  paidAmount: number;
  pendingAmount: number;
  createdAt: string;
  updatedAt: string;
  plot: Plot;
  paymentSchedule?: PaymentSchedule;
  createdBy: {
    id: string;
    fullName: string;
  };
}

interface BookingSummary {
  totalBookings: number;
  totalInvested: number;
  totalPaid: number;
  totalPending: number;
  activeBookings: number;
  completedBookings: number;
}

interface CustomerBookingsData {
  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
  };
  bookings: Booking[];
  summary: BookingSummary;
}

interface CustomerBookingsProps {
  customerId: string;
}

export default function CustomerBookings({ customerId }: CustomerBookingsProps) {
  const router = useRouter();
  const [bookingsData, setBookingsData] = useState<CustomerBookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerBookings();
  }, [customerId]);

  const fetchCustomerBookings = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/customers/${customerId}/bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookingsData(data);
      } else {
        setError('Failed to fetch customer bookings');
      }
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      setError('Error loading customer bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'confirmed':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const handleViewBooking = (bookingId: string) => {
    router.push(`/dashboard/bookings/view/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!bookingsData) {
    return null;
  }

  const { bookings, summary } = bookingsData;

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Booking Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-900">{summary.totalBookings}</p>
              </div>
              <Home className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Invested</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(summary.totalInvested)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Total Paid</p>
                <p className="text-xl font-bold text-emerald-900">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Pending</p>
                <p className="text-xl font-bold text-orange-900">{formatCurrency(summary.totalPending)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active</p>
                <p className="text-2xl font-bold text-purple-900">{summary.activeBookings}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Completed</p>
                <p className="text-2xl font-bold text-indigo-900">{summary.completedBookings}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Customer Bookings ({bookings.length})
        </h3>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found for this customer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {booking.bookingNumber}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Plot {booking.plot.plotNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.plot.sizeMarla} Marla • {booking.plot.phase}-{booking.plot.block}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-500">Total Amount</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {formatCurrency(booking.paidAmount)}
                          </p>
                          <p className="text-xs text-gray-500">Paid</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">
                            {formatCurrency(booking.pendingAmount)}
                          </p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>Booked: {formatDate(booking.bookingDate)}</span>
                        {booking.paymentSchedule && (
                          <span className="flex items-center">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {booking.paymentSchedule.paymentType === 'installment' 
                              ? `${booking.paymentSchedule.installmentCount} installments`
                              : 'Full payment'
                            }
                          </span>
                        )}
                      </div>
                      <span>Created by: {booking.createdBy.fullName}</span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => handleViewBooking(booking.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
