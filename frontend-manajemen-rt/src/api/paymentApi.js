import api from './axios'

export const getPayments       = (params)    => api.get('/payments', { params })
export const getPayment        = (id)        => api.get(`/payments/${id}`)
export const createPayment     = (data)      => api.post('/payments', data)
export const generateMonthly   = (data)      => api.post('/payments/generate-monthly', data)
export const markPaid          = (id, data)  => api.put(`/payments/${id}/mark-paid`, data)
export const deletePayment     = (id)        => api.delete(`/payments/${id}`)
export const getPaymentTypes   = ()          => api.get('/payment-types')
export const updatePaymentType = (id, data)  => api.put(`/payment-types/${id}`, data)
