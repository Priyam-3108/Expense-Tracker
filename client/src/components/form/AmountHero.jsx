// client/src/components/form/AmountHero.jsx
// The sign colour is the only tint: it says which way the money moves
const TONE = {
  expense: 'text-red-600 dark:text-[#e5484d]',
  borrowed: 'text-red-600 dark:text-[#e5484d]',
  income: 'text-green-600 dark:text-[#4cc38a]',
  lent: 'text-green-600 dark:text-[#4cc38a]',
}

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
    onChange(normalized === '.' ? '' : normalized)
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#232325]">
      <div className="px-6 py-8 flex flex-col items-center">
        {label && (
          <span className="text-sm text-gray-500 dark:text-[#a1a1a6] mb-2">{label}</span>
        )}
        <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-[#ededed]">
          <span className={`text-3xl ${TONE[variant] || 'text-gray-400 dark:text-[#85858b]'}`}>{currencySymbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            readOnly={disabled}
            placeholder="0"
            className={`bg-transparent border-0 outline-none text-center text-5xl font-normal tracking-[-0.02em] text-gray-900 dark:text-[#ededed] placeholder-gray-300 dark:placeholder-white/20 w-[8ch] tabular-nums ${disabled ? 'opacity-60' : ''}`}
          />
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-[#e5484d]">
            {error}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}
