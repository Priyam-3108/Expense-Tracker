import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Logo from '../components/Logo'
import '../styles/StaticPages.css'

const Documentation = () => {
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
                        <span className="page-badge">Documentation</span>
                        <h1 className="page-title">User Guide</h1>
                        <p className="page-subtitle">
                            Learn how to use Expense Tracker to take control of your finances
                        </p>
                    </div>

                    {/* Quick Start */}
                    <div className="doc-step" style={{ animationDelay: '0.1s' }}>
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h3>Getting Started</h3>
                            <p>
                                Create your free account in seconds. No credit card required!
                            </p>
                            <ul>
                                <li>Click "Get Started Free" or "Sign Up"</li>
                                <li>Enter your name, email, and create a password</li>
                                <li>Select your preferred currency (USD, EUR, INR, etc.)</li>
                                <li>Click "Register" and you're ready to go!</li>
                            </ul>
                            <p>
                                <strong>Pro Tip:</strong> Choose the currency you use most often. You can change it later in your profile settings.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.2s' }}>
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h3>Dashboard Overview</h3>
                            <p>
                                After logging in, you'll see your Dashboard - your financial command center.
                            </p>
                            <ul>
                                <li><strong>Total Expenses:</strong> See your spending at a glance</li>
                                <li><strong>Recent Expenses:</strong> Quick view of your latest transactions</li>
                                <li><strong>Category Breakdown:</strong> Visual chart showing spending by category</li>
                                <li><strong>Monthly Trends:</strong> Track your spending patterns over time</li>
                            </ul>
                            <p>
                                The dashboard updates in real-time as you add or edit expenses.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.3s' }}>
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h3>Adding Expenses</h3>
                            <p>
                                Navigate to the Expenses page to add your spending data.
                            </p>
                            <ul>
                                <li>Click the "Add Expense" button</li>
                                <li>Enter the amount (numbers only, currency symbol is added automatically)</li>
                                <li>Select a category from your list</li>
                                <li>Add a description (e.g., "Lunch at Cafe", "Monthly rent")</li>
                                <li>Choose the date when the expense occurred</li>
                                <li>Click "Save" to add the expense</li>
                            </ul>
                            <p>
                                <strong>Bulk Import:</strong> Have many expenses? Import them from a CSV file using the bulk import feature.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.4s' }}>
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <h3>Managing Categories</h3>
                            <p>
                                Categories help you organize your spending. Customize them to match your needs.
                            </p>
                            <ul>
                                <li><strong>Create Category:</strong> Click "Add Category" and choose a name, color, and icon</li>
                                <li><strong>Edit Category:</strong> Click the edit icon to change name, color, or icon</li>
                                <li><strong>Reorder Categories:</strong> Drag and drop categories to arrange them in your preferred order</li>
                                <li><strong>Delete Category:</strong> Remove unused categories (expenses will be unassigned)</li>
                            </ul>
                            <p>
                                Common categories: Food, Transportation, Utilities, Entertainment, Healthcare, Shopping, etc.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.5s' }}>
                        <div className="step-number">5</div>
                        <div className="step-content">
                            <h3>Using Analytics</h3>
                            <p>
                                The Analytics page provides detailed insights into your spending patterns.
                            </p>
                            <ul>
                                <li><strong>Time Period:</strong> Select week, month, quarter, or year view</li>
                                <li><strong>Custom Range:</strong> Pick exact start and end dates for analysis</li>
                                <li><strong>Category Breakdown:</strong> See which categories consume most of your budget</li>
                                <li><strong>Trend Charts:</strong> Visualize spending over time with interactive graphs</li>
                                <li><strong>Comparison:</strong> Compare current period with previous periods</li>
                            </ul>
                            <p>
                                Use these insights to identify spending patterns and make informed financial decisions.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.6s' }}>
                        <div className="step-number">6</div>
                        <div className="step-content">
                            <h3>Exporting Data</h3>
                            <p>
                                Download your expense data in multiple formats for backup or external analysis.
                            </p>
                            <ul>
                                <li><strong>CSV Format:</strong> Perfect for Excel, Google Sheets, or other spreadsheet software</li>
                                <li><strong>Excel Format:</strong> Native .xlsx files with formatting and headers</li>
                                <li><strong>PDF Format:</strong> Printable reports with charts and summaries</li>
                            </ul>
                            <p>
                                <strong>Steps to Export:</strong>
                            </p>
                            <ul>
                                <li>Go to the Expenses page</li>
                                <li>Click the "Export" button</li>
                                <li>Select your desired date range</li>
                                <li>Choose the export format (CSV, Excel, or PDF)</li>
                                <li>Click "Download" and save the file</li>
                            </ul>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.7s' }}>
                        <div className="step-number">7</div>
                        <div className="step-content">
                            <h3>Filtering and Searching</h3>
                            <p>
                                Find specific expenses quickly using powerful filters.
                            </p>
                            <ul>
                                <li><strong>Date Range:</strong> Filter by specific time periods</li>
                                <li><strong>Category:</strong> Show expenses from specific categories only</li>
                                <li><strong>Amount Range:</strong> Find expenses within a certain price range</li>
                                <li><strong>Search:</strong> Type keywords to search expense descriptions</li>
                                <li><strong>Sort:</strong> Order by date, amount, or category</li>
                            </ul>
                            <p>
                                Combine multiple filters for precise results (e.g., "Food expenses over $50 in December").
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.8s' }}>
                        <div className="step-number">8</div>
                        <div className="step-content">
                            <h3>Profile & Settings</h3>
                            <p>
                                Customize your account and preferences in the Profile page.
                            </p>
                            <ul>
                                <li><strong>Personal Info:</strong> Update your name and email address</li>
                                <li><strong>Change Password:</strong> Update your password for security</li>
                                <li><strong>Currency:</strong> Change your preferred display currency</li>
                                <li><strong>Theme:</strong> Switch between light mode, dark mode, or system preference</li>
                            </ul>
                            <p>
                                <strong>Security Tip:</strong> Use a strong, unique password and change it periodically.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '0.9s' }}>
                        <div className="step-number">9</div>
                        <div className="step-content">
                            <h3>Dark Mode</h3>
                            <p>
                                Expense Tracker includes a beautiful dark theme that's easy on the eyes.
                            </p>
                            <ul>
                                <li>Click the theme toggle icon in the navigation bar</li>
                                <li>Choose Light, Dark, or System</li>
                                <li>System mode automatically matches your device settings</li>
                                <li>Your preference is saved and persists across sessions</li>
                            </ul>
                            <p>
                                Dark mode is perfect for nighttime use and can help reduce eye strain.
                            </p>
                        </div>
                    </div>

                    <div className="doc-step" style={{ animationDelay: '1s' }}>
                        <div className="step-number">10</div>
                        <div className="step-content">
                            <h3>Tips & Best Practices</h3>
                            <p>
                                Get the most out of Expense Tracker with these pro tips:
                            </p>
                            <ul>
                                <li><strong>Regular Updates:</strong> Log expenses daily or weekly for accurate tracking</li>
                                <li><strong>Detailed Descriptions:</strong> Add context to help you remember each expense</li>
                                <li><strong>Review Analytics:</strong> Check your spending patterns monthly</li>
                                <li><strong>Set Categories Wisely:</strong> Create categories that match your lifestyle</li>
                                <li><strong>Export Regularly:</strong> Backup your data monthly</li>
                                <li><strong>Use Date Filters:</strong> Compare different time periods to track progress</li>
                            </ul>
                            <p>
                                Remember: The key to financial awareness is consistency. Make expense tracking a habit!
                            </p>
                        </div>
                    </div>

                    {/* Need More Help */}
                    <div className="content-section" style={{ textAlign: 'center', marginTop: '60px' }}>
                        <h2 className="section-title" style={{ justifyContent: 'center' }}>
                            <span className="section-icon">💬</span>
                            Need More Help?
                        </h2>
                        <div className="section-content">
                            <p style={{ marginBottom: '24px' }}>
                                Check out our FAQ or contact our support team for personalized assistance.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link to="/faq" className="btn-primary btn-large">
                                    Browse FAQ
                                </Link>
                                <Link to="/support" className="btn-secondary btn-large">
                                    Contact Support
                                </Link>
                            </div>
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

export default Documentation
