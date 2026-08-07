import { useMemo, useRef, useState } from 'react'
import type { AnalyticsLogRow } from '../../data/analytics-logs'
import type { AppLocale } from '../../i18n/homeStrings'
import { analyticsT } from '../../i18n/analyticsStrings'
import {
  buildLatencyStackedSeries,
  buildMonthlyExecutionRuns,
  buildTimeBuckets,
  niceYAxis,
  resolveChartWindowForRange,
  ANALYTICS_AXIS_CHART_PAD,
  xAxisTickLabelClass,
  type ChartRangeKey,
  type LatencyStackedData,
  type TimeBucketPoint,
} from './buildAnalyticsSeries'
import { AnalyticsMonthlyAgentsChart } from './AnalyticsMonthlyAgentsChart'

function formatChartNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('en-US')
}

function formatAxisNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US')
  return String(n)
}

interface SeriesChartProps {
  title: string
  points: TimeBucketPoint[]
  values: number[]
  color: string
  emptyLabel: string
  formatValue?: (v: number) => string
  ariaLabel: string
  /** 固定 Y 轴上限（如错误率 0–100%） */
  yMax?: number
  /** 显示 X/Y 轴刻度与网格 */
  showAxes?: boolean
  /** 折线（默认）或柱状 */
  chartType?: 'line' | 'bar'
  xAxisLabel?: string
  yAxisLabel?: string
}

function pickXAxisIndexes(n: number): number[] {
  if (n === 0) return []
  if (n === 1) return [0]
  if (n <= 8) return Array.from({ length: n }, (_, i) => i)
  const mid = Math.floor((n - 1) / 2)
  return [0, mid, n - 1]
}

function AnalyticsSeriesChart({
  title,
  points,
  values,
  color,
  emptyLabel,
  formatValue = formatChartNumber,
  ariaLabel,
  yMax: yMaxFixed,
  showAxes = false,
  chartType = 'line',
  xAxisLabel,
  yAxisLabel,
}: SeriesChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const n = values.length
  const hasData = points.some((p) => p.runs > 0) || values.some((v) => v > 0)

  const rawMax = yMaxFixed ?? Math.max(1, ...values, 0)
  const { yMax: niceMax, yTicks } = useMemo(
    () => (yMaxFixed !== undefined ? { yMax: yMaxFixed, yTicks: [0, yMaxFixed / 4, yMaxFixed / 2, (yMaxFixed * 3) / 4, yMaxFixed] } : niceYAxis(rawMax)),
    [rawMax, yMaxFixed],
  )
  const max = showAxes ? niceMax : rawMax

  const W = 100
  const H = showAxes ? 56 : 52
  const padL = showAxes ? ANALYTICS_AXIS_CHART_PAD.left : 0
  const padR = showAxes ? ANALYTICS_AXIS_CHART_PAD.right : 0
  const padTop = showAxes ? ANALYTICS_AXIS_CHART_PAD.top : 4
  const padBottom = showAxes ? ANALYTICS_AXIS_CHART_PAD.bottom : 4
  const chartW = W - padL - padR
  const chartH = H - padTop - (showAxes ? padBottom : 4)
  const usableH = showAxes ? chartH : H - padTop - padBottom

  const xAt = (i: number) => (n > 1 ? padL + (i / (n - 1)) * chartW : padL + chartW / 2)
  const yAt = (v: number) => padTop + (1 - v / max) * usableH
  const baselineY = yAt(0)
  const slotW = n > 0 ? chartW / n : chartW
  const barInset = 0.22
  const barW = slotW * (1 - barInset)
  const barX = (i: number) => padL + i * slotW + (slotW - barW) / 2
  const barCenterX = (i: number) => padL + (i + 0.5) * slotW

  const stepX = n > 1 ? (showAxes ? chartW / (n - 1) : W / (n - 1)) : 0
  const pts = values.map((v, i) => {
    const x = showAxes ? xAt(i) : n > 1 ? i * stepX : W / 2
    const y = showAxes ? yAt(v) : padTop + (1 - v / max) * (H - padTop - padBottom)
    return { x, y, v }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const areaPath = showAxes
    ? n > 0
      ? `${linePath} L${pts[n - 1].x.toFixed(2)} ${yAt(0).toFixed(2)} L${pts[0].x.toFixed(2)} ${yAt(0).toFixed(2)} Z`
      : ''
    : n > 1
      ? `${linePath} L${pts[n - 1].x.toFixed(2)} ${H} L${pts[0].x.toFixed(2)} ${H} Z`
      : ''

  const axisIndexes = showAxes ? pickXAxisIndexes(n) : n === 0 ? [] : n === 1 ? [0] : n === 2 ? [0, 1] : [0, Math.floor((n - 1) / 2), n - 1]

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || n === 0) return
    const r = svg.getBoundingClientRect()
    const relX = ((e.clientX - r.left) / r.width) * W
    if (showAxes) {
      if (chartType === 'bar') {
        const relXInChart = relX - padL
        let bestIdx = Math.floor(relXInChart / slotW)
        bestIdx = Math.max(0, Math.min(n - 1, bestIdx))
        setHoverIdx(bestIdx)
        return
      }
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
      return
    }
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < n; i += 1) {
      const dx = Math.abs(pts[i].x - relX)
      if (dx < bestDist) {
        bestDist = dx
        bestIdx = i
      }
    }
    setHoverIdx(bestIdx)
  }

  const gradId = `chart-grad-${title}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()
  const activeIdx = hoverIdx
  const activePoint = activeIdx !== null ? points[activeIdx] : null
  const activeVal = activeIdx !== null ? values[activeIdx] : null

  const chartBody = !hasData ? (
    <div className="analytics-chart-card__empty">{emptyLabel}</div>
  ) : showAxes ? (
    <div className={`analytics-series-chart analytics-series-chart--axes${chartType === 'bar' ? ' analytics-series-chart--bar' : ''}`}>
      {yAxisLabel ? (
        <span className="analytics-series-chart__y-caption" aria-hidden="true">
          {yAxisLabel}
        </span>
      ) : null}
      <div className="analytics-series-chart__plot">
        <div className="analytics-series-chart__y-axis" aria-hidden="true">
          {[...yTicks].reverse().map((tick) => (
            <span key={tick} className="analytics-series-chart__y-label">
              {yMaxFixed !== undefined && formatValue ? formatValue(tick) : formatAxisNumber(tick)}
            </span>
          ))}
        </div>
        <div className="analytics-series-chart__plot-main">
          <svg
            ref={svgRef}
            className="analytics-series-chart__svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIdx(null)}
            role="img"
            aria-label={ariaLabel}
          >
            {chartType === 'line' ? (
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
            ) : null}
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={padL}
                x2={W - padR}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="#e4e4e7"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {chartType === 'bar' ? (
              values.map((v, i) => {
                const topY = yAt(v)
                const h = Math.max(0, baselineY - topY)
                if (h <= 0) return null
                return (
                  <rect
                    key={i}
                    x={barX(i)}
                    y={topY}
                    width={barW}
                    height={h}
                    fill={color}
                    fillOpacity={activeIdx === i ? 0.95 : 0.72}
                    rx={0.6}
                    vectorEffect="non-scaling-stroke"
                  />
                )
              })
            ) : (
              <>
                {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
                <path
                  d={linePath}
                  stroke={color}
                  strokeWidth="1.6"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
                {activeIdx !== null && pts[activeIdx] ? (
                  <line
                    x1={pts[activeIdx].x}
                    x2={pts[activeIdx].x}
                    y1={padTop}
                    y2={H - padBottom}
                    stroke={color}
                    strokeOpacity="0.35"
                    strokeWidth="0.6"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </>
            )}
          </svg>
          {activeIdx !== null && pts[activeIdx] ? (
            <span
              className="analytics-series-chart__active-dot"
              aria-hidden="true"
              style={{
                left: `${(pts[activeIdx].x / W) * 100}%`,
                top: `${(pts[activeIdx].y / H) * 100}%`,
                borderColor: color,
              }}
            />
          ) : null}
          <div className="analytics-series-chart__x-axis" aria-hidden="true">
            {axisIndexes.map((i) => (
              <span
                key={i}
                className={xAxisTickLabelClass(i, n, 'analytics-series-chart__x-label')}
                style={{
                  left: `${((chartType === 'bar' ? barCenterX(i) : xAt(i)) / W) * 100}%`,
                }}
              >
                {points[i]?.shortLabel ?? ''}
              </span>
            ))}
          </div>
          {xAxisLabel ? (
            <span className="analytics-series-chart__x-caption" aria-hidden="true">
              {xAxisLabel}
            </span>
          ) : null}
          {activePoint && activeVal !== null ? (
            <div className="analytics-series-chart__tooltip" role="status">
              <span className="analytics-series-chart__tooltip-time">{activePoint.tooltipLabel}</span>
              <span className="analytics-series-chart__tooltip-val" style={{ color }}>
                {formatValue(activeVal)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  ) : (
    <div className="analytics-series-chart">
      <svg
        ref={svgRef}
        className="analytics-series-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        <path
          d={linePath}
          stroke={color}
          strokeWidth="1.6"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {activeIdx !== null && pts[activeIdx] ? (
          <line
            x1={pts[activeIdx].x}
            x2={pts[activeIdx].x}
            y1={0}
            y2={H}
            stroke={color}
            strokeOpacity="0.35"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
      {activeIdx !== null && pts[activeIdx] ? (
        <span
          className="analytics-series-chart__active-dot"
          aria-hidden="true"
          style={{
            left: `${(pts[activeIdx].x / W) * 100}%`,
            top: `${(pts[activeIdx].y / H) * 100}%`,
            borderColor: color,
          }}
        />
      ) : null}
      <div className="analytics-series-chart__axis" aria-hidden="true">
        {axisIndexes.map((i) => (
          <span key={i} className="analytics-series-chart__axis-label">
            {points[i]?.shortLabel ?? ''}
          </span>
        ))}
      </div>
      {activePoint && activeVal !== null ? (
        <div className="analytics-series-chart__tooltip" role="status">
          <span className="analytics-series-chart__tooltip-time">{activePoint.tooltipLabel}</span>
          <span className="analytics-series-chart__tooltip-val" style={{ color }}>
            {formatValue(activeVal)}
          </span>
        </div>
      ) : null}
    </div>
  )

  return (
    <article className={showAxes ? 'analytics-chart-card analytics-chart-card--axes' : 'analytics-chart-card'}>
      <div className="analytics-chart-card__head">
        <h3 className="analytics-chart-card__title">{title}</h3>
      </div>
      <div className={showAxes ? 'analytics-chart-card__body analytics-chart-card__body--axes' : 'analytics-chart-card__body'}>
        {chartBody}
      </div>
    </article>
  )
}

function formatHistAxisNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US')
  return String(Math.round(n))
}

interface LatencyStackChartProps {
  title: string
  data: LatencyStackedData
  emptyLabel: string
  ariaLabel: string
  yAxisLabel?: string
}

function AnalyticsLatencyStackChart({
  title,
  data,
  emptyLabel,
  ariaLabel,
  yAxisLabel,
}: LatencyStackChartProps) {
  const { points, segmentLabels, segmentColors } = data
  const n = points.length
  const maxTotal = Math.max(1, ...points.map((p) => p.total))
  const { yMax, yTicks } = niceYAxis(maxTotal)
  const hasData = points.some((p) => p.total > 0)

  return (
    <article className="analytics-chart-card analytics-chart-card--axes analytics-chart-card--latency-stack">
      <div className="analytics-chart-card__head">
        <h3 className="analytics-chart-card__title">{title}</h3>
      </div>
      <div className="analytics-chart-card__body analytics-chart-card__body--axes analytics-chart-card__body--hist">
        {!hasData ? (
          <div className="analytics-chart-card__empty">{emptyLabel}</div>
        ) : (
          <div className="analytics-hist-chart analytics-hist-chart--axes analytics-hist-chart--stacked">
            <div className="analytics-hist-chart__header">
              {yAxisLabel ? (
                <span className="analytics-series-chart__y-caption analytics-hist-chart__y-caption" aria-hidden="true">
                  {yAxisLabel}
                </span>
              ) : null}
              <div className="analytics-hist-chart__legend" aria-hidden="true">
                {segmentLabels.map((label, i) => (
                  <span key={label} className="analytics-hist-chart__legend-item">
                    <span
                      className="analytics-hist-chart__legend-swatch"
                      style={{ background: segmentColors[i] ?? segmentColors[0] }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="analytics-hist-chart__plot">
              <div className="analytics-hist-chart__y-axis" aria-hidden="true">
                {[...yTicks].reverse().map((tick) => (
                  <span key={tick} className="analytics-hist-chart__y-label">
                    {formatHistAxisNumber(tick)}
                  </span>
                ))}
              </div>
              <div className="analytics-hist-chart__bars" role="img" aria-label={ariaLabel}>
                {points.map((point, pi) => (
                  <div key={point.tooltipLabel} className="analytics-hist-chart__col">
                    <div className="analytics-hist-chart__bar-wrap">
                      <div className="analytics-hist-chart__stack">
                        {point.segments.map((count, si) =>
                          count > 0 ? (
                            <div
                              key={`${point.tooltipLabel}-${si}`}
                              className="analytics-hist-chart__stack-seg"
                              style={{
                                height: `${(count / yMax) * 100}%`,
                                background: segmentColors[si] ?? segmentColors[0],
                              }}
                              title={`${point.tooltipLabel} · ${segmentLabels[si]}: ${count}`}
                            />
                          ) : null,
                        )}
                      </div>
                    </div>
                    <span
                      className={xAxisTickLabelClass(
                        pi,
                        n,
                        'analytics-hist-chart__label analytics-hist-chart__label--tick',
                      )}
                    >
                      {point.shortLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export interface AnalyticsChartsSectionProps {
  /** 图表数据：随场景/Agent 与时间范围筛选变化 */
  monthlyRows: AnalyticsLogRow[]
  locale: AppLocale
  /** 选定具体 Agent 时切换为 Agent 维度图表 */
  isAgentScoped?: boolean
  /** Agent 图表数据（受顶部时间筛选） */
  agentChartRows?: AnalyticsLogRow[]
  dateWindow?: { start: number; end: number } | null
  rangeKey?: ChartRangeKey | null
}

export function AnalyticsChartsSection({
  monthlyRows,
  locale,
  isAgentScoped = false,
  agentChartRows = [],
  dateWindow = null,
  rangeKey = null,
}: AnalyticsChartsSectionProps) {
  const latencyLabels = useMemo(
    () =>
      locale === 'zh'
        ? (['<0.5s', '0.5–1s', '1–2s', '2–5s', '>5s'] as const)
        : (['<0.5s', '0.5–1s', '1–2s', '2–5s', '>5s'] as const),
    [locale],
  )

  const chartWindow = useMemo(
    () => resolveChartWindowForRange(monthlyRows, dateWindow, rangeKey),
    [monthlyRows, dateWindow, rangeKey],
  )

  const timeBuckets = useMemo(
    () => buildTimeBuckets(monthlyRows, chartWindow.start, chartWindow.end, locale, chartWindow.bucketOptions),
    [monthlyRows, chartWindow, locale],
  )

  const latencyStackData = useMemo(
    () =>
      buildLatencyStackedSeries(monthlyRows, latencyLabels, locale, chartWindow, chartWindow.bucketOptions),
    [monthlyRows, latencyLabels, locale, chartWindow],
  )

  const inputTokenValues = useMemo(() => timeBuckets.map((p) => p.inputTokens), [timeBuckets])
  const outputTokenValues = useMemo(() => timeBuckets.map((p) => p.outputTokens), [timeBuckets])
  const errorRateValues = useMemo(
    () =>
      timeBuckets.map((p) => (p.runs > 0 ? Math.round((p.errors / p.runs) * 1000) / 10 : 0)),
    [timeBuckets],
  )

  const executionTrend = useMemo(
    () => buildMonthlyExecutionRuns(monthlyRows, locale, chartWindow, chartWindow.bucketOptions),
    [monthlyRows, locale, chartWindow],
  )

  const agentTimeBuckets = useMemo(() => {
    if (!isAgentScoped) return []
    const window = resolveChartWindowForRange(agentChartRows, dateWindow, rangeKey)
    return buildTimeBuckets(agentChartRows, window.start, window.end, locale, window.bucketOptions)
  }, [isAgentScoped, agentChartRows, dateWindow, rangeKey, locale])

  const agentUsageValues = useMemo(
    () => agentTimeBuckets.map((p) => Math.min(100, p.runs * 25)),
    [agentTimeBuckets],
  )
  const agentToolCallValues = useMemo(() => agentTimeBuckets.map((p) => p.toolCalls), [agentTimeBuckets])
  const agentTokenValues = useMemo(
    () => agentTimeBuckets.map((p) => p.inputTokens + p.outputTokens),
    [agentTimeBuckets],
  )

  const emptyLabel = analyticsT(locale, 'chartEmpty')

  if (isAgentScoped) {
    return (
      <section className="analytics-charts" aria-label={analyticsT(locale, 'chartsAgentSectionAria')}>
        <div className="analytics-charts-grid analytics-charts-grid--agent">
          <AnalyticsSeriesChart
            title={analyticsT(locale, 'chartAgentUsageTitle')}
            points={agentTimeBuckets}
            values={agentUsageValues}
            color="#2563eb"
            emptyLabel={emptyLabel}
            ariaLabel={analyticsT(locale, 'chartAgentUsageAria')}
            showAxes
            chartType="bar"
            yMax={100}
            formatValue={(v) => String(Math.round(v))}
            yAxisLabel={analyticsT(locale, 'chartAxisTasks')}
          />
          <AnalyticsSeriesChart
            title={analyticsT(locale, 'chartAgentToolCallsTitle')}
            points={agentTimeBuckets}
            values={agentToolCallValues}
            color="#7c3aed"
            emptyLabel={emptyLabel}
            ariaLabel={analyticsT(locale, 'chartAgentToolCallsAria')}
            showAxes
            yAxisLabel={analyticsT(locale, 'chartAxisToolCalls')}
          />
          <AnalyticsSeriesChart
            title={analyticsT(locale, 'chartAgentTokensTitle')}
            points={agentTimeBuckets}
            values={agentTokenValues}
            color="#b45309"
            emptyLabel={emptyLabel}
            ariaLabel={analyticsT(locale, 'chartAgentTokensAria')}
            showAxes
            yAxisLabel={analyticsT(locale, 'chartAxisTokens')}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="analytics-charts" aria-label={analyticsT(locale, 'chartsSectionAria')}>
      <div className="analytics-charts-grid">
        <AnalyticsSeriesChart
          title={analyticsT(locale, 'chartInputTokensTitle')}
          points={timeBuckets}
          values={inputTokenValues}
          color="#7c3aed"
          emptyLabel={emptyLabel}
          ariaLabel={analyticsT(locale, 'chartInputTokensAria')}
          showAxes
          yAxisLabel={analyticsT(locale, 'chartAxisInputTokens')}
        />
        <AnalyticsSeriesChart
          title={analyticsT(locale, 'chartOutputTokensTitle')}
          points={timeBuckets}
          values={outputTokenValues}
          color="#b45309"
          emptyLabel={emptyLabel}
          ariaLabel={analyticsT(locale, 'chartOutputTokensAria')}
          showAxes
          yAxisLabel={analyticsT(locale, 'chartAxisOutputTokens')}
        />
        <AnalyticsSeriesChart
          title={analyticsT(locale, 'chartErrorRateTitle')}
          points={timeBuckets}
          values={errorRateValues}
          color="#dc2626"
          emptyLabel={emptyLabel}
          formatValue={(v) => `${v}%`}
          yMax={100}
          ariaLabel={analyticsT(locale, 'chartErrorRateAria')}
          showAxes
          yAxisLabel={analyticsT(locale, 'chartAxisErrorRate')}
        />
        <AnalyticsMonthlyAgentsChart
          title={analyticsT(locale, 'chartRunsTrendTitle')}
          data={executionTrend}
          emptyLabel={emptyLabel}
          ariaLabel={analyticsT(locale, 'chartRunsTrendAria')}
          locale={locale}
          yAxisLabel={analyticsT(locale, 'chartAxisExecutions')}
        />
        <AnalyticsLatencyStackChart
          title={analyticsT(locale, 'chartLatencyDistTitle')}
          data={latencyStackData}
          emptyLabel={emptyLabel}
          ariaLabel={analyticsT(locale, 'chartLatencyDistAria')}
          yAxisLabel={analyticsT(locale, 'chartAxisCount')}
        />
      </div>
    </section>
  )
}
