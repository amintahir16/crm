'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MessageSquare,
  Target,
  AlertCircle,
  DollarSign,
  Clock,
  Tag,
  Search,
  ChevronDown,
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role?: string; // Make role optional since it might not always be included
}

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  sourceDetails: string;
  status: string;
  priority: string;
  initialNotes: string;
  interests: string;
  budgetRange: number;
  preferredContactMethod: string;
  preferredContactTime: string;
  assignedToUserId: string;
  assignedToUser?: {
    id: string;
    fullName: string;
    email: string;
  };
  nextFollowUpAt: string;
  dueDate?: string;
  tags: string[];
}

export default function EditLeadPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [salesAgents, setSalesAgents] = useState<User[]>([]);
  const [currentAssignedAgent, setCurrentAssignedAgent] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    source: 'whatsapp',
    sourceDetails: '',
    status: 'new',
    priority: 'medium',
    initialNotes: '',
    interests: '',
    budgetRange: '',
    preferredContactMethod: 'phone',
    preferredContactTime: 'morning',
    assignedToUserId: '',
    nextFollowUpAt: '',
    dueDate: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isAuthenticated && !isLoading && leadId) {
      fetchLead();
      fetchSalesAgents();
    }
  }, [isAuthenticated, isLoading, leadId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const fetchLead = async () => {
    try {
      setIsLoadingLead(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const lead: Lead = await response.json();
        setFormData({
          fullName: lead.fullName,
          email: lead.email || '',
          phone: lead.phone || '',
          source: lead.source,
          sourceDetails: lead.sourceDetails || '',
          status: lead.status,
          priority: lead.priority,
          initialNotes: lead.initialNotes || '',
          interests: lead.interests || '',
          budgetRange: lead.budgetRange ? lead.budgetRange.toString() : '',
          preferredContactMethod: lead.preferredContactMethod || 'phone',
          preferredContactTime: lead.preferredContactTime || 'morning',
          assignedToUserId: lead.assignedToUserId || '',
          nextFollowUpAt: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : '',
          dueDate: lead.dueDate ? new Date(lead.dueDate).toISOString().slice(0, 10) : '',
          tags: lead.tags || [],
        });
        
        // Set current assigned agent
        if (lead.assignedToUser) {
          setCurrentAssignedAgent(lead.assignedToUser);
        }
      } else {
        console.error('Failed to fetch lead');
        router.push('/dashboard/customers/leads');
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setIsLoadingLead(false);
    }
  };

  const fetchSalesAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/users?role=sales_person`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      alert('Full name is required');
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      alert('Either email or phone number is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ...formData,
        budgetRange: formData.budgetRange ? parseFloat(formData.budgetRange) : null,
        nextFollowUpAt: formData.nextFollowUpAt ? new Date(formData.nextFollowUpAt).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : null,
      };


      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push(`/dashboard/customers/leads/view/${leadId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleAgentSelect = (agent: User) => {
    setFormData(prev => ({
      ...prev,
      assignedToUserId: agent.id,
    }));
    setCurrentAssignedAgent(agent);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const filteredAgents = salesAgents.filter(agent =>
    agent.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSalesManager = user?.role === 'admin' || user?.role === 'sales_manager';

  if (isLoading || isLoadingLead) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
          <p className="text-gray-600">Update lead information and status</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range (PKR)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    id="budgetRange"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter budget range"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Lead Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source *
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
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
              </div>

              <div>
                <label htmlFor="sourceDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  Source Details
                </label>
                <input
                  type="text"
                  id="sourceDetails"
                  name="sourceDetails"
                  value={formData.sourceDetails}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Campaign name, referrer name"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label htmlFor="assignedToUserId" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Sales Agent
                </label>
                {isSalesManager ? (
                  <div className="relative dropdown-container">
                    <div
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center justify-between"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className={currentAssignedAgent ? 'text-gray-900' : 'text-gray-500'}>
                        {currentAssignedAgent ? currentAssignedAgent.fullName : 'Select sales agent'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search agents..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredAgents.length > 0 ? (
                            filteredAgents.map((agent) => (
                              <div
                                key={agent.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                onClick={() => handleAgentSelect(agent)}
                              >
                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{agent.fullName}</div>
                                  <div className="text-xs text-gray-500">{agent.email}</div>
                                </div>
                                {currentAssignedAgent?.id === agent.id && (
                                  <div className="ml-auto">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No agents found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {currentAssignedAgent ? currentAssignedAgent.fullName : 'No agent assigned'}
                  </div>
                )}
                
                {/* Hidden input to ensure assignedToUserId is included in form submission */}
                <input
                  type="hidden"
                  name="assignedToUserId"
                  value={formData.assignedToUserId}
                />
              </div>

              <div>
                <label htmlFor="nextFollowUpAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Follow Up
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="datetime-local"
                    id="nextFollowUpAt"
                    name="nextFollowUpAt"
                    value={formData.nextFollowUpAt}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              {/* Only show due date field for managers and admins */}
              {isSalesManager && (
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Set a follow-up due date (not editable by sales person)</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Contact Preferences
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Method
                </label>
                <select
                  id="preferredContactMethod"
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div>
                <label htmlFor="preferredContactTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Time
                </label>
                <select
                  id="preferredContactTime"
                  name="preferredContactTime"
                  value={formData.preferredContactTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="morning">Morning (9 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 8 PM)</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Additional Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                  Interests
                </label>
                <textarea
                  id="interests"
                  name="interests"
                  value={formData.interests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What are they interested in? (plot size, location, etc.)"
                />
              </div>

              <div>
                <label htmlFor="initialNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Notes
                </label>
                <textarea
                  id="initialNotes"
                  name="initialNotes"
                  value={formData.initialNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any initial notes about this lead..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a tag..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
