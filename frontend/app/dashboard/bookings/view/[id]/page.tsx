'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  DollarSign,
  FileText,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
} from 'lucide-react';
import BookingPaymentManager from '@/components/BookingPaymentManager';
import PaymentScheduleViewer from '@/components/PaymentScheduleViewer';

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  plotId: string;
  createdById: string;
  downPayment: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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

export default function ViewBookingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);

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
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">View booking information and status</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/dashboard/payments?bookingId=${booking.id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <CreditCard className="-ml-1 mr-2 h-5 w-5" />
            View Payments
          </button>
          <button
            onClick={() => router.push(`/dashboard/bookings/edit/${booking.id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Edit className="-ml-1 mr-2 h-5 w-5" />
            Edit Booking
          </button>
        </div>
      </div>

      {/* Booking Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.bookingNumber}</h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(booking.status)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Booking Date</div>
            <div className="text-lg font-medium text-gray-900">
              {new Date(booking.bookingDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            {booking.customer ? (
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <div className="font-medium text-gray-900">{booking.customer.fullName}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <div className="font-medium text-gray-900">{booking.customer.phone}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <div className="font-medium text-gray-900">{booking.customer.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Customer information not available</div>
            )}
          </div>

          {/* Plot Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Plot Information
            </h3>
            {booking.plot ? (
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Plot Number:</span>
                  <div className="font-medium text-gray-900">{booking.plot.plotNumber}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Size:</span>
                  <div className="font-medium text-gray-900">
                    {booking.plot.sizeMarla} Marla ({booking.plot.sizeSqm} SQM)
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Location:</span>
                  <div className="font-medium text-gray-900">
                    {booking.plot.phase}, Block {booking.plot.block}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Coordinates:</span>
                  <div className="font-medium text-gray-900">{booking.plot.coordinates}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Plot information not available</div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Financial Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-medium text-green-600">{formatCurrency(booking.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Amount:</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(booking.pendingAmount || (booking.totalAmount - (booking.paidAmount || 0)))}
              </span>
            </div>
            {booking.downPayment > 0 && (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Planned Down Payment:</span>
                <span className="font-medium text-gray-900">{formatCurrency(booking.downPayment)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Booking Timeline
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.bookingDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <PaymentScheduleViewer bookingId={bookingId} />

      {/* Payment Management */}
      <BookingPaymentManager bookingId={bookingId} />
    </div>
  );
}
