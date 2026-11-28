// client/src/components/ActivityHeatmap.jsx
import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { usePrivacy } from '../context/PrivacyContext'
import { formatCurrency } from '../utils/helpers'

// Bucket 0 (no activity) is neutral; buckets 1-4 are a brass ramp, light to dense
const LIGHT = ['#f4f4f5', '#ebd0a8', '#ddb072', '#c07a2e', '#8a4d16']
const DARK = ['rgba(237,237,237,0.05)', 'rgba(212,149,74,0.32)', 'rgba(212,149,74,0.52)', 'rgba(212,149,74,0.76)', '#d4954a']
const EMPTY_LIGHT = 'rgba(23,23,23,0.04)'
const EMPTY_DARK = 'rgba(237,237,237,0.04)'

// Cells are fluid: they stretch to fill the card, but never shrink below MIN_CELL (then the grid scrolls).
const MIN_CELL = 11
const GAP = 3
const LABEL_COL_WIDTH = 26 // width reserved for the fixed weekday-label column

export default function ActivityHeatmap({
  grid = [],
  weekdayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''],
  monthLabels = [],
  loading = false,
  error = false,
  currency = 'USD',
  onCellClick,
}) {
  const { theme } = useTheme()
  const { isPrivate } = usePrivacy()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  const palette = isDark ? DARK : LIGHT
  const [hover, setHover] = useState(null) // { x, y, flipLeft, cell }
  const outerRef = useRef(null)
  const scrollRef = useRef(null)

  // Newest weeks are on the right; start scrolled there when the grid overflows.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [grid.length, loading])

  if (loading) {
    return <div className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
  }
  if (error) {
    return <p className="text-sm text-gray-500 dark:text-[#85858b] py-6 text-center">Couldn't load activity.</p>
  }

  const hasAny = grid.some((week) => week.some((c) => c.count > 0))
  const numCols = grid.length
  const monthLabelHeight = 16
  const emptyColor = isDark ? EMPTY_DARK : EMPTY_LIGHT

  const template = `${LABEL_COL_WIDTH}px repeat(${numCols}, minmax(${MIN_CELL}px, 1fr))`

  return (
    <div ref={outerRef} className="relative">
      <div ref={scrollRef} className="overflow-x-auto pb-1 bulk-expenses-scroll">
        <div className="relative" style={{ minWidth: LABEL_COL_WIDTH + numCols * (MIN_CELL + GAP) }}>
          {/* Month labels: same column template as the grid so they line up at any width */}
          <div className="grid mb-1" style={{ gridTemplateColumns: template, columnGap: GAP, height: monthLabelHeight }}>
            {monthLabels.map(({ colIndex, label }) => (
              <span
                key={colIndex}
                className="text-[11px] text-gray-500 dark:text-[#a1a1a6] whitespace-nowrap"
                style={{ gridColumnStart: colIndex + 2, gridRow: 1 }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* One grid: column 1 = weekday labels, then one column per week. Row height comes from the square cells. */}
          <div
            className="grid"
            style={{ gridTemplateColumns: template, gridTemplateRows: 'repeat(7, auto)', gridAutoFlow: 'column', gap: GAP }}
          >
            {weekdayLabels.map((l, i) => (
              <span key={`l${i}`} className="text-[11px] leading-none text-gray-400 dark:text-[#85858b] flex items-center">
                {l}
              </span>
            ))}
            {grid.flatMap((week, col) =>
              week.map((cell, row) => (
                <button
                  key={`${col}-${row}`}
                  type="button"
                  disabled={!cell.inWindow}
                  onClick={() => cell.date && cell.count > 0 && onCellClick?.(cell.date)}
                  onMouseEnter={(e) => {
                    if (!cell.inWindow || !outerRef.current) return
                    const cellRect = e.currentTarget.getBoundingClientRect()
                    const outerRect = outerRef.current.getBoundingClientRect()
                    const relX = cellRect.left - outerRect.left + cellRect.width / 2
                    const relY = cellRect.top - outerRect.top
                    setHover({
                      x: relX,
                      y: relY,
                      flipLeft: relX > outerRect.width * 0.65,
                      cell,
                    })
                  }}
                  onMouseLeave={() => setHover(null)}
                  className="w-full aspect-square rounded-[3px] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass disabled:cursor-default disabled:hover:opacity-100"
                  style={{
                    backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
                    boxShadow: cell.inWindow && cell.bucket === 0 ? `inset 0 0 0 1px ${emptyColor}` : undefined,
                    cursor: cell.count > 0 ? 'pointer' : 'default',
                  }}
                  aria-label={cell.date ? `${format(parseISO(cell.date), 'MMM d, yyyy')}: ${cell.count} ${cell.count === 1 ? 'entry' : 'entries'}, ${isPrivate ? '••••' : formatCurrency(cell.expenseTotal, currency, { whole: true })}` : undefined}
                />
              ))
            )}
          </div>

        </div>
      </div>

      {/* Tooltip rendered outside overflow-x-auto so hovering right-edge cells never triggers horizontal scroll */}
      {hover && hover.cell.date && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg bg-gray-900 dark:bg-[#232325] border border-black/10 dark:border-white/[0.1] shadow-lg text-white text-[11px] px-2.5 py-1.5 whitespace-nowrap"
          style={{
            left: hover.x,
            top: Math.max(0, hover.y - 46),
            transform: hover.flipLeft ? 'translateX(calc(-100% + 6px))' : 'translateX(-6px)',
          }}
        >
          <div className="font-medium text-white">{format(parseISO(hover.cell.date), 'EEE, MMM d, yyyy')}</div>
          <div className="font-mono tabular-nums text-white/75">{hover.cell.count} {hover.cell.count === 1 ? 'entry' : 'entries'} · {isPrivate ? '••••' : formatCurrency(hover.cell.expenseTotal, currency)}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-400 dark:text-[#85858b]" style={{ paddingLeft: LABEL_COL_WIDTH }}>
        <span>Less</span>
        {palette.map((c, i) => (
          <span key={i} className="rounded-[3px]" style={{ width: MIN_CELL + 2, height: MIN_CELL + 2, backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>

      {!hasAny && (
        <p className="text-xs text-gray-400 dark:text-[#85858b] mt-2" style={{ paddingLeft: LABEL_COL_WIDTH }}>No activity in this window yet.</p>
      )}
    </div>
  )
}
