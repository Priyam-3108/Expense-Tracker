// client/src/components/form/SegmentedToggle.jsx

export default function SegmentedToggle({ value, onChange, options = [] }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.04]">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors
              ${active
                ? `bg-white dark:bg-white/[0.08] shadow-sm ${opt.activeColor || 'text-gray-900 dark:text-white'}`
                : 'text-gray-500 dark:text-[#a1a1a6] hover:text-gray-700 dark:hover:text-white'
              }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
