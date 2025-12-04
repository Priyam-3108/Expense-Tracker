import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Logo from '../components/Logo'
import '../styles/StaticPages.css'

const PrivacyPolicy = () => {
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
                        <span className="page-badge">Privacy</span>
                        <h1 className="page-title">Privacy Policy</h1>
                        <p className="page-subtitle">
                            Your privacy is important to us. This policy explains how we collect, use, and protect your data.
                        </p>
                        <p className="page-updated">Last updated: December 4, 2025</p>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">📊</span>
                            1. Information We Collect
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Account Information:</strong> When you create an account, we collect:
                            </p>
                            <ul>
                                <li>Your name</li>
                                <li>Email address</li>
                                <li>Password (encrypted)</li>
                                <li>Preferred currency</li>
                            </ul>
                            <p>
                                <strong>Expense Data:</strong> We store the expense information you enter, including:
                            </p>
                            <ul>
                                <li>Expense amounts and descriptions</li>
                                <li>Categories and dates</li>
                                <li>Any additional notes you add</li>
                            </ul>
                            <p>
                                <strong>Usage Information:</strong> We automatically collect certain information when you use our service:
                            </p>
                            <ul>
                                <li>Device information (browser type, operating system)</li>
                                <li>IP address and location data</li>
                                <li>Pages visited and features used</li>
                                <li>Login times and session duration</li>
                            </ul>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🎯</span>
                            2. How We Use Your Information
                        </h2>
                        <div className="section-content">
                            <p>
                                We use your information to:
                            </p>
                            <ul>
                                <li><strong>Provide the Service:</strong> Store and display your expense data, generate analytics, and enable data exports</li>
                                <li><strong>Improve Our Service:</strong> Analyze usage patterns to enhance features and user experience</li>
                                <li><strong>Communicate:</strong> Send important updates about the service, security alerts, and respond to support requests</li>
                                <li><strong>Security:</strong> Protect against fraud, abuse, and unauthorized access</li>
                                <li><strong>Compliance:</strong> Meet legal obligations and enforce our Terms of Service</li>
                            </ul>
                            <p>
                                We do <strong>not</strong> use your expense data for advertising purposes or sell it to third parties.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">💾</span>
                            3. Data Storage and Security
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Where We Store Data:</strong> Your data is stored on secure servers using industry-standard encryption protocols. We use MongoDB for database storage with encryption at rest and in transit.
                            </p>
                            <p>
                                <strong>Security Measures:</strong> We implement multiple layers of security:
                            </p>
                            <ul>
                                <li>Encrypted password storage using bcrypt hashing</li>
                                <li>HTTPS encryption for all data transmission</li>
                                <li>Regular security audits and updates</li>
                                <li>Limited employee access to user data</li>
                                <li>Secure authentication with JWT tokens</li>
                            </ul>
                            <p>
                                <strong>Data Retention:</strong> We retain your data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we're required to retain it for legal purposes.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🔗</span>
                            4. Data Sharing and Disclosure
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>We Do Not Sell Your Data:</strong> We will never sell, rent, or trade your personal information to third parties for marketing purposes.
                            </p>
                            <p>
                                <strong>Limited Sharing:</strong> We may share your information only in these circumstances:
                            </p>
                            <ul>
                                <li><strong>Service Providers:</strong> With trusted third-party services that help us operate (e.g., hosting providers, analytics tools) - these parties are bound by confidentiality agreements</li>
                                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                                <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of Expense Tracker, our users, or the public</li>
                                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets - we will notify you beforehand</li>
                            </ul>
                            <p>
                                <strong>Your Exports:</strong> When you use our export features, you control where your data goes. We don't track or access your exported files.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">⚙️</span>
                            5. Your Rights and Choices
                        </h2>
                        <div className="section-content">
                            <p>
                                You have the following rights regarding your data:
                            </p>
                            <ul>
                                <li><strong>Access:</strong> View all your personal data at any time through your account settings</li>
                                <li><strong>Export:</strong> Download your expense data in CSV, Excel, or PDF format whenever you want</li>
                                <li><strong>Correction:</strong> Update or correct your personal information in your profile</li>
                                <li><strong>Deletion:</strong> Request account deletion, which will permanently remove your data</li>
                                <li><strong>Portability:</strong> Export your data to use with other services</li>
                                <li><strong>Withdraw Consent:</strong> Stop using the service at any time</li>
                            </ul>
                            <p>
                                To exercise these rights, visit your Profile page or contact us through our <Link to="/support" style={{ color: '#667eea', textDecoration: 'none' }}>Support page</Link>.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🍪</span>
                            6. Cookies and Tracking
                        </h2>
                        <div className="section-content">
                            <p>
                                <strong>Cookies We Use:</strong> We use cookies and similar technologies to:
                            </p>
                            <ul>
                                <li><strong>Essential Cookies:</strong> Required for authentication and security (cannot be disabled)</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings like theme preference (dark/light mode) and currency</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our service (anonymized data)</li>
                            </ul>
                            <p>
                                <strong>Third-Party Cookies:</strong> We may use trusted third-party analytics services to help improve our service. These services may set their own cookies.
                            </p>
                            <p>
                                <strong>Cookie Control:</strong> You can control cookies through your browser settings, but disabling essential cookies may prevent you from using certain features.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">👶</span>
                            7. Children's Privacy
                        </h2>
                        <div className="section-content">
                            <p>
                                Expense Tracker is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately and we will delete it.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🌍</span>
                            8. International Users
                        </h2>
                        <div className="section-content">
                            <p>
                                If you're using Expense Tracker from outside the United States, please note that your data may be transferred to and processed in countries where we operate. By using our service, you consent to this transfer.
                            </p>
                            <p>
                                <strong>GDPR Compliance:</strong> For users in the European Economic Area (EEA), we comply with GDPR requirements and respect your rights under GDPR, including rights to access, rectification, erasure, and data portability.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">🔄</span>
                            9. Changes to Privacy Policy
                        </h2>
                        <div className="section-content">
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                            </p>
                            <ul>
                                <li>Updating the "Last updated" date</li>
                                <li>Sending an email notification to your registered email address</li>
                                <li>Displaying a notice in the application</li>
                            </ul>
                            <p>
                                Your continued use of Expense Tracker after changes are posted constitutes your acceptance of the updated policy.
                            </p>
                        </div>
                    </div>

                    <div className="content-section">
                        <h2 className="section-title">
                            <span className="section-icon">📧</span>
                            10. Contact Us
                        </h2>
                        <div className="section-content">
                            <p>
                                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                            </p>
                            <ul>
                                <li>Through our <Link to="/support" style={{ color: '#667eea', textDecoration: 'none' }}>Support page</Link></li>
                                <li>By email: privacy@expensetracker.com</li>
                            </ul>
                            <p>
                                We take your privacy seriously and will respond to all requests within a reasonable timeframe.
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

export default PrivacyPolicy
