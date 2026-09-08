import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { validateEmail } from '../utils/helpers'
import Logo from '../components/Logo'
import AuthLayout from '../components/AuthLayout'
import AuthField from '../components/AuthField'
import AuthSubmit, { AuthError } from '../components/AuthSubmit'
import { authService } from '../services/authService'

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm()

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
    <AuthLayout
      eyebrow="Regain access"
      headline={<>Recover your<br /><span className="text-primary-200">account safely.</span></>}
      subcopy="We'll send you a secure link to reset your password and get back to managing your finances."
      footerNote={`© ${new Date().getFullYear()} Spendly. Your security matters.`}
    >
      <div className="lg:hidden flex justify-center mb-8">
        <Logo size="large" />
      </div>

      {!submitted ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight text-ink mb-2">Reset password</h1>
            <p className="text-ink-mute text-sm">Enter your email and we'll send you a link to reset your password.</p>
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

              <AuthError message={errors.root?.message} />

              <AuthSubmit loading={isLoading} loadingText="Sending...">
                Send reset link
              </AuthSubmit>
            </form>
          </div>

          <p className="text-center text-sm text-ink-mute mt-6">
            <Link to="/login" className="font-semibold text-primary-500 hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight text-ink mb-2">Check your email</h1>
            <p className="text-ink-mute text-sm">
              We've sent a password reset link to{' '}
              <span className="font-medium text-ink-secondary">{submittedEmail}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-light text-ink">Check your inbox</h2>
                <p className="text-ink-mute text-sm leading-relaxed">
                  We've sent a secure link to reset your password. The link will expire in 1 hour.
                </p>
              </div>

              <div className="space-y-3 pt-4 text-left">
                <p className="text-sm text-ink-mute"><strong>Didn't receive the email?</strong></p>
                <ul className="text-sm text-ink-mute space-y-2">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• Try requesting the link again</li>
                </ul>
              </div>

              <button
                onClick={() => setSubmitted(false)}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm border border-primary-500/30 bg-primary-500/10 text-primary-500 hover:bg-primary-500/15 transition-colors"
              >
                Try another email
              </button>

              <Link
                to="/login"
                className="block py-3 px-4 rounded-2xl font-semibold text-white text-sm bg-primary-500 hover:bg-primary-600 shadow-[0_4px_20px_rgba(83,58,253,0.3)] transition-colors"
              >
                Back to login
              </Link>
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
