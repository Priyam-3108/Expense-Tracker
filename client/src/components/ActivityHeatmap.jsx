// client/src/components/ActivityHeatmap.jsx
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { usePrivacy } from '../context/PrivacyContext'
import { formatCurrency } from '../utils/helpers'

// Single-hue ink ramp: empty → filled, like ink on a ledger calendar
const LIGHT = ['#f4f4f5', '#d4d4d4', '#a3a3a3', '#525252', '#171717']
const DARK = ['rgba(237,237,237,0.05)', 'rgba(237,237,237,0.18)', 'rgba(237,237,237,0.36)', 'rgba(237,237,237,0.62)', '#ededed']
const EMPTY_LIGHT = 'rgba(23,23,23,0.04)'
const EMPTY_DARK = 'rgba(237,237,237,0.04)'

const CELL = 13
const GAP = 3
const LABEL_COL_WIDTH = 26 // width reserved for the fixed weekday-label column
const ROW_HEIGHT = CELL + GAP

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

  if (loading) {
    return <div className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
  }
  if (error) {
    return <p className="text-sm text-gray-500 dark:text-[#85858b] py-6 text-center">Couldn't load activity.</p>
  }

  const hasAny = grid.some((week) => week.some((c) => c.count > 0))
  const numCols = grid.length
  const colStride = CELL + GAP
  const monthLabelHeight = 16
  const emptyColor = isDark ? EMPTY_DARK : EMPTY_LIGHT

  return (
    <div className="relative">
      <div className="flex">
        {/* Fixed weekday labels, one per row, vertically centered against its cell */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: LABEL_COL_WIDTH, marginTop: monthLabelHeight + 4 }}
        >
          {weekdayLabels.map((l, i) => (
            <span
              key={i}
              className="text-[11px] leading-none text-gray-400 dark:text-[#85858b] flex items-center"
              style={{ height: ROW_HEIGHT }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Scrollable: month labels + grid together, so they scroll in sync */}
        <div className="overflow-x-auto pb-1 [scrollbar-width:thin] flex-1 min-w-0">
          {/* Month labels */}
          <div className="relative mb-1" style={{ width: numCols * colStride, height: monthLabelHeight }}>
            {monthLabels.map(({ colIndex, label }) => (
              <span
                key={colIndex}
                className="absolute text-[11px] text-gray-500 dark:text-[#a1a1a6]"
                style={{ left: colIndex * colStride }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            {grid.map((week, col) => (
              <div key={col} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((cell, row) => (
                  <button
                    key={row}
                    type="button"
                    disabled={!cell.inWindow}
                    onClick={() => cell.date && cell.count > 0 && onCellClick?.(cell.date)}
                    onMouseEnter={(e) => cell.inWindow && setHover({
                      x: e.currentTarget.offsetLeft,
                      y: e.currentTarget.offsetTop,
                      cell,
                    })}
                    onMouseLeave={() => setHover(null)}
                    className="rounded-[3px] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#533afd] disabled:cursor-default disabled:hover:opacity-100"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
                      boxShadow: cell.inWindow && cell.bucket === 0 ? `inset 0 0 0 1px ${emptyColor}` : undefined,
                      cursor: cell.count > 0 ? 'pointer' : 'default',
                    }}
                    aria-label={cell.date ? `${cell.date}: ${cell.count} transactions` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-400 dark:text-[#85858b]" style={{ paddingLeft: LABEL_COL_WIDTH }}>
        <span>Less</span>
        {palette.map((c, i) => (
          <span key={i} className="rounded-[3px]" style={{ width: CELL, height: CELL, backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>

      {!hasAny && (
        <p className="text-xs text-gray-400 dark:text-[#85858b] mt-2" style={{ paddingLeft: LABEL_COL_WIDTH }}>No activity in this window yet.</p>
      )}

      {/* Tooltip */}
      {hover && hover.cell.date && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-gray-900 dark:bg-[#232325] dark:border dark:border-white/[0.08] text-white text-[11px] px-2 py-1 whitespace-nowrap"
          style={{ left: hover.x + 28, top: hover.y - 4 }}
        >
          <div className="font-medium">{format(parseISO(hover.cell.date), 'EEE, MMM d, yyyy')}</div>
          <div className="font-mono tabular-nums">{hover.cell.count} txn · {isPrivate ? '••••' : formatCurrency(hover.cell.expenseTotal, currency)}</div>
        </div>
      )}
    </div>
  )
}
