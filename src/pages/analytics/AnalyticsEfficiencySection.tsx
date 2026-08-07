import { useMemo, useState } from 'react'
import { ANALYTICS_AGENTS, type AnalyticsLogRow } from '../../data/analytics-logs'
import type { AppLocale } from '../../i18n/homeStrings'
import { analyticsT, getAnalyticsAgentName } from '../../i18n/analyticsStrings'
import {
  AGENT_EFFICIENCY_DOT_COLORS,
  buildAgentEfficiencyHierarchy,
  formatSuccessRate,
  formatTimeSaved,
  type AgentEfficiencyTier,
} from './buildAgentEfficiency'

export interface AnalyticsEfficiencySectionProps {
  rows: AnalyticsLogRow[]
  locale: AppLocale
  scopeSummary: string
  scopeAgentId?: string
}

function formatTaskCount(n: number): string {
  return n.toLocaleString('en-US')
}

function tierLabel(locale: AppLocale, tier: AgentEfficiencyTier, showSubAgentTier: boolean): string {
  if (tier === 'parent') return analyticsT(locale, 'efficiencyTierMain')
  if (tier === 'sub' && showSubAgentTier) return analyticsT(locale, 'efficiencyTierSub')
  return analyticsT(locale, 'efficiencyTierSingle')
}

function tierBadgeClass(tier: AgentEfficiencyTier, showSubAgentTier: boolean): string {
  if (tier === 'parent') return 'analytics-efficiency__tier-badge analytics-efficiency__tier-badge--parent'
  if (tier === 'sub' && showSubAgentTier) return 'analytics-efficiency__tier-badge analytics-efficiency__tier-badge--sub'
  return 'analytics-efficiency__tier-badge analytics-efficiency__tier-badge--standalone'
}

export function AnalyticsEfficiencySection({
  rows,
  locale,
  scopeSummary,
  scopeAgentId = 'all',
}: AnalyticsEfficiencySectionProps) {
  const [expanded, setExpanded] = useState(false)
  const data = useMemo(() => buildAgentEfficiencyHierarchy(rows, scopeAgentId), [rows, scopeAgentId])

  const agentColorIndex = useMemo(() => {
    const map = new Map<string, number>()
    ANALYTICS_AGENTS.forEach((a, i) => map.set(a.id, i))
    return map
  }, [])

  const summaryItems = [
    {
      label: analyticsT(locale, 'efficiencyKpiParentAgents'),
      value: String(data.topLevelAgentCount),
      tone: 'default' as const,
    },
    {
      label: analyticsT(locale, 'efficiencyKpiTasks'),
      value: formatTaskCount(data.totalTasks),
      tone: 'default' as const,
    },
    {
      label: analyticsT(locale, 'efficiencyKpiSuccessRate'),
      value: formatSuccessRate(data.successRate),
      tone: 'success' as const,
    },
    {
      label: analyticsT(locale, 'efficiencyKpiTimeSaved'),
      value: formatTimeSaved(locale, data.timeSavedMs),
      tone: 'default' as const,
    },
  ]

  const visibleRows = useMemo(
    () => (data.showSubAgents ? data.rows : data.rows.filter((row) => row.tier !== 'sub')),
    [data.rows, data.showSubAgents],
  )

  const metaText = useMemo(() => {
    if (data.showSubAgents) return analyticsT(locale, 'efficiencyMetaHierarchy')
    if (scopeAgentId === 'all' && data.showAgentTier) return analyticsT(locale, 'efficiencyMetaMixed')
    return analyticsT(locale, 'efficiencyMetaStandalone')
  }, [data.showSubAgents, data.showAgentTier, scopeAgentId, locale])

  const hasDetails = visibleRows.length > 0
  const toggleLabel = expanded
    ? analyticsT(locale, 'efficiencyCollapseDetails')
    : analyticsT(locale, 'efficiencyExpandDetails')

  return (
    <section
      className={expanded ? 'analytics-efficiency analytics-efficiency--expanded' : 'analytics-efficiency'}
      aria-label={analyticsT(locale, 'efficiencySectionAria')}
    >
      <header className="analytics-efficiency__head">
        <div className="analytics-efficiency__head-main">
          <h2 className="analytics-efficiency__title">{analyticsT(locale, 'efficiencyTitle')}</h2>
          <p className="analytics-efficiency__meta">
            {metaText}
            <span className="analytics-efficiency__meta-sep" aria-hidden="true">
              {' · '}
            </span>
            {scopeSummary}
          </p>
        </div>
        {hasDetails ? (
          <button
            type="button"
            className="analytics-efficiency__toggle"
            aria-expanded={expanded}
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => setExpanded((v) => !v)}
          >
            <svg
              className={expanded ? 'analytics-efficiency__chevron is-expanded' : 'analytics-efficiency__chevron'}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </header>

      <div className="analytics-efficiency__summary analytics-efficiency__summary--hierarchy" role="list">
        {summaryItems.map((item) => (
          <div key={item.label} className="analytics-efficiency__summary-item" role="listitem">
            <span className="analytics-efficiency__summary-label">{item.label}</span>
            <span
              className={
                item.tone === 'success'
                  ? 'analytics-efficiency__summary-value analytics-efficiency__summary-value--success'
                  : 'analytics-efficiency__summary-value'
              }
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {expanded ? (
        hasDetails ? (
          <div className="analytics-efficiency__table-wrap">
            <table
              className={
                data.showAgentTier
                  ? 'analytics-efficiency__table'
                  : 'analytics-efficiency__table analytics-efficiency__table--no-tier'
              }
            >
              <colgroup>
                <col className="analytics-efficiency__col-agent" />
                {data.showAgentTier ? <col className="analytics-efficiency__col-tier" /> : null}
                <col className="analytics-efficiency__col-tasks" />
                <col className="analytics-efficiency__col-success" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">{analyticsT(locale, 'efficiencyColAgent')}</th>
                  {data.showAgentTier ? (
                    <th scope="col" className="analytics-efficiency__th-tier">
                      {analyticsT(locale, 'efficiencyColTier')}
                    </th>
                  ) : null}
                  <th scope="col" className="analytics-efficiency__th-num">
                    {analyticsT(locale, 'efficiencyColTasks')}
                  </th>
                  <th scope="col" className="analytics-efficiency__th-num">
                    {analyticsT(locale, 'efficiencyColSuccessRate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const rawName = ANALYTICS_AGENTS.find((a) => a.id === row.agentId)?.name
                  const name = getAnalyticsAgentName(locale, row.agentId, rawName ?? row.agentId)
                  const dotColor =
                    AGENT_EFFICIENCY_DOT_COLORS[
                      (agentColorIndex.get(row.agentId) ?? 0) % AGENT_EFFICIENCY_DOT_COLORS.length
                    ]
                  return (
                    <tr
                      key={`${row.tier}-${row.agentId}`}
                      className={
                        data.showSubAgents && row.tier === 'sub'
                          ? 'analytics-efficiency__row--sub'
                          : 'analytics-efficiency__row--parent'
                      }
                    >
                      <td>
                        <span
                          className={
                            data.showSubAgents && row.tier === 'sub'
                              ? 'analytics-efficiency__agent analytics-efficiency__agent--sub'
                              : 'analytics-efficiency__agent'
                          }
                        >
                          <span
                            className="analytics-efficiency__dot"
                            style={{ background: dotColor }}
                            aria-hidden="true"
                          />
                          {name}
                        </span>
                      </td>
                      {data.showAgentTier ? (
                        <td className="analytics-efficiency__tier">
                          <span className={tierBadgeClass(row.tier, data.showSubAgents)}>
                            {tierLabel(locale, row.tier, data.showSubAgents)}
                          </span>
                        </td>
                      ) : null}
                      <td className="analytics-efficiency__num">{formatTaskCount(row.tasks)}</td>
                      <td className="analytics-efficiency__num analytics-efficiency__success">
                        {formatSuccessRate(row.successRate)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="analytics-efficiency__empty">{analyticsT(locale, 'efficiencyEmpty')}</p>
        )
      ) : null}
    </section>
  )
}
