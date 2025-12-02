import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import { cn } from '../utils/cn'
import ThemeToggle from '../components/ThemeToggle'

const Login = () => {
  const { login } = useAuth()
  const { theme } = useTheme()
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
        navigate('/dashboard')
      } else {
        setError('root', { message: result.error })
      }
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-all duration-500",
      isDark
        ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
        : "bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50"
    )}>
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse",
          isDark ? "bg-primary-600" : "bg-primary-300"
        )} style={{ animationDuration: '4s' }} />
        <div className={cn(
          "absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse",
          isDark ? "bg-blue-600" : "bg-blue-300"
        )} style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Glassmorphism Card */}
        <div className={cn(
          "rounded-3xl shadow-2xl backdrop-blur-xl transition-all duration-500 border",
          isDark
            ? "bg-gray-900/80 border-gray-800/50 shadow-primary-500/10"
            : "bg-white/80 border-white/20 shadow-primary-500/20"
        )}>
          {/* Card Content */}
          <div className="p-8 sm:p-10">
            {/* Logo with Gradient */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-3xl">$</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className={cn(
                "text-3xl font-bold mb-3 transition-colors",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Welcome back
              </h2>
              <p className={cn(
                "text-sm transition-colors",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                Sign in to continue to your account
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className={cn(
                    "block text-sm font-medium transition-colors",
                    isDark ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={cn(
                      "h-5 w-5 transition-colors",
                      isDark ? "text-gray-500 group-focus-within:text-primary-500" : "text-gray-400 group-focus-within:text-primary-600"
                    )} />
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
                      "block w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0",
                      isDark
                        ? "bg-gray-800/50 border-2 border-gray-700 placeholder-gray-500 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20"
                        : "bg-gray-50 border-2 border-gray-200 placeholder-gray-400 text-gray-900 hover:bg-white focus:bg-white focus:border-primary-500 focus:ring-primary-500/20",
                      errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                    <span>•</span> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className={cn(
                      "block text-sm font-medium transition-colors",
                      isDark ? "text-gray-300" : "text-gray-700"
                    )}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className={cn(
                      "text-xs font-medium transition-colors hover:underline",
                      isDark ? "text-primary-400 hover:text-primary-300" : "text-primary-600 hover:text-primary-700"
                    )}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className={cn(
                      "h-5 w-5 transition-colors",
                      isDark ? "text-gray-500 group-focus-within:text-primary-500" : "text-gray-400 group-focus-within:text-primary-600"
                    )} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className={cn(
                      "block w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-300 text-sm font-medium",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0",
                      isDark
                        ? "bg-gray-800/50 border-2 border-gray-700 placeholder-gray-500 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20"
                        : "bg-gray-50 border-2 border-gray-200 placeholder-gray-400 text-gray-900 hover:bg-white focus:bg-white focus:border-primary-500 focus:ring-primary-500/20",
                      errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                      )} />
                    ) : (
                      <Eye className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                      )} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                    <span>•</span> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error message */}
              {errors.root && (
                <div className={cn(
                  "rounded-xl p-4 animate-in slide-in-from-top-2 border",
                  isDark
                    ? "bg-red-950/30 border-red-900/50 backdrop-blur-sm"
                    : "bg-red-50 border-red-200"
                )}>
                  <p className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    isDark ? "text-red-400" : "text-red-800"
                  )}>
                    <span className="text-base">⚠</span>
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "relative w-full py-3.5 px-4 rounded-xl font-semibold text-white text-sm",
                  "bg-gradient-to-r from-primary-600 via-primary-600 to-blue-600",
                  "hover:from-primary-700 hover:via-primary-700 hover:to-blue-700",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  isDark ? "focus:ring-offset-gray-900" : "focus:ring-offset-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  "shadow-lg hover:shadow-xl shadow-primary-500/25",
                  "overflow-hidden group"
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className={cn(
            "px-8 py-6 border-t",
            isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50/50 border-gray-200"
          )}>
            <p className={cn(
              "text-center text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className={cn(
                  "font-semibold transition-colors hover:underline",
                  isDark ? "text-primary-400 hover:text-primary-300" : "text-primary-600 hover:text-primary-700"
                )}
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
