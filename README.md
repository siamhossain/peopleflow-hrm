# PeopleOS

**PeopleOS** is a modern, full-stack Human Resource Management (HRM) platform built for streamlined workforce administration, attendance tracking, leave request management, and employee self-service.

Built with **Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, PostgreSQL, Prisma ORM, and Auth.js (NextAuth v5)**, PeopleOS features a clean light-theme SaaS design system, modular architecture, role-based access control, and server-side validation.

---

## Key Features

### 1. Administrative Portal
- **Dashboard & Analytics**: Real-time workforce metrics, attendance distribution, leave summary cards, and quick request reviews.
- **Employee Directory**: Full personnel records, employee code tracking, department assignments, designation management, and search/filter/pagination.
- **Attendance Management**: Daily punch log tracking, check-in/out timestamps, working hour calculations, late-threshold grace periods, and monthly overview reports.
- **Leave Administration**: Multi-type leave requests (Annual, Sick, Casual, Unpaid), duration modes (Full Day vs. Half Day), live balance preview, and approval/rejection/cancellation workflows.
- **Reports & Intelligence**: Monthly attendance trends, rate calculations, delay minute aggregations, and leave status distributions.
- **System Settings**: Configurable office working hours, late grace thresholds, and weekly work/weekend schedule definitions.

### 2. Employee Self-Service Portal
- **Personal Profile**: View employee codes, official designations, department info, and contact details.
- **Attendance Records**: Individual monthly punch history, daily status indicators, and total working hour summaries.
- **Leave Management**: Live leave balance overview (Allocated, Used, Pending, Remaining) with quota validation.
- **Leave Applications**: Submit new time-off requests with real-time balance checks and cancellation of pending requests.
- **Request Tracking**: Monitor status transitions (Pending, Approved, Rejected, Cancelled) and administrative reviewer notes.

### 3. Role-Based Access Control (RBAC)
- **ADMIN**: Full administrative read/write access across all management portals, settings, and employee directories.
- **EMPLOYEE**: Restricted access limited to personal attendance, profile, and leave applications.
- **DEMO_VIEWER**: Read-only exploration mode with simulated switching between Admin and Employee views.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **UI System** | Custom reusable primitives (`Button`, `Card`, `Badge`, `Input`, `Select`, `Modal`, `Table`, `StatCard`, `EmptyState`, `Pagination`) |
| **Backend & API** | Next.js API Routes, Server Actions, Modular Service Layer |
| **Database & ORM** | PostgreSQL, Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`) |
| **Authentication** | Auth.js / NextAuth.js v5, bcryptjs password hashing |
| **Testing & Quality** | Vitest 4, ESLint 9, TypeScript (`tsc --noEmit`) |

---

## System Architecture

```text
                               PeopleOS Platform
                                       |
                   +-------------------+-------------------+
                   |                                       |
             Frontend (UI)                           Backend (API)
                   |                                       |
          Next.js App Router                      API Route Handlers
                   |                                       |
          React Components                        Auth.js Session & RBAC
                   |                                       |
          Reusable UI Primitives                  Domain Service Layer
                                                           |
                                                      Prisma ORM
                                                           |
                                                      PostgreSQL
```

### Project Structure

```text
peopleos/
├── prisma/
│   ├── schema.prisma           # Prisma database schema and enums
│   ├── seed.ts                 # Database seed script for mock HRM data
│   └── seed-attendance.ts      # Attendance-specific seed runner
├── scripts/
│   ├── create-employee.ts      # CLI script to provision employee accounts
│   └── create-demo-account.ts  # CLI script to provision demo accounts
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Admin portal routes (dashboard, employees, attendance, leave, reports, settings)
│   │   ├── api/                # REST API route handlers
│   │   ├── employee/           # Employee portal routes (attendance, leave, profile, requests)
│   │   ├── login/              # Authentication page
│   │   ├── globals.css         # Tailwind CSS v4 theme variables and styles
│   │   └── layout.tsx          # Root application layout
│   ├── components/
│   │   ├── attendance/         # Attendance tables and filters
│   │   ├── dashboard/          # Metric cards and attendance charts
│   │   ├── employees/          # Directory tables, forms, and modals
│   │   ├── layout/             # Sidebar, Header, and AppShell
│   │   ├── leave/              # Leave request tables, forms, and balance preview
│   │   └── ui/                 # Reusable UI primitives (Button, Modal, Table, etc.)
│   ├── data/                   # Default configuration and initial mock datasets
│   ├── lib/                    # Prisma client and utility singletons
│   ├── services/               # Core business logic (employee, attendance, leave, dashboard)
│   └── types/                  # TypeScript data models and interfaces
├── .env.example
├── package.json
└── README.md
```

---

## Core Business & Validation Rules

- **Date Range Integrity**: A leave request's start date cannot be after its end date.
- **Employment Boundaries**: Leaves cannot start prior to an employee's joining date or after their resignation date.
- **Duration Constraints**: Half-day leaves are strictly constrained to a single calendar day.
- **Conflict Prevention**: Overlapping pending or approved leave requests for the same employee are automatically rejected.
- **Quota Enforcement**: Leave applications cannot exceed the employee's remaining allocated days for that specific category.
- **State Machine Transitions**: Only `PENDING` requests can be approved or rejected; only `APPROVED` requests can be cancelled.
- **Attendance Classification**: Automated tagging of records as Present, Late, Half Day, Absent, or On Leave based on shift start time and late thresholds.

---

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **PostgreSQL**: Running locally or via a cloud instance

### 1. Installation

```bash
git clone <repository-url>
cd betopia-hrm
npm install
```

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL database URL and NextAuth secret:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/peopleos?schema=public"
AUTH_SECRET="your-secure-random-32-char-secret"
```

### 3. Database Migration & Generation

```bash
npx prisma generate
npx prisma db push
# or run migrations:
# npx prisma migrate dev
```

### 4. Seed Data (Optional)

Populate departments, employees, leave types, and attendance records:

```bash
npx tsx prisma/seed.ts
```

Provision administrative or demo accounts:

```bash
npm run create:employee
npm run create:demo
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quality & Verification Commands

```bash
# Typecheck
npx tsc --noEmit

# Linting
npm run lint

# Automated Test Suite (23 test cases)
npm test

# Production Build
npm run build
npm start
```

---

## Security

PeopleOS enforces server-side authentication verification, strict role-based authorization, parameterized database queries via Prisma, and input sanitation.

For detailed security policies and reporting guidelines, please refer to [SECURITY.md](./SECURITY.md).

---

## License

This project is private and proprietary. All rights reserved.
