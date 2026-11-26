import { useEffect, useState } from 'react'
import { expenseService } from '../services/expenseService'
import { periodRanges } from '../utils/periods'

const pick = (res) => {
  const { totalStats, categorySummary } = res.data.data
  return { ...totalStats, categories: categorySummary }
}

// Stats for the selected period and (when it has one) the matching earlier span
export function usePeriodStats(period) {
  const [state, setState] = useState({ current: null, previous: null, loading: true })

  useEffect(() => {
    let cancelled = false
    const { current, previous } = periodRanges(period)
    setState((s) => ({ ...s, loading: true }))
    Promise.all([
      expenseService.getStats(current),
      previous ? expenseService.getStats(previous) : null,
    ])
      .then(([cur, prev]) => {
        if (!cancelled) setState({ current: pick(cur), previous: prev ? pick(prev) : null, loading: false })
      })
      .catch((error) => {
        console.error('Failed to load period stats:', error)
        if (!cancelled) setState({ current: null, previous: null, loading: false })
      })
    return () => { cancelled = true }
  }, [period])

  return state
}
