import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Logo from '../components/Logo'
import '../styles/StaticPages.css'

const Support = () => {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="static-page">
            {/* Navigation */}
            <nav className="static-navbar">
                <div className="landing-container">
                    <div className="nav-content">
                        <Logo />
                        <div className="nav-links">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/faq" className="nav-link">FAQ</Link>
                            <Link to="/docs" className="nav-link">Documentation</Link>
                            <Link to="/login" className="btn-secondary">Sign In</Link>
                            <Link to="/register" className="btn-primary">Get Started Free</Link>
                        </div>
                    </div>
                </div>
            </nav>

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
                        <div className="support-card" style={{ animationDelay: '0.1s' }}>
                            <div className="support-icon">📚</div>
                            <h3>Documentation</h3>
                            <p>
                                Comprehensive guides and tutorials to help you get started and master all features.
                            </p>
                            <Link to="/docs" className="btn-primary">
                                View Docs
                            </Link>
                        </div>

                        <div className="support-card" style={{ animationDelay: '0.2s' }}>
                            <div className="support-icon">❓</div>
                            <h3>FAQ</h3>
                            <p>
                                Find quick answers to the most commonly asked questions about features and usage.
                            </p>
                            <Link to="/faq" className="btn-primary">
                                Browse FAQ
                            </Link>
                        </div>

                        <div className="support-card" style={{ animationDelay: '0.3s' }}>
                            <div className="support-icon">📧</div>
                            <h3>Email Support</h3>
                            <p>
                                Send us an email and our team will get back to you within 24-48 hours.
                            </p>
                            <a href="mailto:support@expensetracker.com" className="btn-primary">
                                Email Us
                            </a>
                        </div>
                    </div>

                    {/* Quick Help */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">⚡</span>
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
                            <span className="section-icon">🔧</span>
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
                            <span className="section-icon">✉️</span>
                            Contact Information
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Email:</strong> <a href="mailto:support@expensetracker.com" style={{ color: '#667eea', textDecoration: 'none' }}>support@expensetracker.com</a>
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
                            <span className="section-icon">💡</span>
                            Feature Requests & Feedback
                        </h2>
                        <div className="section-content">
                            <p>
                                We love hearing from our users! If you have ideas for new features or improvements, we'd love to hear them.
                            </p>
                            <p>
                                Send your suggestions to <a href="mailto:feedback@expensetracker.com" style={{ color: '#667eea', textDecoration: 'none' }}>feedback@expensetracker.com</a>
                            </p>
                            <p>
                                Your feedback helps us make Expense Tracker better for everyone!
                            </p>
                        </div>
                    </div>

                    {/* Bug Reports */}
                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🐛</span>
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
                                Report bugs to: <a href="mailto:bugs@expensetracker.com" style={{ color: '#667eea', textDecoration: 'none' }}>bugs@expensetracker.com</a>
                            </p>
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="content-section" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                        <h2 className="section-title" style={{ color: 'white' }}>
                            <span className="section-icon" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>🎯</span>
                            Additional Resources
                        </h2>
                        <div className="section-content" style={{ color: 'white' }}>
                            <p style={{ color: 'white', opacity: 0.95 }}>
                                Explore these resources to get the most out of Expense Tracker:
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                    <Link to="/docs" style={{ color: 'white', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>📖 User Documentation</span>
                                        <span>→</span>
                                    </Link>
                                </li>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                    <Link to="/faq" style={{ color: 'white', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>❓ Frequently Asked Questions</span>
                                        <span>→</span>
                                    </Link>
                                </li>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                    <Link to="/privacy" style={{ color: 'white', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>🔒 Privacy Policy</span>
                                        <span>→</span>
                                    </Link>
                                </li>
                                <li style={{ padding: '12px 0' }}>
                                    <Link to="/terms" style={{ color: 'white', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>📋 Terms of Service</span>
                                        <span>→</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <Logo />
                            <p>Simple expense tracking for everyone.</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <Link to="/">Home</Link>
                                <Link to="/register">Sign Up</Link>
                                <Link to="/login">Sign In</Link>
                            </div>
                            <div className="footer-column">
                                <h4>Resources</h4>
                                <Link to="/faq">FAQ</Link>
                                <Link to="/support">Support</Link>
                                <Link to="/docs">Documentation</Link>
                            </div>
                            <div className="footer-column">
                                <h4>Legal</h4>
                                <Link to="/privacy">Privacy Policy</Link>
                                <Link to="/terms">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 Expense Tracker. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Support
