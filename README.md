"# Smart Nurse Call System - Web Dashboard

A modern, real-time IoT dashboard for monitoring nurse call systems with React frontend and Node.js backend.

## 📋 Project Structure

```
web-nursecall/
├── backend/              # Node.js Express API
│   ├── index.js         # Main server file
│   ├── package.json     # Backend dependencies
│   └── .env             # Environment variables
├── frontend/            # React Vite Application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service
│   │   ├── App.jsx      # Main app component
│   │   └── index.css    # Tailwind styles
│   ├── index.html       # HTML entry
│   └── package.json     # Frontend dependencies
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- SQLite database at: `C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db`

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

Backend runs on: **http://localhost:5000**

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

## 📱 Features

### Backend API
- **GET /api/logs** - Fetch all call logs
- **GET /api/logs/stats** - Get system statistics
- **GET /api/logs/by-room** - Get calls grouped by room
- **GET /api/health** - Health check endpoint
- **OPEN_READONLY** - Database opened in read-only mode to prevent conflicts

### Frontend Dashboard
✅ **Real-time Data**: Auto-refresh every 4 seconds
✅ **Statistics Cards**: Total calls, emergency calls, completed calls, completion rate
✅ **Emergency Alert**: Highlighted pending emergency calls with blinking effect
✅ **Data Table**: Sortable table with call details, highlighted pending emergencies in red
✅ **Charts**:
  - Bar chart: Calls by room
  - Pie chart: Emergency vs Normal calls distribution
  - Pie chart: Completion rate
✅ **Modern Design**: Hospital-style dashboard with Tailwind CSS
✅ **Responsive**: Works on desktop, tablet, and mobile devices

## 🔧 API Documentation

### GET /api/logs
Fetches all call logs from the database.

**Response:**
```json
[
  {
    "Id": 1,
    "RoomId": "101",
    "CallType": "Emergency",
    "RequestTime": "2024-04-28T10:30:00Z",
    "ResponseTime": "2024-04-28T10:32:15Z",
    "Status": "Completed",
    "responseDuration": 135000
  }
]
```

### GET /api/logs/stats
Gets system-wide statistics.

**Response:**
```json
{
  "totalLogs": 150,
  "pendingEmergency": 3,
  "completedLogs": 145,
  "totalEmergency": 25,
  "completionRate": "96.67"
}
```

### GET /api/logs/by-room
Gets call statistics grouped by room.

**Response:**
```json
[
  {
    "RoomId": "101",
    "callCount": 15,
    "emergencyCalls": 3
  },
  {
    "RoomId": "102",
    "callCount": 12,
    "emergencyCalls": 2
  }
]
```

## 🛠 Troubleshooting

### "Database is locked" Error
✓ Already handled! Backend uses `OPEN_READONLY` mode to prevent conflicts with C# app writing data.

### Port Already in Use
```bash
# Change port in backend .env:
PORT=5001

# Change port in frontend vite.config.js:
server: { port: 3001 }
```

### CORS Issues
Make sure backend CORS is configured correctly (already done in index.js).

### API Connection Failed
1. Check if backend server is running: `npm start` in backend folder
2. Verify DATABASE_PATH in `.env` file
3. Check database file exists at the specified path
4. Verify firewall settings allow localhost:5000

## 📊 Database Schema (Expected)

```sql
CREATE TABLE Logs (
  Id INTEGER PRIMARY KEY,
  RoomId TEXT,
  CallType TEXT CHECK(CallType IN ('Normal', 'Emergency')),
  RequestTime DATETIME,
  ResponseTime DATETIME,
  Status TEXT CHECK(Status IN ('Pending', 'Completed'))
);
```

## 🎨 Frontend Technologies

- **React 18** - UI framework
- **Vite** - Build tool (fast development)
- **Tailwind CSS** - Styling
- **Recharts** - Charts and graphs
- **Lucide Icons** - Beautiful icons
- **Axios** - HTTP client

## 📦 Backend Technologies

- **Express.js** - Web framework
- **SQLite3** - Database driver
- **CORS** - Cross-origin support
- **dotenv** - Environment variables

## 🌐 Deployment Notes

### Frontend Build
```bash
cd frontend
npm run build
# Output in dist/ folder - ready for deployment
```

### Backend Production
1. Use process manager like PM2
2. Set `NODE_ENV=production` in .env
3. Use reverse proxy (nginx/Apache) for production

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_PATH=C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db
NODE_ENV=development
```

### Frontend (vite.config.js)
Proxy configuration already set up for API calls.

## 🔄 Real-time Updates

The dashboard automatically fetches new data every 4 seconds using `setInterval` in React's `useEffect` hook:
- No manual page refresh needed
- Smooth data updates
- Configurable refresh interval in `Dashboard.jsx`

## 🚨 Special Features

1. **Emergency Highlighting**: Rows with `Status: Pending` AND `CallType: Emergency` are highlighted in red with blinking animation
2. **Sortable Table**: Click column headers to sort data
3. **Live Server Status**: Shows connection status in header
4. **Last Update Time**: Displays when data was last refreshed
5. **Responsive Charts**: Charts adapt to screen size

## 📧 Support

For issues or questions, check:
1. Database path configuration
2. Both servers are running
3. Network connectivity between frontend and backend
4. Browser console for errors (F12)
5. Backend console for database errors

## 📄 License

This project is part of an IoT Nurse Call System." 
