import api from './axios'

export const getResidents   = (params)    => api.get('/residents', { params })
export const getResident    = (id)        => api.get(`/residents/${id}`)
export const createResident = (data)      => api.post('/residents', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
// Gunakan POST + _method override untuk PUT dengan file upload
export const updateResident = (id, data)  => api.post(`/residents/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteResident = (id)        => api.delete(`/residents/${id}`)
