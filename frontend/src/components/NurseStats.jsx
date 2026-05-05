import React, { useState, useEffect } from 'react';

const NurseStats = () => {
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [nurseLogs, setNurseLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchNurseStats();
    const interval = setInterval(fetchNurseStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNurseStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/nurses/stats/all');
      if (response.ok) {
        const data = await response.json();
        setNurses(data);
      }
    } catch (error) {
      console.error('Lỗi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNurseLogs = async (nurseId) => {
    try {
      setLogsLoading(true);
      const response = await fetch(`http://localhost:5000/api/nurses/${nurseId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setNurseLogs(data);
        setSelectedNurse(nurseId);
      }
    } catch (error) {
      console.error('Lỗi:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const selectedNurseInfo = nurses.find((n) => n.Id === selectedNurse);

  const getStatusMeta = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'completed') {
      return { label: 'Da xu ly', className: 'bg-blue-100 text-blue-700' };
    }
    if (normalized === 'cancelled' || normalized === 'rejected') {
      return { label: 'Da tu choi', className: 'bg-rose-100 text-rose-700' };
    }
    if (normalized === 'accepted') {
      return { label: 'Dang xu ly', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Cho', className: 'bg-yellow-100 text-yellow-700' };
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Thống kê Y tá</h2>
            <p className="text-sm text-gray-500 mt-1">Hiệu suất xử lý cuộc gọi của từng nhân viên. Tự động cập nhật mỗi 10 giây.</p>
          </div>
          {loading && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Đang cập nhật...
            </span>
          )}
        </div>
      </div>

      {/* Nurse cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nurses.length === 0 && !loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Chưa có dữ liệu y tá.</div>
        ) : nurses.map((nurse) => {
          const isSelected = selectedNurse === nurse.Id;
          return (
            <div
              key={nurse.Id}
              onClick={() => fetchNurseLogs(nurse.Id)}
              className={`rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              {/* Name */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {(nurse.FullName || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{nurse.FullName}</p>
                  {isSelected && <p className="text-xs text-blue-500">Đang xem</p>}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-blue-600">{nurse.TotalCalls}</p>
                  <p className="text-xs text-gray-500">Tổng yêu cầu</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-green-600">{nurse.CompletedCalls}</p>
                  <p className="text-xs text-gray-500">Đã xử lý</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-orange-500">{(nurse.CompletionRate || 0).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Tỉ lệ HT</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-red-500">{(nurse.AverageResponseTime || 0).toFixed(0)}s</p>
                  <p className="text-xs text-gray-500">TG TB</p>
                </div>
              </div>

              <button
                className={`mt-3 w-full py-1.5 rounded-lg text-sm font-medium transition ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                }`}
              >
                {isSelected ? '✓ Đang xem chi tiết' : 'Xem chi tiết'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Logs detail panel */}
      {selectedNurse && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">
              Lịch sử xử lý — <span className="text-blue-600">{selectedNurseInfo?.FullName}</span>
            </h3>
            <button
              onClick={() => { setSelectedNurse(null); setNurseLogs([]); }}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-1"
            >
              Đóng ✕
            </button>
          </div>

          {logsLoading ? (
            <p className="text-gray-400 text-sm py-4 text-center">Đang tải...</p>
          ) : nurseLogs.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Chưa có dữ liệu</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                    <th className="text-left px-3 py-3 font-semibold">#</th>
                    <th className="text-left px-3 py-3 font-semibold">Phòng</th>
                    <th className="text-left px-3 py-3 font-semibold">Loại</th>
                    <th className="text-left px-3 py-3 font-semibold">Thời gian gọi</th>
                    <th className="text-left px-3 py-3 font-semibold">Thời gian xử lý</th>
                    <th className="text-right px-3 py-3 font-semibold">TG phản hồi</th>
                    <th className="text-center px-3 py-3 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {nurseLogs.map((log, idx) => {
                    const statusMeta = getStatusMeta(log.Status);
                    return (
                    <tr key={log.Id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">Phòng {log.RoomId}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          log.CallType === 'Emergency'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {log.CallType === 'Emergency' ? '🔴 Khẩn cấp' : '🟢 Thường'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">
                        {new Date(log.RequestTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">
                        {log.ResponseTime
                          ? new Date(log.ResponseTime).toLocaleString('vi-VN')
                          : <span className="text-gray-400">Chưa xử lý</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        {log.ResponseMinutes !== null && log.ResponseMinutes !== undefined
                          ? `${log.ResponseMinutes} phút`
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NurseStats;
