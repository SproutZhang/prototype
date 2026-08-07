import { useEffect, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { KnowledgeBaseConnectionDef } from '../data/integrationConnections'
import { CONNECTOR_REDIRECT_URI } from '../data/connectorOAuthScopes'
import { kbT } from '../i18n/strings'
import { ConnectorOAuthScopesPanel } from './ConnectorOAuthScopesPanel'

type KnowledgeBaseConfigureConnectorModalProps = {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef | null
  connectorName: string | null
  open: boolean
  onBack: () => void
  onClose: () => void
  onDelete: () => void
  onSave: () => void
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M4.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  )
}

export function KnowledgeBaseConfigureConnectorModal({
  locale,
  connection,
  connectorName,
  open,
  onBack,
  onClose,
  onDelete,
  onSave,
}: KnowledgeBaseConfigureConnectorModalProps) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [copied, setCopied] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open || !connection) return
    setClientId('')
    setClientSecret('')
    setCopied(false)
    setDeleteConfirmOpen(false)
  }, [open, connection])

  if (!open || !connection || !connectorName) return null

  const title = kbT(locale, 'configureConnectorTitle').replace('{name}', connectorName)
  const deleteConfirmMessage = kbT(locale, 'configureConnectorDeleteMessage').replace(
    '{name}',
    connectorName,
  )

  const handleCopyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(CONNECTOR_REDIRECT_URI)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-configure" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--configure-connector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-configure-connector-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-configure-connector-toolbar">
          <button type="button" className="kb-connect-connector-back" onClick={onBack}>
            ‹
          </button>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <div className="kb-configure-connector-head">
          <h2 id="kb-configure-connector-title" className="kb-configure-connector-title">
            {title}
          </h2>
        </div>

        <div className="kb-configure-connector-body">
          <ConnectorOAuthScopesPanel locale={locale} connectionId={connection.id} resetKey={open ? connection.id : undefined} />

          <section className="kb-configure-connector-section">
            <label className="kb-configure-connector-field-label" htmlFor="kb-configure-client-id">
              {kbT(locale, 'configureConnectorClientId')}
              <span className="kb-configure-connector-required">*</span>
            </label>
            <input
              id="kb-configure-client-id"
              type="text"
              value={clientId}
              required
              onChange={(e) => setClientId(e.target.value)}
            />

            <label className="kb-configure-connector-field-label" htmlFor="kb-configure-client-secret">
              {kbT(locale, 'configureConnectorClientSecret')}
              <span className="kb-configure-connector-required">*</span>
            </label>
            <input
              id="kb-configure-client-secret"
              type="password"
              value={clientSecret}
              required
              onChange={(e) => setClientSecret(e.target.value)}
            />

            <label className="kb-configure-connector-field-label" htmlFor="kb-configure-redirect-uri">
              {kbT(locale, 'configureConnectorRedirectUri')}
            </label>
            <div className="kb-configure-connector-copy-field">
              <input
                id="kb-configure-redirect-uri"
                type="text"
                readOnly
                value={CONNECTOR_REDIRECT_URI}
              />
              <button
                type="button"
                className="kb-configure-connector-copy-btn"
                onClick={handleCopyRedirect}
                aria-label={kbT(locale, 'configureConnectorCopy')}
              >
                <CopyIcon />
              </button>
            </div>
            {copied ? (
              <span className="kb-configure-connector-copied">{kbT(locale, 'configureConnectorCopied')}</span>
            ) : null}
          </section>
        </div>

        <div className="kb-configure-connector-footer">
          <button
            type="button"
            className="kb-btn kb-btn--danger kb-configure-connector-delete"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            {kbT(locale, 'configureConnectorDelete')}
          </button>
          <button
            type="button"
            className="kb-btn kb-btn--solid kb-configure-connector-save"
            disabled={!clientId.trim() || !clientSecret.trim()}
            onClick={onSave}
          >
            {kbT(locale, 'configureConnectorSave')}
          </button>
        </div>
      </div>

      {deleteConfirmOpen ? (
        <div
          className="kb-modal-overlay kb-modal-overlay--stacked-configure-delete"
          role="presentation"
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            className="kb-modal kb-modal--compact"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="kb-configure-delete-title"
            aria-describedby="kb-configure-delete-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="kb-configure-delete-title" className="kb-modal-title">
              {kbT(locale, 'configureConnectorDeleteTitle')}
            </h2>
            <p id="kb-configure-delete-desc" className="kb-modal-hint">
              {deleteConfirmMessage}
            </p>
            <div className="kb-modal-actions">
              <button
                type="button"
                className="kb-btn kb-btn--secondary"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                {kbT(locale, 'createCancel')}
              </button>
              <button
                type="button"
                className="kb-btn kb-btn--danger"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  onDelete()
                }}
              >
                {kbT(locale, 'configureConnectorDeleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
