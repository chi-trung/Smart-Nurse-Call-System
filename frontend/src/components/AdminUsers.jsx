import React, { useState, useEffect } from 'react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [message, setMessage] = useState('');

  // Lấy danh sách users khi component mount
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setMessage('Lỗi: Không thể lấy danh sách users');
      }
    } catch (error) {
      setMessage(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.username || !newUser.password) {
      setMessage('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setMessage('✓ Tạo user thành công!');
        setNewUser({ username: '', password: '', fullName: '' });
        fetchUsers(); // Refresh danh sách
      } else {
        const error = await response.json();
        setMessage(`✗ Lỗi: ${error.error}`);
      }
    } catch (error) {
      setMessage(`✗ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn chắc chắn muốn xóa user này?')) {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setMessage('✓ Xóa user thành công!');
          fetchUsers();
        } else {
          setMessage('✗ Lỗi khi xóa user');
        }
      } catch (error) {
        setMessage(`✗ Lỗi: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Quản Lý Tài Khoản Y Tá</h2>

      {message && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '15px',
          borderRadius: '5px',
          backgroundColor: message.includes('✗') ? '#ffebee' : '#e8f5e9',
          color: message.includes('✗') ? '#c62828' : '#2e7d32',
          border: `1px solid ${message.includes('✗') ? '#ef5350' : '#66bb6a'}`
        }}>
          {message}
        </div>
      )}

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>Tạo Tài Khoản Y Tá Mới</h3>
        <form onSubmit={handleCreateUser}>
          <div style={{ marginBottom: '10px' }}>
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="nurse1"
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Mật khẩu:</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="••••••••"
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Họ tên:</label>
            <input
              type="text"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              placeholder="Nguyễn Thị Y Tá 1"
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
          </button>
        </form>
      </div>

      <h3>Danh Sách Y Tá Hiện Tại</h3>
      {loading && !users.length ? (
        <p>Đang tải...</p>
      ) : users.length === 0 ? (
        <p>Chưa có user nào</p>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd'
        }}>
          <thead style={{ backgroundColor: '#3498db', color: 'white' }}>
            <tr>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Tên Đăng Nhập</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Họ Tên</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Ngày Tạo</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.Id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{user.Id}</td>
                <td style={{ padding: '10px' }}>{user.Username}</td>
                <td style={{ padding: '10px' }}>{user.FullName || 'N/A'}</td>
                <td style={{ padding: '10px' }}>
                  {new Date(user.CreatedAt).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: user.IsActive ? '#4CAF50' : '#f44336',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {user.IsActive ? 'Hoạt Động' : 'Vô Hiệu'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDeleteUser(user.Id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    disabled={loading}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;
