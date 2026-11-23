// mobile-app/src/services/transferService.js
import api from './api';

export const transferService = {
  list: (params = {}) => api.get('/transfers', { params }),
  create: (body) => api.post('/transfers', body),
  remove: (id) => api.delete(`/transfers/${id}`),
  sync: (transfers) => api.post('/transfers/sync', { transfers }),
};
