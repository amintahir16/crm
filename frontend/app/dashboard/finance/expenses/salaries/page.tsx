'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Shield,
  Briefcase,
  UserCheck
} from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  department?: string;
}

export default function SalariesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/dashboard/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
    }
  }, [isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      setIsPageLoading(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const res = await fetch(`${apiUrl}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out non-employee roles if necessary, but user wants everyone (Admin, Manager, Sales)
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPageLoading(false);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || e.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
      case 'sales_manager': return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'sales_person': return <Users className="h-4 w-4 text-green-500" />;
      default: return <UserCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/dashboard/finance')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Finance
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Salaries</h1>
              <p className="text-gray-600">Manage and record monthly payroll for all staff members.</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm font-medium text-gray-600 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="sales_manager">Managers</option>
              <option value="sales_person">Sales Persons</option>
            </select>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.length > 0 ? filteredEmployees.map((e) => (
            <div 
              key={e.id}
              onClick={() => router.push(`/dashboard/finance/expenses/salaries/${e.id}`)}
              className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-5 w-5 text-primary-400" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-gray-50 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300">
                  <span className="text-xl font-bold text-primary-600">
                    {e.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{e.fullName}</h3>
                <p className="text-xs text-gray-400 font-medium mb-4">{e.email}</p>
                
                <div className="flex items-center gap-2 mt-auto">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
                    {getRoleIcon(e.role)}
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {e.role.replace('_', ' ')}
                    </span>
                  </div>
                  {!e.isActive && (
                    <span className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-bold italic">No employees found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
