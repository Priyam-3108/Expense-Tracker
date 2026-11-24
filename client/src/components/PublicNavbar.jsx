import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { Menu, X } from 'lucide-react'

const PublicNavbar = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Close mobile menu on path change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    const isLanding = location.pathname === '/'

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors bg-white border-b ${scrolled ? 'border-[#e5e5e5]' : 'border-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="nav-content flex items-center justify-between h-16">
                    <Logo />

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {isLanding ? (
                            <>
                                <a href="#features" className="text-sm text-[#404040] hover:text-[#171717] transition-colors">Features</a>
                                <a href="#how-it-works" className="text-sm text-[#404040] hover:text-[#171717] transition-colors">How it works</a>
                            </>
                        ) : (
                            <Link to="/" className={`text-sm transition-colors ${location.pathname === '/' ? 'text-[#171717]' : 'text-[#404040] hover:text-[#171717]'}`}>Home</Link>
                        )}
                        <Link to="/faq" className={`text-sm transition-colors ${location.pathname === '/faq' ? 'text-[#171717]' : 'text-[#404040] hover:text-[#171717]'}`}>FAQ</Link>
                        <Link to="/support" className={`text-sm transition-colors ${location.pathname === '/support' ? 'text-[#171717]' : 'text-[#404040] hover:text-[#171717]'}`}>Support</Link>
                        <Link to="/docs" className={`text-sm transition-colors ${location.pathname === '/docs' ? 'text-[#171717]' : 'text-[#404040] hover:text-[#171717]'}`}>Docs</Link>
                    </div>

                    {/* Action Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <Link to="/app/dashboard" className="btn-primary btn-sm ">
                                Open app
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm text-[#404040] hover:text-[#171717] transition-colors">Sign in</Link>
                                <Link to="/register" className="btn-primary btn-sm">Create account</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-[#404040] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden mx-4 mb-4 p-4 rounded-xl bg-white border border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.06)] animate-fade-in">
                    <div className="flex flex-col space-y-1">
                        {isLanding ? (
                            <>
                                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-[#404040] hover:text-[#171717] py-2">Features</a>
                                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-[#404040] hover:text-[#171717] py-2">How it works</a>
                            </>
                        ) : (
                            <Link to="/" className="text-sm text-[#404040] hover:text-[#171717] py-2">Home</Link>
                        )}
                        <Link to="/faq" className="text-sm text-[#404040] hover:text-[#171717] py-2">FAQ</Link>
                        <Link to="/support" className="text-sm text-[#404040] hover:text-[#171717] py-2">Support</Link>
                        <Link to="/docs" className="text-sm text-[#404040] hover:text-[#171717] py-2">Documentation</Link>
                        <Link to="/terms" className="text-sm text-[#404040] hover:text-[#171717] py-2">Terms of Service</Link>
                        <Link to="/privacy" className="text-sm text-[#404040] hover:text-[#171717] py-2">Privacy Policy</Link>

                        <div className="pt-4 border-t border-[#e5e5e5] flex flex-col space-y-3">
                            {user ? (
                                <Link to="/app/dashboard" className="btn-primary btn-md justify-center ">
                                    Open app
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-secondary btn-md justify-center">Sign in</Link>
                                    <Link to="/register" className="btn-primary btn-md justify-center">Create account</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default PublicNavbar
