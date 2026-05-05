import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { authService, logsService } from '../services/api';

export const LogsTable = ({ logs, loading, onRefresh }) => {
  const [sortBy, setSortBy] = useState('RequestTime');
  const [sortOrder, setSortOrder] = useState('desc');

  const getStatusKey = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'completed') return 'completed';
    if (normalized === 'cancelled' || normalized === 'rejected') return 'cancelled';
    if (normalized === 'accepted') return 'accepted';
    if (normalized === 'in progress' || normalized === 'in_progress' || normalized === 'inprogress') return 'in-progress';
    return 'pending';
  };

  const parseDateTime = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    // SQLite often returns "YYYY-MM-DD HH:mm:ss"; convert to ISO-like format for stable parsing.
    const text = String(value).trim();
    const normalized = text.includes('T') ? text : text.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedLogs = React.useMemo(() => {
    const sorted = [...logs].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'RequestTime' || sortBy === 'ResponseTime') {
        aVal = parseDateTime(aVal) || new Date(0);
        bVal = parseDateTime(bVal) || new Date(0);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [logs, sortBy, sortOrder]);

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ChevronUp size={14} className="opacity-40" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const formatDateTime = (dateString) => {
    const parsed = parseDateTime(dateString);
    if (!parsed) return '-';
    return parsed.toLocaleString('vi-VN');
  };

  const getActorName = () => {
    const user = authService.getUser();
    return user?.fullName || user?.username || 'Unknown';
  };


  // Web view is read-only for managers; nurses perform actions in the C# GUI.

  const formatResponseColumn = (log) => {
    const statusKey = getStatusKey(log.Status);

    if (statusKey === 'cancelled') {
      return log.CancelledTime ? `Đã từ chối lúc ${formatDateTime(log.CancelledTime)}` : 'Đã từ chối';
    }

    if (statusKey === 'pending') {
      return 'Chờ tiếp nhận';
    }

    if (statusKey === 'accepted') {
      return log.AcceptedTime ? `Đã nhận ca lúc ${formatDateTime(log.AcceptedTime)}` : 'Đã nhận ca';
    }

    if (statusKey === 'in-progress') {
      return log.StartProcessTime ? `Đang xử lý từ ${formatDateTime(log.StartProcessTime)}` : 'Đang xử lý';
    }

    return formatDateTime(log.ResponseTime);
  };

  const getStatusBadge = (log) => {
    const statusKey = getStatusKey(log.Status);
    if (statusKey === 'cancelled') {
      return { className: 'bg-rose-100 text-rose-800', label: 'Đã từ chối' };
    }
    if (statusKey === 'in-progress') {
      return { className: 'bg-blue-100 text-blue-800', label: 'Đang xử lý' };
    }
    if (statusKey === 'accepted') {
      return { className: 'bg-amber-100 text-amber-800', label: 'Đã nhận ca' };
    }
    if (statusKey === 'pending') {
      const isPendingEmergency = log.CallType === 'Emergency';
      return {
        className: isPendingEmergency
          ? 'bg-red-200 text-red-900 animate-blink'
          : 'bg-gray-100 text-gray-800',
        label: 'Chờ tiếp nhận'
      };
    }
    return { className: 'bg-emerald-100 text-emerald-800', label: 'Đã hoàn tất' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <p className="mt-2 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600 border border-gray-200">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                <button
                  onClick={() => handleSort('Id')}
                  className="flex items-center gap-1 hover:text-gray-600"
                >
                  ID <SortIcon column="Id" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                <button
                  onClick={() => handleSort('RoomId')}
                  className="flex items-center gap-1 hover:text-gray-600"
                >
                  Phòng <SortIcon column="RoomId" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                <button
                  onClick={() => handleSort('CallType')}
                  className="flex items-center gap-1 hover:text-gray-600"
                >
                  Loại <SortIcon column="CallType" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                <button
                  onClick={() => handleSort('RequestTime')}
                  className="flex items-center gap-1 hover:text-gray-600"
                >
                  Thời gian yêu cầu <SortIcon column="RequestTime" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                Thời gian phản hồi
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                <button
                  onClick={() => handleSort('Status')}
                  className="flex items-center gap-1 hover:text-gray-600"
                >
                  Trạng thái <SortIcon column="Status" />
                </button>
              </th>
              {/* Hành động removed: managers view is read-only */}
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log, index) => {
              const statusKey = getStatusKey(log.Status);
              const isPendingEmergency = statusKey === 'pending' && log.CallType === 'Emergency';
              const statusBadge = getStatusBadge(log);
              // Web is read-only: no actions available here
              const actions = [];
              const isLoading = false;
              return (
                <tr
                  key={log.Id}
                  className={`border-b transition-colors ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } ${isPendingEmergency ? 'bg-red-50 animate-blink' : 'hover:bg-gray-100'}`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">#{log.Id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-semibold">
                      {log.RoomId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className={`px-3 py-1 rounded-lg font-semibold ${
                      log.CallType === 'Emergency'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {log.CallType === 'Emergency' ? 'Khẩn cấp' : 'Thường'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(log.RequestTime)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatResponseColumn(log)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  {/* Action column removed; web is display-only */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
