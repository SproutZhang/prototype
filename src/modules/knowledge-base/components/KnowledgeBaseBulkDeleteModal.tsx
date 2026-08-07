import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseBulkDeleteModalProps = {
  locale: AppLocale
  open: boolean
  selectedCount: number
  onClose: () => void
  onConfirm: () => void
}

export function KnowledgeBaseBulkDeleteModal({
  locale,
  open,
  selectedCount,
  onClose,
  onConfirm,
}: KnowledgeBaseBulkDeleteModalProps) {
  if (!open || selectedCount <= 0) return null

  const message = kbT(locale, 'listBulkDeleteMessage').replace('{count}', String(selectedCount))

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--compact"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kb-bulk-delete-title"
        aria-describedby="kb-bulk-delete-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-bulk-delete-title" className="kb-modal-title">
          {kbT(locale, 'listBulkDeleteTitle')}
        </h2>
        <p id="kb-bulk-delete-desc" className="kb-modal-hint">
          {message}
        </p>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--danger" onClick={onConfirm}>
            {kbT(locale, 'listBulkDeleteConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
