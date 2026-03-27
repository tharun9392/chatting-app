import React, { createContext, useState, useContext } from 'react';

// Define notification type
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Define notification object
export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// Define notification context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Custom hook for using notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Add notification
  const addNotification = (message: string, type: NotificationType, duration = 3000) => {
    const id = Date.now().toString();
    const newNotification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after duration
    if (duration) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };
  
  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Context value
  const value = {
    notifications,
    addNotification,
    removeNotification
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 