// client/src/components/ActivityHeatmap.jsx
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { formatCurrency } from '../utils/helpers'

const LIGHT = ['#F1F5F9', '#E0E7FF', '#A5B4FC', '#818CF8', '#6366F1']
const DARK = ['rgba(255,255,255,0.04)', 'rgba(129,140,248,0.25)', 'rgba(129,140,248,0.45)', 'rgba(129,140,248,0.7)', '#818CF8']

const CELL = 12
const GAP = 3
const LABEL_COL_WIDTH = 28 // width reserved for the fixed weekday-label column

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
    return <p className="text-sm text-gray-500 dark:text-slate-500 py-6 text-center">Couldn't load activity.</p>
  }

  const hasAny = grid.some((week) => week.some((c) => c.count > 0))
  const numCols = grid.length
  const colStride = CELL + GAP

  return (
    <div className="relative">
      <div className="flex">
        {/* Fixed weekday labels */}
        <div
          className="flex flex-col justify-between shrink-0"
          style={{ width: LABEL_COL_WIDTH, height: 7 * colStride - GAP, marginTop: 14 + 4 }}
        >
          {weekdayLabels.map((l, i) => (
            <span key={i} className="text-[10px] leading-none text-gray-400 dark:text-slate-500" style={{ height: CELL }}>
              {l}
            </span>
          ))}
        </div>

        {/* Scrollable: month labels + grid together, so they scroll in sync */}
        <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
          {/* Month labels */}
          <div className="relative mb-1" style={{ width: numCols * colStride, height: 14 }}>
            {monthLabels.map(({ colIndex, label }) => (
              <span
                key={colIndex}
                className="absolute text-[10px] text-gray-400 dark:text-slate-500"
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
                    className="rounded-[2px] transition-transform hover:scale-110 disabled:cursor-default"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
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
      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 dark:text-slate-500" style={{ paddingLeft: LABEL_COL_WIDTH }}>
        <span>Less</span>
        {palette.map((c, i) => (
          <span key={i} className="rounded-[2px]" style={{ width: CELL, height: CELL, backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>

      {!hasAny && (
        <p className="text-xs text-gray-400 dark:text-slate-600 mt-2" style={{ paddingLeft: LABEL_COL_WIDTH }}>No activity in this window yet.</p>
      )}

      {/* Tooltip */}
      {hover && hover.cell.date && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-gray-900 text-white text-[11px] px-2 py-1 whitespace-nowrap"
          style={{ left: hover.x + 28, top: hover.y - 4 }}
        >
          <div className="font-medium">{format(parseISO(hover.cell.date), 'EEE, MMM d, yyyy')}</div>
          <div>{hover.cell.count} txn · {formatCurrency(hover.cell.expenseTotal, currency)}</div>
        </div>
      )}
    </div>
  )
}
