import { useEffect, useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT } from '../i18n/scenarioStrings'

type ScenarioRenameModalProps = {
  open: boolean
  locale: AppLocale
  initialTitle: string
  onClose: () => void
  onSave: (title: string) => void
}

export function ScenarioRenameModal({
  open,
  locale,
  initialTitle,
  onClose,
  onSave,
}: ScenarioRenameModalProps) {
  const headingId = useId()
  const inputId = useId()
  const [draft, setDraft] = useState(initialTitle)

  useEffect(() => {
    if (!open) return
    setDraft(initialTitle)
  }, [open, initialTitle])

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return createPortal(
    <div className="scenario-rename-modal" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button
        type="button"
        className="scenario-rename-modal__backdrop"
        aria-label={scenarioT(locale, 'close')}
        onClick={onClose}
      />
      <div className="scenario-rename-modal__panel">
        <header className="scenario-rename-modal__header">
          <h2 id={headingId} className="scenario-rename-modal__title">
            {scenarioT(locale, 'renameModalTitle')}
          </h2>
          <button
            type="button"
            className="scenario-rename-modal__close"
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
        <form className="scenario-rename-modal__form" onSubmit={handleSubmit}>
          <label className="scenario-rename-modal__field" htmlFor={inputId}>
            <span className="scenario-rename-modal__label">{scenarioT(locale, 'renameModalLabel')}</span>
            <input
              id={inputId}
              type="text"
              className="scenario-rename-modal__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={scenarioT(locale, 'renameModalPlaceholder')}
              autoFocus
            />
          </label>
          <div className="scenario-rename-modal__footer">
            <button type="button" className="scenario-rename-modal__cancel" onClick={onClose}>
              {scenarioT(locale, 'cancel')}
            </button>
            <button type="submit" className="scenario-rename-modal__save" disabled={!draft.trim()}>
              {scenarioT(locale, 'save')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
