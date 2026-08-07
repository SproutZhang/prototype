import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { connectionName, type KnowledgeBaseConnectionDef } from '../data/integrationConnections'
import { kbT } from '../i18n/strings'
import { ConnectorOAuthScopesPanel } from './ConnectorOAuthScopesPanel'

export type KnowledgeBaseCreateConnectionDraft = {
  connectionName: string
  awsRegion: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  sessionToken: string
}

type KnowledgeBaseCreateConnectionModalProps = {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef | null
  connectorName: string | null
  open: boolean
  onBack: () => void
  onClose: () => void
  onSubmit: (draft: KnowledgeBaseCreateConnectionDraft) => void
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7v4M8 5.2h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function KnowledgeBaseCreateConnectionModal({
  locale,
  connection,
  connectorName,
  open,
  onBack,
  onClose,
  onSubmit,
}: KnowledgeBaseCreateConnectionModalProps) {
  const [connectionNameValue, setConnectionNameValue] = useState('')
  const [awsRegion, setAwsRegion] = useState('')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [bucketName, setBucketName] = useState('')
  const [sessionToken, setSessionToken] = useState('')

  useEffect(() => {
    if (!open || !connection || !connectorName) return
    const serviceName = connectionName(connection, locale === 'zh' ? 'zh' : 'en')
    setConnectionNameValue(
      kbT(locale, 'createConnectionNameDefault').replace('{connector}', connectorName).replace('{service}', serviceName),
    )
    setAwsRegion('')
    setAccessKeyId('')
    setSecretAccessKey('')
    setBucketName('')
    setSessionToken('')
  }, [open, connection, connectorName, locale])

  if (!open || !connection || !connectorName) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (
      !connectionNameValue.trim() ||
      !awsRegion.trim() ||
      !accessKeyId.trim() ||
      !secretAccessKey.trim() ||
      !bucketName.trim()
    ) {
      return
    }
    onSubmit({
      connectionName: connectionNameValue.trim(),
      awsRegion: awsRegion.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      bucketName: bucketName.trim(),
      sessionToken: sessionToken.trim(),
    })
  }

  const renderField = (
    id: string,
    labelKey: Parameters<typeof kbT>[1],
    value: string,
    onChange: (next: string) => void,
    placeholderKey: Parameters<typeof kbT>[1],
    options?: { required?: boolean; type?: string },
  ) => {
    const required = options?.required !== false
    return (
      <label className="kb-create-connection-field" htmlFor={id}>
        <span className="kb-create-connection-field-label">
          {kbT(locale, labelKey)}
          {required ? <span className="kb-create-connection-required">*</span> : null}
          {!required ? (
            <span className="kb-create-connection-optional-icon" title={kbT(locale, 'createConnectionOptionalHint')}>
              <InfoIcon />
            </span>
          ) : null}
        </span>
        <input
          id={id}
          type={options?.type ?? 'text'}
          value={value}
          required={required}
          placeholder={kbT(locale, placeholderKey)}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    )
  }

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-connection" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--create-connection"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-create-connection-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="kb-create-connection-toolbar">
          <button type="button" className="kb-connect-connector-back" onClick={onBack}>
            ‹
          </button>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <div className="kb-create-connection-head">
          <h2 id="kb-create-connection-title" className="kb-create-connection-title">
            {kbT(locale, 'createConnectionTitle')}
          </h2>
        </div>

        <form className="kb-create-connection-form" onSubmit={handleSubmit}>
          <div className="kb-create-connection-body">
            <ConnectorOAuthScopesPanel
              locale={locale}
              connectionId={connection.id}
              resetKey={open ? `${connection.id}-${connectorName}` : undefined}
            />
            {renderField(
              'kb-create-connection-name',
              'createConnectionName',
              connectionNameValue,
              setConnectionNameValue,
              'createConnectionNamePlaceholder',
            )}
            {renderField(
              'kb-create-connection-region',
              'createConnectionRegion',
              awsRegion,
              setAwsRegion,
              'createConnectionRegionPlaceholder',
            )}
            {renderField(
              'kb-create-connection-access-key',
              'createConnectionAccessKeyId',
              accessKeyId,
              setAccessKeyId,
              'createConnectionAccessKeyIdPlaceholder',
            )}
            {renderField(
              'kb-create-connection-secret',
              'createConnectionSecretAccessKey',
              secretAccessKey,
              setSecretAccessKey,
              'createConnectionSecretAccessKeyPlaceholder',
              { type: 'password' },
            )}
            {renderField(
              'kb-create-connection-bucket',
              'createConnectionBucketName',
              bucketName,
              setBucketName,
              'createConnectionBucketNamePlaceholder',
            )}
            {renderField(
              'kb-create-connection-session',
              'createConnectionSessionToken',
              sessionToken,
              setSessionToken,
              'createConnectionSessionTokenPlaceholder',
              { required: false },
            )}
          </div>

          <div className="kb-create-connection-actions">
            <button type="button" className="kb-create-connection-cancel" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="kb-btn kb-btn--primary kb-create-connection-submit">
              {kbT(locale, 'createConnectionSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
