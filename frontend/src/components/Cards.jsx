import React from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

// Stat Card Component
export const StatCard = ({ title, value, icon: Icon, bgColor, textColor, loading = false }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow-md p-6 text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${textColor}`}>
            {loading ? <Loader className="animate-spin" size={32} /> : value}
          </p>
        </div>
        <Icon size={32} className="opacity-80" />
      </div>
    </div>
  );
};

// Emergency Alert Component
export const EmergencyAlert = ({ count, loading = false }) => {
  return (
    <div className={`bg-red-100 border-2 border-red-500 rounded-lg shadow-lg p-6 text-gray-800 transform transition hover:shadow-xl ${count > 0 ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-red-700">⚠️ Cuộc gọi khẩn cấp chưa xử lý</p>
          <p className="text-4xl font-bold mt-2 text-red-600">
            {loading ? <Loader className="animate-spin" size={36} /> : count}
          </p>
          {count > 0 && <p className="text-xs mt-2 animate-blink text-red-600 font-semibold">Cần xử lý ngay!</p>}
        </div>
        <AlertCircle size={40} className="animate-pulse text-red-600" />
      </div>
    </div>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, callType }) => {
  const isPendingEmergency = status === 'Pending' && callType === 'Emergency';
  
  if (isPendingEmergency) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-blink">
        Chưa xử lý
      </span>
    );
  }

  if (status === 'Pending') {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
        Chưa xử lý
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
      Đã hoàn thành
    </span>
  );
};

// Call Type Badge Component
export const CallTypeBadge = ({ callType, Icon }) => {
  const isEmergency = callType === 'Emergency';
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
      isEmergency 
        ? 'bg-red-100 text-red-700' 
        : 'bg-gray-100 text-gray-700'
    }`}>
      <Icon size={16} />
      <span className="text-sm font-medium">{isEmergency ? 'Khẩn cấp' : 'Thường'}</span>
    </div>
  );
};
