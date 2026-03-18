'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TrendingUp,
  AlertTriangle,
  Trash2,
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
  discountPercentage?: number;
  discountAmount?: number;
  originalAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
  // Computed stats from backend
  installmentsCount?: number;
  paidInstallments?: number;
  overdueInstallments?: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  paymentProgress?: number;
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
  paymentSchedules?: Array<{
    id: string;
    paymentPlanId?: string;
    paymentPlan?: {
      id: string;
      name: string;
      description: string;
      plotSizeMarla: number;
      plotPrice: number;
      monthlyPayment: number;
      tenureMonths: number;
    };
  }>;
}

export default function ViewBookingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchBooking = useCallback(async () => {
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
  }, [bookingId, router]);

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      fetchBooking();
    }
  }, [isAuthenticated, bookingId, fetchBooking]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
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

  // Called when a payment is added from BookingPaymentManager
  const handlePaymentAdded = () => {
    fetchBooking(); // Refresh booking data to get updated stats
    setPaymentRefreshKey(prev => prev + 1); // Trigger PaymentScheduleViewer refresh
  };

  const handleDeleteBooking = async () => {
    if (!confirm('Are you sure you want to delete this booking? This will also delete all associated payment schedules, installments, and payment records. This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const deleteToken = localStorage.getItem('access_token');
      const deleteApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${deleteApiUrl}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${deleteToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete booking');
      router.push('/dashboard/bookings');
    } catch (err) {
      alert('Failed to delete booking. Please try again.');
      setIsDeleting(false);
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

  const paidAmount = Number(booking.paidAmount) || 0;
  const totalAmount = Number(booking.totalAmount) || 0;
  const pendingAmount = Number(booking.pendingAmount) || (totalAmount - paidAmount);
  const downPayment = Number(booking.downPayment) || 0;
  const paymentProgress = booking.paymentProgress || (totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0);

  // Get payment plan info from paymentSchedules
  const paymentPlan = booking.paymentSchedules?.[0]?.paymentPlan;

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
          <button
            onClick={handleDeleteBooking}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="-ml-1 mr-2 h-5 w-5" />
            {isDeleting ? 'Deleting...' : 'Delete Booking'}
          </button>
        </div>
      </div>

      {/* Booking Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.bookingNumber}</h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(booking.status)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              {paymentPlan && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {paymentPlan.name}
                </span>
              )}
              {Number(booking.discountPercentage) > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {booking.discountPercentage}% Discount Applied
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Booking Date</div>
            <div className="text-lg font-medium text-gray-900">
              {new Date(booking.bookingDate).toLocaleDateString()}
            </div>
            {Number(booking.discountPercentage) > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                <span className="line-through">{formatCurrency(Number(booking.originalAmount))}</span>
                {' → '}
                <span className="text-green-700 font-medium">{formatCurrency(totalAmount)}</span>
              </div>
            )}
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
                  <span className="text-sm text-gray-500">Plot Price:</span>
                  <div className="font-medium text-gray-900">{formatCurrency(booking.plot.pricePkr)}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Plot information not available</div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(paidAmount)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Pending Amount</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(pendingAmount)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Down Payment</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(downPayment)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">Payment Progress</h3>
          <span className="text-2xl font-bold text-primary-600">{paymentProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${paymentProgress >= 100 ? 'bg-green-500' : paymentProgress >= 50 ? 'bg-blue-500' : 'bg-orange-500'
              }`}
            style={{ width: `${Math.min(100, paymentProgress)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {booking.installmentsCount != null && (
            <div>
              <p className="text-gray-500">Total Installments</p>
              <p className="font-medium text-gray-900">{booking.installmentsCount}</p>
            </div>
          )}
          {booking.paidInstallments != null && (
            <div>
              <p className="text-gray-500">Paid Installments</p>
              <p className="font-medium text-green-600">{booking.paidInstallments}</p>
            </div>
          )}
          {booking.overdueInstallments != null && booking.overdueInstallments > 0 && (
            <div>
              <p className="text-gray-500">Overdue</p>
              <p className="font-medium text-red-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> {booking.overdueInstallments}
              </p>
            </div>
          )}
          {booking.nextPaymentDate && (
            <div>
              <p className="text-gray-500">Next Payment</p>
              <p className="font-medium text-gray-900">
                {new Date(booking.nextPaymentDate).toLocaleDateString()} — {formatCurrency(Number(booking.nextPaymentAmount) || 0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Timeline & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Payment Plan Info */}
        {paymentPlan && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Payment Plan
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Name:</span>
                <span className="font-medium text-gray-900">{paymentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plot Size:</span>
                <span className="font-medium text-gray-900">{paymentPlan.plotSizeMarla} Marla</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Payment:</span>
                <span className="font-medium text-gray-900">{formatCurrency(paymentPlan.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tenure:</span>
                <span className="font-medium text-gray-900">{paymentPlan.tenureMonths} months</span>
              </div>
            </div>
          </div>
        )}

        {!paymentPlan && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Down Payment:</span>
                <span className="font-medium text-gray-900">{formatCurrency(downPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalAmount - downPayment)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Schedule */}
      <PaymentScheduleViewer bookingId={bookingId} refreshKey={paymentRefreshKey} />

      {/* Payment Management */}
      <BookingPaymentManager bookingId={bookingId} onPaymentAdded={handlePaymentAdded} />
    </div>
  );
}
