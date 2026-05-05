"# Smart Nurse Call System

![IoT](https://img.shields.io/badge/Project-IoT-blue?style=flat-square)
![C#](https://img.shields.io/badge/C%23-WinForms-green?style=flat-square)
![Arduino](https://img.shields.io/badge/Arduino-UNO-orange?style=flat-square)
![Node.js](https://img.shields.io/badge/Backend-Node.js-yellow?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React-cyan?style=flat-square)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

IoT-based nurse call system với real-time monitoring dashboard, automatic alerts, nurse user management, và login/logout cho y tá. Hệ thống gồm 3 thành phần: C# WinForms GUI (y tá), Node.js Backend (API server), và React Web Dashboard (quản trị).

---

## 🚀 Tính năng Chính

- ✅ **Cuộc gọi khẩn cấp & thường** - Phân biệt mức độ ưu tiên  
- ✅ **Xếp hàng ưu tiên** - Khẩn cấp xử lý trước  
- ✅ **Real-time Monitoring** - WebSocket cập nhật tức thì  
- ✅ **Cảnh báo Audio + Vibration** - Thông báo âm thanh (3 beeps) + rung điện thoại  
- ✅ **Database Sync** - Tự động đồng bộ SQLite giữa GUI & Web  
- ✅ **Nurse Login/Logout** - Y tá đăng nhập trước khi thao tác trên GUI  
- ✅ **Nurse Management** - Admin tạo/xóa tài khoản y tá trên web  
- ✅ **Nurse Performance Stats** - Thống kê theo từng y tá và lịch sử xử lý  
- ✅ **Waiting Time Display** - Hiển thị thời gian chờ với color coding (xanh <2min, cam 2-5min, đỏ >5min)
- ✅ **Call Detail Popup** - Popup chi tiết cuộc gọi với nút theo trạng thái hiện tại
- ✅ **Multi-step Workflow** - Luồng xử lý nhiều bước: Pending → Accepted → In Progress → Completed
- ✅ **Status-based Buttons** - Popup chỉ hiện nút hợp lệ theo trạng thái (tránh bấm sai thứ tự)
- ✅ **Quick-Complete** - Bấm "Xác nhận xử lý" từ Pending sẽ tự chuyển chuỗi an toàn
- ✅ **Async/Await Safe** - Toàn bộ luồng xử lý bất đồng bộ, không block UI
- ✅ **Cancel Reason** - Lưu lý do hủy cuộc gọi vào database
- ✅ **Nurse Filtering in Reports** - Lọc báo cáo và thống kê theo từng y tá
- ✅ **Fallback Mode** - GUI vẫn hoạt động nếu backend down  
- ✅ **Vietnamese UI** - Giao diện tiếng Việt hoàn toàn  
- ✅ **Responsive Design** - Desktop, tablet & mobile  
- ✅ **Response Time Fix** - Thời gian phản hồi dùng local time, không còn số âm  
- ✅ **Anti-crash** - Kiểm tra trạng thái trước mỗi action, bấm sai thứ tự cũng không crash

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SMART NURSE CALL SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

HARDWARE LAYER (Phần cứng):
  [Push Button] → [Arduino UNO]
  (P1, P2, P3, P4)   ↓ (Serial/USB)
                  [COM Port]

GUI LAYER (Giao diện Y tá):
  LoginForm.cs → Form1.cs
      ↓ (Xác thực y tá trước, sau đó xử lý call)
  C# WinForms (Form1.cs)
      ↓ (API Call / Direct DB)
  
BACKEND LAYER (Máy chủ):
  Node.js Express API
      ├→ SQLite Database (Source of Truth)
  ├→ Nurse user management & auth
      └→ WebSocket (Real-time Broadcast)
           ↓
  
ADMIN LAYER (Giao diện Quản trị):
  React Dashboard (Web Browser)
      ↓ (WebSocket Listen)
  [Display Alerts] → [Audio + Vibration]

PERMISSION MODEL:
  • Arduino ↔ GUI: WRITE (Update DB)
  • GUI ↔ Backend: READ-WRITE API (Login, confirm completion, save nurseName)
  • Backend ↔ DB: READ-WRITE (Source of truth)
  • Backend ↔ Web: READ-ONLY + admin nurse management API
  • Web ↔ Browser: READ-ONLY Display
```

---

## 🔄 System Flow (Từng bước)

### Kịch bản: Bệnh nhân gọi khẩn cấp

**Bước 1️⃣ - Bệnh nhân nhấn nút (P1 - Phòng 1 - Khẩn cấp)**
```
Patient presses button [EMERGENCY]
           ↓
Arduino receives signal
           ↓
Sends: "REQ:1:E" (Room 1, Emergency)
           ↓ (Serial → COM port)
```

**Bước 2️⃣ - C# GUI nhận dữ liệu**
```
WinForms receives: "REQ:1:E"
           ↓
Insert into database:
  RoomId: 1
  CallType: Emergency
  Status: Pending
  RequestTime: 2026-04-28 13:24:19
           ↓
```

**Bước 3️⃣ - Y tá đăng nhập và xem chi tiết**
```
LoginForm xuất hiện trước Form1
           ↓
Y tá đăng nhập bằng tài khoản do admin tạo
           ↓
Form1 hiển thị tên y tá đang login và nút Đăng xuất
           ↓
Y tá click "CHI TIẾT" trên cuộc gọi → mở CallDetailForm popup
```

**Bước 4️⃣ - Y tá thao tác qua popup (workflow nhiều bước)**
```
CallDetailForm hiện nút theo trạng thái hiện tại:
  • Pending:     [Nhận ca] [Xác nhận xử lý] [Hủy cuộc gọi]
  • Accepted:    [Bắt đầu xử lý] [Hủy cuộc gọi]
  • In Progress: [Xác nhận xử lý] [Hủy cuộc gọi]
  • Completed/Cancelled: không hiện nút workflow
           ↓
Nếu bấm "Xác nhận xử lý" từ Pending → tự chạy chuỗi:
  Pending → Accepted → In Progress → Completed (async/await)
           ↓
Mỗi bước gửi PATCH /api/calls/{id}/status lên backend
```

**Bước 5️⃣ - Backend xử lý & broadcast**
```
Backend receives: PATCH /api/calls/{id}/status
           ↓
Kiểm tra transition hợp lệ (status rank + allowed transitions)
           ↓
Update database: Status = target status
Save timestamps (AcceptedTime, StartProcessTime, ResponseTime)
Save NurseName / CompletedBy
           ↓ (WebSocket Event)
Broadcast 'call-status-updated' + 'log-update' to all clients
           ↓
```

**Bước 6️⃣ - Web Dashboard hiển thị**
```
React receives WebSocket event
           ↓
Trigger Audio (3 beeps) + Vibration
           ↓
Display Alert Card:
  ⚠️ CẢNH BÁO KHẨN CẤP
  📍 Phòng 1
  🔴 HỎA TỐC
           ↓
Admin sees red notification (Auto-dismiss in 8 seconds)
           ↓
```

**Bước 7️⃣ - Arduino nhận xác nhận**
```
C# GUI gửi: "DONE:1:E" qua serial port
           ↓
Arduino turns OFF LED P1 (Red)
           ↓
Send completion buzzer (1 beep)
           ↓
System ready for next call
```

---

## 📸 Demo & Screenshots

### 1️⃣ C# WinForms - Đăng nhập Y tá

Y tá phải đăng nhập trước khi vào màn hình điều phối:

![Nurse Login](assets/nurselogin.png)

**Tính năng:**
- Bắt buộc đăng nhập trước khi sử dụng
- Tài khoản mặc định: `nurse1 / 123456`
- Tự động seed user nếu DB trống

---

### 2️⃣ C# WinForms GUI - Giao diện Y tá

Y tá kết nối Arduino qua COM port, nhận và xử lý cuộc gọi:

![C# GUI Dashboard](assets/gui.png)

**Tính năng:**
- Bảng hàng đợi hiển thị cuộc gọi chờ xử lý
- Phân biệt khẩn cấp (hồng) vs thường (xanh)
- Thời gian chờ với color coding (xanh < 2min, cam 2-5min, đỏ > 5min)
- Nhật ký hệ thống chi tiết

---

### 3️⃣ C# WinForms - Popup Chi tiết Cuộc gọi

Popup hiển thị chi tiết cuộc gọi với các nút thao tác theo trạng thái:

![Call Detail Popup](assets/guidetail.png)

**Tính năng:**
- Hiển thị thông tin: Call ID, Phòng, Loại, Thời gian chờ
- Nút theo trạng thái: Nhận ca → Bắt đầu xử lý → Xác nhận xử lý
- Nút Hủy cuộc gọi với nhập lý do
- Quick-complete: bấm "Xác nhận xử lý" tự chuyển toàn bộ workflow

---

### 4️⃣ React Web Dashboard - Bảng điều khiển

Quản trị viên giám sát real-time từ web:

![React Dashboard](assets/web.png)

**Tính năng:**
- 📊 Thống kê tổng hợp (tổng, khẩn cấp, hoàn thành, tỷ lệ)
- 🔴 Cảnh báo khẩn cấp nổi bật với âm thanh
- 📋 Danh sách cuộc gọi chưa xử lý
- 📈 Biểu đồ phân tích theo phòng
- ⏱️ Cập nhật real-time mỗi 4 giây

---

### 5️⃣ React Web - Thống kê Y tá

Xem hiệu suất xử lý cuộc gọi của từng nhân viên:

![Nurse Stats](assets/bangthongke.png)

**Tính năng:**
- Card thống kê cho từng y tá: tổng yêu cầu, đã xử lý, tỉ lệ hoàn thành, thời gian TB
- Nút "Xem chi tiết" để xem lịch sử xử lý
- Tự động cập nhật mỗi 10 giây

---

### 6️⃣ React Web - Báo cáo

Báo cáo chi tiết với lọc theo thời gian và nhân viên:

![Reports](assets/report.png)

**Tính năng:**
- Lọc theo khoảng thời gian và nhân viên
- Thống kê: tổng cuộc gọi, khẩn cấp, thường, đã xử lý, đã từ chối
- Biểu đồ: theo phòng, phân loại, thời gian phản hồi, hiệu suất nhân viên
- Xuất báo cáo Excel (.xlsx)

---

### 7️⃣ React Web - Quản lý Tài khoản Y tá

Admin tạo/quản lý tài khoản y tá trên web:

![Nurse Account Management](assets/quanliaccount.png)

**Tính năng:**
- Tạo tài khoản y tá mới (tên đăng nhập, mật khẩu, họ tên)
- Danh sách y tá hiện tại với trạng thái hoạt động
- Xóa tài khoản (soft delete)

---

### 8️⃣ Proteus 8 Circuit Design - Sơ đồ mạch điện

Thiết kế phần cứng cho hệ thống:

![Proteus Circuit Diagram](assets/proteus.png)

**Thành phần:**
- Arduino Uno (CPU)
- 4 Push buttons (P1, P2, P3, P4)
- 8 LED chỉ báo (4 xanh + 4 đỏ)
- Buzzer (cảnh báo âm thanh)
- Module RS232 (COM port)

---

## 📋 Yêu cầu

- **Backend**: Node.js 14+, npm/yarn
- **Frontend**: Node.js 14+, npm/yarn
- **Database**: SQLite3 (tự động tạo)
- **Port**: 3000 (Frontend), 5000 (Backend) - có thể thay đổi

## 🚀 Cài đặt & Chạy

### 1. Chuẩn bị Database

Trước tiên, cập nhật đường dẫn database trong file `backend/.env`:

```bash
DATABASE_PATH="/path/to/your/nurse_call.db"
```

Ví dụ:
- Windows: `C:/Users/YourUsername/Documents/nurse_call.db`
- macOS/Linux: `/home/username/nurse_call.db`

Database sẽ được tạo tự động khi backend chạy lần đầu.

### 2. Chạy Backend Server

```bash
cd backend
npm install
cp .env.example .env    # Nếu có file .env.example
# Cập nhật DATABASE_PATH trong .env theo đường dẫn của bạn
npm start
```

Backend chạy tại: **http://localhost:5000**

Output sẽ hiển thị:
```
Server running on http://localhost:5000
Database: /path/to/your/nurse_call.db
WebSocket enabled for real-time updates
```

### 3. Chạy Frontend Dashboard (mở terminal khác)

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:3000**

Mở browser và đăng nhập:
- **Tên**: admin
- **Mật khẩu**: admin123

Nếu cần tạo sẵn tài khoản demo, gọi:
```bash
curl -X POST http://localhost:5000/api/init
```

Tài khoản demo được tạo sẵn:
- **Admin**: admin / admin123
- **Nurse**: nurse1 / nurse123

### 4. Kết nối C# GUI (tùy chọn)

Nếu có C# WinForms app:
- Đảm bảo Backend đang chạy (`http://localhost:5000`)
- Database path trong C# project phải trỏ đến cùng file SQLite
- Cổng COM phải đúng với Arduino device
- Khi mở app, LoginForm sẽ hiện trước Form1

## ⚙️ Cấu hình

### File `.env` (Backend)

```bash
# Port chạy server
PORT=5000

# Đường dẫn tuyệt đối đến database SQLite
# Windows:
DATABASE_PATH="C:/Users/YourUsername/Documents/nurse_call.db"
# macOS/Linux:
DATABASE_PATH="/home/username/Documents/nurse_call.db"

# Môi trường
NODE_ENV=development

# JWT Secret (THAY ĐỔI TRƯỚC KHI DEPLOY!)
JWT_SECRET=your-secret-key-change-in-production-12345
```

### Thay đổi cổng

**Backend** - sửa `backend/.env`:
```bash
PORT=5001
```

**Frontend** - sửa `frontend/vite.config.js`:
```javascript
export default {
  server: {
    port: 3001
  }
}
```

### Thay đổi Admin Password

Sửa `backend/index.js` (dòng chứa `const ADMIN_PASSWORD`):
```javascript
const ADMIN_PASSWORD = 'your-new-password';
```

⚠️ **Lưu ý**: Chỉ dùng cho demo! Production nên dùng database user table + bcrypt.

### JWT Secret Key (PRODUCTION)

Thay đổi `backend/.env` trước khi deploy:
```bash
JWT_SECRET=generate-strong-random-key-here
```

## 🎯 Tính năng

✅ **Authentication**: JWT-based login system  
✅ **Real-time Monitoring**: WebSocket cho live updates  
✅ **Audio Alerts**: 3 beeps (khẩn cấp), 1 beep (hoàn thành)  
✅ **Vibration Support**: Haptic feedback on mobile devices  
✅ **Vietnamese UI**: Full Vietnamese localization  
✅ **Responsive Design**: Desktop, tablet & mobile  
✅ **API Integration**: REST endpoints cho C# GUI  
✅ **State Workflow**: Pending → Accepted → In Progress → Completed  
✅ **Anti-Crash**: Cải thiện xử lý async/await toàn hệ thống  

## 📸 Screenshots (Tổng hợp)

| # | Ảnh | Mô tả |
|---|------|-------|
| 1 | ![Login](assets/nurselogin.png) | **C# Nurse Login** - Đăng nhập y tá bắt buộc |
| 2 | ![GUI](assets/gui.png) | **C# GUI Dashboard** - Bảng hàng đợi + nhật ký |
| 3 | ![Detail](assets/guidetail.png) | **Call Detail Popup** - Nút theo trạng thái workflow |
| 4 | ![Web](assets/web.png) | **Web Dashboard** - Bảng điều khiển admin real-time |
| 5 | ![Stats](assets/bangthongke.png) | **Thống kê Y tá** - Hiệu suất từng nhân viên |
| 6 | ![Report](assets/report.png) | **Báo cáo** - Lọc theo thời gian + xuất Excel |
| 7 | ![Account](assets/quanliaccount.png) | **Quản lý Tài khoản** - Tạo/xóa y tá |
| 8 | ![Proteus](assets/proteus.png) | **Sơ đồ mạch** - Arduino + LED + Buzzer |

## �📡 API Endpoints

### Authentication
```
POST /api/auth/login
Content-Type: application/json
Body: { "username": "admin", "password": "admin123" }
Response: { "success": true, "token": "jwt_token_here" }
```

### Nurse Management
```
GET /api/users
POST /api/users
DELETE /api/users/:id
GET /api/nurses/stats/all
GET /api/nurses/:nurseId/logs
POST /api/calls/complete-with-nurse
POST /api/init
```

### Logs (cần JWT token)
```
GET /api/logs
GET /api/logs/stats
GET /api/logs/by-room
Header: Authorization: Bearer {token}
```

### GUI Call Completion
```
POST /api/calls/complete
Body: { "roomId": "101", "callType": "Emergency" }
Response: { "success": true, "message": "Call completed" }
```

### GUI Call Completion with Nurse
```
POST /api/calls/complete-with-nurse
Body: { "roomId": "101", "callType": "Emergency", "nurseName": "Nguyễn Văn A", "nurseId": 1 }
Response: { "success": true, "message": "Call from room 101 marked as completed by Nguyễn Văn A" }
```

## 🔄 Kiến trúc Hệ thống

```
Device/Arduino
     ↓
C# GUI (LoginForm.cs → Form1.cs) - Đăng nhập y tá, xác nhận xử lý
     ↓
Backend API (Node.js/Express)
  ├→ WebSocket broadcast
  └→ SQLite Database + nurse management
     ↑
React Dashboard - Nhận cảnh báo real-time
```

**Permission Model:**
- **C# GUI**: WRITE access (gọi API để cập nhật)
- **Backend**: READ-WRITE (database source of truth)
- **Web Dashboard**: READ-ONLY + admin nurse management

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Tạo dữ liệu demo
curl -X POST http://localhost:5000/api/init

# Get logs (thay TOKEN bằng jwt token từ login)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/logs
```

### Test WebSocket

```javascript
// Mở browser console (F12)
const socket = io('http://localhost:5000');
socket.on('call-completed', (data) => console.log('Call completed:', data));
socket.on('data-update', (data) => console.log('Data updated:', data));
```

## 📁 Project Structure

```
web-nursecall/
├── assets/
│   ├── gui.png               # C# WinForms GUI screenshot
│   ├── web.png               # React dashboard screenshot
│   └── proteus.png           # Proteus circuit diagram screenshot
├── backend/
│   ├── index.js              # Main API server
│   ├── package.json          # Dependencies
│   ├── .env                  # Config (DATABASE_PATH, JWT_SECRET, PORT)
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Auth & routing
│   │   ├── components/       # Dashboard, Login, Cards, Charts, etc.
│   │   ├── services/api.js   # API client với JWT interceptor
│   │   └── utils/            # Audio & vibration utilities
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js        # Build config
│   ├── tailwind.config.js    # Tailwind CSS config
│   └── .gitignore
├── C#/
│   └── NurseCall/
│       ├── NurseCall.sln         # Visual Studio solution
│       ├── LoginForm.cs          # Nurse login screen
│       ├── Form1.cs              # Main Y tá interface (async/await)
│       ├── Form1.Designer.cs     # UI designer file
│       ├── CallDetailForm.cs     # Popup chi tiết với nút theo trạng thái
│       ├── DatabaseHelper.cs     # SQLite operations (AcceptCall, StartProcessing, CancelCall...)
│       ├── bin/Debug/
│       │   └── nurse_call.db     # Shared SQLite database
│       └── ... (other C# project files)
├── sketch_apr28a/
│   ├── sketch_apr28a.ino         # Arduino firmware code
│   │   └── Multi-room call logic
│   │   └── Serial communication (REQ/DONE protocol)
│   │   └── Emergency vs Normal call support
│   └── build/
│       └── arduino.avr.uno/      # Compiled Arduino binaries
│           ├── sketch_apr28a.ino.hex
│           ├── sketch_apr28a.ino.elf
│           └── ... (other build artifacts)
├── NurseSystem.zip              # Full C# project archive
├── README.md                    # This file
└── ... (config files)

**Key Files by Role:**
- Y tá (Nursing Staff): C#/NurseCall/LoginForm.cs, C#/NurseCall/Form1.cs
- Backend (API): backend/index.js
- Admin (Web): frontend/src/components/Dashboard.jsx
- Arduino (Hardware): sketch_apr28a/sketch_apr28a.ino
- Shared Database: C#/NurseCall/bin/Debug/nurse_call.db
- Screenshots: assets/*.png
```

**Component Architecture:**
1. **Backend** (`backend/`): Node.js Express API server
   - Manages SQLite database
   - Broadcasts WebSocket events
   - Provides REST endpoints for GUI & Web

2. **Frontend** (`frontend/`): React web dashboard
   - Admin interface with real-time monitoring
   - Authentication with JWT
   - Audio alerts & notifications

3. **C# GUI** (`C#/NurseCall/`): WinForms application for nursing staff
   - Connects to Arduino via COM port
   - Confirms task completion
   - Calls backend API
   - Falls back to local database if offline

4. **Arduino** (`sketch_apr28a/`): Microcontroller firmware
   - Receives push button inputs from 4 rooms
   - Sends call requests via serial port
   - Receives completion confirmation
   - Controls LED indicators & buzzer

5. **Database** (`C#/NurseCall/bin/Debug/nurse_call.db`): SQLite
   - Shared between C# GUI and backend
   - Source of truth for all call data
   - Real-time sync via WebSocket
  - User management tables: Users, NurseStats

## 🐛 Gỡ lỗi

### Backend không kết nối database
**Lỗi**: `Error opening database: ...`

**Giải pháp**:
1. Kiểm tra `backend/.env` có `DATABASE_PATH` đúng
2. Đảm bảo đường dẫn tồn tại hoặc folder tồn tại
3. Kiểm tra quyền đọc/ghi folder
4. Nếu C# app đang dùng DB, đảm bảo backend mở READ-ONLY

### Thống kê y tá hiển thị 0
**Lỗi**: Tổng yêu cầu, đã xử lý, tỷ lệ và thời gian TB đều bằng 0

**Giải pháp**:
1. Restart backend để load logic aggregate từ Logs
2. Kiểm tra y tá đã xử lý call bằng endpoint `/api/calls/complete-with-nurse`
3. Đảm bảo `Logs.NurseName` hoặc `CompletedBy` có dữ liệu
4. Gọi `GET /api/nurses/stats/all` để xem số liệu mới

### Thời gian phản hồi âm
**Lỗi**: `-419 phút` hoặc `-25198s`

**Giải pháp**:
1. Backend đã chuyển sang ghi ResponseTime theo local time
2. Dữ liệu cũ vẫn có thể âm, nhưng khi hiển thị sẽ được chặn về 0
3. Xóa dữ liệu test cũ nếu muốn số liệu sạch hoàn toàn

### Frontend không kết nối backend
**Lỗi**: `Network Error` hoặc `Failed to connect`

**Giải pháp**:
1. Kiểm tra backend đang chạy: `curl http://localhost:5000/api/health`
2. Nếu backend ở port khác, cập nhật `frontend/src/services/api.js`
3. CORS đã được enable ở backend

### Cổng đang sử dụng
**Lỗi**: `Port 3000 (hoặc 5000) already in use`

**Giải pháp**:
1. Sửa `PORT` trong `backend/.env` (ví dụ: `PORT=5001`)
2. Sửa `port` trong `frontend/vite.config.js` (ví dụ: `port: 3001`)
3. Hoặc tìm process dùng port: `lsof -i :5000` (macOS/Linux) hoặc `netstat -ano | findstr :5000` (Windows)

### Không nghe được audio alert
**Lỗi**: Cảnh báo hiển thị nhưng không có tiếng

**Giải pháp**:
1. Kiểm tra volume browser & máy
2. Browser cần user interaction trước (click/enter trang)
3. Một số browser yêu cầu HTTPS cho audio/vibration

## 🌐 Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Output: dist/ folder - sẵn sàng deploy
```

### Production Backend
1. Dùng process manager như PM2
2. Set `NODE_ENV=production` trong `.env`
3. Dùng reverse proxy (nginx/Apache)
4. **QUAN TRỌNG**: Đổi `JWT_SECRET` thành key mạnh

## 📝 Ghi chú quan trọng

- **Demo Mode**: Admin password cứng (không production)
- **Database Locking**: Backend mở READ-ONLY để tránh conflict
- **Vibration API**: Chỉ hoạt động trên mobile hỗ trợ
- **WebSocket**: Auto reconnect khi mất kết nối
- **Real-time Updates**: Dashboard tự động refresh mỗi 4 giây

## 📧 Support

Nếu gặp vấn đề:
1. Kiểm tra backend logs: mở terminal backend, xem console output
2. Kiểm tra frontend logs: F12 → Console tab
3. Xem Network tab (F12) để debug API calls
4. Đảm bảo `DATABASE_PATH` đúng trong `.env`
5. Restart backend & frontend

---

**Version**: 1.1.0  
**Last Updated**: May 2026" 
