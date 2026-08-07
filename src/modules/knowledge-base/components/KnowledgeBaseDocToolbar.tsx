import type { AppLocale } from '../../../i18n/homeStrings'
import { kbDocStatusFilterLabel, kbT } from '../i18n/strings'
import type { KnowledgeBaseDocStatus } from '../types'

export type KnowledgeBaseDocStatusFilter = 'all' | KnowledgeBaseDocStatus

type KnowledgeBaseDocToolbarProps = {
  locale: AppLocale
  statusFilter: KnowledgeBaseDocStatusFilter
  search: string
  hasSelection: boolean
  searchPlaceholderKey?: 'docListSearchPlaceholder' | 'integrationListSearchPlaceholder'
  onStatusFilterChange: (filter: KnowledgeBaseDocStatusFilter) => void
  onSearchChange: (value: string) => void
  onOpenReindexFailed: () => void
  onBulkDownload: () => void
  onBulkRetry: () => void
  onBulkDelete: () => void
  showBulkDelete?: boolean
  showBulkDownload?: boolean
  showBulkRetry?: boolean
  showReindexFailed?: boolean
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 4v10M8.5 10.5 12 14l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M6 8a6 6 0 0 1 10.2-4.2L18 5M18 5h-4M18 5v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 16a6 6 0 0 1-10.2 4.2L6 19M6 19h4M6 19v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 8.5v5M12 16.5h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.3 4.5 2.6 18a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.7 4.5a1.5 1.5 0 0 0-2.6 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M8 7l.7 11.2A1.5 1.5 0 0 0 10.2 19.7h3.6a1.5 1.5 0 0 0 1.5-1.5L16 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const STATUS_FILTERS: KnowledgeBaseDocStatusFilter[] = ['all', 'ready', 'indexing', 'failed']

export function KnowledgeBaseDocToolbar({
  locale,
  statusFilter,
  search,
  hasSelection,
  searchPlaceholderKey = 'docListSearchPlaceholder',
  onStatusFilterChange,
  onSearchChange,
  onOpenReindexFailed,
  onBulkDownload,
  onBulkRetry,
  onBulkDelete,
  showBulkDelete = true,
  showBulkDownload = true,
  showBulkRetry = true,
  showReindexFailed = true,
}: KnowledgeBaseDocToolbarProps) {
  return (
    <div className="kb-doc-toolbar">
      <div className="kb-doc-toolbar-filters">
        <label className="kb-doc-toolbar-filter">
          <select
            className="kb-doc-toolbar-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as KnowledgeBaseDocStatusFilter)}
            aria-label={kbT(locale, 'docListStatusFilter')}
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter} value={filter}>
                {kbDocStatusFilterLabel(locale, filter)}
              </option>
            ))}
          </select>
        </label>
        <label className="kb-doc-toolbar-search">
          <span className="kb-doc-toolbar-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="search"
            className="kb-doc-toolbar-search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={kbT(locale, searchPlaceholderKey)}
            aria-label={kbT(locale, searchPlaceholderKey)}
          />
        </label>
      </div>

      <div className="kb-doc-toolbar-actions">
        {showBulkDownload ? (
        <button
          type="button"
          className="kb-doc-toolbar-btn"
          title={kbT(locale, 'docListToolbarDownload')}
          aria-label={kbT(locale, 'docListToolbarDownload')}
          disabled={!hasSelection}
          onClick={onBulkDownload}
        >
          <DownloadIcon />
        </button>
        ) : null}
        {showBulkRetry ? (
        <button
          type="button"
          className="kb-doc-toolbar-btn"
          title={kbT(locale, 'docListToolbarRetry')}
          aria-label={kbT(locale, 'docListToolbarRetry')}
          disabled={!hasSelection}
          onClick={onBulkRetry}
        >
          <RetryIcon />
        </button>
        ) : null}
        {showReindexFailed ? (
        <button
          type="button"
          className="kb-doc-toolbar-btn"
          title={kbT(locale, 'docListToolbarErrors')}
          aria-label={kbT(locale, 'docListToolbarErrors')}
          onClick={onOpenReindexFailed}
        >
          <ErrorIcon />
        </button>
        ) : null}
        {showBulkDelete ? (
        <button
          type="button"
          className="kb-doc-toolbar-btn kb-doc-toolbar-btn--danger"
          title={kbT(locale, 'docListToolbarDelete')}
          aria-label={kbT(locale, 'docListToolbarDelete')}
          disabled={!hasSelection}
          onClick={onBulkDelete}
        >
          <DeleteIcon />
        </button>
        ) : null}
      </div>
    </div>
  )
}
