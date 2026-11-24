// client/src/components/form/StickyFormFooter.jsx
import { gradientR } from './gradients'

export default function StickyFormFooter({
  variant = 'neutral',
  loading = false,
  label,
  loadingLabel,
  onCancel,
}) {
  return (
    <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#19191b]">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary btn-md flex-shrink-0"
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className={`flex-1 min-h-[48px] rounded-2xl text-white text-base font-medium flex items-center justify-center gap-2 shadow-md transition-opacity ${gradientR(variant)} ${loading ? 'opacity-70' : ''}`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {loadingLabel || 'Saving…'}
          </>
        ) : (
          label
        )}
      </button>
    </div>
  )
}
