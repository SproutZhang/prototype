import { useCallback, useEffect, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'
import type { MemberAssignment, OrgMember, RolePreset } from '../types'
import { MembersPanel, type SpaceCustomRoleOption } from './MembersPanel'
import { RemoveMemberConfirmModal } from './RemoveMemberConfirmModal'

type MembersManageModalProps = {
  locale: AppLocale
  open: boolean
  members: MemberAssignment[]
  orgMembers: OrgMember[]
  localizeMember: (member: OrgMember) => string
  localizeMemberDept: (member: OrgMember) => string
  onClose: () => void
  onAdd: () => void
  onEdit: (assignment: MemberAssignment) => void
  onRemove: (memberId: string) => void
  onRoleChange?: (assignment: MemberAssignment, preset: Exclude<RolePreset, 'custom'>) => void
  spaceCustomRoles?: SpaceCustomRoleOption[]
  onRoleSelectChange?: (assignment: MemberAssignment, value: string) => void
  title?: string
  /** 项空间：打开角色管理（仅 Admin） */
  onManageRoles?: () => void
  manageRolesLabel?: string
  /** 项目失效等场景：禁止增删改成员 */
  manageLocked?: boolean
  manageLockedMessage?: string
}

export function MembersManageModal({
  locale,
  open,
  members,
  orgMembers,
  localizeMember,
  localizeMemberDept,
  onClose,
  onAdd,
  onEdit,
  onRemove,
  onRoleChange,
  spaceCustomRoles,
  onRoleSelectChange,
  title,
  onManageRoles,
  manageRolesLabel,
  manageLocked = false,
  manageLockedMessage,
}: MembersManageModalProps) {
  const [memberPendingRemove, setMemberPendingRemove] = useState<string | null>(null)
  const [lockedNoticeVisible, setLockedNoticeVisible] = useState(false)

  useEffect(() => {
    if (!open) setLockedNoticeVisible(false)
  }, [open])

  const notifyLocked = useCallback(() => {
    setLockedNoticeVisible(true)
  }, [])

  const runUnlessLocked = useCallback(
    (action: () => void) => {
      if (manageLocked) {
        notifyLocked()
        return
      }
      action()
    },
    [manageLocked, notifyLocked],
  )

  const pendingMember = memberPendingRemove
    ? orgMembers.find((member) => member.id === memberPendingRemove)
    : null

  const handleConfirmRemove = useCallback(() => {
    if (!memberPendingRemove) return
    onRemove(memberPendingRemove)
    setMemberPendingRemove(null)
  }, [memberPendingRemove, onRemove])

  if (!open) return null

  return (
    <>
      <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--members-manage"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-members-manage-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--members-manage">
          <h2 id="ac-members-manage-title" className="ac-modal-title">
            {title ?? acT(locale, 'tabMembers')}
          </h2>
          <div className="ac-modal-title-row-actions">
            {onManageRoles ? (
              <button type="button" className="ac-btn ac-btn--secondary" onClick={onManageRoles}>
                {manageRolesLabel ?? acT(locale, 'spaceRolesManageAction')}
              </button>
            ) : null}
            <button
              type="button"
              className={`agents-btn agents-btn-primary${manageLocked ? ' is-disabled' : ''}`}
              aria-disabled={manageLocked || undefined}
              onClick={() => runUnlessLocked(onAdd)}
            >
              + {acT(locale, 'addMember')}
            </button>
          </div>
        </div>
        {lockedNoticeVisible && manageLockedMessage ? (
          <p className="ac-members-manage-locked-notice" role="status">
            {manageLockedMessage}
          </p>
        ) : null}
        <MembersPanel
          locale={locale}
          members={members}
          orgMembers={orgMembers}
          localizeMember={localizeMember}
          localizeMemberDept={localizeMemberDept}
          hideToolbar
          manageLocked={manageLocked}
          onManageLockedClick={notifyLocked}
          onAdd={onAdd}
          onEdit={onEdit}
          onRemove={setMemberPendingRemove}
          onRoleChange={onRoleChange}
          spaceCustomRoles={spaceCustomRoles}
          onRoleSelectChange={onRoleSelectChange}
        />
        <div className="ac-modal-actions">
          <button
            type="button"
            className={`ac-btn ac-btn--secondary${manageLocked ? ' is-disabled' : ''}`}
            aria-disabled={manageLocked || undefined}
            onClick={() => (manageLocked ? notifyLocked() : onClose())}
          >
            {acT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className={`agents-btn agents-btn-primary${manageLocked ? ' is-disabled' : ''}`}
            aria-disabled={manageLocked || undefined}
            onClick={() => runUnlessLocked(onClose)}
          >
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
      <RemoveMemberConfirmModal
        locale={locale}
        open={memberPendingRemove != null}
        memberName={pendingMember ? localizeMember(pendingMember) : memberPendingRemove ?? ''}
        onClose={() => setMemberPendingRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </>
  )
}
