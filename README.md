"# Smart Nurse Call System

IoT-based nurse call system với real-time monitoring dashboard, automatic alerts, và multi-user support. Hệ thống gồm 3 thành phần: C# GUI (y tá), Node.js Backend (API server), và React Web Dashboard (quản trị).

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

### 4. Kết nối C# GUI (tùy chọn)

Nếu có C# WinForms app:
- Đảm bảo Backend đang chạy (`http://localhost:5000`)
- Database path trong C# project phải trỏ đến cùng file SQLite
- Cổng COM phải đúng với Arduino device

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
✅ **Fallback Mode**: GUI hoạt động nếu backend down  

## � Screenshots

### 1. C# WinForms GUI - Giao diện Y tá
Giao diện cho y tá xác nhận xử lý cuộc gọi từ bệnh nhân:
- Kết nối COM port với Arduino
- Bảng hàng đợi hiển thị cuộc gọi chờ xử lý
- Phân biệt cuộc gọi khẩn cấp (hồng) và thường (xanh)
- Nút "XÁC NHẬN XỰ LÝ" để hoàn thành
- Nhật ký hệ thống theo dõi tất cả thao tác

![C# GUI Dashboard](assets/gui.png)

### 2. React Web Dashboard - Giao diện Quản trị
Bảng điều khiển web cho quản trị viên giám sát real-time:
- Thống kê tổng hợp: tổng cuộc gọi, khẩn cấp, đã hoàn thành, tỷ lệ %
- Cảnh báo khẩn cấp nổi bật (màu đỏ) với thông báo âm thanh
- Danh sách cuộc gọi chưa xử lý
- Biểu đồ phân tích theo phòng và loại cuộc gọi
- Giao diện tối ưu: xám/trắng với đỏ cho cảnh báo

![React Dashboard](assets/web.png)

### 3. Proteus 8 Circuit Design - Sơ đồ mạch điện
Thiết kế mạch điện cho hệ thống phần cứng:
- Arduino Uno làm bộ xử lý trung tâm
- 4 nút bấm cho 4 phòng bệnh (P1, P2, P3, P4)
- 8 LED chỉ báo trạng thái (4 xanh + 4 đỏ)
- Buzzer để phát cảnh báo âm thanh
- Module RS232 để kết nối với máy tính (COM port)
- Thiết kế xử lý đơn giản, tin cậy

![Proteus Circuit Diagram](assets/proteus.png)

## �📡 API Endpoints

### Authentication
```
POST /api/auth/login
Content-Type: application/json
Body: { "username": "admin", "password": "admin123" }
Response: { "success": true, "token": "jwt_token_here" }
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

## 🔄 Kiến trúc Hệ thống

```
Device/Arduino
     ↓
C# GUI (Form1.cs) - Xác nhận xử lý
     ↓
Backend API (Node.js/Express)
     ├→ WebSocket broadcast
     └→ SQLite Database
     ↑
React Dashboard - Nhận cảnh báo real-time
```

**Permission Model:**
- **C# GUI**: WRITE access (gọi API để cập nhật)
- **Backend**: READ-WRITE (database source of truth)
- **Web Dashboard**: READ-ONLY (nhận data qua WebSocket)

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

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
│       ├── Form1.cs              # Main Y tá interface
│       ├── Form1.Designer.cs     # UI designer file
│       ├── DatabaseHelper.cs     # SQLite operations
│       ├── SerialPortManager.cs  # Arduino COM communication
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
- Y tá (Nursing Staff): C#/NurseCall/Form1.cs
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

## 🐛 Gỡ lỗi

### Backend không kết nối database
**Lỗi**: `Error opening database: ...`

**Giải pháp**:
1. Kiểm tra `backend/.env` có `DATABASE_PATH` đúng
2. Đảm bảo đường dẫn tồn tại hoặc folder tồn tại
3. Kiểm tra quyền đọc/ghi folder
4. Nếu C# app đang dùng DB, đảm bảo backend mở READ-ONLY

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

**Version**: 1.0.0  
**Last Updated**: April 2026" 
