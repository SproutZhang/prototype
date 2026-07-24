import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT } from '../i18n/scenarioStrings'

type ScenarioRevertSnapshotModalProps = {
  open: boolean
  locale: AppLocale
  revisionTime: string
  onClose: () => void
  onConfirm: () => void
}

function RevertIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M6.5 5.5H14a3.5 3.5 0 1 1 0 7H12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 3.5 6.5 5.5l2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ScenarioRevertSnapshotModal({
  open,
  locale,
  revisionTime,
  onClose,
  onConfirm,
}: ScenarioRevertSnapshotModalProps) {
  const headingId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const message = scenarioT(locale, 'revertSnapshotModalMessage').replace('{time}', revisionTime)

  return createPortal(
    <div
      className="scenario-revert-snapshot-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="scenario-revert-snapshot-modal__backdrop"
        aria-label={scenarioT(locale, 'close')}
        onClick={onClose}
      />
      <div className="scenario-revert-snapshot-modal__panel">
        <header className="scenario-revert-snapshot-modal__header">
          <div className="scenario-revert-snapshot-modal__title-wrap">
            <span className="scenario-revert-snapshot-modal__title-icon" aria-hidden="true">
              <RevertIcon />
            </span>
            <h2 id={headingId} className="scenario-revert-snapshot-modal__title">
              {scenarioT(locale, 'revertSnapshotModalTitle')}
            </h2>
          </div>
          <button
            type="button"
            className="scenario-revert-snapshot-modal__close"
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
        <p id={descId} className="scenario-revert-snapshot-modal__message">
          {message}
        </p>
        <div className="scenario-revert-snapshot-modal__footer">
          <button type="button" className="scenario-revert-snapshot-modal__cancel" onClick={onClose}>
            {scenarioT(locale, 'cancel')}
          </button>
          <button type="button" className="scenario-revert-snapshot-modal__confirm" onClick={onConfirm}>
            {scenarioT(locale, 'revertSnapshotModalConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
