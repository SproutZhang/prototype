import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'

type MineContentDeleteModalProps = {
  open: boolean
  locale: AppLocale
  displayName: string
  onClose: () => void
  onConfirm: () => void
}

export function MineContentDeleteModal({
  open,
  locale,
  displayName,
  onClose,
  onConfirm,
}: MineContentDeleteModalProps) {
  const headingId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
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

  const message = tcsT(locale, 'projectSpaceMineDeleteMessage').replace('{name}', displayName)

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
        aria-label={tcsT(locale, 'formCancel')}
        onClick={onClose}
      />
      <div className="scenario-delete-modal__panel">
        <header className="scenario-delete-modal__header">
          <h2 id={headingId} className="scenario-delete-modal__title">
            {tcsT(locale, 'projectSpaceMineDeleteTitle')}
          </h2>
          <button
            type="button"
            className="scenario-delete-modal__close"
            aria-label={tcsT(locale, 'formCancel')}
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
            {tcsT(locale, 'formCancel')}
          </button>
          <button type="button" className="scenario-delete-modal__confirm" onClick={onConfirm}>
            {tcsT(locale, 'projectSpaceMineDeleteConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
