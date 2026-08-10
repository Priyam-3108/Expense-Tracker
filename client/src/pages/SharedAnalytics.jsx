import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { analyticsService } from '../services/analyticsService'
import { formatDateForInput } from '../utils/helpers'
import { startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'

const SharedAnalytics = () => {
    const { token } = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Data state
    const [expenses, setExpenses] = useState([])
    const [categories, setCategories] = useState([])
    const [profile, setProfile] = useState(null)

    // Filter state
    const [dateRange, setDateRange] = useState({
        startDate: formatDateForInput(startOfMonth(new Date())),
        endDate: formatDateForInput(endOfMonth(new Date()))
    })
    const [selectedCategory, setSelectedCategory] = useState('')
    const [filterType, setFilterType] = useState('all')

    const isLoadingRef = useRef(false)
    const lastFiltersRef = useRef({ startDate: '', endDate: '', category: '', type: '' })

    // Initial load (Profile and Categories)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [profileRes, categoriesRes] = await Promise.all([
                    analyticsService.getSharedProfile(token),
                    analyticsService.getSharedCategories(token)
                ])

                if (profileRes.data.success) {
                    setProfile(profileRes.data.data)
                }
                if (categoriesRes.data.success) {
                    setCategories(categoriesRes.data.data.categories)
                }
            } catch (err) {
                console.error('Error loading shared data:', err)
                setError('Failed to load shared analytics. The link might be invalid or expired.')
            }
        }

        if (token) {
            loadInitialData()
        }
    }, [token])

    // Load expenses when filters change
    useEffect(() => {
        if (!token || error) return

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

        if (isLoadingRef.current || !filtersChanged) {
            return
        }

        const loadExpenses = async () => {
            isLoadingRef.current = true
            setLoading(true)
            lastFiltersRef.current = currentFilters

            try {
                const response = await analyticsService.getSharedExpenses(token, {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    category: category || undefined,
                    type: type !== 'all' ? type : undefined
                })

                if (response.data.success) {
                    setExpenses(response.data.data.expenses)
                }
            } catch (err) {
                console.error('Error loading expenses:', err)
                toast.error('Failed to update data')
            } finally {
                setLoading(false)
                isLoadingRef.current = false
            }
        }

        loadExpenses()
    }, [token, dateRange, selectedCategory, filterType, error])

    if (error) {
        return (
            <div className="static-page bg-slate-950 noise-overlay min-h-screen flex flex-col">
                <PublicNavbar />
                <div className="flex-1 flex flex-col items-center justify-center px-4 py-24">
                    <div className="glass-modal-panel p-8 text-center max-w-md">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
                        <p className="text-slate-300">{error}</p>
                    </div>
                </div>
                <PublicFooter />
            </div>
        )
    }

    return (
        <div className="static-page bg-slate-950 noise-overlay min-h-screen flex flex-col">
            {/* Animated Liquid Glass Orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="liquid-orb liquid-orb-indigo" style={{ top: '-200px', right: '-100px' }} />
                <div className="liquid-orb liquid-orb-emerald" style={{ top: '40%', left: '-150px' }} />
            </div>

            <PublicNavbar />

            <div className="flex-1 container mx-auto px-4 pt-28 pb-16 relative z-10">
                {profile && (
                    <div className="mb-6 flex items-center gap-4 p-4 glass-card">
                        <div className="h-12 w-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-400">
                            {profile.avatar || profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Shared by</p>
                            <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                        </div>
                    </div>
                )}

                <AnalyticsDashboard
                    expenses={expenses}
                    categories={categories}
                    loading={loading}
                    currency={profile?.currency || 'USD'}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    isSharedView={true}
                />
            </div>

            <PublicFooter />
        </div>
    )
}

export default SharedAnalytics
