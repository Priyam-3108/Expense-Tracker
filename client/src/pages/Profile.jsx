import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { setPrivate } = usePrivacy();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const privacyDefault = !!user?.privacyModeDefault;

  const [profileForm, setProfileForm] = useState({ name: '', email: '', currency: 'USD' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        currency: user.currency || 'USD',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileForm);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyDefaultChange = async (next) => {
    setSavingPrivacy(true)
    setPrivate(next) // immediate effect this session
    const result = await updateProfile({ privacyModeDefault: next })
    if (!result.success) {
      setPrivate(!next) // revert session — updateProfile already toasted the error
    }
    setSavingPrivacy(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile information' },
    { id: 'password', label: 'Change password'},
    { id: 'account', label: 'Account Info'},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">Profile</h1>
        <p className="text-gray-600 dark:text-[#85858b]">Manage your account settings and preferences</p>
      </div>

      <div className="border-b border-gray-200 dark:border-white/[0.06]">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-[#a1a1a6] hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/[0.15]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="glass-card">
        {activeTab === 'profile' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Profile information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={profileForm.currency}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="glass-input w-full"
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
                  className="btn-primary btn-md"
                >
                  {loading ? 'Updating...' : 'Update profile'}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Hide amounts by default</p>
                <p className="text-xs text-gray-500 dark:text-[#85858b]">
                  Masks all monetary values across the app until you reveal them.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={privacyDefault}
                disabled={savingPrivacy}
                onClick={() => handlePrivacyDefaultChange(!privacyDefault)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  privacyDefault ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-white/[0.15]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    privacyDefault ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Change password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                  New password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="glass-input w-full"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-1">Password must be at least 6 characters long</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="glass-input w-full"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary btn-md"
                >
                  {passwordLoading ? 'Changing...' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Account information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05]">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-[#a1a1a6] mb-1">Account ID</h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{user?._id || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05]">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-[#a1a1a6] mb-1">Member since</h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05]">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-[#a1a1a6] mb-1">Last updated</h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05]">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-[#a1a1a6] mb-1">Account status</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">Account security</h3>
                <ul className="text-sm text-indigo-800 dark:text-indigo-400 space-y-1">
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
  );
};

export default Profile;
