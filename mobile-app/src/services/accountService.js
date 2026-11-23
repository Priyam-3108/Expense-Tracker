// mobile-app/src/services/accountService.js
import api from './api';

export const accountService = {
  list: (includeArchived = false) =>
    api.get('/accounts', { params: includeArchived ? { includeArchived: 'true' } : {} }),
  create: (body) => api.post('/accounts', body),
  update: (id, body) => api.put(`/accounts/${id}`, body),
  remove: (id) => api.delete(`/accounts/${id}`),
  reconcile: (id, targetBalance) => api.post(`/accounts/${id}/reconcile`, { targetBalance }),
  statement: (id, params = {}) => api.get(`/accounts/${id}/statement`, { params }),
};
