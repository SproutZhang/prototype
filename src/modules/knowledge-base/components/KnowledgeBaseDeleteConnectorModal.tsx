import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseDeleteConnectorModalProps = {
  locale: AppLocale
  connectorName: string | null
  onClose: () => void
  onConfirm: () => void
}

export function KnowledgeBaseDeleteConnectorModal({
  locale,
  connectorName,
  onClose,
  onConfirm,
}: KnowledgeBaseDeleteConnectorModalProps) {
  if (!connectorName) return null

  const message = kbT(locale, 'deleteConnectorMessage').replace('{name}', connectorName)

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-delete-connector" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--compact"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kb-delete-connector-title"
        aria-describedby="kb-delete-connector-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-delete-connector-title" className="kb-modal-title">
          {kbT(locale, 'deleteConnectorTitle')}
        </h2>
        <p id="kb-delete-connector-desc" className="kb-modal-hint">
          {message}
        </p>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--danger" onClick={onConfirm}>
            {kbT(locale, 'deleteConnectorConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
