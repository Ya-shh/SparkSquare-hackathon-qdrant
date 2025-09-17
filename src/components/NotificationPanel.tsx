"use client";

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  FiBell, FiX, FiCheck, FiCheckCircle, FiUser, 
  FiMessageCircle, FiAward, FiThumbsUp
} from 'react-icons/fi';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

type Notification = {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  data: any;
};

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <FiUser className="text-blue-500" />;
      case 'reply':
        return <FiMessageCircle className="text-green-500" />;
      case 'follow':
        return <FiUser className="text-purple-500" />;
      case 'achievement':
        return <FiAward className="text-amber-500" />;
      case 'upvote':
        return <FiThumbsUp className="text-red-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative p-2 rounded-full hover:bg-muted focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FiBell className="h-5 w-5" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-accent rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 max-h-[calc(100vh-200px)] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            
            {unreadCount > 0 && (
              <button 
                className="text-xs text-primary hover:underline flex items-center"
                onClick={handleMarkAllAsRead}
              >
                <FiCheckCircle className="mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`
                    p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                    ${!notification.isRead ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mt-1 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm mb-1">
                        {notification.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        
                        {!notification.isRead && (
                          <button 
                            className="text-primary hover:text-primary/80 flex items-center"
                            onClick={() => handleMarkAsRead(notification.id)}
                            aria-label="Mark as read"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
                <Link 
                  href="/notifications" 
                  className="text-xs text-primary hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 