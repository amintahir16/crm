'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Info
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  transactionId?: string;
  referenceNumber?: string;
  notes?: string;
}

interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidDate?: string;
  paidAmount?: number;
  installmentType?: string;
  description?: string;
  linkedPayments?: Payment[]; // Payments made for this installment
}

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  plotSizeMarla: number;
  plotPrice: number;
  downPaymentAmount?: number;
  downPaymentPercentage?: number;
  monthlyPayment: number;
  quarterlyPayment?: number;
  biYearlyPayment?: number;
  triannualPayment?: number;
  tenureMonths: number;
}

interface PaymentSchedule {
  id: string;
  paymentType: 'full_payment' | 'installment';
  status: string;
  totalAmount: number;
  downPayment: number;
  paidAmount: number;
  pendingAmount: number;
  installmentCount?: number;
  installmentAmount?: number;
  installmentFrequency?: string;
  startDate?: string;
  endDate?: string;
  paymentPlan?: PaymentPlan;
  installments?: Installment[];
  payments?: Payment[]; // All payments made for this schedule
}

interface BookingInfo {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

interface PaymentScheduleData {
  booking: BookingInfo;
  paymentSchedule: PaymentSchedule;
}

interface PaymentScheduleViewerProps {
  bookingId: string;
}

export default function PaymentScheduleViewer({ bookingId }: PaymentScheduleViewerProps) {
  const [scheduleData, setScheduleData] = useState<PaymentScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentSchedule();
  }, [bookingId]);

  const fetchPaymentSchedule = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/bookings/${bookingId}/payment-schedule`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setScheduleData(data);
        }
      } else {
        setError('Failed to fetch payment schedule');
      }
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
      setError('Error loading payment schedule');
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

  const getInstallmentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatInstallmentType = (type?: string) => {
    switch (type) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'bi_yearly':
        return 'Bi-Yearly';
      case 'triannual':
        return 'Triannual';
      case 'down_payment_balance':
        return 'Down Payment';
      default:
        return 'Regular';
    }
  };

  const getInstallmentTypeColor = (type?: string) => {
    switch (type) {
      case 'monthly':
        return 'bg-blue-100 text-blue-800';
      case 'quarterly':
        return 'bg-purple-100 text-purple-800';
      case 'bi_yearly':
        return 'bg-indigo-100 text-indigo-800';
      case 'triannual':
        return 'bg-pink-100 text-pink-800';
      case 'down_payment_balance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate down payment breakdown
  const getDownPaymentBreakdown = () => {
    if (!scheduleData) return null;

    const { booking, paymentSchedule } = scheduleData;
    const requiredDownPayment = paymentSchedule.downPayment;
    const totalPaid = booking.paidAmount;
    
    // Find down payment balance installment
    const downPaymentInstallment = paymentSchedule.installments?.find(
      inst => inst.installmentType === 'down_payment_balance'
    );
    
    // Calculate initial down payment (total paid minus any other payments)
    const otherPayments = paymentSchedule.payments?.reduce((sum, payment) => {
      // Check if this payment is for down payment balance installment
      const isForDownPayment = downPaymentInstallment && 
        payment.notes?.includes('down payment') || 
        payment.notes?.includes('Down Payment');
      return isForDownPayment ? sum : sum + payment.amount;
    }, 0) || 0;
    
    const initialDownPayment = totalPaid - otherPayments;
    const remainingDownPayment = downPaymentInstallment?.amount || 0;
    const downPaymentPaid = remainingDownPayment > 0 ? 
      (downPaymentInstallment?.status === 'paid' ? remainingDownPayment : 0) : 0;

    return {
      required: requiredDownPayment,
      initial: initialDownPayment,
      remaining: remainingDownPayment,
      remainingPaid: downPaymentPaid,
      totalPaid: initialDownPayment + downPaymentPaid,
      pendingDownPayment: Math.max(0, requiredDownPayment - (initialDownPayment + downPaymentPaid))
    };
  };

  // Link payments to installments (simplified approach)
  const getLinkedPayments = (installment: Installment): Payment[] => {
    if (!scheduleData?.paymentSchedule.payments) return [];
    
    // For now, we'll show all payments - in a real system, you'd have a proper linking mechanism
    // This could be enhanced with a payment_installment_links table
    return scheduleData.paymentSchedule.payments.filter(payment => {
      // Simple heuristic: if payment amount matches installment amount, it might be linked
      return Math.abs(payment.amount - installment.amount) < 1000;
    });
  };

  // Group installments by type for better display
  const groupInstallmentsByType = () => {
    if (!scheduleData?.paymentSchedule.installments) return {};
    
    const groups: { [key: string]: Installment[] } = {};
    
    scheduleData.paymentSchedule.installments.forEach(installment => {
      const type = installment.installmentType || 'monthly';
      if (!groups[type]) groups[type] = [];
      groups[type].push(installment);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
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

  if (!scheduleData) {
    return null;
  }

  const { booking, paymentSchedule } = scheduleData;

  return (
    <div className="space-y-6">
      {/* Payment Schedule Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Schedule Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(booking.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(booking.paidAmount)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(booking.pendingAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Down Payment Breakdown */}
        {(() => {
          const downPaymentInfo = getDownPaymentBreakdown();
          if (!downPaymentInfo) return null;
          
          return (
            <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Down Payment Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-orange-600">Required Down Payment</p>
                  <p className="font-bold text-orange-900">{formatCurrency(downPaymentInfo.required)}</p>
                </div>
                <div>
                  <p className="text-orange-600">Initial Payment Made</p>
                  <p className="font-bold text-green-900">{formatCurrency(downPaymentInfo.initial)}</p>
                </div>
                <div>
                  <p className="text-orange-600">Remaining Balance</p>
                  <p className="font-bold text-orange-900">{formatCurrency(downPaymentInfo.remaining)}</p>
                </div>
                <div>
                  <p className="text-orange-600">Pending Down Payment</p>
                  <p className={`font-bold ${downPaymentInfo.pendingDownPayment > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {formatCurrency(downPaymentInfo.pendingDownPayment)}
                  </p>
                </div>
              </div>
              {downPaymentInfo.pendingDownPayment > 0 && (
                <div className="mt-3 p-2 bg-red-100 rounded text-red-800 text-sm">
                  ⚠️ Down payment is incomplete. Remaining balance must be paid before installments begin.
                </div>
              )}
            </div>
          );
        })()}

        {/* Payment Plan Info */}
        {paymentSchedule.paymentPlan && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Payment Plan Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Plan Name</p>
                <p className="font-medium">{paymentSchedule.paymentPlan.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Plot Size</p>
                <p className="font-medium">{paymentSchedule.paymentPlan.plotSizeMarla} Marla</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Payment</p>
                <p className="font-medium">{formatCurrency(paymentSchedule.paymentPlan.monthlyPayment)}</p>
              </div>
              <div>
                <p className="text-gray-600">Tenure</p>
                <p className="font-medium">{paymentSchedule.paymentPlan.tenureMonths} months</p>
              </div>
              {paymentSchedule.paymentPlan.quarterlyPayment && (
                <div>
                  <p className="text-gray-600">Quarterly Payment</p>
                  <p className="font-medium">{formatCurrency(paymentSchedule.paymentPlan.quarterlyPayment)}</p>
                </div>
              )}
              {paymentSchedule.paymentPlan.biYearlyPayment && (
                <div>
                  <p className="text-gray-600">Bi-Yearly Payment</p>
                  <p className="font-medium">{formatCurrency(paymentSchedule.paymentPlan.biYearlyPayment)}</p>
                </div>
              )}
              {paymentSchedule.paymentPlan.triannualPayment && (
                <div>
                  <p className="text-gray-600">Triannual Payment</p>
                  <p className="font-medium">{formatCurrency(paymentSchedule.paymentPlan.triannualPayment)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Payment Type</p>
            <p className="font-medium capitalize">{paymentSchedule.paymentType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-gray-600">Down Payment</p>
            <p className="font-medium">{formatCurrency(paymentSchedule.downPayment)}</p>
          </div>
          {paymentSchedule.installmentCount && (
            <div>
              <p className="text-gray-600">Total Installments</p>
              <p className="font-medium">{paymentSchedule.installmentCount}</p>
            </div>
          )}
          {paymentSchedule.endDate && (
            <div>
              <p className="text-gray-600">End Date</p>
              <p className="font-medium">{formatDate(paymentSchedule.endDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Installments List */}
      {paymentSchedule.installments && paymentSchedule.installments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Complete Payment Schedule ({paymentSchedule.installments.length} installments)
          </h3>

          {/* Payment Summary by Type */}
          {(() => {
            const groups = groupInstallmentsByType();
            const typeOrder = ['down_payment_balance', 'monthly', 'quarterly', 'bi_yearly', 'triannual'];
            
            return (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                {typeOrder.map(type => {
                  const installments = groups[type];
                  if (!installments || installments.length === 0) return null;
                  
                  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
                  const paidCount = installments.filter(inst => inst.status === 'paid').length;
                  
                  return (
                    <div key={type} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {formatInstallmentType(type)}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {installments.length} installments
                      </div>
                      <div className="text-xs text-gray-600">
                        {paidCount} paid, {installments.length - paidCount} pending
                      </div>
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(totalAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Records
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentSchedule.installments.map((installment, index) => {
                  const linkedPayments = getLinkedPayments(installment);
                  
                  return (
                    <tr key={installment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getInstallmentTypeColor(installment.installmentType)}`}>
                          {formatInstallmentType(installment.installmentType)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="font-medium">{installment.description || '-'}</div>
                        {installment.installmentType === 'down_payment_balance' && (
                          <div className="text-xs text-orange-600 mt-1">
                            Remaining down payment balance
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(installment.dueDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatCurrency(installment.amount)}</div>
                        {installment.paidAmount && installment.paidAmount !== installment.amount && (
                          <div className="text-xs text-green-600">
                            Paid: {formatCurrency(installment.paidAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getInstallmentStatusColor(installment.status)}`}>
                          {getInstallmentStatusIcon(installment.status)}
                          <span className="ml-1 capitalize">{installment.status}</span>
                        </span>
                        {installment.paidDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Paid: {formatDate(installment.paidDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {linkedPayments.length > 0 ? (
                          <div className="space-y-1">
                            {linkedPayments.map((payment, paymentIndex) => (
                              <div key={payment.id} className="bg-green-50 p-2 rounded text-xs">
                                <div className="font-medium text-green-800">
                                  {formatCurrency(payment.amount)} - {payment.paymentMethod}
                                </div>
                                <div className="text-green-600">
                                  {formatDate(payment.paymentDate)}
                                </div>
                                {payment.transactionId && (
                                  <div className="text-green-600">
                                    ID: {payment.transactionId}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No payments linked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* All Payment Records */}
          {paymentSchedule.payments && paymentSchedule.payments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                All Payment Records ({paymentSchedule.payments.length})
              </h4>
              <div className="grid gap-3">
                {paymentSchedule.payments.map((payment) => (
                  <div key={payment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {payment.paymentMethod} • {formatDate(payment.paymentDate)}
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                        {payment.transactionId && (
                          <div className="text-xs text-gray-500 mt-1">
                            {payment.transactionId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
