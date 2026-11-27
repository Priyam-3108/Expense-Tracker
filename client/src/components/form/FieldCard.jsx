// client/src/components/form/FieldCard.jsx

export default function FieldCard({ children, className = '', as: As = 'div', ...rest }) {
  return (
    <As
      className={`rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] ${className}`}
      {...rest}
    >
      {children}
    </As>
  )
}
