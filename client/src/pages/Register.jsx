import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, DollarSign } from 'lucide-react'
import { validateEmail, validatePassword } from '../utils/helpers'
import { cn } from '../utils/cn'
import ThemeToggle from '../components/ThemeToggle'
import Logo from '../components/Logo'

const Register = () => {
  const { register: registerUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm({
    defaultValues: {
      currency: 'USD'
    }
  })

  const password = watch('password')
  const selectedCurrency = watch('currency')

  // Currency display mapping
  const currencyMap = {
    'USD': { name: 'US Dollar ($)', symbol: '$' },
    'EUR': { name: 'Euro (€)', symbol: '€' },
    'INR': { name: 'Indian Rupee (₹)', symbol: '₹' },
    'GBP': { name: 'British Pound (£)', symbol: '£' },
    'JPY': { name: 'Japanese Yen (¥)', symbol: '¥' },
    'CNY': { name: 'Chinese Yuan (¥)', symbol: '¥' },
    'CAD': { name: 'Canadian Dollar (C$)', symbol: 'C$' },
    'AUD': { name: 'Australian Dollar (A$)', symbol: 'A$' }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)

    try {
      const result = await registerUser(data.name, data.email, data.password, data.currency)
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

  const isDark = true;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-950 noise-overlay overflow-hidden">
      {/* Liquid Glass Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="Fluid Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950/80 to-slate-950/90"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Glassmorphism Card */}
        <div className="rounded-3xl shadow-2xl backdrop-blur-xl border bg-gray-900/80 border-gray-800/50 shadow-primary-500/10">
          {/* Card Content */}
          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-5">
              <Logo size="default" />
            </div>

            {/* Title */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold mb-2 text-white">
                Get started for free
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name field */}
                <div className="space-y-1">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        },
                        maxLength: {
                          value: 50,
                          message: 'Name cannot exceed 50 characters'
                        }
                      })}
                      className={cn(
                        "block w-full pl-11 pr-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-gray-800/50 border-2 border-gray-700 placeholder-gray-500 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20",
                        errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <span>•</span> {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email field */}
                <div className="space-y-1">
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
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
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
                        "block w-full pl-11 pr-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-gray-800/50 border-2 border-gray-700 placeholder-gray-500 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20",
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
              </div>

              {/* Currency field - Full Width */}
              <div className="space-y-1">
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-300"
                >
                  Preferred Currency
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-base font-semibold text-gray-500 group-focus-within:text-primary-500">
                      {currencyMap[selectedCurrency || 'USD'].symbol}
                    </span>
                  </div>
                  <select
                    id="currency"
                    {...register('currency', { required: 'Currency is required' })}
                    className={cn(
                      "block w-full pl-11 pr-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium appearance-none cursor-pointer min-h-[44px]",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0",
                      "bg-gray-800/50 border-2 border-gray-700 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20",
                      errors.currency && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
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
                {errors.currency && (
                  <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                    <span>•</span> {errors.currency.message}
                  </p>
                )}
              </div>

              {/* Row 2: Password and Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password field */}
                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password', {
                        required: 'Password is required',
                        validate: (value) => validatePassword(value) || 'Password must be at least 6 characters'
                      })}
                      className={cn(
                        "block w-full pl-11 pr-12 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-gray-800/50 border-2 border-gray-700 placeholder-gray-500 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20",
                        errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                      placeholder="Create a password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-all duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-all duration-200" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <span>•</span> {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-1">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === password || 'Passwords do not match'
                      })}
                      className={cn(
                        "block w-full pl-11 pr-12 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-gray-800/50 border-2 border-gray-700 placeholder-gray-500 text-white hover:bg-gray-800/70 focus:bg-gray-800 focus:border-primary-500 focus:ring-primary-500/20",
                        errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-all duration-200" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-all duration-200" />
                    )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <span>•</span> {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Error message */}
              {errors.root && (
                <div className={cn(
                  "rounded-xl p-3 animate-in slide-in-from-top-2 border",
                    "bg-red-950/30 border-red-900/50 backdrop-blur-sm"
                )}>
                  <p className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    "text-red-400"
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
                  "relative w-full py-3 px-4 rounded-xl font-semibold text-white text-sm mt-4",
                  "bg-gradient-to-r from-primary-600 via-primary-600 to-blue-600",
                  "hover:from-primary-700 hover:via-primary-700 hover:to-blue-700",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  "focus:ring-offset-gray-900",
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
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </span>
              </button>
            </form>
          </div>

          <div className="px-6 py-4 border-t bg-gray-900/50 border-gray-800">
            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold transition-colors hover:underline text-primary-400 hover:text-primary-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
