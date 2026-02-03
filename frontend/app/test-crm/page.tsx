'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CSVUpload from '../../components/CSVUpload';

interface TestResult {
  phase: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function TestCRMPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const addTestResult = (phase: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, { phase, status, message, details }]);
  };

  const updateTestResult = (phase: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => prev.map(result => 
      result.phase === phase ? { ...result, status, message, details } : result
    ));
  };

  const testBackendConnection = async () => {
    addTestResult('Backend Connection', 'pending', 'Testing backend server connection...');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/v1/health', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        updateTestResult('Backend Connection', 'success', 'Backend server is running');
      } else {
        updateTestResult('Backend Connection', 'error', `Backend responded with status ${response.status}`);
      }
    } catch (error) {
      updateTestResult('Backend Connection', 'error', 'Backend server is not running');
    }
  };

  const testAuthentication = async () => {
    addTestResult('Authentication', 'pending', 'Testing user authentication...');
    
    const token = localStorage.getItem('access_token');
    if (!user || !token) {
      updateTestResult('Authentication', 'error', 'User not authenticated');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        updateTestResult('Authentication', 'success', `Authenticated as ${userData.fullName} (${userData.role})`);
      } else {
        updateTestResult('Authentication', 'error', 'Authentication failed');
      }
    } catch (error) {
      updateTestResult('Authentication', 'error', 'Authentication test failed');
    }
  };

  const testLeadAccess = async () => {
    addTestResult('Lead Access', 'pending', 'Testing lead access permissions...');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/v1/leads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const leads = await response.json();
        updateTestResult('Lead Access', 'success', `Can access leads. Found ${leads.length} leads`);
      } else {
        updateTestResult('Lead Access', 'error', `Lead access failed: ${response.status}`);
      }
    } catch (error) {
      updateTestResult('Lead Access', 'error', 'Lead access test failed');
    }
  };

  const testDashboardData = async () => {
    addTestResult('Dashboard Data', 'pending', 'Testing dashboard data...');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/v1/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const stats = await response.json();
        updateTestResult('Dashboard Data', 'success', `Dashboard data loaded successfully`, stats);
      } else {
        updateTestResult('Dashboard Data', 'error', `Dashboard data failed: ${response.status}`);
      }
    } catch (error) {
      updateTestResult('Dashboard Data', 'error', 'Dashboard data test failed');
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    await testBackendConnection();
    await testAuthentication();
    await testLeadAccess();
    await testDashboardData();
    
    setTesting(false);
  };

  const handleCSVUploadComplete = (result: any) => {
    addTestResult('CSV Import', 'success', `CSV import completed: ${result.data.successfulImports} leads imported`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">CRM Test Dashboard</h1>
          <p className="text-gray-600 text-center">Please log in to access the test dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM End-to-End Testing</h1>
          <p className="text-gray-600 mb-4">
            Testing the complete CRM workflow from lead import to sales processing
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Current User</h2>
            <p className="text-blue-700">
              <strong>Name:</strong> {user.fullName}<br />
              <strong>Role:</strong> {user.role}<br />
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={runAllTests}
                disabled={testing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Running Tests...' : 'Run All Tests'}
              </button>

              <div className="space-y-2">
                <button
                  onClick={testBackendConnection}
                  disabled={testing}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Test Backend Connection
                </button>
                
                <button
                  onClick={testAuthentication}
                  disabled={testing}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Test Authentication
                </button>
                
                <button
                  onClick={testLeadAccess}
                  disabled={testing}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Test Lead Access
                </button>
                
                <button
                  onClick={testDashboardData}
                  disabled={testing}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Test Dashboard Data
                </button>
              </div>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <CSVUpload onUploadComplete={handleCSVUploadComplete} />
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <div>
                        <h3 className="font-medium">{result.phase}</h3>
                        <p className="text-sm">{result.message}</p>
                      </div>
                    </div>
                    {result.details && (
                      <button
                        onClick={() => console.log('Details:', result.details)}
                        className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900">Phase 1: System Setup</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Run all tests to verify system is working</li>
                <li>Upload CSV file with mock leads (100 leads)</li>
                <li>Verify leads are automatically assigned to sales agents</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Phase 2: Sales Agent Workflow</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Login as different sales agents</li>
                <li>Process assigned leads (contact, qualify, convert)</li>
                <li>Create bookings from converted leads</li>
                <li>Test payment processing</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Phase 3: Sales Manager Dashboard</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Login as sales manager</li>
                <li>Review team performance</li>
                <li>Check lead management oversight</li>
                <li>Test analytics and reporting</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
