import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { User, FileText } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
import '../styles/LandingPage.css'

const Landing = () => {
    useEffect(() => {
        // Ensure page starts at top on refresh
        window.scrollTo(0, 0)

        // Enhanced intersection observer with stagger effect
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add stagger delay based on index
                    setTimeout(() => {
                        entry.target.classList.add('animate-in')
                    }, index * 100)
                }
            })
        }, observerOptions)

        // Observe all animatable elements
        document.querySelectorAll('.feature-card, .benefit-item, .section-header').forEach((el) => {
            observer.observe(el)
        })

        return () => {
            observer.disconnect()
        }
    }, [])

    return (
        <div className="landing-page min-h-screen flex flex-col bg-white">
            {/* Gradient Mesh Backdrop — Stripi signature hero band */}
            <div className="gradient-mesh-hero" aria-hidden="true" />

            {/* Navigation Header */}
            <PublicNavbar />

            {/* Hero Section */}
            <section className="relative z-10 pt-36 pb-24 overflow-hidden">
                <div className="landing-container">
                    <div className="hero-content-wrapper">
                        <div className="hero-content">
                            <div className="pill-tag-soft fade-in-up inline-flex" style={{ animationDelay: '0.1s' }}>
                                <span className="w-2 h-2 bg-[#533afd] rounded-full animate-pulse mr-2"></span>
                                <span>Free to use • No credit card required</span>
                            </div>
                            <h1 className="hero-title fade-in-up text-[#0d253d]" style={{ animationDelay: '0.2s' }}>
                                Track Every Expense,
                                <span className="gradient-text">Master Your Money</span>
                            </h1>
                            <p className="hero-subtitle fade-in-up text-[#64748d]" style={{ animationDelay: '0.3s' }}>
                                A simple, powerful expense tracker that helps you understand where your money goes.
                                Organize expenses by categories, visualize spending patterns, and export your data anytime.
                            </p>
                            <div className="hero-cta fade-in-up" style={{ animationDelay: '0.4s' }}>
                                <Link to="/register" className="btn-primary btn-lg">
                                    Start Tracking Free
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                                <Link to="/login" className="btn-secondary btn-lg">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M8 6L14 10L8 14V6Z" fill="currentColor" />
                                    </svg>
                                    View Demo
                                </Link>
                            </div>
                        </div>
                        <div className="hero-image fade-in-right" style={{ animationDelay: '0.5s' }}>
                            <div className="dashboard-mockup glass-card p-0 rounded-2xl overflow-hidden">
                                <div className="mockup-header">
                                    <div className="mockup-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                                <div className="mockup-content">
                                    <div className="mockup-sidebar">
                                        <div className="mockup-item active"></div>
                                        <div className="mockup-item"></div>
                                        <div className="mockup-item"></div>
                                        <div className="mockup-item"></div>
                                    </div>
                                    <div className="mockup-main">
                                        <div className="mockup-chart">
                                            <div className="chart-bar" style={{ height: '60%' }}></div>
                                            <div className="chart-bar" style={{ height: '80%' }}></div>
                                            <div className="chart-bar" style={{ height: '45%' }}></div>
                                            <div className="chart-bar" style={{ height: '90%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-24">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="pill-tag-soft inline-flex">Features</span>
                        <h2 className="text-[#0d253d]">Everything you need to manage expenses</h2>
                        <p className="text-[#64748d]">Simple yet powerful tools to take control of your finances</p>
                    </div>
                    <div className="features-grid">
                        <FeatureCard
                            icon={<CategoryIcon />}
                            title="Custom Categories"
                            description="Organize expenses with custom categories. Create, edit, and reorder categories to match your needs."
                        />
                        <FeatureCard
                            icon={<CurrencyIcon />}
                            title="Multi-Currency Support"
                            description="Track expenses in your preferred currency. Choose from USD, EUR, INR, GBP, and more."
                        />
                        <FeatureCard
                            icon={<ChartIcon />}
                            title="Visual Analytics"
                            description="See your spending patterns at a glance with beautiful charts and detailed breakdowns by category and time period."
                        />
                        <FeatureCard
                            icon={<ExportIcon />}
                            title="Export Your Data"
                            description="Download your expenses as CSV, Excel, or PDF files. Your data, your way."
                        />
                        <FeatureCard
                            icon={<FilterIcon />}
                            title="Smart Filters"
                            description="Filter expenses by date range, category, or amount. Find exactly what you're looking for instantly."
                        />
                        <FeatureCard
                            icon={<DarkModeIcon />}
                            title="Dark Mode"
                            description="Easy on the eyes. Switch between light and dark themes with a single click."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="relative z-10 py-24">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="pill-tag-soft inline-flex">How It Works</span>
                        <h2 className="text-[#0d253d]">Start tracking in 3 simple steps</h2>
                    </div>
                    <div className="benefits-content">
                        <div className="benefit-item">
                            <div className="benefit-text">
                                <span className="pill-tag-soft inline-flex mb-4">Step 1</span>
                                <h2 className="text-[#0d253d] text-4xl font-light tracking-tight mb-5">Create your account</h2>
                                <p className="text-[#64748d] text-lg leading-relaxed mb-6">Sign up in seconds with just your name, email, and preferred currency. No credit card required, no complicated setup.</p>
                                <ul className="benefit-list">
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Quick registration</li>
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Choose your currency</li>
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> 100% free</li>
                                </ul>
                            </div>
                            <div className="benefit-visual">
                                <div className="floating-card card-1 glass-card flex items-center gap-4 p-6">
                                    <div className="p-3 rounded-xl bg-[#b9b9f9]/40 border border-[#533afd]/20">
                                        <User className="w-6 h-6 text-[#533afd]" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748d] mb-1">Register</div>
                                        <div className="text-2xl font-bold bg-gradient-to-r from-[#533afd] to-[#ea2261] bg-clip-text text-transparent">30 sec</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="benefit-item reverse">
                            <div className="benefit-text">
                                <span className="pill-tag-soft inline-flex mb-4">Step 2</span>
                                <h2 className="text-[#0d253d] text-4xl font-light tracking-tight mb-5">Add your expenses</h2>
                                <p className="text-[#64748d] text-lg leading-relaxed mb-6">Log expenses quickly with our simple form. Add amount, category, description, and date. Organize with custom categories that work for you.</p>
                                <ul className="benefit-list">
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Quick entry</li>
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Custom categories</li>
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Add notes & dates</li>
                                </ul>
                            </div>
                            <div className="benefit-visual">
                                <div className="floating-card card-2 glass-card flex items-center gap-4 p-6">
                                    <div className="p-3 rounded-xl bg-[#f96bee]/15 border border-[#f96bee]/30">
                                        <FileText className="w-6 h-6 text-[#c026a3]" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748d] mb-1">Track</div>
                                        <div className="text-2xl font-bold bg-gradient-to-r from-[#533afd] to-[#ea2261] bg-clip-text text-transparent">Easy</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-text">
                                <span className="pill-tag-soft inline-flex mb-4">Step 3</span>
                                <h2 className="text-[#0d253d] text-4xl font-light tracking-tight mb-5">Understand your spending</h2>
                                <p className="text-[#64748d] text-lg leading-relaxed mb-6">View detailed analytics and charts showing where your money goes. Filter by date, category, or amount. Export reports whenever you need them.</p>
                                <ul className="benefit-list">
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Visual charts</li>
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Category breakdown</li>
                                    <li className="text-[#64748d]"><span className="text-[#533afd] font-bold text-lg">✓</span> Export to CSV/Excel/PDF</li>
                                </ul>
                            </div>
                            <div className="benefit-visual">
                                <div className="growth-chart glass-card p-8">
                                    <div className="chart-line">
                                        <svg viewBox="0 0 200 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#533afd" />
                                                    <stop offset="100%" stopColor="#ea2261" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M0,80 Q50,60 100,40 T200,10" stroke="url(#line-gradient)" strokeWidth="3" fill="none" className="chart-path" />
                                            <path d="M0,80 Q50,60 100,40 T200,10 L200,100 L0,100 Z" fill="url(#line-gradient)" opacity="0.1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="cta" className="relative z-10 py-24">
                <div className="landing-container">
                    <div className="p-12 sm:p-16 text-center max-w-3xl mx-auto rounded-2xl bg-white border border-[#e3e8ee] shadow-[0_8px_24px_rgba(0,55,112,0.08)]">
                        <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-[#0d253d] mb-5">Ready to take control of your spending?</h2>
                        <p className="text-lg text-[#64748d] mb-8">Join users who are already tracking their expenses and making smarter financial decisions.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                            <Link to="/register" className="btn-primary btn-lg">
                                Get Started Free
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                            <Link to="/login" className="btn-secondary btn-lg">Sign In</Link>
                        </div>
                        <p className="text-sm text-[#64748d]">Free forever • No credit card • Start in 30 seconds</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <PublicFooter />
        </div>
    )
}

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
    <div className="feature-card glass-card p-8">
        <div className="feature-icon mb-5">{icon}</div>
        <h3 className="text-xl font-bold mb-3 text-[#0d253d]">{title}</h3>
        <p className="text-sm leading-relaxed text-[#64748d]">{description}</p>
    </div>
)

// Icon Components — retinted to the Stripi gradient-mesh stops (indigo / ruby / magenta / lavender)
const CategoryIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#icon-gradient-1)" />
        <rect x="8" y="8" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
        <rect x="17" y="8" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
        <rect x="8" y="17" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
        <rect x="17" y="17" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2" />
        <defs>
            <linearGradient id="icon-gradient-1" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#665efd" />
                <stop offset="100%" stopColor="#533afd" />
            </linearGradient>
        </defs>
    </svg>
)

const CurrencyIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#icon-gradient-2)" />
        <circle cx="16" cy="16" r="7" stroke="white" strokeWidth="2" />
        <path d="M16 11V21M13 14C13 12.8954 13.8954 12 15 12H17C18.1046 12 19 12.8954 19 14C19 15.1046 18.1046 16 17 16H15C13.8954 16 13 16.8954 13 18C13 19.1046 13.8954 20 15 20H17C18.1046 20 19 19.1046 19 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="icon-gradient-2" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#f96bee" />
                <stop offset="100%" stopColor="#ea2261" />
            </linearGradient>
        </defs>
    </svg>
)

const ChartIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#icon-gradient-3)" />
        <path d="M8 20L14 14L18 18L24 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 12H24V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
            <linearGradient id="icon-gradient-3" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#918dfd" />
                <stop offset="100%" stopColor="#4434d4" />
            </linearGradient>
        </defs>
    </svg>
)

const ExportIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#icon-gradient-4)" />
        <path d="M16 8V18M16 8L12 12M16 8L20 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18V22C10 23.1046 10.8954 24 12 24H20C21.1046 24 22 23.1046 22 22V18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="icon-gradient-4" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#533afd" />
                <stop offset="100%" stopColor="#2e2b8c" />
            </linearGradient>
        </defs>
    </svg>
)

const FilterIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#icon-gradient-5)" />
        <path d="M8 10H24M10 16H22M12 22H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="icon-gradient-5" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#ea2261" />
                <stop offset="100%" stopColor="#f96bee" />
            </linearGradient>
        </defs>
    </svg>
)

const DarkModeIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#icon-gradient-6)" />
        <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 15.3128 23.9119 14.6463 23.7478 14.0104C23.371 14.1218 22.9719 14.1818 22.5587 14.1818C20.0655 14.1818 18.0451 12.1613 18.0451 9.66818C18.0451 9.25503 18.1051 8.85596 18.2164 8.47908C17.5796 8.31503 16.9128 8.22727 16.2232 8.22727C16.1489 8.22727 16.0748 8.22858 16.0011 8.23119C16.0006 8.22079 16 8.21036 16 8.2C16 8.08954 15.9895 7.98015 15.9691 7.87277C15.9893 7.87429 16.0097 7.87506 16.0302 7.87506C16.0201 7.91671 16.0149 7.95998 16.0149 8.00434C16.0149 8.00289 16.0149 8.00145 16.015 8C16.0099 8 16.005 8 16 8Z" fill="white" />
        <defs>
            <linearGradient id="icon-gradient-6" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#1c1e54" />
                <stop offset="100%" stopColor="#0d253d" />
            </linearGradient>
        </defs>
    </svg>
)

export default Landing
