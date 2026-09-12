import { Smartphone, Banknote, CreditCard, Landmark, Wallet, MoreHorizontal } from 'lucide-react'

export const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI', Icon: Smartphone },
  { value: 'cash', label: 'Cash', Icon: Banknote },
  { value: 'card', label: 'Card', Icon: CreditCard },
  { value: 'netbanking', label: 'Net Banking', Icon: Landmark },
  { value: 'wallet', label: 'Wallet', Icon: Wallet },
  { value: 'other', label: 'Other', Icon: MoreHorizontal },
]

export const PAYMENT_MODE_MAP = PAYMENT_MODES.reduce((m, e) => {
  m[e.value] = { label: e.label, Icon: e.Icon }
  return m
}, {})

export function getPaymentMode(value) {
  return PAYMENT_MODE_MAP[value]
    ? { value, ...PAYMENT_MODE_MAP[value] }
    : { value: 'other', ...PAYMENT_MODE_MAP.other }
}
