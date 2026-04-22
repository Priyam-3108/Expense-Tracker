import { NavLink } from 'react-router-dom'
import { Home, CreditCard, Tag, BarChart3, Wallet } from 'lucide-react'
import { cn } from '../utils/cn'

const navItems = [
  { name: 'Home',       href: '/app/dashboard',   icon: Home },
  { name: 'Expenses',   href: '/app/expenses',     icon: CreditCard },
  { name: 'Debts',      href: '/app/debts',        icon: Wallet },
  { name: 'Categories', href: '/app/categories',   icon: Tag },
  { name: 'Analytics',  href: '/app/analytics',    icon: BarChart3 },
]

/**
 * Sticky bottom navigation bar shown on mobile (lg:hidden).
 * Provides native-app-like thumb-friendly navigation.
 */
const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              aria-label={item.name}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] pt-2 pb-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex items-center justify-center w-10 h-7 rounded-full transition-all',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/40'
                        : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                    )}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
