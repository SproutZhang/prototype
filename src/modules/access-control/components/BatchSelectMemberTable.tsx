import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'
import type { OrgMember } from '../types'
import {
  memberAvatarColors,
  memberAvatarInitialsForMember,
} from '../utils/memberAvatar'

function localizeMemberName(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.nameZh : member.nameEn
}

type BatchSelectMemberTableProps = {
  locale: AppLocale
  members: readonly OrgMember[]
  selectedIds: ReadonlySet<string>
  atLimit: boolean
  showPermissionColumn?: boolean
  onToggleMember: (memberId: string) => void
  onToggleAll: (members: readonly OrgMember[]) => void
}

export function BatchSelectMemberTable({
  locale,
  members,
  selectedIds,
  atLimit,
  showPermissionColumn = false,
  onToggleMember,
  onToggleAll,
}: BatchSelectMemberTableProps) {
  const allSelected = members.length > 0 && members.every((member) => selectedIds.has(member.id))
  const someSelected = members.some((member) => selectedIds.has(member.id))
  const columnCount = showPermissionColumn ? 3 : 2

  return (
    <div className="kb-permissions-config-inner">
      <div className="kb-permissions-table-wrap">
        <table className="kb-permissions-table">
          <thead>
            <tr>
              <th scope="col" className="kb-permissions-table-user-col">
                {acT(locale, 'batchSelectTableUsername')}
              </th>
              {showPermissionColumn ? (
                <th scope="col">{acT(locale, 'batchSelectTablePermissionConfig')}</th>
              ) : null}
              <th scope="col" className="kb-permissions-table-auth-col">
                <label className="kb-permissions-table-auth-all">
                  <span>{acT(locale, 'rolePermissionsSelectAll')}</span>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = someSelected && !allSelected
                      }
                    }}
                    onChange={() => onToggleAll(members)}
                    aria-label={acT(locale, 'rolePermissionsSelectAll')}
                  />
                </label>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="kb-permissions-table-empty">
                  {acT(locale, 'formSearchNoResults')}
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const memberName = localizeMemberName(member, locale)
                const avatar = memberAvatarColors(member.id)
                const isSelected = selectedIds.has(member.id)
                const disabled = !isSelected && atLimit
                return (
                  <tr key={member.id} className={isSelected ? 'is-selected' : undefined}>
                    <td className="kb-permissions-table-user">
                      <div className="kb-permissions-table-user-cell">
                        <span
                          className="kb-permissions-table-user-avatar"
                          style={{ background: avatar.background, color: avatar.color }}
                          aria-hidden="true"
                        >
                          {memberAvatarInitialsForMember(member, locale)}
                        </span>
                        <div className="kb-permissions-table-user-meta">
                          <span className="kb-permissions-table-user-name">{memberName}</span>
                          <span className="kb-permissions-table-user-email">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    {showPermissionColumn ? <td className="kb-permissions-table-level" /> : null}
                    <td className="kb-permissions-table-auth-col">
                      <div className="kb-permissions-table-auth-cell">
                        <label className="kb-permissions-table-auth-row">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disabled}
                            aria-label={`${memberName} ${acT(locale, 'batchSelectTableAuth')}`}
                            onChange={() => onToggleMember(member.id)}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
