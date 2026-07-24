import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '../i18n/LocaleContext'
import { createScenarioT } from '../i18n/scenarioStrings'

export type CreateScenarioSubmitPayload = {
  description: string
  templateTitle: string | null
}

type CreateScenarioModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (payload: CreateScenarioSubmitPayload) => void
}

export function CreateScenarioModal({ open, onClose, onCreate }: CreateScenarioModalProps) {
  const { locale } = useLocale()
  const text = createScenarioT(locale)
  const headingId = useId()
  const [sideMode, setSideMode] = useState<'scratch' | (typeof text.templates)[number]>('scratch')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!open) return
    setSideMode('scratch')
    setDraft('')
  }, [open])

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

  const selectScratch = () => {
    setSideMode('scratch')
    setDraft('')
  }

  const selectTemplate = (t: (typeof text.templates)[number]) => {
    setSideMode(t)
    setDraft(text.templateDraft(t))
  }

  const rightTitle = sideMode === 'scratch' ? text.createCustomTitle : sideMode

  const handleSubmit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onCreate({
      description: trimmed,
      templateTitle: sideMode === 'scratch' ? null : sideMode,
    })
    onClose()
  }

  return createPortal(
    <div
      className="agents-create-scenario-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <button type="button" className="agents-create-scenario-modal__backdrop" aria-label={text.close} onClick={onClose} />
      <div className="agents-create-scenario-modal__panel">
        <header className="agents-create-scenario-modal__header">
          <h2 id={headingId} className="agents-create-scenario-modal__title">
            {text.modalTitle}
          </h2>
          <button type="button" className="agents-create-scenario-modal__close" aria-label={text.close} onClick={onClose}>
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
        <div className="agents-create-scenario-modal__split">
          <aside className="agents-create-scenario-modal__aside" aria-label={text.createModeAria}>
            <div className="agents-create-scenario-modal__aside-section">
              <div className="agents-create-scenario-modal__aside-label">{text.fromScratch}</div>
              <button
                type="button"
                className={
                  sideMode === 'scratch'
                    ? 'agents-create-scenario-modal__aside-row is-active'
                    : 'agents-create-scenario-modal__aside-row'
                }
                aria-pressed={sideMode === 'scratch'}
                onClick={selectScratch}
              >
                <span className="agents-create-scenario-modal__aside-row-label">{text.createCustom}</span>
                <span className="agents-create-scenario-modal__aside-row-plus" aria-hidden="true">
                  +
                </span>
              </button>
            </div>
            <div className="agents-create-scenario-modal__aside-section">
              <div className="agents-create-scenario-modal__aside-label">{text.useTemplate}</div>
              <div className="agents-create-scenario-modal__aside-templates" role="list">
                {text.templates.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="listitem"
                    className={
                      sideMode === t
                        ? 'agents-create-scenario-modal__template-card is-active'
                        : 'agents-create-scenario-modal__template-card'
                    }
                    aria-pressed={sideMode === t}
                    onClick={() => selectTemplate(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <div className="agents-create-scenario-modal__body">
            <h3 className="agents-create-scenario-modal__body-title">{rightTitle}</h3>
            <p className="agents-create-scenario-modal__question">{text.question}</p>
            <textarea
              className="agents-create-scenario-modal__textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={text.placeholder}
              rows={10}
              aria-label={text.question}
            />
            <div className="agents-create-scenario-modal__footer">
              <button
                type="button"
                className="agents-create-scenario-modal__submit"
                disabled={!draft.trim()}
                onClick={handleSubmit}
              >
                {text.submit}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
