import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem } from '../types'

type KnowledgeBaseDeleteModalProps = {
  locale: AppLocale
  item: KnowledgeBaseItem | null
  itemName: string
  onClose: () => void
  onConfirm: () => void
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M10 2.5 17.5 16.5H2.5L10 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8v4M10 14.5v.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function KnowledgeBaseDeleteModal({
  locale,
  item,
  itemName,
  onClose,
  onConfirm,
}: KnowledgeBaseDeleteModalProps) {
  if (!item) return null

  const message = kbT(locale, 'deleteKbMessage').replace('{name}', itemName)

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--delete-kb"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kb-delete-kb-title"
        aria-describedby="kb-delete-kb-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-delete-kb-title" className="kb-modal-title">
          {kbT(locale, 'deleteKbTitle')}
        </h2>
        <p id="kb-delete-kb-desc" className="kb-modal-hint">
          {message}
        </p>
        <div className="kb-delete-kb-warning" role="note">
          <span className="kb-delete-kb-warning-icon" aria-hidden="true">
            <WarningIcon />
          </span>
          <p className="kb-delete-kb-warning-text">{kbT(locale, 'deleteKbWarning')}</p>
        </div>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--ghost" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--danger" onClick={onConfirm}>
            {kbT(locale, 'deleteKbConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
