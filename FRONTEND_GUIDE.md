# BrigadníkOS - Frontend Applications Guide

## 🎨 Complete Frontend Implementation

All 4 frontend applications have been built and are production-ready!

### ✅ Applications Created

1. **Manager Portal** (React + Material-UI) - `web-manager/`
2. **HQ Analytics Portal** (React + Material-UI) - `web-hq/`
3. **Accountant Portal** (React + Material-UI) - `web-accountant/`
4. **Worker Mobile App** (React Native + Expo) - `mobile-worker/`

---

## 1️⃣ Manager Portal (React)

**Location**: `web-manager/`
**Port**: 3001
**Users**: Business owners, location managers

### Features Implemented

✅ **Dashboard**
- Real-time statistics (workers, shifts, attendance)
- Quick action cards
- Upcoming tasks

✅ **Workers Management**
- View all workers with DataGrid
- Create DPP/DPČ contracts
- Worker status tracking

✅ **Shift Planner**
- Drag-and-drop calendar (React Big Calendar)
- Create shifts with role/worker assignment
- Shift marketplace toggle
- Shift templates

✅ **Attendance Tracking**
- View all attendance records
- Approve/edit hours
- Manager notes for adjustments

✅ **Payroll & Compliance (🔥 KILLER FEATURE)**
- Create payroll periods
- One-click calculation (automatic Czech Labor Law)
- Lock periods
- **Download ČSSZ XML** (one button!)
- **Download CSV** for POHODA/Money S3
- View detailed calculations with supplements

✅ **Gamification**
- Create achievements/badges
- View leaderboards
- Award achievements to workers

✅ **Customer Feedback**
- Generate QR codes
- View feedback in real-time
- Rating analytics

### Tech Stack

- **Framework**: React 18 + Vite
- **UI Library**: Material-UI v5
- **State Management**: Zustand
- **API Calls**: Axios + React Query
- **Calendar**: React Big Calendar
- **Charts**: Recharts
- **Forms**: React Hook Form + Yup
- **QR Codes**: qrcode.react

### Quick Start

```bash
cd web-manager
npm install
npm run dev

# Opens on http://localhost:3001
# Login: manager@tudlo.cz / manager123
```

### Build for Production

```bash
npm run build

# Docker build
docker build -t brigadnikos-manager .
docker run -p 3001:80 brigadnikos-manager
```

### Key Files

- `src/pages/PayrollPage.tsx` - 🔥 The KILLER FEATURE (ČSSZ export)
- `src/pages/ShiftsPage.tsx` - Shift planner with calendar
- `src/pages/AttendancePage.tsx` - Timesheet approval
- `src/services/api.ts` - API integration layer
- `src/store/authStore.ts` - Authentication state

---

## 2️⃣ HQ Analytics Portal (React)

**Location**: `web-hq/`
**Port**: 3002
**Users**: Franchise headquarters

### Features Implemented

✅ **Network Dashboard**
- Total locations count
- Network-wide worker count
- Total shifts across all locations
- Average customer satisfaction

✅ **Performance Comparison**
- Bar charts comparing locations
- Worker & shift metrics per location
- Satisfaction trend analysis

✅ **Cross-Tenant Reporting**
- READ-ONLY access to child tenants
- Aggregated analytics
- Location performance rankings

### Tech Stack

- React 18 + Vite
- Material-UI v5
- Recharts for visualizations
- Zustand for state

### Quick Start

```bash
cd web-hq
npm install
npm run dev

# Opens on http://localhost:3002
```

---

## 3️⃣ Accountant Portal (React)

**Location**: `web-accountant/`
**Port**: 3003
**Users**: External accountants

### Features Implemented

✅ **Payroll Export Downloads**
- View all locked payroll periods
- Download ČSSZ XML files
- Download CSV for accounting software
- Period status indicators

✅ **Limited READ-ONLY Access**
- Can only access payroll/compliance data
- Cannot see shifts, workers, or gamification
- Time-limited access (granted by manager)

### Tech Stack

- React 18 + Vite
- Material-UI v5
- Axios for API calls
- Date-fns for formatting

### Quick Start

```bash
cd web-accountant
npm install
npm run dev

# Opens on http://localhost:3003
```

---

## 4️⃣ Worker Mobile App (React Native)

**Location**: `mobile-worker/`
**Platform**: iOS & Android
**Users**: DPP/DPČ workers

### Features Implemented

✅ **Home Dashboard**
- Today's shifts summary
- Monthly pay estimate
- Quick navigation

✅ **My Schedule**
- Calendar view of assigned shifts
- Shift details (time, rate, role)
- Status tracking

✅ **Shift Marketplace**
- Browse open shifts
- Apply to shifts with one tap
- View shift details & duration

✅ **Geofenced Clock-In/Clock-Out**
- GPS location verification
- Only enabled within geofence radius
- Real-time attendance tracking
- Location permission handling

✅ **My Pay Estimate**
- Real-time monthly pay calculation
- Breakdown:
  - Hours worked
  - Base pay
  - Weekend supplements
  - Night supplements
  - Holiday supplements
  - Performance bonuses
- Estimated gross pay

✅ **Achievements & Leaderboards**
- View earned badges
- Achievement gallery
- Public leaderboard (top 10)
- Points & rankings

✅ **My Reviews**
- Customer feedback from QR scans
- 5-star ratings
- Comment tags
- Motivation booster!

✅ **Profile Management**
- Personal info
- Settings
- Availability management
- Logout

### Tech Stack

- **Framework**: React Native + Expo
- **UI Library**: React Native Paper
- **Navigation**: React Navigation v6
- **API Calls**: Axios + TanStack Query (React Query v5)
- **State Management**: Zustand
- **Location**: Expo Location
- **Permissions**: GPS for geofencing

### Quick Start

```bash
cd mobile-worker
npm install

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on physical device (scan QR code in Expo Go app)
```

### Build for Production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Both
eas build --platform all
```

### Key Screens

- `src/screens/AttendanceScreen.tsx` - Geofenced clock-in/out (GPS)
- `src/screens/MyPayScreen.tsx` - Real-time pay estimate
- `src/screens/MarketplaceScreen.tsx` - Apply to open shifts
- `src/screens/AchievementsScreen.tsx` - Badges & leaderboard

---

## 🚀 Running All Apps Simultaneously

### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Manager Portal
cd web-manager
npm run dev

# Terminal 3 - HQ Portal
cd web-hq
npm run dev

# Terminal 4 - Accountant Portal
cd web-accountant
npm run dev

# Terminal 5 - Mobile App
cd mobile-worker
npm start
```

### Using Docker Compose

Update `docker-compose.yml` to include frontend services:

```yaml
version: '3.8'

services:
  # ... existing backend, postgres, redis ...

  web-manager:
    build: ./web-manager
    ports:
      - "3001:80"
    depends_on:
      - backend

  web-hq:
    build: ./web-hq
    ports:
      - "3002:80"
    depends_on:
      - backend

  web-accountant:
    build: ./web-accountant
    ports:
      - "3003:80"
    depends_on:
      - backend
```

Then:

```bash
docker-compose up -d
```

---

## 🎯 User Journeys

### Manager Journey

1. Login at http://localhost:3001
2. View dashboard with stats
3. Create DPP contract for new worker
4. Create shifts in calendar
5. Approve attendance from workers
6. Run payroll calculation
7. Lock period
8. **Download ČSSZ XML** (send to government)
9. Download CSV (send to accountant)

### Worker Journey

1. Open mobile app
2. View today's shifts
3. Check shift marketplace
4. Apply to open shift
5. Get assigned to shift
6. Clock in with GPS (geofenced)
7. Work shift
8. Clock out with GPS
9. View real-time pay estimate
10. Check customer reviews
11. View achievements earned

### HQ Journey

1. Login at http://localhost:3002
2. View network dashboard
3. Compare location performance
4. Analyze satisfaction trends
5. Export reports

### Accountant Journey

1. Login at http://localhost:3003
2. View locked payroll periods
3. Download ČSSZ XML
4. Download CSV
5. Import to POHODA/Money S3

---

## 📱 Mobile App Screenshots

### Key Features Showcase

**Login Screen**
- Simple email/password
- Demo credentials shown

**Home Dashboard**
- Today's shifts widget
- Monthly pay widget
- Marketplace widget

**Geofenced Clock-In**
- GPS location verification
- "Clock In" button (only in geofence)
- Real-time location status
- Error handling if outside geofence

**My Pay Estimate**
- Real-time calculation
- Detailed breakdown
- Automatic supplements displayed
- Czech Labor Law compliance

**Shift Marketplace**
- Browse open shifts
- One-tap apply
- Shift details (date, time, rate)

**Achievements**
- Badge gallery
- Leaderboard (top 10)
- Points & rankings

---

## 🔧 Configuration

### API URL Configuration

Each app connects to the backend API. Update if needed:

**Web Apps** (`vite.config.ts`):
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

**Mobile App** (`src/services/api.ts`):
```typescript
const API_URL = 'http://192.168.1.X:3000/api/v1'; // Use your local IP
```

---

## 🎨 Customization

### Theme Colors

All apps use Material Design with primary color `#1976d2` (blue).

To customize, edit:
- Web: `src/main.tsx` (createTheme)
- Mobile: React Native Paper theme

### Branding

Replace logos/icons:
- Web: `/public/` folder
- Mobile: `/assets/` folder

---

## 📦 Production Deployment

### Web Apps

```bash
# Build all web apps
cd web-manager && npm run build
cd ../web-hq && npm run build
cd ../web-accountant && npm run build
```

Serve with Nginx, Vercel, Netlify, or Docker.

### Mobile App

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas login
eas build:configure

# Build
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## ✨ Key Highlights

### Manager Portal
- **ČSSZ XML Export**: One-click compliance (saves hours!)
- **Drag-and-drop Shift Planner**: Visual, intuitive
- **Real-time Attendance**: Approve hours instantly

### Mobile App
- **Geofenced Clock-In**: GPS verification (prevents fraud)
- **Real-time Pay**: Workers see exactly what they'll earn
- **Shift Marketplace**: Fill open shifts fast
- **Gamification**: Keep workers motivated

---

## 🎉 What's Next?

All frontends are **complete and ready to use**! To go live:

1. ✅ Backend API - Done
2. ✅ Database schema - Done
3. ✅ Manager Portal - Done
4. ✅ HQ Portal - Done
5. ✅ Accountant Portal - Done
6. ✅ Worker Mobile App - Done
7. 🚀 Deploy to production
8. 🚀 Launch beta with pilot businesses
9. 🚀 Iterate based on feedback

**The entire BrigadníkOS platform is now COMPLETE!** 🎊
