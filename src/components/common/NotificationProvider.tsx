import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type?: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  onClose?: () => void;
}

export interface NotificationItem extends NotificationOptions {
  id: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  addNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification?.onClose) notification.onClose();
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => { setNotifications([]); }, []);

  const addNotification = useCallback(
    (options: NotificationOptions): string => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification: NotificationItem = {
        id,
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? defaultDuration,
        persistent: options.persistent ?? false,
        onClose: options.onClose,
      };

      setNotifications((prev) => {
        const updated = [...prev, notification];
        return updated.slice(-maxNotifications);
      });

      if (!notification.persistent && notification.duration && notification.duration > 0) {
        setTimeout(() => { removeNotification(id); }, notification.duration);
      }

      return id;
    },
    [defaultDuration, maxNotifications, removeNotification]
  );

  const createShortcut = useCallback(
    (type: NotificationType) => (title: string, message?: string) => {
      return addNotification({ type, title, message });
    },
    [addNotification]
  );

  const value: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success: createShortcut('success'),
    error: createShortcut('error'),
    warning: createShortcut('warning'),
    info: createShortcut('info'),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
};

interface NotificationToastProps {
  notification: NotificationItem;
  onRemove: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onRemove }) => {
  const typeConfig = {
    success: { bg: 'bg-green-500/90', icon: <Check className="w-5 h-5" /> },
    error: { bg: 'bg-red-500/90', icon: <X className="w-5 h-5" /> },
    warning: { bg: 'bg-yellow-500/90', icon: <AlertTriangle className="w-5 h-5" /> },
    info: { bg: 'bg-blue-500/90', icon: <Info className="w-5 h-5" /> },
  };

  const config = typeConfig[notification.type || 'info'];

  return (
    <div
      className={`${config.bg} backdrop-blur-sm text-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] pointer-events-auto animate-slideInRight`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{notification.title}</p>
          {notification.message && <p className="mt-1 text-sm text-white/80">{notification.message}</p>}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationProvider;
