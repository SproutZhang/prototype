import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buildScenarioActivityRunLabel,
  getScenarioActivityLogGroups,
  type ActivityLogEntry,
  type ActivityLogGroup,
} from '../data/scenarioActivityLog'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT, type ScenarioStringKey } from '../i18n/scenarioStrings'

type ScenarioActivityLogModalProps = {
  open: boolean
  locale: AppLocale
  scenarioName: string
  onClose: () => void
}

const ACTIVITY_LABEL_KEY: Record<ActivityLogEntry['activityKey'], ScenarioStringKey> = {
  automationError: 'activityLogAutomationError',
  automationCompleted: 'activityLogAutomationCompleted',
  humanStepCompleted: 'activityLogHumanStepCompleted',
  waitCompleted: 'activityLogWaitCompleted',
  aiStepCompleted: 'activityLogAiStepCompleted',
  pathSelected: 'activityLogPathSelected',
  notification: 'activityLogNotification',
  runUpgraded: 'activityLogRunUpgraded',
}

const EXPAND_BODY_KEY: Record<ActivityLogEntry['activityKey'], ScenarioStringKey> = {
  automationError: 'activityLogAutomationVerifyFailed',
  automationCompleted: 'activityLogExpandAutomationCompleted',
  humanStepCompleted: 'activityLogExpandHumanStepCompleted',
  waitCompleted: 'activityLogExpandWaitCompleted',
  aiStepCompleted: 'activityLogExpandAiStepCompleted',
  pathSelected: 'activityLogExpandPathSelected',
  notification: 'activityLogExpandNotification',
  runUpgraded: 'activityLogExpandRunUpgraded',
}

const DATE_LABEL_KEY: Record<ActivityLogGroup['dateKey'], ScenarioStringKey> = {
  may25: 'activityLogDateMay25',
  may19: 'activityLogDateMay19',
}

type ActivityLogIssuesExpandable = Extract<
  NonNullable<ActivityLogEntry['expandable']>,
  { kind: 'issues' }
>

const ISSUE_LABEL_KEY = {
  fieldOnboardingDateMissing: 'activityLogFieldOnboardingDateMissing',
  fieldEmployeeNameMissing: 'activityLogFieldEmployeeNameMissing',
} as const satisfies Record<ActivityLogIssuesExpandable['issueKeys'][number], ScenarioStringKey>

function MatchedBadge({ locale }: { locale: AppLocale }) {
  return (
    <span className="scenario-activity-log-modal__path-badge scenario-activity-log-modal__path-badge--matched">
      {scenarioT(locale, 'activityLogPathMatchBadgeMatched')}
    </span>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      className={expanded ? 'scenario-activity-log-modal__chevron is-expanded' : 'scenario-activity-log-modal__chevron'}
    >
      <path
        d="M6 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ScenarioActivityLogModal({
  open,
  locale,
  scenarioName,
  onClose,
}: ScenarioActivityLogModalProps) {
  const headingId = useId()
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setExpandedEntryId(null)
  }, [open, scenarioName])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const groups = getScenarioActivityLogGroups(locale)
  const runLabel = buildScenarioActivityRunLabel(scenarioName, locale)

  const resolveDetails = (entry: ActivityLogEntry) => scenarioT(locale, entry.detailsKey)

  return createPortal(
    <div
      className="scenario-activity-log-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <button
        type="button"
        className="scenario-activity-log-modal__backdrop"
        aria-label={scenarioT(locale, 'close')}
        onClick={onClose}
      />
      <div className="scenario-activity-log-modal__panel">
        <header className="scenario-activity-log-modal__header">
          <h2 id={headingId} className="scenario-activity-log-modal__title">
            {scenarioT(locale, 'activityLogModalTitle')}
          </h2>
          <button
            type="button"
            className="scenario-activity-log-modal__close"
            aria-label={scenarioT(locale, 'close')}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="scenario-activity-log-modal__body">
          <table className="scenario-activity-log-modal__table">
            <thead>
              <tr>
                <th className="scenario-activity-log-modal__th scenario-activity-log-modal__th--toggle" aria-hidden="true" />
                <th className="scenario-activity-log-modal__th">{scenarioT(locale, 'activityLogColTime')}</th>
                <th className="scenario-activity-log-modal__th">{scenarioT(locale, 'activityLogColActivity')}</th>
                <th className="scenario-activity-log-modal__th">{scenarioT(locale, 'activityLogColRun')}</th>
                <th className="scenario-activity-log-modal__th">{scenarioT(locale, 'activityLogColStep')}</th>
                <th className="scenario-activity-log-modal__th">{scenarioT(locale, 'activityLogColDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupRows
                  key={group.dateKey}
                  locale={locale}
                  group={group}
                  runLabel={runLabel}
                  expandedEntryId={expandedEntryId}
                  onToggleExpand={setExpandedEntryId}
                  resolveDetails={resolveDetails}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function GroupRows({
  locale,
  group,
  runLabel,
  expandedEntryId,
  onToggleExpand,
  resolveDetails,
}: {
  locale: AppLocale
  group: ActivityLogGroup
  runLabel: string
  expandedEntryId: string | null
  onToggleExpand: (id: string | null) => void
  resolveDetails: (entry: ActivityLogEntry) => string
}) {
  return (
    <>
      <tr className="scenario-activity-log-modal__date-row">
        <td colSpan={6}>{scenarioT(locale, DATE_LABEL_KEY[group.dateKey])}</td>
      </tr>
      {group.entries.map((entry) => {
        const expanded = expandedEntryId === entry.id
        const details = resolveDetails(entry)

        return (
          <EntryRows
            key={entry.id}
            locale={locale}
            entry={entry}
            runLabel={runLabel}
            expanded={expanded}
            details={details}
            onToggle={() => onToggleExpand(expanded ? null : entry.id)}
          />
        )
      })}
    </>
  )
}

function EntryRows({
  locale,
  entry,
  runLabel,
  expanded,
  details,
  onToggle,
}: {
  locale: AppLocale
  entry: ActivityLogEntry
  runLabel: string
  expanded: boolean
  details: string
  onToggle: () => void
}) {
  const badgeClass =
    entry.tone === 'error'
      ? 'scenario-activity-log-modal__badge scenario-activity-log-modal__badge--error'
      : entry.tone === 'success'
        ? 'scenario-activity-log-modal__badge scenario-activity-log-modal__badge--success'
        : 'scenario-activity-log-modal__badge scenario-activity-log-modal__badge--neutral'

  return (
    <>
      <tr className="scenario-activity-log-modal__row">
        <td className="scenario-activity-log-modal__cell scenario-activity-log-modal__cell--toggle">
          <button
            type="button"
            className="scenario-activity-log-modal__toggle"
            aria-expanded={expanded}
            aria-label={expanded ? scenarioT(locale, 'close') : scenarioT(locale, 'activityLogColDetails')}
            onClick={onToggle}
          >
            <ChevronIcon expanded={expanded} />
          </button>
        </td>
        <td className="scenario-activity-log-modal__cell scenario-activity-log-modal__cell--time">{entry.time}</td>
        <td className="scenario-activity-log-modal__cell">
          <span className={badgeClass}>{scenarioT(locale, ACTIVITY_LABEL_KEY[entry.activityKey])}</span>
        </td>
        <td className="scenario-activity-log-modal__cell scenario-activity-log-modal__cell--run">{runLabel}</td>
        <td className="scenario-activity-log-modal__cell scenario-activity-log-modal__cell--step">{entry.step}</td>
        <td className="scenario-activity-log-modal__cell scenario-activity-log-modal__cell--details">{details}</td>
      </tr>
      {expanded ? (
        <tr className="scenario-activity-log-modal__expand-row">
          <td colSpan={6}>
            <ExpandPanel locale={locale} entry={entry} runLabel={runLabel} details={details} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

function PathRuleMatchExpandPanel({ locale }: { locale: AppLocale }) {
  return (
    <div className="scenario-activity-log-modal__expand-panel scenario-activity-log-modal__expand-panel--path-match">
      <p className="scenario-activity-log-modal__path-match-summary">
        {scenarioT(locale, 'activityLogPathMatchSummary')}
      </p>
      <div className="scenario-activity-log-modal__path-match-row">
        <span>{scenarioT(locale, 'activityLogPathMatchPathLine')}</span>
        <MatchedBadge locale={locale} />
      </div>
      <div className="scenario-activity-log-modal__path-match-row scenario-activity-log-modal__path-match-row--indent">
        <span>{scenarioT(locale, 'activityLogPathMatchBlock')}</span>
        <MatchedBadge locale={locale} />
      </div>
      <div className="scenario-activity-log-modal__path-match-condition">
        <div className="scenario-activity-log-modal__path-match-condition-row">
          <span>{scenarioT(locale, 'activityLogPathMatchCheckingValue')}</span>
          <span className="scenario-activity-log-modal__path-badge scenario-activity-log-modal__path-badge--approval">
            {scenarioT(locale, 'activityLogPathMatchApprovalLabel')}
          </span>
        </div>
        <div className="scenario-activity-log-modal__path-match-condition-value">
          {scenarioT(locale, 'activityLogPathMatchApproveValue')}
        </div>
        <div className="scenario-activity-log-modal__path-match-condition-row">
          <span>
            {scenarioT(locale, 'activityLogPathMatchIs')}{' '}
            <strong>{scenarioT(locale, 'activityLogPathMatchApproveValue')}</strong>
          </span>
          <MatchedBadge locale={locale} />
        </div>
      </div>
    </div>
  )
}

function ExpandPanel({
  locale,
  entry,
  runLabel,
  details,
}: {
  locale: AppLocale
  entry: ActivityLogEntry
  runLabel: string
  details: string
}) {
  if (entry.expandable?.kind === 'pathRuleMatch') {
    return <PathRuleMatchExpandPanel locale={locale} />
  }

  if (entry.expandable?.kind === 'issues') {
    return (
      <div className="scenario-activity-log-modal__expand-panel">
        <p className="scenario-activity-log-modal__expand-summary">
          {scenarioT(locale, 'activityLogAutomationVerifyFailed')}
        </p>
        <div className="scenario-activity-log-modal__expand-issues-title">
          {scenarioT(locale, 'activityLogIssuesTitle')}
        </div>
        <ul className="scenario-activity-log-modal__expand-issues">
          {entry.expandable.issueKeys.map((issueKey) => (
            <li key={issueKey}>{scenarioT(locale, ISSUE_LABEL_KEY[issueKey])}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="scenario-activity-log-modal__expand-panel">
      <p className="scenario-activity-log-modal__expand-summary">
        {scenarioT(locale, EXPAND_BODY_KEY[entry.activityKey])}
      </p>
      {details ? <p className="scenario-activity-log-modal__expand-detail">{details}</p> : null}
      <dl className="scenario-activity-log-modal__expand-meta">
        <div className="scenario-activity-log-modal__expand-meta-row">
          <dt>{scenarioT(locale, 'activityLogColTime')}</dt>
          <dd>{entry.time}</dd>
        </div>
        <div className="scenario-activity-log-modal__expand-meta-row">
          <dt>{scenarioT(locale, 'activityLogColRun')}</dt>
          <dd>{runLabel}</dd>
        </div>
        {entry.step ? (
          <div className="scenario-activity-log-modal__expand-meta-row">
            <dt>{scenarioT(locale, 'activityLogColStep')}</dt>
            <dd>{entry.step}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
