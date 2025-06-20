import React from 'react';
import { X, Bell, Check, Clock, UserPlus, Crown, FileText, Calendar, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { currentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  if (!isOpen) return null;

  const userNotifications = notifications
    .filter(n => n.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadNotifications = userNotifications.filter(n => !n.isRead);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'board_added':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'admin_assigned':
        return <Crown className="w-4 h-4 text-purple-600" />;
      case 'task_assigned':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'task_deadline':
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900 uppercase">УВЕДОМЛЕНИЯ</h3>
          {unreadNotifications.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 uppercase"
            >
              ПРОЧИТАТЬ ВСЕ
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {userNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm uppercase">НЕТ УВЕДОМЛЕНИЙ</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 uppercase">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {format(new Date(notification.createdAt), 'dd MMM, HH:mm', { locale: ru })}
                      </span>
                      {notification.isRead && (
                        <Check className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}