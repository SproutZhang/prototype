import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import type { TcsOrgMember } from '../types'

type TcsFormMemberPreviewListItemProps = {
  locale: AppLocale
  member: TcsOrgMember
  removable?: boolean
  onRemove?: () => void
}

export function TcsFormMemberPreviewListItem({
  locale,
  member,
  removable,
  onRemove,
}: TcsFormMemberPreviewListItemProps) {
  const name = locale === 'zh' ? member.nameZh : member.nameEn
  const canRemove = removable ?? Boolean(onRemove)

  return (
    <li
      className={`tcs-form-members-preview-item${canRemove ? ' tcs-form-members-preview-item--removable' : ''}`}
    >
      <span className="tcs-form-members-preview-item-name">{name}</span>
      {canRemove && onRemove ? (
        <button
          type="button"
          className="tcs-form-members-preview-item-remove"
          aria-label={tcsT(locale, 'removeMember')}
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          ×
        </button>
      ) : null}
    </li>
  )
}
