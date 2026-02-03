'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  MapPin,
  Edit,
  Plus,
} from 'lucide-react';

interface PaymentSchedule {
  id: string;
  bookingId: string;
  paymentType: 'full_payment' | 'installment';
  status?: 'active' | 'completed' | 'cancelled' | 'suspended' | null;
  totalAmount: number;
  downPayment: number;
  paidAmount: number;
  pendingAmount: number;
  installmentCount?: number;
  installmentAmount?: number;
  installmentFrequency?: string;
  startDate?: string;
  endDate?: string;
  interestRate: number;
  lateFeeRate: number;
  totalLateFees: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
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
    };
  };
  installments?: Installment[];
}

interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  lateFee: number;
}

export default function ViewPaymentSchedulePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  
  const [schedule, setSchedule] = useState<PaymentSchedule | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && scheduleId) {
      fetchPaymentSchedule();
    }
  }, [isAuthenticated, scheduleId]);

  const fetchPaymentSchedule = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/payment-schedules/${scheduleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        console.error('Failed to fetch payment schedule');
        router.push('/dashboard/payments');
      }
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
      router.push('/dashboard/payments');
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'active':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'suspended':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || isLoadingSchedule) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !schedule) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/payments')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Schedule Details</h1>
            <p className="text-gray-600">View payment schedule and installment details</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/dashboard/payments/edit/${schedule.id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Edit className="-ml-1 mr-2 h-5 w-5" />
            Edit Schedule
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Schedule Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {schedule.booking?.bookingNumber || 'Payment Schedule'}
            </h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(schedule.status)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                {schedule.status ? (schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)) : 'Unknown'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Payment Type</div>
            <div className="text-lg font-medium text-gray-900">
              {schedule.paymentType === 'full_payment' ? 'Full Payment' : 'Installment Plan'}
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
            {schedule.booking?.customer ? (
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <div className="font-medium text-gray-900">{schedule.booking.customer.fullName}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <div className="font-medium text-gray-900">{schedule.booking.customer.phone}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <div className="font-medium text-gray-900">{schedule.booking.customer.email}</div>
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
            {schedule.booking?.plot ? (
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Plot Number:</span>
                  <div className="font-medium text-gray-900">{schedule.booking.plot.plotNumber}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Size:</span>
                  <div className="font-medium text-gray-900">
                    {schedule.booking.plot.sizeMarla} Marla ({schedule.booking.plot.sizeSqm} SQM)
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Location:</span>
                  <div className="font-medium text-gray-900">
                    {schedule.booking.plot.phase}, Block {schedule.booking.plot.block}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Plot Price:</span>
                  <div className="font-medium text-gray-900">{formatCurrency(schedule.booking.plot.pricePkr)}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Plot information not available</div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Financial Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium text-gray-900">{formatCurrency(schedule.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Down Payment:</span>
              <span className="font-medium text-gray-900">{formatCurrency(schedule.downPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-medium text-green-600">{formatCurrency(schedule.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Amount:</span>
              <span className="font-medium text-red-600">{formatCurrency(schedule.pendingAmount)}</span>
            </div>
            {schedule.totalLateFees > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Late Fees:</span>
                <span className="font-medium text-red-600">{formatCurrency(schedule.totalLateFees)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Timeline
          </h3>
          <div className="space-y-3">
            {schedule.startDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(schedule.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {schedule.endDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(schedule.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {schedule.installmentCount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Installments:</span>
                <span className="font-medium text-gray-900">{schedule.installmentCount} months</span>
              </div>
            )}
            {schedule.installmentAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Amount:</span>
                <span className="font-medium text-gray-900">{formatCurrency(schedule.installmentAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {new Date(schedule.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Installments Table */}
      {schedule.paymentType === 'installment' && schedule.installments && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Installment Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Installment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late Fee
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.installments.map((installment, index) => (
                  <tr key={installment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(installment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(installment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {installment.paidDate ? new Date(installment.paidDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInstallmentStatusColor(installment.status)}`}>
                        {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {installment.lateFee > 0 ? formatCurrency(installment.lateFee) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
