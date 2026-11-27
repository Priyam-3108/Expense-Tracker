import { Link } from 'react-router-dom'

// A balanced ledger closes on a double rule: the mark is that rule on a brass tile
export const LogoMark = ({ size = 22, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true" className={`shrink-0 text-brass ${className}`}>
        <rect width="22" height="22" rx="6" fill="currentColor" />
        <path d="M6 9.5h10M6 13.5h10" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
)

const Logo = ({ className = '', to = '/', tone = 'auto' }) => {
    const text = tone === 'light' ? 'text-[#ededed]' : 'text-[#171717] dark:text-[#ededed]'
    return (
        <Link to={to} className={`flex items-center gap-2 rounded-md focus-ring ${className}`}>
            <LogoMark />
            <span className={`text-[17px] leading-none font-semibold ${text}`}>Spendly</span>
        </Link>
    )
}

export default Logo
