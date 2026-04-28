# 🎨 Customization Guide

## Frontend Customization

### 1. Change Refresh Interval

**File:** `frontend/src/components/Dashboard.jsx`

Find this line (around line 11):
```javascript
const REFRESH_INTERVAL = 4000; // 4 seconds
```

Change to your desired interval in milliseconds:
- 2000 = 2 seconds (more frequent updates)
- 5000 = 5 seconds (default)
- 10000 = 10 seconds (less frequent)

### 2. Modify Colors

**Tailwind Classes Used:**
- Primary: `from-blue-600 to-blue-700` (blue)
- Emergency/Alert: `from-red-500 to-red-600` (red)
- Success: `from-green-500 to-green-600` (green)
- Warning: `from-orange-500 to-orange-600` (orange)

**To change colors:**

In `frontend/src/components/Dashboard.jsx`, modify StatCard calls:
```javascript
// Change blue to purple
<StatCard
  title="Total Calls"
  value={stats?.totalLogs || 0}
  icon={Activity}
  bgColor="bg-gradient-to-br from-purple-500 to-purple-600"  // Changed
  textColor="text-purple-100"  // Changed
  loading={loading}
/>
```

### 3. Customize Animation Speeds

**Blinking Animation:**

File: `frontend/tailwind.config.js`

```javascript
keyframes: {
  blink: {
    '0%, 49%, 100%': { opacity: '1' },
    '50%': { opacity: '0.3' }  // Change 0.3 to 0.5 for less intense blink
  }
}
```

### 4. Add More Chart Types

In `frontend/src/components/Charts.jsx`, you can add:

```javascript
import { LineChart, Line } from 'recharts';

export const TimeSeriesChart = ({ data, loading }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="RequestTime" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="callCount" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### 5. Modify Table Columns

**File:** `frontend/src/components/LogsTable.jsx`

To add a new column, modify the table header and body:

```javascript
<th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>

// In tbody:
<td className="px-6 py-4 text-sm text-gray-600">
  {log.responseDuration ? `${Math.round(log.responseDuration / 1000)}s` : 'N/A'}
</td>
```

### 6. Change Font Styles

**File:** `frontend/src/index.css`

```css
body {
  font-family: 'Your-Font-Name', sans-serif;  /* Change here */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Available font options:
- System fonts: `system-ui`, `-apple-system`, `sans-serif`
- Web fonts: Import from Google Fonts

### 7. Customize Card Styling

**File:** `frontend/src/components/Cards.jsx`

Modify StatCard shadow and styling:
```javascript
<div className={`${bgColor} rounded-lg shadow-lg p-6 text-white hover:shadow-2xl transform hover:scale-105 transition`}>
  {/* Change shadow-md to shadow-lg or shadow-xl */}
  {/* Change rounded-lg to rounded-xl for more rounded */}
  {/* Add hover effects */}
</div>
```

---

## Backend Customization

### 1. Change Database Path

**File:** `backend/.env`

```
DATABASE_PATH=C:\path\to\your\database.db
```

### 2. Adjust Port

**File:** `backend/.env`

```
PORT=5001  # or any available port
```

Then update frontend proxy in `frontend/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5001',  // Update port here too
    changeOrigin: true,
  }
}
```

### 3. Add Custom API Endpoints

**File:** `backend/index.js`

Add new endpoint after existing ones:

```javascript
// GET logs filtered by call type
app.get('/api/logs/by-type/:type', async (req, res) => {
  try {
    const db = await openDatabase();
    const { type } = req.params;
    
    db.all(
      `SELECT * FROM Logs WHERE CallType = ? ORDER BY RequestTime DESC`,
      [type],
      (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ error: 'Query failed' });
        res.json(rows);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 4. Add Logging

```javascript
const fs = require('fs');

// Simple file logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('server.log', `[${timestamp}] ${message}\n`);
};

log('Server started');
```

### 5. Add Data Filtering

In `backend/index.js`, add query parameters:

```javascript
app.get('/api/logs', async (req, res) => {
  const { roomId, status, type } = req.query;
  
  let query = `SELECT * FROM Logs WHERE 1=1`;
  const params = [];
  
  if (roomId) {
    query += ` AND RoomId = ?`;
    params.push(roomId);
  }
  if (status) {
    query += ` AND Status = ?`;
    params.push(status);
  }
  if (type) {
    query += ` AND CallType = ?`;
    params.push(type);
  }
  
  query += ` ORDER BY RequestTime DESC`;
  
  // Execute query with params
});
```

Usage: `http://localhost:5000/api/logs?roomId=101&status=Pending`

### 6. Add CORS for Specific Origins

**File:** `backend/index.js`

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### 7. Add Error Handling Middleware

```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message,
    timestamp: new Date().toISOString()
  });
});
```

---

## Dashboard Layout Customization

### Change Grid Columns

**File:** `frontend/src/components/Dashboard.jsx`

```javascript
// Stats cards - change from 4 columns to 2
<section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  {/* Stats cards */}
</section>

// Charts - change layout
<section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  {/* Charts */}
</section>
```

Grid options: `grid-cols-1`, `grid-cols-2`, `grid-cols-3`, `grid-cols-4`

### Customize Header

```javascript
<header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl">
  {/* Modify colors and shadow */}
</header>
```

---

## Common Customizations Checklist

- [ ] Change refresh interval to match your needs
- [ ] Update colors to match your branding
- [ ] Modify table columns to show relevant data
- [ ] Adjust emergency alert sensitivity
- [ ] Add custom API endpoints
- [ ] Configure CORS for specific origins
- [ ] Set up proper logging
- [ ] Test with real database data

---

## Performance Optimization Tips

1. **Reduce Refresh Interval** if data updates are critical
2. **Increase Refresh Interval** if server is under heavy load
3. **Add Pagination** to table if > 1000 logs
4. **Implement Caching** in backend for stats
5. **Use React.memo** for component optimization
6. **Lazy Load** charts if dashboard feels slow

See individual component files for specific optimization opportunities.
