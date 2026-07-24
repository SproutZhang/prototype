import type { AnalyticsLogRow } from '../../data/analytics-logs'
import type { AppLocale } from '../../i18n/homeStrings'
import { analyticsBucketShortLabel, type AnalyticsPresetKey } from '../../i18n/analyticsStrings'

export type BucketGranularity = 'hour' | 'day' | 'month'

export type ChartRangeKey = AnalyticsPresetKey | 'custom'

export interface TimeBucketOptions {
  granularity?: BucketGranularity
  weekdayLabels?: boolean
}

export interface ChartWindowConfig {
  start: number
  end: number
  bucketOptions?: TimeBucketOptions
}

export interface TimeBucketPoint {
  shortLabel: string
  tooltipLabel: string
  runs: number
  errors: number
  inputTokens: number
  outputTokens: number
  /** runType 为 tool 的调用次数 */
  toolCalls: number
}

export interface LatencyBucket {
  label: string
  count: number
}

function weekdayShortLabel(d: Date, locale: AppLocale): string {
  const zh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const
  const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
  const labels = locale === 'zh' ? zh : en
  return labels[d.getDay()]
}

function bucketShortLabel(
  d: Date,
  gran: BucketGranularity,
  locale: AppLocale,
  options?: TimeBucketOptions,
): string {
  if (options?.weekdayLabels && gran === 'day') return weekdayShortLabel(d, locale)
  return analyticsBucketShortLabel(d, gran, locale)
}

function startOfLocalDayMs(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function endOfWeekSundayMs(mondayMs: number): number {
  const d = new Date(startOfLocalDayMs(mondayMs))
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function pickGranularity(startMs: number, endMs: number): BucketGranularity {
  const days = (endMs - startMs) / (1000 * 60 * 60 * 24)
  if (days <= 1.1) return 'hour'
  if (days <= 60) return 'day'
  return 'month'
}

function bucketStartOf(d: Date, gran: BucketGranularity): Date {
  if (gran === 'hour') return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours())
  if (gran === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function advanceBucket(d: Date, gran: BucketGranularity): Date {
  const n = new Date(d)
  if (gran === 'hour') n.setHours(n.getHours() + 1)
  else if (gran === 'day') n.setDate(n.getDate() + 1)
  else n.setMonth(n.getMonth() + 1)
  return n
}

function bucketKey(d: Date, gran: BucketGranularity): string {
  if (gran === 'hour') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
  if (gran === 'day') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  return `${d.getFullYear()}-${d.getMonth()}`
}

function bucketTooltipLabel(d: Date, gran: BucketGranularity): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (gran === 'hour') return `${y}-${m}-${day} ${String(d.getHours()).padStart(2, '0')}:00`
  if (gran === 'day') return `${y}-${m}-${day}`
  return `${y}-${m}`
}

export function buildTimeBuckets(
  rows: AnalyticsLogRow[],
  startMs: number,
  endMs: number,
  locale: AppLocale,
  options?: TimeBucketOptions,
): TimeBucketPoint[] {
  const { points, indexByKey, gran } = buildTimeBucketSkeleton(startMs, endMs, locale, options)

  for (const r of rows) {
    const k = bucketKey(bucketStartOf(new Date(r.createdAt), gran), gran)
    const idx = indexByKey.get(k)
    if (idx === undefined) continue
    const p = points[idx]
    p.runs += 1
    if (r.status === 'error') p.errors += 1
    if (r.runType === 'tool') p.toolCalls += 1
    p.inputTokens += r.inputTokens
    p.outputTokens += r.outputTokens
  }

  return points
}

function buildTimeBucketSkeleton(
  startMs: number,
  endMs: number,
  locale: AppLocale,
  options?: TimeBucketOptions,
): { points: TimeBucketPoint[]; indexByKey: Map<string, number>; gran: BucketGranularity } {
  const gran = options?.granularity ?? pickGranularity(startMs, endMs)
  const startBucket = bucketStartOf(new Date(startMs), gran)
  const endBucket = bucketStartOf(new Date(endMs), gran)
  const points: TimeBucketPoint[] = []
  const indexByKey = new Map<string, number>()
  let cursor = new Date(startBucket)
  let safety = 400
  while (cursor.getTime() <= endBucket.getTime() && safety-- > 0) {
    const k = bucketKey(cursor, gran)
    indexByKey.set(k, points.length)
    points.push({
      shortLabel: bucketShortLabel(cursor, gran, locale, options),
      tooltipLabel: bucketTooltipLabel(cursor, gran),
      runs: 0,
      errors: 0,
      inputTokens: 0,
      outputTokens: 0,
      toolCalls: 0,
    })
    cursor = advanceBucket(cursor, gran)
  }

  return { points, indexByKey, gran }
}

const LATENCY_EDGES_MS = [500, 1000, 2000, 5000]

export const LATENCY_SEGMENT_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'] as const

function latencyBucketIndex(ms: number, bucketCount: number): number {
  for (let i = 0; i < LATENCY_EDGES_MS.length; i += 1) {
    if (ms < LATENCY_EDGES_MS[i]) return i
  }
  return bucketCount - 1
}

export interface LatencyStackPoint {
  shortLabel: string
  tooltipLabel: string
  segments: number[]
  total: number
}

export interface LatencyStackedData {
  segmentLabels: readonly string[]
  segmentColors: readonly string[]
  points: LatencyStackPoint[]
}

export function buildLatencyStackedSeries(
  rows: AnalyticsLogRow[],
  labels: readonly string[],
  locale: AppLocale,
  window?: { start: number; end: number } | null,
  bucketOptions?: TimeBucketOptions,
): LatencyStackedData {
  if (window) {
    return buildLatencyStackedForRange(rows, labels, locale, window.start, window.end, bucketOptions)
  }

  const fallback = resolveSixMonthChartWindow()
  return buildLatencyStackedForRange(rows, labels, locale, fallback.start, fallback.end, bucketOptions)
}

function buildLatencyStackedForRange(
  rows: AnalyticsLogRow[],
  labels: readonly string[],
  locale: AppLocale,
  startMs: number,
  endMs: number,
  bucketOptions?: TimeBucketOptions,
): LatencyStackedData {
  const { points: skeleton, indexByKey, gran } = buildTimeBucketSkeleton(startMs, endMs, locale, bucketOptions)
  const points: LatencyStackPoint[] = skeleton.map((p) => ({
    shortLabel: p.shortLabel,
    tooltipLabel: p.tooltipLabel,
    segments: labels.map(() => 0),
    total: 0,
  }))

  for (const r of rows) {
    const k = bucketKey(bucketStartOf(new Date(r.createdAt), gran), gran)
    const idx = indexByKey.get(k)
    if (idx === undefined) continue
    const segIdx = latencyBucketIndex(r.latencyMs, labels.length)
    points[idx].segments[segIdx] += 1
    points[idx].total += 1
  }

  return {
    segmentLabels: labels,
    segmentColors: LATENCY_SEGMENT_COLORS,
    points,
  }
}

export function buildLatencyHistogram(
  rows: AnalyticsLogRow[],
  labels: readonly string[],
): LatencyBucket[] {
  const counts = labels.map(() => 0)
  for (const r of rows) {
    const ms = r.latencyMs
    let idx = labels.length - 1
    for (let i = 0; i < LATENCY_EDGES_MS.length; i += 1) {
      if (ms < LATENCY_EDGES_MS[i]) {
        idx = i
        break
      }
    }
    counts[idx] += 1
  }
  return labels.map((label, i) => ({ label, count: counts[i] }))
}

export interface MonthlyExecutionTrendData {
  monthLabels: string[]
  monthTooltips: string[]
  /** 每月 Agent 执行次数（运行条数） */
  values: number[]
  yMax: number
  yTicks: number[]
}

export const EXECUTION_TREND_CHART_COLOR = {
  fill: 'rgba(59, 130, 246, 0.18)',
  stroke: '#3b82f6',
  crosshair: 'rgba(59, 130, 246, 0.55)',
} as const

/** 带 Y 轴图表的内边距（viewBox 单位），left 尽量小以便 X 轴贴近 Y 轴 */
export const ANALYTICS_AXIS_CHART_PAD = {
  left: 4,
  right: 2,
  top: 4,
  bottom: 10,
} as const

export function xAxisTickLabelClass(i: number, n: number, baseClass: string): string {
  if (i === 0) return `${baseClass} ${baseClass}--start`
  if (i === n - 1) return `${baseClass} ${baseClass}--end`
  return baseClass
}

/** @deprecated 使用 EXECUTION_TREND_CHART_COLOR */
export const MONTHLY_AGENTS_CHART_COLOR = EXECUTION_TREND_CHART_COLOR

export function niceYAxis(maxVal: number): { yMax: number; yTicks: number[] } {
  if (maxVal <= 0) return { yMax: 6, yTicks: [0, 2, 4, 6] }
  const roughStep = maxVal / 4
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceNorm =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  const step = niceNorm * magnitude
  const yMax = step * 4
  return { yMax, yTicks: [0, step, step * 2, step * 3, step * 4] }
}

export function buildMonthlyExecutionRuns(
  rows: AnalyticsLogRow[],
  locale: AppLocale,
  window?: { start: number; end: number } | null,
  bucketOptions?: TimeBucketOptions,
): MonthlyExecutionTrendData {
  const chartWindow = window ?? resolveSixMonthChartWindow()
  const buckets = buildTimeBuckets(rows, chartWindow.start, chartWindow.end, locale, bucketOptions)
  const values = buckets.map((b) => b.runs)
  const { yMax, yTicks } = niceYAxis(Math.max(...values, 0))
  return {
    monthLabels: buckets.map((b) => b.shortLabel),
    monthTooltips: buckets.map((b) => b.tooltipLabel),
    values,
    yMax,
    yTicks,
  }
}

/** 最近 6 个自然月（与月度执行量图一致） */
export function resolveSixMonthChartWindow(endMs?: number): { start: number; end: number } {
  const end = new Date(endMs ?? Date.now())
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1)
  const rangeEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start: start.getTime(), end: rangeEnd.getTime() }
}

export function resolveChartWindow(
  rows: AnalyticsLogRow[],
  dateWindow: { start: number; end: number } | null,
): { start: number; end: number } {
  if (dateWindow) {
    const spanDays = (dateWindow.end - dateWindow.start) / (1000 * 60 * 60 * 24)
    if (spanDays > 60 && rows.length > 0) {
      const times = rows.map((r) => new Date(r.createdAt).getTime())
      const dataStart = Math.min(...times)
      const dataEnd = Math.max(...times)
      const start = Math.max(dateWindow.start, dataStart)
      const end = Math.min(dateWindow.end, dataEnd)
      if (end >= start) return { start, end }
    }
    return dateWindow
  }
  if (rows.length > 0) {
    const times = rows.map((r) => new Date(r.createdAt).getTime())
    return { start: Math.min(...times), end: Math.max(...times) }
  }
  const now = Date.now()
  return { start: now - 7 * 24 * 60 * 60 * 1000, end: now }
}

export function resolveChartWindowForRange(
  rows: AnalyticsLogRow[],
  dateWindow: { start: number; end: number } | null,
  rangeKey?: ChartRangeKey | null,
): ChartWindowConfig {
  const base = resolveChartWindow(rows, dateWindow)
  if (rangeKey === 'wtd' && dateWindow) {
    const monday = startOfLocalDayMs(dateWindow.start)
    return {
      start: monday,
      end: endOfWeekSundayMs(monday),
      bucketOptions: { granularity: 'day', weekdayLabels: true },
    }
  }
  return { start: base.start, end: base.end }
}
