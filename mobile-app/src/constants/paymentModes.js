export const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'card', label: 'Card', icon: 'card-outline' },
  { value: 'netbanking', label: 'Net Banking', icon: 'business-outline' },
  { value: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function getPaymentMode(value) {
  return (
    PAYMENT_MODES.find((m) => m.value === value) ||
    PAYMENT_MODES.find((m) => m.value === 'other')
  );
}
