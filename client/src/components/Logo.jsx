import { Link } from 'react-router-dom'

const Logo = ({ className = "", size = "default" }) => {
    const sizes = {
        small: { box: 24, glyph: 14, text: "text-base" },
        default: { box: 28, glyph: 16, text: "text-base" },
        large: { box: 32, glyph: 18, text: "text-lg" }
    }

    const currentSize = sizes[size] || sizes.default

    return (
        <Link to="/" className={`flex items-center gap-2 ${className}`}>
            <span
                className="shrink-0 rounded-lg bg-[#533afd] flex items-center justify-center"
                style={{ width: currentSize.box, height: currentSize.box }}
            >
                <svg width={currentSize.glyph} height={currentSize.glyph} viewBox="0 0 16 16" fill="none">
                    <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
            </span>
            <span className={`font-medium text-gray-900 dark:text-[#ededed] ${currentSize.text}`}>
                Spendly
            </span>
        </Link>
    )
}

export default Logo
