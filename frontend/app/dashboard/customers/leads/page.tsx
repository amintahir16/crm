'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Upload,
  ChevronDown,
  Flag,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CSVUpload from '@/components/CSVUpload';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface LeadStatus {
  id: string;
  name: string;
  displayName: string;
  color: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

interface Lead {
  id: string;
  leadId?: string; // Unique identifier from CSV or auto-generated
  fullName: string;
  email: string;
  phone: string;
  source: string;
  sourceDetails: string;
  status: string;
  statusId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  initialNotes: string;
  interests: string;
  budgetRange: number;
  preferredContactMethod: string;
  preferredContactTime: string;
  dueDate?: string;
  assignedToUser: {
    id: string;
    fullName: string;
  };
  generatedByUser: {
    id: string;
    fullName: string;
  };
  lastContactedAt: string;
  nextFollowUpAt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  notInterestedLeads: number;
  interestedLeads: number;
  willVisitLeads: number;
  futureLeads: number;
  closeWonLeads: number;
  inProcessLeads: number;
  conversionRate: number;
}

// Status colors will be fetched from database, but we keep a fallback
const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  not_interested: 'bg-red-100 text-red-800',
  interested: 'bg-green-100 text-green-800',
  will_visit: 'bg-yellow-100 text-yellow-800',
  future: 'bg-purple-100 text-purple-800',
  close_won: 'bg-emerald-100 text-emerald-800',
  in_process: 'bg-cyan-100 text-cyan-800',
  // Legacy statuses (for backward compatibility)
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  follow_up: 'bg-orange-100 text-orange-800',
  converted: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const sourceIcons = {
  whatsapp: MessageSquare,
  facebook_ads: Target,
  instagram_ads: Target,
  google_ads: Target,
  referral: Users,
  website: BarChart3,
  walk_in: User,
  phone_call: Phone,
  other: AlertCircle,
};

interface AgentDropdownProps {
  lead: Lead;
  salesAgents: User[];
  onReassign: (leadId: string, newAgentId: string) => void;
}

function AgentDropdown({ lead, salesAgents, onReassign }: AgentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = salesAgents.filter(agent =>
    agent.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAgentSelect = (agent: User) => {
    if (agent.id !== lead.assignedToUser?.id) {
      onReassign(lead.id, agent.id);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.agent-dropdown-container')) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative agent-dropdown-container">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-900">
          {lead.assignedToUser ? lead.assignedToUser.fullName : 'Unassigned'}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <div
              className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleAgentSelect({ id: '', fullName: 'Unassigned', email: '', role: '' })}
            >
              Unassigned
            </div>
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleAgentSelect(agent)}
              >
                <User className="w-3 h-3 text-gray-400 mr-2" />
                <span className={lead.assignedToUser?.id === agent.id ? 'font-medium text-blue-600' : ''}>
                  {agent.fullName}
                </span>
                {lead.assignedToUser?.id === agent.id && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// PriorityDropdown Component
interface PriorityDropdownProps {
  lead: Lead;
  onUpdatePriority: (leadId: string, newPriority: string) => void;
}

// StatusDropdown Component
interface StatusDropdownProps {
  lead: Lead;
  leadStatuses: LeadStatus[];
  onUpdateStatus: (leadId: string, statusId: string) => void;
}

function StatusDropdown({ lead, leadStatuses, onUpdateStatus }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentStatus = leadStatuses.find(s => s.id === lead.statusId) || 
    leadStatuses.find(s => s.name === lead.status) ||
    leadStatuses[0];

  const handleStatusSelect = (statusId: string) => {
    if (statusId !== lead.statusId) {
      onUpdateStatus(lead.id, statusId);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If no statuses loaded yet, show loading state
  if (leadStatuses.length === 0) {
    return (
      <span className="text-sm text-gray-500">Loading...</span>
    );
  }

  // If no current status found, show the lead's status as fallback
  if (!currentStatus) {
    return (
      <div className="relative status-dropdown-container">
        <div
          className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div 
            className="w-3 h-3 rounded-full mr-2 bg-gray-400"
          ></div>
          <span className="text-sm text-gray-900 capitalize">
            {lead.status?.replace('_', ' ') || 'Unknown'}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
        </div>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {leadStatuses.map((status) => (
                <div
                  key={status.id}
                  className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => handleStatusSelect(status.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <span className={lead.statusId === status.id ? 'font-medium text-blue-600' : ''}>
                    {status.displayName}
                  </span>
                  {lead.statusId === status.id && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative status-dropdown-container">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: currentStatus.color || '#6B7280' }}
        ></div>
        <span className="text-sm text-gray-900">
          {currentStatus.displayName}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="max-h-48 overflow-y-auto">
            {leadStatuses.map((status) => (
              <div
                key={status.id}
                className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleStatusSelect(status.id)}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className={lead.statusId === status.id ? 'font-medium text-blue-600' : ''}>
                  {status.displayName}
                </span>
                {lead.statusId === status.id && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityDropdown({ lead, onUpdatePriority }: PriorityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const currentPriority = priorities.find(p => p.value === lead.priority) || priorities[1];

  const handlePrioritySelect = (priority: string) => {
    if (priority !== lead.priority) {
      onUpdatePriority(lead.id, priority);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.priority-dropdown-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative priority-dropdown-container">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Flag className="w-4 h-4 text-gray-400 mr-2" />
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${currentPriority.color}`}>
          {currentPriority.label}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="max-h-32 overflow-y-auto">
            {priorities.map((priority) => (
              <div
                key={priority.value}
                className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handlePrioritySelect(priority.value)}
              >
                <Flag className="w-3 h-3 text-gray-400 mr-2" />
                <span className={lead.priority === priority.value ? 'font-medium text-blue-600' : ''}>
                  {priority.label}
                </span>
                {lead.priority === priority.value && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [salesAgents, setSalesAgents] = useState<User[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);

  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      userId: user?.id,
      currentPage,
      searchTerm,
      statusFilter,
      sourceFilter,
      priorityFilter,
      agentFilter
    });
    
    if (isAuthenticated && !isLoading) {
      console.log('✅ Conditions met, fetching data...');
      fetchLeads();
      fetchStats();
      fetchLeadStatuses(); // Fetch statuses for all users
      
      // Fetch sales agents for managers
      if (user?.role === 'admin' || user?.role === 'sales_manager') {
        fetchSalesAgents();
      }
      
      // Check if import=csv query parameter is present
      const importParam = searchParams.get('import');
      if (importParam === 'csv' && (user?.role === 'admin' || user?.role === 'sales_manager')) {
        setShowCSVUpload(true);
      }
    } else {
      console.log('❌ Conditions not met:', {
        isAuthenticated,
        isLoading,
        reason: !isAuthenticated ? 'not authenticated' : 'still loading'
      });
    }
  }, [isAuthenticated, isLoading, currentPage, searchTerm, statusFilter, sourceFilter, priorityFilter, agentFilter, searchParams, user]);

  // Refresh data when page becomes visible (e.g., returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && !isLoading) {
        fetchLeads();
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, isLoading]);

  const fetchLeads = async () => {
    try {
      setIsLoadingLeads(true);
      const token = localStorage.getItem('access_token');
      
      // Debug token
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔑 Token info:', {
            userId: payload.userId,
            role: payload.role,
            email: payload.email,
            exp: new Date(payload.exp * 1000),
            expired: payload.exp < Date.now() / 1000
          });
        } catch (e) {
          console.log('🔑 Token decode error:', e);
        }
      } else {
        console.log('🔑 No token found');
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (agentFilter) params.append('assignedToUserId', agentFilter);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const url = `${apiUrl}/leads?${params}`;
      
      console.log('🔍 Fetching leads:', {
        url,
        userRole: user?.role,
        userId: user?.id,
        token: token ? 'present' : 'missing'
      });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Leads API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Leads Data:', {
          leadsCount: data.data?.length || 0,
          totalPages: data.pagination?.pages || 0,
          pagination: data.pagination,
          rawData: data
        });
        
        if (data.data && data.data.length > 0) {
          console.log('✅ Leads found:', data.data.slice(0, 3).map((lead: any) => ({
            id: lead.id,
            name: lead.fullName,
            email: lead.email,
            status: lead.status
          })));
        } else {
          console.log('❌ No leads in data.data:', data);
        }
        
        console.log('📝 Setting leads state:', {
          leadsCount: data.data?.length || 0,
          totalPages: data.pagination?.pages || 0,
          firstLead: data.data?.[0] ? {
            id: data.data[0].id,
            name: data.data[0].fullName,
            email: data.data[0].email
          } : null
        });
        
        setLeads(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to fetch leads:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          console.log('🔐 Authentication error - redirecting to login');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/auth/login');
          return;
        }
      }
    } catch (error) {
      console.error('💥 Error fetching leads:', error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSalesAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/users?role=sales_person`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSalesAgents(data || []);
      }
    } catch (error) {
      console.error('Error fetching sales agents:', error);
    }
  };

  const fetchLeadStatuses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/statuses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched lead statuses:', data);
        setLeadStatuses(data || []);
      } else {
        console.error('❌ Failed to fetch lead statuses:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching lead statuses:', error);
    }
  };

  const updateLeadStatus = async (leadId: string, statusId: string) => {
    try {
      // Validate inputs
      if (!leadId || !statusId) {
        console.error('❌ Missing leadId or statusId:', { leadId, statusId });
        alert('Missing required information to update status');
        return;
      }

      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(leadId)) {
        console.error('❌ Invalid leadId format:', leadId);
        alert('Invalid lead ID format');
        return;
      }
      if (!uuidRegex.test(statusId)) {
        console.error('❌ Invalid statusId format:', statusId);
        alert('Invalid status ID format');
        return;
      }

      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      console.log('🔄 Updating lead status:', { leadId, statusId });
      
      const response = await fetch(`${apiUrl}/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusId,
        }),
      });

      if (response.ok) {
        console.log('✅ Lead status updated successfully');
        // Refresh the leads list
        fetchLeads();
        fetchStats();
      } else {
        const error = await response.json();
        console.error('❌ Failed to update lead status:', error);
        alert(error.message || 'Failed to update lead status');
      }
    } catch (error) {
      console.error('❌ Error updating lead status:', error);
      alert('Error updating lead status');
    }
  };

  const reassignLead = async (leadId: string, newAgentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToUserId: newAgentId,
        }),
      });

      if (response.ok) {
        // Refresh the leads list
        fetchLeads();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reassign lead');
      }
    } catch (error) {
      console.error('Error reassigning lead:', error);
      alert('Error reassigning lead');
    }
  };

  // updateLeadPriority function
  const updateLeadPriority = async (leadId: string, newPriority: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priority: newPriority,
        }),
      });

      if (response.ok) {
        // Refresh the leads list
        fetchLeads();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update lead priority');
      }
    } catch (error) {
      console.error('Error updating lead priority:', error);
      alert('Error updating lead priority');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchLeads();
        fetchStats();
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      case 'interested': return <TrendingUp className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      case 'lost': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="space-y-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Manage your sales leads and track conversions</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'admin' || user?.role === 'sales_manager') && (
            <button
              onClick={() => setShowCSVUpload(!showCSVUpload)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard/customers/leads/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* CSV Upload Section */}
      {showCSVUpload && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CSVUpload 
            onUploadComplete={(result) => {
              console.log('CSV upload completed:', result);
              // Refresh leads list after successful import
              if (result.success) {
                fetchLeads();
                fetchStats();
                setShowCSVUpload(false);
              }
            }}
          />
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 w-full" style={{ maxWidth: '100%' }}>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Leads</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newLeads}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Interested</p>
                <p className="text-2xl font-bold text-red-600">{stats.notInterestedLeads}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interested</p>
                <p className="text-2xl font-bold text-green-600">{stats.interestedLeads}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Will Visit</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.willVisitLeads}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Future</p>
                <p className="text-2xl font-bold text-purple-600">{stats.futureLeads}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Close Won</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.closeWonLeads}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Process</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.inProcessLeads}</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border w-full" style={{ maxWidth: '100%' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full" style={{ maxWidth: '100%' }}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {leadStatuses.map((status) => (
              <option key={status.id} value={status.name}>
                {status.displayName}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sources</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook_ads">Facebook Ads</option>
            <option value="instagram_ads">Instagram Ads</option>
            <option value="google_ads">Google Ads</option>
            <option value="referral">Referral</option>
            <option value="website">Website</option>
            <option value="walk_in">Walk-in</option>
            <option value="phone_call">Phone Call</option>
            <option value="other">Other</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {(user?.role === 'admin' || user?.role === 'sales_manager') && (
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Agents</option>
              {salesAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {isLoadingLeads ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center p-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leads found</p>
            <div className="mt-4 text-xs text-gray-300">
              Debug: leads.length = {leads.length}, isLoadingLeads = {isLoadingLeads.toString()}
            </div>
          </div>
        ) : (
          <div 
            className="overflow-x-auto" 
            style={{ 
              width: '100%', 
              maxWidth: '100%',
              overflowX: 'auto',
              overflowY: 'visible',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <table className="w-full" style={{ minWidth: '850px', tableLayout: 'auto' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Info
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => {
                  const SourceIcon = sourceIcons[lead.source as keyof typeof sourceIcons] || AlertCircle;
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="text-sm font-medium text-gray-900">{lead.fullName}</div>
                            {lead.leadId && (
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                                {lead.leadId}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                          </div>
                          {lead.dueDate && (
                            <div className={`text-xs mt-1 ${
                              new Date(lead.dueDate) < new Date() 
                                ? 'text-red-600 font-medium' 
                                : new Date(lead.dueDate).toDateString() === new Date().toDateString()
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              Due: {new Date(lead.dueDate).toLocaleDateString()}
                              {new Date(lead.dueDate) < new Date() && ' (Overdue)'}
                              {new Date(lead.dueDate).toDateString() === new Date().toDateString() && ' (Today)'}
                            </div>
                          )}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {lead.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {tag}
                                </span>
                              ))}
                              {lead.tags.length > 2 && (
                                <span className="text-xs text-gray-500">+{lead.tags.length - 2} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="space-y-1">
                          {lead.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 mr-1.5" />
                              {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3 h-3 mr-1.5" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <SourceIcon className="w-4 h-4 text-gray-400 mr-1.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {lead.source.replace('_', ' ')}
                            </div>
                            {lead.sourceDetails && (() => {
                              try {
                                const sourceData = JSON.parse(lead.sourceDetails);
                                return (
                                  <div className="text-xs text-gray-500">
                                    {sourceData.campaignId || sourceData.campaignName || 'Campaign'}
                                  </div>
                                );
                              } catch (e) {
                                return (
                                  <div className="text-xs text-gray-500">{lead.sourceDetails}</div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {leadStatuses.length > 0 ? (
                          <StatusDropdown
                            lead={lead}
                            leadStatuses={leadStatuses}
                            onUpdateStatus={updateLeadStatus}
                          />
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                            {getStatusIcon(lead.status)}
                            <span className="ml-1">{lead.status.replace('_', ' ')}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <PriorityDropdown
                          lead={lead}
                          onUpdatePriority={updateLeadPriority}
                        />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {(user?.role === 'admin' || user?.role === 'sales_manager') ? (
                          <AgentDropdown
                            lead={lead}
                            salesAgents={salesAgents}
                            onReassign={reassignLead}
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {lead.assignedToUser ? lead.assignedToUser.fullName : 'Unassigned'}
                          </div>
                        )}
                        {lead.generatedByUser && (
                          <div className="text-xs text-gray-500">
                            Generated by {lead.generatedByUser.fullName}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.lastContactedAt ? formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true }) : 'Never'}
                        </div>
                        {lead.nextFollowUpAt && (
                          <div className="text-xs text-gray-500">
                            Next: {formatDistanceToNow(new Date(lead.nextFollowUpAt), { addSuffix: true })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => router.push(`/dashboard/customers/leads/view/${lead.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Lead"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/customers/leads/edit/${lead.id}`)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Lead"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {(user?.role === 'admin' || user?.role === 'sales_manager') && (
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
