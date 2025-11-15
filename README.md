# BrigadníkOS - All-in-One Czech Workforce Platform

**Secure & Role-Based like Bakaláři** - A cloud-native SaaS platform solving the 2024-2025 DPP/DPČ administrative crisis in Czechia.

## 🏗️ Architecture

Multi-tenant, cloud-native, API-first SaaS platform with:
- **Backend**: NestJS (Node.js + TypeScript)
- **Web Portals**: React (Manager, HQ, Accountant)
- **Mobile App**: React Native (iOS & Android)
- **Database**: PostgreSQL with Row-Level Security
- **Deployment**: Docker + Kubernetes

## 📁 Project Structure

```
brigadnikos/
├── backend/              # NestJS API server
├── web-manager/          # Manager Portal (React)
├── web-hq/              # Franchise HQ Portal (React)
├── web-accountant/      # Accountant Portal (React)
├── mobile-worker/       # Worker Mobile App (React Native)
├── database/            # PostgreSQL schemas & migrations
├── docker/              # Docker & K8s configs
└── docs/                # API documentation
```

## 👥 User Roles

1. **Worker (Brigadník)**: Mobile app - READ-ONLY on business data, can manage own profile/availability
2. **Manager**: Web portal - FULL R/W access within their tenant
3. **Franchise HQ**: Web portal - GLOBAL READ-ONLY across child tenants
4. **Accountant**: Web portal - LIMITED READ-ONLY for payroll/compliance exports

## 🎯 Core Features

### Module 1: Authentication & User Management
- Secure JWT-based authentication
- Role-based access control (RBAC)
- Worker/Accountant invitation system

### Module 2: Worker Profile Management
- Digital DPP/DPČ agreement storage
- Personal info compliance (GDPR)
- Availability calendar

### Module 3: Shift Planning & Attendance
- Drag-and-drop shift planner
- Shift marketplace
- Geofenced clock-in/clock-out
- Timesheet approval workflow

### Module 4: Gamification & Performance
- Achievement/badge system
- Public leaderboards
- Performance analytics

### Module 5: Customer Feedback
- QR code generation per location/worker
- 5-star rating system
- Review integration with gamification

### Module 6: Payroll & Compliance (KILLER FEATURE)
- Czech Labor Code automation
- DPP/DPČ 300-hour limit tracking
- Automatic supplement calculation (holidays, nights, weekends)
- **ČSSZ VPDPP XML Export** - One-click compliance
- Payroll export for POHODA/Money S3

### Module 7: API & Integrations
- POS integration (Dotykačka, Syrve, AWIS)
- Outbound payroll API
- Webhook system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd system-pro-brigadniky

# Install dependencies
npm install

# Start PostgreSQL
docker-compose up -d postgres

# Run database migrations
cd backend && npm run migration:run

# Start backend API
npm run start:dev

# Start web portals (separate terminals)
cd web-manager && npm start
cd web-hq && npm start
cd web-accountant && npm start

# Start mobile app
cd mobile-worker && npm start
```

## 🔒 Security

- GDPR compliant
- AES-256 encryption at rest
- TLS 1.3 in transit
- Row-level security in PostgreSQL
- JWT with refresh tokens
- Rate limiting & DDoS protection

## 📊 Database Multi-Tenancy

Each business is a separate tenant with strict data isolation via PostgreSQL RLS (Row-Level Security). Franchise HQ tenants have read-only access to child tenant analytics.

## 📝 License

Proprietary - All Rights Reserved

## 🆘 Support

Contact: support@brigadnikos.cz
