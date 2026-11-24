import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
import AuthAside from '../components/AuthAside'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        navigate('/app/dashboard')
      } else {
        setError('root', { message: result.error })
      }
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      <AuthAside
        title="Every rupee accounted for"
        text="Track expenses and income by category, and see where your money goes each month."
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
            <h1 className="text-2xl font-medium text-[#171717] mb-2">Sign in</h1>
            <p className="text-[#737373] text-sm">Use the email and password for your Spendly account</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-[#404040]">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-[#737373] group-focus-within:text-[#533afd] transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      validate: (value) => validateEmail(value) || 'Please enter a valid email'
                    })}
                    className={cn(
                      "block w-full pl-11 pr-4 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                      "bg-white border text-[#171717] placeholder:text-[#737373]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : "border-[#d4d4d4]"
                    )}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-[#404040]">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[#533afd] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#737373] group-focus-within:text-[#533afd] transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className={cn(
                      "block w-full pl-11 pr-12 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                      "bg-white border text-[#171717] placeholder:text-[#737373]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.password ? "border-red-400" : "border-[#d4d4d4]"
                    )}
                    placeholder="••••••••"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <EyeOff className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                      : <Eye className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">{errors.password.message}</p>
                )}
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
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Signing in</>
                  ) : 'Sign in'}
                </span>
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-[#737373] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#533afd] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
