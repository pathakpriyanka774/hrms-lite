from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
from datetime import date, datetime
import re

app = FastAPI(title="HRMS Lite API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def init_db():
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    
    # Employees table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            employee_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT NOT NULL
        )
    ''')
    
    # Attendance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES employees (employee_id),
            UNIQUE(employee_id, date)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class Employee(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str

class AttendanceRecord(BaseModel):
    employee_id: str
    date: str
    status: str  # "Present" or "Absent"

class AttendanceResponse(BaseModel):
    id: int
    employee_id: str
    date: str
    status: str

# Employee endpoints
@app.get("/employees", response_model=List[Employee])
async def get_employees():
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    cursor.execute("SELECT employee_id, full_name, email, department FROM employees")
    employees = cursor.fetchall()
    conn.close()
    
    return [Employee(
        employee_id=emp[0],
        full_name=emp[1],
        email=emp[2],
        department=emp[3]
    ) for emp in employees]

@app.post("/employees", response_model=Employee)
async def create_employee(employee: Employee):
    # Email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, employee.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO employees (employee_id, full_name, email, department) VALUES (?, ?, ?, ?)",
            (employee.employee_id, employee.full_name, employee.email, employee.department)
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        if "employee_id" in str(e):
            raise HTTPException(status_code=400, detail="Employee ID already exists")
        elif "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already exists")
        else:
            raise HTTPException(status_code=400, detail="Database constraint violation")
    
    conn.close()
    return employee

@app.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    
    # Check if employee exists
    cursor.execute("SELECT employee_id FROM employees WHERE employee_id = ?", (employee_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Delete attendance records first
    cursor.execute("DELETE FROM attendance WHERE employee_id = ?", (employee_id,))
    
    # Delete employee
    cursor.execute("DELETE FROM employees WHERE employee_id = ?", (employee_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Employee deleted successfully"}

# Attendance endpoints
@app.post("/attendance", response_model=AttendanceResponse)
async def mark_attendance(attendance: AttendanceRecord):
    if attendance.status not in ["Present", "Absent"]:
        raise HTTPException(status_code=400, detail="Status must be 'Present' or 'Absent'")
    
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    
    # Check if employee exists
    cursor.execute("SELECT employee_id FROM employees WHERE employee_id = ?", (attendance.employee_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    
    try:
        cursor.execute(
            "INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)",
            (attendance.employee_id, attendance.date, attendance.status)
        )
        conn.commit()
        
        # Get the inserted record
        cursor.execute(
            "SELECT id, employee_id, date, status FROM attendance WHERE employee_id = ? AND date = ?",
            (attendance.employee_id, attendance.date)
        )
        record = cursor.fetchone()
        conn.close()
        
        return AttendanceResponse(
            id=record[0],
            employee_id=record[1],
            date=record[2],
            status=record[3]
        )
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Attendance already marked for this date")

@app.get("/attendance/{employee_id}", response_model=List[AttendanceResponse])
async def get_employee_attendance(employee_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    
    # Check if employee exists
    cursor.execute("SELECT employee_id FROM employees WHERE employee_id = ?", (employee_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Build query with optional date filters
    query = "SELECT id, employee_id, date, status FROM attendance WHERE employee_id = ?"
    params = [employee_id]
    
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    
    query += " ORDER BY date DESC"
    
    cursor.execute(query, params)
    records = cursor.fetchall()
    conn.close()
    
    return [AttendanceResponse(
        id=record[0],
        employee_id=record[1],
        date=record[2],
        status=record[3]
    ) for record in records]

@app.get("/")
async def root():
    return {"message": "HRMS Lite API is running"}

@app.get("/dashboard")
async def get_dashboard():
    conn = sqlite3.connect('hrms.db')
    cursor = conn.cursor()
    
    # Total employees
    cursor.execute("SELECT COUNT(*) FROM employees")
    total_employees = cursor.fetchone()[0]
    
    # Total attendance records
    cursor.execute("SELECT COUNT(*) FROM attendance")
    total_records = cursor.fetchone()[0]
    
    # Present days per employee
    cursor.execute("""
        SELECT e.employee_id, e.full_name, 
               COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
               COUNT(a.status) as total_days
        FROM employees e
        LEFT JOIN attendance a ON e.employee_id = a.employee_id
        GROUP BY e.employee_id, e.full_name
        ORDER BY present_days DESC
    """)
    employee_stats = cursor.fetchall()
    
    conn.close()
    
    return {
        "total_employees": total_employees,
        "total_attendance_records": total_records,
        "employee_stats": [
            {
                "employee_id": stat[0],
                "full_name": stat[1],
                "present_days": stat[2],
                "total_days": stat[3]
            } for stat in employee_stats
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)