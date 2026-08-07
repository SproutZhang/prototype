import type { AppLocale } from '../../../i18n/homeStrings'
import { ASSIGNED_USERS_TAG_LIMIT } from '../data/workspaceRoles'
import { resolveOrgMemberName } from '../data/orgMembersCatalog'
import { acT } from '../i18n/strings'

type AssignedUsersTagsProps = {
  locale: AppLocale
  memberIds: string[]
  onOpen?: () => void
}

export function resolveAssignedUserNames(locale: AppLocale, memberIds: string[]): string[] {
  return memberIds
    .map((id) => resolveOrgMemberName(id, locale))
    .filter((name): name is string => name != null)
}

export function AssignedUsersTags({ locale, memberIds, onOpen }: AssignedUsersTagsProps) {
  const names = resolveAssignedUserNames(locale, memberIds)

  if (names.length === 0) {
    if (!onOpen) {
      return <span className="ac-roles-assigned-empty">{acT(locale, 'roleNoAssignedUsers')}</span>
    }
    return (
      <button type="button" className="ac-roles-assigned-tags-btn" onClick={onOpen}>
        <span className="ac-roles-assigned-empty">{acT(locale, 'roleNoAssignedUsers')}</span>
      </button>
    )
  }

  const visibleIds = memberIds.slice(0, ASSIGNED_USERS_TAG_LIMIT)
  const overflow = memberIds.length - visibleIds.length
  const overflowNames = resolveAssignedUserNames(locale, memberIds.slice(ASSIGNED_USERS_TAG_LIMIT))
  const overflowTitle = overflow > 0 ? overflowNames.join(locale === 'zh' ? '、' : ', ') : undefined

  const tags = (
    <>
      {visibleIds.map((id) => {
        const name = resolveOrgMemberName(id, locale)
        if (!name) return null
        return (
          <span key={id} className="ac-roles-assigned-tag">
            {name}
          </span>
        )
      })}
      {overflow > 0 ? (
        <span className="ac-roles-assigned-tag ac-roles-assigned-tag--more" title={overflowTitle}>
          +{overflow}
        </span>
      ) : null}
    </>
  )

  if (!onOpen) {
    return <span className="ac-roles-assigned-tags">{tags}</span>
  }

  return (
    <button type="button" className="ac-roles-assigned-tags-btn" onClick={onOpen}>
      <span className="ac-roles-assigned-tags">{tags}</span>
    </button>
  )
}
