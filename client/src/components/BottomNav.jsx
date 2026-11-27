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
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
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
                    'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] pt-2 pb-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'text-gray-900 dark:text-[#ededed]'
                      : 'text-gray-500 dark:text-[#85858b] hover:text-gray-700 dark:hover:text-[#a1a1a6]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex items-center justify-center w-12 h-7 rounded-lg transition-colors',
                        isActive
                          ? 'bg-gray-100 dark:bg-[#232325] text-brass dark:text-brass'
                          : ''
                      )}
                    >
                      <Icon
                        size={20}
                        strokeWidth={1.5}
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
