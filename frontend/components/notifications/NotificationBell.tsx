'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const [notificationsResponse, countResponse] = await Promise.all([
        fetch(`${apiUrl}/leads/notifications?limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiUrl}/leads/notifications/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        setNotifications(data || []);
      }

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setUnreadCount(countData.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/leads/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      const response = await fetch(`${apiUrl}/leads/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_due_today':
      case 'lead_due_passed':
        return '🔔';
      case 'lead_assigned':
      case 'lead_reassigned':
        return '👤';
      case 'lead_status_changed':
        return '🔄';
      case 'lead_note_added':
        return '📝';
      case 'lead_communication_added':
        return '💬';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'lead_due_today':
        return 'bg-yellow-50 border-yellow-200';
      case 'lead_due_passed':
        return 'bg-red-50 border-red-200';
      case 'lead_assigned':
      case 'lead_reassigned':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? getNotificationColor(notification.type) : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="ml-2 p-1 hover:bg-gray-200 rounded"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 text-center">
                <a
                  href="/dashboard/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

