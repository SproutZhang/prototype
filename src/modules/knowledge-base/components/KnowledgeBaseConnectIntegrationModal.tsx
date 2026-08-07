import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { connectionName, type KnowledgeBaseConnectionDef } from '../data/integrationConnections'
import { kbT } from '../i18n/strings'

export type KnowledgeBaseConnectIntegrationDraft = {
  userId: string
  token: string
  baseUrl: string
}

type KnowledgeBaseConnectIntegrationModalProps = {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef | null
  onClose: () => void
  onSubmit: (draft: KnowledgeBaseConnectIntegrationDraft) => void
}

export function KnowledgeBaseConnectIntegrationModal({
  locale,
  connection,
  onClose,
  onSubmit,
}: KnowledgeBaseConnectIntegrationModalProps) {
  const [userId, setUserId] = useState('')
  const [token, setToken] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    if (connection) {
      setUserId('')
      setToken('')
      setBaseUrl('')
    }
  }, [connection])

  if (!connection) return null

  const name = connectionName(connection, locale === 'zh' ? 'zh' : 'en')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!userId.trim() || !token.trim()) return
    onSubmit({
      userId: userId.trim(),
      token: token.trim(),
      baseUrl: baseUrl.trim(),
    })
  }

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--connect"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-connect-integration-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-connect-integration-title" className="kb-modal-title">
          {kbT(locale, 'connectIntegrationTitle').replace('{name}', name)}
        </h2>
        <p className="kb-modal-hint">{kbT(locale, 'connectIntegrationHint')}</p>
        <form className="kb-modal-form" onSubmit={handleSubmit}>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'connectIntegrationUserId')}
              <span className="kb-field-required">*</span>
            </span>
            <input type="text" value={userId} required onChange={(e) => setUserId(e.target.value)} />
          </label>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'connectIntegrationToken')}
              <span className="kb-field-required">*</span>
            </span>
            <input type="password" value={token} required onChange={(e) => setToken(e.target.value)} />
          </label>
          <label className="kb-field">
            <span>{kbT(locale, 'connectIntegrationBaseUrl')}</span>
            <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </label>
          <div className="kb-modal-actions">
            <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--primary">
              {kbT(locale, 'connectIntegrationConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
