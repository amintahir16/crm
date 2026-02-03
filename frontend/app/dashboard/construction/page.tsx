'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  User,
  MapPin
} from 'lucide-react';
import { formatPKR } from '@/utils/currency';

interface ConstructionProject {
  id: string;
  projectName: string;
  constructionType: string;
  status: string;
  estimatedCost: number;
  actualCost: number;
  progressPercentage: number;
  startDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  assignedUser?: {
    fullName: string;
  };
  booking: {
    id: string;
    customer: {
      fullName: string;
    };
    plot: {
      plotNumber: string;
      phase: string;
      block: string;
    };
  };
}

export default function ConstructionPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/v1/construction/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching construction projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.booking.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.booking.plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.constructionType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.constructionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'planning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'on_hold':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Construction Management</h1>
          <p className="text-gray-600">Manage construction projects and track progress</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/construction/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="villa">Villa</option>
              <option value="cottage">Cottage</option>
              <option value="apartment">Apartment</option>
              <option value="commercial">Commercial</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="-ml-1 mr-2 h-4 w-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                  <p className="text-sm text-gray-500 capitalize">{project.constructionType}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1 capitalize">{project.status.replace('_', ' ')}</span>
                </span>
              </div>

              {/* Customer & Plot Info */}
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4 mr-2" />
                  {project.booking.customer.fullName}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Plot {project.booking.plot.plotNumber} - {project.booking.plot.phase} {project.booking.plot.block}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{project.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Cost Information */}
              <div className="mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated:</span>
                  <span className="font-medium">{formatPKR(project.estimatedCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Actual:</span>
                  <span className="font-medium">{formatPKR(project.actualCost)}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="mb-4 text-sm text-gray-600">
                {project.startDate && (
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Started: {new Date(project.startDate).toLocaleDateString()}
                  </div>
                )}
                {project.expectedCompletionDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Expected: {new Date(project.expectedCompletionDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Assigned User */}
              {project.assignedUser && (
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-medium">Assigned to:</span> {project.assignedUser.fullName}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/construction/view/${project.id}`)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => router.push(`/dashboard/construction/edit/${project.id}`)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No construction projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new construction project.'}
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/construction/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
