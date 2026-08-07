import { useEffect, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import type { SectionIterationRecord } from '../types/sectionIteration'
import {
  formatChangelogTime,
  groupRecordsByDate,
} from '../utils/sectionIterationSync'
import { SectionIterationBumpBadge } from './SectionIterationBumpBadge'

type SectionIterationTimelineProps = {
  locale: AppLocale
  records: SectionIterationRecord[]
  variant?: 'default' | 'publish-drawer'
  rollbackable?: boolean
  onRollback?: (record: SectionIterationRecord) => void
}

export function SectionIterationTimeline({
  locale,
  records,
  variant = 'default',
  rollbackable = false,
  onRollback,
}: SectionIterationTimelineProps) {
  if (variant === 'publish-drawer') {
    return (
      <SectionIterationPublishDrawerTimeline
        locale={locale}
        records={records}
        rollbackable={rollbackable}
        onRollback={onRollback}
      />
    )
  }

  const groups = groupRecordsByDate(records, locale)

  if (records.length === 0) {
    return <div className="skills-empty tcs-changelog-empty">{tcsT(locale, 'changelogEmpty')}</div>
  }

  return (
    <div className="tcs-changelog-timeline" aria-label={tcsT(locale, 'changelogDetailTimelineAria')}>
      {groups.map((group) => (
        <section key={group.dateLabel} className="tcs-changelog-timeline-group">
          <h3 className="tcs-changelog-timeline-date">{group.dateLabel}</h3>
          <ul className="tcs-changelog-timeline-list">
            {group.records.map((record) => (
              <SectionIterationTimelineEntry
                key={record.id}
                locale={locale}
                record={record}
                rollbackable={rollbackable}
                onRollback={onRollback}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function SectionIterationPublishDrawerTimeline({
  locale,
  records,
  rollbackable = false,
  onRollback,
}: {
  locale: AppLocale
  records: SectionIterationRecord[]
  rollbackable?: boolean
  onRollback?: (record: SectionIterationRecord) => void
}) {
  const groups = groupRecordsByDate(records, locale)

  if (records.length === 0) {
    return <p className="scenario-publish-version-drawer__empty">{tcsT(locale, 'changelogEmpty')}</p>
  }

  return (
    <div aria-label={tcsT(locale, 'changelogDetailTimelineAria')}>
      {groups.map((group) => (
        <section key={group.dateLabel}>
          <h3 className="scenario-publish-version-drawer__date">{group.dateLabel}</h3>
          {group.records.map((record) => (
            <SectionIterationPublishDrawerEntry
              key={record.id}
              locale={locale}
              record={record}
              rollbackable={rollbackable}
              onRollback={onRollback}
            />
          ))}
        </section>
      ))}
    </div>
  )
}

function SectionIterationPublishDrawerEntry({
  locale,
  record,
  rollbackable = false,
  onRollback,
}: {
  locale: AppLocale
  record: SectionIterationRecord
  rollbackable?: boolean
  onRollback?: (record: SectionIterationRecord) => void
}) {
  const summary = locale === 'zh' ? record.summaryZh : record.summaryEn
  const migrationNote =
    record.bump === 'major'
      ? locale === 'zh'
        ? record.migrationNoteZh
        : record.migrationNoteEn
      : undefined
  const actionText = tcsT(locale, 'changelogPublishedAction').replace('{version}', record.versionLabel)
  const showRestore = rollbackable && !record.isCurrent && onRollback != null

  return (
    <article className="scenario-publish-version-drawer__entry">
      <div className="scenario-publish-version-drawer__entry-avatar" aria-hidden="true">
        {record.publisherName.slice(0, 1).toUpperCase()}
      </div>
      <div className="scenario-publish-version-drawer__entry-main">
        <div className="scenario-publish-version-drawer__entry-meta">
          <time className="scenario-publish-version-drawer__entry-time">
            {formatChangelogTime(record.publishedAt, locale)}
          </time>
          <span className="scenario-publish-version-drawer__entry-user">{record.publisherName}</span>
          {record.isCurrent ? (
            <span className="scenario-publish-version-drawer__current-badge">
              {tcsT(locale, 'changelogCurrentBadge')}
            </span>
          ) : null}
        </div>
        <p className="scenario-publish-version-drawer__entry-action">{actionText}</p>
        {summary ? <p className="scenario-publish-version-drawer__entry-summary">{summary}</p> : null}
        {migrationNote ? (
          <p className="scenario-publish-version-drawer__entry-migration">{migrationNote}</p>
        ) : null}
        <div className="scenario-publish-version-drawer__version-tag">{record.versionLabel}</div>
      </div>
      {showRestore ? (
        <SectionIterationPublishDrawerEntryMore
          locale={locale}
          record={record}
          onRestore={() => onRollback?.(record)}
        />
      ) : null}
    </article>
  )
}

function SectionIterationPublishDrawerEntryMore({
  locale,
  record,
  onRestore,
}: {
  locale: AppLocale
  record: SectionIterationRecord
  onRestore: () => void
}) {
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
      className={
        open
          ? 'scenario-publish-version-drawer__entry-more-wrap is-open'
          : 'scenario-publish-version-drawer__entry-more-wrap'
      }
    >
      <button
        type="button"
        className="scenario-publish-version-drawer__entry-more-btn"
        aria-label={tcsT(locale, 'resourceIterationRollback')}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="12" cy="6" r="1.75" fill="currentColor" />
          <circle cx="12" cy="12" r="1.75" fill="currentColor" />
          <circle cx="12" cy="18" r="1.75" fill="currentColor" />
        </svg>
      </button>
      <div className="scenario-publish-version-drawer__entry-more-popover" role="menu">
        <button
          type="button"
          className="scenario-publish-version-drawer__entry-more-title tcs-iteration-restore-action"
          role="menuitem"
          onClick={() => {
            setOpen(false)
            onRestore()
          }}
        >
          {tcsT(locale, 'resourceIterationRollback')}
        </button>
        <p className="scenario-publish-version-drawer__entry-more-hint">
          {tcsT(locale, 'resourceIterationRollbackHint').replace('{version}', record.versionLabel)}
        </p>
      </div>
    </div>
  )
}

function SectionIterationTimelineEntry({
  locale,
  record,
  rollbackable = false,
  onRollback,
}: {
  locale: AppLocale
  record: SectionIterationRecord
  rollbackable?: boolean
  onRollback?: (record: SectionIterationRecord) => void
}) {
  const summary = locale === 'zh' ? record.summaryZh : record.summaryEn
  const migrationNote =
    record.bump === 'major'
      ? locale === 'zh'
        ? record.migrationNoteZh
        : record.migrationNoteEn
      : undefined

  return (
    <li className="tcs-changelog-timeline-entry">
      <div className="tcs-changelog-timeline-entry-avatar" aria-hidden="true">
        {record.publisherName.slice(0, 1).toUpperCase()}
      </div>
      <article className="tcs-changelog-timeline-entry-main">
        <div className="tcs-changelog-timeline-entry-head">
          <div className="tcs-changelog-timeline-entry-meta">
            <time className="tcs-changelog-timeline-entry-time">
              {formatChangelogTime(record.publishedAt, locale)}
            </time>
            <span className="tcs-changelog-timeline-entry-user">{record.publisherName}</span>
            {record.isCurrent ? (
              <span className="tcs-changelog-current-badge">{tcsT(locale, 'changelogCurrentBadge')}</span>
            ) : null}
          </div>
          <div className="tcs-changelog-timeline-entry-tags">
            <span className="tcs-changelog-version-tag">{record.versionLabel}</span>
            <SectionIterationBumpBadge
              locale={locale}
              bump={record.bump}
              requiresMigration={record.requiresMigration}
            />
          </div>
        </div>

        <p className="tcs-changelog-timeline-entry-summary">{summary}</p>

        {migrationNote ? (
          <div className="tcs-changelog-migration-note">
            <strong>{tcsT(locale, 'changelogMigrationNoteTitle')}</strong>
            <p>{migrationNote}</p>
          </div>
        ) : record.backwardCompatible && record.bump !== 'patch' ? (
          <p className="tcs-changelog-compatible-hint">{tcsT(locale, 'changelogBackwardCompatible')}</p>
        ) : null}

        {record.changeItems.length > 0 ? (
          <div className="tcs-changelog-change-items">
            <strong>{tcsT(locale, 'changelogChangeItemsTitle')}</strong>
            <ul>
              {record.changeItems.map((item, index) => (
                <li key={`${record.id}-change-${index}`}>
                  {locale === 'zh' ? item.descriptionZh : item.descriptionEn}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {rollbackable && !record.isCurrent && onRollback ? (
          <div className="tcs-changelog-timeline-entry-actions">
            <button
              type="button"
              className="agents-btn agents-btn-secondary tcs-changelog-rollback-btn"
              onClick={() => onRollback(record)}
            >
              {tcsT(locale, 'resourceIterationRollback')}
            </button>
          </div>
        ) : null}
      </article>
    </li>
  )
}
