'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  ArrowRight,
  MessageSquare,
  FileText,
  Calendar,
  Flag,
  Target,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface Activity {
  id: string;
  activityType: string;
  description: string;
  metadata?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ActivityTimelineProps {
  leadId?: string;
  userId?: string;
  title?: string;
}

export default function ActivityTimeline({ leadId, userId, title = 'Activity Timeline' }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (leadId || userId) {
      fetchActivities();
    }
  }, [leadId, userId]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      let url;
      if (leadId) {
        url = `${apiUrl}/leads/${leadId}/activities`;
      } else if (userId) {
        url = `${apiUrl}/leads/users/${userId}/activities?limit=50`;
      } else {
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'created':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'status_changed':
        return <ArrowRight className="w-4 h-4 text-purple-600" />;
      case 'assigned':
      case 'reassigned':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'communication_added':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'note_added':
      case 'note_updated':
        return <FileText className="w-4 h-4 text-yellow-600" />;
      case 'due_date_set':
      case 'due_date_changed':
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'priority_changed':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'converted':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'updated':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'created':
        return 'bg-blue-100 border-blue-300';
      case 'status_changed':
        return 'bg-purple-100 border-purple-300';
      case 'assigned':
      case 'reassigned':
        return 'bg-green-100 border-green-300';
      case 'communication_added':
        return 'bg-blue-100 border-blue-300';
      case 'note_added':
      case 'note_updated':
        return 'bg-yellow-100 border-yellow-300';
      case 'due_date_set':
      case 'due_date_changed':
        return 'bg-orange-100 border-orange-300';
      case 'priority_changed':
        return 'bg-red-100 border-red-300';
      case 'converted':
        return 'bg-emerald-100 border-emerald-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const parseMetadata = (metadata?: string) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No activities recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const metadata = parseMetadata(activity.metadata);
            const activityDate = new Date(activity.createdAt);
            
            return (
              <div key={activity.id} className="relative flex items-start">
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${getActivityColor(activity.activityType)}`}>
                  {getActivityIcon(activity.activityType)}
                </div>
                
                {/* Activity content */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        
                        {metadata && (
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {metadata.oldStatus && metadata.newStatus && (
                              <div>
                                <span className="font-medium">Status:</span> {metadata.oldStatus} → {metadata.newStatus}
                              </div>
                            )}
                            {metadata.oldPriority && metadata.newPriority && (
                              <div>
                                <span className="font-medium">Priority:</span> {metadata.oldPriority} → {metadata.newPriority}
                              </div>
                            )}
                            {metadata.oldAssignedUserId && metadata.newAssignedUserId && (
                              <div>
                                <span className="font-medium">Assignment:</span> Changed
                              </div>
                            )}
                            {metadata.oldDueDate && metadata.newDueDate && (
                              <div>
                                <span className="font-medium">Due Date:</span> {new Date(metadata.oldDueDate).toLocaleDateString()} → {new Date(metadata.newDueDate).toLocaleDateString()}
                              </div>
                            )}
                            {metadata.communicationType && (
                              <div>
                                <span className="font-medium">Type:</span> {metadata.communicationType}
                              </div>
                            )}
                            {metadata.noteTitle && (
                              <div>
                                <span className="font-medium">Note:</span> {metadata.noteTitle}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {activity.user ? (
                          <>
                            <User className="w-3 h-3" />
                            <span>{activity.user.fullName}</span>
                          </>
                        ) : (
                          <span>System</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{format(activityDate, 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{format(activityDate, 'h:mm a')}</span>
                        <span className="text-gray-400">
                          ({formatDistanceToNow(activityDate, { addSuffix: true })})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

