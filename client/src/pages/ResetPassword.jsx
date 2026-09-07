import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-light text-[#0d253d] mb-2">Invalid reset link</h1>
              <p className="text-[#64748d] text-sm mb-4">The password reset link is missing or invalid. Please request a new one.</p>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full py-3 px-4 rounded-2xl font-semibold text-white text-sm"
              style={{
                background: 'linear-gradient(135deg, #533afd 0%, #6d5cff 100%)',
                boxShadow: '0 4px 20px rgba(83,58,253,0.3)',
              }}
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden gradient-mesh-bg">
      {/* ── Left panel — decorative (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a1050 0%, #2e1b8a 45%, #533afd 100%)',
        }}
      >
        {/* Decorative orbs */}
        <div style={{position:'absolute',top:'-80px',right:'-80px',width:'320px',height:'320px',borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none'}} />
        <div style={{position:'absolute',bottom:'10%',left:'-60px',width:'240px',height:'240px',borderRadius:'50%',background:'rgba(234,34,97,0.15)',pointerEvents:'none'}} />
        <div style={{position:'absolute',top:'40%',right:'5%',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(185,185,249,0.08)',pointerEvents:'none'}} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)'}}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="13" cy="12" r="2.5" fill="#ea2261"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Spendly</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Secure your account</p>
          <h2 className="text-5xl font-light text-white tracking-tight leading-tight mb-6">
            Create a new<br/>
            <span style={{color:'#b9b9f9'}}>password.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            Choose a strong password to protect your Spendly account and financial data.
          </p>
        </div>

        <p className="text-white/30 text-xs relative z-10">© {new Date().getFullYear()} Spendly. Security first.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 items-center justify-center py-12 px-6 lg:px-14">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="large" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight text-[#0d253d] mb-2">Create new password</h1>
            <p className="text-[#64748d] text-sm">Enter a strong password to regain access to your account.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#273951]">
                  New password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#64748d] group-focus-within:text-[#533afd] transition-colors" />
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    {...register('newPassword', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className={cn(
                      "block w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 text-sm min-h-[44px]",
                      "bg-white border text-[#0d253d] placeholder:text-[#64748d]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.newPassword ? "border-red-400" : "border-[#a8c3de]"
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
                      ? <EyeOff className="h-5 w-5 text-[#64748d] hover:text-[#273951] transition-colors" />
                      : <Eye className="h-5 w-5 text-[#64748d] hover:text-[#273951] transition-colors" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>•</span> {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#273951]">
                  Confirm password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#64748d] group-focus-within:text-[#533afd] transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === newPassword || 'Passwords do not match'
                    })}
                    className={cn(
                      "block w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 text-sm min-h-[44px]",
                      "bg-white border text-[#0d253d] placeholder:text-[#64748d]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.confirmPassword ? "border-red-400" : "border-[#a8c3de]"
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
                      ? <EyeOff className="h-5 w-5 text-[#64748d] hover:text-[#273951] transition-colors" />
                      : <Eye className="h-5 w-5 text-[#64748d] hover:text-[#273951] transition-colors" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>•</span> {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">Password requirements:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ At least 6 characters</li>
                  <li>✓ Mix of numbers and letters recommended</li>
                  <li>✓ Avoid using personal information</li>
                </ul>
              </div>

              {/* Root error */}
              {errors.root && (
                <div className="rounded-xl p-4 bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                    <span>⚠</span> {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "relative w-full py-3.5 px-4 rounded-2xl font-semibold text-white text-sm overflow-hidden group",
                  "focus:outline-none focus:ring-2 focus:ring-[#533afd]/50 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transform transition-all duration-200 active:scale-[0.98]"
                )}
                style={{
                  background: 'linear-gradient(135deg, #533afd 0%, #6d5cff 100%)',
                  boxShadow: '0 4px 20px rgba(83,58,253,0.3)',
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Resetting...</>
                  ) : 'Reset password'}
                </span>
              </button>
            </form>
          </div>

          {/* Back to login link */}
          <p className="text-center text-sm text-[#64748d] mt-6">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-[#533afd] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
