import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const LogsTable = ({ logs, loading }) => {
  const [sortBy, setSortBy] = useState('RequestTime');
  const [sortOrder, setSortOrder] = useState('desc');

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
        aVal = new Date(aVal);
        bVal = new Date(bVal);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
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
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log, index) => {
              const isPendingEmergency = log.Status === 'Pending' && log.CallType === 'Emergency';
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
                    {formatDateTime(log.ResponseTime)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      log.Status === 'Pending'
                        ? isPendingEmergency
                          ? 'bg-red-200 text-red-900 animate-blink'
                          : 'bg-gray-100 text-gray-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {log.Status === 'Pending' ? 'Chưa xử lý' : 'Đã hoàn thành'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
