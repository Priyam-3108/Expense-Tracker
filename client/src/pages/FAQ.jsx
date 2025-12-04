import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import '../styles/StaticPages.css'

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index)
    }

    const faqs = [
        {
            category: "Getting Started",
            questions: [
                {
                    q: "How do I create an account?",
                    a: "Click on 'Get Started Free' or 'Sign Up' button, enter your name, email, password, and choose your preferred currency. That's it! No credit card required."
                },
                {
                    q: "Is Expense Tracker really free?",
                    a: "Yes! Expense Tracker is completely free to use with all features included. There are no premium tiers or hidden costs."
                },
                {
                    q: "What currencies are supported?",
                    a: "We support major currencies including USD, EUR, GBP, INR, JPY, CAD, AUD, and many more. You can select your preferred currency during registration and change it later in settings."
                }
            ]
        },
        {
            category: "Features",
            questions: [
                {
                    q: "How do I add an expense?",
                    a: "Navigate to the Expenses page and click 'Add Expense'. Enter the amount, select a category, add a description (optional), choose the date, and click save. You can also bulk import expenses from CSV files."
                },
                {
                    q: "Can I create custom categories?",
                    a: "Absolutely! Go to the Categories page where you can create, edit, delete, and reorder your expense categories. You can also assign custom colors and icons to each category."
                },
                {
                    q: "What export formats are available?",
                    a: "You can export your expense data in three formats: CSV (for spreadsheets), Excel (.xlsx), and PDF (for reports). Use the export feature on the Expenses page and select your desired date range."
                },
                {
                    q: "How do I enable dark mode?",
                    a: "Click on the theme toggle icon in the navigation bar. You can switch between light mode, dark mode, or system preference (which automatically matches your device settings)."
                }
            ]
        },
        {
            category: "Account Management",
            questions: [
                {
                    q: "How do I change my password?",
                    a: "Go to your Profile page, and you'll find the option to update your password. For security reasons, you'll need to enter your current password to make changes."
                },
                {
                    q: "Can I change my currency after registration?",
                    a: "Yes, you can change your preferred currency in your Profile settings. Note that this only affects how new expenses are displayed - it doesn't convert existing expense amounts."
                },
                {
                    q: "How do I delete my account?",
                    a: "Contact us through the Support page to request account deletion. We'll permanently delete your data within 30 days as outlined in our Privacy Policy."
                }
            ]
        },
        {
            category: "Data & Privacy",
            questions: [
                {
                    q: "Is my financial data secure?",
                    a: "Yes! We use industry-standard encryption (HTTPS) for all data transmission and store passwords using bcrypt hashing. Your data is stored securely on encrypted servers."
                },
                {
                    q: "Who can see my expense data?",
                    a: "Only you! Your expense data is completely private and only visible to you when you're logged into your account. We never share or sell your data to third parties."
                },
                {
                    q: "Can I backup my data?",
                    a: "Yes! Use the export feature to download all your expense data in CSV, Excel, or PDF format. We recommend regular backups for your peace of mind."
                },
                {
                    q: "What happens to my data if I delete my account?",
                    a: "When you request account deletion, we permanently remove all your personal data and expenses within 30 days, except where we're legally required to retain certain information."
                }
            ]
        },
        {
            category: "Troubleshooting",
            questions: [
                {
                    q: "I forgot my password. What should I do?",
                    a: "Click on 'Forgot Password' on the login page. Enter your email address and we'll send you instructions to reset your password."
                },
                {
                    q: "Why aren't my charts updating?",
                    a: "Try refreshing the page. If the issue persists, make sure you have expenses in the selected date range. Contact support if problems continue."
                },
                {
                    q: "The app isn't working properly. What should I do?",
                    a: "First, try clearing your browser cache and cookies, then refresh the page. Make sure you're using a modern browser (Chrome, Firefox, Safari, or Edge). If issues persist, contact our support team."
                },
                {
                    q: "Can I use Expense Tracker on mobile?",
                    a: "Yes! Expense Tracker is fully responsive and works great on mobile browsers (iOS Safari, Chrome, etc.). Simply visit the website on your mobile device and log in."
                }
            ]
        }
    ]

    let questionIndex = 0

    return (
        <div className="static-page">
            {/* Navigation */}
            <nav className="static-navbar">
                <div className="landing-container">
                    <div className="nav-content">
                        <Logo />
                        <div className="nav-links">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/docs" className="nav-link">Documentation</Link>
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
                        <span className="page-badge">Help Center</span>
                        <h1 className="page-title">Frequently Asked Questions</h1>
                        <p className="page-subtitle">
                            Find answers to common questions about Expense Tracker
                        </p>
                    </div>

                    {faqs.map((category, catIdx) => (
                        <div key={catIdx} style={{ marginBottom: '48px' }}>
                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                marginBottom: '24px',
                                color: 'var(--foreground, #1a202c)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '32px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '4px'
                                }}></span>
                                {category.category}
                            </h2>
                            {category.questions.map((faq) => {
                                const currentIndex = questionIndex++
                                return (
                                    <div
                                        key={currentIndex}
                                        className={`faq-item ${activeIndex === currentIndex ? 'active' : ''}`}
                                        onClick={() => toggleFAQ(currentIndex)}
                                        style={{ animationDelay: `${currentIndex * 0.05}s` }}
                                    >
                                        <div className="faq-question">
                                            <span>{faq.q}</span>
                                            <div className="faq-icon">
                                                {activeIndex === currentIndex ? '−' : '+'}
                                            </div>
                                        </div>
                                        <div className="faq-answer">
                                            {faq.a}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    {/* Still have questions */}
                    <div className="content-section" style={{ textAlign: 'center', marginTop: '60px' }}>
                        <h2 className="section-title" style={{ justifyContent: 'center' }}>
                            <span className="section-icon">💬</span>
                            Still have questions?
                        </h2>
                        <div className="section-content">
                            <p style={{ marginBottom: '24px' }}>
                                Can't find what you're looking for? Our support team is here to help!
                            </p>
                            <Link to="/support" className="btn-primary btn-large">
                                Contact Support
                            </Link>
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

export default FAQ
