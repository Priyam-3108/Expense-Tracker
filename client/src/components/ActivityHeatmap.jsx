// client/src/components/ActivityHeatmap.jsx
import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { usePrivacy } from '../context/PrivacyContext'
import { formatCurrency } from '../utils/helpers'

// Single-hue ink ramp: empty → filled, like ink on a ledger calendar
const LIGHT = ['#f4f4f5', '#d4d4d4', '#a3a3a3', '#525252', '#171717']
const DARK = ['rgba(237,237,237,0.05)', 'rgba(237,237,237,0.18)', 'rgba(237,237,237,0.36)', 'rgba(237,237,237,0.62)', '#ededed']
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
  const [hover, setHover] = useState(null) // { x, y, cell }
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
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto pb-1 [scrollbar-width:thin]">
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
                  onMouseEnter={(e) => cell.inWindow && setHover({
                    x: e.currentTarget.offsetLeft,
                    y: e.currentTarget.offsetTop,
                    cell,
                  })}
                  onMouseLeave={() => setHover(null)}
                  className="w-full aspect-square rounded-[3px] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#533afd] disabled:cursor-default disabled:hover:opacity-100"
                  style={{
                    backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
                    boxShadow: cell.inWindow && cell.bucket === 0 ? `inset 0 0 0 1px ${emptyColor}` : undefined,
                    cursor: cell.count > 0 ? 'pointer' : 'default',
                  }}
                  aria-label={cell.date ? `${cell.date}: ${cell.count} transactions` : undefined}
                />
              ))
            )}
          </div>

          {/* Tooltip (inside the scroll content so offsets stay correct when scrolled) */}
          {hover && hover.cell.date && (
            <div
              className="pointer-events-none absolute z-10 rounded-md bg-gray-900 dark:bg-[#232325] dark:border dark:border-white/[0.08] text-white text-[11px] px-2 py-1 whitespace-nowrap"
              style={{ left: hover.x + 20, top: hover.y - 40 }}
            >
              <div className="font-medium">{format(parseISO(hover.cell.date), 'EEE, MMM d, yyyy')}</div>
              <div className="font-mono tabular-nums">{hover.cell.count} txn · {isPrivate ? '••••' : formatCurrency(hover.cell.expenseTotal, currency)}</div>
            </div>
          )}
        </div>
      </div>

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
