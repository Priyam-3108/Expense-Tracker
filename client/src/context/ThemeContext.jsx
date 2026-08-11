import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const ThemeContext = createContext()

// Marketing/auth pages are always light, regardless of the saved app theme —
// they don't participate in the light/dark toggle (Stripi's marketing site has no dark mode).
const isPublicRoute = (pathname) => !pathname.startsWith('/app')

export const ThemeProvider = ({ children, defaultTheme = 'light', storageKey = 'vite-ui-theme' }) => {
    const { pathname } = useLocation()
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem(storageKey)
        return stored || defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove('light', 'dark')

        if (isPublicRoute(pathname)) {
            root.classList.add('light')
            return
        }

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme, pathname])

    const value = {
        theme,
        setTheme: (theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider')

    return context
}
