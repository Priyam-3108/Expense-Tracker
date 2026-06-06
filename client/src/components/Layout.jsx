import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  Wallet
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../utils/cn'
import ThemeToggle from './ThemeToggle'
import BottomNav from './BottomNav'

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
    <div className="h-screen flex flex-col bg-slate-950 noise-overlay overflow-hidden relative">
      {/* Liquid Glass Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="Fluid Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950/80 to-slate-950/90"></div>
      </div>
      
      {/* Content wrapper to stay above background */}
      <div className="relative z-10 flex flex-col h-full w-full">
      {/* Mobile sidebar overlay — always rendered, toggled by opacity for smooth fade */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-all duration-300",
          sidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
        style={{
          background: 'rgba(0, 0, 0, 0.50)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* ============ SIDEBAR ============ */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        "bg-white dark:bg-transparent shadow-lg dark:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full glass-sidebar">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-glow-indigo">
                <span className="text-white font-bold text-lg">{currencySymbols[currency] || '$'}</span>
              </div>
              <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Expense Tracker
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] relative",
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Glowing active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}
                      <Icon
                        size={20}
                        className={cn(
                          "mr-3 transition-all duration-200",
                          isActive
                            ? "drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]"
                            : "group-hover:scale-110"
                        )}
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
        <nav className="sticky top-0 z-30 bg-white dark:bg-transparent shadow-sm dark:shadow-none border-b border-gray-200 dark:border-transparent">
          <div className="glass-nav">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Left side - Mobile menu button */}
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="p-2.5 rounded-xl text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200"
                >
                  <Menu size={22} />
                </button>
              </div>

              {/* Spacer for desktop - pushes content to the right */}
              <div className="flex-1 hidden lg:block"></div>

              {/* Right side - Theme, Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Theme Toggle — hidden while light mode is WIP */}
                {/* <ThemeToggle /> */}

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-200 min-h-[44px]"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 ring-2 ring-indigo-500/20 shadow-glow-indigo">
                      <span className="text-white font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-slate-200">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-gray-500 dark:text-slate-500 transition-transform duration-200",
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
                        <p className="text-xs text-gray-500 dark:text-slate-500 truncate">{user?.email}</p>
                      </div>

                      {/* Sign out */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-rose-500/10 hover:text-red-600 dark:hover:text-rose-400 transition-all duration-200 min-h-[44px]"
                      >
                        <LogOut size={18} className="mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content with animated liquid glass background */}
        <main className="relative flex-1 overflow-y-auto overflow-x-clip p-4 sm:p-6 lg:p-8 xl:p-10 pb-20 lg:pb-8 xl:pb-10">
          {/* ========== LIQUID GLASS ORBS ========== */}
          <div className="hidden dark:block">
            {/* Indigo Primary — top right, drifts diagonally */}
            <div
              className="liquid-orb liquid-orb-indigo"
              style={{ top: '-100px', right: '-150px' }}
            />
            {/* Emerald Accent — center left, gentle sway */}
            <div
              className="liquid-orb liquid-orb-emerald"
              style={{ top: '40%', left: '-100px' }}
            />
            {/* Violet Ambient — bottom right, circular drift */}
            <div
              className="liquid-orb liquid-orb-violet"
              style={{ top: '70%', right: '5%' }}
            />
            {/* Rose Whisper — top left, scale pulse */}
            <div
              className="liquid-orb liquid-orb-rose"
              style={{ top: '20%', left: '30%' }}
            />
          </div>

          {/* Content container — sits above orbs */}
          <div className="relative z-10 w-full max-w-none">
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
