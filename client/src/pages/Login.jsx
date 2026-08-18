import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, TrendingDown, TrendingUp, ShieldCheck } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'

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
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Your finances, simplified</p>
          <h2 className="text-5xl font-light text-white tracking-tight leading-tight mb-6">
            Every rupee<br/>
            <span style={{color:'#b9b9f9'}}>accounted for.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            Track expenses, visualize spending patterns, and take control of your financial future.
          </p>
          {/* Stat pills */}
          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: TrendingDown, label: 'Monthly Expenses', value: '₹31,200', color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
              { icon: TrendingUp, label: 'Monthly Income', value: '₹48,500', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
              { icon: ShieldCheck, label: 'Net Balance', value: '+₹17,300', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)' },
            ].map(({ icon: Icon, label, value, color, bg, border }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-3 rounded-2xl" style={{background:bg,border:`1px solid ${border}`}}>
                <div className="p-2 rounded-xl" style={{background:'rgba(255,255,255,0.08)'}}>
                  <Icon size={16} style={{color}} />
                </div>
                <div>
                  <div className="text-white/50 text-xs">{label}</div>
                  <div className="text-white font-medium text-sm" style={{fontVariant:'tabular-nums'}}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">© {new Date().getFullYear()} Spendly. Your data stays private.</p>
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
            <h1 className="text-3xl font-light tracking-tight text-[#0d253d] mb-2">Welcome back</h1>
            <p className="text-[#64748d] text-sm">Sign in to your Spendly account to continue.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-[#273951]">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#64748d] group-focus-within:text-[#533afd] transition-colors" />
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
                      "block w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-200 text-sm min-h-[44px]",
                      "bg-white border text-[#0d253d] placeholder:text-[#64748d]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : "border-[#a8c3de]"
                    )}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>•</span> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-[#273951]">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-[#533afd] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#64748d] group-focus-within:text-[#533afd] transition-colors" />
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
                      "block w-full pl-11 pr-12 py-3 rounded-xl transition-all duration-200 text-sm min-h-[44px]",
                      "bg-white border text-[#0d253d] placeholder:text-[#64748d]/50",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#533afd] focus:ring-[#533afd]/15",
                      errors.password ? "border-red-400" : "border-[#a8c3de]"
                    )}
                    placeholder="••••••••"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <EyeOff className="h-5 w-5 text-[#64748d] hover:text-[#273951] transition-colors" />
                      : <Eye className="h-5 w-5 text-[#64748d] hover:text-[#273951] transition-colors" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1"><span>•</span> {errors.password.message}</p>
                )}
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
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Signing in...</>
                  ) : 'Sign in'}
                </span>
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-[#64748d] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#533afd] hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
