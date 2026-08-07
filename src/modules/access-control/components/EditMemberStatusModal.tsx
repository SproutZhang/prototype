import { useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { acT } from '../i18n/strings'
import type { MemberAssignment } from '../types'
import {
  memberStatusActionButtonLabel,
  memberStatusLabel,
  type MockMemberStatus,
} from '../utils/memberTableDisplay'

const MEMBER_STATUS_ACTIONS: MockMemberStatus[] = ['active', 'inactive']

function isStatusTargetEnabled(current: MockMemberStatus, target: MockMemberStatus): boolean {
  if (target === current) return false
  switch (current) {
    case 'pending':
      return target === 'active' || target === 'inactive'
    case 'active':
      return target === 'inactive'
    case 'inactive':
      return target === 'active'
    default:
      return false
  }
}

export type MemberStatusSavePayload = {
  memberId: string
  status: MockMemberStatus
}

type EditMemberStatusModalProps = {
  locale: AppLocale
  open: boolean
  assignment: MemberAssignment | null
  memberName: string
  memberEmail: string
  roleLabel: string
  workspaceLabel: string
  initialStatus: MockMemberStatus
  onClose: () => void
  onSave: (payload: MemberStatusSavePayload) => void
}

function hashMemberId(memberId: string): number {
  let hash = 0
  for (const char of memberId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

function memberAvatarInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    const withoutSuffix = trimmed.replace(/\d+$/, '')
    return (withoutSuffix.slice(-2) || trimmed.slice(0, 2)).toUpperCase()
  }
  return trimmed
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function memberAvatarColors(memberId: string): { background: string; color: string } {
  const hue = hashMemberId(memberId) % 360
  return {
    background: `hsl(${hue} 68% 90%)`,
    color: `hsl(${hue} 42% 38%)`,
  }
}

export function EditMemberStatusModal({
  locale,
  open,
  assignment,
  memberName,
  memberEmail,
  roleLabel,
  workspaceLabel,
  initialStatus,
  onClose,
  onSave,
}: EditMemberStatusModalProps) {
  const [draftStatus, setDraftStatus] = useState<MockMemberStatus>('active')

  useEffect(() => {
    if (!open || !assignment) return
    setDraftStatus(initialStatus)
  }, [open, assignment, initialStatus])

  const avatarStyle = useMemo(
    () => (assignment ? memberAvatarColors(assignment.memberId) : { background: '#eef0ff', color: '#3b5bcc' }),
    [assignment],
  )

  if (!open || !assignment) return null

  const metaLine = `${roleLabel} · ${workspaceLabel}`
  const avatarInitials = memberAvatarInitials(memberName)
  const hasStatusChange = draftStatus !== initialStatus

  const handleSave = () => {
    if (!hasStatusChange) return
    onSave({ memberId: assignment.memberId, status: draftStatus })
    onClose()
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--member-status"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-member-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ac-member-detail-title" className="sr-only">
          {acT(locale, 'memberDetailTitle')}
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
                  <span className={`ac-member-profile-status ac-member-profile-status--${initialStatus}`}>
                    {memberStatusLabel(locale, initialStatus)}
                  </span>
                </div>
                <p className="ac-member-profile-meta">{metaLine}</p>
                <p className="ac-member-profile-email">{memberEmail}</p>
              </div>
            </div>
          </section>
          <section className="ac-member-detail-edit">
            <div className="ac-member-status-actions">
              <span className="ac-member-status-actions-label">{acT(locale, 'memberActivationStatus')}</span>
              <div
                className="ac-member-status-actions-row"
                role="group"
                aria-label={acT(locale, 'memberActivationStatus')}
              >
                {MEMBER_STATUS_ACTIONS.map((status) => {
                  const enabled = isStatusTargetEnabled(initialStatus, status)
                  const isCurrent = status === initialStatus
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`ac-member-status-action ac-member-status-action--${status}${draftStatus === status ? ' is-selected' : ''}${isCurrent ? ' is-current' : ''}`}
                      aria-pressed={draftStatus === status}
                      disabled={!enabled}
                      onClick={() => setDraftStatus(status)}
                    >
                      {memberStatusActionButtonLabel(locale, status, initialStatus)}
                    </button>
                  )
                })}
              </div>
              {draftStatus !== initialStatus ? (
                <div className="ac-member-status-selected-preview">
                  <span className={`ac-member-status ac-member-status--${draftStatus}`}>
                    {memberStatusLabel(locale, draftStatus)}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            disabled={!hasStatusChange}
            onClick={handleSave}
          >
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
