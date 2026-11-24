import { PAYMENT_MODES } from '../../constants/paymentModes'

export default function PaymentModeChips({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PAYMENT_MODES.map(({ value: mode, label, Icon }) => {
        const selected = mode === value
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] whitespace-nowrap text-sm font-medium min-h-[40px] transition-colors
              ${selected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400'
                : 'border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-[#a1a1a6]'
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
