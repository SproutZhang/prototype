import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { navigateScenarioTrace } from '../../utils/routing'
import { memberAvatarColors, memberAvatarInitials } from '../../utils/memberAvatar'
import {
  type WorkLogCategory,
  type WorkLogConversationChainStep,
  type WorkLogConversationChainStepKind,
  type WorkLogDataAccessAudit,
  type WorkLogEntry,
  type WorkLogExfiltrationRisk,
  type WorkLogExternalToolKind,
  type WorkLogSecurityDisposition,
  type WorkLogSecurityRiskControl,
} from '../data/workLogSeed'

type WorkLogTab = 'all' | WorkLogCategory

type WorkLogViewProps = {
  locale: AppLocale
  searchQuery: string
  entries: WorkLogEntry[]
}

function formatWorkLogTimestamp(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function workLogActionLabel(locale: AppLocale, actionKey: WorkLogEntry['actionKey']): string {
  const keyMap: Record<WorkLogEntry['actionKey'], Parameters<typeof acT>[1]> = {
    agentCreate: 'workLogActionAgentCreate',
    agentEdit: 'workLogActionAgentEdit',
    agentSave: 'workLogActionAgentSave',
    agentPublish: 'workLogActionAgentPublish',
    agentFreeze: 'workLogActionAgentFreeze',
    agentDelete: 'workLogActionAgentDelete',
    agentDuplicate: 'workLogActionAgentDuplicate',
    scenarioCreate: 'workLogActionScenarioCreate',
    scenarioEdit: 'workLogActionScenarioEdit',
    scenarioSave: 'workLogActionScenarioSave',
    scenarioPublish: 'workLogActionScenarioPublish',
    scenarioRunTest: 'workLogActionScenarioRunTest',
    userLoginSuccess: 'workLogActionUserLoginSuccess',
    userLoginFailed: 'workLogActionUserLoginFailed',
    userLogout: 'workLogActionUserLogout',
    rolePermissionEdit: 'workLogActionRolePermissionEdit',
    memberPermissionChange: 'workLogActionMemberPermissionChange',
    memberInvite: 'workLogActionMemberInvite',
    roleMemberAssign: 'workLogActionRoleMemberAssign',
    workspaceCreate: 'workLogActionWorkspaceCreate',
    teamSpaceCreate: 'workLogActionTeamSpaceCreate',
    resourcePublish: 'workLogActionResourcePublish',
    resourceMove: 'workLogActionResourceMove',
    apiKeyCreate: 'workLogActionApiKeyCreate',
    modelConfigUpdate: 'workLogActionModelConfigUpdate',
    aiChainTrace: 'workLogActionAiChainTrace',
    dataAccessAudit: 'workLogActionDataAccessAudit',
    securityRiskAudit: 'workLogActionSecurityRiskAudit',
  }
  return acT(locale, keyMap[actionKey])
}

function workLogCategoryClass(category: WorkLogCategory): string {
  if (category === 'agent') return 'ac-audit-log-action--agent'
  if (category === 'scenario') return 'ac-audit-log-action--scenario'
  if (category === 'login') return 'ac-audit-log-action--login'
  if (category === 'ai-chain') return 'ac-audit-log-action--ai-chain'
  if (category === 'data-access') return 'ac-audit-log-action--data-access'
  if (category === 'security-risk') return 'ac-audit-log-action--security-risk'
  return 'ac-audit-log-action--permission'
}

function chainStepKindLabel(locale: AppLocale, kind: WorkLogConversationChainStepKind): string {
  const keyMap: Record<WorkLogConversationChainStepKind, Parameters<typeof acT>[1]> = {
    user: 'workLogChainStepUser',
    agent: 'workLogChainStepAgent',
    workflow: 'workLogChainStepWorkflow',
    tool: 'workLogChainStepTool',
  }
  return acT(locale, keyMap[kind])
}

function chainStepClass(kind: WorkLogConversationChainStepKind): string {
  return `ac-work-log-chain-step ac-work-log-chain-step--${kind}`
}

function externalToolKindLabel(locale: AppLocale, kind: WorkLogExternalToolKind): string {
  const keyMap: Record<WorkLogExternalToolKind, Parameters<typeof acT>[1]> = {
    api: 'workLogExternalToolApi',
    mcp: 'workLogExternalToolMcp',
    plugin: 'workLogExternalToolPlugin',
  }
  return acT(locale, keyMap[kind])
}

function exfiltrationRiskLabel(locale: AppLocale, risk: WorkLogExfiltrationRisk): string {
  const keyMap: Record<WorkLogExfiltrationRisk, Parameters<typeof acT>[1]> = {
    none: 'workLogRiskNone',
    low: 'workLogRiskLow',
    medium: 'workLogRiskMedium',
    high: 'workLogRiskHigh',
  }
  return acT(locale, keyMap[risk])
}

function dispositionLabel(locale: AppLocale, disposition: WorkLogSecurityDisposition): string {
  const keyMap: Record<WorkLogSecurityDisposition, Parameters<typeof acT>[1]> = {
    blocked: 'workLogDispositionBlocked',
    alerted: 'workLogDispositionAlerted',
    review: 'workLogDispositionReview',
    passed: 'workLogDispositionPassed',
  }
  return acT(locale, keyMap[disposition])
}

function appendDataAccessSearchParts(parts: string[], audit: WorkLogDataAccessAudit): void {
  if (audit.knowledgeBaseAccessed) {
    parts.push(audit.knowledgeBaseLabelZh ?? '', audit.knowledgeBaseLabelEn ?? '')
  }
  if (audit.externalToolAccessed) {
    parts.push(audit.externalToolLabelZh ?? '', audit.externalToolLabelEn ?? '')
    if (audit.externalToolKind) parts.push(audit.externalToolKind)
  }
  parts.push(audit.exfiltrationRisk, audit.riskDetailZh ?? '', audit.riskDetailEn ?? '')
}

function appendSecurityRiskSearchParts(parts: string[], audit: WorkLogSecurityRiskControl): void {
  if (audit.promptInjectionDetected) {
    parts.push('prompt injection', audit.promptInjectionDetailZh ?? '', audit.promptInjectionDetailEn ?? '')
  }
  parts.push(audit.dataLeakRisk, audit.dataLeakDetailZh ?? '', audit.dataLeakDetailEn ?? '')
  if (audit.unauthorizedToolAccess) {
    parts.push(
      audit.unauthorizedToolLabelZh ?? '',
      audit.unauthorizedToolLabelEn ?? '',
      audit.unauthorizedToolDetailZh ?? '',
      audit.unauthorizedToolDetailEn ?? '',
    )
  }
  parts.push(audit.disposition)
}

function buildEntrySearchHaystack(entry: WorkLogEntry): string {
  const parts = [
    entry.actorNameZh,
    entry.actorNameEn,
    entry.actorEmail,
    entry.targetLabelZh,
    entry.targetLabelEn,
    entry.detailZh,
    entry.detailEn,
    entry.ipAddress,
    workLogActionLabel('zh', entry.actionKey),
    workLogActionLabel('en', entry.actionKey),
  ]
  if (entry.aiChain) {
    parts.push(
      entry.aiChain.triggerAgentZh,
      entry.aiChain.triggerAgentEn,
      entry.aiChain.workflowZh,
      entry.aiChain.workflowEn,
      entry.aiChain.sessionId,
      ...entry.aiChain.conversationChain.flatMap((step) => [step.labelZh, step.labelEn]),
    )
  }
  if (entry.dataAccess) {
    appendDataAccessSearchParts(parts, entry.dataAccess)
  }
  if (entry.securityRisk) {
    appendSecurityRiskSearchParts(parts, entry.securityRisk)
  }
  return parts.join(' ').toLowerCase()
}

function filterWorkLogEntries(entries: WorkLogEntry[], tab: WorkLogTab, query: string): WorkLogEntry[] {
  const normalized = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (tab !== 'all' && entry.category !== tab) return false
    if (!normalized) return true
    return buildEntrySearchHaystack(entry).includes(normalized)
  })
}

function WorkLogActorCell({ locale, entry }: { locale: AppLocale; entry: WorkLogEntry }) {
  const name = locale === 'zh' ? entry.actorNameZh : entry.actorNameEn
  const avatar = memberAvatarColors(entry.actorId)
  const initials = memberAvatarInitials(name)

  return (
    <span className="ac-audit-log-actor" title={`${name} · ${entry.actorEmail}`}>
      <span
        className="ac-audit-log-avatar"
        style={{ background: avatar.background, color: avatar.color }}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className="ac-audit-log-actor-meta">
        <span className="ac-audit-log-actor-name">{name}</span>
        <span className="ac-audit-log-actor-email">{entry.actorEmail}</span>
      </span>
    </span>
  )
}

function WorkLogConversationChainSteps({
  locale,
  steps,
}: {
  locale: AppLocale
  steps: WorkLogConversationChainStep[]
}) {
  return (
    <>
      {steps.map((step, index) => {
        const label = locale === 'zh' ? step.labelZh : step.labelEn
        return (
          <li key={`${step.kind}-${index}-${label}`} className="ac-work-log-chain-step-item">
            {index > 0 ? (
              <span className="ac-work-log-chain-arrow" aria-hidden="true">
                →
              </span>
            ) : null}
            <span className={`${chainStepClass(step.kind)} ac-work-log-chain-step--expanded`}>
              <span className="ac-work-log-chain-step-kind">{chainStepKindLabel(locale, step.kind)}</span>
              <span className="ac-work-log-chain-step-label">{label}</span>
            </span>
          </li>
        )
      })}
    </>
  )
}

function WorkLogConversationChainCell({
  locale,
  steps,
  sessionId,
}: {
  locale: AppLocale
  steps: WorkLogConversationChainStep[]
  sessionId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const chainTitle = useMemo(
    () => steps.map((step) => (locale === 'zh' ? step.labelZh : step.labelEn)).join(' → '),
    [locale, steps],
  )

  useEffect(() => {
    if (!expanded) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  return (
    <>
      <div className="ac-work-log-chain ac-work-log-chain--inline">
        <div className="ac-work-log-chain-inline-wrap" title={chainTitle}>
          <p
            className="ac-work-log-chain-preview"
            aria-label={acT(locale, 'workLogColumnConversationChain')}
          >
            {chainTitle}
          </p>
        </div>
        <button
          type="button"
          className="ac-work-log-chain-expand-btn"
          aria-label={acT(locale, 'workLogChainExpandAria')}
          title={acT(locale, 'workLogChainExpandAria')}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded(true)
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
            <path
              d="M8 3H3v5M16 3h5v5M16 21h5v-5M8 21H3v-5M4 8V4h4M20 8V4h-4M20 16v4h-4M4 16v4h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {expanded
        ? createPortal(
            <div
              className="ac-work-log-chain-fullscreen-overlay"
              role="presentation"
              onClick={() => setExpanded(false)}
            >
              <div
                className="ac-work-log-chain-fullscreen"
                role="dialog"
                aria-modal="true"
                aria-label={acT(locale, 'workLogColumnConversationChain')}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="ac-work-log-chain-fullscreen-head">
                  <div className="ac-work-log-chain-fullscreen-meta">
                    <h3 className="ac-work-log-chain-fullscreen-title">
                      {acT(locale, 'workLogColumnConversationChain')}
                    </h3>
                    <span className="ac-work-log-chain-fullscreen-session">
                      {acT(locale, 'workLogColumnSession')}: {sessionId}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ac-modal-close ac-work-log-chain-fullscreen-close"
                    aria-label={acT(locale, 'modalClose')}
                    onClick={() => setExpanded(false)}
                  >
                    ×
                  </button>
                </div>
                <ol className="ac-work-log-chain-steps ac-work-log-chain-steps--expanded">
                  <WorkLogConversationChainSteps locale={locale} steps={steps} />
                </ol>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function WorkLogKnowledgeBaseCell({ locale, audit }: { locale: AppLocale; audit: WorkLogDataAccessAudit }) {
  if (!audit.knowledgeBaseAccessed) {
    return (
      <span className="ac-work-log-access-badge ac-work-log-access-badge--muted">
        {acT(locale, 'workLogKnowledgeBaseNotAccessed')}
      </span>
    )
  }

  const label = locale === 'zh' ? audit.knowledgeBaseLabelZh : audit.knowledgeBaseLabelEn
  return (
    <span className="ac-work-log-access-kb" title={label}>
      <span className="ac-work-log-access-badge ac-work-log-access-badge--kb">
        {acT(locale, 'workLogKnowledgeBaseAccessed')}
      </span>
      <span className="ac-work-log-access-label">{label}</span>
    </span>
  )
}

function WorkLogExternalToolCell({ locale, audit }: { locale: AppLocale; audit: WorkLogDataAccessAudit }) {
  if (!audit.externalToolAccessed || !audit.externalToolKind) {
    return (
      <span className="ac-work-log-access-badge ac-work-log-access-badge--muted">
        {acT(locale, 'workLogExternalToolNotUsed')}
      </span>
    )
  }

  const label = locale === 'zh' ? audit.externalToolLabelZh : audit.externalToolLabelEn
  return (
    <span className="ac-work-log-access-tool" title={label}>
      <span className={`ac-work-log-access-badge ac-work-log-access-badge--tool ac-work-log-access-badge--tool-${audit.externalToolKind}`}>
        {externalToolKindLabel(locale, audit.externalToolKind)}
      </span>
      <span className="ac-work-log-access-label">{label}</span>
    </span>
  )
}

function WorkLogExfiltrationRiskCell({ locale, audit }: { locale: AppLocale; audit: WorkLogDataAccessAudit }) {
  const riskDetail = locale === 'zh' ? audit.riskDetailZh : audit.riskDetailEn
  return (
    <span
      className={`ac-work-log-risk-badge ac-work-log-risk-badge--${audit.exfiltrationRisk}`}
      title={riskDetail}
    >
      {exfiltrationRiskLabel(locale, audit.exfiltrationRisk)}
    </span>
  )
}

function WorkLogPromptInjectionCell({ locale, audit }: { locale: AppLocale; audit: WorkLogSecurityRiskControl }) {
  const detail = locale === 'zh' ? audit.promptInjectionDetailZh : audit.promptInjectionDetailEn
  return (
    <span className="ac-work-log-security-flag" title={detail}>
      <span
        className={`ac-work-log-security-badge${
          audit.promptInjectionDetected
            ? ' ac-work-log-security-badge--danger'
            : ' ac-work-log-security-badge--muted'
        }`}
      >
        {audit.promptInjectionDetected
          ? acT(locale, 'workLogPromptInjectionDetected')
          : acT(locale, 'workLogPromptInjectionNotDetected')}
      </span>
      {audit.promptInjectionDetected && detail ? (
        <span className="ac-work-log-security-detail">{detail}</span>
      ) : null}
    </span>
  )
}

function WorkLogDataLeakRiskCell({ locale, audit }: { locale: AppLocale; audit: WorkLogSecurityRiskControl }) {
  const detail = locale === 'zh' ? audit.dataLeakDetailZh : audit.dataLeakDetailEn
  return (
    <span
      className={`ac-work-log-risk-badge ac-work-log-risk-badge--${audit.dataLeakRisk}`}
      title={detail}
    >
      {exfiltrationRiskLabel(locale, audit.dataLeakRisk)}
    </span>
  )
}

function WorkLogUnauthorizedToolCell({ locale, audit }: { locale: AppLocale; audit: WorkLogSecurityRiskControl }) {
  const detail = locale === 'zh' ? audit.unauthorizedToolDetailZh : audit.unauthorizedToolDetailEn
  const label = locale === 'zh' ? audit.unauthorizedToolLabelZh : audit.unauthorizedToolLabelEn
  return (
    <span className="ac-work-log-security-flag" title={detail}>
      <span
        className={`ac-work-log-security-badge${
          audit.unauthorizedToolAccess
            ? ' ac-work-log-security-badge--warning'
            : ' ac-work-log-security-badge--muted'
        }`}
      >
        {audit.unauthorizedToolAccess
          ? acT(locale, 'workLogUnauthorizedToolDetected')
          : acT(locale, 'workLogUnauthorizedToolNotDetected')}
      </span>
      {audit.unauthorizedToolAccess && label ? (
        <span className="ac-work-log-security-detail">{label}</span>
      ) : null}
    </span>
  )
}

function WorkLogDispositionCell({ locale, audit }: { locale: AppLocale; audit: WorkLogSecurityRiskControl }) {
  return (
    <span className={`ac-work-log-disposition-badge ac-work-log-disposition-badge--${audit.disposition}`}>
      {dispositionLabel(locale, audit.disposition)}
    </span>
  )
}

function WorkLogStandardTable({
  locale,
  entries,
}: {
  locale: AppLocale
  entries: WorkLogEntry[]
}) {
  return (
    <div className="ac-audit-log-table ac-audit-log-table--work-log" role="table">
      <div className="ac-audit-log-table-head" role="rowgroup">
        <div className="ac-audit-log-table-row ac-audit-log-table-row--head" role="row">
          <span role="columnheader">{acT(locale, 'workLogColumnTime')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnActor')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnAction')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnTarget')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnIp')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnDetail')}</span>
        </div>
      </div>
      <div className="ac-audit-log-table-body ac-audit-log-table-body--rows" role="rowgroup">
        {entries.length === 0 ? (
          <div className="ac-audit-log-empty" role="row">
            <p>{acT(locale, 'workLogEmpty')}</p>
          </div>
        ) : (
          entries.map((entry) => {
            const detail = locale === 'zh' ? entry.detailZh : entry.detailEn
            return (
              <div
                key={entry.id}
                className="ac-audit-log-table-row ac-audit-log-table-row--body"
                role="row"
              >
                <span role="cell" className="ac-audit-log-cell-time" title={entry.occurredAt}>
                  {formatWorkLogTimestamp(entry.occurredAt, locale)}
                </span>
                <span role="cell">
                  <WorkLogActorCell locale={locale} entry={entry} />
                </span>
                <span role="cell">
                  <span className="ac-audit-log-action-wrap">
                    <span className={`ac-audit-log-action ${workLogCategoryClass(entry.category)}`}>
                      {workLogActionLabel(locale, entry.actionKey)}
                    </span>
                  </span>
                </span>
                <span
                  role="cell"
                  className="ac-audit-log-cell-text"
                  title={locale === 'zh' ? entry.targetLabelZh : entry.targetLabelEn}
                >
                  {locale === 'zh' ? entry.targetLabelZh : entry.targetLabelEn}
                </span>
                <span role="cell" className="ac-audit-log-cell-ip" title={entry.ipAddress}>
                  {entry.ipAddress}
                </span>
                <span role="cell" className="ac-audit-log-cell-detail" title={detail}>
                  {detail}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function WorkLogAiChainTable({
  locale,
  entries,
}: {
  locale: AppLocale
  entries: WorkLogEntry[]
}) {
  const chainEntries = entries.filter((entry) => entry.aiChain)

  return (
    <div className="ac-audit-log-table ac-audit-log-table--work-log ac-audit-log-table--ai-chain" role="table">
      <div className="ac-audit-log-table-head" role="rowgroup">
        <div className="ac-audit-log-table-row ac-audit-log-table-row--head" role="row">
          <span role="columnheader">{acT(locale, 'workLogColumnTime')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnTriggerAgent')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnWorkflow')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnConversationChain')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnActor')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnIp')}</span>
        </div>
      </div>
      <div className="ac-audit-log-table-body ac-audit-log-table-body--rows" role="rowgroup">
        {chainEntries.length === 0 ? (
          <div className="ac-audit-log-empty" role="row">
            <p>{acT(locale, 'workLogAiChainEmpty')}</p>
          </div>
        ) : (
          chainEntries.map((entry) => {
            const chain = entry.aiChain!
            return (
              <div
                key={entry.id}
                className="ac-audit-log-table-row ac-audit-log-table-row--body ac-audit-log-table-row--ai-chain ac-audit-log-table-row--clickable"
                role="row"
                tabIndex={0}
                onClick={() => navigateScenarioTrace(chain.workflowEn, chain.sessionId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigateScenarioTrace(chain.workflowEn, chain.sessionId)
                  }
                }}
              >
                <span role="cell" className="ac-audit-log-cell-time" title={entry.occurredAt}>
                  {formatWorkLogTimestamp(entry.occurredAt, locale)}
                </span>
                <span
                  role="cell"
                  className="ac-audit-log-cell-text ac-work-log-chain-trigger"
                  title={locale === 'zh' ? chain.triggerAgentZh : chain.triggerAgentEn}
                >
                  {locale === 'zh' ? chain.triggerAgentZh : chain.triggerAgentEn}
                </span>
                <span role="cell" className="ac-work-log-chain-workflow" title={chain.workflowEn}>
                  <span className="ac-work-log-chain-workflow-badge">
                    {locale === 'zh' ? chain.workflowZh : chain.workflowEn}
                  </span>
                </span>
                <span role="cell" className="ac-work-log-chain-cell">
                  <WorkLogConversationChainCell
                    locale={locale}
                    steps={chain.conversationChain}
                    sessionId={chain.sessionId}
                  />
                </span>
                <span role="cell">
                  <WorkLogActorCell locale={locale} entry={entry} />
                </span>
                <span role="cell" className="ac-audit-log-cell-ip" title={entry.ipAddress}>
                  {entry.ipAddress}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function WorkLogDataAccessTable({
  locale,
  entries,
}: {
  locale: AppLocale
  entries: WorkLogEntry[]
}) {
  const auditEntries = entries.filter((entry) => entry.dataAccess)

  return (
    <div className="ac-audit-log-table ac-audit-log-table--work-log ac-audit-log-table--data-access" role="table">
      <div className="ac-audit-log-table-head" role="rowgroup">
        <div className="ac-audit-log-table-row ac-audit-log-table-row--head" role="row">
          <span role="columnheader">{acT(locale, 'workLogColumnTime')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnActor')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnTarget')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnKnowledgeBase')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnExternalTool')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnExfiltrationRisk')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnIp')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnDetail')}</span>
        </div>
      </div>
      <div className="ac-audit-log-table-body ac-audit-log-table-body--rows" role="rowgroup">
        {auditEntries.length === 0 ? (
          <div className="ac-audit-log-empty" role="row">
            <p>{acT(locale, 'workLogDataAccessEmpty')}</p>
          </div>
        ) : (
          auditEntries.map((entry) => {
            const audit = entry.dataAccess!
            const detail = locale === 'zh' ? entry.detailZh : entry.detailEn
            return (
              <div
                key={entry.id}
                className="ac-audit-log-table-row ac-audit-log-table-row--body ac-audit-log-table-row--data-access"
                role="row"
              >
                <span role="cell" className="ac-audit-log-cell-time" title={entry.occurredAt}>
                  {formatWorkLogTimestamp(entry.occurredAt, locale)}
                </span>
                <span role="cell">
                  <WorkLogActorCell locale={locale} entry={entry} />
                </span>
                <span
                  role="cell"
                  className="ac-audit-log-cell-text"
                  title={locale === 'zh' ? entry.targetLabelZh : entry.targetLabelEn}
                >
                  {locale === 'zh' ? entry.targetLabelZh : entry.targetLabelEn}
                </span>
                <span role="cell">
                  <WorkLogKnowledgeBaseCell locale={locale} audit={audit} />
                </span>
                <span role="cell">
                  <WorkLogExternalToolCell locale={locale} audit={audit} />
                </span>
                <span role="cell">
                  <WorkLogExfiltrationRiskCell locale={locale} audit={audit} />
                </span>
                <span role="cell" className="ac-audit-log-cell-ip" title={entry.ipAddress}>
                  {entry.ipAddress}
                </span>
                <span role="cell" className="ac-audit-log-cell-detail" title={detail}>
                  {detail}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function WorkLogSecurityRiskTable({
  locale,
  entries,
}: {
  locale: AppLocale
  entries: WorkLogEntry[]
}) {
  const securityEntries = entries.filter((entry) => entry.securityRisk)

  return (
    <div className="ac-audit-log-table ac-audit-log-table--work-log ac-audit-log-table--security-risk" role="table">
      <div className="ac-audit-log-table-head" role="rowgroup">
        <div className="ac-audit-log-table-row ac-audit-log-table-row--head" role="row">
          <span role="columnheader">{acT(locale, 'workLogColumnTime')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnActor')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnTarget')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnPromptInjection')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnDataLeakRisk')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnUnauthorizedTool')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnDisposition')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnIp')}</span>
          <span role="columnheader">{acT(locale, 'workLogColumnDetail')}</span>
        </div>
      </div>
      <div className="ac-audit-log-table-body ac-audit-log-table-body--rows" role="rowgroup">
        {securityEntries.length === 0 ? (
          <div className="ac-audit-log-empty" role="row">
            <p>{acT(locale, 'workLogSecurityRiskEmpty')}</p>
          </div>
        ) : (
          securityEntries.map((entry) => {
            const audit = entry.securityRisk!
            const detail = locale === 'zh' ? entry.detailZh : entry.detailEn
            return (
              <div
                key={entry.id}
                className="ac-audit-log-table-row ac-audit-log-table-row--body ac-audit-log-table-row--security-risk"
                role="row"
              >
                <span role="cell" className="ac-audit-log-cell-time" title={entry.occurredAt}>
                  {formatWorkLogTimestamp(entry.occurredAt, locale)}
                </span>
                <span role="cell">
                  <WorkLogActorCell locale={locale} entry={entry} />
                </span>
                <span
                  role="cell"
                  className="ac-audit-log-cell-text"
                  title={locale === 'zh' ? entry.targetLabelZh : entry.targetLabelEn}
                >
                  {locale === 'zh' ? entry.targetLabelZh : entry.targetLabelEn}
                </span>
                <span role="cell">
                  <WorkLogPromptInjectionCell locale={locale} audit={audit} />
                </span>
                <span role="cell">
                  <WorkLogDataLeakRiskCell locale={locale} audit={audit} />
                </span>
                <span role="cell">
                  <WorkLogUnauthorizedToolCell locale={locale} audit={audit} />
                </span>
                <span role="cell">
                  <WorkLogDispositionCell locale={locale} audit={audit} />
                </span>
                <span role="cell" className="ac-audit-log-cell-ip" title={entry.ipAddress}>
                  {entry.ipAddress}
                </span>
                <span role="cell" className="ac-audit-log-cell-detail" title={detail}>
                  {detail}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export function WorkLogView({ locale, searchQuery, entries }: WorkLogViewProps) {
  const [activeTab, setActiveTab] = useState<WorkLogTab>('all')

  const filteredEntries = useMemo(
    () => filterWorkLogEntries(entries, activeTab, searchQuery),
    [activeTab, entries, searchQuery],
  )

  const tabs: Array<{ id: WorkLogTab; labelKey: Parameters<typeof acT>[1] }> = [
    { id: 'all', labelKey: 'workLogTabAll' },
    { id: 'agent', labelKey: 'workLogTabAgent' },
    { id: 'scenario', labelKey: 'workLogTabScenario' },
    { id: 'login', labelKey: 'workLogTabLogin' },
    { id: 'operation', labelKey: 'workLogTabOperation' },
    { id: 'ai-chain', labelKey: 'workLogTabAiChain' },
    { id: 'data-access', labelKey: 'workLogTabDataAccess' },
    { id: 'security-risk', labelKey: 'workLogTabSecurityRisk' },
  ]

  return (
    <section className="ac-section ac-audit-log-section">
      <div className="ac-audit-log-panel">
        <div className="ac-audit-log-tabs" role="tablist" aria-label={acT(locale, 'sectionTitleWorkLog')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={`ac-audit-log-tab${activeTab === tab.id ? ' is-active' : ''}`}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {acT(locale, tab.labelKey)}
            </button>
          ))}
        </div>

        {activeTab === 'ai-chain' ? (
          <WorkLogAiChainTable locale={locale} entries={filteredEntries} />
        ) : activeTab === 'data-access' ? (
          <WorkLogDataAccessTable locale={locale} entries={filteredEntries} />
        ) : activeTab === 'security-risk' ? (
          <WorkLogSecurityRiskTable locale={locale} entries={filteredEntries} />
        ) : (
          <WorkLogStandardTable locale={locale} entries={filteredEntries} />
        )}
      </div>
    </section>
  )
}
