import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Phone, AlertCircle, LogOut, Users, TrendingUp } from 'lucide-react';
import { io } from 'socket.io-client';
import { StatCard, EmergencyAlert } from './Cards';
import { LogsTable } from './LogsTable';
import { RoomCallsChart, EmergencyDistribution, CompletionRateChart } from './Charts';
import { AlertNotifications } from './AlertNotifications';
import AdminUsers from './AdminUsers';
import NurseStats from './NurseStats';
import { logsService, authService } from '../services/api';

const SOCKET_URL = 'http://localhost:5000';
const REFRESH_INTERVAL = 30000; // 30 seconds

export const Dashboard = ({ onLogout }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [serverStatus, setServerStatus] = useState('connecting');
  const [alerts, setAlerts] = useState([]);
  const [previousEmergencyCount, setPreviousEmergencyCount] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const user = authService.getUser();

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsData, statsData, roomLogsData] = await Promise.all([
        logsService.getAllLogs(),
        logsService.getStats(),
        logsService.getLogsByRoom()
      ]);
      
      setLogs(logsData);
      setStats(statsData);
      setRoomData(roomLogsData);
      setLastUpdate(new Date());

      // Check for new emergency calls
      if (statsData?.pendingEmergency > previousEmergencyCount) {
        const emergencyAlert = {
          id: Date.now(),
          type: 'emergency',
          message: `Có ${statsData.pendingEmergency} cuộc gọi khẩn cấp cần xử lý!`,
          timestamp: new Date(),
          severity: 'high'
        };
        setAlerts((prev) => [...prev, emergencyAlert]);
      }
      setPreviousEmergencyCount(statsData?.pendingEmergency || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      setServerStatus('connected');
      setLoading(false);
      fetchData(); // Fetch initial data
    });

    socket.on('data-update', (data) => {
      console.log('Received real-time update');
      setLogs(data.logs || []);
      setLastUpdate(new Date(data.timestamp));
      setServerStatus('connected');

      // Auto-detect emergency calls
      if (data.stats?.pendingEmergency > previousEmergencyCount) {
        const newEmergencies = data.stats.pendingEmergency - previousEmergencyCount;
        for (let i = 0; i < newEmergencies; i++) {
          const emergencyAlert = {
            id: Date.now() + i,
            type: 'emergency',
            message: `⚠️ Cuộc gọi khẩn cấp từ phòng đang chờ xử lý!`,
            timestamp: new Date(),
            severity: 'high'
          };
          setTimeout(() => {
            setAlerts((prev) => [...prev, emergencyAlert]);
          }, i * 200); // Stagger alerts
        }
      }

      setPreviousEmergencyCount(data.stats?.pendingEmergency || 0);
      setStats(data.stats);
      setRoomData(data.roomData || []);
    });

    socket.on('call-completed', (data) => {
      console.log('Call completed:', data);
      const completionAlert = {
        id: Date.now(),
        type: 'completion',
        message: `Phòng ${data.roomId} đã được xử lý xong (${data.callType})`,
        timestamp: new Date(),
        severity: 'info'
      };
      setAlerts((prev) => [...prev, completionAlert]);
      
      // Fetch updated data
      setTimeout(() => fetchData(), 500);
    });

    socket.on('new-alert', (alert) => {
      console.log('New alert received:', alert);
      setAlerts((prev) => [...prev, alert]);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setServerStatus('error');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setServerStatus('connecting');
    });

    return () => socket.disconnect();
  }, [previousEmergencyCount]);

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServerStatusDot = () => {
    switch (serverStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alerts */}
      <AlertNotifications alerts={alerts} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Phone className="w-8 h-8 text-gray-800" />
              <h1 className="text-3xl font-bold text-gray-800">Bảng điều khiển</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}</p>
                <div className={`mt-1 px-3 py-1 rounded-full text-sm font-medium inline-block ${getServerStatusColor()}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${getServerStatusDot()} mr-2`}></span>
                  {serverStatus === 'connected' ? 'Máy chủ kết nối' : serverStatus === 'error' ? 'Lỗi máy chủ' : 'Đang kết nối...'}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-800"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex gap-4 border-t pt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-5 h-5" />
              Bảng Điều Khiển
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Thống Kê Y Tá
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-5 h-5" />
                Quản Lý Y Tá
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Statistics Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Tổng cuộc gọi"
                value={stats?.totalLogs || 0}
                icon={Activity}
                bgColor="bg-gray-800"
                textColor="text-gray-100"
                loading={loading}
              />
              <StatCard
                title="Cuộc gọi khẩn cấp"
                value={stats?.totalEmergency || 0}
                icon={AlertTriangle}
                bgColor="bg-red-600"
                textColor="text-red-100"
                loading={loading}
              />
              <StatCard
                title="Đã hoàn thành"
                value={stats?.completedLogs || 0}
                icon={CheckCircle2}
                bgColor="bg-gray-700"
                textColor="text-gray-100"
                loading={loading}
              />
              <StatCard
                title="Tỷ lệ hoàn thành"
                value={`${stats?.completionRate || 0}%`}
                icon={Activity}
                bgColor="bg-gray-600"
                textColor="text-gray-100"
                loading={loading}
              />
            </section>

            {/* Emergency Alert */}
            <section className="mb-8">
              <EmergencyAlert count={stats?.pendingEmergency || 0} loading={loading} />
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <RoomCallsChart data={roomData} loading={loading} />
              </div>
              <div>
                <EmergencyDistribution stats={stats} loading={loading} />
              </div>
            </section>

            <section className="mb-8">
              <CompletionRateChart stats={stats} loading={loading} />
            </section>

            {/* Logs Table */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Cuộc gọi gần đây</h2>
                <button
                  onClick={fetchData}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Làm mới
                </button>
              </div>
              <LogsTable logs={logs} loading={loading} />
            </section>
          </>
        )}

        {activeTab === 'stats' && (
          <NurseStats />
        )}

        {activeTab === 'users' && user?.role === 'admin' && (
          <AdminUsers />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 text-center py-4 mt-12">
        <p>© 2024 Hệ thống Gọi Y tá IoT. Dữ liệu cập nhật real-time mỗi {REFRESH_INTERVAL / 1000} giây.</p>
      </footer>
    </div>
  );
};
