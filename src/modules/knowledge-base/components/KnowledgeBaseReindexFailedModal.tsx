import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseReindexFailedModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function KnowledgeBaseReindexFailedModal({
  locale,
  open,
  onClose,
  onConfirm,
}: KnowledgeBaseReindexFailedModalProps) {
  if (!open) return null

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--reindex"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-reindex-failed-title"
        aria-describedby="kb-reindex-failed-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-reindex-failed-title" className="kb-modal-title">
          {kbT(locale, 'reindexFailedTitle')}
        </h2>
        <p id="kb-reindex-failed-desc" className="kb-modal-hint">
          {kbT(locale, 'reindexFailedMessage')}
        </p>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--solid" onClick={onConfirm}>
            {kbT(locale, 'reindexFailedConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
