import { useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { RECORD_MANAGER_PROVIDER_OPTIONS, type RecordManagerProviderId } from '../data/recordManagerProviderOptions'
import { kbT } from '../i18n/strings'

type KnowledgeBaseSelectRecordManagerProviderModalProps = {
  locale: AppLocale
  open: boolean
  selectedProviderId?: RecordManagerProviderId | null
  onClose: () => void
  onSelect: (providerId: RecordManagerProviderId) => void
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RecordManagerProviderLogo({ label, logoSrc }: { label: string; logoSrc: string }) {
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

export function KnowledgeBaseSelectRecordManagerProviderModal({
  locale,
  open,
  selectedProviderId,
  onClose,
  onSelect,
}: KnowledgeBaseSelectRecordManagerProviderModalProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return RECORD_MANAGER_PROVIDER_OPTIONS

    return RECORD_MANAGER_PROVIDER_OPTIONS.filter((provider) => {
      const label = kbT(locale, provider.labelKey).toLowerCase()
      return label.includes(normalizedQuery) || provider.id.includes(normalizedQuery)
    })
  }, [locale, query])

  if (!open) return null

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--embeddings-provider kb-modal--record-manager-provider"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-record-manager-provider-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <h2 id="kb-record-manager-provider-title" className="kb-modal-title">
            {kbT(locale, 'docInsertBlockSelectRecordManagerProvider')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <label className="kb-embeddings-provider-search">
          <span className="kb-embeddings-provider-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            placeholder={kbT(locale, 'docInsertBlockRecordManagerProviderSearch')}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="kb-embeddings-provider-search-clear"
              aria-label={kbT(locale, 'createCancel')}
              onClick={() => setQuery('')}
            >
              <ClearIcon />
            </button>
          ) : null}
        </label>

        <div
          className="kb-embeddings-provider-grid kb-embeddings-provider-grid--compact"
          role="listbox"
          aria-label={kbT(locale, 'docInsertBlockSelectRecordManagerProvider')}
        >
          {filteredProviders.map((provider) => {
            const label = kbT(locale, provider.labelKey)
            const isSelected = selectedProviderId === provider.id

            return (
              <button
                key={provider.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`kb-embeddings-provider-card${isSelected ? ' is-selected' : ''}`}
                onClick={() => onSelect(provider.id)}
              >
                <RecordManagerProviderLogo label={label} logoSrc={provider.logoSrc} />
                <span className="kb-embeddings-provider-card-label">{label}</span>
              </button>
            )
          })}
        </div>

        {filteredProviders.length === 0 ? (
          <p className="kb-embeddings-provider-empty">{kbT(locale, 'docInsertBlockRecordManagerProviderEmpty')}</p>
        ) : null}
      </div>
    </div>
  )
}
