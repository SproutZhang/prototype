import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { connectionName, type KnowledgeBaseConnectionDef } from '../data/integrationConnections'
import { kbT } from '../i18n/strings'

type KnowledgeBaseCreateConnectorModalProps = {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef | null
  open: boolean
  draftName?: string
  onClose: () => void
  onSubmit: (connectorName: string) => void
}

export function KnowledgeBaseCreateConnectorModal({
  locale,
  connection,
  open,
  draftName = '',
  onClose,
  onSubmit,
}: KnowledgeBaseCreateConnectorModalProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open || !connection) return
    setName(draftName)
  }, [open, connection, draftName])

  if (!open || !connection) return null

  const serviceName = connectionName(connection, locale === 'zh' ? 'zh' : 'en')
  const connectorOptionLabel = kbT(locale, 'connectBridgeConnectorName').replace('{name}', serviceName)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-create" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--create-connector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-create-connector-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-create-connector-head">
          <h2 id="kb-create-connector-title" className="kb-create-connector-title">
            {kbT(locale, 'createConnectorTitle')}
          </h2>
        </div>

        <form className="kb-create-connector-form" onSubmit={handleSubmit}>
          <div className="kb-create-connector-option">
            <span className="kb-create-connector-option-radio" aria-hidden="true">
              <span className="kb-create-connector-option-radio-dot" />
            </span>
            <span className="kb-create-connector-option-label">{connectorOptionLabel}</span>
            <span className="kb-create-connector-option-badge">{kbT(locale, 'createConnectorTypeBadge')}</span>
          </div>

          <label className="kb-create-connector-field">
            <span className="kb-create-connector-field-label">
              {kbT(locale, 'createConnectorNameLabel')}
              <span className="kb-create-connector-required">*</span>
            </span>
            <input
              type="text"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              placeholder={kbT(locale, 'createConnectorNamePlaceholder').replace('{name}', serviceName)}
            />
          </label>

          <div className="kb-create-connector-actions">
            <button type="button" className="kb-create-connector-cancel" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--primary kb-create-connector-submit">
              {kbT(locale, 'connectBridgeCreate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
