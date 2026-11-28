/**
 * Tactile brushed-metal card graphic rendered purely in CSS/SVG,
 * anchoring the primary ledger stat card without external images.
 */
const LedgerCardGraphic = ({ currency = 'USD' }) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none relative w-[156px] h-[98px] shrink-0 hidden sm:block"
    >
      {/* Back secondary card */}
      <div
        className="absolute right-0 top-0 w-[132px] h-[82px] rounded-xl border border-black/10 dark:border-white/[0.08] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-[#26262a] dark:to-[#151518] shadow-md"
        style={{ transform: 'rotate(6deg) translate(4px, -6px)' }}
      />

      {/* Front primary metallic card */}
      <div
        className="absolute right-2 bottom-0 w-[138px] h-[86px] rounded-xl border border-black/15 dark:border-white/[0.14] bg-gradient-to-br from-[#2d2d32] via-[#1c1c20] to-[#111113] shadow-[0_12px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] p-3 flex flex-col justify-between overflow-hidden"
        style={{ transform: 'rotate(-7deg)' }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: 'linear-gradient(125deg, transparent 25%, rgba(255,255,255,0.16) 45%, transparent 65%)',
          }}
        />

        <div className="relative flex items-center justify-between">
          <div className="w-6 h-4 rounded-[3px] bg-gradient-to-br from-[#d8c49a] via-[#b59c6c] to-[#87714a] border border-white/20 grid grid-cols-3 gap-px p-[1.5px] opacity-90">
            <div className="border-r border-b border-black/25 rounded-tl-[1px]" />
            <div className="border-r border-b border-black/25" />
            <div className="border-b border-black/25 rounded-tr-[1px]" />
            <div className="border-r border-black/25 rounded-bl-[1px]" />
            <div className="border-r border-black/25" />
            <div className="rounded-br-[1px]" />
          </div>

          <div className="flex items-center -space-x-1 opacity-80">
            <span className="w-2.5 h-2.5 rounded-full bg-white/85" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>
        </div>

        <div className="relative flex items-end justify-between text-[9px] font-mono tracking-wider text-white/65">
          <span>•••• •••• 4821</span>
          <span className="text-[8px] text-white/45">{currency}</span>
        </div>
      </div>
    </div>
  )
}

export default LedgerCardGraphic
