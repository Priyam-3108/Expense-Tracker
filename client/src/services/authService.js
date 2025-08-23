import api from './api'

export const authService = {
  // Register new user
  register: (name, email, password) => {
    return api.post('/auth/register', { name, email, password })
  },

  // Login user
  login: (email, password) => {
    return api.post('/auth/login', { email, password })
  },

  // Get current user profile
  getProfile: () => {
    return api.get('/auth/profile')
  },

  // Update user profile
  updateProfile: (updates) => {
    return api.put('/auth/profile', updates)
  },

  // Change password
  changePassword: (currentPassword, newPassword) => {
    return api.put('/auth/change-password', { currentPassword, newPassword })
  },
}
