
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const [progress, setProgress] = useState(100);
  const duration = 5000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onClose(notification.id);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [notification.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-green-500" size={24} />,
    error: <AlertCircle className="text-red-500" size={24} />,
    warning: <AlertTriangle className="text-brand-orange" size={24} />,
    info: <Info className="text-brand-purple" size={24} />,
  };

  const colors = {
    success: 'border-green-100 bg-white/90',
    error: 'border-red-100 bg-white/90',
    warning: 'border-orange-100 bg-white/90',
    info: 'border-brand-purple/10 bg-white/90',
  };

  const progressColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-brand-orange',
    info: 'bg-brand-purple',
  };

  return (
    <div className={`w-80 md:w-96 p-5 rounded-[2rem] border shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-500 relative overflow-hidden group mb-4 ${colors[notification.type]}`}>
      <div className="flex gap-4">
        <div className="shrink-0 pt-1">
          {icons[notification.type]}
        </div>
        <div className="flex-grow">
          <h4 className="font-black text-brand-dark text-sm uppercase tracking-tight">{notification.title}</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">{notification.message}</p>
        </div>
        <button 
          onClick={() => onClose(notification.id)}
          className="shrink-0 p-1 hover:bg-gray-100 rounded-xl transition-all h-fit"
        >
          <X size={16} className="text-gray-300" />
        </button>
      </div>
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100/50">
        <div 
          className={`h-full transition-all duration-100 linear ${progressColors[notification.type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface ToasterProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map(n => (
          <Toast key={n.id} notification={n} onClose={removeNotification} />
        ))}
      </div>
    </div>
  );
};
