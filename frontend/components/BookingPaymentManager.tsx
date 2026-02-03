'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
  paymentProofs?: PaymentProof[];
  processedByUser?: {
    fullName: string;
  };
}

interface PaymentProof {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  proofType: string;
  description?: string;
  createdAt: string;
}

interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentCount: number;
  lastPaymentDate: string | null;
}

interface BookingPaymentManagerProps {
  bookingId: string;
}

export default function BookingPaymentManager({ bookingId }: BookingPaymentManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    transactionId: '',
    bankName: '',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentSummary();
  }, [bookingId]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/bookings/${bookingId}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/bookings/${bookingId}/payments/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentSummary(data);
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/bookings/${bookingId}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPayment,
          amount: parseFloat(newPayment.amount),
          paymentDate: new Date(newPayment.paymentDate),
        }),
      });

      if (response.ok) {
        setShowAddPayment(false);
        setNewPayment({
          amount: '',
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString().split('T')[0],
          referenceNumber: '',
          transactionId: '',
          bankName: '',
          notes: '',
        });
        fetchPayments();
        fetchPaymentSummary();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('An error occurred while adding payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (paymentId: string, file: File, proofType: string, description: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('proofType', proofType);
    formData.append('description', description);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/bookings/${bookingId}/payments/${paymentId}/proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        fetchPayments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload payment proof');
      }
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      alert('An error occurred while uploading payment proof');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      {paymentSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payment Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatPKR(paymentSummary.totalAmount)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-xl font-semibold text-green-600">
                {formatPKR(paymentSummary.paidAmount)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-xl font-semibold text-orange-600">
                {formatPKR(paymentSummary.pendingAmount)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-xl font-semibold text-blue-600">
                {paymentSummary.paymentCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment History
          </h3>
          <button
            onClick={() => setShowAddPayment(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </button>
        </div>

        {/* Add Payment Modal */}
        {showAddPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h4 className="text-lg font-medium mb-4">Add New Payment</h4>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="mobile_wallet">Mobile Wallet</option>
                    <option value="online_banking">Online Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={newPayment.transactionId}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment List */}
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    <span className="font-medium text-gray-900">
                      {formatPKR(payment.amount)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Method:</span> {payment.paymentMethod.replace('_', ' ')}
                  </div>
                  {payment.referenceNumber && (
                    <div>
                      <span className="font-medium">Reference:</span> {payment.referenceNumber}
                    </div>
                  )}
                  {payment.transactionId && (
                    <div>
                      <span className="font-medium">Transaction ID:</span> {payment.transactionId}
                    </div>
                  )}
                  {payment.processedByUser && (
                    <div>
                      <span className="font-medium">Processed by:</span> {payment.processedByUser.fullName}
                    </div>
                  )}
                </div>

                {payment.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {payment.notes}
                  </div>
                )}

                {/* Payment Proofs */}
                {payment.paymentProofs && payment.paymentProofs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Payment Proofs:</p>
                    <div className="flex flex-wrap gap-2">
                      {payment.paymentProofs.map((proof) => (
                        <div key={proof.id} className="flex items-center space-x-2 bg-gray-50 rounded px-2 py-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{proof.fileName}</span>
                          <button className="text-blue-500 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Payment Proof */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const description = prompt('Enter description for this payment proof:');
                        if (description !== null) {
                          handleFileUpload(payment.id, file, 'screenshot', description);
                        }
                      }
                    }}
                    className="hidden"
                    id={`file-upload-${payment.id}`}
                  />
                  <label
                    htmlFor={`file-upload-${payment.id}`}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Proof
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
