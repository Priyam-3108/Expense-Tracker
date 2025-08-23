import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({ name: '', email: '', currency: 'USD' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '', currency: user.currency || 'USD' })
    }
  }, [user])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(profileForm)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    setPasswordLoading(true)
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: '👤' },
    { id: 'password', label: 'Change Password', icon: '🔒' },
    { id: 'account', label: 'Account Info', icon: 'ℹ️' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'profile' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={profileForm.currency}
                  onChange={e => setProfileForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="GBP">British Pound (£)</option>
                  <option value="JPY">Japanese Yen (¥)</option>
                  <option value="CNY">Chinese Yuan (¥)</option>
                  <option value="CAD">Canadian Dollar (C$)</option>
                  <option value="AUD">Australian Dollar (A$)</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Account ID</h3>
                  <p className="text-sm text-gray-900 font-mono">{user?._id || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                  <p className="text-sm text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-sm text-gray-900">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Account Status</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Account Security</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your password is securely hashed and stored</li>
                  <li>• All data is transmitted over encrypted connections</li>
                  <li>• Session tokens expire automatically for security</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
