import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { LayoutGrid, Coins, LineChart, Download, SlidersHorizontal, Moon } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'

const features = [
    { icon: LayoutGrid, title: 'Custom categories', description: 'Create, edit and reorder categories so your ledger reads the way you think about money.' },
    { icon: Coins, title: 'Your currency', description: 'Track in USD, EUR, INR, GBP and more. Pick one when you sign up and change it later.' },
    { icon: LineChart, title: 'Charts by month and category', description: 'See where the money went across a month, a year or any date range you choose.' },
    { icon: Download, title: 'Export anytime', description: 'Download your records as CSV, Excel or PDF whenever you need them.' },
    { icon: SlidersHorizontal, title: 'Filters', description: 'Narrow the list by date range, category or amount to find one entry fast.' },
    { icon: Moon, title: 'Light and dark', description: 'Switch themes from the top bar, or follow your system setting.' },
]

const steps = [
    {
        title: 'Create your account',
        text: 'Sign up with your name, email and preferred currency. No credit card.',
        points: ['Name, email, password', 'Choose a currency', 'Free'],
    },
    {
        title: 'Record what you spend and earn',
        text: 'Add the amount, category, date and an optional note. Income goes in the same ledger.',
        points: ['One short form', 'Your own categories', 'Notes and dates'],
    },
    {
        title: 'Read the pattern',
        text: 'Charts show where the money goes by month and category. Filter, then export what you need.',
        points: ['Monthly and category charts', 'Date and amount filters', 'CSV, Excel and PDF'],
    },
]

const Landing = () => {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="min-h-screen flex flex-col bg-white text-[#171717]">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-28 pb-20 md:pt-36 md:pb-28 bg-[#fafafa] border-b border-[#e5e5e5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 lg:gap-16 items-center">
                    <div className="animate-slide-up">
                        <h1 className="text-[40px] md:text-[56px] leading-[1.05] font-medium tracking-[-0.03em]">
                            A plain ledger for what you spend and earn
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-[#525252] max-w-xl">
                            Spendly records your expenses and income by category, shows the pattern in clear charts,
                            and exports everything to CSV, Excel or PDF.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link to="/register" className="btn-primary btn-lg">Create free account</Link>
                            <Link to="/login" className="btn-secondary btn-lg">Sign in</Link>
                        </div>
                        <p className="mt-4 text-sm text-[#737373]">Free to use · No credit card</p>
                    </div>

                    <div className="animate-slide-up [animation-delay:60ms] [animation-fill-mode:both]">
                        <LedgerPreview />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-sm text-[#533afd]">Features</p>
                        <h2 className="mt-2 text-3xl md:text-4xl leading-tight font-medium tracking-[-0.02em]">
                            Everything you need to keep the books on your own money
                        </h2>
                    </div>
                    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 border-t border-[#e5e5e5]">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="py-8 pr-8 border-b border-[#e5e5e5]">
                                <Icon size={18} strokeWidth={1.5} className="text-[#737373]" />
                                <h3 className="mt-4 text-base font-medium">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-[#525252]">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-20 md:py-28 bg-[#fafafa] border-y border-[#e5e5e5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-sm text-[#533afd]">How it works</p>
                        <h2 className="mt-2 text-3xl md:text-4xl leading-tight font-medium tracking-[-0.02em]">
                            Start tracking in three steps
                        </h2>
                    </div>
                    <ol className="mt-12 grid md:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <li key={step.title} className="glass-card p-6">
                                <span className="font-mono text-sm text-[#737373]">0{i + 1}</span>
                                <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-[#525252]">{step.text}</p>
                                <ul className="mt-6 pt-4 border-t border-[#f0f0f0] space-y-2">
                                    {step.points.map((point) => (
                                        <li key={point} className="flex items-center gap-2 text-sm text-[#525252]">
                                            <span className="w-1 h-1 rounded-full bg-[#a3a3a3]" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Call to action */}
            <section id="cta" className="py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl bg-[#171717] px-6 py-12 sm:px-12 sm:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-4xl leading-tight font-medium tracking-[-0.02em] text-[#ededed]">
                                Open your ledger
                            </h2>
                            <p className="mt-3 text-base text-[#a1a1a6]">
                                Free to use, no credit card required.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-lg bg-[#ededed] text-[#171717] text-base font-medium hover:bg-white transition-colors"
                            >
                                Create free account
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-lg border border-white/[0.12] text-[#ededed] text-base font-medium hover:bg-white/[0.06] transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    )
}

// Product preview drawn in code: one month of the ledger, as the app shows it.
const monthly = [24.1, 27.8, 22.6, 30.4, 26.2, 33.5, 28.9, 25.7, 31.2, 29.4, 31.2]
const income = [42, 42, 46.5, 42, 42, 49, 42, 42, 42, 51, 48.5]

const toPath = (values, max, w, h) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ')

const LedgerPreview = () => {
    const w = 520, h = 140, max = 56
    const expensePath = toPath(monthly, max, w, h)
    const rows = [
        ['Rent', 'Housing', '#2563eb', 'Nov 1', '−₹18,000'],
        ['Salary', 'Income', '#16a34a', 'Nov 1', '+₹48,500'],
        ['Big Basket', 'Groceries', '#d97706', 'Nov 18', '−₹2,340'],
        ['Metro card recharge', 'Transport', '#0891b2', 'Nov 20', '−₹500'],
    ]

    return (
        <div className="rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.08)] overflow-hidden" aria-label="Spendly dashboard preview">
            <div className="flex items-center gap-2 px-4 h-10 border-b border-[#f0f0f0]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />
                <span className="ml-auto text-xs text-[#a3a3a3]">Overview · November 2026</span>
            </div>

            <div className="p-5 sm:p-6">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        ['Expenses', '₹31,200', 'text-[#171717]'],
                        ['Income', '₹48,500', 'text-[#171717]'],
                        ['Net', '+₹17,300', 'text-green-600'],
                    ].map(([label, value, tone]) => (
                        <div key={label} className="rounded-lg border border-[#f0f0f0] p-3">
                            <p className="text-xs text-[#737373]">{label}</p>
                            <p className={`mt-1 font-mono tabular-nums text-sm sm:text-lg font-medium ${tone}`}>{value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-[#737373]">
                        <span>Income and expenses, 2026</span>
                        <span className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#533afd]" />Expenses</span>
                            <span className="hidden sm:flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#a3a3a3]" />Income</span>
                        </span>
                    </div>
                    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-28 sm:h-36" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#533afd" stopOpacity="0.14" />
                                <stop offset="100%" stopColor="#533afd" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[0.25, 0.5, 0.75].map((f) => (
                            <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="rgba(23,23,23,0.06)" />
                        ))}
                        <path d={toPath(income, max, w, h)} fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                        <path d={`${expensePath} L${w},${h} L0,${h} Z`} fill="url(#preview-fill)" />
                        <path d={expensePath} fill="none" stroke="#533afd" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <div className="mt-2 flex justify-between font-mono text-[11px] text-[#a3a3a3]">
                        {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m) => <span key={m}>{m}</span>)}
                    </div>
                </div>

                <div className="mt-5 border-t border-[#f0f0f0] pt-2 hidden sm:block">
                    {rows.map(([name, category, color, date, amount]) => (
                        <div key={name} className="h-11 flex items-center gap-3 text-sm">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="flex-1 min-w-0 truncate">{name}</span>
                            <span className="hidden md:block w-24 text-xs text-[#737373]">{category}</span>
                            <span className="w-14 text-xs text-[#a3a3a3]">{date}</span>
                            <span className={`w-24 text-right font-mono tabular-nums ${amount.startsWith('+') ? 'text-green-600' : ''}`}>{amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Landing
