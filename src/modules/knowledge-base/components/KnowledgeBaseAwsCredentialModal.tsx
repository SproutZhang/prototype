import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseAwsCredentialModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
}

function FieldInfoIcon({ label }: { label: string }) {
  return (
    <span className="kb-upload-advanced-info" title={label} aria-label={label}>
      i
    </span>
  )
}

export function KnowledgeBaseAwsCredentialModal({ locale, open, onClose }: KnowledgeBaseAwsCredentialModalProps) {
  const [credentialName, setCredentialName] = useState('')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [roleArn, setRoleArn] = useState('')
  const [externalId, setExternalId] = useState('')

  useEffect(() => {
    if (!open) return
    setCredentialName('')
    setAccessKeyId('')
    setSecretAccessKey('')
    setSessionToken('')
    setRoleArn('')
    setExternalId('')
  }, [open])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!credentialName.trim()) return
    onClose()
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--aws-credential"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-aws-credential-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <div className="kb-aws-credential-head">
            <span className="kb-aws-credential-logo" aria-hidden="true">
              <img src="/logos/embeddings/aws-wordmark.svg" alt="" draggable={false} />
            </span>
            <h2 id="kb-aws-credential-title" className="kb-modal-title">
              {kbT(locale, 'docInsertBlockAwsCredentialTitle')}
            </h2>
          </div>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <form className="kb-modal-form kb-aws-credential-form" onSubmit={handleSubmit}>
          <div className="kb-aws-credential-body">
        <p className="kb-aws-credential-notice">
          {kbT(locale, 'docInsertBlockAwsCredentialNoticePrefix')}
          <button type="button" className="kb-aws-credential-notice-link">
            {kbT(locale, 'docInsertBlockAwsCredentialNoticeLink')}
          </button>
          {kbT(locale, 'docInsertBlockAwsCredentialNoticeSuffix')}
        </p>

          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'docInsertBlockAwsCredentialName')}
              <span className="kb-field-required" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="text"
              value={credentialName}
              placeholder={kbT(locale, 'docInsertBlockAwsCredentialNamePlaceholder')}
              onChange={(event) => setCredentialName(event.target.value)}
            />
          </label>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'docInsertBlockAwsCredentialAccessKeyId')}
              <FieldInfoIcon label={kbT(locale, 'docInsertBlockAwsCredentialAccessKeyIdHint')} />
            </span>
            <input
              type="text"
              value={accessKeyId}
              placeholder={kbT(locale, 'docInsertBlockAwsCredentialAccessKeyIdPlaceholder')}
              onChange={(event) => setAccessKeyId(event.target.value)}
            />
          </label>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'docInsertBlockAwsCredentialSecretAccessKey')}
              <FieldInfoIcon label={kbT(locale, 'docInsertBlockAwsCredentialSecretAccessKeyHint')} />
            </span>
            <input
              type="password"
              value={secretAccessKey}
              placeholder={kbT(locale, 'docInsertBlockAwsCredentialSecretAccessKeyPlaceholder')}
              onChange={(event) => setSecretAccessKey(event.target.value)}
            />
          </label>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'docInsertBlockAwsCredentialSessionToken')}
              <FieldInfoIcon label={kbT(locale, 'docInsertBlockAwsCredentialSessionTokenHint')} />
            </span>
            <input
              type="text"
              value={sessionToken}
              placeholder={kbT(locale, 'docInsertBlockAwsCredentialSessionTokenPlaceholder')}
              onChange={(event) => setSessionToken(event.target.value)}
            />
          </label>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'docInsertBlockAwsCredentialRoleArn')}
              <FieldInfoIcon label={kbT(locale, 'docInsertBlockAwsCredentialRoleArnHint')} />
            </span>
            <input
              type="text"
              value={roleArn}
              placeholder={kbT(locale, 'docInsertBlockAwsCredentialRoleArnPlaceholder')}
              onChange={(event) => setRoleArn(event.target.value)}
            />
          </label>
          <label className="kb-field">
            <span className="kb-field-label">
              {kbT(locale, 'docInsertBlockAwsCredentialExternalId')}
              <FieldInfoIcon label={kbT(locale, 'docInsertBlockAwsCredentialExternalIdHint')} />
            </span>
            <input
              type="text"
              value={externalId}
              placeholder={kbT(locale, 'docInsertBlockAwsCredentialExternalIdPlaceholder')}
              onChange={(event) => setExternalId(event.target.value)}
            />
          </label>
          </div>

          <div className="kb-modal-actions">
            <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--primary">
              {kbT(locale, 'docInsertBlockAwsCredentialSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
