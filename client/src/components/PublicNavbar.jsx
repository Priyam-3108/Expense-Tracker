import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { Menu, X, ArrowRight } from 'lucide-react'

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
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-[0_1px_3px_rgba(0,55,112,0.08)] bg-white/90 backdrop-blur-xl border-b border-[#e3e8ee]' : 'bg-white/70 backdrop-blur-md'}`}>
            <div className="landing-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="nav-content flex items-center justify-between h-20">
                    <Logo />

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {isLanding ? (
                            <>
                                <a href="#features" className="text-sm font-medium text-[#273951] hover:text-[#0d253d] transition-colors">Features</a>
                                <a href="#how-it-works" className="text-sm font-medium text-[#273951] hover:text-[#0d253d] transition-colors">How It Works</a>
                            </>
                        ) : (
                            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-[#0d253d] font-semibold' : 'text-[#273951] hover:text-[#0d253d]'}`}>Home</Link>
                        )}
                        <Link to="/faq" className={`text-sm font-medium transition-colors ${location.pathname === '/faq' ? 'text-[#0d253d] font-semibold' : 'text-[#273951] hover:text-[#0d253d]'}`}>FAQ</Link>
                        <Link to="/support" className={`text-sm font-medium transition-colors ${location.pathname === '/support' ? 'text-[#0d253d] font-semibold' : 'text-[#273951] hover:text-[#0d253d]'}`}>Support</Link>
                        <Link to="/docs" className={`text-sm font-medium transition-colors ${location.pathname === '/docs' ? 'text-[#0d253d] font-semibold' : 'text-[#273951] hover:text-[#0d253d]'}`}>Docs</Link>
                    </div>

                    {/* Action Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <Link to="/app/dashboard" className="btn-primary btn-sm flex items-center gap-2">
                                Go to App
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn-secondary btn-sm">Sign In</Link>
                                <Link to="/register" className="btn-primary btn-sm flex items-center gap-2">
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl bg-[#0d253d]/[0.04] border border-[#e3e8ee] text-[#273951] hover:text-[#0d253d] focus:outline-none"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden mx-4 mb-4 p-6 rounded-2xl bg-white border border-[#e3e8ee] shadow-[0_8px_24px_rgba(0,55,112,0.08)] animate-in fade-in slide-in-from-top-4">
                    <div className="flex flex-col space-y-4">
                        {isLanding ? (
                            <>
                                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">Features</a>
                                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">How It Works</a>
                            </>
                        ) : (
                            <Link to="/" className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">Home</Link>
                        )}
                        <Link to="/faq" className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">FAQ</Link>
                        <Link to="/support" className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">Support</Link>
                        <Link to="/docs" className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">Documentation</Link>
                        <Link to="/terms" className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">Terms of Service</Link>
                        <Link to="/privacy" className="text-base font-medium text-[#273951] hover:text-[#0d253d] py-2">Privacy Policy</Link>

                        <div className="pt-4 border-t border-[#e3e8ee] flex flex-col space-y-3">
                            {user ? (
                                <Link to="/app/dashboard" className="btn-primary btn-md justify-center flex items-center gap-2">
                                    Go to App
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-secondary btn-md justify-center">Sign In</Link>
                                    <Link to="/register" className="btn-primary btn-md justify-center flex items-center gap-2">
                                        Get Started Free
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
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
