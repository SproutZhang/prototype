import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  AI_TRACE_RECORDS,
  type AiTraceRecord,
  type TraceFlowStep,
  type TraceFlowStepKind,
  type TraceRiskLevel,
  type TraceRunStatus,
} from '../data/traceExplorerSeed'

type AiTraceExplorerViewProps = {
  locale: AppLocale
  records?: AiTraceRecord[]
  initialSessionId?: string
  scenarioTitle?: string
  onBack?: () => void
}

function formatTraceTime(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function formatTraceTimeShort(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function traceAgentLabel(locale: AppLocale, trace: AiTraceRecord): string {
  return locale === 'zh' ? trace.agentLabelZh : trace.agentLabelEn
}

function tracePromptPreview(locale: AppLocale, trace: AiTraceRecord): string {
  return locale === 'zh' ? trace.promptPreviewZh : trace.promptPreviewEn
}

function flowStepLabel(locale: AppLocale, step: TraceFlowStep): string {
  return locale === 'zh' ? step.labelZh : step.labelEn
}

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`
}

function formatLatencySec(value: number): string {
  return `${value.toFixed(2)}s`
}

function formatLatencyMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
}

function runStatusLabel(locale: AppLocale, status: TraceRunStatus): string {
  const map: Record<TraceRunStatus, Parameters<typeof acT>[1]> = {
    success: 'traceRunStatusSuccess',
    error: 'traceRunStatusError',
    running: 'traceRunStatusRunning',
  }
  return acT(locale, map[status])
}

function riskLevelLabel(locale: AppLocale, level: TraceRiskLevel): string {
  const map: Record<TraceRiskLevel, Parameters<typeof acT>[1]> = {
    low: 'traceRiskLow',
    medium: 'traceRiskMedium',
    high: 'traceRiskHigh',
  }
  return acT(locale, map[level])
}

function filterTraces(
  traces: AiTraceRecord[],
  query: string,
  agentFilter: string,
  modelFilter: string,
  riskFilter: string,
): AiTraceRecord[] {
  const normalized = query.trim().toLowerCase()
  return traces.filter((trace) => {
    if (agentFilter !== 'all' && trace.agentLabelEn !== agentFilter && trace.agentLabelZh !== agentFilter) {
      return false
    }
    if (modelFilter !== 'all' && trace.model !== modelFilter) return false
    if (riskFilter !== 'all' && trace.riskLevel !== riskFilter) return false
    if (!normalized) return true
    const haystack = [
      trace.id,
      trace.sessionId,
      trace.agentLabelZh,
      trace.agentLabelEn,
      trace.promptPreviewZh,
      trace.promptPreviewEn,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

function StatusDot({ status }: { status: TraceRunStatus }) {
  return <span className={`ac-trace-dot ac-trace-dot--${status}`} aria-hidden="true" />
}

function RunStatusBadge({ locale, status }: { locale: AppLocale; status: TraceRunStatus }) {
  return (
    <span className={`ac-trace-run-badge ac-trace-run-badge--${status}`}>
      {runStatusLabel(locale, status)}
    </span>
  )
}

function RiskBadge({ locale, level }: { locale: AppLocale; level: TraceRiskLevel }) {
  return (
    <span className={`ac-trace-risk-badge ac-trace-risk-badge--${level}`}>
      {riskLevelLabel(locale, level)}
    </span>
  )
}

function flowStepKindLabel(locale: AppLocale, kind: TraceFlowStepKind): string {
  const map: Record<TraceFlowStepKind, Parameters<typeof acT>[1]> = {
    user: 'traceFlowKindUser',
    agent: 'traceFlowKindAgent',
    retrieval: 'traceFlowKindRetrieval',
    llm: 'traceFlowKindLlm',
    tool: 'traceFlowKindTool',
  }
  return acT(locale, map[kind])
}

const FLOW_TIMELINE_LEGEND: TraceFlowStepKind[] = ['user', 'agent', 'retrieval', 'llm', 'tool']

function ExecutionFlow({ locale, trace }: { locale: AppLocale; trace: AiTraceRecord }) {
  return (
    <section className="ac-trace-section">
      <h3 className="ac-trace-section-title">{acT(locale, 'traceSectionFlow')}</h3>
      <div className="ac-trace-flow">
        <div className="ac-trace-flow-pipeline">
          {trace.flowSteps.map((step, index) => (
            <div key={step.id} className="ac-trace-flow-step-wrap">
              {index > 0 ? <span className="ac-trace-flow-arrow" aria-hidden="true" /> : null}
              <div className={`ac-trace-flow-step ac-trace-flow-step--${step.kind}`}>
                <span className="ac-trace-flow-step-label">{flowStepLabel(locale, step)}</span>
                {step.latencyMs > 0 ? (
                  <span className="ac-trace-flow-step-meta">{formatLatencyMs(step.latencyMs)}</span>
                ) : null}
                {step.inputTokens != null ? (
                  <span className="ac-trace-flow-step-meta">
                    {step.inputTokens + (step.outputTokens ?? 0)} tokens
                  </span>
                ) : null}
                {step.costUsd != null ? (
                  <span className="ac-trace-flow-step-meta">{formatUsd(step.costUsd)}</span>
                ) : null}
                {step.detailZh && locale === 'zh' ? (
                  <span className="ac-trace-flow-step-detail">{step.detailZh}</span>
                ) : null}
                {step.detailEn && locale !== 'zh' ? (
                  <span className="ac-trace-flow-step-detail">{step.detailEn}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="ac-trace-flow-timeline" aria-hidden="true">
          {trace.flowSteps.map((step) => (
            <span
              key={step.id}
              className={`ac-trace-flow-timeline-seg ac-trace-flow-timeline-seg--${step.kind}`}
              style={{ flex: Math.max(step.latencyMs, 0.05) }}
            />
          ))}
        </div>
        <div className="ac-trace-flow-timeline-labels">
          <span>0</span>
          <span>{formatLatencySec(trace.latencySec)}</span>
        </div>
        <div className="ac-trace-flow-legend" aria-label={acT(locale, 'traceFlowLegendAria')}>
          {FLOW_TIMELINE_LEGEND.map((kind) => (
            <span key={kind} className="ac-trace-flow-legend-item">
              <span className={`ac-trace-flow-legend-dot ac-trace-flow-legend-dot--${kind}`} aria-hidden="true" />
              {flowStepKindLabel(locale, kind)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function TokenCostSection({ locale, trace }: { locale: AppLocale; trace: AiTraceRecord }) {
  const maxTokens = Math.max(trace.inputTokens, trace.outputTokens, 1)
  const inputPct = Math.round((trace.inputTokens / trace.totalTokens) * 100)
  const outputPct = 100 - inputPct

  return (
    <section className="ac-trace-section">
      <h3 className="ac-trace-section-title">{acT(locale, 'traceSectionTokenCost')}</h3>
      <div className="ac-trace-token-grid">
        <div className="ac-trace-token-bars">
          <div className="ac-trace-token-bar-row">
            <span className="ac-trace-token-bar-label">{acT(locale, 'traceInputTokens')}</span>
            <div className="ac-trace-token-bar-track">
              <span
                className="ac-trace-token-bar-fill ac-trace-token-bar-fill--input"
                style={{ width: `${(trace.inputTokens / maxTokens) * 100}%` }}
              />
            </div>
            <span className="ac-trace-token-bar-value">{trace.inputTokens.toLocaleString()}</span>
          </div>
          <div className="ac-trace-token-bar-row">
            <span className="ac-trace-token-bar-label">{acT(locale, 'traceOutputTokens')}</span>
            <div className="ac-trace-token-bar-track">
              <span
                className="ac-trace-token-bar-fill ac-trace-token-bar-fill--output"
                style={{ width: `${(trace.outputTokens / maxTokens) * 100}%` }}
              />
            </div>
            <span className="ac-trace-token-bar-value">{trace.outputTokens.toLocaleString()}</span>
          </div>
          <div className="ac-trace-token-bar-row">
            <span className="ac-trace-token-bar-label">{acT(locale, 'traceTotalTokens')}</span>
            <div className="ac-trace-token-bar-track">
              <span
                className="ac-trace-token-bar-fill ac-trace-token-bar-fill--total"
                style={{ width: '100%' }}
              />
            </div>
            <span className="ac-trace-token-bar-value">{trace.totalTokens.toLocaleString()}</span>
          </div>
        </div>
        <div className="ac-trace-token-summary">
          <div className="ac-trace-token-donut-wrap">
            <div
              className="ac-trace-token-donut"
              style={{
                background: `conic-gradient(#1677ff 0 ${inputPct}%, #52c41a ${inputPct}% 100%)`,
              }}
            />
            <div className="ac-trace-token-donut-center">
              <span>{inputPct}%</span>
              <small>{acT(locale, 'traceInputTokens')}</small>
            </div>
          </div>
          <div className="ac-trace-token-cost-total">
            <span className="ac-trace-token-cost-label">{acT(locale, 'traceTotalCost')}</span>
            <strong>{formatUsd(trace.costUsd)}</strong>
            <span className="ac-trace-token-cost-sub">{outputPct}% {acT(locale, 'traceOutputTokens')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function SecuritySection({ locale, trace }: { locale: AppLocale; trace: AiTraceRecord }) {
  const { security } = trace
  return (
    <section className="ac-trace-section">
      <h3 className="ac-trace-section-title">{acT(locale, 'traceSectionSecurity')}</h3>
      <div className="ac-trace-security-grid">
        <div className="ac-trace-security-card">
          <span className="ac-trace-security-card-label">{acT(locale, 'traceSecurityOverall')}</span>
          <RiskBadge locale={locale} level={security.overallRisk} />
          <div className={`ac-trace-security-bar ac-trace-security-bar--${security.overallRisk}`} />
        </div>
        <div className="ac-trace-security-card">
          <span className="ac-trace-security-card-label">{acT(locale, 'traceSecurityInjection')}</span>
          <span
            className={`ac-trace-security-status${security.promptInjectionDetected ? ' is-danger' : ' is-safe'}`}
          >
            {security.promptInjectionDetected
              ? acT(locale, 'traceSecurityDetected')
              : acT(locale, 'traceSecurityNotDetected')}
          </span>
          <p className="ac-trace-security-detail">
            {locale === 'zh' ? security.promptInjectionDetailZh : security.promptInjectionDetailEn}
          </p>
        </div>
        <div className="ac-trace-security-card">
          <span className="ac-trace-security-card-label">{acT(locale, 'traceSecurityLeak')}</span>
          <span className={`ac-trace-security-status is-${security.dataLeakRisk}`}>
            {security.dataLeakRisk === 'low'
              ? acT(locale, 'traceSecuritySafe')
              : riskLevelLabel(locale, security.dataLeakRisk)}
          </span>
          <p className="ac-trace-security-detail">
            {locale === 'zh' ? security.dataLeakDetailZh : security.dataLeakDetailEn}
          </p>
        </div>
      </div>
    </section>
  )
}

export function AiTraceExplorerView({
  locale,
  records: recordsProp,
  initialSessionId,
  scenarioTitle,
  onBack,
}: AiTraceExplorerViewProps) {
  const sourceRecords = recordsProp ?? AI_TRACE_RECORDS
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedTraceId, setSelectedTraceId] = useState(() => {
    if (initialSessionId) {
      const match = sourceRecords.find((record) => record.sessionId === initialSessionId)
      if (match) return match.id
    }
    return sourceRecords[0]?.id ?? ''
  })

  const agentOptions = useMemo(
    () =>
      Array.from(
        new Map(sourceRecords.map((t) => [t.agentLabelEn, t])).values(),
      ),
    [sourceRecords],
  )
  const modelOptions = useMemo(
    () => Array.from(new Set(sourceRecords.map((t) => t.model))),
    [sourceRecords],
  )

  const traces = useMemo(
    () => filterTraces(sourceRecords, searchQuery, agentFilter, modelFilter, riskFilter),
    [sourceRecords, searchQuery, agentFilter, modelFilter, riskFilter],
  )

  const selectedTrace = traces.find((trace) => trace.id === selectedTraceId) ?? traces[0]

  if (!selectedTrace) {
    return (
      <div className="ac-trace-explorer-empty">
        <p>{acT(locale, 'traceExplorerEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="ac-trace-explorer">
      {onBack ? (
        <div className="ac-trace-scenario-bar">
          <button
            type="button"
            className="ac-trace-scenario-back"
            onClick={onBack}
            aria-label={acT(locale, 'traceScenarioBack')}
            title={acT(locale, 'traceScenarioBack')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {scenarioTitle ? (
            <span className="ac-trace-scenario-title">{scenarioTitle}</span>
          ) : null}
        </div>
      ) : null}
      <header className="ac-trace-explorer-toolbar">
        <div className="ac-trace-toolbar-search">
          <input
            type="search"
            className="ac-trace-search-input"
            placeholder={acT(locale, 'traceSearchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="ac-trace-toolbar-filters">
          <select className="ac-trace-filter-select" defaultValue="7d" aria-label={acT(locale, 'traceFilterTime')}>
            <option value="7d">{acT(locale, 'traceFilterTime7d')}</option>
            <option value="24h">{acT(locale, 'traceFilterTime24h')}</option>
            <option value="30d">{acT(locale, 'traceFilterTime30d')}</option>
          </select>
          <select
            className="ac-trace-filter-select"
            value={agentFilter}
            onChange={(event) => setAgentFilter(event.target.value)}
            aria-label={acT(locale, 'traceFilterAgent')}
          >
            <option value="all">{acT(locale, 'traceFilterAllAgents')}</option>
            {agentOptions.map((trace) => (
              <option key={trace.agentLabelEn} value={trace.agentLabelEn}>
                {traceAgentLabel(locale, trace)}
              </option>
            ))}
          </select>
          <select
            className="ac-trace-filter-select"
            value={modelFilter}
            onChange={(event) => setModelFilter(event.target.value)}
            aria-label={acT(locale, 'traceFilterModel')}
          >
            <option value="all">{acT(locale, 'traceFilterAllModels')}</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <select
            className="ac-trace-filter-select"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            aria-label={acT(locale, 'traceFilterRisk')}
          >
            <option value="all">{acT(locale, 'traceFilterAllRisk')}</option>
            <option value="low">{acT(locale, 'traceRiskLow')}</option>
            <option value="medium">{acT(locale, 'traceRiskMedium')}</option>
            <option value="high">{acT(locale, 'traceRiskHigh')}</option>
          </select>
        </div>
        <div className="ac-trace-toolbar-actions">
          <button type="button" className="ac-trace-export-btn">
            {acT(locale, 'traceExportJson')}
          </button>
          <button type="button" className="ac-trace-export-btn">
            {acT(locale, 'traceExportCsv')}
          </button>
        </div>
      </header>

      <div className="ac-trace-explorer-body">
        <aside className="ac-trace-sidebar">
          <div className="ac-trace-sidebar-head">
            <h2>{acT(locale, 'traceListTitle')}</h2>
            <span className="ac-trace-sidebar-count">{traces.length}</span>
          </div>
          <ul className="ac-trace-list">
            {traces.map((trace) => (
              <li key={trace.id}>
                <button
                  type="button"
                  className={`ac-trace-list-item${selectedTrace.id === trace.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedTraceId(trace.id)}
                >
                  <div className="ac-trace-list-item-top">
                    <StatusDot status={trace.status} />
                    <span className="ac-trace-list-item-model">{trace.model}</span>
                    <span className="ac-trace-list-item-time">
                      {formatTraceTimeShort(trace.occurredAt, locale)}
                    </span>
                  </div>
                  <div className="ac-trace-list-item-name">{traceAgentLabel(locale, trace)}</div>
                  <div className="ac-trace-list-item-cost">{formatUsd(trace.costUsd)}</div>
                  <div className="ac-trace-list-item-preview">{tracePromptPreview(locale, trace)}</div>
                  <div className="ac-trace-list-item-foot">
                    <span>{trace.id}</span>
                    <span>{formatLatencySec(trace.latencySec)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="ac-trace-detail">
          <header className="ac-trace-detail-header">
            <div className="ac-trace-detail-header-main">
              <div className="ac-trace-detail-title-row">
                <h2>{traceAgentLabel(locale, selectedTrace)}</h2>
                <RunStatusBadge locale={locale} status={selectedTrace.status} />
              </div>
              <div className="ac-trace-detail-meta">
                <span>
                  {acT(locale, 'traceIdLabel')}: {selectedTrace.id}
                </span>
                <span>
                  {acT(locale, 'traceSessionIdLabel')}: {selectedTrace.sessionId}
                </span>
                <span>{formatTraceTime(selectedTrace.occurredAt, locale)}</span>
              </div>
            </div>
            <RiskBadge locale={locale} level={selectedTrace.riskLevel} />
          </header>

          <div className="ac-trace-metric-cards">
            <div className="ac-trace-metric-card">
              <span className="ac-trace-metric-label">{acT(locale, 'traceMetricModel')}</span>
              <strong>{selectedTrace.model}</strong>
            </div>
            <div className="ac-trace-metric-card">
              <span className="ac-trace-metric-label">{acT(locale, 'traceTotalCost')}</span>
              <strong>{formatUsd(selectedTrace.costUsd)}</strong>
            </div>
            <div className="ac-trace-metric-card">
              <span className="ac-trace-metric-label">{acT(locale, 'traceTotalLatency')}</span>
              <strong>{formatLatencySec(selectedTrace.latencySec)}</strong>
            </div>
            <div className="ac-trace-metric-card">
              <span className="ac-trace-metric-label">{acT(locale, 'traceTotalTokens')}</span>
              <strong>{selectedTrace.totalTokens.toLocaleString()}</strong>
            </div>
          </div>

          <div className="ac-trace-detail-scroll">
            <ExecutionFlow locale={locale} trace={selectedTrace} />

            <section className="ac-trace-section">
              <h3 className="ac-trace-section-title">{acT(locale, 'traceSectionIo')}</h3>
              <div className="ac-trace-io-grid">
                <div className="ac-trace-io-block">
                  <span className="ac-trace-io-label">{acT(locale, 'traceUserInput')}</span>
                  <p>
                    {locale === 'zh' ? selectedTrace.userInputZh : selectedTrace.userInputEn}
                  </p>
                </div>
                <div className="ac-trace-io-block">
                  <span className="ac-trace-io-label">{acT(locale, 'traceAiResponse')}</span>
                  <p>
                    {locale === 'zh' ? selectedTrace.aiResponseZh : selectedTrace.aiResponseEn}
                  </p>
                </div>
              </div>
            </section>

            {selectedTrace.kbHits.length > 0 ? (
              <section className="ac-trace-section">
                <h3 className="ac-trace-section-title">{acT(locale, 'traceSectionKb')}</h3>
                <ul className="ac-trace-kb-list">
                  {selectedTrace.kbHits.map((hit) => (
                    <li key={hit.id} className="ac-trace-kb-item">
                      <div className="ac-trace-kb-head">
                        <strong>{locale === 'zh' ? hit.titleZh : hit.titleEn}</strong>
                        <span className="ac-trace-kb-source">{hit.source}</span>
                      </div>
                      <p className="ac-trace-kb-snippet">
                        {locale === 'zh' ? hit.snippetZh : hit.snippetEn}
                      </p>
                      <div className="ac-trace-kb-score">
                        <div className="ac-trace-kb-score-track">
                          <span
                            className="ac-trace-kb-score-fill"
                            style={{ width: `${hit.score * 100}%` }}
                          />
                        </div>
                        <span>{hit.score.toFixed(2)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selectedTrace.toolCalls.length > 0 ? (
              <section className="ac-trace-section">
                <h3 className="ac-trace-section-title">{acT(locale, 'traceSectionTools')}</h3>
                <div className="ac-trace-tool-list">
                  {selectedTrace.toolCalls.map((call) => (
                    <div key={call.id} className="ac-trace-tool-item">
                      <div className="ac-trace-tool-head">
                        <code>{call.name}</code>
                        <span>{formatLatencyMs(call.latencyMs)}</span>
                      </div>
                      <div className="ac-trace-tool-io">
                        <div className="ac-trace-tool-code">
                          <span className="ac-trace-tool-code-label">{acT(locale, 'traceToolInput')}</span>
                          <pre>{call.inputJson}</pre>
                        </div>
                        <div className="ac-trace-tool-code">
                          <span className="ac-trace-tool-code-label">{acT(locale, 'traceToolOutput')}</span>
                          <pre>{call.outputJson}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <TokenCostSection locale={locale} trace={selectedTrace} />
            <SecuritySection locale={locale} trace={selectedTrace} />
          </div>
        </main>
      </div>
    </div>
  )
}
