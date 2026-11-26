import { usePrivacy } from '../context/PrivacyContext'
import { formatCurrency } from '../utils/helpers'

const MASK = '••••••'

export default function Amount({ value, currency = 'USD', sign, className = '' }) {
  const { isPrivate } = usePrivacy()

  if (isPrivate) {
    return <span className={`tracking-widest ${className}`}>{MASK}</span>
  }

  const bad = value === null || value === undefined || Number.isNaN(Number(value))
  if (bad) {
    return <span className={className}>—</span>
  }

  const text = `${sign ?? ''}${formatCurrency(Number(value), currency)}`
  return <span className={className}>{text}</span>
}
