# Smart Nurse Call System - Tóm tắt Triển khai Chi tiết

**Ngày tạo:** April 28, 2026  
**Phiên bản:** 1.0.0  
**Trạng thái:** Hoàn thành & deployed to GitHub  
**Repository:** https://github.com/chi-trung/Smart-Nurse-Call-System

---

## 📋 THÔNG TIN DỰ ÁN

### Mục tiêu
Xây dựng hệ thống gọi y tá IoT thực thời, cho phép:
- Bệnh nhân gọi y tá thông qua nút bấm kết nối Arduino
- Y tá nhận thông báo trên GUI WinForms và xác nhận xử lý
- Quản trị viên giám sát real-time từ Web dashboard
- Tự động đồng bộ dữ liệu giữa ba thành phần

### Nhu cầu chính
1. **Y tá** - Cần giao diện đơn giản để xác nhận xử lý cuộc gọi
2. **Quản trị** - Cần bảng điều khiển để giám sát tất cả hoạt động
3. **Hệ thống** - Cần đồng bộ dữ liệu real-time giữa các thành phần

---

## 💻 TECH STACK CHÍNH XÁC

### Backend (Node.js)
| Thành phần | Phiên bản | Tác dụng |
|-----------|---------|---------|
| **express** | ^4.18.2 | Web framework, routing API |
| **socket.io** | ^4.8.3 | WebSocket real-time communication |
| **sqlite3** | ^5.1.6 | Database driver (SQLite) |
| **jsonwebtoken** | ^9.0.0 | JWT authentication & authorization |
| **cors** | ^2.8.5 | CORS middleware cho frontend/GUI |
| **dotenv** | ^16.3.1 | Environment variables (.env) |
| **crypto/SHA256** | Built-in | Password hashing for admin + nurse accounts |
| **nodemon** | ^3.0.1 | Dev tool: auto-reload on changes |

**Port:** 5000 (có thể thay đổi via `.env`)

---

### Frontend (React)
| Thành phần | Phiên bản | Tác dụng |
|-----------|---------|---------|
| **react** | ^18.2.0 | UI framework |
| **react-dom** | ^18.2.0 | React DOM rendering |
| **vite** | ^4.4.5 | Build tool (ultra-fast bundler) |
| **axios** | ^1.5.0 | HTTP client for API calls |
| **socket.io-client** | ^4.8.3 | WebSocket client |
| **recharts** | ^2.8.0 | Data visualization library |
| **tailwindcss** | ^3.3.5 | CSS framework (utility-first) |
| **lucide-react** | ^0.263.1 | Icon library (SVG icons) |
| **postcss** | ^8.4.31 | CSS processing |
| **autoprefixer** | ^10.4.16 | CSS vendor prefixes |

**Port:** 3000 (có thể thay đổi via `vite.config.js`)

---

### C# (WinForms)
| Thành phần | Phiên bản | Tác dụng |
|-----------|---------|---------|
| **.NET Framework** | 4.7.2+ | Application runtime |
| **System.Net.Http** | Built-in | HTTP client for API calls |
| **System.IO.Ports** | Built-in | Serial port communication |
| **Newtonsoft.Json** | ^13.0 | JSON serialization (NuGet) |
| **System.Data.SQLite** | Latest | SQLite database access |

---

### Arduino
| Thành phần | Chi tiết |
|-----------|---------|
| **Board** | Arduino UNO R3 |
| **Baud Rate** | 9600 bps |
| **Program Language** | C++ (Arduino sketch) |
| **IDE** | Arduino IDE 2.0+ |

---

## 🗄️ DATABASE SCHEMA

### Bảng: Users
```sql
CREATE TABLE Users (
  Id          INTEGER PRIMARY KEY AUTOINCREMENT,
  Username    TEXT UNIQUE NOT NULL,
  Password    TEXT NOT NULL,
  FullName    TEXT,
  CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  IsActive    INTEGER DEFAULT 1
);
```

**Cột giải thích:**
- `Username` - Tên đăng nhập của y tá/admin
- `Password` - Password đã hash SHA256
- `FullName` - Họ tên hiển thị trên GUI/web
- `IsActive` - Trạng thái tài khoản (1 = active, 0 = inactive)

### Bảng: NurseStats
```sql
CREATE TABLE NurseStats (
  Id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  UserId              INTEGER UNIQUE,
  TotalCalls          INTEGER DEFAULT 0,
  CompletedCalls      INTEGER DEFAULT 0,
  AverageResponseTime REAL DEFAULT 0,
  LastUpdate          DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(UserId) REFERENCES Users(Id)
);
```

**Cột giải thích:**
- `TotalCalls` - Tổng số call gắn với y tá
- `CompletedCalls` - Số call hoàn thành
- `AverageResponseTime` - Thời gian phản hồi trung bình (giây)
- `LastUpdate` - Lần cập nhật gần nhất

### Bảng: Logs
```sql
CREATE TABLE Logs (
  Id              INTEGER PRIMARY KEY AUTOINCREMENT,
  RoomId          INTEGER,
  CallType        TEXT CHECK(CallType IN ('Normal', 'Emergency')),
  RequestTime     DATETIME,
  ResponseTime    DATETIME,
  Status          TEXT CHECK(Status IN ('Pending', 'Completed')),
  NurseName       TEXT,
  CompletedBy     TEXT
);
```

**Cột giải thích:**
- `Id` - Khóa chính, tự động tăng
- `RoomId` - ID phòng (1-4)
- `CallType` - "Normal" hoặc "Emergency"
- `RequestTime` - Thời gian gọi
- `ResponseTime` - Thời gian hoàn thành
- `Status` - "Pending" (chưa xử lý) hoặc "Completed" (đã xử lý)
- `NurseName` - Tên y tá đã xử lý call
- `CompletedBy` - Trường bổ sung để ghi nhận người hoàn thành

**Vị trí file:** `C#/NurseCall/bin/Debug/nurse_call.db`

---

## 🔌 ARDUINO HARDWARE SPECIFICATION

### Pin Configuration
```
NORMAL BUTTONS (Input):
  Pin 2  → Room 1 Normal
  Pin 4  → Room 2 Normal
  Pin 6  → Room 3 Normal
  Pin 11 → Room 4 Normal

EMERGENCY BUTTONS (Input):
  Pin 3  → Room 1 Emergency
  Pin 5  → Room 2 Emergency
  Pin 7  → Room 3 Emergency
  Pin 12 → Room 4 Emergency

NORMAL LEDs (Output):
  Pin A0 → Room 1 Normal (Green)
  Pin A2 → Room 2 Normal (Green)
  Pin A4 → Room 3 Normal (Green)
  Pin 8  → Room 4 Normal (Green)

EMERGENCY LEDs (Output):
  Pin A1 → Room 1 Emergency (Red)
  Pin A3 → Room 2 Emergency (Red)
  Pin A5 → Room 3 Emergency (Red)
  Pin 9  → Room 4 Emergency (Red)

BUZZER (Output):
  Pin 10 → Alarm buzzer
```

### Serial Protocol
```
FROM Arduino → C# GUI (Request):
  Format: "REQ:RoomId:CallType\n"
  Example: "REQ:1:E" (Room 1, Emergency)
  Example: "REQ:2:N" (Room 2, Normal)

FROM C# GUI → Arduino (Response):
  Format: "DONE:RoomId:CallType\n"
  Example: "DONE:1:E" (Xác nhận Room 1 Emergency done)
  Example: "DONE:2:N" (Xác nhận Room 2 Normal done)

BUZZER Control:
  "ALARM:ON\n"   → Kích hoạt buzzer
  "ALARM:OFF\n"  → Tắt buzzer
```

---

## 🔐 AUTHENTICATION & SECURITY

### Login Credentials (Demo Mode)
```
Admin: admin / admin123
Nurse: nurse1 / nurse123
```

### JWT Configuration
- **Algorithm:** HS256 (HMAC-SHA256)
- **Expiration:** 24 hours
- **Secret Key:** `. env` file (change before production)
- **Header:** `Authorization: Bearer {token}`

### Environment Variables (`.env`)
```bash
# Backend Configuration
PORT=5000
DATABASE_PATH=C:/Users/YourUsername/Documents/nurse_call.db
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production-12345
```

---

## 🛠️ API ENDPOINTS (Chi tiết)

### Authentication Endpoints

#### 1. Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "username": "admin",
  "password": "admin123"
}

Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}

Response (401 Unauthorized):
{
  "error": "Invalid credentials"
}
```

#### 2. Verify Token
```
POST /api/auth/verify
Header: Authorization: Bearer {token}

Response (200 OK):
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}

Response (401 Unauthorized):
{
  "valid": false
}
```

### Logs Endpoints (READ-ONLY)

#### 3. Get All Logs
```
GET /api/logs
Header: Authorization: Bearer {token}

Response (200 OK):
[
  {
    "Id": 1,
    "RoomId": "101",
    "CallType": "Emergency",
    "RequestTime": "2026-04-28T13:24:19.000Z",
    "ResponseTime": "2026-04-28T13:26:30.000Z",
    "Status": "Completed",
    "responseDuration": 131000
  },
  ...
]
```

#### 4. Get Statistics
```
GET /api/logs/stats
Header: Authorization: Bearer {token}

Response (200 OK):
{
  "totalLogs": 150,
  "pendingEmergency": 3,
  "completedLogs": 145,
  "totalEmergency": 25,
  "completionRate": "96.67"
}
```

#### 5. Get Logs by Room
```
GET /api/logs/by-room
Header: Authorization: Bearer {token}

Response (200 OK):
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

### Call Management Endpoints (WRITE)

#### 6. Complete Call (GUI → Backend)
```
POST /api/calls/complete
Content-Type: application/json

Request Body:
{
  "roomId": "101",
  "callType": "Emergency"
}

Response (200 OK):
{
  "success": true,
  "message": "Call from room 101 marked as completed"
}

Response (400 Bad Request):
{
  "error": "roomId and callType required"
}

Response (500 Internal Error):
{
  "error": "Failed to complete call"
}
```

#### 7. Nurse Management
```
GET /api/users
POST /api/users
DELETE /api/users/:id
GET /api/nurses/stats/all
GET /api/nurses/:nurseId/logs
POST /api/calls/complete-with-nurse
POST /api/init
```

### WebSocket Events (Real-time)

#### Event: `call-completed`
```javascript
// Broadcast when GUI completes a call
socket.on('call-completed', (data) => {
  // data = {
  //   roomId: 101,
  //   callType: "Emergency",
  //   status: "Completed",
  //   timestamp: "2026-04-28T13:26:30.000Z"
  // }
});
```

#### Event: `data-update`
```javascript
// Broadcast every 4 seconds with full data
socket.on('data-update', (data) => {
  // data = {
  //   logs: [...],           // All logs
  //   stats: {...},          // Statistics
  //   roomData: [...],       // Room breakdown
  //   timestamp: "..."
  // }
});
```

---

## 🎨 FRONTEND COMPONENTS

### Components Structure
```
src/
├── App.jsx                      # Main auth wrapper & router
│   ├── Login check (localStorage)
│   ├── JWT verification
│   └── Route: Login → Dashboard
│
├── components/
│   ├── Login.jsx                # Admin login page
│   │   ├── Username input
│   │   ├── Password input
│   │   └── Demo credentials display
│   │
│   ├── Dashboard.jsx            # Main admin dashboard
│   │   ├── WebSocket connection (http://localhost:5000)
│   │   ├── Auto-refresh (30 seconds)
│   │   ├── Emergency detection
│   │   └── Routes to sub-components
│   │
│   ├── Cards.jsx                # Stat cards & alerts
│   │   ├── StatCard (Total, Emergency, Completed, Rate)
│   │   ├── EmergencyAlert (Red box)
│   │   └── StatusBadge
│   │
│   ├── Charts.jsx               # Data visualization
│   │   ├── RoomCallsChart (Bar chart)
│   │   ├── EmergencyDistribution (Pie chart)
│   │   └── CompletionRateChart (Pie chart)
│   │
│   ├── LogsTable.jsx            # Call history table
│   │   ├── Sortable columns
│   │   ├── Pending highlight (red)
│   │   ├── Blinking effect for emergencies
│   │   └── Status display
│   │
│   └── AlertNotifications.jsx   # Real-time alerts
│       ├── Slide-in animation (from right)
│       ├── Auto-dismiss (8 seconds)
│       ├── Audio notification (playAlertSound)
│       ├── Vibration (triggerVibration)
│       └── Red/gray styling
│
├── services/
│   └── api.js                   # HTTP client + JWT interceptor
│       ├── axios instance
│       ├── authService
│       ├── logsService
│       └── Error handling
│
└── utils/
    └── audioNotification.js     # Web Audio API
        ├── playAlertSound(type) → 800Hz/600Hz beeps
        ├── triggerVibration(type)
        └── Constants: BEEP_FREQ, BEEP_DURATION
```

### Key Features Implemented
- **Authentication:** JWT token storage in localStorage
- **Real-time:** WebSocket auto-reconnect every 1 second
- **Notifications:** Audio (3 beeps for emergency) + Vibration
- **UI Language:** 100% Vietnamese
- **Color Scheme:** Gray/white with red for alerts only
- **Responsiveness:** Mobile-first with Tailwind CSS

---

## 🖥️ C# WINFORMS COMPONENTS

### Components Structure
```
NurseCall/
├── LoginForm.cs                # Nurse login screen (programmatic UI)
├── Form1.cs                     # Main GUI window
│   ├── Serial port connection
│   ├── Data grid view (queue)
│   ├── Buttons: Connect/Disconnect
│   ├── Nurse header + logout button
│   ├── System log display
│   └── Event handlers
│
├── Form1.Designer.cs            # Auto-generated UI layout
│   ├── DataGridView (dgvQueue)
│   ├── ComboBox (COM port selection)
│   ├── Buttons & labels
│   ├── Nurse info panel
│   ├── Logout button
│   └── ListBox (system logs)
│
├── DatabaseHelper.cs            # SQLite operations
│   ├── InitializeDatabase()     # Create table if not exists
│   ├── LoginUser()              # Nurse/admin authentication
│   ├── CreateUser()             # Admin nurse creation
│   ├── InsertCall()             # Add new call
│   ├── CompleteCall()           # Mark as completed + nurseName
│   ├── GetPendingCalls()        # Fetch pending
│   └── Connection string config
│
├── Program.cs                   # Entry point
│
├── App.config                   # Configuration file
│
└── packages.config              # NuGet dependencies
    └── Newtonsoft.Json
    └── System.Data.SQLite
```

### Key Features
- **Serial Port:** 9600 baud, configurable COM port
- **Database:** Local SQLite (nurse_call.db)
- **Authentication:** LoginForm trước khi vào main GUI
- **API Integration:** HTTP POST to backend /api/calls/complete-with-nurse
- **Fallback Mode:** Direct database update if API fails
- **UI Language:** 100% Vietnamese
- **Logging:** Color-coded log messages (✓ success, ✗ error)
- **Queue Display:** Sortable DataGridView with action buttons
- **Logout Flow:** Đăng xuất và quay lại LoginForm

---

## 🔋 ARDUINO SKETCH FEATURES

### Core Functionality
```c++
// 1. Multi-room support
const int numRooms = 4;  // P1, P2, P3, P4

// 2. Button scanning (loop)
for (int i = 0; i < numRooms; i++) {
  if (digitalRead(btnNormal[i]) == LOW) {
    // Send "REQ:1:N" etc
  }
  if (digitalRead(btnEmergency[i]) == LOW) {
    // Send "REQ:1:E" etc
  }
}

// 3. Serial command processing
if (Serial.available() > 0) {
  char buffer[32];
  int len = Serial.readBytesUntil('\n', buffer, 31);
  
  // Parse "DONE:1:N" format
  if (strncmp(buffer, "DONE:", 5) == 0) {
    int roomId = buffer[5] - '0' - 1;
    char type = buffer[7];
    // Turn off corresponding LED
  }
}
```

### Anti-bounce & Reliability
- 300ms delay after button press (debounce)
- Buffer overflow protection (32 bytes max)
- String termination checking
- Command validation (DONE/ALARM format)

---

## 📊 SYSTEM FLOW (Complete Scenario)

### Scenario: Emergency Call from Room 1
```
1️⃣ BUTTON PRESS (Physical)
   Patient presses "Emergency" button (Pin 3)
   ↓

2️⃣ ARDUINO PROCESSING
   Arduino detects LOW signal
   Sends: "REQ:1:E\n"
   Turns ON LED A1 (Red)
   ↓

3️⃣ C# GUI RECEIVES
   SerialPort.DataReceived event fires
   Parses: roomId=1, type="Emergency"
   Inserts into local DB:
     RoomId: 1
     CallType: Emergency
     RequestTime: NOW
     Status: Pending
   ↓

4️⃣ GUI SENDS TO BACKEND
  POST /api/calls/complete-with-nurse
  { roomId: "1", callType: "Emergency", nurseName: "...", nurseId: 1 }
   ↓

5️⃣ BACKEND PROCESSES
   Verifies roomId & callType
   Updates database:
    Status: Pending → Completed
    ResponseTime: local time
    NurseName / CompletedBy: nurseName
   ↓

6️⃣ BACKEND BROADCASTS
   WebSocket event: 'call-completed'
   Data: {
     roomId: 1,
     callType: "Emergency",
     status: "Completed",
     timestamp: ISO8601
   }
   ↓

7️⃣ WEB DASHBOARD RECEIVES
   Triggers AlertNotifications component
   Plays audio (3 beeps: 800Hz)
   Vibrates device (if supported)
   Displays red alert card:
     "⚠️ CẢNH BÁO KHẨN CẤP"
     "🔴 Phòng 1"
   Auto-dismisses after 8 seconds
   ↓

8️⃣ DASHBOARD UPDATES DATA
   Fetches fresh logs from API
   Stats recalculate:
     - pendingEmergency decreases
     - completedLogs increases
     - NurseStats / nurse performance recalculated from Logs
   Charts update
   Table refreshes
   ↓

9️⃣ ARDUINO RECEIVES CONFIRMATION
   C# (or backend) sends: "DONE:1:E\n"
   Arduino detects this
   Turns OFF LED A1 (Red)
   System ready for next call
```

---

## 📁 FOLDER STRUCTURE (ACTUAL)

```
web-nursecall/
├── assets/
│   ├── gui.png              # C# screenshot
│   ├── web.png              # React screenshot
│   └── proteus.png          # Circuit diagram
│
├── backend/
│   ├── index.js             # Main API server (270+ lines)
│   ├── package.json         # Dependencies
│   ├── package-lock.json    # Exact versions
│   ├── .env                 # Config file (not in git)
│   ├── .gitignore           # Git ignore patterns
│   └── middleware/
│       └── auth.js          # JWT verification
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   ├── main.jsx         # Entry point
│   │   ├── index.css        # Global styles
│   │   ├── components/
│   │   │   ├── Login.jsx    # (99 lines)
│   │   │   ├── Dashboard.jsx # (274 lines)
│   │   │   ├── Cards.jsx    # (80 lines)
│   │   │   ├── Charts.jsx   # (153 lines)
│   │   │   ├── LogsTable.jsx # (164 lines)
│   │   │   └── AlertNotifications.jsx # (106 lines)
│   │   ├── services/
│   │   │   └── api.js       # (107 lines)
│   │   └── utils/
│   │       └── audioNotification.js # (71 lines)
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.cjs
│   └── .gitignore
│
├── C#/
│   └── NurseCall/
│       ├── NurseCall.sln
│       ├── NurseCall/
│       │   ├── Form1.cs              # Main window
│       │   ├── Form1.Designer.cs     # UI layout
│       │   ├── Program.cs            # Entry point
│       │   ├── DatabaseHelper.cs     # DB operations
│       │   ├── NurseCall.csproj      # Project file
│       │   ├── App.config            # Configuration
│       │   ├── packages.config       # NuGet packages
│       │   ├── bin/Debug/
│       │   │   └── nurse_call.db     # SQLite database
│       │   └── obj/                  # Build output
│       ├── .vs/                      # Visual Studio cache
│       └── packages/                 # NuGet packages cache
│
├── sketch_apr28a/
│   ├── sketch_apr28a.ino             # Arduino firmware (90+ lines)
│   └── build/
│       └── arduino.avr.uno/
│           ├── sketch_apr28a.ino.hex
│           ├── sketch_apr28a.ino.elf
│           ├── sketch_apr28a.ino.eep
│           └── sketch_apr28a.ino.with_bootloader.bin
│
├── NurseSystem.zip                  # Full C# project archive
├── README.md                        # Main documentation
├── IMPLEMENTATION_SUMMARY.md        # This file
└── .gitignore
```

---

## 📊 CODE STATISTICS

| Component | Lines | Purpose |
|-----------|-------|---------|
| backend/index.js | 400+ | API server + WebSocket |
| frontend/src/components/Dashboard.jsx | 274 | Admin dashboard |
| frontend/src/components/Charts.jsx | 153 | Data visualization |
| frontend/src/components/LogsTable.jsx | 164 | Call history table |
| frontend/src/components/Login.jsx | 99 | Authentication page |
| frontend/src/components/AlertNotifications.jsx | 106 | Alert display |
| frontend/src/services/api.js | 107 | HTTP client |
| frontend/src/utils/audioNotification.js | 71 | Sound + vibration |
| C#/Form1.cs | 300+ | WinForms GUI |
| C#/DatabaseHelper.cs | 100+ | SQLite operations |
| sketch_apr28a/sketch_apr28a.ino | 90+ | Arduino firmware |
| **TOTAL** | **~2000 lines** | **Complete system** |

---

## 🚀 DEPLOYMENT STATUS

### Development
- ✅ Backend: `npm start` (http://localhost:5000)
- ✅ Frontend: `npm run dev` (http://localhost:3000)
- ✅ C# GUI: LoginForm + Form1 ready to compile & run
- ✅ Arduino: Ready to upload via Arduino IDE

### Production
- ⚠️ Backend: Use PM2 process manager
- ⚠️ Frontend: Build with `npm run build` → deploy dist/
- ⚠️ Database: Configure DATABASE_PATH before deploy
- ⚠️ JWT_SECRET: Change to strong key before deploy
- ⚠️ Admin password: Move to database after MVP

---

## 📝 GIT COMMIT HISTORY

```
b89355a docs: Enhance README with professional presentation
fe589c5 docs: Update README with comprehensive project structure
60dcaeb feat: Add screenshot assets for documentation
dba2dd9 feat: Add Arduino sketch for nurse call system hardware
41ff2b1 feat: Add C# WinForms GUI for nursing staff interface
a1e2a71 docs: Consolidate documentation into README.md
96a57ff docs: Update README with complete project overview
610e355 feat: Implement React admin dashboard with real-time alerts
bd6fe8e feat: Implement Node.js/Express backend with authentication
1dd19f7 docs: Add comprehensive system documentation
```

---

## ✅ VALIDATION CHECKLIST

### Backend
- [x] Express server running on port 5000
- [x] SQLite database operations (READ/WRITE modes)
- [x] JWT authentication (24h expiry)
- [x] CORS enabled for frontend + GUI
- [x] WebSocket real-time broadcasting
- [x] Error handling & logging
- [x] User management APIs working
- [x] Nurse stats APIs working
- [x] All call-completion APIs working

### Frontend
- [x] React components rendering correctly
- [x] JWT token handling & verification
- [x] WebSocket auto-reconnect
- [x] Real-time data updates (30s refresh)
- [x] Audio alerts (3 beeps + 1 beep)
- [x] Vibration support
- [x] Vietnamese UI 100%
- [x] Responsive design (desktop/mobile)

### C# GUI
- [x] Serial port communication (9600 baud)
- [x] Database initialization & operations
- [x] API integration with fallback
- [x] DataGridView queue display
- [x] LoginForm authentication flow
- [x] Nurse name display + logout flow
- [x] Vietnamese UI
- [x] Color-coded logging

### Arduino
- [x] Pin configuration correct
- [x] Button debouncing (300ms)
- [x] LED control logic
- [x] Serial protocol (REQ/DONE)
- [x] Buzzer control
- [x] Multi-room support (4 rooms)

---

## 🎯 NEXT STEPS (KHÔNG TRONG MVP)

1. **Database Improvements**
   - Connection pooling for better performance
   - Backup & recovery mechanisms

2. **Advanced Features**
   - Auto-escalation (upgrade call type if not handled)
   - Call statistics & reporting
   - Mobile app for nurses

3. **Security Hardening**
  - Password hashing with bcrypt
   - HTTPS/TLS encryption
   - Input validation & sanitization
   - Rate limiting on API

4. **Scalability**
   - Horizontal scaling (multiple backend instances)
   - Load balancing (nginx)
   - Caching layer (Redis)

---

## 📞 TROUBLESHOOTING QUICK REFERENCE

| Vấn đề | Nguyên nhân | Giải pháp |
|-------|-----------|---------|
| Backend not connecting | Wrong DATABASE_PATH | Update .env file |
| Frontend 404 errors | Backend down | Start backend: npm start |
| COM port not opening | Wrong COM name | Check Device Manager |
| No audio alerts | Browser permissions | Click page first, check volume |
| Database locked | Multiple access | Backend uses READ-ONLY for web |
| JWT expired | Session timeout | Re-login (24h expiry) |
| Nurse stats show 0 | Stats not recalculated yet | Restart backend and ensure calls use `/api/calls/complete-with-nurse` |
| Response time negative | UTC/localtime mismatch in old rows | Backend now writes local time and clamps negative values |

---

## 📚 DOCUMENTATION FILES

1. **README.md** - User-friendly guide (setup & features)
2. **IMPLEMENTATION_SUMMARY.md** - This file (technical details)
3. **API.md** - Detailed API documentation (archived)
4. **ARCHITECTURE.md** - System design (archived)

---

**Dự án hoàn thành: April 28, 2026**
