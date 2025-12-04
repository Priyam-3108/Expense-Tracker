import { Link } from 'react-router-dom'

const Logo = ({ className = "", size = "default" }) => {
    const sizes = {
        small: { svg: 32, text: "text-lg" },
        default: { svg: 40, text: "text-xl" },
        large: { svg: 48, text: "text-2xl" }
    }

    const currentSize = sizes[size] || sizes.default

    return (
        <Link to="/" className={`flex items-center gap-3 ${className}`}>
            <svg
                width={currentSize.svg}
                height={currentSize.svg}
                viewBox="0 0 40 40"
                fill="none"
            >
                <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
                <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.9" />
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                </defs>
            </svg>
            <span className={`font-bold text-gray-900 dark:text-white ${currentSize.text}`}>
                Expense Tracker
            </span>
        </Link>
    )
}

export default Logo
