'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  Plus,
  TrendingUp,
  Calendar,
  FileText,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  User
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface SalaryRecord {
  id: string;
  expenseName: string;
  amount: number;
  baseAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  expenseDate: string;
  description?: string;
  status: string;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function IndividualSalaryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    baseAmount: '',
    bonusAmount: '0',
    deductionAmount: '0',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchData();
    }
  }, [isAuthenticated, id]);

  const fetchData = async () => {
    setIsPageLoading(true);
    await Promise.all([fetchEmployee(), fetchSalaries()]);
    setIsPageLoading(false);
  };

  const fetchEmployee = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEmployee(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSalaries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      // Fetch all salaries for this targetUserId
      const res = await fetch(`${apiUrl}/expenses?category=salary&targetUserId=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalaries(data.expenses || []);
        
        // Mock trend for now or implement grouping logic
        const trend = (data.expenses || []).slice(0, 6).map((s: any) => ({
          month: new Date(s.expenseDate).toLocaleString('default', { month: 'short' }),
          amount: Number(s.amount) || 0
        })).reverse();
        setTrendData(trend);
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const base = parseFloat(formData.baseAmount);
      const bonus = parseFloat(formData.bonusAmount);
      const deduction = parseFloat(formData.deductionAmount);
      const net = base + bonus - deduction;

      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenseName: `Salary - ${employee?.fullName} - ${new Date(formData.expenseDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          amount: net,
          baseAmount: base,
          bonusAmount: bonus,
          deductionAmount: deduction,
          category: 'salary',
          targetUserId: id,
          expenseDate: formData.expenseDate,
          description: formData.description
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ baseAmount: '', bonusAmount: '0', deductionAmount: '0', expenseDate: new Date().toISOString().split('T')[0], description: '' });
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (sid: string) => {
    if (!confirm('Delete this salary record?')) return;
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiUrl}/expenses/${sid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const netAmount = (parseFloat(formData.baseAmount) || 0) + (parseFloat(formData.bonusAmount) || 0) - (parseFloat(formData.deductionAmount) || 0);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard/finance/expenses/salaries')}
              className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{employee?.role.replace('_', ' ')}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">Payroll Records</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{employee?.fullName}</h1>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Monthly Salary
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Stats Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm font-medium text-gray-500 mb-1">Lifetime Paid</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(salaries.reduce((acc, s) => acc + (Number(s.amount) || 0), 0))}</p>
            </div>
            
            <div className="bg-blue-600 p-6 rounded-lg shadow-md relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
              <p className="text-sm font-medium text-white/80 mb-1 text-white">Last Payment</p>
              <p className="text-2xl font-bold text-white">{salaries.length > 0 ? formatPKR(salaries[0].amount) : '---'}</p>
              <p className="text-xs text-white/60 mt-2">Recorded on {salaries.length > 0 ? new Date(salaries[0].expenseDate).toLocaleDateString() : 'no transactions'}</p>
            </div>
          </div>

          {/* Trend Visualizer */}
          <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                Net Salary Pulse
              </h3>
            </div>
            
            <div className="h-44 w-full flex items-end justify-between gap-6 px-4">
              {trendData.length > 0 ? (() => {
                const max = Math.max(...trendData.map(t => (Number(t.amount) || 0)), 1);
                return trendData.map((d, i) => {
                  const amount = Number(d.amount) || 0;
                  const height = amount > 0 ? Math.max((amount / max) * 100, 15) : 0;
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      <div 
                        className={`w-full bg-primary-100 group-hover:bg-primary-600 transition-all rounded-t-lg relative cursor-help ${i === trendData.length-1 ? 'bg-primary-200' : ''}`}
                        style={{ height: `${height}%`, minHeight: '6px' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-10 font-black shadow-xl">
                          {formatPKR(amount)}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-4 font-black uppercase tracking-tighter">{d.month}</span>
                    </div>
                  );
                });
              })() : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2 border-2 border-dashed border-gray-50 rounded-[2rem]">
                  <Layers className="h-10 w-10 opacity-20" />
                  <p className="text-sm italic font-medium">Tracking window empty...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payroll History Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <div className="text-sm text-gray-500">
               Total Entries: {salaries.length}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {salaries.length > 0 ? salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/10 transition-colors group">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-primary-600 text-xs">
                          {new Date(s.expenseDate).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{new Date(s.expenseDate).toLocaleString('default', { month: 'long' })}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{new Date(s.expenseDate).getFullYear()}</p>
                        </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-sm font-medium text-gray-500 line-clamp-2 max-w-xs">{s.description || 'Monthly regular payroll cycle'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-tight whitespace-nowrap">
                        <span className="text-gray-700">{formatPKR(s.baseAmount)}</span>
                        <span className="text-gray-200">/</span>
                        <span className="text-green-600">+{formatPKR(s.bonusAmount)}</span>
                        <span className="text-gray-200">/</span>
                        <span className="text-red-500">-{formatPKR(s.deductionAmount)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-base font-black text-primary-600">{formatPKR(s.amount)}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-4 text-gray-300 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-red-50 transition-all scale-90 group-hover:scale-100"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                       <div className="max-w-xs mx-auto opacity-30">
                        <User className="h-20 w-20 mx-auto mb-6 text-primary-600" />
                        <p className="text-sm font-black italic uppercase text-gray-400 tracking-widest">No payroll history captured for this employee yet.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salary Recording Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Record Payroll</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Base Salary
                      </label>
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        value={formData.baseAmount}
                        onChange={(e) => setFormData({...formData, baseAmount: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-green-500 uppercase tracking-widest mb-4">Bonus (+)</label>
                        <input 
                          type="number"
                          className="w-full px-6 py-4 bg-green-50/30 border-none rounded-2xl focus:ring-4 focus:ring-green-500/10 text-sm font-black text-green-700"
                          value={formData.bonusAmount}
                          onChange={(e) => setFormData({...formData, bonusAmount: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-red-400 uppercase tracking-widest mb-4">Deduction (-)</label>
                        <input 
                          type="number"
                          className="w-full px-6 py-4 bg-red-50/30 border-none rounded-2xl focus:ring-4 focus:ring-red-500/10 text-sm font-black text-red-700"
                          value={formData.deductionAmount}
                          onChange={(e) => setFormData({...formData, deductionAmount: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Payment Reference Date</label>
                      <input 
                        required
                        type="date"
                        className="w-full px-8 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 text-sm font-bold"
                        value={formData.expenseDate}
                        onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-8 flex flex-col">
                    <div className="flex-1">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Remarks / Breakdown Details</label>
                      <textarea 
                        rows={6}
                        placeholder="Detail bonus or deduction reasons..."
                        className="w-full h-full px-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-primary-500/10 text-sm resize-none transition-all"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-gray-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Net Disbursement</span>
                        <ArrowUpRight className="h-4 w-4 text-primary-400" />
                      </div>
                      <p className="text-4xl font-black">{formatPKR(netAmount)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Net Disbursement</span>
                        <span className="text-lg font-bold text-blue-600">{formatPKR(netAmount)}</span>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="mt-6">
                  <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
                >
                  Authorize and Issue Payment
                </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
