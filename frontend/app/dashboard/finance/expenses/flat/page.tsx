'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Home,
  TrendingUp,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface Expense {
  id: string;
  expenseName: string;
  category: string;
  amount: number;
  expenseDate: string;
  description?: string;
}

export default function FlatExpensesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'flat' | 'rent'>('flat');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendData, setTrendData] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    expenseName: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsPageLoading(true);
    await Promise.all([fetchExpenses(), fetchTrend()]);
    setIsPageLoading(false);
  };

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const res = await fetch(`${apiUrl}/expenses?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter for both flat and rent
        const filtered = data.expenses.filter((e: any) => 
          e.category === 'flat' || e.category === 'flat_rent'
        );
        setExpenses(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrend = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const res = await fetch(`${apiUrl}/expenses/trend/flat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrendData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
          category: modalType === 'flat' ? 'flat' : 'flat_rent',
          expenseName: modalType === 'rent' ? `Flat Rent - ${new Date(formData.expenseDate).toLocaleString('default', { month: 'long', year: 'numeric' })}` : formData.expenseName
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ expenseName: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiUrl}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.expenseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentYear = new Date().getFullYear();
  const totalFlat = expenses
    .filter(e => e.category === 'flat' && new Date(e.expenseDate).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalRent = expenses
    .filter(e => e.category === 'flat_rent' && new Date(e.expenseDate).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <button 
              onClick={() => router.push('/dashboard/finance')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Finance
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Home className="mr-3 h-6 w-6 text-orange-600" />
              Flat Expenses & Rent
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setModalType('flat'); setShowModal(true); }}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm transition-all font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </button>
            <button
              onClick={() => { setModalType('rent'); setShowModal(true); }}
              className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all font-medium"
            >
              <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
              Record Rent
            </button>
          </div>
        </div>

        {/* Stats & Trend Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Flat Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(totalFlat)}</p>
              <div className="mt-4 flex items-center text-xs text-orange-600 font-semibold uppercase tracking-wider">
                <TrendingUp className="h-3 w-3 mr-1" />
                This Year
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Rent Paid</p>
              <p className="text-2xl font-bold text-indigo-600">{formatPKR(totalRent)}</p>
              <div className="mt-4 flex items-center text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                <Calendar className="h-3 w-3 mr-1" />
                Annual Tracking
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
              Monthly Spending Trend
            </h3>
            <div className="h-44 w-full flex items-end justify-between gap-1 px-1">
              {trendData.length > 0 ? (() => {
                const max = Math.max(...trendData.map(t => (Number(t.amount) || 0)), 1);
                return trendData.map((d, i) => {
                  const amount = Number(d.amount) || 0;
                  const height = amount > 0 ? Math.max((amount / max) * 100, 15) : 0;
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      <div 
                        className="w-full bg-orange-100 group-hover:bg-orange-600 transition-all rounded-t-lg relative"
                        style={{ height: `${height}%`, minHeight: '6px' }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatPKR(amount)}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 font-medium uppercase">{d.month}</span>
                    </div>
                  );
                });
              })() : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 italic">
                  No trend data available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* List Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Expense Logs</h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExpenses.length > 0 ? filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-5 text-sm text-gray-500">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-gray-900">{e.expenseName}</p>
                      {e.description && <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        e.category === 'flat_rent' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {e.category === 'flat_rent' ? 'Rent' : 'Daily'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatPKR(e.amount)}</td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => handleDelete(e.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {modalType === 'flat' ? 'Add Flat Expense' : 'Record Flat Rent'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalType === 'flat' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expense Title</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Paint, Cleaning Services"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    value={formData.expenseName}
                    onChange={(e) => setFormData({...formData, expenseName: e.target.value})}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (PKR)</label>
                  <input 
                    required
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
