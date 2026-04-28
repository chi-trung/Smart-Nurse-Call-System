import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { playAlertSound, triggerVibration } from '../utils/audioNotification';

export const AlertNotifications = ({ alerts = [] }) => {
  const [visibleAlerts, setVisibleAlerts] = useState([]);

  useEffect(() => {
    if (alerts.length > 0) {
      const newAlert = alerts[alerts.length - 1];
      setVisibleAlerts((prev) => [...prev, newAlert]);

      // Play sound and vibration for emergency
      if (newAlert.type === 'emergency') {
        playAlertSound('emergency');
        triggerVibration('emergency');
      } else {
        playAlertSound('completion');
        triggerVibration('completion');
      }

      // Auto remove alert after 8 seconds
      const timer = setTimeout(() => {
        setVisibleAlerts((prev) => prev.filter((a) => a.id !== newAlert.id));
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [alerts]);

  const removeAlert = (id) => {
    setVisibleAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            animate-slideIn flex items-start gap-4 p-5 rounded-xl shadow-xl max-w-sm
            ${
              alert.type === 'emergency'
                ? 'bg-red-50 border-2 border-red-500 text-gray-800'
                : 'bg-gray-50 border-2 border-gray-400 text-gray-800'
            }
          `}
        >
          <div className={`flex-shrink-0 ${alert.type === 'emergency' ? 'animate-bounce' : ''}`}>
            {alert.type === 'emergency' ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-gray-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-gray-800">
              {alert.type === 'emergency' ? '⚠️ CẢNH BÁO KHẨN CẤP' : '✅ Hoàn thành'}
            </p>
            <p className="text-sm text-gray-700 mt-1 break-words">
              {alert.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(alert.timestamp).toLocaleTimeString('vi-VN')}
            </p>
          </div>

          <button
            onClick={() => removeAlert(alert.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-shake {
          animation: shake 0.5s infinite;
        }
      `}</style>
    </div>
  );
};
