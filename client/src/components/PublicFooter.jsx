import { Link } from 'react-router-dom'
import Logo from './Logo'

const PublicFooter = () => {
    return (
        <footer className="relative z-10" style={{ background: '#1c1a18' }}>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand column */}
                    <div className="md:col-span-1 space-y-5">
                        <Logo tone="light" />
                        <p className="text-sm leading-relaxed" style={{color:'#aaa398'}}>
                            Expense and income tracking by category, with charts and exports.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-xs font-medium mb-4" style={{color:'#8a847a'}}>Product</h4>
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
                                        ? <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'#aaa398'}}>{label}</Link>
                                        : <a href={href} className="text-sm transition-colors hover:text-white" style={{color:'#aaa398'}}>{label}</a>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-xs font-medium mb-4" style={{color:'#8a847a'}}>Resources</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'FAQ', to: '/faq' },
                                { label: 'Support', to: '/support' },
                                { label: 'Documentation', to: '/docs' },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'#aaa398'}}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-xs font-medium mb-4" style={{color:'#8a847a'}}>Legal</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Privacy policy', to: '/privacy' },
                                { label: 'Terms of service', to: '/terms' },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm transition-colors hover:text-white" style={{color:'#aaa398'}}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{borderTop:'1px solid rgba(239,233,222,0.08)'}}>
                    <p className="text-xs" style={{color:'#8a847a'}}>
                        © {new Date().getFullYear()} Spendly. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter
