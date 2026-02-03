'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'security', label: 'Security' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'construction', label: 'Construction' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'other', label: 'Other' },
];

export default function NewExpensePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    expenseName: '',
    category: 'administrative',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    vendorName: '',
    vendorContact: '',
    invoiceNumber: '',
  });

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.expenseName.trim()) {
      newErrors.expenseName = 'Expense name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
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

      const response = await fetch(`${apiUrl}/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate || undefined,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/finance/expenses');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Create New Expense</h1>
            <p className="text-gray-600">Add a new expense to the system</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.expenseName}
              onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.expenseName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Office Rent, Security Services"
            />
            {errors.expenseName && <p className="mt-1 text-sm text-red-600">{errors.expenseName}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* Expense Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.expenseDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expenseDate && <p className="mt-1 text-sm text-red-600">{errors.expenseDate}</p>}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name (Optional)
            </label>
            <input
              type="text"
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Vendor/Supplier name"
            />
          </div>

          {/* Vendor Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Contact (Optional)
            </label>
            <input
              type="text"
              value={formData.vendorContact}
              onChange={(e) => setFormData({ ...formData, vendorContact: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Phone or email"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number (Optional)
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Invoice/Receipt number"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional details about this expense"
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
            <span>{isSubmitting ? 'Creating...' : 'Create Expense'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

