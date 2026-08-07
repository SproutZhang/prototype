import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeSpaceName, tcsT } from '../i18n/strings'
import type { TeamCollaborationSpaceItem } from '../types'

type TcsSpaceDeleteModalProps = {
  locale: AppLocale
  open: boolean
  space: TeamCollaborationSpaceItem | null
  onClose: () => void
  onConfirm: () => void
}

export function TcsSpaceDeleteModal({ locale, open, space, onClose, onConfirm }: TcsSpaceDeleteModalProps) {
  if (!open || !space) return null

  const spaceName = localizeSpaceName(space, locale)

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div className="tcs-modal tcs-modal--danger" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="tcs-modal-title tcs-modal-title--danger">{tcsT(locale, 'deleteSpaceTitle')}</h2>
        <p className="tcs-modal-hint">
          {tcsT(locale, 'deleteSpaceHint')
            .replace('{name}', spaceName)
            .replace('{zoneCount}', String(space.zones.length))
            .replace('{count}', String(space.resourceCount))}
        </p>
        <div className="tcs-modal-actions">
          <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>
            {tcsT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn tcs-btn--danger" onClick={onConfirm}>
            {tcsT(locale, 'cardMenuDelete')}
          </button>
        </div>
      </div>
    </div>
  )
}
