import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { KnowledgeBaseStringKey } from '../i18n/strings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseSuccessToastProps = {
  locale: AppLocale
  open: boolean
  titleKey: KnowledgeBaseStringKey
  subKey: KnowledgeBaseStringKey
}

export function KnowledgeBaseSuccessToast({ locale, open, titleKey, subKey }: KnowledgeBaseSuccessToastProps) {
  if (!open) return null

  return createPortal(
    <div className="agents-publish-success-toast" role="status" aria-live="polite">
      <span className="agents-publish-success-toast__icon" aria-hidden="true">
        ✓
      </span>
      <div className="agents-publish-success-toast__text">
        <strong className="agents-publish-success-toast__title">{kbT(locale, titleKey)}</strong>
        <span className="agents-publish-success-toast__sub">{kbT(locale, subKey)}</span>
      </div>
    </div>,
    document.body,
  )
}
