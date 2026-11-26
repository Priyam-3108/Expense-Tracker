// Left panel shared by the sign-in and password pages (desktop only)
const statement = [
  ['Nov 1', 'Salary', '+₹48,500', true],
  ['Nov 1', 'Rent', '−₹18,000'],
  ['Nov 18', 'Groceries', '−₹2,340'],
  ['Nov 20', 'Metro card', '−₹500'],
  ['Nov 23', 'Electricity', '−₹1,290'],
]

export default function AuthAside({ title, text }) {
  return (
    <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 bg-[#141415] text-[#ededed]">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#533afd] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-base font-medium">Spendly</span>
      </div>

      <div className="max-w-md">
        <h2 className="text-[40px] leading-[1.1] font-medium tracking-[-0.02em]" style={{ textWrap: 'balance' }}>{title}</h2>
        <p className="mt-4 text-base leading-7 text-[#a1a1a6]">{text}</p>

        <div className="mt-10 rounded-xl border border-white/[0.08] bg-[#19191b] p-5">
          <div className="flex items-center justify-between text-xs text-[#85858b]">
            <span>Statement</span>
            <span className="font-mono">November 2026</span>
          </div>
          <div className="mt-3 border-t border-white/[0.06]">
            {statement.map(([date, label, amount, positive]) => (
              <div key={label} className="h-9 flex items-center gap-4 text-sm border-b border-white/[0.04]">
                <span className="w-14 font-mono text-xs text-[#85858b]">{date}</span>
                <span className="flex-1 text-[#a1a1a6]">{label}</span>
                <span className={`font-mono tabular-nums ${positive ? 'text-[#4cc38a]' : 'text-[#ededed]'}`}>{amount}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 flex items-center justify-between text-sm">
            <span className="text-[#a1a1a6]">Net</span>
            <span className="font-mono tabular-nums text-[#ededed]">+₹26,370</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#85858b]">© {new Date().getFullYear()} Spendly</p>
    </div>
  )
}
