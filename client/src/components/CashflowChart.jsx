import { useState, useMemo, useRef } from 'react'
import Amount from './Amount'

function getNiceMax(rawMax) {
  const safe = Math.max(1000, rawMax)
  const exp = Math.pow(10, Math.floor(Math.log10(safe)))
  const norm = safe / exp
  let niceNorm = 10
  if (norm <= 1.2) niceNorm = 1.2
  else if (norm <= 1.6) niceNorm = 1.6
  else if (norm <= 2) niceNorm = 2
  else if (norm <= 3) niceNorm = 3
  else if (norm <= 4) niceNorm = 4
  else if (norm <= 5) niceNorm = 5
  else if (norm <= 6) niceNorm = 6
  else if (norm <= 8) niceNorm = 8
  return niceNorm * exp
}

function formatAxisTick(val) {
  if (val === 0) return '0'
  const abs = Math.abs(val)
  const sign = val < 0 ? '−' : ''
  if (abs >= 1000) {
    const k = abs / 1000
    return `${sign}${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `${sign}${Math.round(abs)}`
}

function buildSmoothPath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const t = 0.25
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

/**
 * Monthly Cashflow Chart with two clear, switchable views:
 * - "compare": Income outer track + nested Expense bar (instant budget-vs-spend read)
 * - "net": Smooth monthly Net (Income - Expenses) trajectory around 0
 */
const CashflowChart = ({
  data = [],
  currency = 'USD',
  isDark = true,
  isPrivate = false,
  currentMonthIndex = -1,
  mode = 'compare',
}) => {
  const [hoverIdx, setHoverIdx] = useState(null)
  const svgRef = useRef(null)

  const width = 760
  const height = 296
  const padLeft = 48
  const padRight = 16
  const padTop = 18
  const padBottom = 32
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom
  const bottomY = padTop + plotH

  const {
    maxCompare,
    netRange,
    slotCenters,
    slotWidth,
    items,
    netPath,
    netZeroY,
  } = useMemo(() => {
    const count = Math.max(data.length, 1)
    const sw = plotW / count
    const centers = data.map((_, i) => padLeft + i * sw + sw / 2)

    const parsed = data.map((d, i) => {
      const hasData = d.Income !== null || d.Expense !== null
      const inc = d.Income ?? 0
      const exp = d.Expense ?? 0
      return {
        name: d.name,
        income: inc,
        expense: exp,
        net: inc - exp,
        hasData,
        cx: centers[i],
      }
    })

    const rawMax = Math.max(1000, ...parsed.map((d) => Math.max(d.income, d.expense)))
    const niceMax = getNiceMax(rawMax)

    // Net range (symmetric or asymmetric cleanly scaled around 0)
    const maxPosNet = Math.max(1000, ...parsed.map((d) => (d.hasData ? Math.max(0, d.net) : 0)))
    const maxNegNet = Math.max(0, ...parsed.map((d) => (d.hasData ? Math.max(0, -d.net) : 0)))
    const niceNetTop = getNiceMax(maxPosNet)
    const niceNetBot = maxNegNet > 0 ? getNiceMax(maxNegNet) : 0
    const totalNetSpan = niceNetTop + niceNetBot || 1000
    const zeroY = padTop + (niceNetTop / totalNetSpan) * plotH

    const netPts = parsed
      .filter((d) => d.hasData)
      .map((d) => ({
        x: d.cx,
        y: zeroY - (d.net / totalNetSpan) * plotH,
        ...d,
      }))

    const enriched = parsed.map((d) => ({
      ...d,
      netY: zeroY - (d.net / totalNetSpan) * plotH,
    }))

    return {
      maxCompare: niceMax,
      netRange: { top: niceNetTop, bot: niceNetBot, total: totalNetSpan },
      slotCenters: centers,
      slotWidth: sw,
      items: enriched,
      netPath: buildSmoothPath(netPts),
      netZeroY: zeroY,
    }
  }, [data, plotW, plotH, padLeft, padTop])

  const handlePointerMove = (e) => {
    if (!svgRef.current || !slotCenters.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * width
    let nearest = 0
    let bestDist = Infinity
    for (let i = 0; i < slotCenters.length; i++) {
      const dist = Math.abs(slotCenters[i] - relX)
      if (dist < bestDist) {
        bestDist = dist
        nearest = i
      }
    }
    setHoverIdx(nearest)
  }

  const activeItem = hoverIdx !== null ? items[hoverIdx] : null

  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(23,23,23,0.06)'
  const zeroStroke = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(23,23,23,0.14)'
  const labelColor = isDark ? '#71717A' : '#737373'
  const activeLabelColor = isDark ? '#EDEDED' : '#171717'
  const incomeTrackFill = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,23,23,0.06)'
  const incomeCapColor = isDark ? '#4CC38A' : '#16A34A'
  const expenseFill = isDark ? '#D4954A' : '#B4691E'
  const overspendFill = isDark ? '#E5484D' : '#DC2626'
  const netLineColor = isDark ? '#D4954A' : '#B4691E'

  const compareTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => ({
    val: maxCompare * r,
    y: bottomY - r * plotH,
    isZero: r === 0,
  }))

  const netTicks = [
    { val: netRange.top, y: padTop },
    { val: netRange.top * 0.5, y: padTop + ((netRange.top * 0.5) / netRange.total) * plotH },
    { val: 0, y: netZeroY, isZero: true },
    ...(netRange.bot > 0 ? [{ val: -netRange.bot, y: bottomY }] : []),
  ]

  const ticks = mode === 'compare' ? compareTicks : netTicks
  const barW = Math.min(26, Math.max(12, slotWidth * 0.44))

  return (
    <div className="relative w-full select-none" onMouseLeave={() => setHoverIdx(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[240px] sm:h-[276px] xl:h-[300px] overflow-visible"
        onMouseMove={handlePointerMove}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="net-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={netLineColor} stopOpacity={isDark ? '0.20' : '0.14'} />
            <stop offset="100%" stopColor={netLineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines + Y labels */}
        {ticks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={t.y}
              y2={t.y}
              stroke={t.isZero ? zeroStroke : gridStroke}
              strokeWidth={1}
            />
            {!isPrivate && (
              <text
                x={padLeft - 10}
                y={t.y + 4}
                textAnchor="end"
                fontSize={11}
                fontFamily="IBM Plex Mono, monospace"
                fill={t.isZero ? activeLabelColor : labelColor}
                opacity={t.isZero ? 0.8 : 0.85}
              >
                {formatAxisTick(t.val)}
              </text>
            )}
          </g>
        ))}

        {/* Hover column backdrop */}
        {hoverIdx !== null && items[hoverIdx] && (
          <rect
            x={items[hoverIdx].cx - slotWidth * 0.42}
            y={padTop}
            width={slotWidth * 0.84}
            height={plotH}
            rx={8}
            fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(23,23,23,0.03)'}
          />
        )}

        {mode === 'compare' ? (
          /* Bullet-style Cashflow Bars: Income outer track + Expense inner bar */
          items.map((d, i) => {
            if (!d.hasData) return null
            const incH = Math.max(0, (d.income / maxCompare) * plotH)
            const expH = Math.max(0, (d.expense / maxCompare) * plotH)
            const incY = bottomY - incH
            const expY = bottomY - expH
            const isOverspend = d.expense > d.income
            const isCurrent = i === currentMonthIndex
            const isHovered = i === hoverIdx
            const dimOpacity = hoverIdx !== null && !isHovered ? 0.45 : 1

            return (
              <g key={d.name + i} style={{ opacity: dimOpacity, transition: 'opacity 140ms ease' }}>
                {/* Income outer track */}
                {incH > 0 && (
                  <>
                    <rect
                      x={d.cx - barW / 2}
                      y={incY}
                      width={barW}
                      height={incH}
                      rx={5}
                      fill={incomeTrackFill}
                      stroke={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(23,23,23,0.10)'}
                      strokeWidth={1}
                    />
                    {/* Crisp green income cap */}
                    <line
                      x1={d.cx - barW / 2 + 2}
                      x2={d.cx + barW / 2 - 2}
                      y1={incY + 1}
                      y2={incY + 1}
                      stroke={incomeCapColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Expense nested bar */}
                {expH > 0 && (
                  <rect
                    x={d.cx - (barW * 0.62) / 2}
                    y={expY}
                    width={barW * 0.62}
                    height={expH}
                    rx={3.5}
                    fill={isOverspend ? overspendFill : expenseFill}
                    fillOpacity={isCurrent || isHovered ? 0.95 : 0.78}
                  />
                )}
              </g>
            )
          })
        ) : (
          /* Net Trend Mode */
          <g>
            {netPath && items.some((d) => d.hasData) && (() => {
              const valid = items.filter((d) => d.hasData)
              const firstX = valid[0].cx
              const lastX = valid[valid.length - 1].cx
              return (
                <path
                  d={`${netPath} L ${lastX.toFixed(1)} ${netZeroY.toFixed(1)} L ${firstX.toFixed(1)} ${netZeroY.toFixed(1)} Z`}
                  fill="url(#net-area-grad)"
                />
              )
            })()}
            {netPath && (
              <path
                d={netPath}
                fill="none"
                stroke={netLineColor}
                strokeWidth={2.25}
                strokeLinecap="round"
              />
            )}
            {items.map((d, i) => {
              if (!d.hasData) return null
              const isActive = i === hoverIdx || i === currentMonthIndex
              return (
                <circle
                  key={d.name + i}
                  cx={d.cx}
                  cy={d.netY}
                  r={isActive ? 4.5 : 2.5}
                  fill={d.net >= 0 ? incomeCapColor : overspendFill}
                  stroke={isDark ? '#171719' : '#FFFFFF'}
                  strokeWidth={isActive ? 2 : 1}
                />
              )
            })}
          </g>
        )}

        {/* Month labels */}
        {items.map((d, i) => {
          const isCurrent = i === currentMonthIndex
          const isHovered = i === hoverIdx
          return (
            <text
              key={d.name + i}
              x={d.cx}
              y={height - 10}
              textAnchor="middle"
              fontSize={11}
              fontFamily="IBM Plex Mono, monospace"
              fill={isHovered || isCurrent ? activeLabelColor : labelColor}
              fontWeight={isHovered || isCurrent ? 500 : 400}
            >
              {d.name}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && activeItem && activeItem.hasData && (
        <div
          className="glass-dropdown pointer-events-none absolute top-2 z-20 px-3 py-2.5 text-xs min-w-[176px]"
          style={{
            left: `${Math.min(Math.max((activeItem.cx / width) * 100, 15), 80)}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-medium text-gray-900 dark:text-[#ededed] mb-1.5">{activeItem.name}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-2 text-gray-500 dark:text-[#a1a1a6]">
                <span className="w-2 h-2 rounded-full bg-[#4CC38A]" />
                Income
              </span>
              <Amount whole value={activeItem.income} currency={currency} className="tabular-nums text-gray-900 dark:text-[#ededed]" />
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-2 text-gray-500 dark:text-[#a1a1a6]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeItem.expense > activeItem.income ? overspendFill : expenseFill }} />
                Expenses
              </span>
              <Amount whole value={activeItem.expense} currency={currency} className="tabular-nums text-gray-900 dark:text-[#ededed]" />
            </div>
            <div className="pt-1 mt-1 border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-between gap-5">
              <span className="text-gray-500 dark:text-[#a1a1a6]">Net</span>
              <Amount
                whole
                value={activeItem.net}
                currency={currency}
                sign={activeItem.net > 0 ? '+' : ''}
                className={`tabular-nums font-medium ${activeItem.net >= 0 ? 'text-green-600 dark:text-[#4cc38a]' : 'text-red-600 dark:text-[#e5484d]'}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashflowChart
