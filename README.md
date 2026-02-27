# HRMS Lite - Human Resource Management System

A lightweight web-based HRMS application for managing employee records and tracking daily attendance.

## Tech Stack

**Frontend:**
- React 19 with Vite
- Tailwind CSS for styling
- Axios for API calls

**Backend:**
- FastAPI (Python)
- SQLite database
- Pydantic for data validation
- CORS middleware

## Features

### Employee Management
- Add new employees with unique ID, name, email, and department
- View all employees in a clean table format
- Delete employees with confirmation

### Attendance Management
- Mark daily attendance (Present/Absent) for employees
- View attendance records for each employee
- Filter attendance by date

## Local Development Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.11+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file and set backend URL
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render
- **Database**: SQLite (use a persistent disk/volume in hosted environments)

## Submission Links

- **Live Frontend URL**: `<add-your-live-frontend-url>`
- **Live Backend API URL**: `<add-your-live-backend-url>`
- **GitHub Repository Link**: `<add-your-github-repo-link>`

## Environment Variables

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=<your-live-backend-api-url>
```

## API Endpoints

### Employees
- `GET /employees` - Get all employees
- `POST /employees` - Create new employee
- `DELETE /employees/{employee_id}` - Delete employee

### Attendance
- `POST /attendance` - Mark attendance
- `GET /attendance/{employee_id}` - Get employee attendance records

## Assumptions & Limitations

- Single admin user (no authentication)
- SQLite database for simplicity (requires persistent disk in production)
- Basic server-side and client-side validation with meaningful API errors
- Responsive design for desktop and mobile