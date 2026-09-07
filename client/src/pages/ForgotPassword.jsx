import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
import { authService } from '../services/authService'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm()

  const email = watch('email')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authService.requestPasswordReset(data.email)
      setSubmittedEmail(data.email)
      setSubmitted(true)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request password reset'
      setError('root', { message })
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
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Regain access</p>
          <h2 className="text-5xl font-light text-white tracking-tight leading-tight mb-6">
            Recover your<br/>
            <span style={{color:'#b9b9f9'}}>account safely.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            We'll send you a secure link to reset your password and get back to managing your finances.
          </p>
        </div>

        <p className="text-white/30 text-xs relative z-10">© {new Date().getFullYear()} Spendly. Your security matters.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 items-center justify-center py-12 px-6 lg:px-14">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="large" />
          </div>

          {!submitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl font-light tracking-tight text-[#0d253d] mb-2">Reset password</h1>
                <p className="text-[#64748d] text-sm">Enter your email and we'll send you a link to reset your password.</p>
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
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Sending...</>
                      ) : 'Send reset link'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Back to login link */}
              <p className="text-center text-sm text-[#64748d] mt-6">
                <Link to="/login" className="font-semibold text-[#533afd] hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Success message */}
              <div className="mb-8">
                <h1 className="text-3xl font-light tracking-tight text-[#0d253d] mb-2">Check your email</h1>
                <p className="text-[#64748d] text-sm">We've sent a password reset link to <span className="font-medium text-[#273951]">{submittedEmail}</span></p>
              </div>

              {/* Success card */}
              <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
                <div className="text-center space-y-6">
                  {/* Success icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-light text-[#0d253d]">Check your inbox</h2>
                    <p className="text-[#64748d] text-sm leading-relaxed">
                      We've sent a secure link to reset your password. The link will expire in 1 hour.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <p className="text-sm text-[#64748d]">
                      <strong>Didn't receive the email?</strong>
                    </p>
                    <ul className="text-sm text-[#64748d] space-y-2 text-left">
                      <li>• Check your spam or junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Try requesting the link again</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full py-3 px-4 rounded-2xl font-semibold text-white text-sm border border-[#533afd]/30"
                    style={{background:'rgba(83,58,253,0.1)',color:'#533afd'}}
                  >
                    Try another email
                  </button>

                  <Link
                    to="/login"
                    className="block py-3 px-4 rounded-2xl font-semibold text-white text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #533afd 0%, #6d5cff 100%)',
                      boxShadow: '0 4px 20px rgba(83,58,253,0.3)',
                    }}
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
