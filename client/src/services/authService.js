import api from './api'

export const authService = {
  // Register new user
  register: (name, email, password, currency) => {
    return api.post('/auth/register', { name, email, password, currency })
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

  // Request password reset
  requestPasswordReset: (email) => {
    return api.post('/auth/forgot-password', { email })
  },

  // Reset password with token
  resetPassword: (token, newPassword) => {
    return api.post('/auth/reset-password', { token, newPassword })
  },
}
