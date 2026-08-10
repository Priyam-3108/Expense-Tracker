import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { BookOpen, HelpCircle, Mail, Zap, Wrench, Lightbulb, Bug, Target, FileText, ShieldCheck, Scale, ArrowRight } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
import '../styles/StaticPages.css'

const Support = () => {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="static-page bg-slate-950 noise-overlay">
            {/* Animated Liquid Glass Orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="liquid-orb liquid-orb-indigo" style={{ top: '-200px', right: '-100px' }} />
                <div className="liquid-orb liquid-orb-emerald" style={{ top: '40%', left: '-150px' }} />
                <div className="liquid-orb liquid-orb-violet" style={{ top: '60%', right: '5%' }} />
            </div>

            {/* Navigation */}
            <PublicNavbar />

            {/* Content */}
            <div className="static-content">
                <div className="static-container">
                    <div className="page-header">
                        <span className="page-badge">Help & Support</span>
                        <h1 className="page-title">How Can We Help?</h1>
                        <p className="page-subtitle">
                            Get the support you need to make the most of Expense Tracker
                        </p>
                    </div>

                    {/* Support Options */}
                    <div className="support-grid">
                        <div className="support-card">
                            <div className="support-icon">
                                <BookOpen className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h3>Documentation</h3>
                            <p>
                                Comprehensive guides and tutorials to help you get started and master all features.
                            </p>
                            <Link to="/docs" className="btn-primary btn-sm w-full justify-center">
                                View Docs
                            </Link>
                        </div>

                        <div className="support-card">
                            <div className="support-icon">
                                <HelpCircle className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h3>FAQ</h3>
                            <p>
                                Find quick answers to the most commonly asked questions about features and usage.
                            </p>
                            <Link to="/faq" className="btn-primary btn-sm w-full justify-center">
                                Browse FAQ
                            </Link>
                        </div>

                        <div className="support-card">
                            <div className="support-icon">
                                <Mail className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h3>Email Support</h3>
                            <p>
                                Send us an email and our team will get back to you within 24-48 hours.
                            </p>
                            <a href="mailto:support@expensetracker.com" className="btn-primary btn-sm w-full justify-center">
                                Email Us
                            </a>
                        </div>
                    </div>

                    {/* Quick Help */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon"><Zap className="w-5 h-5 text-indigo-400" /></span>
                            Quick Help
                        </h2>
                        <div className="section-content">
                            <p><strong>Before contacting support, try these quick solutions:</strong></p>
                            <ul>
                                <li><strong>Can't log in?</strong> Try the "Forgot Password" link on the login page to reset your password</li>
                                <li><strong>Features not working?</strong> Clear your browser cache and cookies, then refresh the page</li>
                                <li><strong>Data not updating?</strong> Make sure you're connected to the internet and try refreshing</li>
                                <li><strong>Export not working?</strong> Check that you have expenses in the selected date range</li>
                                <li><strong>Browser compatibility:</strong> We support the latest versions of Chrome, Firefox, Safari, and Edge</li>
                            </ul>
                        </div>
                    </div>

                    {/* Common Issues */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon"><Wrench className="w-5 h-5 text-indigo-400" /></span>
                            Common Issues & Solutions
                        </h2>
                        <div className="section-content">
                            <p><strong>Charts not displaying correctly:</strong></p>
                            <ul>
                                <li>Ensure you have expense data in the selected date range</li>
                                <li>Try switching between different time periods (week, month, year)</li>
                                <li>Check that your categories have expenses assigned to them</li>
                            </ul>

                            <p><strong>Category colors not showing:</strong></p>
                            <ul>
                                <li>Make sure you've assigned colors to your categories in the Categories page</li>
                                <li>Try creating a new category to see if the issue persists</li>
                            </ul>

                            <p><strong>Export file issues:</strong></p>
                            <ul>
                                <li>Check your browser's download settings and popup blocker</li>
                                <li>Make sure you have write permissions to your download folder</li>
                                <li>Try a different export format (CSV, Excel, or PDF)</li>
                            </ul>

                            <p><strong>Mobile experience:</strong></p>
                            <ul>
                                <li>Use a modern mobile browser (not in-app browsers from social media)</li>
                                <li>For best experience, add Expense Tracker to your home screen</li>
                                <li>Make sure JavaScript is enabled in your browser settings</li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Form Info */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon"><Mail className="w-5 h-5 text-indigo-400" /></span>
                            Contact Information
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Email:</strong> <a href="mailto:support@expensetracker.com" className="text-indigo-400 hover:text-indigo-300 underline font-medium">support@expensetracker.com</a>
                            </p>
                            <p>
                                <strong>Response Time:</strong> We typically respond within 24-48 hours during business days.
                            </p>
                            <p>
                                <strong>When contacting us, please include:</strong>
                            </p>
                            <ul>
                                <li>A clear description of your issue or question</li>
                                <li>The browser and device you're using</li>
                                <li>Screenshots if applicable (helpful for visual issues)</li>
                                <li>Steps to reproduce the problem (if it's a bug)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Feature Requests */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon"><Lightbulb className="w-5 h-5 text-indigo-400" /></span>
                            Feature Requests & Feedback
                        </h2>
                        <div className="section-content">
                            <p>
                                We love hearing from our users! If you have ideas for new features or improvements, we'd love to hear them.
                            </p>
                            <p>
                                Send your suggestions to <a href="mailto:feedback@expensetracker.com" className="text-indigo-400 hover:text-indigo-300 underline font-medium">feedback@expensetracker.com</a>
                            </p>
                            <p>
                                Your feedback helps us make Expense Tracker better for everyone!
                            </p>
                        </div>
                    </div>

                    {/* Bug Reports */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon"><Bug className="w-5 h-5 text-indigo-400" /></span>
                            Report a Bug
                        </h2>
                        <div className="section-content">
                            <p>
                                Found a bug? Help us fix it by providing detailed information:
                            </p>
                            <ul>
                                <li>What were you trying to do?</li>
                                <li>What happened instead?</li>
                                <li>What browser and operating system are you using?</li>
                                <li>Can you reproduce the issue consistently?</li>
                            </ul>
                            <p>
                                Report bugs to: <a href="mailto:bugs@expensetracker.com" className="text-indigo-400 hover:text-indigo-300 underline font-medium">bugs@expensetracker.com</a>
                            </p>
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="glass-modal-panel p-8 sm:p-10 rounded-3xl border border-indigo-500/30">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                                <Target className="w-5 h-5 text-indigo-400" />
                            </span>
                            Additional Resources
                        </h2>
                        <div className="text-slate-300">
                            <p className="mb-6">
                                Explore these resources to get the most out of Expense Tracker:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link to="/docs" className="glass-card p-4 rounded-xl flex items-center justify-between text-white hover:border-indigo-500/40 transition-all">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <BookOpen className="w-4 h-4 text-indigo-400" /> User Documentation
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                                </Link>
                                <Link to="/faq" className="glass-card p-4 rounded-xl flex items-center justify-between text-white hover:border-indigo-500/40 transition-all">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <HelpCircle className="w-4 h-4 text-indigo-400" /> Frequently Asked Questions
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                                </Link>
                                <Link to="/privacy" className="glass-card p-4 rounded-xl flex items-center justify-between text-white hover:border-indigo-500/40 transition-all">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <ShieldCheck className="w-4 h-4 text-indigo-400" /> Privacy Policy
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                                </Link>
                                <Link to="/terms" className="glass-card p-4 rounded-xl flex items-center justify-between text-white hover:border-indigo-500/40 transition-all">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <Scale className="w-4 h-4 text-indigo-400" /> Terms of Service
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <PublicFooter />
        </div>
    )
}

export default Support
