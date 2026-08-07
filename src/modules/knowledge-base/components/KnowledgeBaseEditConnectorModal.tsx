import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseEditConnectorModalProps = {
  locale: AppLocale
  connector: { id: string; name: string } | null
  open: boolean
  onClose: () => void
  onSubmit: (connectorName: string) => void
}

export function KnowledgeBaseEditConnectorModal({
  locale,
  connector,
  open,
  onClose,
  onSubmit,
}: KnowledgeBaseEditConnectorModalProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open && connector) {
      setName(connector.name)
    }
  }, [open, connector])

  if (!open || !connector) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-edit-connector" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--edit-connector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-edit-connector-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-edit-connector-toolbar">
          <button type="button" className="kb-connect-connector-back" onClick={onClose}>
            ‹
          </button>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <h2 id="kb-edit-connector-title" className="kb-edit-connector-title">
          {kbT(locale, 'editConnectorTitle')}
        </h2>

        <form className="kb-edit-connector-form" onSubmit={handleSubmit}>
          <label className="kb-edit-connector-field">
            <span className="kb-edit-connector-field-label">
              {kbT(locale, 'createConnectorNameLabel')}
              <span className="kb-edit-connector-required">*</span>
            </span>
            <input
              type="text"
              value={name}
              required
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="kb-edit-connector-actions">
            <button type="button" className="kb-btn kb-btn--secondary kb-edit-connector-cancel" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--primary kb-edit-connector-submit">
              {kbT(locale, 'editConnectorConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
