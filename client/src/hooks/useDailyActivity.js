// client/src/hooks/useDailyActivity.js
import { useEffect, useMemo, useState } from 'react'
import { startOfWeek, addDays, format, parseISO, differenceInCalendarDays } from 'date-fns'
import { analyticsService } from '../services/analyticsService'

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function computeThresholds(nonZero) {
  const sorted = [...nonZero].sort((a, b) => a - b)
  const distinct = [...new Set(sorted)]
  if (sorted.length === 0) return [0, 0, 0]
  if (distinct.length < 4) {
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const step = (max - min) / 4 || 1
    return [min + step, min + step * 2, min + step * 3]
  }
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]
  return [q(0.25), q(0.5), q(0.75)]
}

function bucketFor(total, [t1, t2, t3]) {
  if (total <= 0) return 0
  if (total <= t1) return 1
  if (total <= t2) return 2
  if (total <= t3) return 3
  return 4
}

export function useDailyActivity(weeks = 16) {
  const [raw, setRaw] = useState(null) // { from, to, days: [...] } | null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    analyticsService
      .getDailyActivity(weeks)
      .then((res) => {
        if (cancelled) return
        setRaw(res.data?.data || { from: null, to: null, days: [] })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [weeks])

  const derived = useMemo(() => {
    if (!raw || !raw.to) {
      return { grid: [], weekdayLabels: WEEKDAY_LABELS, monthLabels: [], maxTotal: 0, thresholds: [0, 0, 0] }
    }
    const byDate = new Map(raw.days.map((d) => [d.date, d]))
    const today = parseISO(raw.to)
    const from = parseISO(raw.from)

    // Grid starts on the Monday of `from`'s week.
    const gridStart = startOfWeek(from, { weekStartsOn: 1 })
    const totalDays = differenceInCalendarDays(today, gridStart) + 1
    const numCols = Math.ceil(totalDays / 7)

    const nonZero = raw.days.map((d) => d.expenseTotal).filter((v) => v > 0)
    const thresholds = computeThresholds(nonZero)
    const maxTotal = nonZero.length ? Math.max(...nonZero) : 0

    const grid = []
    const monthLabels = []
    let lastMonth = -1
    for (let col = 0; col < numCols; col++) {
      const week = []
      for (let row = 0; row < 7; row++) {
        const cellDate = addDays(gridStart, col * 7 + row)
        const ymd = format(cellDate, 'yyyy-MM-dd')
        const inWindow = cellDate >= from && cellDate <= today
        if (!inWindow) {
          week.push({ date: null, expenseTotal: 0, count: 0, bucket: 0, inWindow: false })
          continue
        }
        const hit = byDate.get(ymd)
        const expenseTotal = hit ? hit.expenseTotal : 0
        const count = hit ? hit.count : 0
        week.push({
          date: ymd,
          expenseTotal,
          count,
          bucket: bucketFor(expenseTotal, thresholds),
          inWindow: true,
        })
        if (row === 0) {
          const m = cellDate.getMonth()
          if (m !== lastMonth) {
            monthLabels.push({ colIndex: col, label: format(cellDate, 'MMM') })
            lastMonth = m
          }
        }
      }
      grid.push(week)
    }
    return { grid, weekdayLabels: WEEKDAY_LABELS, monthLabels, maxTotal, thresholds }
  }, [raw])

  return { ...derived, loading, error }
}
