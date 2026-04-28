# 📁 Project Structure & File Guide

## Complete Directory Structure

```
web-nursecall/
│
├── 📄 README.md                    # Main project documentation
├── 📄 INSTALLATION.md              # Step-by-step installation guide
├── 📄 CUSTOMIZATION.md             # How to customize the system
├── 📄 API.md                       # API documentation & examples
├── 📄 QUICKSTART.md                # Quick setup scripts
├── 📄 STRUCTURE.md                 # This file
│
├── backend/                        # Node.js Express Backend
│   ├── 📄 index.js                # Main server file (325 lines)
│   ├── 📄 package.json            # Dependencies
│   ├── 📄 .env                    # Environment variables
│   ├── 📄 .gitignore              # Git ignore file
│   └── node_modules/              # Dependencies (auto-generated)
│
├── frontend/                       # React + Vite Frontend
│   ├── 📄 index.html              # HTML entry point
│   ├── 📄 vite.config.js          # Vite build configuration
│   ├── 📄 tailwind.config.js      # Tailwind CSS configuration
│   ├── 📄 postcss.config.cjs      # PostCSS configuration
│   ├── 📄 package.json            # Dependencies
│   ├── 📄 .gitignore              # Git ignore file
│   │
│   ├── src/                       # Source code
│   │   ├── 📄 main.jsx            # React entry point (8 lines)
│   │   ├── 📄 App.jsx             # Main app component (7 lines)
│   │   ├── 📄 index.css           # Global styles (35 lines)
│   │   │
│   │   ├── components/            # React Components
│   │   │   ├── 📄 Dashboard.jsx   # Main dashboard (230 lines)
│   │   │   ├── 📄 Cards.jsx       # Stat cards & badges (95 lines)
│   │   │   ├── 📄 LogsTable.jsx   # Sortable data table (140 lines)
│   │   │   └── 📄 Charts.jsx      # Recharts visualizations (180 lines)
│   │   │
│   │   └── services/              # API Services
│   │       └── 📄 api.js          # API client (50 lines)
│   │
│   ├── dist/                      # Built files (created by `npm run build`)
│   └── node_modules/              # Dependencies (auto-generated)
│
└── .git/                          # Git repository data
```

## File Descriptions

### Documentation Files

#### README.md (350+ lines)
- Project overview
- Quick start instructions
- Features list
- API endpoints summary
- Troubleshooting guide
- Deployment notes

#### INSTALLATION.md (400+ lines)
- Prerequisites checklist
- Step-by-step backend setup
- Step-by-step frontend setup
- Verification steps
- Troubleshooting for installation issues
- Production deployment guide

#### CUSTOMIZATION.md (350+ lines)
- Frontend customization guide
- Backend customization guide
- Color and style changes
- Layout modifications
- Adding new endpoints
- Performance optimization tips

#### API.md (450+ lines)
- Base URL and endpoints
- Health check endpoint
- Get all logs endpoint
- Statistics endpoint
- Logs by room endpoint
- Usage examples (JavaScript, Python, Postman)
- Error handling guide
- Testing scripts

#### QUICKSTART.md (350+ lines)
- Automated setup scripts
- Manual quick start
- Docker setup (optional)
- Commands reference
- Environment setup
- Verification checklist

---

## Backend Files (Node.js)

### index.js (325 lines)
**Purpose:** Main Express server with database queries

**Key Functions:**
- `openDatabase()` - Opens SQLite in READ-ONLY mode
- `GET /api/health` - Server health check
- `GET /api/logs` - Fetch all logs
- `GET /api/logs/stats` - System statistics
- `GET /api/logs/by-room` - Logs grouped by room
- Error handling and middleware

**Key Features:**
- CORS enabled
- Database read-only mode to prevent conflicts
- Detailed logging
- Proper error handling

### package.json
**Purpose:** Project dependencies and scripts

**Dependencies:**
- `express` v4.18.2 - Web framework
- `sqlite3` v5.1.6 - Database driver
- `cors` v2.8.5 - CORS middleware
- `dotenv` v16.3.1 - Environment variables

**Dev Dependencies:**
- `nodemon` v3.0.1 - Auto-restart on changes

**Scripts:**
- `npm start` - Run production server
- `npm run dev` - Run dev server with nodemon

### .env
**Purpose:** Environment variables

**Variables:**
- `PORT` - Server port (default: 5000)
- `DATABASE_PATH` - Path to SQLite database file
- `NODE_ENV` - Environment (development/production)

### .gitignore
**Purpose:** Files to exclude from git

**Excluded:**
- node_modules/
- .env
- *.log
- dist/

---

## Frontend Files (React + Vite)

### index.html (15 lines)
**Purpose:** HTML entry point

**Contents:**
- Meta tags for viewport and charset
- Root div for React
- Script reference to main.jsx

### vite.config.js (20 lines)
**Purpose:** Vite build tool configuration

**Configuration:**
- React plugin
- Development server port (3000)
- Proxy for API calls to backend

### tailwind.config.js (15 lines)
**Purpose:** Tailwind CSS configuration

**Configuration:**
- Content paths for scanning
- Custom animations (blink)
- Theme extensions

### postcss.config.cjs (8 lines)
**Purpose:** PostCSS configuration for Tailwind

**Plugins:**
- tailwindcss
- autoprefixer

### src/main.jsx (8 lines)
**Purpose:** React application entry point

**Imports:**
- React and ReactDOM
- Styles
- Main App component

**Renders:** App component to root element

### src/App.jsx (7 lines)
**Purpose:** Main application component

**Exports:** Dashboard component

### src/index.css (35 lines)
**Purpose:** Global styles

**Includes:**
- Tailwind directives
- Custom scrollbar styles
- Font configuration
- Animation keyframes

---

## Frontend Component Files

### src/components/Dashboard.jsx (230 lines)
**Purpose:** Main dashboard layout and logic

**Features:**
- Data fetching with useEffect
- Auto-refresh every 4 seconds
- Statistics cards display
- Emergency alerts section
- Charts section
- Data table section
- Header with connection status
- Footer with update info

**Key Hooks:**
- `useState` for state management
- `useEffect` for data fetching and auto-refresh

**API Calls:**
- logsService.getAllLogs()
- logsService.getStats()
- logsService.getLogsByRoom()

### src/components/Cards.jsx (95 lines)
**Purpose:** Reusable card components

**Components:**
1. **StatCard**
   - Displays single metric
   - Shows icon and value
   - Loading state
   - Customizable colors

2. **EmergencyAlert**
   - Special alert for pending emergencies
   - Pulse animation when count > 0
   - Urgent warning message

3. **StatusBadge**
   - Shows status (Pending/Completed)
   - Red blinking for pending emergencies
   - Color-coded by status type

4. **CallTypeBadge**
   - Shows call type (Normal/Emergency)
   - Color-coded icons
   - Different colors for each type

### src/components/LogsTable.jsx (140 lines)
**Purpose:** Sortable data table

**Features:**
- Sortable columns (click header to sort)
- Alternating row colors
- Red background with blinking for pending emergencies
- Date/time formatting (Vietnamese locale)
- Multiple sort indicators
- Responsive design

**Key Functions:**
- `handleSort()` - Toggle sort column/direction
- `formatDateTime()` - Format dates for display
- Sorting logic with useMemo for performance

**Columns:**
1. ID
2. Room (blue badge)
3. Type (colored by emergency status)
4. Request Time
5. Response Time
6. Status (color-coded)

### src/components/Charts.jsx (180 lines)
**Purpose:** Data visualization components

**Charts:**

1. **RoomCallsChart**
   - Bar chart showing calls per room
   - Displays total calls and emergency calls
   - Uses Recharts BarChart

2. **EmergencyDistribution**
   - Pie chart showing emergency vs normal calls
   - Percentage labels
   - Color-coded (red/blue)

3. **CompletionRateChart**
   - Pie chart showing completion rate
   - Shows completed vs pending percentages
   - Green/yellow colors

**Features:**
- Loading states for all charts
- Responsive containers
- Custom tooltip styling
- Empty state handling

---

## Frontend Service Files

### src/services/api.js (50 lines)
**Purpose:** API client for backend communication

**Exports:** `logsService` object with methods:
- `getAllLogs()` - GET /api/logs
- `getStats()` - GET /api/logs/stats
- `getLogsByRoom()` - GET /api/logs/by-room
- `healthCheck()` - GET /api/health

**Features:**
- Axios instance with base URL
- Error handling
- Automatic JSON parsing
- Centralized API configuration

---

## File Statistics

| Category | Count | Lines |
|----------|-------|-------|
| Documentation | 5 | 2000+ |
| Backend | 4 | 350+ |
| Frontend Config | 4 | 60 |
| Frontend Components | 4 | 650+ |
| Frontend Services | 1 | 50 |
| **Total** | **22** | **3100+** |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Frontend)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App.jsx → Dashboard.jsx (Main Component)            │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ useEffect Hook (4s interval)                │    │   │
│  │  │ - Calls api.js service methods              │    │   │
│  │  │ - Updates state (logs, stats, roomData)     │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │         ↓ (renders components)                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Cards.jsx     - Stat cards                  │   │   │
│  │  │ Charts.jsx    - Data visualizations        │   │   │
│  │  │ LogsTable.jsx - Sortable data table        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓ (HTTP)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                 http://localhost:5000
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   NODE.js SERVER (Backend)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express App (index.js)                             │   │
│  │                                                       │   │
│  │  ├─ GET /api/logs                                  │   │
│  │  │  └─ Query: SELECT * FROM Logs                  │   │
│  │  │                                                  │   │
│  │  ├─ GET /api/logs/stats                           │   │
│  │  │  └─ Query: COUNT/SUM aggregations              │   │
│  │  │                                                  │   │
│  │  ├─ GET /api/logs/by-room                         │   │
│  │  │  └─ Query: GROUP BY RoomId                     │   │
│  │  │                                                  │   │
│  │  └─ Error handlers & middleware                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓ (OPEN_READONLY)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               SQLite Database (READ-ONLY)                    │
│                                                               │
│  C:\Users\Lenovo\Downloads\iot-project-final\...             │
│  \C#\NurseCall\NurseCall\bin\Debug\nurse_call.db             │
│                                                               │
│  Table: Logs                                                  │
│  ├─ Id (INTEGER PRIMARY KEY)                                 │
│  ├─ RoomId (TEXT)                                            │
│  ├─ CallType (TEXT: 'Normal' or 'Emergency')                 │
│  ├─ RequestTime (DATETIME)                                   │
│  ├─ ResponseTime (DATETIME)                                  │
│  └─ Status (TEXT: 'Pending' or 'Completed')                  │
│                                                               │
│  ← (Data written by C# application)                          │
│  → (Data read by our dashboard)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Import Dependencies

### Frontend Imports
```javascript
// React
import React, { useState, useEffect } from 'react'

// Icons (Lucide)
import { Activity, AlertTriangle, CheckCircle2, Phone } from 'lucide-react'

// Charts (Recharts)
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// HTTP Client
import axios from 'axios'
```

### Backend Imports
```javascript
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')
require('dotenv').config()
```

---

## Component Hierarchy

```
App
└── Dashboard
    ├── Header
    │   ├── Title
    │   └── Status Indicator
    ├── Stats Section
    │   ├── StatCard (Total Calls)
    │   ├── StatCard (Emergency Calls)
    │   ├── StatCard (Completed)
    │   └── StatCard (Completion Rate)
    ├── Emergency Alert
    │   └── EmergencyAlert
    ├── Charts Section
    │   ├── RoomCallsChart (BarChart)
    │   └── EmergencyDistribution (PieChart)
    ├── Completion Rate Section
    │   └── CompletionRateChart (PieChart)
    ├── Data Table Section
    │   ├── Refresh Button
    │   └── LogsTable (with sorting)
    └── Footer
```

---

## Configuration Files Summary

| File | Purpose | Key Settings |
|------|---------|--------------|
| package.json (backend) | Dependencies | express, sqlite3, cors, dotenv |
| package.json (frontend) | Dependencies | react, vite, tailwindcss, recharts |
| .env (backend) | Variables | PORT, DATABASE_PATH, NODE_ENV |
| vite.config.js | Build settings | port: 3000, proxy to backend |
| tailwind.config.js | CSS settings | Custom animations, colors |
| index.html | HTML entry | Root div, meta tags |

---

## How Files Work Together

### Startup Flow
1. User runs `npm start` in backend/ → starts Express on port 5000
2. User runs `npm run dev` in frontend/ → starts Vite on port 3000
3. Browser opens localhost:3000
4. React loads App.jsx → Dashboard.jsx
5. useEffect fetches data from /api/logs
6. Data displays in components

### Data Update Flow
1. Every 4 seconds, useEffect runs again
2. Calls logsService methods (api.js)
3. Axios sends HTTP requests to backend
4. Backend queries SQLite database
5. Returns JSON data
6. React updates state
7. Components re-render with new data

### User Interaction Flow
1. User clicks table column header
2. handleSort() called in LogsTable
3. Data sorted in memory (useMemo)
4. Table re-renders with new sort order
5. No new API calls (data already loaded)

---

## Best Practices Used

✅ **Backend:**
- Database in read-only mode
- Proper error handling
- CORS configuration
- Environment variables
- Structured response format

✅ **Frontend:**
- Component composition
- Custom hooks usage
- Proper state management
- Performance optimization (useMemo)
- Responsive design
- Accessibility considerations

✅ **Code Organization:**
- Separated concerns (components, services)
- Reusable components
- Centralized API calls
- Clear file naming

---

## Future Enhancement Opportunities

### Backend
- [ ] Add data filtering endpoints
- [ ] Implement pagination
- [ ] Add export to CSV/Excel
- [ ] Add authentication
- [ ] Add caching layer
- [ ] Add database migrations

### Frontend
- [ ] Add advanced filters
- [ ] Implement search functionality
- [ ] Add notifications/alerts
- [ ] Add settings page
- [ ] Add dark mode
- [ ] Add PWA capability

---

## Performance Notes

- **Dashboard reloads every 4 seconds** (configurable)
- **Table sorts are in-memory** (no API calls)
- **Components use React.memo** optimization
- **Charts use ResponsiveContainer** for better performance
- **No pagination yet** (for small datasets, <1000 records)

For production with >5000 records:
- Implement pagination
- Add virtual scrolling
- Cache statistics
- Throttle API calls

---

This structure ensures scalability, maintainability, and clear separation of concerns!
