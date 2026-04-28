/**
 * USER MANAGEMENT ENDPOINTS - Thêm vào file backend/index.js
 * 
 * Thêm những endpoints này vào file index.js của bạn
 * Đặt chúng TRƯỚC server.listen()
 */

// ============= USER MANAGEMENT ENDPOINTS =============

// GET: Danh sách tất cả users (chỉ admin)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const db = await openDatabase();

    db.all(
      `SELECT Id, Username, FullName, CreatedAt, IsActive FROM Users ORDER BY CreatedAt DESC`,
      (err, rows) => {
        db.close();

        if (err) {
          console.error('Error fetching users:', err);
          return res.status(500).json({ error: 'Failed to fetch users' });
        }

        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error in /api/users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Tạo user mới (chỉ admin)
app.post('/api/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, password, fullName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = await openDatabaseWrite();

    // Mã hóa password (đơn giản - trong production dùng bcrypt)
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('base64');

    const insertUserQuery = `
      INSERT INTO Users (Username, Password, FullName, IsActive)
      VALUES (?, ?, ?, 1)
    `;

    db.run(insertUserQuery, [username, hashedPassword, fullName || username], function(err) {
      if (err) {
        db.close();
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        console.error('Error creating user:', err);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      const userId = this.lastID;

      // Tạo NurseStats cho user mới
      const insertStatsQuery = `
        INSERT INTO NurseStats (UserId, TotalCalls, CompletedCalls, AverageResponseTime)
        VALUES (?, 0, 0, 0)
      `;

      db.run(insertStatsQuery, [userId], function(err) {
        db.close();

        if (err) {
          console.error('Error creating stats:', err);
          return res.status(500).json({ error: 'Failed to create stats' });
        }

        console.log(`New user created: ${username} (ID: ${userId})`);

        res.status(201).json({
          success: true,
          userId: userId,
          message: `User ${username} created successfully`
        });
      });
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE: Xóa user (chỉ admin)
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userId = req.params.id;
    const db = await openDatabaseWrite();

    // Disable user thay vì xóa (safer)
    const updateQuery = `UPDATE Users SET IsActive = 0 WHERE Id = ?`;

    db.run(updateQuery, [userId], function(err) {
      db.close();

      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    });
  } catch (error) {
    console.error('Error in DELETE /api/users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= NURSE STATISTICS ENDPOINTS =============

// GET: Thống kê của một y tá
app.get('/api/nurses/:nurseId/stats', async (req, res) => {
  try {
    const nurseId = req.params.nurseId;
    const db = await openDatabase();

    db.get(
      `SELECT 
        Users.Id, 
        Users.FullName, 
        Users.Username,
        NurseStats.TotalCalls,
        NurseStats.CompletedCalls,
        NurseStats.AverageResponseTime,
        ROUND((NurseStats.CompletedCalls * 100.0 / NULLIF(NurseStats.TotalCalls, 0)), 2) as CompletionRate,
        NurseStats.LastUpdate
      FROM NurseStats
      JOIN Users ON NurseStats.UserId = Users.Id
      WHERE Users.Id = ?`,
      [nurseId],
      (err, row) => {
        db.close();

        if (err) {
          console.error('Error fetching nurse stats:', err);
          return res.status(500).json({ error: 'Failed to fetch stats' });
        }

        res.json(row || {});
      }
    );
  } catch (error) {
    console.error('Error in /api/nurses/:nurseId/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Thống kê tất cả y tá
app.get('/api/nurses/stats/all', async (req, res) => {
  try {
    const db = await openDatabase();

    db.all(
      `SELECT 
        Users.Id, 
        Users.FullName,
        NurseStats.TotalCalls,
        NurseStats.CompletedCalls,
        NurseStats.AverageResponseTime,
        ROUND((NurseStats.CompletedCalls * 100.0 / NULLIF(NurseStats.TotalCalls, 0)), 2) as CompletionRate
      FROM NurseStats
      JOIN Users ON NurseStats.UserId = Users.Id
      WHERE Users.IsActive = 1
      ORDER BY NurseStats.CompletedCalls DESC`,
      (err, rows) => {
        db.close();

        if (err) {
          console.error('Error fetching all nurse stats:', err);
          return res.status(500).json({ error: 'Failed to fetch stats' });
        }

        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error in /api/nurses/stats/all:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Lịch sử xử lý của một y tá
app.get('/api/nurses/:nurseId/logs', async (req, res) => {
  try {
    const nurseId = req.params.nurseId;
    const db = await openDatabase();

    db.get(
      `SELECT FullName FROM Users WHERE Id = ?`,
      [nurseId],
      (err, user) => {
        if (err || !user) {
          db.close();
          return res.status(404).json({ error: 'Nurse not found' });
        }

        const nurseName = user.FullName;

        db.all(
          `SELECT 
            Id, 
            RoomId, 
            CallType, 
            RequestTime, 
            ResponseTime,
            Status,
            CAST((julianday(ResponseTime) - julianday(RequestTime)) * 24 * 60 as INTEGER) as ResponseMinutes
          FROM Logs
          WHERE NurseName = ? OR CompletedBy = ?
          ORDER BY RequestTime DESC
          LIMIT 100`,
          [nurseName, nurseName],
          (err, rows) => {
            db.close();

            if (err) {
              console.error('Error fetching nurse logs:', err);
              return res.status(500).json({ error: 'Failed to fetch logs' });
            }

            res.json(rows || []);
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in /api/nurses/:nurseId/logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= UPDATED CALL COMPLETE ENDPOINT (with NurseName) =============

// POST: Cập nhật call complete với tên y tá (từ C# WinForms)
app.post('/api/calls/complete-with-nurse', async (req, res) => {
  try {
    const { roomId, callType, nurseName, nurseId } = req.body;

    if (!roomId || !callType || !nurseName) {
      return res.status(400).json({ error: 'roomId, callType, and nurseName required' });
    }

    const db = await openDatabaseWrite();

    // Tìm call pending mới nhất
    const findQuery = `
      SELECT Id FROM Logs 
      WHERE RoomId = ? 
      AND CallType = ? 
      AND Status = 'Pending'
      ORDER BY RequestTime DESC 
      LIMIT 1
    `;

    db.get(findQuery, [roomId, callType], function(err, row) {
      if (err) {
        db.close();
        console.error('Error finding call:', err);
        return res.status(500).json({ error: 'Failed to find call' });
      }

      if (!row) {
        db.close();
        return res.status(404).json({ error: 'No pending call found' });
      }

      // Update call với nurse info
      const updateQuery = `
        UPDATE Logs 
        SET 
          Status = 'Completed', 
          ResponseTime = datetime('now'),
          NurseName = ?,
          CompletedBy = ?
        WHERE Id = ?
      `;

      db.run(updateQuery, [nurseName, nurseName, row.Id], function(err) {
        db.close();

        if (err) {
          console.error('Error updating call:', err);
          return res.status(500).json({ error: 'Failed to complete call' });
        }

        console.log(`Call completed by ${nurseName}: Room ${roomId} - ${callType} (ID: ${row.Id})`);

        // Broadcast real-time update tới Web
        io.emit('call-completed', {
          roomId: parseInt(roomId),
          callType: callType,
          nurseName: nurseName,
          status: 'Completed',
          timestamp: new Date()
        });

        io.emit('log-update', {
          message: `${nurseName} đã hoàn thành xử lý yêu cầu từ phòng ${roomId}`,
          type: 'completion',
          nurseName: nurseName
        });

        res.json({
          success: true,
          message: `Call from room ${roomId} marked as completed by ${nurseName}`
        });
      });
    });
  } catch (error) {
    console.error('Error in /api/calls/complete-with-nurse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
