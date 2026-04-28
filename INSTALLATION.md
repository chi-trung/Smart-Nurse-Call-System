# 📦 Installation Guide

## Step-by-Step Setup Instructions

### Prerequisites Check
Before starting, ensure you have:
- [ ] Node.js 16 or higher installed
- [ ] npm or yarn package manager
- [ ] SQLite database file exists at: `C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db`
- [ ] Administrator access (for port binding on Windows)

### Verify Node.js Installation

Open PowerShell and run:
```powershell
node --version
npm --version
```

Should show v16.x.x or higher.

---

## Backend Installation

### Step 1: Navigate to Backend Folder
```powershell
cd "C:\Users\Lenovo\Downloads\iot-project-final\web-nursecall\backend"
```

### Step 2: Install Dependencies
```powershell
npm install
```

This installs:
- `express` - Web server framework
- `sqlite3` - Database driver
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `nodemon` - Auto-restart on code changes (dev only)

**Installation time:** 2-5 minutes (first time)

### Step 3: Verify Database Path

Open `.env` file and verify:
```
DATABASE_PATH=C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db
```

**⚠️ Important**: If your database path is different, update it in `.env`

### Step 4: Start Backend Server

**For Development (with auto-reload):**
```powershell
npm run dev
```

**For Production:**
```powershell
npm start
```

Expected output:
```
Server running on http://localhost:5000
Database: C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db
Connected to SQLite database (READ-ONLY mode)
```

✅ **Backend is ready!**

---

## Frontend Installation

### Step 1: Open New Terminal
Keep the backend terminal running, open a new PowerShell window.

### Step 2: Navigate to Frontend Folder
```powershell
cd "C:\Users\Lenovo\Downloads\iot-project-final\web-nursecall\frontend"
```

### Step 3: Install Dependencies
```powershell
npm install
```

This installs:
- `react` - UI framework
- `vite` - Build tool
- `tailwindcss` - CSS framework
- `recharts` - Charts library
- `lucide-react` - Icon library
- `axios` - HTTP client

**Installation time:** 3-10 minutes (first time, includes Tailwind compilation)

### Step 4: Start Development Server
```powershell
npm run dev
```

Expected output:
```
  VITE v4.4.5  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

✅ **Frontend is ready!**

---

## Access the Dashboard

1. **Open Browser** → http://localhost:3000
2. **You should see**: 
   - Header with "NurseCall Dashboard"
   - Server connection status (green = connected)
   - Statistics cards
   - Urgent emergency alert
   - Data table with call logs
   - Charts showing call distribution

---

## Verify Everything Works

### Backend Verification
Open browser: http://localhost:5000/api/health

Should return:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Frontend Verification
Open browser: http://localhost:3000

Should show:
- Dashboard with real data from your SQLite database
- Auto-updates every 4 seconds
- Server status indicator showing "Server Connected" (green)

---

## Troubleshooting Installation

### Problem: "Cannot find module 'express'"
**Solution:**
```powershell
cd backend
npm install  # Run again
npm start
```

### Problem: Port 5000 already in use
**Solution:** Change port in `backend/.env`:
```
PORT=5001
```
Then restart backend server.

### Problem: Port 3000 already in use
**Solution:** Vite will automatically try port 3001, 3002, etc.

### Problem: "Database file not found"
**Solution:**
1. Verify the database file path in `.env`
2. Check if C# app has created the database yet
3. Run the C# app first to generate the database

### Problem: "CORS error" in browser console
**Solution:** This shouldn't happen as CORS is configured. If it does:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart both servers
3. Check browser console for specific error

### Problem: No data appearing on dashboard
**Solution:**
1. Check backend console for database errors
2. Verify database has data in Logs table
3. Open DevTools (F12) → Console tab for errors
4. Check Network tab to see if API calls succeed

---

## Production Deployment

### Build Frontend
```powershell
cd frontend
npm run build
```

Creates optimized build in `frontend/dist/` folder.

### Deploy Backend
1. Install PM2 globally:
```powershell
npm install -g pm2
```

2. Start backend with PM2:
```powershell
cd backend
pm2 start index.js --name "nursecall-api"
```

3. Verify:
```powershell
pm2 list  # Show running apps
pm2 logs  # Show logs
```

---

## Next Steps

1. ✅ Both servers running
2. ✅ Dashboard loads with data
3. 📝 Customize styling in `frontend/src/index.css`
4. 🔧 Adjust refresh interval in `frontend/src/components/Dashboard.jsx` (line: REFRESH_INTERVAL)
5. 📊 Add more endpoints in `backend/index.js` as needed

**Enjoy your IoT Nurse Call Dashboard!** 🎉
