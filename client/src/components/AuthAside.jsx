import Logo from './Logo'

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
    <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 bg-[#161513] text-[#efe9de]">
      <Logo tone="light" />

      <div className="max-w-md">
        <h2 className="font-serif text-[44px] leading-[1.08] font-normal tracking-[-0.02em]" style={{ textWrap: 'balance' }}>{title}</h2>
        <p className="mt-4 text-base leading-7 text-[#aaa398]">{text}</p>

        <div className="mt-10 rounded-xl border border-white/[0.08] bg-[#1c1a18] p-5">
          <div className="flex items-center justify-between text-xs text-[#8a847a]">
            <span>Statement</span>
            <span className="font-mono">November 2026</span>
          </div>
          <div className="mt-3 border-t border-white/[0.06]">
            {statement.map(([date, label, amount, positive]) => (
              <div key={label} className="h-9 flex items-center gap-4 text-sm border-b border-white/[0.04]">
                <span className="w-14 font-mono text-xs text-[#8a847a]">{date}</span>
                <span className="flex-1 text-[#aaa398]">{label}</span>
                <span className={`tabular-nums ${positive ? 'text-[#6cc493]' : 'text-[#efe9de]'}`}>{amount}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 pb-1 flex items-baseline justify-between text-sm">
            <span className="text-[#aaa398]">Net</span>
            <span className="text-lg font-medium tabular-nums text-[#efe9de] double-rule">+₹26,370</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#8a847a]">© {new Date().getFullYear()} Spendly</p>
    </div>
  )
}
