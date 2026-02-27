import { useState, useEffect } from 'react'
import { employeeAPI, attendanceAPI } from '../services/api'

const AttendanceManagement = () => {
  const [employees, setEmployees] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present'
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll()
      setEmployees(response.data)
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch employees')
    }
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await attendanceAPI.mark(formData)
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present'
      })
      setError('')
      if (selectedEmployee === formData.employee_id) {
        fetchAttendanceRecords(selectedEmployee)
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to mark attendance')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceRecords = async (
    employeeId,
    startDate = dateFilter.startDate || null,
    endDate = dateFilter.endDate || null,
  ) => {
    if (!employeeId) return
    
    setLoading(true)
    try {
      const response = await attendanceAPI.getByEmployee(
        employeeId,
        startDate,
        endDate,
      )
      setAttendanceRecords(response.data)
      setError('')
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch attendance records')
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId)
    if (employeeId) {
      fetchAttendanceRecords(employeeId)
    } else {
      setAttendanceRecords([])
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId)
    return employee ? employee.full_name : employeeId
  }

  const handleDateFilterChange = (e) => {
    setDateFilter({ ...dateFilter, [e.target.name]: e.target.value })
  }

  const applyDateFilter = () => {
    if (selectedEmployee) {
      fetchAttendanceRecords(selectedEmployee, dateFilter.startDate || null, dateFilter.endDate || null)
    }
  }

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' })
    if (selectedEmployee) {
      fetchAttendanceRecords(selectedEmployee, null, null)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Mark Attendance Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Attendance</h3>
        <form onSubmit={handleMarkAttendance} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.employee_id} - {employee.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Marking...' : 'Mark Attendance'}
          </button>
        </form>
      </div>

      {/* View Attendance Records */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">View Attendance Records</h3>
          <div className="mt-4 space-y-4">
            <select
              value={selectedEmployee}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              className="block w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Employee to View Records</option>
              {employees.map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.employee_id} - {employee.full_name}
                </option>
              ))}
            </select>
            
            {selectedEmployee && (
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={dateFilter.startDate}
                    onChange={handleDateFilterChange}
                    className="mt-1 block border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={dateFilter.endDate}
                    onChange={handleDateFilterChange}
                    className="mt-1 block border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={applyDateFilter}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Filter
                </button>
                <button
                  onClick={clearDateFilter}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {loading && selectedEmployee ? (
          <div className="p-6 text-center">Loading attendance records...</div>
        ) : !selectedEmployee ? (
          <div className="p-6 text-center text-gray-500">Select an employee to view attendance records</div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-lg font-medium">No attendance records found</div>
            <div className="text-sm mt-1">
              {getEmployeeName(selectedEmployee)} has not marked attendance yet
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEmployeeName(record.employee_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceManagement