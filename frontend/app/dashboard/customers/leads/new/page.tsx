'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  role: string;
}

export default function NewLeadPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salesAgents, setSalesAgents] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    source: 'whatsapp',
    sourceDetails: '',
    priority: 'medium',
    initialNotes: '',
    interests: '',
    budgetRange: '',
    preferredContactMethod: 'phone',
    preferredContactTime: 'morning',
    assignedToUserId: '',
    dueDate: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchSalesAgents();
    }
  }, [isAuthenticated, isLoading]);

  const fetchSalesAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/users?role=sales_agent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSalesAgents(data.data || []);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const payload = {
        ...formData,
        budgetRange: formData.budgetRange ? parseFloat(formData.budgetRange) : null,
        generatedByUserId: user?.id,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : null,
      };

      const response = await fetch(`${apiUrl}/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/dashboard/customers/leads');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error creating lead');
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
          <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-gray-600">Create a new lead record to track potential customers</p>
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

              {/* Only show assignment field for managers and admins */}
              {(user?.role === 'admin' || user?.role === 'sales_manager') && (
                <div>
                  <label htmlFor="assignedToUserId" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Sales Agent
                  </label>
                  <select
                    id="assignedToUserId"
                    name="assignedToUserId"
                    value={formData.assignedToUserId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select sales agent</option>
                    {salesAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName}
                      </option>
                    ))}
                  </select>
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Create Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
