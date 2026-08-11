import { Link } from 'react-router-dom'
import Logo from './Logo'

const PublicFooter = () => {
    return (
        <footer className="relative z-10 border-t border-[#e3e8ee] bg-white py-16">
            <div className="landing-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand column */}
                    <div className="md:col-span-1 space-y-4">
                        <Logo />
                        <p className="text-sm text-[#64748d] leading-relaxed">
                            Simple, powerful expense tracking for everyone. Take control of your financial future today.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-[#0d253d] text-sm font-bold uppercase tracking-wider mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Home</Link>
                            </li>
                            <li>
                                <a href="/#features" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Features</a>
                            </li>
                            <li>
                                <a href="/#how-it-works" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">How It Works</a>
                            </li>
                            <li>
                                <Link to="/register" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Sign Up</Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Sign In</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-[#0d253d] text-sm font-bold uppercase tracking-wider mb-4">Resources</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/faq" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">FAQ</Link>
                            </li>
                            <li>
                                <Link to="/support" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Support</Link>
                            </li>
                            <li>
                                <Link to="/docs" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Documentation</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[#0d253d] text-sm font-bold uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/privacy" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-sm text-[#64748d] hover:text-[#533afd] transition-colors block">Terms of Service</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-[#e3e8ee] flex items-center justify-center text-center">
                    <p className="text-sm text-[#64748d]">
                        &copy; {new Date().getFullYear()} Expense Tracker. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter
