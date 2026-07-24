import { useId, useMemo, useRef, useState } from 'react'
import type { AppLocale } from '../../i18n/homeStrings'
import { analyticsT } from '../../i18n/analyticsStrings'
import { EXECUTION_TREND_CHART_COLOR, ANALYTICS_AXIS_CHART_PAD, xAxisTickLabelClass, type MonthlyExecutionTrendData } from './buildAnalyticsSeries'

function formatAxisNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US')
  return String(n)
}

function formatMonthTooltip(isoYm: string, locale: AppLocale): string {
  const m = /^(\d{4})-(\d{2})$/.exec(isoYm)
  if (!m) return isoYm
  if (locale === 'zh') return `${m[1]}年${Number(m[2])}月`
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function buildAreaPath(
  values: number[],
  xAt: (i: number) => number,
  yAt: (v: number) => number,
  baselineY: number,
): string {
  const n = values.length
  if (n === 0) return ''
  const topLine = values.map((v, i) => `${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`)
  const lastX = xAt(n - 1).toFixed(2)
  const firstX = xAt(0).toFixed(2)
  return `M ${topLine.join(' L ')} L ${lastX} ${baselineY.toFixed(2)} L ${firstX} ${baselineY.toFixed(2)} Z`
}

export interface AnalyticsMonthlyAgentsChartProps {
  title: string
  data: MonthlyExecutionTrendData
  emptyLabel: string
  ariaLabel: string
  locale: AppLocale
  xAxisLabel?: string
  yAxisLabel?: string
}

export function AnalyticsMonthlyAgentsChart({
  title,
  data,
  emptyLabel,
  ariaLabel,
  locale,
  xAxisLabel,
  yAxisLabel,
}: AnalyticsMonthlyAgentsChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gradId = useId().replace(/:/g, '')

  const { monthLabels, monthTooltips, values, yMax, yTicks } = data
  const n = monthLabels.length
  const hasData = values.some((v) => v > 0)

  const W = 100
  const H = 56
  const padL = ANALYTICS_AXIS_CHART_PAD.left
  const padR = ANALYTICS_AXIS_CHART_PAD.right
  const padT = ANALYTICS_AXIS_CHART_PAD.top
  const padB = ANALYTICS_AXIS_CHART_PAD.bottom
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const xAt = (i: number) => (n > 1 ? padL + (i / (n - 1)) * chartW : padL + chartW / 2)
  const yAt = (v: number) => padT + (1 - v / yMax) * chartH
  const baselineY = yAt(0)

  const { areaPath, linePath } = useMemo(() => {
    const path = values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`)
      .join(' ')
    return {
      areaPath: buildAreaPath(values, xAt, yAt, baselineY),
      linePath: path,
    }
  }, [values, n, yMax, baselineY])

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || n === 0) return
    const r = svg.getBoundingClientRect()
    const relX = ((e.clientX - r.left) / r.width) * W
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < n; i += 1) {
      const dx = Math.abs(xAt(i) - relX)
      if (dx < bestDist) {
        bestDist = dx
        bestIdx = i
      }
    }
    setHoverIdx(bestIdx)
  }

  const { stroke, crosshair } = EXECUTION_TREND_CHART_COLOR
  const activeIdx = hoverIdx
  const activeVal = activeIdx !== null ? values[activeIdx] : null

  return (
    <article className="analytics-chart-card analytics-chart-card--span-2 analytics-chart-card--trend">
      <div className="analytics-chart-card__head">
        <h3 className="analytics-chart-card__title">{title}</h3>
      </div>
      <div className="analytics-chart-card__body analytics-chart-card__body--stacked">
        {!hasData ? (
          <div className="analytics-chart-card__empty">{emptyLabel}</div>
        ) : (
          <div className="analytics-stacked-chart analytics-stacked-chart--labeled analytics-stacked-chart--trend">
            {yAxisLabel ? (
              <span className="analytics-series-chart__y-caption analytics-stacked-chart__y-caption" aria-hidden="true">
                {yAxisLabel}
              </span>
            ) : null}
            <div className="analytics-stacked-chart__inner">
              <div className="analytics-stacked-chart__y-axis" aria-hidden="true">
                {[...yTicks].reverse().map((tick) => (
                  <span key={tick} className="analytics-stacked-chart__y-label">
                    {formatAxisNumber(tick)}
                  </span>
                ))}
              </div>
              <div className="analytics-stacked-chart__plot">
                <svg
                  ref={svgRef}
                  className="analytics-stacked-chart__svg"
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  onMouseMove={handleMove}
                  onMouseLeave={() => setHoverIdx(null)}
                  role="img"
                  aria-label={ariaLabel}
                >
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                      <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {yTicks.map((tick) => (
                    <line
                      key={`h-${tick}`}
                      x1={padL}
                      x2={W - padR}
                      y1={yAt(tick)}
                      y2={yAt(tick)}
                      className="analytics-stacked-chart__grid-line"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {monthLabels.map((_, i) => (
                    <line
                      key={`v-${i}`}
                      x1={xAt(i)}
                      x2={xAt(i)}
                      y1={padT}
                      y2={H - padB}
                      className="analytics-stacked-chart__grid-line"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {areaPath ? <path d={areaPath} fill={`url(#${gradId})`} /> : null}
                  <path
                    d={linePath}
                    stroke={stroke}
                    strokeWidth="1.8"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                  {activeIdx !== null && activeVal !== null ? (
                    <line
                      x1={xAt(activeIdx)}
                      x2={xAt(activeIdx)}
                      y1={padT}
                      y2={H - padB}
                      stroke={crosshair}
                      strokeWidth="0.7"
                      strokeDasharray="2.5 2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}
                </svg>
                {activeIdx !== null && activeVal !== null ? (
                  <span
                    className="analytics-stacked-chart__active-dot"
                    aria-hidden="true"
                    style={{
                      left: `${(xAt(activeIdx) / W) * 100}%`,
                      top: `${(yAt(activeVal) / H) * 100}%`,
                      background: stroke,
                    }}
                  />
                ) : null}
                <div className="analytics-stacked-chart__x-axis" aria-hidden="true">
                  {monthLabels.map((label, i) => (
                    <span
                      key={`${label}-${i}`}
                      className={xAxisTickLabelClass(i, n, 'analytics-stacked-chart__x-label')}
                      style={{ left: `${(xAt(i) / W) * 100}%` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                {activeIdx !== null && activeVal !== null ? (
                  <div
                    className="analytics-stacked-chart__tooltip analytics-stacked-chart__tooltip--trend"
                    role="status"
                    style={{
                      left: `${(xAt(activeIdx) / W) * 100}%`,
                      top: `${(yAt(activeVal) / H) * 100}%`,
                    }}
                  >
                    <span className="analytics-stacked-chart__tooltip-time">
                      {formatMonthTooltip(monthTooltips[activeIdx] ?? '', locale)}
                    </span>
                    <div className="analytics-stacked-chart__tooltip-row">
                      <span className="analytics-stacked-chart__tooltip-dot" style={{ background: stroke }} />
                      <span className="analytics-stacked-chart__tooltip-name">
                        {analyticsT(locale, 'chartRunsTrendSeriesLabel')}
                      </span>
                      <span className="analytics-stacked-chart__tooltip-val">{formatAxisNumber(activeVal)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {xAxisLabel ? (
              <span className="analytics-series-chart__x-caption analytics-stacked-chart__x-caption" aria-hidden="true">
                {xAxisLabel}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </article>
  )
}
