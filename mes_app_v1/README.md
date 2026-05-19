# MES Application

Manufacturing Execution System with role-based access for production management.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Auth**: JWT tokens with role-based access control

## Roles

| Role | Description |
|------|-------------|
| Admin | Full system access, manage users/workshops/orders |
| Workshop Chief | Manage orders and tasks for their workshop |
| Operator | View and update assigned tasks (tablet-optimized) |
| Manager | Read-only dashboard and order overview |

## Quick Start

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Create database and run migrations
# Make sure PostgreSQL is running
createdb mes_db  # if needed
alembic upgrade head  # or run seed.py

# Seed initial data
python seed.py

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/api/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend available at `http://localhost:5173`

## Default Credentials

| Login | Password | Role |
|-------|----------|------|
| admin | admin | Administrator |
| chief1 | chief | Workshop Chief |
| operator1 | operator | Operator |
| manager | manager | Manager |

## Project Structure

```
mes_app_v1/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings
│   │   ├── database.py       # SQLAlchemy connection
│   │   ├── models/           # DB models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── dependencies/     # Auth dependencies
│   ├── alembic/              # DB migrations
│   ├── seed.py               # Initial data
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/            # Role-based pages
        ├── components/       # Shared components
        ├── layouts/          # Dashboard layout
        ├── services/         # API client
        └── store/            # Auth store (Zustand)
```
