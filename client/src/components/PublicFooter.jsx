import { Link } from 'react-router-dom'

const PublicFooter = () => {
    return (
        <footer className="relative z-10" style={{ background: '#141415' }}>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand column */}
                    <div className="md:col-span-1 space-y-5">
                        {/* Logo mark */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#533afd]">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="1.75" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <span className="text-[#ededed] font-medium text-base">Spendly</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{color:'#a1a1a6'}}>
                            Expense and income tracking by category, with charts and exports.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-xs font-medium mb-4" style={{color:'#85858b'}}>Product</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Home', to: '/' },
                                { label: 'Features', href: '/#features' },
                                { label: 'How it works', href: '/#how-it-works' },
                                { label: 'Create account', to: '/register' },
                                { label: 'Sign in', to: '/login' },
                            ].map(({ label, to, href }) => (
                                <li key={label}>
                                    {to
                                        ? <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'#a1a1a6'}}>{label}</Link>
                                        : <a href={href} className="text-sm transition-colors hover:text-white" style={{color:'#a1a1a6'}}>{label}</a>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-xs font-medium mb-4" style={{color:'#85858b'}}>Resources</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'FAQ', to: '/faq' },
                                { label: 'Support', to: '/support' },
                                { label: 'Documentation', to: '/docs' },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'#a1a1a6'}}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-xs font-medium mb-4" style={{color:'#85858b'}}>Legal</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Privacy policy', to: '/privacy' },
                                { label: 'Terms of service', to: '/terms' },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'#a1a1a6'}}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                    <p className="text-xs" style={{color:'#85858b'}}>
                        © {new Date().getFullYear()} Spendly. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter
