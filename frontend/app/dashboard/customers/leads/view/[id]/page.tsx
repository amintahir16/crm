'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Tag,
  Plus,
  Send,
  FileText,
  Users,
} from 'lucide-react';
import ActivityTimeline from '@/components/leads/ActivityTimeline';

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
  assignedToUser: {
    id: string;
    fullName: string;
  };
  generatedByUser: {
    id: string;
    fullName: string;
  };
  convertedToCustomer: {
    id: string;
    fullName: string;
  };
  convertedByUser: {
    id: string;
    fullName: string;
  };
  lastContactedAt: string;
  nextFollowUpAt: string;
  convertedAt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Communication {
  id: string;
  type: string;
  direction: string;
  outcome: string;
  subject: string;
  description: string;
  duration: number;
  completedAt: string;
  nextFollowUpAt: string;
  isImportant: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
  };
}

interface Note {
  id: string;
  type: string;
  title: string;
  content: string;
  isImportant: boolean;
  isPrivate: boolean;
  tags: string[];
  reminderAt: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
  };
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  interested: 'bg-purple-100 text-purple-800',
  not_interested: 'bg-red-100 text-red-800',
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

export default function ViewLeadPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  // Communication form state
  const [communicationForm, setCommunicationForm] = useState({
    type: 'phone_call',
    direction: 'outbound',
    outcome: 'successful',
    subject: '',
    description: '',
    duration: '',
    completedAt: new Date().toISOString().slice(0, 16),
    nextFollowUpAt: '',
    isImportant: false,
  });

  // Note form state
  const [noteForm, setNoteForm] = useState({
    type: 'general',
    title: '',
    content: '',
    isImportant: false,
    isPrivate: false,
    reminderAt: '',
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && leadId) {
      fetchLead();
      fetchCommunications();
      fetchNotes();
    }
  }, [isAuthenticated, isLoading, leadId]);

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
        const data = await response.json();
        setLead(data);
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

  const fetchCommunications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}/communications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/leads/${leadId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const payload = {
        ...communicationForm,
        duration: communicationForm.duration ? parseInt(communicationForm.duration) : null,
        completedAt: communicationForm.completedAt ? new Date(communicationForm.completedAt).toISOString() : null,
        nextFollowUpAt: communicationForm.nextFollowUpAt ? new Date(communicationForm.nextFollowUpAt).toISOString() : null,
      };

      const response = await fetch(`${apiUrl}/leads/${leadId}/communications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchCommunications();
        fetchLead(); // Refresh lead to update last contacted
        setShowAddCommunication(false);
        setCommunicationForm({
          type: 'phone_call',
          direction: 'outbound',
          outcome: 'successful',
          subject: '',
          description: '',
          duration: '',
          completedAt: new Date().toISOString().slice(0, 16),
          nextFollowUpAt: '',
          isImportant: false,
        });
      } else {
        alert('Failed to add communication');
      }
    } catch (error) {
      console.error('Error adding communication:', error);
      alert('Error adding communication');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const payload = {
        ...noteForm,
        reminderAt: noteForm.reminderAt ? new Date(noteForm.reminderAt).toISOString() : null,
      };

      const response = await fetch(`${apiUrl}/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchNotes();
        setShowAddNote(false);
        setNoteForm({
          type: 'general',
          title: '',
          content: '',
          isImportant: false,
          isPrivate: false,
          reminderAt: '',
        });
      } else {
        alert('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
    }
  };

  const handleDeleteLead = async () => {
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
        router.push('/dashboard/customers/leads');
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

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
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
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.fullName}</h1>
            <p className="text-gray-600">Lead Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/dashboard/customers/leads/edit/${lead.id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDeleteLead}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-900">{lead.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[lead.status as keyof typeof statusColors]}`}>
                  {getStatusIcon(lead.status)}
                  <span className="ml-1">{lead.status.replace('_', ' ')}</span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{lead.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900">{lead.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Source</label>
                <p className="text-gray-900 capitalize">{lead.source.replace('_', ' ')}</p>
                {lead.sourceDetails && (
                  <p className="text-sm text-gray-600">{lead.sourceDetails}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Priority</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColors[lead.priority as keyof typeof priorityColors]}`}>
                  {lead.priority}
                </span>
              </div>
              {lead.budgetRange && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Budget Range</label>
                  <p className="text-gray-900">PKR {lead.budgetRange.toLocaleString()}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Contact</label>
                <p className="text-gray-900 capitalize">{lead.preferredContactMethod} - {lead.preferredContactTime}</p>
              </div>
            </div>

            {lead.interests && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Interests</label>
                <p className="text-gray-900">{lead.interests}</p>
              </div>
            )}

            {lead.initialNotes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Initial Notes</label>
                <p className="text-gray-900">{lead.initialNotes}</p>
              </div>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Communications */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Communications
              </h2>
              <button
                onClick={() => setShowAddCommunication(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Communication
              </button>
            </div>

            {showAddCommunication && (
              <form onSubmit={handleAddCommunication} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={communicationForm.type}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="phone_call">Phone Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="in_person">In Person</option>
                      <option value="video_call">Video Call</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <select
                      value={communicationForm.direction}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, direction: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                    <select
                      value={communicationForm.outcome}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, outcome: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="successful">Successful</option>
                      <option value="no_answer">No Answer</option>
                      <option value="busy">Busy</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="interested">Interested</option>
                      <option value="not_interested">Not Interested</option>
                      <option value="callback_requested">Callback Requested</option>
                      <option value="meeting_scheduled">Meeting Scheduled</option>
                      <option value="information_sent">Information Sent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={communicationForm.duration}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Duration in minutes"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={communicationForm.subject}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Communication subject"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={communicationForm.description}
                      onChange={(e) => setCommunicationForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Detailed description of the communication"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCommunication(false)}
                    className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Add Communication
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {communications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No communications yet</p>
              ) : (
                communications.map((comm) => (
                  <div key={comm.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {comm.type.replace('_', ' ')} - {comm.direction}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          comm.outcome === 'successful' ? 'bg-green-100 text-green-800' :
                          comm.outcome === 'interested' ? 'bg-blue-100 text-blue-800' :
                          comm.outcome === 'not_interested' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {comm.outcome.replace('_', ' ')}
                        </span>
                        {comm.isImportant && (
                          <span className="text-red-500">
                            <AlertCircle className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comm.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{comm.subject}</h4>
                    <p className="text-sm text-gray-600 mb-2">{comm.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {comm.user.fullName}</span>
                      {comm.duration && <span>Duration: {comm.duration} minutes</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notes
              </h2>
              <button
                onClick={() => setShowAddNote(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {showAddNote && (
              <form onSubmit={handleAddNote} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={noteForm.type}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="general">General</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="meeting">Meeting</option>
                      <option value="phone_call">Phone Call</option>
                      <option value="qualification">Qualification</option>
                      <option value="objection">Objection</option>
                      <option value="interest">Interest</option>
                      <option value="budget">Budget</option>
                      <option value="timeline">Timeline</option>
                      <option value="decision_maker">Decision Maker</option>
                      <option value="competitor">Competitor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={noteForm.isImportant}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, isImportant: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Important</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={noteForm.isPrivate}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Private</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Note title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={noteForm.content}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Note content"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Add Note
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
                          {note.type.replace('_', ' ')}
                        </span>
                        {note.isImportant && (
                          <span className="text-red-500">
                            <AlertCircle className="w-4 h-4" />
                          </span>
                        )}
                        {note.isPrivate && (
                          <span className="text-orange-500">
                            <Clock className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {note.user.fullName}</span>
                      {note.reminderAt && (
                        <span>Reminder: {format(new Date(note.reminderAt), 'MMM dd, yyyy HH:mm')}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Current Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[lead.status as keyof typeof statusColors]}`}>
                  {getStatusIcon(lead.status)}
                  <span className="ml-1">{lead.status.replace('_', ' ')}</span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Contacted</label>
                <p className="text-sm text-gray-900">
                  {lead.lastContactedAt ? formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true }) : 'Never'}
                </p>
              </div>
              {lead.nextFollowUpAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Next Follow Up</label>
                  <p className="text-sm text-gray-900">
                    {formatDistanceToNow(new Date(lead.nextFollowUpAt), { addSuffix: true })}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-sm text-gray-900">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">
                  {lead.assignedToUser ? lead.assignedToUser.fullName : 'Unassigned'}
                </p>
              </div>
              {lead.generatedByUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Generated By</label>
                  <p className="text-sm text-gray-900">{lead.generatedByUser.fullName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversion */}
          {lead.status === 'converted' && lead.convertedToCustomer && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Converted To Customer</label>
                  <p className="text-sm text-gray-900">{lead.convertedToCustomer.fullName}</p>
                </div>
                {lead.convertedByUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Converted By</label>
                    <p className="text-sm text-gray-900">{lead.convertedByUser.fullName}</p>
                  </div>
                )}
                {lead.convertedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Converted On</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(lead.convertedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {lead.status !== 'converted' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/customers/leads/convert/${lead.id}`)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                >
                  <Users className="w-4 h-4" />
                  Convert to Customer
                </button>
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Call {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Email {lead.email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="col-span-full">
            <ActivityTimeline leadId={lead.id} title="Lead Activity Timeline" />
          </div>
        </div>
      </div>
    </div>
  );
}
