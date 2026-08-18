import { Link } from 'react-router-dom'

const PublicFooter = () => {
    return (
        <footer className="relative z-10 mt-8" style={{ background: '#0b0d1a' }}>
            {/* Top accent line */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(83,58,253,0.5), transparent)' }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand column */}
                    <div className="md:col-span-1 space-y-5">
                        {/* Logo mark */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{background:'linear-gradient(135deg,#665efd,#533afd)'}}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="13" cy="12" r="2.5" fill="#ea2261"/>
                                </svg>
                            </div>
                            <span className="text-white font-semibold text-lg tracking-tight">Spendly</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{color:'rgba(255,255,255,0.4)'}}>
                            Simple, powerful expense tracking for everyone. Take control of your financial future today.
                        </p>
                        {/* Status indicator */}
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs" style={{color:'rgba(255,255,255,0.35)', fontFamily:'monospace'}}>All systems operational</span>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{color:'rgba(255,255,255,0.35)'}}>Product</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Home', to: '/' },
                                { label: 'Features', href: '/#features' },
                                { label: 'How It Works', href: '/#how-it-works' },
                                { label: 'Sign Up', to: '/register' },
                                { label: 'Sign In', to: '/login' },
                            ].map(({ label, to, href }) => (
                                <li key={label}>
                                    {to
                                        ? <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.5)'}}>{label}</Link>
                                        : <a href={href} className="text-sm transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.5)'}}>{label}</a>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{color:'rgba(255,255,255,0.35)'}}>Resources</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'FAQ', to: '/faq' },
                                { label: 'Support', to: '/support' },
                                { label: 'Documentation', to: '/docs' },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.5)'}}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{color:'rgba(255,255,255,0.35)'}}>Legal</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Privacy Policy', to: '/privacy' },
                                { label: 'Terms of Service', to: '/terms' },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'rgba(255,255,255,0.5)'}}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                    <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
                        © {new Date().getFullYear()} Spendly. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="text-xs" style={{color:'rgba(255,255,255,0.25)'}}>Built with</span>
                        <span className="text-xs" style={{color:'#ea2261'}}>♥</span>
                        <span className="text-xs" style={{color:'rgba(255,255,255,0.25)'}}>for financial clarity</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter
