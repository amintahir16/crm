'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Users,
  MapPin,
  Calendar,
  Search,
  CheckCircle,
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface Customer {
  id: string;
  cnic: string;
  fullName: string;
  phone: string;
  email: string;
}

interface Plot {
  id: string;
  plotNumber: string;
  sizeMarla: number;
  phase: string;
  block: string;
  pricePkr: number;
  status: string;
}

interface BookingFormData {
  customerId: string;
  plotId: string;
  downPayment: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentType: 'full_payment' | 'installment';
  paymentPlanId?: string;
  installmentCount?: number;
  notes?: string;
  discountPercentage?: number;
  originalAmount?: number;
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
  status: string;
}

export default function NewBookingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [plotSearch, setPlotSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan | null>(null);

  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const [formData, setFormData] = useState<BookingFormData>({
    customerId: '',
    plotId: '',
    downPayment: 0,
    totalAmount: 0,
    paidAmount: 0,
    status: 'pending',
    paymentType: 'installment',
    paymentPlanId: '',
    installmentCount: 24,
    notes: '',
    discountPercentage: 0,
    originalAmount: 0,
  });

  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  if (isLoading) {
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);




  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const [customersResponse, plotsResponse, paymentPlansResponse] = await Promise.all([
        fetch(`${apiUrl}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/plots?status=available`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/payment-plans/active`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.data || []);
      }

      if (plotsResponse.ok) {
        const plotsData = await plotsResponse.json();
        setPlots(plotsData.data || []);
      }

      if (paymentPlansResponse.ok) {
        const paymentPlansData = await paymentPlansResponse.json();
        setPaymentPlans(paymentPlansData || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    // Convert to numbers for proper comparison
    const downPaymentNum = typeof formData.downPayment === 'string' ? parseFloat(formData.downPayment) : Number(formData.downPayment) || 0;
    const totalAmountNum = typeof formData.totalAmount === 'string' ? parseFloat(formData.totalAmount) : Number(formData.totalAmount) || 0;
    const paidAmountNum = typeof formData.paidAmount === 'string' ? parseFloat(formData.paidAmount) : Number(formData.paidAmount) || 0;

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.plotId) {
      newErrors.plotId = 'Plot is required';
    }

    if (downPaymentNum < 0) {
      newErrors.downPayment = 'Down payment cannot be negative' as any;
    }

    if (totalAmountNum <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0' as any;
    }

    if (downPaymentNum > totalAmountNum) {
      newErrors.downPayment = 'Down payment cannot be greater than total amount' as any;
    }

    if (paidAmountNum < 0) {
      newErrors.paidAmount = 'Initial payment cannot be negative' as any;
    }

    if (paidAmountNum > totalAmountNum) {
      newErrors.paidAmount = 'Initial payment cannot be greater than total amount' as any;
    }

    if (formData.paymentType === 'installment') {
      if (!formData.paymentPlanId) {
        newErrors.paymentPlanId = 'Payment plan is required for installment bookings' as any;
      }
      if (!formData.installmentCount || formData.installmentCount < 1) {
        newErrors.installmentCount = 'Installment count must be at least 1' as any;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const requestBody = {
        ...formData,
        createdById: user?.id,
      };

      const response = await fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        await response.json();
        router.push('/dashboard/bookings');
      } else {
        const errorData = await response.json();
        if (errorData.message && Array.isArray(errorData.message)) {
          const validationErrors: Partial<BookingFormData> = {};
          errorData.message.forEach((error: string) => {
            if (error.includes('customer')) validationErrors.customerId = error;
            if (error.includes('plot')) validationErrors.plotId = error;
            if (error.includes('amount')) validationErrors.totalAmount = error as any;
          });
          setErrors(validationErrors);
        } else {
          alert(errorData.message || 'Failed to create booking. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('An error occurred while creating the booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BookingFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNumberInputChange = (field: keyof BookingFormData, value: string) => {
    const numericValue = value === '' ? 0 : parseInt(value, 10) || 0;

    setFormData(prev => ({ ...prev, [field]: numericValue }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setCustomerSearch('');
  };

  const handlePlotSelect = (plot: Plot) => {
    setSelectedPlot(plot);
    setFormData(prev => ({
      ...prev,
      plotId: plot.id,
      totalAmount: plot.pricePkr,
      downPayment: 0, // Allow zero down payment
      paidAmount: 0, // Start with zero initial payment
    }));
    setPlotSearch('');

    // Auto-select compatible payment plan if available
    const compatiblePlan = paymentPlans.find(plan =>
      plan.plotSizeMarla === plot.sizeMarla && plan.plotPrice === plot.pricePkr
    );
    if (compatiblePlan) {
      handlePaymentPlanSelect(compatiblePlan);
    }
  };

  const handlePaymentPlanSelect = (paymentPlan: PaymentPlan) => {
    // Validate plot-plan compatibility
    if (selectedPlot && selectedPlot.sizeMarla !== paymentPlan.plotSizeMarla) {
      alert(`Warning: This payment plan is for ${paymentPlan.plotSizeMarla} marla plots, but selected plot is ${selectedPlot.sizeMarla} marla.`);
    }

    // Check if plot price matches plan price
    if (selectedPlot && Math.abs(selectedPlot.pricePkr - paymentPlan.plotPrice) > 1000) {
      const priceDifference = selectedPlot.pricePkr - paymentPlan.plotPrice;
      const message = priceDifference > 0
        ? `Plot price (${formatCurrency(selectedPlot.pricePkr)}) is higher than plan price (${formatCurrency(paymentPlan.plotPrice)}) by ${formatCurrency(Math.abs(priceDifference))}`
        : `Plot price (${formatCurrency(selectedPlot.pricePkr)}) is lower than plan price (${formatCurrency(paymentPlan.plotPrice)}) by ${formatCurrency(Math.abs(priceDifference))}`;

      alert(`Price Mismatch: ${message}. Consider using the plot's actual price.`);
    }

    setSelectedPaymentPlan(paymentPlan);

    // Use the actual plot price instead of plan price if they differ significantly
    const basePrice = selectedPlot && Math.abs(selectedPlot.pricePkr - paymentPlan.plotPrice) > 1000
      ? selectedPlot.pricePkr
      : paymentPlan.plotPrice;

    // Apply current discount
    applyDiscountToForm(paymentPlan, basePrice, discountPercent);
  };

  const applyDiscountToForm = (plan: PaymentPlan, basePrice: number, discount: number) => {
    const factor = discount > 0 ? (1 - discount / 100) : 1;
    const discountedPrice = Math.round(basePrice * factor);
    const originalDownPayment = plan.downPaymentAmount ||
      (plan.downPaymentPercentage ?
        Math.round((basePrice * plan.downPaymentPercentage) / 100) : 0);
    const discountedDownPayment = Math.round(originalDownPayment * factor);

    setFormData(prev => ({
      ...prev,
      paymentPlanId: plan.id,
      downPayment: discountedDownPayment,
      installmentCount: plan.tenureMonths,
      totalAmount: discountedPrice,
      originalAmount: basePrice,
      discountPercentage: discount,
    }));
  };

  const handleDiscountChange = (value: string) => {
    const newDiscount = value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(value) || 0));
    setDiscountPercent(newDiscount);

    if (selectedPaymentPlan) {
      const basePrice = selectedPlot && Math.abs(selectedPlot.pricePkr - selectedPaymentPlan.plotPrice) > 1000
        ? selectedPlot.pricePkr
        : selectedPaymentPlan.plotPrice;
      applyDiscountToForm(selectedPaymentPlan, basePrice, newDiscount);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatPKR(amount);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.cnic.includes(customerSearch) ||
    customer.phone.includes(customerSearch)
  );

  const filteredPlots = plots.filter(plot =>
    plot.plotNumber.toLowerCase().includes(plotSearch.toLowerCase()) ||
    plot.phase.toLowerCase().includes(plotSearch.toLowerCase()) ||
    plot.block.toLowerCase().includes(plotSearch.toLowerCase())
  );

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
            <p className="text-gray-600">Create a new plot booking</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search customers..."
                />
              </div>

              {customerSearch && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.fullName}</div>
                      <div className="text-sm text-gray-500">
                        {customer.cnic} • {customer.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {selectedCustomer.fullName}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {selectedCustomer.cnic} • {selectedCustomer.phone}
                  </div>
                </div>
              )}

              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
              )}
            </div>

            {/* Plot Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plot *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={plotSearch}
                  onChange={(e) => setPlotSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search plots..."
                />
              </div>

              {plotSearch && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredPlots.map((plot) => (
                    <div
                      key={plot.id}
                      onClick={() => handlePlotSelect(plot)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{plot.plotNumber}</div>
                      <div className="text-sm text-gray-500">
                        {plot.phase}, {plot.block} • {plot.sizeMarla} Marla • {formatCurrency(plot.pricePkr)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPlot && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {selectedPlot.plotNumber}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedPlot.phase}, {selectedPlot.block} • {selectedPlot.sizeMarla} Marla • {formatCurrency(selectedPlot.pricePkr)}
                  </div>
                </div>
              )}

              {errors.plotId && (
                <p className="mt-1 text-sm text-red-600">{errors.plotId}</p>
              )}
            </div>

            {/* Payment Amount Field */}
            {formData.paymentType === 'full_payment' ? (
              /* Full Payment - Amount Paid */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.totalAmount}
                  value={formData.paidAmount || ''}
                  onChange={(e) => handleNumberInputChange('paidAmount', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.paidAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                />
                {errors.paidAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.paidAmount}</p>
                )}
                {formData.paidAmount > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(formData.paidAmount)}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Amount actually paid at booking time. Can be 0 or any amount up to total amount.
                </p>
                {formData.totalAmount > 0 && formData.paidAmount < formData.totalAmount && (
                  <p className="mt-1 text-sm text-orange-600">
                    Pending: {formatCurrency(formData.totalAmount - formData.paidAmount)}
                  </p>
                )}
              </div>
            ) : (
              /* Installment - Down Payment (Read-only from plan) */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Down Payment (PKR)
                </label>
                <input
                  type="number"
                  value={formData.downPayment || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Select a payment plan"
                />
                {formData.downPayment > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(formData.downPayment)} (as per selected payment plan)
                  </p>
                )}
                {!selectedPaymentPlan && (
                  <p className="mt-1 text-sm text-blue-600">
                    Down payment will be set automatically when you select a payment plan
                  </p>
                )}
              </div>
            )}

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (PKR) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.totalAmount || ''}
                readOnly
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 cursor-not-allowed ${errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="2500000"
              />
              {errors.totalAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
              )}
              {formData.totalAmount > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(formData.totalAmount)}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Total amount is automatically set when you select a plot
              </p>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => handleInputChange('paymentType', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="installment">Installment Plan</option>
                <option value="full_payment">Full Payment</option>
              </select>
            </div>

            {/* Payment Plan Selection */}
            {formData.paymentType === 'installment' && selectedPlot && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Plan *
                </label>
                <select
                  value={formData.paymentPlanId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const plan = paymentPlans.find(p => p.id === e.target.value);
                      if (plan) handlePaymentPlanSelect(plan);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.paymentPlanId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  required
                >
                  <option value="">Select a payment plan</option>
                  {paymentPlans
                    .filter(plan => plan.plotSizeMarla === selectedPlot.sizeMarla)
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.monthlyPayment)}/month
                      </option>
                    ))}
                </select>
                {errors.paymentPlanId && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentPlanId}</p>
                )}
              </div>
            )}

            {/* Discount Percentage */}
            {formData.paymentType === 'installment' && selectedPaymentPlan && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPercent || ''}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                {discountPercent > 0 && (
                  <p className="mt-1 text-sm text-green-600 font-medium">
                    Saving {formatCurrency(Math.round((formData.originalAmount || 0) * discountPercent / 100))} on total amount
                  </p>
                )}
              </div>
            )}

            {/* Discounted Plan Summary */}
            {formData.paymentType === 'installment' && selectedPaymentPlan && (
              <div className="lg:col-span-2">
                <div className={`p-4 rounded-lg border ${discountPercent > 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${discountPercent > 0 ? 'text-green-800' : 'text-blue-800'}`}>
                      {selectedPaymentPlan.name} — Plan Summary
                    </h3>
                    {discountPercent > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                        {discountPercent}% DISCOUNT
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Total Amount */}
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                      {discountPercent > 0 ? (
                        <>
                          <div className="text-xs text-gray-400 line-through">{formatCurrency(formData.originalAmount || 0)}</div>
                          <div className="text-sm font-bold text-green-700">{formatCurrency(formData.totalAmount)}</div>
                        </>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(formData.totalAmount)}</div>
                      )}
                    </div>
                    {/* Down Payment */}
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Down Payment</div>
                      {discountPercent > 0 ? (
                        <>
                          <div className="text-xs text-gray-400 line-through">
                            {formatCurrency(
                              selectedPaymentPlan.downPaymentAmount ||
                              Math.round(((formData.originalAmount || 0) * (selectedPaymentPlan.downPaymentPercentage || 0)) / 100)
                            )}
                          </div>
                          <div className="text-sm font-bold text-green-700">{formatCurrency(formData.downPayment)}</div>
                        </>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(formData.downPayment)}</div>
                      )}
                    </div>
                    {/* Monthly Payment */}
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Monthly Payment</div>
                      {discountPercent > 0 ? (
                        <>
                          <div className="text-xs text-gray-400 line-through">{formatCurrency(selectedPaymentPlan.monthlyPayment)}</div>
                          <div className="text-sm font-bold text-green-700">{formatCurrency(Math.round(selectedPaymentPlan.monthlyPayment * (1 - discountPercent / 100)))}</div>
                        </>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(selectedPaymentPlan.monthlyPayment)}</div>
                      )}
                    </div>
                    {/* Tenure */}
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Tenure</div>
                      <div className="text-sm font-bold text-gray-900">{selectedPaymentPlan.tenureMonths} months</div>
                    </div>
                    {/* Quarterly (if exists) */}
                    {selectedPaymentPlan.quarterlyPayment && selectedPaymentPlan.quarterlyPayment > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Quarterly</div>
                        {discountPercent > 0 ? (
                          <>
                            <div className="text-xs text-gray-400 line-through">{formatCurrency(selectedPaymentPlan.quarterlyPayment)}</div>
                            <div className="text-sm font-bold text-green-700">{formatCurrency(Math.round(selectedPaymentPlan.quarterlyPayment * (1 - discountPercent / 100)))}</div>
                          </>
                        ) : (
                          <div className="text-sm font-bold text-gray-900">{formatCurrency(selectedPaymentPlan.quarterlyPayment)}</div>
                        )}
                      </div>
                    )}
                    {/* Triannual (if exists) */}
                    {selectedPaymentPlan.triannualPayment && selectedPaymentPlan.triannualPayment > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Triannual (3x/yr)</div>
                        {discountPercent > 0 ? (
                          <>
                            <div className="text-xs text-gray-400 line-through">{formatCurrency(selectedPaymentPlan.triannualPayment)}</div>
                            <div className="text-sm font-bold text-green-700">{formatCurrency(Math.round(selectedPaymentPlan.triannualPayment * (1 - discountPercent / 100)))}</div>
                          </>
                        ) : (
                          <div className="text-sm font-bold text-gray-900">{formatCurrency(selectedPaymentPlan.triannualPayment)}</div>
                        )}
                      </div>
                    )}
                    {/* Bi-Yearly (if exists) */}
                    {selectedPaymentPlan.biYearlyPayment && selectedPaymentPlan.biYearlyPayment > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Bi-Yearly</div>
                        {discountPercent > 0 ? (
                          <>
                            <div className="text-xs text-gray-400 line-through">{formatCurrency(selectedPaymentPlan.biYearlyPayment)}</div>
                            <div className="text-sm font-bold text-green-700">{formatCurrency(Math.round(selectedPaymentPlan.biYearlyPayment * (1 - discountPercent / 100)))}</div>
                          </>
                        ) : (
                          <div className="text-sm font-bold text-gray-900">{formatCurrency(selectedPaymentPlan.biYearlyPayment)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Initial Payment for Installments */}
            {formData.paymentType === 'installment' && selectedPaymentPlan && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Payment towards Down Payment (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.downPayment}
                  value={formData.paidAmount || ''}
                  onChange={(e) => handleNumberInputChange('paidAmount', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.paidAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                />
                {errors.paidAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.paidAmount}</p>
                )}
                {formData.paidAmount > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(formData.paidAmount)} paid towards down payment
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Amount actually paid now towards the required down payment. Can be 0 to {formatCurrency(formData.downPayment)}.
                </p>
                {formData.downPayment > 0 && formData.paidAmount < formData.downPayment && (
                  <p className="mt-1 text-sm text-orange-600">
                    Remaining down payment: {formatCurrency(formData.downPayment - formData.paidAmount)}
                  </p>
                )}
                {formData.paidAmount >= formData.downPayment && formData.downPayment > 0 && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Down payment requirement fulfilled
                  </p>
                )}
              </div>
            )}

            {/* Installment Count */}
            {formData.paymentType === 'installment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installment Count (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.installmentCount || 24}
                  onChange={(e) => handleInputChange('installmentCount', parseInt(e.target.value) || 24)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.installmentCount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="24"
                />
                {errors.installmentCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.installmentCount}</p>
                )}
                {formData.installmentCount && formData.totalAmount > 0 && formData.downPayment > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Monthly installment: {formatCurrency((formData.totalAmount - formData.downPayment) / formData.installmentCount)}
                  </p>
                )}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as BookingFormData['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Booking Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Booking date is set to today</p>
            </div>
          </div>

          {/* Summary */}
          {selectedCustomer && selectedPlot && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Customer</h4>
                  <p className="text-sm text-gray-600">{selectedCustomer.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Plot</h4>
                  <p className="text-sm text-gray-600">{selectedPlot.plotNumber}</p>
                  <p className="text-sm text-gray-600">{selectedPlot.phase}, {selectedPlot.block}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Financial Details</h4>
                  <p className="text-sm text-gray-600">
                    Payment Type: {formData.paymentType === 'full_payment' ? 'Full Payment' : 'Installment Plan'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Down Payment: {formData.downPayment > 0 ? formatCurrency(formData.downPayment) : 'Not set'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Amount: {formData.totalAmount > 0 ? formatCurrency(formData.totalAmount) : 'Not set'}
                  </p>
                  {formData.paymentType === 'installment' && formData.installmentCount && formData.totalAmount > 0 && formData.downPayment > 0 && (
                    <>
                      <p className="text-sm text-gray-600">
                        Monthly Installment: {formatCurrency((formData.totalAmount - formData.downPayment) / formData.installmentCount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Installment Period: {formData.installmentCount} months
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
