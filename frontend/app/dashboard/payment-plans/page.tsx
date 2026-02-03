'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

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
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentPlansPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plotSizeMarla: '',
    plotPrice: '',
    downPaymentAmount: '',
    downPaymentPercentage: '',
    monthlyPayment: '',
    quarterlyPayment: '',
    biYearlyPayment: '',
    triannualPayment: '',
    tenureMonths: '24',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<{
    downPayment: number;
    totalMonthlyPayments: number;
    totalAdditionalPayments: number;
    totalPayments: number;
    shortfall: number;
    overpayment: number;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentPlans();
    }
  }, [isAuthenticated]);

  // Calculate payment summary whenever form data changes
  useEffect(() => {
    calculatePaymentSummary();
  }, [formData]);

  const calculatePaymentSummary = () => {
    const plotPrice = parseFloat(formData.plotPrice) || 0;
    const tenureMonths = parseInt(formData.tenureMonths) || 24;
    const monthlyPayment = parseFloat(formData.monthlyPayment) || 0;
    const quarterlyPayment = parseFloat(formData.quarterlyPayment) || 0;
    const biYearlyPayment = parseFloat(formData.biYearlyPayment) || 0;
    const triannualPayment = parseFloat(formData.triannualPayment) || 0;

    if (plotPrice <= 0) {
      setPaymentSummary(null);
      setValidationErrors([]);
      return;
    }

    // Calculate down payment
    let downPayment = 0;
    if (formData.downPaymentAmount) {
      downPayment = parseFloat(formData.downPaymentAmount);
    } else if (formData.downPaymentPercentage && plotPrice > 0) {
      downPayment = Math.round((plotPrice * parseFloat(formData.downPaymentPercentage)) / 100);
    }

    // Calculate total payments
    const totalMonthlyPayments = monthlyPayment * tenureMonths;
    
    let totalAdditionalPayments = 0;
    if (quarterlyPayment > 0) {
      const quarterlyCount = Math.floor(tenureMonths / 3);
      totalAdditionalPayments += quarterlyPayment * quarterlyCount;
    }
    if (biYearlyPayment > 0) {
      const biYearlyCount = Math.floor(tenureMonths / 6);
      totalAdditionalPayments += biYearlyPayment * biYearlyCount;
    }
    if (triannualPayment > 0) {
      const triannualCount = Math.floor(tenureMonths / 4);
      totalAdditionalPayments += triannualPayment * triannualCount;
    }

    const totalPayments = downPayment + totalMonthlyPayments + totalAdditionalPayments;
    const shortfall = Math.max(0, plotPrice - totalPayments);
    const overpayment = Math.max(0, totalPayments - plotPrice);

    setPaymentSummary({
      downPayment,
      totalMonthlyPayments,
      totalAdditionalPayments,
      totalPayments,
      shortfall,
      overpayment,
    });

    // Validate and set errors
    const errors: string[] = [];
    
    // Check for multiple additional payment types
    const additionalPaymentTypes = [quarterlyPayment, biYearlyPayment, triannualPayment].filter(p => p > 0);
    if (additionalPaymentTypes.length > 1) {
      errors.push('Only one additional payment type can be selected');
    }

    if (downPayment <= 0 && plotPrice > 0) {
      errors.push('Down payment must be specified');
    }

    if (downPayment >= plotPrice && plotPrice > 0) {
      errors.push('Down payment cannot be equal to or greater than plot price');
    }

    if (shortfall > 1000) {
      errors.push(`Payment shortfall: ${formatPKR(shortfall)}`);
    }

    if (overpayment > plotPrice * 0.05) {
      errors.push(`Overpayment exceeds 5%: ${formatPKR(overpayment)}`);
    }

    setValidationErrors(errors);
  };

  const fetchPaymentPlans = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/payment-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentPlans(data);
      }
    } catch (error) {
      console.error('Error fetching payment plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const payload = {
        ...formData,
        plotSizeMarla: parseFloat(formData.plotSizeMarla),
        plotPrice: parseFloat(formData.plotPrice),
        downPaymentAmount: formData.downPaymentAmount ? parseFloat(formData.downPaymentAmount) : undefined,
        downPaymentPercentage: formData.downPaymentPercentage ? parseFloat(formData.downPaymentPercentage) : undefined,
        monthlyPayment: parseFloat(formData.monthlyPayment),
        quarterlyPayment: formData.quarterlyPayment ? parseFloat(formData.quarterlyPayment) : undefined,
        biYearlyPayment: formData.biYearlyPayment ? parseFloat(formData.biYearlyPayment) : undefined,
        triannualPayment: formData.triannualPayment ? parseFloat(formData.triannualPayment) : undefined,
        tenureMonths: parseInt(formData.tenureMonths),
      };

      const url = editingPlan 
        ? `${apiUrl}/payment-plans/${editingPlan.id}`
        : `${apiUrl}/payment-plans`;
      
      const method = editingPlan ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEditingPlan(null);
        resetForm();
        fetchPaymentPlans();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save payment plan');
      }
    } catch (error) {
      console.error('Error saving payment plan:', error);
      alert('An error occurred while saving payment plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      plotSizeMarla: plan.plotSizeMarla.toString(),
      plotPrice: plan.plotPrice.toString(),
      downPaymentAmount: plan.downPaymentAmount?.toString() || '',
      downPaymentPercentage: plan.downPaymentPercentage?.toString() || '',
      monthlyPayment: plan.monthlyPayment.toString(),
      quarterlyPayment: plan.quarterlyPayment?.toString() || '',
      biYearlyPayment: plan.biYearlyPayment?.toString() || '',
      triannualPayment: plan.triannualPayment?.toString() || '',
      tenureMonths: plan.tenureMonths.toString(),
      notes: '',
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment plan?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/payment-plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPaymentPlans();
      } else {
        alert('Failed to delete payment plan');
      }
    } catch (error) {
      console.error('Error deleting payment plan:', error);
      alert('An error occurred while deleting payment plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      plotSizeMarla: '',
      plotPrice: '',
      downPaymentAmount: '',
      downPaymentPercentage: '',
      monthlyPayment: '',
      quarterlyPayment: '',
      biYearlyPayment: '',
      triannualPayment: '',
      tenureMonths: '24',
      notes: '',
    });
  };

  const filteredPlans = paymentPlans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.plotSizeMarla.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading || isLoadingPlans) {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Plans</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingPlan(null);
            setShowCreateModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Plan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payment plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Plot Size:</span>
                <span className="text-sm font-medium text-gray-900">{plan.plotSizeMarla} Marla</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Plot Price:</span>
                <span className="text-sm font-medium text-gray-900">{formatPKR(plan.plotPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Payment:</span>
                <span className="text-sm font-medium text-green-600">{formatPKR(plan.monthlyPayment)}</span>
              </div>
              {plan.quarterlyPayment && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quarterly Payment:</span>
                  <span className="text-sm font-medium text-blue-600">{formatPKR(plan.quarterlyPayment)}</span>
                </div>
              )}
              {plan.biYearlyPayment && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bi-yearly Payment:</span>
                  <span className="text-sm font-medium text-purple-600">{formatPKR(plan.biYearlyPayment)}</span>
                </div>
              )}
              {plan.triannualPayment && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Triannual Payment (3x/year):</span>
                  <span className="text-sm font-medium text-indigo-600">{formatPKR(plan.triannualPayment)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tenure:</span>
                <span className="text-sm font-medium text-gray-900">{plan.tenureMonths} months</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  plan.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {plan.status === 'active' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {plan.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment plans found</h3>
          <p className="text-gray-500">Create your first payment plan to get started.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-medium mb-4">
              {editingPlan ? 'Edit Payment Plan' : 'Create New Payment Plan'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Size (Marla) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.plotSizeMarla}
                    onChange={(e) => setFormData(prev => ({ ...prev, plotSizeMarla: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plot Price (PKR) *
                  </label>
                  <input
                    type="number"
                    value={formData.plotPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, plotPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Payment (PKR) *
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.downPaymentAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, downPaymentAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max="100"
                    value={formData.downPaymentPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, downPaymentPercentage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium">Additional Payment Options</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Select only ONE additional payment type (or none). These are in addition to monthly payments.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quarterly Payment (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.quarterlyPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, quarterlyPayment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Every 3 months</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bi-yearly Payment (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.biYearlyPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, biYearlyPayment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Every 6 months</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Triannual Payment (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.triannualPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, triannualPayment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Every 4 months</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenure (months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.tenureMonths}
                    onChange={(e) => setFormData(prev => ({ ...prev, tenureMonths: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>

              {/* Payment Summary */}
              {paymentSummary && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Down Payment:</span>
                      <span className="font-medium text-gray-900 ml-2">{formatPKR(paymentSummary.downPayment)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Payments:</span>
                      <span className="font-medium text-gray-900 ml-2">{formatPKR(paymentSummary.totalMonthlyPayments)}</span>
                    </div>
                    {paymentSummary.totalAdditionalPayments > 0 && (
                      <div>
                        <span className="text-gray-600">Additional Payments:</span>
                        <span className="font-medium text-gray-900 ml-2">{formatPKR(paymentSummary.totalAdditionalPayments)}</span>
                      </div>
                    )}
                    <div className="col-span-2 pt-2 border-t border-gray-300">
                      <span className="text-gray-600">Total Payments:</span>
                      <span className="font-bold text-lg text-gray-900 ml-2">{formatPKR(paymentSummary.totalPayments)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Plot Price:</span>
                      <span className="font-medium text-gray-900 ml-2">{formatPKR(parseFloat(formData.plotPrice) || 0)}</span>
                    </div>
                    {paymentSummary.shortfall > 1000 && (
                      <div className="col-span-2 text-red-600">
                        <span>⚠️ Shortfall:</span>
                        <span className="font-medium ml-2">{formatPKR(paymentSummary.shortfall)}</span>
                      </div>
                    )}
                    {paymentSummary.overpayment > 1000 && (
                      <div className="col-span-2 text-orange-600">
                        <span>⚠️ Overpayment:</span>
                        <span className="font-medium ml-2">{formatPKR(paymentSummary.overpayment)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || validationErrors.length > 0}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
