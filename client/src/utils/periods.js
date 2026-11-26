// Date ranges for the dashboard periods, as local YYYY-MM-DD strings.
// "previous" covers the same elapsed span one period earlier, so comparisons are fair mid-month.
const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const lastDay = (y, m) => new Date(y, m + 1, 0).getDate()

export const PERIODS = [
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
]

export function periodRanges(period, today = new Date()) {
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  if (period === 'month') {
    const py = m === 0 ? y - 1 : y
    const pm = m === 0 ? 11 : m - 1
    return {
      current: { startDate: ymd(new Date(y, m, 1)), endDate: ymd(today) },
      previous: { startDate: ymd(new Date(py, pm, 1)), endDate: ymd(new Date(py, pm, Math.min(d, lastDay(py, pm)))) },
    }
  }
  if (period === 'year') {
    return {
      current: { startDate: `${y}-01-01`, endDate: ymd(today) },
      previous: { startDate: `${y - 1}-01-01`, endDate: ymd(new Date(y - 1, m, Math.min(d, lastDay(y - 1, m)))) },
    }
  }
  // all: everything up to today (future-dated recurring rows are not "spent" yet)
  return { current: { startDate: '1970-01-01', endDate: ymd(today) }, previous: null }
}

// Title for the page header
export function periodTitle(period, today = new Date()) {
  if (period === 'month') return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  if (period === 'year') return String(today.getFullYear())
  return 'All time'
}

// Phrase used after a comparison amount, e.g. "$3,140 less than this point last month"
export const comparisonLabel = { month: 'this point last month', year: 'this point last year' }
