import { useState, useEffect, useRef } from 'react'
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
    expenses,
    categories,
    stats,
    trends,
    loading,
    loadExpenses,
    loadStats,
    loadTrends,
    getCategoryStats
  } = useExpense()

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

  // Ref to prevent concurrent API calls
  const isLoadingRef = useRef(false)
  const lastFiltersRef = useRef({ startDate: '', endDate: '', category: '', type: '' })

  // Load data when filters change
  useEffect(() => {
    if (!user) return

    // Create a stable reference for dateRange values
    const startDate = dateRange.startDate || ''
    const endDate = dateRange.endDate || ''
    const category = selectedCategory || ''
    const type = filterType || 'all'

    // Check if filters actually changed
    const currentFilters = { startDate, endDate, category, type }
    const filtersChanged =
      lastFiltersRef.current.startDate !== startDate ||
      lastFiltersRef.current.endDate !== endDate ||
      lastFiltersRef.current.category !== category ||
      lastFiltersRef.current.type !== type

    // Prevent concurrent calls and unnecessary calls
    if (isLoadingRef.current || !filtersChanged) {
      return
    }

    const loadData = async () => {
      isLoadingRef.current = true
      lastFiltersRef.current = currentFilters
      setLoadingStats(true)

      try {
        await Promise.all([
          loadExpenses({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            category: category || undefined,
            type: type !== 'all' ? type : undefined
          }),
          loadStats({ startDate, endDate }),
          loadTrends(startDate ? new Date(startDate).getFullYear() : new Date().getFullYear())
        ])

        // Load category stats
        const stats = await getCategoryStats({ startDate, endDate })
        setCategoryStats(stats || [])
      } catch (error) {
        console.error('Error loading analytics data:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setLoadingStats(false)
        isLoadingRef.current = false
      }
    }

    loadData()
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
        expenses={expenses}
        categories={categories}
        loading={loading || loadingStats}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Analytics</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Anyone with this link can view your analytics dashboard. They won't be able to edit your data.
              </p>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-600 dark:text-gray-300 w-full"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
                <button
                  onClick={handleDisableSharing}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium border border-red-200 dark:border-red-800"
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
