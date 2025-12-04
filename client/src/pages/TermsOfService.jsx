import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Logo from '../components/Logo'
import '../styles/StaticPages.css'

const TermsOfService = () => {
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
                            <Link to="/support" className="nav-link">Support</Link>
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
                        <span className="page-badge">Legal</span>
                        <h1 className="page-title">Terms of Service</h1>
                        <p className="page-subtitle">
                            Please read these terms carefully before using Expense Tracker
                        </p>
                        <p className="page-updated">Last updated: December 4, 2025</p>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">📋</span>
                            1. Introduction
                        </h2>
                        <div className="section-content">
                            <p>
                                Welcome to Expense Tracker. By accessing or using our service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                            <p>
                                Expense Tracker provides a free expense tracking and management service that helps users organize, analyze, and export their financial data. These terms govern your use of our web application and services.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">💼</span>
                            2. Service Description
                        </h2>
                        <div className="section-content">
                            <p>
                                Expense Tracker offers the following features:
                            </p>
                            <ul>
                                <li>Personal expense tracking and categorization</li>
                                <li>Custom category creation and management</li>
                                <li>Visual analytics and spending insights</li>
                                <li>Data export in multiple formats (CSV, Excel, PDF)</li>
                                <li>Multi-currency support</li>
                                <li>Dark mode and customizable themes</li>
                            </ul>
                            <p>
                                We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">👤</span>
                            3. User Accounts
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Account Creation:</strong> You must create an account to use Expense Tracker. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                            <p>
                                <strong>Account Responsibilities:</strong> You agree to:
                            </p>
                            <ul>
                                <li>Provide accurate and complete information during registration</li>
                                <li>Maintain the security of your password and account</li>
                                <li>Notify us immediately of any unauthorized use of your account</li>
                                <li>Not share your account with others</li>
                            </ul>
                            <p>
                                <strong>Account Termination:</strong> We reserve the right to terminate or suspend accounts that violate these terms or engage in fraudulent, abusive, or illegal activity.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🔒</span>
                            4. Data and Privacy
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Your Data:</strong> All expense data you enter into Expense Tracker remains your property. We store your data securely and use it only to provide and improve our services.
                            </p>
                            <p>
                                <strong>Data Security:</strong> While we implement industry-standard security measures to protect your data, no system is completely secure. You acknowledge that you provide your data at your own risk.
                            </p>
                            <p>
                                <strong>Privacy Policy:</strong> Our collection and use of personal information is governed by our <Link to="/privacy" style={{ color: '#667eea', textDecoration: 'none' }}>Privacy Policy</Link>, which is incorporated into these terms by reference.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">⚖️</span>
                            5. Acceptable Use
                        </h2>
                        <div className="section-content">
                            <p>
                                You agree not to:
                            </p>
                            <ul>
                                <li>Use the service for any illegal purpose</li>
                                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                                <li>Upload malicious code, viruses, or any harmful content</li>
                                <li>Reverse engineer, decompile, or disassemble any part of the service</li>
                                <li>Use automated systems (bots, scrapers) without our permission</li>
                                <li>Interfere with or disrupt the service or servers</li>
                            </ul>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">©️</span>
                            6. Intellectual Property
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Our Content:</strong> The service, including its design, features, text, graphics, logos, and software, is owned by Expense Tracker and protected by copyright, trademark, and other intellectual property laws.
                            </p>
                            <p>
                                <strong>Limited License:</strong> We grant you a limited, non-exclusive, non-transferable license to access and use the service for personal, non-commercial purposes.
                            </p>
                            <p>
                                <strong>Your Content:</strong> You retain all rights to the data you input into the service. By using our export features, you can download and backup your data at any time.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">⚠️</span>
                            7. Disclaimer and Limitation of Liability
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Service "As Is":</strong> Expense Tracker is provided "as is" and "as available" without any warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                            </p>
                            <p>
                                <strong>No Financial Advice:</strong> Expense Tracker is a tool for tracking expenses. It does not provide financial, investment, or tax advice. Consult with qualified professionals for such advice.
                            </p>
                            <p>
                                <strong>Limitation of Liability:</strong> To the fullest extent permitted by law, Expense Tracker shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, or other intangible losses.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🔄</span>
                            8. Changes to Terms
                        </h2>
                        <div className="section-content">
                            <p>
                                We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Your continued use of the service after such changes constitutes your acceptance of the new terms.
                            </p>
                            <p>
                                We encourage you to review these terms periodically for any updates.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">📧</span>
                            9. Contact Information
                        </h2>
                        <div className="section-content">
                            <p>
                                If you have any questions about these Terms of Service, please contact us through our <Link to="/support" style={{ color: '#667eea', textDecoration: 'none' }}>Support page</Link>.
                            </p>
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

export default TermsOfService
