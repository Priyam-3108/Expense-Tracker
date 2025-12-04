import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ExpenseProvider } from './context/ExpenseContext'
import { ThemeProvider } from './context/ThemeContext'
import { DebtProvider } from './context/DebtContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Categories from './pages/Categories'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Debts from './pages/Debts'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import FAQ from './pages/FAQ'
import Support from './pages/Support'
import Documentation from './pages/Documentation'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Landing Page - Root Route */}
      <Route path="/" element={<Landing />} />

      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/app/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app/dashboard" replace /> : <Register />} />

      {/* Static Pages - Public Routes */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/support" element={<Support />} />
      <Route path="/docs" element={<Documentation />} />

      {/* Protected Routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="categories" element={<Categories />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="debts" element={<Debts />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <ExpenseProvider>
          <DebtProvider>
            <AppRoutes />
          </DebtProvider>
        </ExpenseProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
