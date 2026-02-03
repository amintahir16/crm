'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Zap,
  Facebook,
  MessageSquare,
  Globe,
  Users,
  Target,
  Bell,
  BarChart3,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';

interface AutomationSource {
  id: string;
  name: string;
  type: 'facebook' | 'google' | 'whatsapp' | 'website' | 'zapier';
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  leadsToday: number;
  leadsThisWeek: number;
  lastSync?: Date;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AssignmentRule {
  id: string;
  name: string;
  conditions: string;
  assignTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  enabled: boolean;
  leadsAssigned: number;
}

export default function LeadAutomationPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [automationSources, setAutomationSources] = useState<AutomationSource[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'sources' | 'rules' | 'settings'>('sources');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!isLoading && !isAdmin()) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && isAdmin()) {
      fetchAutomationData();
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  const fetchAutomationData = async () => {
    try {
      setIsLoadingData(true);
      
      // Mock data - replace with actual API calls
      setAutomationSources([
        {
          id: 'facebook',
          name: 'Facebook Lead Ads',
          type: 'facebook',
          enabled: true,
          status: 'connected',
          leadsToday: 12,
          leadsThisWeek: 85,
          lastSync: new Date(),
          icon: Facebook,
          color: 'bg-blue-600',
        },
        {
          id: 'whatsapp',
          name: 'WhatsApp Business',
          type: 'whatsapp',
          enabled: true,
          status: 'connected',
          leadsToday: 8,
          leadsThisWeek: 45,
          lastSync: new Date(),
          icon: MessageSquare,
          color: 'bg-green-600',
        },
        {
          id: 'google',
          name: 'Google Ads',
          type: 'google',
          enabled: false,
          status: 'disconnected',
          leadsToday: 0,
          leadsThisWeek: 0,
          icon: Globe,
          color: 'bg-red-600',
        },
        {
          id: 'website',
          name: 'Website Forms',
          type: 'website',
          enabled: true,
          status: 'connected',
          leadsToday: 5,
          leadsThisWeek: 32,
          lastSync: new Date(),
          icon: Globe,
          color: 'bg-purple-600',
        },
      ]);

      setAssignmentRules([
        {
          id: '1',
          name: 'High Budget Leads',
          conditions: 'Budget > 50 Lakh',
          assignTo: 'Ahmed Hassan',
          priority: 'urgent',
          enabled: true,
          leadsAssigned: 15,
        },
        {
          id: '2',
          name: 'WhatsApp Inquiries',
          conditions: 'Source = WhatsApp',
          assignTo: 'Fatima Khan',
          priority: 'high',
          enabled: true,
          leadsAssigned: 45,
        },
        {
          id: '3',
          name: 'Facebook Premium Campaigns',
          conditions: 'Source = Facebook AND Campaign contains "Premium"',
          assignTo: 'Muhammad Ali',
          priority: 'medium',
          enabled: true,
          leadsAssigned: 28,
        },
      ]);

    } catch (error) {
      console.error('Error fetching automation data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleSource = async (sourceId: string) => {
    setAutomationSources(prev => 
      prev.map(source => 
        source.id === sourceId 
          ? { ...source, enabled: !source.enabled }
          : source
      )
    );
  };

  const toggleRule = async (ruleId: string) => {
    setAssignmentRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, enabled: !rule.enabled }
          : rule
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading automation settings...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access lead automation settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <span>Lead Automation</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Automate lead capture from marketing campaigns and social media
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Source</span>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Sync All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leads Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {automationSources.reduce((sum, source) => sum + source.leadsToday, 0)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {automationSources.reduce((sum, source) => sum + source.leadsThisWeek, 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sources</p>
              <p className="text-2xl font-bold text-gray-900">
                {automationSources.filter(s => s.enabled).length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assignment Rules</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignmentRules.filter(r => r.enabled).length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'sources', label: 'Lead Sources', icon: Zap },
              { id: 'rules', label: 'Assignment Rules', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Configure Webhooks
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {automationSources.map((source) => (
                  <div key={source.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`${source.color} p-2 rounded-lg`}>
                          <source.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{source.name}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(source.status)}`}>
                            {source.status}
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={() => toggleSource(source.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Today</p>
                        <p className="font-semibold text-gray-900">{source.leadsToday} leads</p>
                      </div>
                      <div>
                        <p className="text-gray-600">This Week</p>
                        <p className="font-semibold text-gray-900">{source.leadsThisWeek} leads</p>
                      </div>
                    </div>

                    {source.lastSync && (
                      <div className="mt-4 text-xs text-gray-500">
                        Last sync: {source.lastSync.toLocaleString()}
                      </div>
                    )}

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm">
                        Configure
                      </button>
                      <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
                        Test Connection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assignment Rules</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                  Add Rule
                </button>
              </div>

              <div className="space-y-4">
                {assignmentRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(rule.priority)}`}>
                            {rule.priority}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => toggleRule(rule.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rule.conditions}</p>
                        <p className="text-sm text-gray-500">Assign to: <span className="font-medium">{rule.assignTo}</span></p>
                        <p className="text-xs text-gray-400 mt-1">{rule.leadsAssigned} leads assigned</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Automation Settings</h3>
              
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Webhook URLs</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Use these URLs to configure webhooks in your marketing platforms:
                      </p>
                      <div className="mt-3 space-y-2 text-sm font-mono">
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>Facebook: /api/v1/webhooks/leads/facebook</span>
                          <button className="text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>WhatsApp: /api/v1/webhooks/leads/whatsapp</span>
                          <button className="text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>Google Ads: /api/v1/webhooks/leads/google-ads</span>
                          <button className="text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">General Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm text-gray-700">Enable automatic lead assignment</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm text-gray-700">Send notifications for new leads</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm text-gray-700">Enable lead scoring</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Notification Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm text-gray-700">Email notifications</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm text-gray-700">Slack notifications</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm text-gray-700">SMS notifications</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
