# 🔄 Kiến Trúc Phân Quyền & Sync Data

## Vấn đề Ban Đầu
- **GUI (Y tá)** cập nhật DB trực tiếp → **Web (Admin)** không biết được khi nào hoàn thành
- **Phân quyền rối**: Web chỉ read-only, GUI write trực tiếp
- **Thông báo không sync**: GUI xác nhận ≠ Web nhận được cảnh báo

---

## ✅ Giải Pháp Mới

### **Flow Hoàn Chỉnh:**

```
[Arduino]
    ↓
    │ Serial: REQ:101:E
    ↓
┌─────────────────────────┐
│    GUI (Form1.cs)       │
│  - Hiển thị queue       │
│  - Y tá click: ✓ XÁC NHẬN│
└──────────┬──────────────┘
           │
           ├─→ Serial: DONE:101:E (→ Arduino)
           │
           └─→ HTTP POST: /api/calls/complete
                 { roomId: 101, callType: "Emergency" }
                 ↓
         ┌───────────────────────────┐
         │  Backend (Node.js)        │
         │  ✓ Update DB              │
         │  ✓ Broadcast WebSocket    │
         └───────────┬───────────────┘
                     │
        ┌────────────┼────────────┐
        ↓                         ↓
    ┌─────────────┐       ┌──────────────┐
    │ WEB (React) │       │   DB (Read)  │
    │ • Alert     │       │   Status=Done│
    │ • Update UI │       └──────────────┘
    │ • Fetch logs│
    └─────────────┘
```

---

## 📋 Chi Tiết từng Bước

### **1. GUI Xác Nhận (Form1.cs)**
```csharp
// Y tá click nút "XÁC NHẬN"
// GUI sẽ:
serialPort1.WriteLine($"DONE:{roomId}:{typeCode}");  // → Arduino
await client.PostAsync("/api/calls/complete", {...}); // → Backend
```

### **2. Backend Nhận & Broadcast (index.js)**
```javascript
POST /api/calls/complete
{
  roomId: "101",
  callType: "Emergency"
}

// Backend:
// 1. UPDATE DB (Status = 'Completed', ResponseTime = NOW)
// 2. io.emit('call-completed', {...}) → ALL Web clients
```

### **3. Web Nhận Update (Dashboard.jsx)**
```javascript
socket.on('call-completed', (data) => {
  // Hiển thị alert hoàn thành
  // Fetch data mới
})
```

---

## 🔐 Phân Quyền Rõ Ràng

| Component | Quyền | Hành động |
|-----------|------|----------|
| **GUI (Y tá)** | WRITE | Xác nhận → Gọi API |
| **Backend** | READ + WRITE | Source of Truth |
| **Web (Admin)** | READ | Chỉ xem, không edit |
| **Database** | Được update bởi Backend | Qua API, không trực tiếp |

---

## 🔄 Fallback Mode

**Nếu Network mất:**
```csharp
// GUI vẫn update DB trực tiếp (Fallback)
DatabaseHelper.CompleteCall(rId, fullType);
// → Log: "DB đã được cập nhật trực tiếp (Fallback mode)"
```

---

## 📊 Lợi Ích

✅ **Đơn giản hóa quyền hạn**: Mỗi component rõ ràng, không rối  
✅ **Real-time sync**: Web tức thì biết khi GUI hoàn thành  
✅ **Reliable**: Có fallback nếu API gặp lỗi  
✅ **Audit trail**: Backend là nguồn sự thật  
✅ **Scalable**: Dễ thêm tính năng sau  

---

## 🚀 Cách Sử Dụng

### **Khi chạy:**

1. **Backend** (Node.js - port 5000)
2. **Frontend** (React - port 3000)
3. **GUI** (C# WinForms)

### **Test Flow:**
```
1. Y tá kết nối Arduino qua GUI
2. Arduino gửi yêu cầu → GUI hiển thị
3. Y tá click "XÁC NHẬN XỬ LÝ"
   → Form1.cs gọi POST /api/calls/complete
4. Backend cập nhật + Broadcast
5. Web nhận WebSocket event → Hiển thị alert ✓
```

---

## 📝 API Endpoints

### **Từ GUI:**
- `POST /api/calls/complete` - Y tá xác nhận hoàn thành

### **Từ Web:**
- `GET /api/logs` - Lấy danh sách cuộc gọi
- `GET /api/logs/stats` - Lấy thống kê
- `GET /api/logs/by-room` - Lấy dữ liệu theo phòng

### **WebSocket Events:**
- `call-completed` - Backend gửi khi hoàn thành
- `new-alert` - Backend gửi alert mới
- `log-update` - Backend gửi log update
