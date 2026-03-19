# TaskFlow — Internal Task & Calendar Tracker

A full-stack task and calendar management tool for small teams. Built for managing daily tasks, deadlines, priorities, and team visibility with auto-scheduling and analytics.

---

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Zod (validation)
- node-cron (scheduled jobs)

### Frontend
- React + Vite
- Tailwind CSS v4
- React Router v6
- Axios
- React Big Calendar
- Recharts
- dayjs

---

## Architecture
```
client (React) → Axios → Express API → MongoDB
                    ↓
              JWT Middleware
              Zod Validation
              Role Guard (admin/member)
                    ↓
              Auto Scheduler (on task create)
              Cron Job (daily overdue check)
```

---

## Features

### Task Management
- Create, edit, delete tasks (admin only)
- Assign tasks to team members
- Filter by status, priority, category, date range
- Paginated task list (10 per page)
- List view and Kanban board view

### Auto Scheduling
- Tasks are automatically scheduled to the calendar on creation
- High priority → scheduled same day, 09:00–10:30
- Medium priority → 2 days before due date, 11:00–12:30
- Low priority → 3 days before due date, 14:00–15:30

### Calendar
- Monthly, weekly, and daily views
- Color coded by priority
- Click any event to see full task details

### Analytics
- Total time tracked per team member per day
- Time breakdown by category (pie chart)
- Per member summary table

### User Roles
| Feature | Admin | Member |
|---|---|---|
| Create tasks | ✓ | ✗ |
| Edit all fields | ✓ | ✗ |
| Update own task status | ✓ | ✓ |
| Delete tasks | ✓ | ✗ |
| View all tasks | ✓ | ✗ |
| View own tasks | ✓ | ✓ |
| View analytics | All users | Own only |

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
npm install
```

Create `.env`:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```
```bash
npm run dev
```

### Frontend
```bash
cd frontend
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```
```bash
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Authenticated |
| GET | /api/auth/users | Admin |

### Tasks
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/tasks | Admin |
| GET | /api/tasks | Authenticated |
| GET | /api/tasks/:id | Authenticated |
| PATCH | /api/tasks/:id | Authenticated |
| DELETE | /api/tasks/:id | Admin |

### Calendar
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/calendar | Authenticated |

### Analytics
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/analytics | Authenticated |

### Query Parameters — GET /api/tasks
| Param | Type | Example |
|---|---|---|
| status | string | In Progress |
| priority | string | High |
| category | string | Research |
| assignedTo | ObjectId | 665f... |
| dueDateFrom | date | 2026-04-01 |
| dueDateTo | date | 2026-04-30 |
| page | number | 1 |
| limit | number | 10 |

---

## Deployment

- Backend: Railway
- Frontend: Netlify
- Database: MongoDB Atlas