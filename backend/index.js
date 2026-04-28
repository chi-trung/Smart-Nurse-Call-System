const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const PORT = process.env.PORT || 5000;
const DATABASE_PATH = process.env.DATABASE_PATH;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // Thay đổi password này

// Middleware
app.use(cors());
app.use(express.json());

// Middleware verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 1, username: 'admin', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ 
      success: true, 
      token,
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// Verify token endpoint
app.post('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ valid: false });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ valid: false });
  }
});

// Database connection - OPEN_READONLY mode for reading
function openDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(
      DATABASE_PATH,
      sqlite3.OPEN_READONLY,
      (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database (READ-ONLY mode)');
          resolve(db);
        }
      }
    );
  });
}

// Database connection - WRITE mode (for GUI updates)
function openDatabaseWrite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(
      DATABASE_PATH,
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) {
          console.error('Error opening database for write:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database (READ-WRITE mode)');
          resolve(db);
        }
      }
    );
  });
}

// Initialize database - tạo tables nếu chưa có
async function initializeDatabase() {
  try {
    const db = await openDatabaseWrite();

    // Tạo Users table
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE NOT NULL,
      Password TEXT NOT NULL,
      FullName TEXT,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      IsActive INTEGER DEFAULT 1
    )`, (err) => {
      if (err) console.error('Error creating Users table:', err);
      else console.log('✓ Users table ready');
    });

    // Tạo NurseStats table
    db.run(`CREATE TABLE IF NOT EXISTS NurseStats (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER UNIQUE,
      TotalCalls INTEGER DEFAULT 0,
      CompletedCalls INTEGER DEFAULT 0,
      AverageResponseTime REAL DEFAULT 0,
      LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(UserId) REFERENCES Users(Id)
    )`, (err) => {
      if (err) console.error('Error creating NurseStats table:', err);
      else console.log('✓ NurseStats table ready');
    });

    // Cập nhật Logs table - thêm cột nếu chưa có
    db.run(`ALTER TABLE Logs ADD COLUMN NurseName TEXT DEFAULT 'Unknown'`, (err) => {
      if (err && !err.message.includes('duplicate')) console.error('Error adding NurseName column:', err);
      else if (!err) console.log('✓ NurseName column added to Logs');
    });

    db.run(`ALTER TABLE Logs ADD COLUMN CompletedBy TEXT`, (err) => {
      if (err && !err.message.includes('duplicate')) console.error('Error adding CompletedBy column:', err);
      else if (!err) console.log('✓ CompletedBy column added to Logs');
    });

    db.close();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize endpoint - tạo user admin + demo
app.post('/api/init', async (req, res) => {
  try {
    const db = await openDatabaseWrite();
    const crypto = require('crypto');

    // Tạo user admin nếu chưa có
    const adminHash = crypto.createHash('sha256').update('admin123').digest('base64');
    db.run(
      `INSERT OR IGNORE INTO Users (Username, Password, FullName, IsActive) VALUES ('admin', ?, 'Administrator', 1)`,
      [adminHash],
      function(err) {
        if (err) console.error('Error creating admin:', err);
        else if (this.changes) console.log('✓ Admin user created');
      }
    );

    // Tạo user demo nurse nếu chưa có
    const nurseHash = crypto.createHash('sha256').update('nurse123').digest('base64');
    db.run(
      `INSERT OR IGNORE INTO Users (Username, Password, FullName, IsActive) VALUES ('nurse1', ?, 'Nguyễn Thị Y Tá 1', 1)`,
      [nurseHash],
      function(err) {
        if (err) console.error('Error creating nurse:', err);
        else if (this.changes) console.log('✓ Demo nurse user created');
      }
    );

    // Tạo NurseStats cho nurse nếu chưa có
    db.run(
      `INSERT OR IGNORE INTO NurseStats (UserId, TotalCalls, CompletedCalls, AverageResponseTime)
       SELECT Id, 0, 0, 0 FROM Users WHERE Username = 'nurse1' AND Id NOT IN (SELECT UserId FROM NurseStats)`,
      function(err) {
        db.close();
        if (err) console.error('Error creating nurse stats:', err);
        else {
          res.json({
            success: true,
            message: 'Database initialized successfully',
            credentials: {
              admin: { username: 'admin', password: 'admin123' },
              nurse: { username: 'nurse1', password: 'nurse123' }
            }
          });
        }
      }
    );
  } catch (error) {
    console.error('Error in /api/init:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Health check endpoint

// GET all logs
app.get('/api/logs', async (req, res) => {
  try {
    const db = await openDatabase();
    
    db.all(
      `SELECT Id, RoomId, CallType, RequestTime, ResponseTime, Status FROM Logs ORDER BY RequestTime DESC`,
      (err, rows) => {
        db.close();
        
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ error: 'Failed to fetch logs' });
        }

        // Process data - calculate response time duration
        const processedLogs = rows.map(log => ({
          ...log,
          responseDuration: log.ResponseTime && log.RequestTime 
            ? new Date(log.ResponseTime) - new Date(log.RequestTime)
            : null
        }));

        res.json(processedLogs);
      }
    );
  } catch (error) {
    console.error('Error in /api/logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET logs statistics
app.get('/api/logs/stats', async (req, res) => {
  try {
    const db = await openDatabase();
    
    const query = `
      SELECT 
        COUNT(*) as totalLogs,
        SUM(CASE WHEN CallType = 'Emergency' AND Status = 'Pending' THEN 1 ELSE 0 END) as pendingEmergency,
        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) as completedLogs,
        SUM(CASE WHEN CallType = 'Emergency' THEN 1 ELSE 0 END) as totalEmergency
      FROM Logs
    `;

    db.get(query, (err, row) => {
      db.close();
      
      if (err) {
        console.error('Stats query error:', err);
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }

      const stats = {
        totalLogs: row.totalLogs || 0,
        pendingEmergency: row.pendingEmergency || 0,
        completedLogs: row.completedLogs || 0,
        totalEmergency: row.totalEmergency || 0,
        completionRate: row.totalLogs ? ((row.completedLogs / row.totalLogs) * 100).toFixed(2) : 0
      };

      res.json(stats);
    });
  } catch (error) {
    console.error('Error in /api/logs/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET logs by room (for chart data)
app.get('/api/logs/by-room', async (req, res) => {
  try {
    const db = await openDatabase();
    
    const query = `
      SELECT 
        RoomId,
        COUNT(*) as callCount,
        SUM(CASE WHEN CallType = 'Emergency' THEN 1 ELSE 0 END) as emergencyCalls
      FROM Logs
      GROUP BY RoomId
      ORDER BY callCount DESC
    `;

    db.all(query, (err, rows) => {
      db.close();
      
      if (err) {
        console.error('Room stats query error:', err);
        return res.status(500).json({ error: 'Failed to fetch room statistics' });
      }

      res.json(rows || []);
    });
  } catch (error) {
    console.error('Error in /api/logs/by-room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    // Mã hóa password
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

// GET: Thống kê của một y tá
app.get('/api/nurses/:nurseId/stats', async (req, res) => {
  try {
    const nurseId = req.params.nurseId;
    const db = await openDatabase();

    db.get(
      `SELECT 
        u.Id,
        u.FullName,
        u.Username,
        COALESCE(COUNT(l.Id), 0) AS TotalCalls,
        COALESCE(SUM(CASE WHEN l.Status = 'Completed' THEN 1 ELSE 0 END), 0) AS CompletedCalls,
        COALESCE(ROUND(AVG(CASE 
          WHEN l.Status = 'Completed' AND l.ResponseTime IS NOT NULL AND l.RequestTime IS NOT NULL THEN
            CASE
              WHEN (julianday(l.ResponseTime) - julianday(l.RequestTime)) * 86400 < 0 THEN 0
              ELSE (julianday(l.ResponseTime) - julianday(l.RequestTime)) * 86400
            END
        END), 0), 0) AS AverageResponseTime,
        CASE
          WHEN COUNT(l.Id) = 0 THEN 0
          ELSE ROUND((SUM(CASE WHEN l.Status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(l.Id)), 2)
        END AS CompletionRate,
        datetime('now') AS LastUpdate
      FROM Users u
      LEFT JOIN Logs l ON (l.NurseName = u.FullName OR l.CompletedBy = u.FullName)
      WHERE u.Id = ?
      GROUP BY u.Id, u.FullName, u.Username`,
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
        u.Id,
        u.FullName,
        COALESCE(COUNT(l.Id), 0) AS TotalCalls,
        COALESCE(SUM(CASE WHEN l.Status = 'Completed' THEN 1 ELSE 0 END), 0) AS CompletedCalls,
        COALESCE(ROUND(AVG(CASE 
          WHEN l.Status = 'Completed' AND l.ResponseTime IS NOT NULL AND l.RequestTime IS NOT NULL THEN
            CASE
              WHEN (julianday(l.ResponseTime) - julianday(l.RequestTime)) * 86400 < 0 THEN 0
              ELSE (julianday(l.ResponseTime) - julianday(l.RequestTime)) * 86400
            END
        END), 0), 0) AS AverageResponseTime,
        CASE
          WHEN COUNT(l.Id) = 0 THEN 0
          ELSE ROUND((SUM(CASE WHEN l.Status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(l.Id)), 2)
        END AS CompletionRate
      FROM Users u
      LEFT JOIN Logs l ON (l.NurseName = u.FullName OR l.CompletedBy = u.FullName)
      WHERE u.IsActive = 1
      GROUP BY u.Id, u.FullName
      ORDER BY CompletedCalls DESC`,
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
            CAST(MAX((julianday(ResponseTime) - julianday(RequestTime)) * 24 * 60, 0) as INTEGER) as ResponseMinutes
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
          ResponseTime = datetime('now', 'localtime'),
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

// POST - GUI xác nhận hoàn thành xử lý (từ Form1.cs)
app.post('/api/calls/complete', async (req, res) => {
  try {
    const { roomId, callType } = req.body;

    if (!roomId || !callType) {
      return res.status(400).json({ error: 'roomId and callType required' });
    }

    const db = await openDatabaseWrite();

    // Find the most recent pending call for this room and type
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

      // Update the found call
      const updateQuery = `
        UPDATE Logs 
        SET Status = 'Completed', ResponseTime = datetime('now', 'localtime')
        WHERE Id = ?
      `;

      db.run(updateQuery, [row.Id], function(err) {
        db.close();

        if (err) {
          console.error('Error updating call:', err);
          return res.status(500).json({ error: 'Failed to complete call' });
        }

        console.log(`Call completed: Room ${roomId} - ${callType} (ID: ${row.Id})`);

        // Broadcast real-time update tới Web
        io.emit('call-completed', {
          roomId: parseInt(roomId),
          callType: callType,
          status: 'Completed',
          timestamp: new Date()
        });

        // Log update
        io.emit('log-update', {
          message: `Y tá đã hoàn thành xử lý yêu cầu từ phòng ${roomId}`,
          type: 'completion'
        });

        res.json({ 
          success: true, 
          message: `Call from room ${roomId} marked as completed` 
        });
      });
    });
  } catch (error) {
    console.error('Error in /api/calls/complete:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Listen for new emergency alerts
  socket.on('emergency-alert', (data) => {
    const alert = {
      id: Date.now(),
      roomId: data.roomId,
      type: 'emergency',
      message: `Emergency call from Room ${data.roomId}`,
      timestamp: new Date(),
      severity: 'high'
    };
    
    // Broadcast alert to all connected clients
    io.emit('new-alert', alert);
    console.log('Emergency alert:', alert);
  });

  // Listen for completion alerts
  socket.on('completion-alert', (data) => {
    const alert = {
      id: Date.now(),
      roomId: data.roomId,
      type: 'completion',
      message: `Call from Room ${data.roomId} completed`,
      timestamp: new Date(),
      severity: 'info'
    };
    
    io.emit('new-alert', alert);
    console.log('Completion alert:', alert);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Function to broadcast data to all connected clients
async function broadcastUpdates() {
  try {
    const db = await openDatabase();
    
    // Get latest logs
    db.all(
      `SELECT Id, RoomId, CallType, RequestTime, ResponseTime, Status FROM Logs ORDER BY RequestTime DESC LIMIT 50`,
      (err, logs) => {
        if (!err) {
          // Get stats
          db.all(
            `SELECT 
              COUNT(*) as totalLogs,
              SUM(CASE WHEN Status='Pending' AND CallType='Emergency' THEN 1 ELSE 0 END) as pendingEmergency,
              SUM(CASE WHEN Status='Completed' THEN 1 ELSE 0 END) as completedLogs,
              SUM(CASE WHEN CallType='Emergency' THEN 1 ELSE 0 END) as totalEmergency
              FROM Logs`,
            (err, stats) => {
              if (!err && stats && stats[0]) {
                const stat = stats[0];
                const completionRate = stat.totalLogs > 0 ? Math.round((stat.completedLogs / stat.totalLogs) * 100) : 0;
                
                // Get room data
                db.all(
                  `SELECT RoomId, COUNT(*) as callCount, SUM(CASE WHEN CallType='Emergency' THEN 1 ELSE 0 END) as emergencyCalls FROM Logs GROUP BY RoomId`,
                  (err, roomData) => {
                    db.close();
                    if (!err) {
                      // Broadcast to all connected clients
                      io.emit('data-update', {
                        logs: logs,
                        stats: { ...stat, completionRate },
                        roomData: roomData,
                        timestamp: new Date()
                      });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } catch (err) {
    console.error('Error broadcasting updates:', err);
  }
}

// Broadcast updates every 4 seconds
setInterval(broadcastUpdates, 4000);

// Initialize database tables
console.log('Initializing database tables...');
initializeDatabase();

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${DATABASE_PATH}`);
  console.log(`WebSocket enabled for real-time updates`);
});
