import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const employeeAPI = {
  getAll: () => api.get('/employees'),
  create: (employee) => api.post('/employees', employee),
  delete: (employeeId) => api.delete(`/employees/${employeeId}`),
}

export const attendanceAPI = {
  mark: (attendance) => api.post('/attendance', attendance),
  getByEmployee: (employeeId, startDate = null, endDate = null) => {
    let url = `/attendance/${employeeId}`
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (params.toString()) url += `?${params.toString()}`
    return api.get(url)
  },
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
}

export default api