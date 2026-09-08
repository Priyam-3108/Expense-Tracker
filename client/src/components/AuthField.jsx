import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../utils/cn'

const baseInput =
    'block w-full py-3 rounded-xl text-sm min-h-[44px] bg-white transition-all duration-200 ' +
    'text-ink placeholder:text-ink-mute/50 border ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-primary-500 focus:ring-primary-500/15'

/**
 * Labelled auth input with a leading icon and optional password toggle.
 * Pass the react-hook-form `register(...)` spread as `...field`.
 */
const AuthField = forwardRef(function AuthField(
    { id, label, labelAside, icon: Icon, error, type = 'text', className, ...field },
    ref
) {
    const [reveal, setReveal] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (reveal ? 'text' : 'password') : type

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="block text-sm font-medium text-ink-secondary">
                    {label}
                </label>
                {labelAside}
            </div>
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-ink-mute group-focus-within:text-primary-500 transition-colors" />
                    </div>
                )}
                <input
                    id={id}
                    ref={ref}
                    type={inputType}
                    className={cn(
                        baseInput,
                        Icon ? 'pl-11' : 'pl-4',
                        isPassword ? 'pr-12' : 'pr-4',
                        error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15' : 'border-[#a8c3de]',
                        className
                    )}
                    aria-invalid={error ? 'true' : undefined}
                    {...field}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setReveal((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-mute hover:text-ink-secondary transition-colors"
                        aria-label={reveal ? 'Hide password' : 'Show password'}
                    >
                        {reveal ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <span aria-hidden="true">•</span> {error}
                </p>
            )}
        </div>
    )
})

export default AuthField
