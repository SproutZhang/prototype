import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeProjectGroupName, tcsT } from '../i18n/strings'
import type { ProjectGroup } from '../types'

type ProjectGroupDeleteModalProps = {
  locale: AppLocale
  open: boolean
  group: ProjectGroup | null
  projectCount: number
  onClose: () => void
  onConfirm: () => void
}

export function ProjectGroupDeleteModal({
  locale,
  open,
  group,
  projectCount,
  onClose,
  onConfirm,
}: ProjectGroupDeleteModalProps) {
  if (!open || !group) return null

  const groupName = localizeProjectGroupName(group, locale)

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tcs-modal tcs-modal--danger"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="tcs-modal-title tcs-modal-title--danger">
          {tcsT(locale, 'deleteProjectGroupTitle')}
        </h2>
        <p className="tcs-modal-hint">
          {tcsT(locale, 'deleteProjectGroupHint')
            .replace('{name}', groupName)
            .replace('{count}', String(projectCount))}
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
