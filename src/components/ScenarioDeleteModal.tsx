import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT } from '../i18n/scenarioStrings'

type ScenarioDeleteModalProps = {
  open: boolean
  locale: AppLocale
  scenarioName: string
  onClose: () => void
  onConfirm: () => void
}

export function ScenarioDeleteModal({
  open,
  locale,
  scenarioName,
  onClose,
  onConfirm,
}: ScenarioDeleteModalProps) {
  const headingId = useId()
  const descId = useId()

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

  const message = scenarioT(locale, 'deleteModalMessage').replace('{name}', scenarioName)

  return createPortal(
    <div
      className="scenario-delete-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="scenario-delete-modal__backdrop"
        aria-label={scenarioT(locale, 'close')}
        onClick={onClose}
      />
      <div className="scenario-delete-modal__panel">
        <header className="scenario-delete-modal__header">
          <h2 id={headingId} className="scenario-delete-modal__title">
            {scenarioT(locale, 'deleteModalTitle')}
          </h2>
          <button
            type="button"
            className="scenario-delete-modal__close"
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
        <p id={descId} className="scenario-delete-modal__message">
          {message}
        </p>
        <div className="scenario-delete-modal__footer">
          <button type="button" className="scenario-delete-modal__cancel" onClick={onClose}>
            {scenarioT(locale, 'cancel')}
          </button>
          <button type="button" className="scenario-delete-modal__confirm" onClick={onConfirm}>
            {scenarioT(locale, 'deleteModalConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
