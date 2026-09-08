import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { Mail, Lock, PieChart, Download, Wallet } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import Logo from '../components/Logo'
import AuthLayout from '../components/AuthLayout'
import AuthField from '../components/AuthField'
import AuthSubmit, { AuthError } from '../components/AuthSubmit'

const PANEL_POINTS = [
  { icon: Wallet, label: 'Track every rupee', text: 'Log expenses in seconds, organised your way.' },
  { icon: PieChart, label: 'See where it goes', text: 'Category breakdowns and spending trends at a glance.' },
  { icon: Download, label: 'Export anytime', text: 'Your data as CSV, Excel or PDF — no lock-in.' },
]

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
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
    } catch {
      setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Your finances, simplified"
      headline={<>Every rupee<br /><span className="text-primary-200">accounted for.</span></>}
      subcopy="Track expenses, visualise spending patterns, and take control of your financial future."
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
      {/* Mobile logo */}
      <div className="lg:hidden flex justify-center mb-8">
        <Logo size="large" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-ink mb-2">Welcome back</h1>
        <p className="text-ink-mute text-sm">Sign in to your Spendly account to continue.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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

          <AuthField
            id="password"
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            labelAside={
              <Link to="/forgot-password" className="text-xs font-medium text-primary-500 hover:underline">
                Forgot password?
              </Link>
            }
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />

          <AuthError message={errors.root?.message} />

          <AuthSubmit loading={isLoading} loadingText="Signing in...">
            Sign in
          </AuthSubmit>
        </form>
      </div>

      <p className="text-center text-sm text-ink-mute mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-500 hover:underline">
          Sign up for free
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
