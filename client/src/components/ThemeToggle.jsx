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
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
            >
                <CurrentIcon size={20} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-36 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950 z-50">
                    <div className="p-1">
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
                                        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                        theme === t.name
                                            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
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
