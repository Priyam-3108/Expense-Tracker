import { getPaymentMode } from '../constants/paymentModes'

export default function PaymentModeBadge({ value, hideOther = false, className = '' }) {
  const mode = getPaymentMode(value)
  if (!mode) return null
  if (hideOther && mode.value === 'other') return null
  const { label, Icon } = mode
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md
        bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-slate-300 ${className}`}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}
