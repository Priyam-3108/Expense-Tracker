// client/src/components/form/SectionLabel.jsx

export default function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[11px] font-medium text-gray-500 dark:text-[#a1a1a6] mb-2 ${className}`}>
      {children}
    </p>
  )
}
