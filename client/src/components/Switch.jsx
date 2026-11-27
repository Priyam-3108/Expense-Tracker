// Toggle switch; `label` renders beside it and is part of the click target
export default function Switch({ checked, onChange, label, className = '', ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 text-sm text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-[#ededed] transition-colors ${className}`}
      {...rest}
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-brass-600' : 'bg-gray-300 dark:bg-white/[0.15]'}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </span>
      {label}
    </button>
  )
}
