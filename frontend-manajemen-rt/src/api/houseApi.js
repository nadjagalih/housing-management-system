import api from './axios'

export const getHouses        = (params)    => api.get('/houses', { params })
export const getHouse         = (id)        => api.get(`/houses/${id}`)
export const createHouse      = (data)      => api.post('/houses', data)
export const updateHouse      = (id, data)  => api.put(`/houses/${id}`, data)
export const assignResident   = (id, data)  => api.post(`/houses/${id}/assign-resident`, data)
export const unassignResident = (id, data)  => api.post(`/houses/${id}/unassign-resident`, data)
