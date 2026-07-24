import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { getScenarioEditHistoryItems, type EditHistoryAction, type EditHistoryItem } from '../data/scenarioEditHistory'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT, type ScenarioStringKey } from '../i18n/scenarioStrings'
import { ScenarioRevertSnapshotModal } from './ScenarioRevertSnapshotModal'

type ScenarioEditHistoryDrawerProps = {
  open: boolean
  locale: AppLocale
  onClose: () => void
}

const DATE_LABEL_KEY: Record<'jun8' | 'may28', ScenarioStringKey> = {
  jun8: 'editHistoryDateJun8',
  may28: 'editHistoryDateMay28',
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 2.5h8a1 1 0 0 1 1 1v11l-5-3-5 3v-11a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function renderAction(locale: AppLocale, action: EditHistoryAction) {
  if (action.kind === 'text') {
    return scenarioT(locale, action.key)
  }
  const template = scenarioT(locale, action.key)
  const parts = template.split('{step}')
  if (parts.length === 1) return template
  return (
    <>
      {parts[0]}
      <strong>{action.step}</strong>
      {parts[1] ?? ''}
    </>
  )
}

export function ScenarioEditHistoryDrawer({ open, locale, onClose }: ScenarioEditHistoryDrawerProps) {
  const headingId = useId()
  const [revertTarget, setRevertTarget] = useState<{ revisionTime: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setRevertTarget(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (revertTarget != null) {
        setRevertTarget(null)
        return
      }
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, revertTarget])

  if (!open) return null

  const items = getScenarioEditHistoryItems(locale)

  return (
    <>
      <aside
        className="scenario-collect-drawer scenario-edit-history-drawer"
        aria-label={scenarioT(locale, 'editHistoryDrawerTitle')}
      >
        <div className="scenario-collect-drawer-header">
          <h2 id={headingId} className="scenario-collect-drawer-title">
            {scenarioT(locale, 'editHistoryDrawerTitle')}
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
          {items.map((item) => (
            <EditHistoryRow
              key={getEditHistoryItemKey(item)}
              locale={locale}
              item={item}
              onRevertSnapshot={(revisionTime) => setRevertTarget({ revisionTime })}
            />
          ))}
        </div>
      </aside>
      {revertTarget != null
        ? createPortal(
            <ScenarioRevertSnapshotModal
              open
              locale={locale}
              revisionTime={revertTarget.revisionTime}
              onClose={() => setRevertTarget(null)}
              onConfirm={() => setRevertTarget(null)}
            />,
            document.body,
          )
        : null}
    </>
  )
}

function getEditHistoryItemKey(item: EditHistoryItem): string {
  if (item.type === 'entry') return item.id
  if (item.type === 'revertSnapshot') return item.id
  return `date-${item.dateKey}`
}

function EditHistoryRow({
  locale,
  item,
  onRevertSnapshot,
}: {
  locale: AppLocale
  item: EditHistoryItem
  onRevertSnapshot: (revisionTime: string) => void
}) {
  if (item.type === 'date') {
    return (
      <h3 className="scenario-edit-history-drawer__date">{scenarioT(locale, DATE_LABEL_KEY[item.dateKey])}</h3>
    )
  }

  if (item.type === 'revertSnapshot') {
    return (
      <button
        type="button"
        className="scenario-edit-history-drawer__revert"
        onClick={() => onRevertSnapshot(item.revisionTime)}
      >
        <BookmarkIcon />
        <span>{scenarioT(locale, 'editHistoryRevertSnapshot')}</span>
      </button>
    )
  }

  return (
    <article className="scenario-edit-history-drawer__entry">
      <div className="scenario-edit-history-drawer__entry-avatar" aria-hidden="true">
        {item.userInitial}
      </div>
      <div className="scenario-edit-history-drawer__entry-main">
        <div className="scenario-edit-history-drawer__entry-meta">
          <time className="scenario-edit-history-drawer__entry-time">{item.time}</time>
          <span className="scenario-edit-history-drawer__entry-user">{item.userName}</span>
        </div>
        <p className="scenario-edit-history-drawer__entry-action">{renderAction(locale, item.action)}</p>
      </div>
    </article>
  )
}
