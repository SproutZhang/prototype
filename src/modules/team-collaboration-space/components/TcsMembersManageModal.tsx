import { MembersManageModal, type SpaceCustomRoleOption } from '../../access-control'
import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import type { TcsMemberAssignment, TcsOrgMember, TcsRolePreset } from '../types'

type TcsMembersManageModalProps = {
  locale: AppLocale
  open: boolean
  members: TcsMemberAssignment[]
  orgMembers: TcsOrgMember[]
  localizeMember: (member: TcsOrgMember) => string
  localizeMemberDept: (member: TcsOrgMember) => string
  onClose: () => void
  onAdd: () => void
  onEdit: (assignment: TcsMemberAssignment) => void
  onRemove: (memberId: string) => void
  onRoleChange?: (assignment: TcsMemberAssignment, preset: Exclude<TcsRolePreset, 'custom'>) => void
  spaceCustomRoles?: SpaceCustomRoleOption[]
  onRoleSelectChange?: (assignment: TcsMemberAssignment, value: string) => void
  onManageRoles?: () => void
  manageLocked?: boolean
  manageLockedMessage?: string
}

export function TcsMembersManageModal({
  manageLocked,
  manageLockedMessage,
  onManageRoles,
  spaceCustomRoles,
  onRoleSelectChange,
  ...props
}: TcsMembersManageModalProps) {
  return (
    <MembersManageModal
      {...props}
      title={tcsT(props.locale, 'tabMembers')}
      manageRolesLabel={tcsT(props.locale, 'spaceRolesManageAction')}
      manageLocked={manageLocked}
      manageLockedMessage={manageLockedMessage}
      onManageRoles={onManageRoles}
      spaceCustomRoles={spaceCustomRoles}
      onRoleSelectChange={onRoleSelectChange}
    />
  )
}
