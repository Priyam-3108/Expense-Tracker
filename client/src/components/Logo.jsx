import { Link } from 'react-router-dom'

const sizes = {
    small: { svg: 32, text: 'text-lg' },
    default: { svg: 40, text: 'text-xl' },
    large: { svg: 48, text: 'text-2xl' },
}

// Icon-only mark — used inside the auth panel and footer where the
// wordmark colour needs to sit on a dark ground.
export const LogoMark = ({ size = 28, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
        <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.92" />
        <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#665efd" />
                <stop offset="100%" stopColor="#533afd" />
            </linearGradient>
        </defs>
    </svg>
)

const Logo = ({ className = '', size = 'default', to = '/', tone = 'ink' }) => {
    const s = sizes[size] || sizes.default
    const textTone = tone === 'light' ? 'text-white' : 'text-ink dark:text-white'

    return (
        <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
            <LogoMark size={s.svg} />
            <span className={`font-bold tracking-tight ${s.text} ${textTone}`}>Spendly</span>
        </Link>
    )
}

export default Logo
