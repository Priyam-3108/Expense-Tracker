// client/src/components/form/SectionLabel.jsx

export default function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400 mb-2 ${className}`}>
      {children}
    </p>
  )
}
