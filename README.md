# TaskFlow — Internal Task & Calendar Tracker

A clean, minimal internal tool for managing team tasks, deadlines, and schedules — with auto-planning, Kanban/List views, a calendar, and time analytics.

## 🔗 Live Demo

| | URL |
|---|---|
| **Frontend** | https://taskcalendar20.netlify.app |

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Auto-Scheduling Logic](#auto-scheduling-logic)
- [User Roles & Permissions](#user-roles--permissions)
- [Frontend Pages & Components](#frontend-pages--components)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Cron Jobs](#cron-jobs)

---

## Overview

TaskFlow is a full-stack task and calendar tracking application built for small teams. It combines task management, deadline tracking, and auto calendar scheduling into one focused workspace. Admins can create and assign tasks; team members can view their tasks and update status. All tasks are automatically scheduled onto a calendar based on priority and due date.

---

## Features

### Core
- **Task creation** with title, description, assignee, priority, category, due date, estimated time, and status
- **List view** — filterable grid of task cards with pagination
- **Kanban board** — columns for Not Started, In Progress, Completed, Overdue
- **Calendar view** — monthly/weekly/daily views powered by `react-big-calendar`; click any event to see task details
- **Drag-to-reschedule** — admins can drag calendar events to update the scheduled date (via `PATCH /api/calendar/:eventId`)
- **Task filters** — by status, priority, category, assignee, and due date range
- **Auto-scheduling** — tasks are automatically placed on the calendar when created or when priority/due date changes
- **Analytics dashboard** — bar chart (time per person per day), donut chart (time by category), and per-member breakdown table
- **Overdue detection** — a daily cron job marks past-due tasks as Overdue automatically

### UX
- Clickable summary cards on the dashboard that apply quick filters (Overdue / Due Today / Upcoming / Completed)
- Role-aware UI — the "New task" button and edit/delete controls only appear for admins
- Collapsible sidebar
- Soft glassmorphism design using `DM Sans` + `Fraunces` typography
- Live password strength indicator on registration
- JWT-based auth with auto-redirect on token expiry

---

## Tech Stack

### Frontend
| Layer | Library/Tool |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router v6 |
| HTTP | Axios (with JWT interceptor) |
| Calendar | react-big-calendar + dayjs localizer |
| Charts | Recharts (BarChart, PieChart) |
| Styling | Tailwind CSS + inline styles |
| Fonts | Google Fonts — DM Sans, Fraunces |

### Backend
| Layer | Library/Tool |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (`jsonwebtoken`) |
| Validation | Zod |
| Scheduling | node-cron |
| Config | dotenv |
| CORS | cors |

---

## Architecture

```
Browser (React SPA)
      │
      │  REST API (JSON)
      ▼
Express Server (Node.js)
      │
      ├── Auth Middleware (JWT verify)
      ├── Role Middleware (admin / member)
      ├── Zod Validators
      │
      ├── /api/auth       ── User registration & login
      ├── /api/tasks      ── CRUD for tasks + auto-schedule trigger
      ├── /api/calendar   ── Calendar events (read + drag-reschedule)
      └── /api/analytics  ── Aggregated time-per-user-per-day
              │
              ▼
         MongoDB Atlas
    ┌─────────────────────┐
    │  Users              │
    │  Tasks              │
    │  CalendarEvents     │
    └─────────────────────┘
              │
         node-cron
    (daily overdue check)
```

**Request lifecycle:**
1. React sends a request with `Authorization: Bearer <token>` via the Axios instance (`src/api/axios.js`).
2. `verifyToken` middleware decodes the JWT and attaches `req.user`.
3. `checkRole` middleware guards admin-only routes.
4. Zod `validate` middleware parses and strips the request body.
5. The controller executes business logic, optionally calling `autoSchedule`.
6. Response is returned as JSON.

---

## Project Structure

```
root/
├── frontend/                  (Vite + React)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state, login, register, logout
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + main wrapper
│   │   │   ├── ProtectedRoute.jsx # Auth guard for routes
│   │   │   ├── TaskCard.jsx       # Task card (list & kanban)
│   │   │   ├── TaskFilters.jsx    # Filter bar
│   │   │   ├── TaskFormModal.jsx  # Create / edit task modal
│   │   │   └── TaskDetailModal.jsx# Task detail + status update
│   │   ├── hooks/
│   │   │   ├── useTasks.js        # Fetch tasks with filters & pagination
│   │   │   ├── useUsers.js        # Fetch all users (for assignee dropdown)
│   │   │   ├── useCalendarEvents.js # Fetch calendar events by date range
│   │   │   └── useAnalytics.js    # Fetch analytics data
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── tasks/
│   │   │   │   └── Dashboard.jsx  # List + Kanban view
│   │   │   ├── calendar/
│   │   │   │   └── CalendarPage.jsx
│   │   │   └── analytics/
│   │   │       └── AnalyticsPage.jsx
│   │   ├── App.jsx                # Route definitions
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Tailwind + Google Fonts import
│
├── backend/                   (Express + MongoDB)
│   ├── config/
│   │   └── db.js                  # Mongoose connection
│   ├── controller/
│   │   ├── authController.js      # register, login, getMe
│   │   ├── taskController.js      # CRUD + auto-schedule trigger
│   │   ├── calendarController.js  # getCalendarEvents
│   │   └── analyticsController.js # MongoDB aggregation pipeline
│   ├── middleware/
│   │   ├── authMiddleware.js      # verifyToken, checkRole
│   │   └── validate.js            # Zod schema middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   └── CalendarEvent.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── calendarRoutes.js
│   │   └── analyticsRoutes.js
│   ├── utils/
│   │   ├── autoScheduler.js       # Auto-scheduling logic
│   │   └── cronJobs.js            # Daily overdue task cron
│   ├── validators/
│   │   ├── authValidator.js       # Zod schemas for auth
│   │   └── taskValidator.js       # Zod schemas for tasks
│   └── index.js                   # Express app entry point
```

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Unique, required |
| `password` | String | Bcrypt hashed |
| `role` | String | `"admin"` or `"member"` |

Password comparison is handled by a `comparePassword` instance method on the model.

### Task
| Field | Type | Notes |
|---|---|---|
| `title` | String | Required, max 100 chars |
| `description` | String | Optional, max 500 chars |
| `assignedTo` | ObjectId → User | Required |
| `createdBy` | ObjectId → User | Set from JWT on creation |
| `priority` | String | `High`, `Medium`, `Low` |
| `category` | String | `Research`, `Admin`, `Investment Analysis`, `Compliance`, `Operations` |
| `dueDate` | Date | Required |
| `estimatedTime` | Number | Minutes, optional |
| `status` | String | `Not Started`, `In Progress`, `Completed`, `Overdue` |
| `scheduledDate` | Date | Set by auto-scheduler |
| `scheduledSlot` | String | e.g. `"09:00-10:30"` — set by auto-scheduler |

### CalendarEvent
| Field | Type | Notes |
|---|---|---|
| `task` | ObjectId → Task | Required |
| `user` | ObjectId → User | The assigned user |
| `date` | Date | Scheduled date |
| `startTime` | String | e.g. `"09:00"` |
| `endTime` | String | e.g. `"10:30"` |
| `isAutoScheduled` | Boolean | `true` when created by the scheduler |

---

## API Reference

All protected routes require the header: `Authorization: Bearer <token>`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a new user account |
| POST | `/login` | Public | Login and receive a JWT |
| GET | `/me` | Any | Get the current logged-in user |
| GET | `/users` | Any | List all users (name, email, role) |

**POST /register body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "pass123",
  "role": "admin"
}
```

**POST /login body:**
```json
{
  "email": "jane@example.com",
  "password": "pass123"
}
```

Both auth responses return:
```json
{
  "token": "<jwt>",
  "user": { "_id": "...", "name": "...", "email": "...", "role": "..." }
}
```

---

### Tasks — `/api/tasks`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Admin | Create a task (triggers auto-schedule) |
| GET | `/` | Any | List tasks with filters + pagination |
| GET | `/:id` | Any | Get a single task |
| PATCH | `/:id` | Any | Update task (members: status/description/estimatedTime only) |
| DELETE | `/:id` | Admin | Delete a task |

**GET / query parameters:**

| Param | Type | Description |
|---|---|---|
| `assignedTo` | ObjectId | Filter by user |
| `status` | String | `Not Started`, `In Progress`, `Completed`, `Overdue` |
| `priority` | String | `High`, `Medium`, `Low` |
| `category` | String | One of the 5 categories |
| `dueDateFrom` | Date string | Start of due date range |
| `dueDateTo` | Date string | End of due date range |
| `page` | Number | Default `1` |
| `limit` | Number | Default `10`, max `50` |

**GET / response shape:**
```json
{
  "tasks": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

> Members automatically receive only their own tasks regardless of filters.

---

### Calendar — `/api/calendar`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any | Get calendar events for a date range |
| PATCH | `/:eventId` | Admin | Reschedule an event (drag-and-drop) |

**GET / query parameters:**

| Param | Description |
|---|---|
| `startDate` | ISO date string |
| `endDate` | ISO date string |
| `user` | ObjectId (admin only — filter by user) |

> Members automatically see only their own events.

**PATCH /:eventId body:**
```json
{
  "date": "2025-08-15",
  "startTime": "09:00",
  "endTime": "10:30"
}
```
Also updates `scheduledDate` on the linked Task document.

---

### Analytics — `/api/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any | Aggregated time per user per day |

**Response:**
```json
[
  {
    "userId": "...",
    "userName": "Jane Smith",
    "date": "2025-08-10T00:00:00.000Z",
    "totalMinutes": 150,
    "byCategory": [
      { "category": "Research", "minutes": 90 },
      { "category": "Admin", "minutes": 60 }
    ]
  }
]
```

> Only includes tasks where `estimatedTime` is set. Members see only their own data. Admins see all.

---

## Auto-Scheduling Logic

When a task is **created** or when its **priority or due date is updated**, `autoSchedule(task)` is called automatically by the task controller.

**Scheduled date rules:**

| Priority | Scheduled date |
|---|---|
| High | Task creation date (or today if that's in the past) |
| Medium | Due date minus 2 days |
| Low | Due date minus 3 days |

If the calculated date is in the past, it falls back to today.

**Time slot assignment:**

| Priority | Slot |
|---|---|
| High | 09:00 – 10:30 |
| Medium | 11:00 – 12:30 |
| Low | 14:00 – 15:30 |

After scheduling, the task's `scheduledDate` and `scheduledSlot` fields are updated, and a `CalendarEvent` document is created (or updated via `upsert`) for the assigned user. The scheduled slot is displayed directly on each TaskCard in the dashboard.

---

## User Roles & Permissions

| Action | Admin | Member |
|---|---|---|
| Create task | ✅ | ❌ |
| Assign task | ✅ | ❌ |
| View all tasks | ✅ | ❌ (own only) |
| View own tasks | ✅ | ✅ |
| Update task (any field) | ✅ | ❌ |
| Update status / description / estimatedTime | ✅ | ✅ (own tasks) |
| Delete task | ✅ | ❌ |
| View all calendar events | ✅ | ❌ (own only) |
| Reschedule calendar event | ✅ | ❌ |
| View analytics (all users) | ✅ | ❌ (own only) |

---

## Frontend Pages & Components

### Pages

**Login / Register** (`/login`, `/register`)
- JWT auth forms with client-side Zod-mirror validation (email regex, password strength)
- Live password strength indicator on register
- Role selector (Admin / Team Member) on register

**Dashboard** (`/dashboard`)
- Greeting with current date
- Four summary cards: Overdue, Due Today, Upcoming, Completed — each click-filters the task list
- List view (paginated card grid) and Kanban board toggle
- Full filter bar: status, priority, category, assignee, date range
- Admin-only "New task" button

**Calendar** (`/calendar`)
- `react-big-calendar` with month / week / day views
- Events colour-coded by priority
- Click an event to open the TaskDetailModal
- Drag an event to reschedule (admin only, calls `PATCH /api/calendar/:eventId`)

**Analytics** (`/analytics`)
- Summary cards: total time tracked, team members, active days
- Bar chart: minutes per person per day
- Donut chart: minutes by category
- Table: per-member breakdown

### Key Components

| Component | Responsibility |
|---|---|
| `Layout.jsx` | Collapsible sidebar with nav links, user info, logout |
| `ProtectedRoute.jsx` | Redirects unauthenticated users; shows branded loading screen |
| `TaskCard.jsx` | Renders priority badge, status pill, category tag, scheduled slot, assignee |
| `TaskFormModal.jsx` | Create/edit form — full fields for admin, status-only for member |
| `TaskDetailModal.jsx` | Read-only detail view with edit and delete actions |
| `TaskFilters.jsx` | Controlled filter bar using `useUsers` for the assignee dropdown |

### Custom Hooks

| Hook | What it does |
|---|---|
| `useTasks(filters)` | Fetches paginated tasks; re-fetches when filters change |
| `useUsers()` | Fetches all users once on mount |
| `useCalendarEvents(start, end)` | Fetches and formats calendar events for a date range |
| `useAnalytics()` | Fetches aggregated analytics data |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster (or local MongoDB)
- A `.env` file in the backend root (see below)

### Backend

```bash
cd backend
npm install
npm run dev        # nodemon index.js  (or node index.js for production)
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Cron Jobs

A single cron job runs at **midnight every day** (`0 0 * * *`).

It finds all tasks where:
- `dueDate` is before today
- `status` is not already `Completed` or `Overdue`

And bulk-updates their status to `"Overdue"`. This keeps the dashboard summary cards and Kanban board accurate without any user action required.

The cron is started automatically when the server connects to MongoDB, via `startCronJobs()` in `index.js`.