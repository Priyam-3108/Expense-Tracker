// client/src/components/form/AmountHero.jsx
import { gradientBr } from './gradients'

export default function AmountHero({
  value,
  onChange,
  variant = 'neutral',
  currencySymbol = '$',
  label,
  error,
  disabled = false,
  children,
}) {
  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9.]/g, '')
    // collapse multiple dots
    const parts = cleaned.split('.')
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
    onChange(normalized)
  }

  return (
    <div className={`rounded-3xl overflow-hidden shadow-lg ${gradientBr(variant)}`}>
      <div className="px-6 py-8 flex flex-col items-center">
        {label && (
          <span className="text-sm font-light text-white/70 mb-1">{label}</span>
        )}
        <div className="flex items-center justify-center gap-1 text-white">
          <span className="text-3xl font-extralight text-white/60">{currencySymbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            readOnly={disabled}
            placeholder="0"
            className={`bg-transparent border-0 outline-none text-center text-5xl font-extralight tracking-tight text-white placeholder-white/30 w-[8ch] tabular-nums ${disabled ? 'opacity-60' : ''}`}
          />
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-white bg-black/20 rounded-lg px-3 py-1">
            {error}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}
