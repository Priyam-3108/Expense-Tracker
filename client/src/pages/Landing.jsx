import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { LayoutGrid, Coins, LineChart, Download, SlidersHorizontal, Moon } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'

// Warm paper ramp for the public pages; the app itself stays graphite
const paper = {
    page: 'bg-[#f7f4ee]',
    card: 'bg-[#fdfbf7]',
    ink: 'text-[#1f1b16]',
    second: 'text-[#5e554a]',
    mute: 'text-[#7b7266]',
    rule: 'border-[#1f1b16]/[0.08]',
}

const features = [
    { icon: LayoutGrid, title: 'Your own categories', description: 'Create, rename and reorder categories so the ledger reads the way you think about money.' },
    { icon: Coins, title: 'Your currency', description: 'Track in USD, EUR, INR, GBP and more. Pick one when you sign up and change it later.' },
    { icon: LineChart, title: 'Charts by month and category', description: 'See where the money went across a month, a year or any date range you choose.' },
    { icon: Download, title: 'Export anytime', description: 'Download your records as CSV, Excel or PDF whenever you need them.' },
    { icon: SlidersHorizontal, title: 'Filters', description: 'Narrow the list by date range, category or amount to find one entry fast.' },
    { icon: Moon, title: 'Light and dark', description: 'Switch themes from the top bar, or follow your system setting.' },
]

const steps = [
    {
        title: 'Open an account',
        text: 'Sign up with your name, email and preferred currency. No credit card.',
        points: ['Name, email, password', 'Choose a currency', 'Free'],
    },
    {
        title: 'Write down what moves',
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
        <div className={`min-h-screen flex flex-col ${paper.page} ${paper.ink}`}>
            <PublicNavbar />

            {/* Hero */}
            <section className={`relative min-h-[100svh] flex items-center pt-24 pb-16 lg:pt-24 lg:pb-16 border-b ${paper.rule}`}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 lg:gap-16 items-center">
                    <div className="animate-slide-up">
                        <h1 className="font-serif text-[44px] md:text-[64px] leading-[1.04] font-normal tracking-[-0.02em]" style={{ textWrap: 'balance' }}>
                            A plain ledger for what you spend and earn
                        </h1>
                        <p className={`mt-6 text-lg leading-8 ${paper.second} max-w-[36rem]`}>
                            Spendly records expenses, income and debts by category, shows the pattern by month,
                            and exports everything to CSV, Excel or PDF.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link to="/register" className="btn-primary btn-lg">Open your ledger</Link>
                            <Link to="/login" className="btn-lg inline-flex items-center px-5 rounded-[10px] text-base font-medium text-[#1f1b16] hover:bg-[#1f1b16]/[0.05] transition-colors focus-ring">Sign in</Link>
                        </div>
                        <p className={`mt-4 text-sm ${paper.mute}`}>Free to use · No credit card</p>
                    </div>

                    <div className="animate-slide-up [animation-delay:60ms] [animation-fill-mode:both]">
                        <Passbook />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-16 gap-y-12">
                        <div>
                            <p className={`text-sm ${paper.mute}`}>Features</p>
                            <h2 className="mt-3 font-serif text-[36px] md:text-[44px] leading-[1.1] tracking-[-0.02em]" style={{ textWrap: 'balance' }}>
                                Everything you need to keep the books on your own money
                            </h2>
                        </div>
                        <div className={`grid sm:grid-cols-2 border-t ${paper.rule}`}>
                            {features.map(({ icon: Icon, title, description }) => (
                                <div key={title} className={`py-8 sm:pr-8 border-b ${paper.rule}`}>
                                    <Icon size={18} strokeWidth={1.5} className={paper.mute} />
                                    <h3 className="mt-4 text-base font-medium">{title}</h3>
                                    <p className={`mt-2 text-sm leading-6 ${paper.second}`}>{description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className={`py-24 md:py-32 bg-[#efe9df]/60 border-y ${paper.rule}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className={`text-sm ${paper.mute}`}>How it works</p>
                        <h2 className="mt-3 font-serif text-[36px] md:text-[44px] leading-[1.1] tracking-[-0.02em]">
                            Start keeping the books in three steps
                        </h2>
                    </div>
                    <ol className="mt-12 grid md:grid-cols-3 gap-4">
                        {steps.map((step, i) => (
                            <li key={step.title} className={`rounded-2xl border ${paper.rule} ${paper.card} p-6`}>
                                <span className={`font-mono text-sm ${paper.mute}`}>0{i + 1}</span>
                                <h3 className="mt-8 text-lg font-medium">{step.title}</h3>
                                <p className={`mt-2 text-sm leading-6 ${paper.second}`}>{step.text}</p>
                                <ul className={`mt-6 pt-4 border-t ${paper.rule} space-y-2`}>
                                    {step.points.map((point) => (
                                        <li key={point} className={`flex items-center gap-2 text-sm ${paper.second}`}>
                                            <span className="w-1 h-1 rounded-full bg-[#7b7266]" />
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
            <section id="cta" className="py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl bg-[#1c1a18] px-6 py-12 sm:px-12 sm:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                        <div className="max-w-xl">
                            <h2 className="font-serif text-[36px] md:text-[44px] leading-[1.1] tracking-[-0.02em] text-[#efe9de]">
                                Close this month <span className="double-rule [text-underline-offset:10px]">balanced</span>
                            </h2>
                            <p className="mt-4 text-base text-[#aaa398]">
                                Free to use, no credit card required
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[10px] bg-[#efe9de] text-[#1f1b16] text-base font-medium hover:bg-white transition-colors focus-ring"
                            >
                                Open your ledger
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[10px] text-[#efe9de] text-base font-medium hover:bg-white/[0.06] transition-colors focus-ring"
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

// Product preview drawn in code: one month of the ledger, set like a passbook page.
const entries = [
    ['Nov 01', 'Salary', 'Income', 48500],
    ['Nov 01', 'Rent', 'Housing', -18000],
    ['Nov 04', 'Electricity', 'Utilities', -1290],
    ['Nov 09', 'Lent to Riya', 'Debts', -3000],
    ['Nov 18', 'Big Basket', 'Groceries', -2340],
    ['Nov 20', 'Metro card', 'Transport', -500],
    ['Nov 23', 'Riya paid back', 'Debts', 1500],
]
const monthly = [24.1, 27.8, 22.6, 30.4, 26.2, 33.5, 28.9, 25.7, 31.2, 29.4, 26.0]
const inr = (n) => n.toLocaleString('en-IN')

const Passbook = () => {
    let balance = 0
    const rows = entries.map((e) => {
        balance += e[3]
        return [...e, balance]
    })
    const w = 280, h = 56, max = 36
    const path = monthly.map((v, i) => `${i ? 'L' : 'M'}${(i / (monthly.length - 1)) * w},${h - (v / max) * h}`).join(' ')

    return (
        <figure className="relative" aria-label="Spendly ledger preview for November 2026">
            <div className="rounded-2xl border border-[#1f1b16]/[0.1] bg-[#fdfbf7] shadow-[0_1px_2px_rgba(31,27,22,0.06),0_24px_64px_rgba(31,27,22,0.10)] overflow-hidden">
                <div className="flex items-end justify-between gap-6 px-6 pt-6 pb-5 border-b border-[#1f1b16]/[0.08]">
                    <div>
                        <p className="text-xs text-[#7b7266]">Statement</p>
                        <p className="mt-1 font-serif text-2xl leading-none">November 2026</p>
                    </div>
                    <div className="hidden sm:block text-right">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-40 h-10" preserveAspectRatio="none" aria-hidden="true">
                            <path d={path} fill="none" stroke="#a8611c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <p className="mt-1 font-mono text-[11px] text-[#7b7266]">Spending, Jan to Nov</p>
                    </div>
                </div>

                {/* Ruled ledger: faint lines like a passbook page, a brass margin rule */}
                <div className="relative px-6">
                    <span className="absolute left-[5.25rem] top-0 bottom-0 w-px bg-[#a8611c]/25 hidden sm:block" aria-hidden="true" />
                    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:grid-cols-[3.5rem_minmax(0,1fr)_6rem_6.5rem_6.5rem] items-center h-9 text-[11px] text-[#7b7266] border-b border-[#1f1b16]/[0.08] gap-x-4 sm:pl-0">
                        <span className="font-mono">Date</span>
                        <span className="sm:pl-2">Entry</span>
                        <span className="hidden sm:block">Category</span>
                        <span className="text-right">Amount</span>
                        <span className="hidden sm:block text-right">Balance</span>
                    </div>
                    {rows.map(([date, name, cat, amt, bal]) => (
                        <div key={date + name} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:grid-cols-[3.5rem_minmax(0,1fr)_6rem_6.5rem_6.5rem] items-center h-10 text-sm border-b border-[#1f1b16]/[0.06] gap-x-4">
                            <span className="font-mono text-xs text-[#7b7266]">{date}</span>
                            <span className="sm:pl-2 truncate">{name}</span>
                            <span className="hidden sm:block text-xs text-[#5e554a] truncate">{cat}</span>
                            <span className={`text-right tabular-nums ${amt > 0 ? 'text-[#2f7a4f]' : ''}`}>{amt > 0 ? '+' : '−'}₹{inr(Math.abs(amt))}</span>
                            <span className="hidden sm:block text-right tabular-nums text-[#5e554a]">₹{inr(bal)}</span>
                        </div>
                    ))}
                </div>
                <div className="px-6">
                    <div className="flex items-baseline justify-between h-16 pt-2">
                        <span className="text-sm text-[#5e554a]">Closing balance</span>
                        <span className="text-2xl font-medium tabular-nums double-rule">₹{inr(balance)}</span>
                    </div>
                </div>
            </div>
        </figure>
    )
}

export default Landing
