import { Plus } from 'lucide-react'

// Mobile: primary action floats above the bottom nav
export default function AddFab({ onClick, label = 'Add expense' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="md:hidden fixed right-4 z-30 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] h-14 w-14 rounded-2xl inline-flex items-center justify-center bg-[#171717] text-white dark:bg-[#ededed] dark:text-[#171717] shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-[0.97] transition-transform focus-ring"
    >
      <Plus size={22} strokeWidth={1.75} />
    </button>
  )
}
