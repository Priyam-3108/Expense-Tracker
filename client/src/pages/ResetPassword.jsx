import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'
import AuthLayout from '../components/AuthLayout'
import AuthField from '../components/AuthField'
import AuthSubmit, { AuthError } from '../components/AuthSubmit'
import { authService } from '../services/authService'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm()

  const newPassword = watch('newPassword')

  const onSubmit = async (data) => {
    if (!token) {
      setError('root', { message: 'Invalid reset link' })
      return
    }
    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.newPassword)
      navigate('/login?reset=success')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password'
      setError('root', { message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 gradient-mesh-bg">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-light text-ink mb-2">Invalid reset link</h1>
              <p className="text-ink-mute text-sm mb-4">
                The password reset link is missing or invalid. Please request a new one.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full py-3 px-4 rounded-2xl font-semibold text-white text-sm bg-primary-500 hover:bg-primary-600 shadow-[0_4px_20px_rgba(83,58,253,0.3)] transition-colors"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      eyebrow="Secure your account"
      headline={<>Create a new<br /><span className="text-primary-200">password.</span></>}
      subcopy="Choose a strong password to protect your Spendly account and financial data."
      footerNote={`© ${new Date().getFullYear()} Spendly. Security first.`}
    >
      <div className="lg:hidden flex justify-center mb-8">
        <Logo size="large" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-ink mb-2">Create new password</h1>
        <p className="text-ink-mute text-sm">Enter a strong password to regain access to your account.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_8px_32px_rgba(0,55,112,0.08)] p-8">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AuthField
            id="newPassword"
            label="New password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === newPassword || 'Passwords do not match',
            })}
          />

          {/* Password requirements — recoloured to the indigo palette */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
            <p className="text-xs font-medium text-primary-700 mb-2">Password requirements:</p>
            <ul className="text-xs text-primary-600 space-y-1">
              <li>✓ At least 6 characters</li>
              <li>✓ Mix of numbers and letters recommended</li>
              <li>✓ Avoid using personal information</li>
            </ul>
          </div>

          <AuthError message={errors.root?.message} />

          <AuthSubmit loading={isLoading} loadingText="Resetting...">
            Reset password
          </AuthSubmit>
        </form>
      </div>

      <p className="text-center text-sm text-ink-mute mt-6">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-primary-500 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ResetPassword
