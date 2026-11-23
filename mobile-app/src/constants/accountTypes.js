// mobile-app/src/constants/accountTypes.js
export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'bank', label: 'Bank', icon: 'business-outline' },
  { value: 'card', label: 'Card', icon: 'card-outline' },
  { value: 'savings', label: 'Savings', icon: 'wallet-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function getAccountType(value) {
  return ACCOUNT_TYPES.find((t) => t.value === value) || ACCOUNT_TYPES.find((t) => t.value === 'other');
}
