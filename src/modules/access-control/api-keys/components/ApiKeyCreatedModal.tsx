import { useId, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type ApiKeyCreatedModalProps = {
  locale: AppLocale
  open: boolean
  secretToken: string
  onClose: () => void
}

export function ApiKeyCreatedModal({ locale, open, secretToken, onClose }: ApiKeyCreatedModalProps) {
  const titleId = useId()
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secretToken)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="ac-modal-overlay ac-modal-overlay--nested" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--api-key-created"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ac-modal-title">
          {acT(locale, 'apiKeyCreatedTitle')}
        </h2>
        <p className="ac-modal-hint">{acT(locale, 'apiKeyCreatedHint')}</p>

        <div className="ac-api-key-secret-panel">
          <code className="ac-api-key-secret-value">{secretToken}</code>
          <button type="button" className="agents-btn" onClick={handleCopy}>
            {copied ? acT(locale, 'apiKeyCopied') : acT(locale, 'apiKeyCopy')}
          </button>
        </div>

        <div className="ac-modal-actions">
          <button type="button" className="agents-btn agents-btn-primary" onClick={onClose}>
            {acT(locale, 'apiKeyCreatedDone')}
          </button>
        </div>
      </div>
    </div>
  )
}
