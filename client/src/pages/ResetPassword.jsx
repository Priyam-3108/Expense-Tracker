import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
import AuthAside from '../components/AuthAside'
import { authService } from '../services/authService'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm()

  const newPassword = watch('newPassword')

  const onSubmit = async (data) => {
    if (!token) {
      setError('root', { message: 'Invalid reset link' })
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.newPassword)
      navigate('/login?reset=success')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password'
      setError('root', { message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 space-y-4 text-center">
            <div className="flex justify-center">
              <AlertCircle size={24} strokeWidth={1.5} className="text-[#d97706]" />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-[#171717] mb-2">Invalid reset link</h1>
              <p className="text-[#737373] text-sm mb-4">The password reset link is missing or invalid. Request a new one below.</p>
            </div>
            <Link
              to="/forgot-password"
              className="btn-primary btn-lg w-full"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      <AuthAside
        title="Create a new password"
        text="Choose a strong password to protect your Spendly account."
      />

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 items-center justify-center py-12 px-6 lg:px-14">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="large" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-[#171717] mb-2">Create new password</h1>
            <p className="text-[#737373] text-sm">Enter a strong password to regain access to your account.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#404040]">
                  New password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#737373] group-focus-within:text-[#533afd] transition-colors" />
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    {...register('newPassword', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className={cn(
                      "block w-full pl-11 pr-12 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                      "bg-white border text-[#171717] placeholder:text-[#737373]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.newPassword ? "border-red-400" : "border-[#d4d4d4]"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                      : <Eye className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#404040]">
                  Confirm password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#737373] group-focus-within:text-[#533afd] transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === newPassword || 'Passwords do not match'
                    })}
                    className={cn(
                      "block w-full pl-11 pr-12 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                      "bg-white border text-[#171717] placeholder:text-[#737373]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.confirmPassword ? "border-red-400" : "border-[#d4d4d4]"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword
                      ? <EyeOff className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                      : <Eye className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password requirements */}
              <div className="bg-[#f5f5f5] rounded-lg p-3">
                <p className="text-xs font-medium text-[#404040] mb-2">Password requirements</p>
                <ul className="text-xs text-[#737373] space-y-1 list-disc pl-4">
                  <li>At least 6 characters</li>
                  <li>Mix of numbers and letters recommended</li>
                  <li>Avoid using personal information</li>
                </ul>
              </div>

              {/* Root error */}
              {errors.root && (
                <div className="rounded-lg p-3 bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                    <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" /> {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Resetting</>
                  ) : 'Reset password'}
                </span>
              </button>
            </form>
          </div>

          {/* Back to login link */}
          <p className="text-center text-sm text-[#737373] mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-[#533afd] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
