import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { validateEmail, validatePassword } from '../utils/helpers'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
import AuthAside from '../components/AuthAside'

const Register = () => {
  const { register: registerUser } = useAuth()
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

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      <AuthAside
        title="Open a ledger in a minute"
        text="Pick your currency, add what you spend and earn, and see the month take shape."
      />

      <div className="flex flex-1 items-center justify-center py-12 px-6 lg:px-14">
        <div className="w-full max-w-lg">
          <div>
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Logo />
            </div>

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-medium mb-2 text-[#171717]">
                Create your account
              </h1>
              <p className="text-sm text-[#737373]">Free to use · No credit card</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name field */}
                <div className="space-y-1">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[#404040]"
                  >
                    Full name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-[#737373] group-focus-within:text-[#171717]" />
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
                        "block w-full pl-11 pr-4 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-white border border-[#d4d4d4] text-[#171717] placeholder:text-[#737373]/60 focus:border-brass-700 focus:ring-brass-700/20",
                        errors.name && "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
                      )}
                      placeholder="Asha Mehta"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email field */}
                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#404040]"
                  >
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-[#737373] group-focus-within:text-[#171717]" />
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
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-white border border-[#d4d4d4] text-[#171717] placeholder:text-[#737373]/60 focus:border-brass-700 focus:ring-brass-700/20",
                        errors.email && "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
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
              </div>

              {/* Currency field - Full Width */}
              <div className="space-y-1">
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-[#404040]"
                >
                  Currency
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-base font-medium text-[#737373] group-focus-within:text-[#171717]">
                      {currencyMap[selectedCurrency || 'USD'].symbol}
                    </span>
                  </div>
                  <select
                    id="currency"
                    {...register('currency', { required: 'Currency is required' })}
                    className={cn(
                      "block w-full pl-11 pr-4 py-2.5 rounded-xl transition-colors text-sm font-medium appearance-none cursor-pointer min-h-[44px]",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0",
                      "bg-white border border-[#d4d4d4] text-[#171717] placeholder:text-[#737373]/60 focus:border-brass-700 focus:ring-brass-700/20",
                      errors.currency && "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
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
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.currency.message}
                  </p>
                )}
              </div>

              {/* Row 2: Password and Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password field */}
                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#404040]"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#737373] group-focus-within:text-[#171717]" />
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
                        "block w-full pl-11 pr-12 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-white border border-[#d4d4d4] text-[#171717] placeholder:text-[#737373]/60 focus:border-brass-700 focus:ring-brass-700/20",
                        errors.password && "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
                      )}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-1">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-[#404040]"
                  >
                    Confirm password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#737373] group-focus-within:text-[#171717]" />
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
                        "block w-full pl-11 pr-12 py-2.5 rounded-lg transition-colors text-sm min-h-[44px]",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        "bg-white border border-[#d4d4d4] text-[#171717] placeholder:text-[#737373]/60 focus:border-brass-700 focus:ring-brass-700/20",
                        errors.confirmPassword && "!border-red-500 focus:!border-red-500 focus:!ring-red-500/20"
                      )}
                      placeholder="Repeat the password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#737373] hover:text-[#404040] transition-colors" />
                    )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Error message */}
              {errors.root && (
                <div className={cn(
                  "rounded-lg p-3 border",
                    "bg-red-50 border-red-200"
                )}>
                  <p className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    "text-red-600"
                  )}>
                    <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg w-full mt-4"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                      Creating account
                    </>
                  ) : (
                    'Create account'
                  )}
                </span>
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-[#e5e5e5]">
            <p className="text-sm text-[#737373]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-[#171717] underline decoration-[#d4d4d4] underline-offset-4 hover:decoration-[#171717] transition-colors"
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
