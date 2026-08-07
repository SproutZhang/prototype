import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { findEmbeddingProviderOption, type EmbeddingProviderId } from '../data/embeddingProviderOptions'
import { kbT } from '../i18n/strings'
import { KnowledgeBaseAwsCredentialModal } from './KnowledgeBaseAwsCredentialModal'

type KnowledgeBaseEmbeddingProviderConfigFormProps = {
  locale: AppLocale
  providerId: EmbeddingProviderId
  onEdit: () => void
}

function FieldInfoIcon({ label }: { label: string }) {
  return (
    <span className="kb-upload-advanced-info" title={label} aria-label={label}>
      i
    </span>
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

function AwsBedrockEmbeddingConfigForm({ locale }: { locale: AppLocale }) {
  const [awsCredential, setAwsCredential] = useState('')
  const [awsCredentialOpen, setAwsCredentialOpen] = useState(false)

  const handleAwsCredentialChange = (value: string) => {
    if (value === 'create') {
      setAwsCredentialOpen(true)
      setAwsCredential('')
      return
    }
    setAwsCredential(value)
  }

  return (
    <>
      <label className="kb-field">
        <span className="kb-field-label">{kbT(locale, 'docInsertBlockConnectionCredentials')}</span>
        <select value={awsCredential} onChange={(event) => handleAwsCredentialChange(event.target.value)}>
          <option value="" />
          <option value="create">{kbT(locale, 'docInsertBlockConnectionCredentialsCreate')}</option>
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockRegion')}
          <span className="kb-field-required" aria-hidden="true">
            *
          </span>
        </span>
        <select defaultValue="us-east-1">
          <option value="us-east-1">us-east-1</option>
          <option value="us-west-2">us-west-2</option>
          <option value="eu-west-1">eu-west-1</option>
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockModelName')}
          <span className="kb-field-required" aria-hidden="true">
            *
          </span>
        </span>
        <select defaultValue="amazon.titan-embed-text-v1">
          <option value="amazon.titan-embed-text-v1">amazon.titan-embed-text-v1</option>
          <option value="amazon.titan-embed-text-v2:0">amazon.titan-embed-text-v2:0</option>
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockCustomModelName')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockCustomModelNameHint')} />
        </span>
        <input type="text" />
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockCohereInputType')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockCohereInputTypeHint')} />
        </span>
        <select defaultValue="">
          <option value="" />
          <option value="search_document">search_document</option>
          <option value="search_query">search_query</option>
        </select>
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockBatchSize')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockBatchSizeHint')} />
        </span>
        <input type="number" defaultValue="50" />
      </label>
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'docInsertBlockAwsMaxRetries')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockAwsMaxRetriesHint')} />
        </span>
        <input type="number" defaultValue="5" />
      </label>
      <KnowledgeBaseAwsCredentialModal
        locale={locale}
        open={awsCredentialOpen}
        onClose={() => setAwsCredentialOpen(false)}
      />
    </>
  )
}

function GenericEmbeddingConfigForm({ locale }: { locale: AppLocale }) {
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
          {kbT(locale, 'docInsertBlockBatchSize')}
          <FieldInfoIcon label={kbT(locale, 'docInsertBlockBatchSizeHint')} />
        </span>
        <input type="number" defaultValue="50" />
      </label>
    </>
  )
}

export function KnowledgeBaseEmbeddingProviderConfigForm({
  locale,
  providerId,
  onEdit,
}: KnowledgeBaseEmbeddingProviderConfigFormProps) {
  const provider = findEmbeddingProviderOption(providerId)
  if (!provider) return null

  const providerLabel = kbT(locale, provider.labelKey)

  return (
    <div className="kb-doc-insert-block-embeddings-config">
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

      {providerId === 'aws-bedrock' ? (
        <AwsBedrockEmbeddingConfigForm locale={locale} />
      ) : (
        <GenericEmbeddingConfigForm locale={locale} />
      )}
    </div>
  )
}
