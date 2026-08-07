import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { findRecordManagerProviderOption, type RecordManagerProviderId } from '../data/recordManagerProviderOptions'
import { kbT } from '../i18n/strings'

type KnowledgeBaseRecordManagerProviderConfigFormProps = {
  locale: AppLocale
  providerId: RecordManagerProviderId
  onEdit: () => void
}

function FieldInfoIcon({ label }: { label: string }) {
  return (
    <span className="kb-upload-advanced-info" title={label} aria-label={label}>
      i
    </span>
  )
}

function MetadataBraceIcon() {
  return (
    <span className="kb-upload-metadata-brace" aria-hidden="true">
      {'{ }'}
    </span>
  )
}

function AdditionalConnectionConfigField({ locale }: { locale: AppLocale }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="kb-field">
      <span className="kb-field-label">{kbT(locale, 'docInsertBlockRecordManagerAdditionalConfig')}</span>
      <button
        type="button"
        className="kb-upload-metadata-toggle kb-doc-insert-block-json-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`kb-upload-metadata-chevron${open ? ' is-expanded' : ''}`} aria-hidden="true">
          ›
        </span>
        <MetadataBraceIcon />
        <span>{kbT(locale, 'uploadAdvancedMetadataCount').replace('{count}', '0')}</span>
      </button>
      {open ? <p className="kb-upload-metadata-empty">{kbT(locale, 'uploadAdvancedMetadataEmpty')}</p> : null}
    </div>
  )
}

function ProviderLogo({ label, logoSrc }: { label: string; logoSrc: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="kb-embedding-provider-logo kb-embedding-provider-logo--fallback" aria-hidden="true">
        {label.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <span className="kb-embedding-provider-logo" aria-hidden="true">
      <img src={logoSrc} alt="" draggable={false} onError={() => setFailed(true)} />
    </span>
  )
}

function EditProviderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RecordManagerConfigFields({ locale }: { locale: AppLocale }) {
  return (
    <>
      <AdditionalConnectionConfigField locale={locale} />
      <label className="kb-field">
        <span className="kb-field-label">{kbT(locale, 'docInsertBlockRecordManagerTableName')}</span>
        <input type="text" placeholder="upsertion_records" />
      </label>
      <label className="kb-field">
        <span className="kb-field-label">{kbT(locale, 'docInsertBlockRecordManagerNamespace')}</span>
        <input type="text" />
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockRecordManagerCleanup')}
          <span className="kb-field-required" aria-hidden="true">
            *
          </span>
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockRecordManagerCleanupHint')} />
        </span>
        <select defaultValue="none">
          <option value="none">{kbT(locale, 'docInsertBlockRecordManagerCleanupNone')}</option>
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockRecordManagerSourceIdKey')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockRecordManagerSourceIdKeyHint')} />
        </span>
        <input type="text" defaultValue="source" />
      </label>
    </>
  )
}

export function KnowledgeBaseRecordManagerProviderConfigForm({
  locale,
  providerId,
  onEdit,
}: KnowledgeBaseRecordManagerProviderConfigFormProps) {
  const provider = findRecordManagerProviderOption(providerId)
  if (!provider) return null

  const providerLabel = kbT(locale, provider.labelKey)

  return (
    <div className="kb-doc-insert-block-record-manager-config">
      <div className="kb-doc-insert-block-provider-config-head">
        <ProviderLogo label={providerLabel} logoSrc={provider.logoSrc} />
        <span className="kb-doc-insert-block-provider-config-title">{providerLabel}</span>
        <button
          type="button"
          className="kb-doc-insert-block-provider-config-edit"
          aria-label={kbT(locale, 'docInsertBlockEditProvider')}
          onClick={onEdit}
        >
          <EditProviderIcon />
        </button>
      </div>

      <RecordManagerConfigFields locale={locale} />
    </div>
  )
}
