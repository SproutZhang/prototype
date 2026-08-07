import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { findVectorStoreProviderOption, type VectorStoreProviderId } from '../data/vectorStoreProviderOptions'
import { kbT } from '../i18n/strings'

type KnowledgeBaseVectorStoreProviderConfigFormProps = {
  locale: AppLocale
  providerId: VectorStoreProviderId
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

function JsonItemCountField({
  locale,
  label,
  itemCount = 0,
}: {
  locale: AppLocale
  label: string
  itemCount?: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="kb-field">
      <span className="kb-field-label">{label}</span>
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
        <span>{kbT(locale, 'uploadAdvancedMetadataCount').replace('{count}', String(itemCount))}</span>
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

function ChromaVectorStoreConfigForm({ locale }: { locale: AppLocale }) {
  return (
    <>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockConnectionCredentials')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockConnectionCredentialsHint')} />
        </span>
        <select defaultValue="">
          <option value="" />
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockChromaCollectionName')}
          <span className="kb-field-required" aria-hidden="true">
            *
          </span>
        </span>
        <input type="text" />
      </label>
      <label className="kb-field">
        <span className="kb-field-label">{kbT(locale, 'docInsertBlockChromaUrl')}</span>
        <input type="text" />
      </label>
      <JsonItemCountField locale={locale} label={kbT(locale, 'docInsertBlockChromaMetadataFilter')} />
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockTopK')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockTopKHint')} />
        </span>
        <input type="number" defaultValue="4" />
      </label>
    </>
  )
}

function GenericVectorStoreConfigForm({ locale }: { locale: AppLocale }) {
  return (
    <>
      <label className="kb-field">
        <span className="kb-field-label">{kbT(locale, 'docInsertBlockConnectionCredentials')}</span>
        <select defaultValue="">
          <option value="" />
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockMilvusCollectionName')}
          <span className="kb-field-required" aria-hidden="true">
            *
          </span>
        </span>
        <input type="text" />
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockTopK')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockTopKHint')} />
        </span>
        <input type="number" defaultValue="4" />
      </label>
    </>
  )
}

export function KnowledgeBaseVectorStoreProviderConfigForm({
  locale,
  providerId,
  onEdit,
}: KnowledgeBaseVectorStoreProviderConfigFormProps) {
  const provider = findVectorStoreProviderOption(providerId)
  if (!provider) return null

  const providerLabel = kbT(locale, provider.labelKey)

  return (
    <div className="kb-doc-insert-block-vector-store-config">
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

      {providerId === 'chroma' ? (
        <ChromaVectorStoreConfigForm locale={locale} />
      ) : (
        <GenericVectorStoreConfigForm locale={locale} />
      )}
    </div>
  )
}
