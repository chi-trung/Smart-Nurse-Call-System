# ⚡ Quick Start Script

This script automates the installation process for both backend and frontend.

## Windows PowerShell Script

Create file: `setup.ps1` in the root project folder

```powershell
# Smart Nurse Call System - Automated Setup Script
# Usage: Open PowerShell as Admin and run: .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smart Nurse Call System - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found! Please install from nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Backend Setup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendPath = ".\backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend installation failed" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Set-Location ".."
} else {
    Write-Host "✗ Backend folder not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Frontend Setup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$frontendPath = ".\frontend"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Write-Host "(This may take 3-10 minutes, please be patient...)" -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend installation failed" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Set-Location ".."
} else {
    Write-Host "✗ Frontend folder not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Backend: cd backend && npm start" -ForegroundColor White
Write-Host "2. Start Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "For more help, see INSTALLATION.md" -ForegroundColor Gray
```

### Usage:
1. Save the script as `setup.ps1` in project root
2. Open PowerShell as Administrator
3. Run: `.\setup.ps1`

---

## Manual Quick Start (Windows)

### Terminal 1 - Backend
```powershell
cd backend
npm install
npm start
```

### Terminal 2 - Frontend  
```powershell
cd frontend
npm install
npm run dev
```

### Open Browser
```
http://localhost:3000
```

---

## All-in-One Startup Script

Create file: `run.cmd` in root folder

```batch
@echo off
echo Starting Smart Nurse Call System...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install from https://nodejs.org/
    exit /b 1
)

REM Start backend in new window
echo Starting Backend Server...
start cmd /k "cd backend && npm start"

REM Wait a bit for backend to start
timeout /t 3

REM Start frontend in new window
echo Starting Frontend Development Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo Servers are starting...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000/api/health
echo.
pause
```

### Usage:
Just double-click `run.cmd` in Windows Explorer

---

## Docker Setup (Optional)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_PATH=/app/data/nurse_call.db
    volumes:
      - C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db:/app/data/nurse_call.db:ro
    networks:
      - nursecall-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:5000/api
    depends_on:
      - backend
    networks:
      - nursecall-network

networks:
  nursecall-network:
    driver: bridge
```

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
```

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

Run with:
```bash
docker-compose up
```

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Install Node.js from nodejs.org |
| Port 5000 in use | Change PORT in backend/.env |
| Port 3000 in use | Vite uses 3001, 3002, etc. automatically |
| Database not found | Check path in backend/.env |
| No data showing | Verify C# app created database |
| Slow performance | Increase REFRESH_INTERVAL |

---

## Project Verification Checklist

- [ ] Node.js v16+ installed
- [ ] Backend dependencies installed: `npm install` in backend/
- [ ] Frontend dependencies installed: `npm install` in frontend/
- [ ] Database path verified in backend/.env
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Dashboard loads at http://localhost:3000
- [ ] Server status shows "Connected" (green)
- [ ] Data displays in table
- [ ] Charts load properly
- [ ] Emergency alerts show (if data exists)
- [ ] Auto-refresh works every 4 seconds

✅ **All checks passed?** You're ready to go!

---

## Commands Quick Reference

### Backend
```bash
cd backend

npm install              # Install dependencies
npm start               # Start production server
npm run dev             # Start dev server with auto-reload
npm test                # Run tests (if configured)
```

### Frontend
```bash
cd frontend

npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build locally
npm run lint            # Check code quality
```

### Root Commands
```bash
# Start both servers (different terminals)
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm run dev
```

---

## Environment Setup

### Backend (.env file)
```
PORT=5000
DATABASE_PATH=C:\Users\Lenovo\Downloads\iot-project-final\C#\NurseCall\NurseCall\bin\Debug\nurse_call.db
NODE_ENV=development
```

### Frontend
Configured in `vite.config.js` to proxy /api to backend

---

## Performance Monitoring

### Check Resource Usage
```bash
# Check what's using ports
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process using port (Windows)
taskkill /PID <process_id> /F
```

### Monitor Logs
- Backend: Check terminal output
- Frontend: Browser DevTools (F12)
- Network: DevTools → Network tab

---

## Next Steps After Setup

1. ✅ Verify dashboard displays data
2. 📝 Customize colors and styling
3. 📊 Adjust refresh intervals
4. 🔧 Add additional API endpoints
5. 🚀 Deploy to production
6. 📱 Test on mobile devices

---

**Need help?** Check:
- [INSTALLATION.md](./INSTALLATION.md) - Detailed setup
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Styling & features
- [API.md](./API.md) - API documentation
- [README.md](./README.md) - General overview
