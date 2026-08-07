import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ANALYTICS_AGENTS,
  ANALYTICS_LOG_ROWS,
  ANALYTICS_SCENARIOS,
  ANALYTICS_WORKFLOWS,
  resolveAnalyticsAgentScopeIds,
  type AnalyticsLogRow,
} from '../data/analytics-logs'
import { useLocale } from '../i18n/LocaleContext'
import { useRbac } from '../auth/useRbac'
import type { AppLocale } from '../i18n/homeStrings'
import {
  analyticsT,
  getAnalyticsAgentName,
  getAnalyticsAgentScopedMetricCards,
  getAnalyticsMetricCards,
  getAnalyticsPresetOptions,
  getAnalyticsScenarioName,
  getAnalyticsScopeSummary,
  getAnalyticsWorkflowName,
  type AgentScopedMetricId,
  type AnalyticsPresetKey,
  type DisplayMetricId,
  type MetricId,
} from '../i18n/analyticsStrings'
import { AnalyticsChartsSection } from './analytics/AnalyticsChartsSection'
import { AnalyticsEfficiencySection } from './analytics/AnalyticsEfficiencySection'

type AnalyticsRangeKey = AnalyticsPresetKey | 'custom'

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromYMD(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  return new Date(y, mo, d)
}

function addLocalDays(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta)
}

function getPresetDateRange(key: AnalyticsPresetKey): { start: Date; end: Date } {
  const end = startOfLocalDay(new Date())
  let start: Date
  switch (key) {
    case 'wtd': {
      const day = end.getDay()
      const daysFromMonday = day === 0 ? 6 : day - 1
      start = addLocalDays(end, -daysFromMonday)
      break
    }
    case 'mtd':
      start = new Date(end.getFullYear(), end.getMonth(), 1)
      break
    case 'qtd': {
      const q = Math.floor(end.getMonth() / 3) * 3
      start = new Date(end.getFullYear(), q, 1)
      break
    }
    case 'ytd':
      start = new Date(end.getFullYear(), 0, 1)
      break
    case 'all':
      start = new Date(2018, 0, 1)
      break
  }
  return { start, end }
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatToolbarUpdatedAt(ms: number, locale: AppLocale): string {
  if (!ms) return '–'
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  if (locale === 'zh') return `${y}-${m}-${day} ${h}:${min}`
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AnalyticsPageTagline({ locale }: { locale: AppLocale }) {
  return (
    <div className="agents-subtitle agents-subtitle--tagline" aria-label={analyticsT(locale, 'taglineAria')}>
      <span className="agents-subtitle-part">{analyticsT(locale, 'taglineRuns')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{analyticsT(locale, 'taglineLogs')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{analyticsT(locale, 'taglineTokens')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{analyticsT(locale, 'taglineInsights')}</span>
    </div>
  )
}

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function AnalyticsPage() {
  const { locale } = useLocale()
  const { can } = useRbac()
  const canExportAnalytics = can('analytics.export')
  const canEditAnalyticsLayout = can('analytics.edit_layout')
  const rangeOptions = useMemo(() => getAnalyticsPresetOptions(locale), [locale])

  const rangeMenuId = useId()
  const rangeMenuStartId = useId()
  const rangeMenuEndId = useId()
  const entitySelectId = useId()
  const entityAgentSelectId = useId()

  const [rangeKey, setRangeKey] = useState<AnalyticsRangeKey>('ytd')
  const [rangeStartYmd, setRangeStartYmd] = useState(() => toYMD(getPresetDateRange('ytd').start))
  const [rangeEndYmd, setRangeEndYmd] = useState(() => toYMD(getPresetDateRange('ytd').end))
  const [rangeOpen, setRangeOpen] = useState(false)
  const [scopeScenarioId, setScopeScenarioId] = useState<string>('all')
  const [scopeAgentId, setScopeAgentId] = useState<string>('all')
  const isAgentScoped = scopeAgentId !== 'all'
  const metricCards = useMemo(
    () => (isAgentScoped ? getAnalyticsAgentScopedMetricCards(locale) : getAnalyticsMetricCards(locale)),
    [locale, isAgentScoped],
  )

  const rangeTriggerRef = useRef<HTMLButtonElement>(null)
  const rangePopoverRef = useRef<HTMLDivElement>(null)
  const [rangePopoverBox, setRangePopoverBox] = useState({ top: 0, left: 0, width: 320 })

  const rangeDisplayLabel = useMemo(() => {
    if (rangeKey === 'custom') return `${rangeStartYmd} – ${rangeEndYmd}`
    return rangeOptions.find((o) => o.key === rangeKey)?.label ?? analyticsT(locale, 'defaultRangeFallback')
  }, [rangeKey, rangeStartYmd, rangeEndYmd, rangeOptions, locale])

  useEffect(() => {
    if (rangeKey === 'custom') return
    const { start, end } = getPresetDateRange(rangeKey)
    setRangeStartYmd(toYMD(start))
    setRangeEndYmd(toYMD(end))
  }, [rangeKey])

  const dateWindow = useMemo(() => {
    const s = fromYMD(rangeStartYmd)
    const e = fromYMD(rangeEndYmd)
    if (!s || !e) return null
    return { start: startOfLocalDay(s).getTime(), end: endOfLocalDay(e).getTime() }
  }, [rangeStartYmd, rangeEndYmd])

  const availableAgents = useMemo(() => {
    const rows =
      scopeScenarioId === 'all'
        ? ANALYTICS_LOG_ROWS
        : ANALYTICS_LOG_ROWS.filter((r) => r.scenarioId === scopeScenarioId)
    const ids = [...new Set(rows.map((r) => r.agentId))]
    return ANALYTICS_AGENTS.filter((a) => ids.includes(a.id))
  }, [scopeScenarioId])

  const availableScenarios = useMemo(() => {
    if (scopeAgentId === 'all') return ANALYTICS_SCENARIOS
    const scopeIds = resolveAnalyticsAgentScopeIds(scopeAgentId)
    const ids = new Set(
      ANALYTICS_LOG_ROWS.filter((r) => scopeIds.includes(r.agentId)).map((r) => r.scenarioId),
    )
    return ANALYTICS_SCENARIOS.filter((s) => ids.has(s.id))
  }, [scopeAgentId])

  useEffect(() => {
    if (scopeAgentId === 'all') return
    if (!availableAgents.some((a) => a.id === scopeAgentId)) {
      setScopeAgentId('all')
    }
  }, [scopeScenarioId, availableAgents, scopeAgentId])

  useEffect(() => {
    if (scopeScenarioId === 'all') return
    if (!availableScenarios.some((s) => s.id === scopeScenarioId)) {
      setScopeScenarioId('all')
    }
  }, [scopeAgentId, availableScenarios, scopeScenarioId])

  const entityScopedRows = useMemo(() => {
    let rows = ANALYTICS_LOG_ROWS
    if (scopeScenarioId !== 'all') {
      rows = rows.filter((r) => r.scenarioId === scopeScenarioId)
    }
    if (scopeAgentId !== 'all') {
      const scopeIds = resolveAnalyticsAgentScopeIds(scopeAgentId)
      rows = rows.filter((r) => scopeIds.includes(r.agentId))
    }
    return rows
  }, [scopeScenarioId, scopeAgentId])

  const filteredRows = useMemo<AnalyticsLogRow[]>(() => {
    return entityScopedRows.filter((row) => {
      const ts = new Date(row.createdAt).getTime()
      if (dateWindow && (ts < dateWindow.start || ts > dateWindow.end)) return false
      return true
    })
  }, [entityScopedRows, dateWindow])

  const metricValues = useMemo(() => {
    const runs = filteredRows.length
    const agents = new Set(filteredRows.map((r) => r.agentId)).size
    const errors = filteredRows.filter((r) => r.status === 'error').length
    const successes = filteredRows.filter((r) => r.status === 'success').length
    let tokens = 0
    let latencySum = 0
    for (const r of filteredRows) {
      tokens += r.inputTokens + r.outputTokens
      latencySum += r.latencyMs
    }
    const avgLatency = runs > 0 ? Math.round(latencySum / runs) : 0
    const successRate = runs > 0 ? Math.round((successes / runs) * 1000) / 10 : 0
    const errorRate = runs > 0 ? Math.round((errors / runs) * 1000) / 10 : 0
    return {
      runs,
      agents,
      errors,
      tokens,
      avgLatency,
      successRate,
      errorRate,
    }
  }, [filteredRows])

  const toolbarMeta = useMemo(() => {
    let lastUpdatedMs = 0
    for (const r of filteredRows) {
      const ts = new Date(r.createdAt).getTime()
      if (ts > lastUpdatedMs) lastUpdatedMs = ts
    }
    return {
      lastUpdatedLabel: formatToolbarUpdatedAt(lastUpdatedMs, locale),
      componentCount: metricValues.agents,
      executionCount: metricValues.runs,
    }
  }, [filteredRows, metricValues.agents, metricValues.runs, locale])

  const scopeScenarioSummary = useMemo(() => {
    if (scopeScenarioId === 'all') return analyticsT(locale, 'allScenarios')
    const raw = ANALYTICS_SCENARIOS.find((s) => s.id === scopeScenarioId)?.name
    return getAnalyticsScenarioName(locale, scopeScenarioId, raw ?? analyticsT(locale, 'allScenarios'))
  }, [scopeScenarioId, locale])

  const scopeAgentSummary = useMemo(() => {
    if (scopeAgentId === 'all') return analyticsT(locale, 'allAgents')
    const raw = ANALYTICS_AGENTS.find((a) => a.id === scopeAgentId)?.name
    return getAnalyticsAgentName(locale, scopeAgentId, raw ?? analyticsT(locale, 'allAgents'))
  }, [scopeAgentId, locale])

  const scopeEntitySummary = useMemo(
    () =>
      getAnalyticsScopeSummary(
        locale,
        scopeScenarioId,
        scopeAgentId,
        scopeScenarioSummary,
        scopeAgentSummary,
      ),
    [locale, scopeScenarioId, scopeAgentId, scopeScenarioSummary, scopeAgentSummary],
  )

  const metricSubtitles = useMemo<Record<MetricId, string>>(() => {
    const errorRatePct =
      metricValues.runs > 0 ? ((metricValues.errors / metricValues.runs) * 100).toFixed(1) : '0'

    return {
      runs: analyticsT(locale, 'metricRunsSubtitle', { summary: scopeEntitySummary }),
      agents: analyticsT(locale, 'metricAgentsSubtitle'),
      tokens: analyticsT(locale, 'metricTokensSubtitle', { range: rangeDisplayLabel }),
      errors: analyticsT(locale, 'metricErrorsSubtitle', { rate: errorRatePct }),
      avgLatency: analyticsT(locale, 'metricAvgLatencySubtitle', { count: metricValues.runs }),
    }
  }, [locale, metricValues, rangeDisplayLabel, scopeEntitySummary])

  const agentMetricSubtitles = useMemo<Record<AgentScopedMetricId, string>>(
    () => ({
      taskVolume: analyticsT(locale, 'metricTaskVolumeSubtitle', { range: rangeDisplayLabel }),
      activeAgents: analyticsT(locale, 'metricActiveAgentsSubtitle', { agent: scopeAgentSummary }),
      tokens: analyticsT(locale, 'metricTokensSubtitle', { range: rangeDisplayLabel }),
      successRate: analyticsT(locale, 'metricSuccessRateSubtitle', { count: metricValues.runs }),
      errorRate: analyticsT(locale, 'metricErrorRateSubtitle', {
        errors: metricValues.errors,
        count: metricValues.runs,
      }),
    }),
    [locale, metricValues, rangeDisplayLabel, scopeAgentSummary],
  )

  const downloadAnalyticsLogsCsv = useCallback(() => {
    const wfName = (id: string) => {
      const raw = ANALYTICS_WORKFLOWS.find((w) => w.id === id)?.name
      return getAnalyticsWorkflowName(locale, id, raw ?? id)
    }
    const scName = (id: string) => {
      const raw = ANALYTICS_SCENARIOS.find((s) => s.id === id)?.name
      return getAnalyticsScenarioName(locale, id, raw ?? id)
    }
    const agName = (id: string) => {
      const raw = ANALYTICS_AGENTS.find((a) => a.id === id)?.name
      return getAnalyticsAgentName(locale, id, raw ?? id)
    }
    const headers = [
      'runId',
      'conversationId',
      'scenario',
      'agent',
      'workflow',
      'createdAt',
      'status',
      'runType',
      'llm',
      'latencyMs',
      'inputTokens',
      'outputTokens',
      'user',
      'input',
      'output',
      'error',
    ]
    const lines = [headers.join(',')]
    for (const row of filteredRows) {
      const cells = [
        row.runId,
        row.conversationId,
        scName(row.scenarioId),
        agName(row.agentId),
        wfName(row.workflowId),
        row.createdAt,
        row.status,
        row.runType,
        row.llm,
        String(row.latencyMs),
        String(row.inputTokens),
        String(row.outputTokens),
        row.user,
        row.input,
        row.output,
        row.error,
      ].map((c) => csvEscapeCell(c))
      lines.push(cells.join(','))
    }
    const scopeTag = scopeEntitySummary.replace(/[/\\?%*:|"<>]/g, '-')
    const csv = `\ufeff${lines.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analyticsT(locale, 'csvFilenamePrefix')}_${scopeTag}_${rangeStartYmd}_${rangeEndYmd}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredRows, scopeEntitySummary, rangeStartYmd, rangeEndYmd, locale])

  const updateRangePopoverPosition = useCallback(() => {
    const btn = rangeTriggerRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const w = 320
    const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8)
    setRangePopoverBox({ top: r.bottom + 6, left, width: w })
  }, [])

  useLayoutEffect(() => {
    if (!rangeOpen) return
    updateRangePopoverPosition()
    const onWin = () => updateRangePopoverPosition()
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [rangeOpen, updateRangePopoverPosition])

  useEffect(() => {
    if (!rangeOpen) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rangeTriggerRef.current?.contains(t) || rangePopoverRef.current?.contains(t)) return
      setRangeOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRangeOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [rangeOpen])

  const renderMetricValue = (id: DisplayMetricId): string => {
    switch (id) {
      case 'taskVolume':
        return String(metricValues.runs)
      case 'activeAgents':
        return String(metricValues.agents)
      case 'tokens':
        return formatNumber(metricValues.tokens)
      case 'successRate':
        return `${metricValues.successRate}%`
      case 'errorRate':
        return `${metricValues.errorRate}%`
      case 'runs':
        return String(metricValues.runs)
      case 'agents':
        return String(metricValues.agents)
      case 'errors':
        return String(metricValues.errors)
      case 'avgLatency':
        return formatLatency(metricValues.avgLatency)
      default:
        return String(metricValues.runs)
    }
  }

  const rangePopover =
    rangeOpen
      ? createPortal(
          <div
            ref={rangePopoverRef}
            id={rangeMenuId}
            className="analytics-range-menu analytics-range-menu--panel"
            role="dialog"
            aria-modal="false"
            aria-label={analyticsT(locale, 'rangeMenuAria')}
            style={{
              position: 'fixed',
              top: rangePopoverBox.top,
              left: rangePopoverBox.left,
              width: rangePopoverBox.width,
              zIndex: 10050,
            }}
          >
            <div className="analytics-range-menu__scroll" role="listbox" aria-label={analyticsT(locale, 'rangePresetsListAria')}>
              {rangeOptions.map((opt) => {
                const selected = opt.key === rangeKey
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? 'analytics-range-menu__item is-selected' : 'analytics-range-menu__item'}
                    onClick={() => {
                      setRangeKey(opt.key)
                      setRangeOpen(false)
                    }}
                  >
                    <span className="analytics-range-menu__label">{opt.label}</span>
                    <span className="analytics-range-menu__tick" aria-hidden="true">
                      {selected ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
            <div
              className={rangeKey === 'custom' ? 'analytics-range-menu__custom-panel is-active' : 'analytics-range-menu__custom-panel'}
              role="group"
              aria-label={analyticsT(locale, 'dateRangeGroupAria')}
            >
              <div className="analytics-range-menu__custom-title">{analyticsT(locale, 'customRangeLabel')}</div>
              <div className="analytics-range-menu__custom-row">
                <label className="analytics-sr-only" htmlFor={rangeMenuStartId}>
                  {analyticsT(locale, 'startDate')}
                </label>
                <input
                  id={rangeMenuStartId}
                  type="date"
                  className="analytics-range-date-input analytics-range-date-input--in-popover"
                  value={rangeStartYmd}
                  max={rangeEndYmd}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    setRangeKey('custom')
                    setRangeStartYmd(v)
                    if (v > rangeEndYmd) setRangeEndYmd(v)
                  }}
                />
                <span className="analytics-range-dates-sep" aria-hidden="true">
                  –
                </span>
                <label className="analytics-sr-only" htmlFor={rangeMenuEndId}>
                  {analyticsT(locale, 'endDate')}
                </label>
                <input
                  id={rangeMenuEndId}
                  type="date"
                  className="analytics-range-date-input analytics-range-date-input--in-popover"
                  value={rangeEndYmd}
                  min={rangeStartYmd}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    setRangeKey('custom')
                    setRangeEndYmd(v)
                    if (v < rangeStartYmd) setRangeStartYmd(v)
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <header className="agents-header">
        <div className="agents-header-lead">
          <div className="agents-title">{analyticsT(locale, 'pageTitle')}</div>
          <AnalyticsPageTagline locale={locale} />
        </div>
      </header>

      <div className="analytics-scope-panel">
        <div
          className="analytics-entity-bar"
          role="region"
          aria-label={analyticsT(locale, 'scopeBarAria', { summary: scopeEntitySummary })}
        >
          <div className="analytics-entity-bar__controls">
            <div className="analytics-entity-bar__fields">
              <div className="analytics-entity-bar__field">
                <label htmlFor={entitySelectId} className="analytics-sr-only">
                  {analyticsT(locale, 'selectScenario')}
                </label>
                <select
                  id={entitySelectId}
                  className="analytics-entity-select"
                  value={scopeScenarioId}
                  onChange={(e) => setScopeScenarioId(e.target.value)}
                >
                  <option value="all">{analyticsT(locale, 'allScenarios')}</option>
                  {availableScenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getAnalyticsScenarioName(locale, s.id, s.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="analytics-entity-bar__field">
                <label htmlFor={entityAgentSelectId} className="analytics-sr-only">
                  {analyticsT(locale, 'selectAgent')}
                </label>
                <select
                  id={entityAgentSelectId}
                  className="analytics-entity-select"
                  value={scopeAgentId}
                  onChange={(e) => setScopeAgentId(e.target.value)}
                >
                  <option value="all">{analyticsT(locale, 'allAgents')}</option>
                  {availableAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {getAnalyticsAgentName(locale, a.id, a.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="analytics-entity-bar__time-range analytics-time-range">
                <button
                  ref={rangeTriggerRef}
                  type="button"
                  className="analytics-range-trigger analytics-range-trigger--unified"
                  aria-haspopup="dialog"
                  aria-expanded={rangeOpen}
                  aria-controls={rangeOpen ? rangeMenuId : undefined}
                  aria-label={analyticsT(locale, 'rangePresetAria', { label: rangeDisplayLabel })}
                  onClick={() => setRangeOpen((v) => !v)}
                >
                  <span className="analytics-range-trigger__label">{rangeDisplayLabel}</span>
                </button>
              </div>
            </div>
            <div className="analytics-entity-bar__actions">
              {canExportAnalytics || canEditAnalyticsLayout ? (
                <div className="analytics-toolbar-actions" role="group" aria-label={analyticsT(locale, 'toolbarAria', { summary: scopeEntitySummary })}>
                  {canExportAnalytics ? (
                    <button
                      type="button"
                      className="analytics-toolbar-action"
                      title={analyticsT(locale, 'exportCsvTitle', {
                        summary: scopeEntitySummary,
                        start: rangeStartYmd,
                        end: rangeEndYmd,
                      })}
                      aria-label={analyticsT(locale, 'toolbarDownloadAria')}
                      onClick={downloadAnalyticsLogsCsv}
                    >
                      <span className="analytics-toolbar-action__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 4v10M8.5 10.5 12 14l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 18h14" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="analytics-toolbar-action__label">{analyticsT(locale, 'toolbarDownload')}</span>
                    </button>
                  ) : null}
                  {canExportAnalytics && canEditAnalyticsLayout ? (
                    <span className="analytics-toolbar-actions__divider" aria-hidden="true" />
                  ) : null}
                  {canEditAnalyticsLayout ? (
                    <>
                      <button type="button" className="analytics-toolbar-action" aria-label={analyticsT(locale, 'toolbarEditAria')}>
                        <span className="analytics-toolbar-action__icon" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="m13.5 6.5 3 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="analytics-toolbar-action__label">{analyticsT(locale, 'toolbarEdit')}</span>
                      </button>
                      <button type="button" className="analytics-toolbar-action" aria-label={analyticsT(locale, 'toolbarSaveAria')}>
                        <span className="analytics-toolbar-action__icon" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" strokeLinejoin="round" />
                            <path d="M7 5v4h8V5M7 19h10" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="analytics-toolbar-action__label">{analyticsT(locale, 'toolbarSave')}</span>
                      </button>
                      <button type="button" className="analytics-toolbar-action" aria-label={analyticsT(locale, 'toolbarReportAria')}>
                        <span className="analytics-toolbar-action__icon" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 4h9l3 3v13H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
                            <path d="M15 4v4h4M8 12h8M8 16h8" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="analytics-toolbar-action__label">{analyticsT(locale, 'toolbarReport')}</span>
                        <span className="analytics-toolbar-action__badge" aria-hidden="true">
                          3
                        </span>
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="analytics-dashboard-toolbar agents-toolbar analytics-dashboard-toolbar--meta-only"
          aria-label={analyticsT(locale, 'toolbarMetaAria')}
        >
          <div className="analytics-toolbar-meta">
            <span className="analytics-toolbar-meta__item">
              <span className="analytics-toolbar-meta__label">{analyticsT(locale, 'toolbarUpdatedAt')}</span>
              <span className="analytics-toolbar-meta__value">{toolbarMeta.lastUpdatedLabel}</span>
            </span>
            <span className="analytics-toolbar-meta__item">
              <span className="analytics-toolbar-meta__label">{analyticsT(locale, 'toolbarComponentCount')}</span>
              <span className="analytics-toolbar-meta__value">{formatNumber(toolbarMeta.componentCount)}</span>
            </span>
            <span className="analytics-toolbar-meta__item">
              <span className="analytics-toolbar-meta__label">{analyticsT(locale, 'toolbarExecutionCount')}</span>
              <span className="analytics-toolbar-meta__value">{formatNumber(toolbarMeta.executionCount)}</span>
            </span>
          </div>
        </div>
      </div>

      <AnalyticsEfficiencySection
        rows={filteredRows}
        locale={locale}
        scopeSummary={scopeEntitySummary}
        scopeAgentId={scopeAgentId}
      />

      <div
        className="analytics-metrics-grid"
        aria-label={
          isAgentScoped
            ? analyticsT(locale, 'metricsAgentOverviewAria')
            : analyticsT(locale, 'metricsOverviewAria')
        }
      >
        {metricCards.map((m) => (
          <article key={m.id} className={`analytics-stat-card analytics-stat-card--${m.id}`}>
            <span className="analytics-stat-card__title">{m.title}</span>
            <span
              className="analytics-stat-card__value"
              style={{ color: m.color }}
              aria-label={`${m.title}：${renderMetricValue(m.id)}`}
            >
              {renderMetricValue(m.id)}
            </span>
            <span className="analytics-stat-card__subtitle">
              {isAgentScoped
                ? agentMetricSubtitles[m.id as AgentScopedMetricId]
                : metricSubtitles[m.id as MetricId]}
            </span>
          </article>
        ))}
      </div>

      <AnalyticsChartsSection
        monthlyRows={filteredRows}
        locale={locale}
        isAgentScoped={isAgentScoped}
        agentChartRows={filteredRows}
        dateWindow={dateWindow}
        rangeKey={rangeKey}
      />

      {rangePopover}
    </>
  )
}
