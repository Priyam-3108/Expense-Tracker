import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import { cn } from '../utils/cn'
import Logo from '../components/Logo'
import AuthAside from '../components/AuthAside'
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
    <div className="min-h-screen flex bg-[#fafafa]">
      <AuthAside
        title="Recover your account"
        text="We'll email you a link to reset your password."
      />

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
                <h1 className="text-2xl font-medium text-[#171717] mb-2">Reset password</h1>
                <p className="text-[#737373] text-sm">Enter your email and we'll send you a link to reset your password.</p>
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
                        <Mail className="h-4 w-4 text-[#737373] group-focus-within:text-brass-700 transition-colors" />
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
                          "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brass-700 focus:ring-brass-700/15",
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
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Sending</>
                      ) : 'Send reset link'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Back to sign in link */}
              <p className="text-center text-sm text-[#737373] mt-6">
                <Link to="/login" className="font-medium text-[#171717] underline decoration-[#d4d4d4] underline-offset-4 hover:decoration-[#171717] inline-flex items-center gap-1">
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Success message */}
              <div className="mb-8">
                <h1 className="text-2xl font-medium text-[#171717] mb-2">Check your email</h1>
                <p className="text-[#737373] text-sm">We've sent a password reset link to <span className="font-medium text-[#404040]">{submittedEmail}</span></p>
              </div>

              {/* Success card */}
              <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-8">
                <div className="text-center space-y-6">
                  {/* Success icon */}
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-medium text-[#171717]">Check your inbox</h2>
                    <p className="text-[#737373] text-sm leading-relaxed">
                      We've sent a secure link to reset your password. The link will expire in 1 hour.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <p className="text-sm text-[#737373]">
                      <strong>Didn't receive the email?</strong>
                    </p>
                    <ul className="text-sm text-[#737373] space-y-2 text-left">
                      <li>• Check your spam or junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Try requesting the link again</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary btn-lg w-full"
                  >
                    Try another email
                  </button>

                  <Link
                    to="/login"
                    className="btn-primary btn-lg w-full"
                  >
                    Back to sign in
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
