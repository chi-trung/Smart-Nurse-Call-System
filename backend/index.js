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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

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
        SET Status = 'Completed', ResponseTime = datetime('now')
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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${DATABASE_PATH}`);
  console.log(`WebSocket enabled for real-time updates`);
});
