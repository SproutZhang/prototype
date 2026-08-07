import type { AppLocale } from '../../../i18n/homeStrings'
import { kbDocStatusLabel, kbT } from '../i18n/strings'
import type { KnowledgeBaseDocStatus } from '../types'
import type { KnowledgeBaseIntegrationGroupStatus } from '../utils/aggregateIntegrationItemStatus'

type KnowledgeBaseDocStatusIconProps = {
  locale: AppLocale
  status: KnowledgeBaseDocStatus | KnowledgeBaseIntegrationGroupStatus
}

function IndexingStatusSpinner() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" focusable="false" aria-hidden="true">
      <circle cx="8" cy="8" r="1.25" fill="#96B4F5" />
      <g className="kb-doc-status-spinner">
        <circle
          cx="8"
          cy="8"
          r="5.75"
          fill="none"
          stroke="#96B4F5"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="2.1 2.5"
        />
      </g>
    </svg>
  )
}

export function KnowledgeBaseDocStatusIcon({ locale, status }: KnowledgeBaseDocStatusIconProps) {
  if (status === 'ready') {
    return (
      <span
        className="kb-doc-status-icon kb-doc-status-icon--ready"
        role="img"
        aria-label={kbDocStatusLabel(locale, 'ready')}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
          <circle cx="8" cy="8" r="8" fill="#22c55e" />
          <path
            d="M4.5 8.2 6.8 10.5 11.5 5.8"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  if (status === 'indexing') {
    return (
      <span
        className="kb-doc-status-icon kb-doc-status-icon--indexing"
        role="img"
        aria-label={kbDocStatusLabel(locale, 'indexing')}
      >
        <IndexingStatusSpinner />
      </span>
    )
  }

  if (status === 'warning') {
    return (
      <span
        className="kb-doc-status-icon kb-doc-status-icon--warning"
        role="img"
        aria-label={kbT(locale, 'statusWarning')}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
          <path d="M8 1.8 14.6 14H1.4L8 1.8Z" fill="#f59e0b" />
          <path d="M8 5.5v3.5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.75" r="0.75" fill="#fff" />
        </svg>
      </span>
    )
  }

  return (
    <span
      className="kb-doc-status-icon kb-doc-status-icon--failed"
      role="img"
      aria-label={kbDocStatusLabel(locale, 'failed')}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
        <circle cx="8" cy="8" r="8" fill="#ef4444" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}
