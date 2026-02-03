'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber?: string;
  customer: {
    id: string;
    fullName: string;
  };
  plot: {
    id: string;
    plotNumber: string;
  };
  paymentSchedules: Array<{
    id: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }>;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
  { value: 'online_banking', label: 'Online Banking' },
];

export default function NewPaymentPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');

  const [formData, setFormData] = useState({
    bookingId: '',
    paymentScheduleId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    referenceNumber: '',
    bankName: '',
    accountNumber: '',
    chequeNumber: '',
    chequeDate: '',
    cardLastFour: '',
    walletProvider: '',
    notes: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (formData.bookingId) {
      const booking = bookings.find(b => b.id === formData.bookingId);
      setSelectedBooking(booking || null);
      if (booking && booking.paymentSchedules.length > 0) {
        setSelectedSchedule(booking.paymentSchedules[0].id);
        setFormData(prev => ({
          ...prev,
          paymentScheduleId: booking.paymentSchedules[0].id,
        }));
      }
    }
  }, [formData.bookingId, bookings]);

  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${apiUrl}/bookings?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  if (isLoading || isLoadingBookings) {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bookingId) {
      newErrors.bookingId = 'Booking is required';
    }

    if (!formData.paymentScheduleId) {
      newErrors.paymentScheduleId = 'Payment schedule is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const payload: any = {
        paymentScheduleId: formData.paymentScheduleId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId || undefined,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      };

      // Add method-specific fields
      if (formData.paymentMethod === 'bank_transfer') {
        payload.bankName = formData.bankName || undefined;
        payload.accountNumber = formData.accountNumber || undefined;
      } else if (formData.paymentMethod === 'cheque') {
        payload.chequeNumber = formData.chequeNumber || undefined;
        payload.chequeDate = formData.chequeDate || undefined;
      } else if (formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') {
        payload.cardLastFour = formData.cardLastFour || undefined;
      } else if (formData.paymentMethod === 'mobile_wallet') {
        payload.walletProvider = formData.walletProvider || undefined;
      }

      const response = await fetch(`${apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const payment = await response.json();
        // Auto-approve if user has permission
        if (user?.role === 'admin' || user?.role === 'accountant') {
          await fetch(`${apiUrl}/payments/${payment.id}/process`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ approved: true }),
          });
        }
        router.push('/dashboard/payments');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedScheduleData = selectedBooking?.paymentSchedules.find(s => s.id === formData.paymentScheduleId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-600">Record a new payment for a booking</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bookingId}
              onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.bookingId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Booking</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.bookingNumber || booking.id} - {booking.customer.fullName} - Plot {booking.plot.plotNumber}
                </option>
              ))}
            </select>
            {errors.bookingId && <p className="mt-1 text-sm text-red-600">{errors.bookingId}</p>}
          </div>

          {/* Payment Schedule */}
          {selectedBooking && selectedBooking.paymentSchedules.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Schedule <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentScheduleId}
                onChange={(e) => setFormData({ ...formData, paymentScheduleId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.paymentScheduleId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Payment Schedule</option>
                {selectedBooking.paymentSchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    Schedule - Pending: PKR {schedule.pendingAmount.toLocaleString()}
                  </option>
                ))}
              </select>
              {errors.paymentScheduleId && <p className="mt-1 text-sm text-red-600">{errors.paymentScheduleId}</p>}
              {selectedScheduleData && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Total: PKR {selectedScheduleData.totalAmount.toLocaleString()} | 
                    Paid: PKR {selectedScheduleData.paidAmount.toLocaleString()} | 
                    Pending: PKR {selectedScheduleData.pendingAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={selectedScheduleData?.pendingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.paymentDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>}
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Transaction reference"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Payment reference"
            />
          </div>

          {/* Bank Transfer Fields */}
          {formData.paymentMethod === 'bank_transfer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Account number"
                />
              </div>
            </>
          )}

          {/* Cheque Fields */}
          {formData.paymentMethod === 'cheque' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number</label>
                <input
                  type="text"
                  value={formData.chequeNumber}
                  onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Cheque number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Date</label>
                <input
                  type="date"
                  value={formData.chequeDate}
                  onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          {/* Card Fields */}
          {(formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                value={formData.cardLastFour}
                onChange={(e) => setFormData({ ...formData, cardLastFour: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="1234"
              />
            </div>
          )}

          {/* Mobile Wallet Fields */}
          {formData.paymentMethod === 'mobile_wallet' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Provider</label>
              <input
                type="text"
                value={formData.walletProvider}
                onChange={(e) => setFormData({ ...formData, walletProvider: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., JazzCash, EasyPaisa"
              />
            </div>
          )}

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional notes about this payment"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

