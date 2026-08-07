import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseIntegrationItem } from '../types'

type KnowledgeBaseDeleteIntegrationModalProps = {
  locale: AppLocale
  item: KnowledgeBaseIntegrationItem | null
  itemName: string
  onClose: () => void
  onConfirm: () => void
}

export function KnowledgeBaseDeleteIntegrationModal({
  locale,
  item,
  itemName,
  onClose,
  onConfirm,
}: KnowledgeBaseDeleteIntegrationModalProps) {
  if (!item) return null

  const message = kbT(locale, 'deleteIntegrationMessage').replace('{name}', itemName)

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--compact"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kb-delete-integration-title"
        aria-describedby="kb-delete-integration-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-delete-integration-title" className="kb-modal-title">
          {kbT(locale, 'deleteIntegrationTitle')}
        </h2>
        <p id="kb-delete-integration-desc" className="kb-modal-hint">
          {message}
        </p>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--danger" onClick={onConfirm}>
            {kbT(locale, 'deleteIntegrationConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
