import { useState, useEffect } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { formatDateForInput } from '../utils/helpers'
import { startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'
import { analyticsService } from '../services/analyticsService'
import { X, Copy, Check, ExternalLink } from 'lucide-react'

const Analytics = () => {
  const { user, currency } = useAuth()
  const {
    categories,
    loading: contextLoading,
    loadExpenses,
    loadStats,
    loadTrends,
    getCategoryStats
  } = useExpense()

  // Analytics-specific local state (not shared with context, avoids race conditions)
  const [analyticsExpenses, setAnalyticsExpenses] = useState([])

  // Filter state
  const [dateRange, setDateRange] = useState({
    startDate: formatDateForInput(startOfMonth(new Date())),
    endDate: formatDateForInput(endOfMonth(new Date()))
  })
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'expense', 'income'
  const [categoryStats, setCategoryStats] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  // Share state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareEnabled, setShareEnabled] = useState(false)
  const [copying, setCopying] = useState(false)

  // Load data when filters change
  useEffect(() => {
    if (!user) return

    // Create a stable reference for dateRange values
    const startDate = dateRange.startDate || ''
    const endDate = dateRange.endDate || ''
    const category = selectedCategory || ''
    const type = filterType || 'all'

    // Wait until the range is complete (or fully cleared) - a lone start date is mid-selection
    if (!startDate !== !endDate) return

    // A newer filter change cancels this run, so the latest selection always wins
    let cancelled = false

    const loadData = async () => {
      setLoadingStats(true)

      try {
        const [expenseResult] = await Promise.all([
          loadExpenses({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            category: category || undefined,
            type: type !== 'all' ? type : undefined
          }),
          loadStats({ startDate, endDate }),
          loadTrends(startDate ? new Date(startDate).getFullYear() : new Date().getFullYear())
        ])

        // Store in local state so context overwrites can't clobber analytics data
        if (cancelled) return
        if (expenseResult?.expenses) {
          setAnalyticsExpenses(expenseResult.expenses)
        }

        // Load category stats
        const stats = await getCategoryStats({ startDate, endDate })
        if (!cancelled) setCategoryStats(stats || [])
      } catch (error) {
        if (cancelled) return
        console.error('Error loading analytics data:', error)
        toast.error('Failed to load analytics data')
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [user, dateRange.startDate, dateRange.endDate, selectedCategory, filterType])

  // Check share status on mount
  useEffect(() => {
    const checkShareStatus = async () => {
      try {
        // We can try to get the token if it exists, but the API only has enable/disable.
        // If we want to check status, we might need a getStatus endpoint or just try to enable it?
        // Actually, let's just assume disabled initially. 
        // If the user clicks share, we generate a token.
        // If we want to persist the "Sharing Enabled" state in UI, we should probably fetch the user profile and check if analyticsShareToken exists.
        // But the token is hidden (select: false).
        // So we need an endpoint to check status.
        // For now, let's just handle the click.
      } catch (error) {
        console.error('Error checking share status:', error)
      }
    }
    checkShareStatus()
  }, [])

  const handleShare = async () => {
    try {
      if (shareEnabled) {
        setShowShareModal(true)
        return
      }

      const response = await analyticsService.enableSharing()
      if (response.data.success) {
        setShareLink(response.data.data.link)
        setShareEnabled(true)
        setShowShareModal(true)
        toast.success('Analytics sharing enabled')
      }
    } catch (error) {
      console.error('Error enabling sharing:', error)
      toast.error('Failed to enable sharing')
    }
  }

  const handleDisableSharing = async () => {
    try {
      await analyticsService.disableSharing()
      setShareEnabled(false)
      setShareLink('')
      setShowShareModal(false)
      toast.success('Analytics sharing disabled')
    } catch (error) {
      console.error('Error disabling sharing:', error)
      toast.error('Failed to disable sharing')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopying(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <>
      <AnalyticsDashboard
        expenses={analyticsExpenses}
        categories={categories}
        loading={contextLoading || loadingStats}
        currency={currency}
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        filterType={filterType}
        setFilterType={setFilterType}
        onShare={handleShare}
        shareEnabled={shareEnabled}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-modal-panel rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Share analytics</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-[#a1a1a6] dark:hover:text-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-[#a1a1a6] mb-4">
                Anyone with this link can view your analytics dashboard. They won't be able to edit your data.
              </p>

              <div className="flex items-center gap-2 p-3 glass-card rounded-lg mb-4">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-600 dark:text-[#a1a1a6] w-full"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Copy link"
                >
                  {copying ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="flex gap-3">
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 justify-center text-sm"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
                <button
                  onClick={handleDisableSharing}
                  className="btn-danger flex-1 justify-center text-sm"
                >
                  Disable Sharing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Analytics
