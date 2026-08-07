import { useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { getOrgMemberById } from '../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'
import { memberAvatarColors, memberAvatarInitialsForMember } from '../utils/memberAvatar'
import { resolveRoleLabel, type RoleDisplayOverride } from '../utils/roleDisplay'

export type MemberRoleSavePayload = {
  memberId: string
  roleId: string
  previousRoleId: string
}

type EditMemberRoleModalProps = {
  locale: AppLocale
  open: boolean
  memberId: string | null
  initialRoleId: string | null
  memberName: string
  memberEmail: string
  workspaceLabel: string
  roles: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  onClose: () => void
  onSave: (payload: MemberRoleSavePayload) => void
}

export function EditMemberRoleModal({
  locale,
  open,
  memberId,
  initialRoleId,
  memberName,
  memberEmail,
  workspaceLabel,
  roles,
  roleOverridesById,
  onClose,
  onSave,
}: EditMemberRoleModalProps) {
  const [draftRoleId, setDraftRoleId] = useState('')

  useEffect(() => {
    if (!open || !initialRoleId) return
    setDraftRoleId(initialRoleId)
  }, [open, initialRoleId])

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        label: resolveRoleLabel(role, roleOverridesById?.[role.id]),
      })),
    [roleOverridesById, roles],
  )

  const orgMember = memberId ? getOrgMemberById(memberId) : undefined
  const avatarStyle = useMemo(
    () => (memberId ? memberAvatarColors(memberId) : { background: '#eef0ff', color: '#3b5bcc' }),
    [memberId],
  )
  const avatarInitials = orgMember
    ? memberAvatarInitialsForMember(orgMember, locale)
    : memberName.trim().charAt(0).toUpperCase() || '?'

  if (!open || !memberId || !initialRoleId) return null

  const hasRoleChange = draftRoleId !== initialRoleId && draftRoleId.length > 0

  const handleSave = () => {
    if (!hasRoleChange) return
    onSave({ memberId, roleId: draftRoleId, previousRoleId: initialRoleId })
    onClose()
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--member-status"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-member-role-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-member-role-title" className="ac-modal-title">
          {acT(locale, 'editRole')}
        </h2>
        <div className="ac-modal-form ac-modal-form--member-status">
          <section className="ac-member-profile-card" aria-label={acT(locale, 'memberDetailTitle')}>
            <div className="ac-member-profile-head">
              <div
                className="ac-member-profile-avatar"
                style={{ background: avatarStyle.background, color: avatarStyle.color }}
                aria-hidden="true"
              >
                {avatarInitials}
              </div>
              <div className="ac-member-profile-main">
                <div className="ac-member-profile-title-row">
                  <h3 className="ac-member-profile-name">{memberName}</h3>
                </div>
                <p className="ac-member-profile-meta">{workspaceLabel}</p>
                <p className="ac-member-profile-email">{memberEmail}</p>
              </div>
            </div>
          </section>
          <section className="ac-modal-form-section">
            <h3 className="ac-modal-form-section-title">{acT(locale, 'addUserAssignRole')}</h3>
            <label className="ac-field">
              <span>{acT(locale, 'memberEditRole')}</span>
              <select value={draftRoleId} onChange={(event) => setDraftRoleId(event.target.value)}>
                {roleOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            disabled={!hasRoleChange}
            onClick={handleSave}
          >
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
