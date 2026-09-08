// client/src/components/form/gradients.js
// Single source of truth for form gradient classes.
// Keys map form "variant" -> Tailwind gradient utility classes.

export const GRADIENTS = {
  expense:  'bg-gradient-to-br from-[#c71852] to-[#ea2261]',
  borrowed: 'bg-gradient-to-br from-[#c71852] to-[#ea2261]',
  income:   'bg-gradient-to-br from-[#059669] to-[#10b981]',
  lent:     'bg-gradient-to-br from-[#059669] to-[#10b981]',
  neutral:  'bg-gradient-to-br from-[#4434d4] to-[#6366f1]',
}

// Left-to-right variant, used for the submit bar button.
export const GRADIENTS_R = {
  expense:  'bg-gradient-to-r from-[#c71852] to-[#ea2261]',
  borrowed: 'bg-gradient-to-r from-[#c71852] to-[#ea2261]',
  income:   'bg-gradient-to-r from-[#059669] to-[#10b981]',
  lent:     'bg-gradient-to-r from-[#059669] to-[#10b981]',
  neutral:  'bg-gradient-to-r from-[#4434d4] to-[#6366f1]',
}

export const gradientBr = (variant) => GRADIENTS[variant] || GRADIENTS.neutral
export const gradientR  = (variant) => GRADIENTS_R[variant] || GRADIENTS_R.neutral
