import React from 'react';
import { useNotification } from '../context/NotificationContext';

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const getBackgroundColor = (type: string): string => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBackgroundColor(notification.type)} text-white p-3 rounded-md shadow-lg flex items-start justify-between animate-fade-in-down`}
          role="alert"
        >
          <div className="flex-1">{notification.message}</div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 focus:outline-none text-white hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer; 