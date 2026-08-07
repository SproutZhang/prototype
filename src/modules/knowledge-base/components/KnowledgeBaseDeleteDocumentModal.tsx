import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'

type KnowledgeBaseDeleteDocumentModalProps = {
  locale: AppLocale
  document: KnowledgeBaseDocument | null
  documentName: string
  onClose: () => void
  onConfirm: () => void
}

export function KnowledgeBaseDeleteDocumentModal({
  locale,
  document,
  documentName,
  onClose,
  onConfirm,
}: KnowledgeBaseDeleteDocumentModalProps) {
  if (!document) return null

  const message = kbT(locale, 'deleteDocMessage').replace('{name}', documentName)

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--compact"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kb-delete-doc-title"
        aria-describedby="kb-delete-doc-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-delete-doc-title" className="kb-modal-title">
          {kbT(locale, 'deleteDocTitle')}
        </h2>
        <p id="kb-delete-doc-desc" className="kb-modal-hint">
          {message}
        </p>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--danger" onClick={onConfirm}>
            {kbT(locale, 'deleteDocConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
