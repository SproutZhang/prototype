import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT, type TeamCollaborationSpaceTranslationKey } from '../i18n/strings'

type TcsSuccessToastProps = {
  locale: AppLocale
  open: boolean
  titleKey: TeamCollaborationSpaceTranslationKey
  subKey: TeamCollaborationSpaceTranslationKey
}

export function TcsSuccessToast({ locale, open, titleKey, subKey }: TcsSuccessToastProps) {
  if (!open) return null

  return createPortal(
    <div className="agents-publish-success-toast tcs-success-toast" role="status" aria-live="polite">
      <span className="agents-publish-success-toast__icon" aria-hidden="true">
        ✓
      </span>
      <div className="agents-publish-success-toast__text">
        <strong className="agents-publish-success-toast__title">{tcsT(locale, titleKey)}</strong>
        <span className="agents-publish-success-toast__sub">{tcsT(locale, subKey)}</span>
      </div>
    </div>,
    document.body,
  )
}
