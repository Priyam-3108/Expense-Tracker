// client/src/services/transferService.js
import api from './api'

export const transferService = {
  list: ({ from, to } = {}) => {
    const p = new URLSearchParams()
    if (from) p.append('from', from)
    if (to) p.append('to', to)
    const qs = p.toString()
    return api.get(`/transfers${qs ? `?${qs}` : ''}`)
  },
  create: (body) => api.post('/transfers', body),
  update: (id, body) => api.put(`/transfers/${id}`, body),
  remove: (id) => api.delete(`/transfers/${id}`),
}
