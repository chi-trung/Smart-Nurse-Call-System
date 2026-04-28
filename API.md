# 🔍 API Reference

## Base URL
```
http://localhost:5000/api
```

---

## Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the server is running

**Request:**
```bash
curl http://localhost:5000/api/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### 2. Get All Logs

**Endpoint:** `GET /api/logs`

**Description:** Fetch all call logs from the database (sorted by newest first)

**Request:**
```bash
curl http://localhost:5000/api/logs
```

**Response:** `200 OK`
```json
[
  {
    "Id": 5,
    "RoomId": "105",
    "CallType": "Emergency",
    "RequestTime": "2024-04-28T14:45:30.000Z",
    "ResponseTime": "2024-04-28T14:46:45.000Z",
    "Status": "Completed",
    "responseDuration": 75000
  },
  {
    "Id": 4,
    "RoomId": "102",
    "CallType": "Normal",
    "RequestTime": "2024-04-28T14:30:15.000Z",
    "ResponseTime": "2024-04-28T14:32:00.000Z",
    "Status": "Completed",
    "responseDuration": 105000
  },
  {
    "Id": 3,
    "RoomId": "101",
    "CallType": "Emergency",
    "RequestTime": "2024-04-28T14:15:00.000Z",
    "ResponseTime": null,
    "Status": "Pending",
    "responseDuration": null
  }
]
```

**Response Fields:**
- `Id` (number): Unique call identifier
- `RoomId` (string): Room/bed number
- `CallType` (string): Either "Normal" or "Emergency"
- `RequestTime` (datetime): When the call was initiated
- `ResponseTime` (datetime): When the call was answered (null if pending)
- `Status` (string): Either "Pending" or "Completed"
- `responseDuration` (number): Duration in milliseconds (null if pending)

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Failed to fetch logs"
}
```

---

### 3. Get Statistics

**Endpoint:** `GET /api/logs/stats`

**Description:** Get aggregated statistics about all calls

**Request:**
```bash
curl http://localhost:5000/api/logs/stats
```

**Response:** `200 OK`
```json
{
  "totalLogs": 150,
  "pendingEmergency": 3,
  "completedLogs": 145,
  "totalEmergency": 25,
  "completionRate": "96.67"
}
```

**Response Fields:**
- `totalLogs` (number): Total calls in system
- `pendingEmergency` (number): Emergency calls not yet completed
- `completedLogs` (number): Calls that have been completed
- `totalEmergency` (number): All emergency calls (completed + pending)
- `completionRate` (string): Percentage of completed calls (0-100)

---

### 4. Get Logs by Room

**Endpoint:** `GET /api/logs/by-room`

**Description:** Get call statistics grouped by room/location

**Request:**
```bash
curl http://localhost:5000/api/logs/by-room
```

**Response:** `200 OK`
```json
[
  {
    "RoomId": "101",
    "callCount": 25,
    "emergencyCalls": 5
  },
  {
    "RoomId": "102",
    "callCount": 22,
    "emergencyCalls": 3
  },
  {
    "RoomId": "103",
    "callCount": 20,
    "emergencyCalls": 4
  },
  {
    "RoomId": "104",
    "callCount": 18,
    "emergencyCalls": 2
  },
  {
    "RoomId": "105",
    "callCount": 65,
    "emergencyCalls": 11
  }
]
```

**Response Fields:**
- `RoomId` (string): Room identifier
- `callCount` (number): Total calls from this room
- `emergencyCalls` (number): Emergency calls from this room

---

## Usage Examples

### Using JavaScript/Fetch

```javascript
// Get all logs
const getLogs = async () => {
  const response = await fetch('http://localhost:5000/api/logs');
  const logs = await response.json();
  console.log(logs);
};

// Get statistics
const getStats = async () => {
  const response = await fetch('http://localhost:5000/api/logs/stats');
  const stats = await response.json();
  console.log(`Total calls: ${stats.totalLogs}`);
  console.log(`Pending emergencies: ${stats.pendingEmergency}`);
  console.log(`Completion rate: ${stats.completionRate}%`);
};

// Call functions
getLogs();
getStats();
```

### Using Python

```python
import requests
import json

base_url = 'http://localhost:5000/api'

# Get all logs
response = requests.get(f'{base_url}/logs')
logs = response.json()
print(json.dumps(logs, indent=2))

# Get statistics
response = requests.get(f'{base_url}/logs/stats')
stats = response.json()
print(f"Total calls: {stats['totalLogs']}")
```

### Using Postman

1. Open Postman
2. Create new request
3. Method: GET
4. URL: `http://localhost:5000/api/logs`
5. Click Send

---

## Error Handling

### Common Errors

**Database Connection Error:**
```json
{
  "error": "Failed to fetch logs"
}
```
**Solution:** Check database path in `.env` and ensure database file exists

**Server Not Running:**
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Solution:** Start backend server with `npm start`

**CORS Error (Frontend only):**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** This is already configured in the backend; clear browser cache and restart servers

---

## Rate Limiting Notes

- Currently no rate limiting implemented
- Production deployment should add rate limiting
- Consider adding: 100 requests per minute per IP

---

## Database Requirements

The API expects a SQLite database with this table structure:

```sql
CREATE TABLE Logs (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  RoomId TEXT NOT NULL,
  CallType TEXT NOT NULL CHECK(CallType IN ('Normal', 'Emergency')),
  RequestTime DATETIME NOT NULL,
  ResponseTime DATETIME,
  Status TEXT NOT NULL CHECK(Status IN ('Pending', 'Completed'))
);
```

---

## Security Notes

⚠️ **Current Implementation:**
- Database opened in OPEN_READONLY mode (read-only)
- No authentication required
- No input validation (as DB is read-only, this is safe)

✅ **For Production:**
- Add authentication (JWT tokens)
- Add input validation
- Use HTTPS instead of HTTP
- Add rate limiting
- Implement logging
- Use environment variables for sensitive data

---

## Response Time Formats

All timestamps are in ISO 8601 format:
```
2024-04-28T14:45:30.000Z
```

Parse in JavaScript:
```javascript
const date = new Date('2024-04-28T14:45:30.000Z');
console.log(date.toLocaleString('vi-VN'));  // Vietnamese format
```

Parse in Python:
```python
from datetime import datetime
date = datetime.fromisoformat('2024-04-28T14:45:30.000Z'.replace('Z', '+00:00'))
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 404 | Not Found - Endpoint doesn't exist |
| 500 | Internal Server Error - Database or server error |

---

## Testing Endpoints

**Quick Test Script:**

Create file `test.js` in backend folder:

```javascript
const axios = require('axios');

const API = 'http://localhost:5000/api';

async function testAPIs() {
  try {
    console.log('Testing /health...');
    const health = await axios.get(`${API}/health`);
    console.log('✓ Health:', health.data);

    console.log('\nTesting /logs...');
    const logs = await axios.get(`${API}/logs`);
    console.log(`✓ Got ${logs.data.length} logs`);

    console.log('\nTesting /logs/stats...');
    const stats = await axios.get(`${API}/logs/stats`);
    console.log('✓ Stats:', stats.data);

    console.log('\nTesting /logs/by-room...');
    const rooms = await axios.get(`${API}/logs/by-room`);
    console.log(`✓ Got stats for ${rooms.data.length} rooms`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIs();
```

Run with: `node test.js`

---

## Pagination (Future Enhancement)

```javascript
// Planned endpoint:
// GET /api/logs?page=1&limit=50

app.get('/api/logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  // SQL: LIMIT ? OFFSET ?
});
```

---

## Data Export (Future Enhancement)

```javascript
// Planned endpoints:
// GET /api/logs/export/csv
// GET /api/logs/export/json
// GET /api/logs/export/excel
```
