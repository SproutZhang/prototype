import { useEffect, useId, useRef, useState } from 'react'
import {
  buildPublishVersionListItems,
  formatPublishVersionLabel,
  type PublishVersionDateKey,
  type PublishVersionListItem,
  type ScenarioPublishVersion,
} from '../data/scenarioPublishVersions'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT, type ScenarioStringKey } from '../i18n/scenarioStrings'

type ScenarioPublishVersionDrawerProps = {
  open: boolean
  locale: AppLocale
  versions: ScenarioPublishVersion[]
  onClose: () => void
}

const DATE_LABEL_KEY: Record<PublishVersionDateKey, ScenarioStringKey> = {
  jun8: 'publishVersionDateJun8',
  may28: 'publishVersionDateMay28',
  today: 'publishVersionDateToday',
}

export function ScenarioPublishVersionDrawer({
  open,
  locale,
  versions,
  onClose,
}: ScenarioPublishVersionDrawerProps) {
  const headingId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const items = buildPublishVersionListItems(versions)

  return (
    <aside
      className="scenario-collect-drawer scenario-publish-version-drawer"
      aria-labelledby={headingId}
    >
      <div className="scenario-collect-drawer-header">
        <h2 id={headingId} className="scenario-collect-drawer-title">
          {scenarioT(locale, 'publishVersionDrawerTitle')}
        </h2>
        <button
          type="button"
          className="scenario-collect-drawer-close"
          aria-label={scenarioT(locale, 'close')}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="scenario-collect-drawer-body">
        {items.length === 0 ? (
          <p className="scenario-publish-version-drawer__empty">{scenarioT(locale, 'publishVersionEmpty')}</p>
        ) : (
          items.map((item) => (
            <PublishVersionRow key={getPublishVersionItemKey(item)} locale={locale} item={item} />
          ))
        )}
      </div>
    </aside>
  )
}

function getPublishVersionItemKey(item: PublishVersionListItem): string {
  if (item.type === 'date') return `date-${item.dateKey}`
  return item.version.id
}

function PublishVersionRow({ locale, item }: { locale: AppLocale; item: PublishVersionListItem }) {
  if (item.type === 'date') {
    return (
      <h3 className="scenario-publish-version-drawer__date">
        {scenarioT(locale, DATE_LABEL_KEY[item.dateKey])}
      </h3>
    )
  }

  const { version } = item
  const versionLabel = formatPublishVersionLabel(version)
  const actionText = scenarioT(locale, 'publishVersionPublishedAction').replace('{version}', versionLabel)
  const summary = locale === 'zh' ? version.summaryZh : version.summaryEn
  const migrationNote =
    version.bump === 'major'
      ? locale === 'zh'
        ? version.migrationNoteZh
        : version.migrationNoteEn
      : undefined

  return (
    <article className="scenario-publish-version-drawer__entry">
      <div className="scenario-publish-version-drawer__entry-avatar" aria-hidden="true">
        {version.publisherInitial}
      </div>
      <div className="scenario-publish-version-drawer__entry-main">
        <div className="scenario-publish-version-drawer__entry-meta">
          <time className="scenario-publish-version-drawer__entry-time">{version.time}</time>
          <span className="scenario-publish-version-drawer__entry-user">{version.publisherName}</span>
          {version.isCurrent ? (
            <span className="scenario-publish-version-drawer__current-badge">
              {scenarioT(locale, 'publishVersionCurrentBadge')}
            </span>
          ) : null}
        </div>
        <p className="scenario-publish-version-drawer__entry-action">{actionText}</p>
        {summary ? <p className="scenario-publish-version-drawer__entry-summary">{summary}</p> : null}
        {migrationNote ? (
          <p className="scenario-publish-version-drawer__entry-migration">{migrationNote}</p>
        ) : null}
        <div className="scenario-publish-version-drawer__version-tag">{versionLabel}</div>
      </div>
      <PublishVersionEntryMore locale={locale} />
    </article>
  )
}

function PublishVersionEntryMore({ locale }: { locale: AppLocale }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div
      ref={wrapRef}
      className={open ? 'scenario-publish-version-drawer__entry-more-wrap is-open' : 'scenario-publish-version-drawer__entry-more-wrap'}
    >
      <button
        type="button"
        className="scenario-publish-version-drawer__entry-more-btn"
        aria-label={scenarioT(locale, 'publishVersionEntryActions')}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="12" cy="6" r="1.75" fill="currentColor" />
          <circle cx="12" cy="12" r="1.75" fill="currentColor" />
          <circle cx="12" cy="18" r="1.75" fill="currentColor" />
        </svg>
      </button>
      <div
        className="scenario-publish-version-drawer__entry-more-popover"
        role="tooltip"
        aria-hidden="true"
      >
        <p className="scenario-publish-version-drawer__entry-more-title">
          {scenarioT(locale, 'publishVersionRestore')}
        </p>
        <p className="scenario-publish-version-drawer__entry-more-hint">
          {scenarioT(locale, 'publishVersionRestoreHint')}
        </p>
      </div>
    </div>
  )
}
