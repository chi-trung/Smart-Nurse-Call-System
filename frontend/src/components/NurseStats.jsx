import React, { useState, useEffect } from 'react';

const NurseStats = () => {
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [nurseLogs, setNurseLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách thống kê y tá
  useEffect(() => {
    fetchNurseStats();
    // Tự động refresh mỗi 10 giây
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
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/nurses/${nurseId}/logs`);

      if (response.ok) {
        const data = await response.json();
        setNurseLogs(data);
        setSelectedNurse(nurseId);
      }
    } catch (error) {
      console.error('Lỗi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Thống Kê Hiệu Suất Y Tá</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {nurses.map((nurse) => (
          <div
            key={nurse.Id}
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: selectedNurse === nurse.Id ? '#e3f2fd' : '#f5f5f5'
            }}
            onClick={() => fetchNurseLogs(nurse.Id)}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>{nurse.FullName}</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                  {nurse.TotalCalls}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Tổng yêu cầu</div>
              </div>

              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {nurse.CompletedCalls}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Đã xử lý</div>
              </div>

              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                  {(nurse.CompletionRate || 0).toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Tỉ lệ hoàn thành</div>
              </div>

              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                  {(nurse.AverageResponseTime || 0).toFixed(0)}s
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Thời gian TB</div>
              </div>
            </div>

            <button
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '10px',
                backgroundColor: selectedNurse === nurse.Id ? '#3498db' : '#ddd',
                color: selectedNurse === nurse.Id ? 'white' : '#666',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Xem chi tiết
            </button>
          </div>
        ))}
      </div>

      {selectedNurse && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3>Lịch Sử Xử Lý</h3>

          {loading ? (
            <p>Đang tải...</p>
          ) : nurseLogs.length === 0 ? (
            <p>Chưa có dữ liệu</p>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #ddd'
            }}>
              <thead style={{ backgroundColor: '#3498db', color: 'white' }}>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Phòng</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Loại</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Thời gian gọi</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Thời gian xử lý</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Thời gian phản hồi</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {nurseLogs.map((log) => (
                  <tr key={log.Id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{log.Id}</td>
                    <td style={{ padding: '10px' }}>Phòng {log.RoomId}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        backgroundColor: log.CallType === 'Emergency' ? '#ffebee' : '#e8f5e9',
                        color: log.CallType === 'Emergency' ? '#c62828' : '#2e7d32',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        {log.CallType}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {new Date(log.RequestTime).toLocaleTimeString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {log.ResponseTime
                        ? new Date(log.ResponseTime).toLocaleTimeString('vi-VN')
                        : 'Chưa xử lý'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                      {log.ResponseMinutes !== null ? `${log.ResponseMinutes} phút` : '-'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: log.Status === 'Completed' ? '#4CAF50' : '#ffc107',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        {log.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default NurseStats;
