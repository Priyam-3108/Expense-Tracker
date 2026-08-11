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
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden shadow-[0_-4px_20px_rgba(0,55,112,0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="glass-bottom-nav">
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
                    'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] pt-2 pb-1 text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-500/15 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                          : ''
                      )}
                    >
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        className={cn(
                          isActive && 'drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]'
                        )}
                      />
                    </span>
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default BottomNav
