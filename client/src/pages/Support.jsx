import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { BookOpen, HelpCircle, Mail, ShieldCheck, Scale, ArrowRight } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
import '../styles/StaticPages.css'

const Support = () => {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="static-page">
            {/* Navigation */}
            <PublicNavbar />

            {/* Content */}
            <div className="static-content">
                <div className="static-container">
                    <div className="page-header">
                        <span className="page-badge">Help & support</span>
                        <h1 className="page-title">How can we help?</h1>
                        <p className="page-subtitle">
                            Get the support you need to make the most of Spendly
                        </p>
                    </div>

                    {/* Support Options */}
                    <div className="support-grid">
                        <div className="support-card">
                            <div className="support-icon">
                                <BookOpen />
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
                                <HelpCircle />
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
                                <Mail />
                            </div>
                            <h3>Email support</h3>
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
                            Quick help
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
                            Common issues & solutions
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
                                <li>For best experience, add Spendly to your home screen</li>
                                <li>Make sure JavaScript is enabled in your browser settings</li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Form Info */}
                    <div className="content-section">
                        <h2 className="section-title">
                            Contact information
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Email:</strong> <a href="mailto:support@expensetracker.com" className="text-brass hover:underline">support@expensetracker.com</a>
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
                            Feature requests & feedback
                        </h2>
                        <div className="section-content">
                            <p>
                                We love hearing from our users. If you have ideas for new features or improvements, we'd love to hear them.
                            </p>
                            <p>
                                Send your suggestions to <a href="mailto:feedback@expensetracker.com" className="text-brass hover:underline">feedback@expensetracker.com</a>
                            </p>
                            <p>
                                Your feedback helps us make Spendly better for everyone.
                            </p>
                        </div>
                    </div>

                    {/* Bug Reports */}
                    <div className="content-section">
                        <h2 className="section-title">
                            Report a bug
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
                                Report bugs to: <a href="mailto:bugs@expensetracker.com" className="text-brass hover:underline">bugs@expensetracker.com</a>
                            </p>
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="content-section">
                        <h2 className="text-2xl font-medium text-[#171717] mb-4 flex items-center gap-3">
                            Additional resources
                        </h2>
                        <div className="text-[#737373]">
                            <p className="mb-6">
                                Explore these resources to get the most out of Spendly:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link to="/docs" className="bg-[#f5f5f5] border border-[#e5e5e5] p-4 rounded-xl flex items-center justify-between text-[#171717] hover:bg-[#eef2f6] transition-colors">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <BookOpen className="w-4 h-4" /> User Documentation
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link to="/faq" className="bg-[#f5f5f5] border border-[#e5e5e5] p-4 rounded-xl flex items-center justify-between text-[#171717] hover:bg-[#eef2f6] transition-colors">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link to="/privacy" className="bg-[#f5f5f5] border border-[#e5e5e5] p-4 rounded-xl flex items-center justify-between text-[#171717] hover:bg-[#eef2f6] transition-colors">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <ShieldCheck className="w-4 h-4" /> Privacy Policy
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link to="/terms" className="bg-[#f5f5f5] border border-[#e5e5e5] p-4 rounded-xl flex items-center justify-between text-[#171717] hover:bg-[#eef2f6] transition-colors">
                                    <span className="font-medium flex items-center gap-2.5">
                                        <Scale className="w-4 h-4" /> Terms of Service
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
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
