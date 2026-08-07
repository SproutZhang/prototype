import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { AppLocale } from '../i18n/homeStrings'
import { agentFreezeT } from '../i18n/agentLibraryStrings'

type AgentFreezeModalProps = {
  open: boolean
  locale: AppLocale
  agentName: string
  onClose: () => void
  onConfirm: () => void
}

export function AgentFreezeModal({ open, locale, agentName, onClose, onConfirm }: AgentFreezeModalProps) {
  const headingId = useId()
  const descId = useId()
  const text = agentFreezeT(locale)

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

  const message = text.modalMessage.replace('{name}', agentName)

  return createPortal(
    <div
      className="scenario-freeze-run-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="scenario-freeze-run-modal__backdrop"
        aria-label={text.close}
        onClick={onClose}
      />
      <div className="scenario-freeze-run-modal__panel">
        <header className="scenario-freeze-run-modal__header">
          <h2 id={headingId} className="scenario-freeze-run-modal__title">
            {text.modalTitle}
          </h2>
          <button
            type="button"
            className="scenario-freeze-run-modal__close"
            aria-label={text.close}
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
        <p id={descId} className="scenario-freeze-run-modal__message">
          {message}
        </p>
        <div className="scenario-freeze-run-modal__footer">
          <button type="button" className="scenario-freeze-run-modal__cancel" onClick={onClose}>
            {text.cancel}
          </button>
          <button type="button" className="scenario-freeze-run-modal__confirm" onClick={onConfirm}>
            {text.modalConfirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
