import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { cn } from '../utils/cn'

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const themes = [
        { name: 'light', icon: Sun, label: 'Light' },
        { name: 'dark', icon: Moon, label: 'Dark' },
        { name: 'system', icon: Monitor, label: 'System' },
    ]

    const CurrentIcon = themes.find((t) => t.name === theme)?.icon || Sun

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
            >
                <CurrentIcon size={20} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 glass-dropdown z-50">
                    <div className="p-1.5">
                        {themes.map((t) => {
                            const Icon = t.icon
                            return (
                                <button
                                    key={t.name}
                                    onClick={() => {
                                        setTheme(t.name)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "flex w-full items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200 min-h-[44px]",
                                        theme === t.name
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                                            : "text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    <Icon className={cn(
                                        "mr-3 h-4 w-4",
                                        theme === t.name && "drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]"
                                    )} />
                                    <span>{t.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ThemeToggle
