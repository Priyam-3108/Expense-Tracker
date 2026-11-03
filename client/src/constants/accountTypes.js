// client/src/constants/accountTypes.js
import { Banknote, Landmark, CreditCard, PiggyBank, Wallet } from 'lucide-react'

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', Icon: Banknote },
  { value: 'bank', label: 'Bank', Icon: Landmark },
  { value: 'card', label: 'Card', Icon: CreditCard },
  { value: 'savings', label: 'Savings', Icon: PiggyBank },
  { value: 'other', label: 'Other', Icon: Wallet },
]

export function getAccountType(value) {
  return ACCOUNT_TYPES.find((t) => t.value === value) || ACCOUNT_TYPES.find((t) => t.value === 'other')
}
