import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePrivacy } from '../context/PrivacyContext'
import {
  Home,
  CreditCard,
  Tag,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wallet,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../utils/cn'
import ThemeToggle from './ThemeToggle'
import BottomNav from './BottomNav'
import Logo from './Logo'

const currencySymbols = {
  USD: '$',
  EUR: '€',
  INR: '₹',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$'
}

const Layout = () => {
  const { user, logout, currency } = useAuth()
  const { isPrivate, toggle: togglePrivacy } = usePrivacy()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Expenses', href: '/app/expenses', icon: CreditCard },
    { name: 'Debts', href: '/app/debts', icon: Wallet },
    { name: 'Categories', href: '/app/categories', icon: Tag },
    { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/app/profile', icon: User },
  ]

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [sidebarOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full w-full">
      {/* Mobile sidebar overlay — always rendered, toggled by opacity for smooth fade */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity bg-[#0a0a0a]/50",
          sidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ============ SIDEBAR ============ */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full glass-sidebar">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200 dark:border-white/[0.08]">
              <Logo to="/app/dashboard" />
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-2 rounded-lg text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-3 text-sm rounded-lg transition-colors min-h-[44px] lg:min-h-0 lg:h-9",
                      isActive
                        ? "bg-gray-100 dark:bg-[#232325] text-gray-900 dark:text-[#ededed] font-medium dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-[#ededed]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        strokeWidth={1.5}
                        className={cn("shrink-0", isActive ? "text-brass dark:text-brass" : "text-gray-400 dark:text-[#85858b]")}
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-0">
        {/* Top Navbar */}
        <nav className="sticky top-0 z-30">
          <div className="glass-nav">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Left side - Mobile menu button */}
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="p-2.5 rounded-lg text-gray-500 dark:text-[#a1a1a6] hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Menu size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Spacer for desktop - pushes content to the right */}
              <div className="flex-1 hidden lg:block"></div>

              {/* Right side - Theme, Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={togglePrivacy}
                  aria-label={isPrivate ? 'Show amounts' : 'Hide amounts'}
                  title={isPrivate ? 'Show amounts' : 'Hide amounts'}
                  className="p-2 rounded-lg text-gray-500 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {isPrivate ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
                <ThemeToggle />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors min-h-[44px]"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#232325] border border-gray-200 dark:border-white/[0.08]">
                      <span className="text-gray-700 dark:text-[#ededed] font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-[#ededed]">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-gray-500 dark:text-[#85858b] transition-transform duration-200",
                        profileDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 glass-dropdown py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/[0.08] min-h-[44px] flex flex-col justify-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-[#85858b] truncate">{user?.email}</p>
                      </div>

                      {/* Sign out */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-[#a1a1a6] hover:bg-red-50 dark:hover:bg-rose-500/10 hover:text-red-600 dark:hover:text-rose-400 transition-colors min-h-[44px]"
                      >
                        <LogOut size={16} strokeWidth={1.5} className="mr-2.5" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto overflow-x-clip p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="relative z-10 w-full max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sticky bottom navigation — mobile only */}
      <BottomNav />
      </div>
    </div>
  )
}

export default Layout
