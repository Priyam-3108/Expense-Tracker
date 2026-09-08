import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User, ShieldCheck, Sparkles, CreditCard } from 'lucide-react'
import { validateEmail, validatePassword } from '../utils/helpers'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
import AuthLayout from '../components/AuthLayout'
import AuthField from '../components/AuthField'
import AuthSubmit, { AuthError } from '../components/AuthSubmit'

const CURRENCIES = [
  ['USD', 'US Dollar ($)', '$'],
  ['EUR', 'Euro (€)', '€'],
  ['INR', 'Indian Rupee (₹)', '₹'],
  ['GBP', 'British Pound (£)', '£'],
  ['JPY', 'Japanese Yen (¥)', '¥'],
  ['CNY', 'Chinese Yuan (¥)', '¥'],
  ['CAD', 'Canadian Dollar (C$)', 'C$'],
  ['AUD', 'Australian Dollar (A$)', 'A$'],
]
const SYMBOL = Object.fromEntries(CURRENCIES.map(([code, , sym]) => [code, sym]))

const PANEL_POINTS = [
  { icon: Sparkles, label: 'Free forever', text: 'No credit card, no trial clock.' },
  { icon: CreditCard, label: 'Your currency', text: 'Pick from 8 currencies at sign-up.' },
  { icon: ShieldCheck, label: 'Private by default', text: 'Your data is yours — export or delete anytime.' },
]

const Register = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm({ defaultValues: { currency: 'USD' } })

  const password = watch('password')
  const selectedCurrency = watch('currency') || 'USD'

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await registerUser(data.name, data.email, data.password, data.currency)
      if (result.success) {
        navigate('/app/dashboard')
      } else {
        setError('root', { message: result.error })
      }
    } catch {
      setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      formWidth="lg"
      eyebrow="Get started for free"
      headline={<>Start tracking<br /><span className="text-primary-200">in 30 seconds.</span></>}
      subcopy="Create your account with just a name, email and preferred currency. No credit card required."
      panelChildren={
        <ul className="mt-10 flex flex-col gap-5">
          {PANEL_POINTS.map(({ icon: Icon, label, text }) => (
            <li key={label} className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-white/[0.08] shrink-0">
                <Icon size={18} className="text-primary-200" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">{label}</div>
                <div className="text-white/50 text-sm">{text}</div>
              </div>
            </li>
          ))}
        </ul>
      }
    >
      <div className="lg:hidden flex justify-center mb-8">
        <Logo size="large" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-ink mb-2">Create your account</h1>
        <p className="text-ink-mute text-sm">Free forever. No credit card required.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AuthField
              id="name"
              label="Full name"
              icon={User}
              autoComplete="name"
              placeholder="Jane Doe"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
              })}
            />
            <AuthField
              id="email"
              label="Email address"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                validate: (v) => validateEmail(v) || 'Please enter a valid email',
              })}
            />
          </div>

          {/* Currency — native select styled to match AuthField */}
          <div className="space-y-1.5">
            <label htmlFor="currency" className="block text-sm font-medium text-ink-secondary">
              Preferred currency
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-base font-semibold text-ink-mute group-focus-within:text-primary-500">
                  {SYMBOL[selectedCurrency]}
                </span>
              </div>
              <select
                id="currency"
                {...register('currency', { required: 'Currency is required' })}
                className={cn(
                  'block w-full pl-11 pr-10 py-3 rounded-xl text-sm min-h-[44px] bg-white appearance-none cursor-pointer',
                  'text-ink border border-[#a8c3de] transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-primary-500 focus:ring-primary-500/15',
                  errors.currency && 'border-red-400'
                )}
              >
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-ink-mute"
                viewBox="0 0 20 20" fill="none"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {errors.currency && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span aria-hidden="true">•</span> {errors.currency.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AuthField
              id="password"
              label="Password"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                validate: (v) => validatePassword(v) || 'Password must be at least 6 characters',
              })}
            />
            <AuthField
              id="confirmPassword"
              label="Confirm password"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
          </div>

          <AuthError message={errors.root?.message} />

          <AuthSubmit loading={isLoading} loadingText="Creating account...">
            Create account
          </AuthSubmit>
        </form>
      </div>

      <p className="text-center text-sm text-ink-mute mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-500 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register
