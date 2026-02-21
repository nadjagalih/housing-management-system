import api from './axios'

export const getDashboard     = ()       => api.get('/reports/dashboard')
export const getSummary       = (params) => api.get('/reports/summary', { params })
export const getMonthlyDetail = (params) => api.get('/reports/monthly-detail', { params })
export const getUnpaid        = (params) => api.get('/reports/unpaid', { params })
