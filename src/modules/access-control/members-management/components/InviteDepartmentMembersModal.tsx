import { useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { OrgDepartmentRow } from '../../departments-management/data/departmentsSeed'
import { mockDepartmentPublicId } from '../utils/departmentPublicId'
import {
  buildOrgInviteLink,
  buildOrgInviteQrCodeUrl,
  createOrgInviteCode,
  createOrgInviteToken,
} from '../utils/orgInviteLink'

type InviteDepartmentMembersModalProps = {
  locale: AppLocale
  open: boolean
  department: OrgDepartmentRow | null
  onClose: () => void
}

type InviteLinkExpiry = 'permanent' | '7d' | '30d' | '90d' | '1y'

const INVITE_LINK_EXPIRY_OPTIONS: InviteLinkExpiry[] = ['permanent', '7d', '30d', '90d', '1y']

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`ac-dept-toggle-switch ac-invite-members-toggle${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="ac-dept-toggle-switch-thumb" />
    </button>
  )
}

function inviteLinkExpiryLabel(locale: AppLocale, expiry: InviteLinkExpiry): string {
  const keyMap: Record<InviteLinkExpiry, string> = {
    permanent: 'inviteMembersLinkExpiryPermanent',
    '7d': 'inviteMembersLinkExpiry7Days',
    '30d': 'inviteMembersLinkExpiry30Days',
    '90d': 'inviteMembersLinkExpiry90Days',
    '1y': 'inviteMembersLinkExpiry1Year',
  }
  return acT(locale, keyMap[expiry])
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <rect
        x="5.5"
        y="5.5"
        width="7"
        height="7"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M4.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M8 2.5v7M8 9.5l3-3M8 9.5l-3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M13.5 2.5v3.5H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 8a5.5 5.5 0 0 1 9.2-4M2.5 13.5v-3.5H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 8a5.5 5.5 0 0 1-9.2 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InviteDepartmentMembersModal({
  locale,
  open,
  department,
  onClose,
}: InviteDepartmentMembersModalProps) {
  const titleId = useId()
  const linkInputId = useId()
  const inviteCodeInputId = useId()
  const expirySelectId = useId()
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [allowMemberInvite, setAllowMemberInvite] = useState(true)
  const [noApprovalRequired, setNoApprovalRequired] = useState(true)
  const [linkExpiry, setLinkExpiry] = useState<InviteLinkExpiry>('permanent')
  const [inviteToken, setInviteToken] = useState(() => createOrgInviteToken())
  const [inviteStopped, setInviteStopped] = useState(false)

  const departmentPublicId = department?.departmentCode || (department ? mockDepartmentPublicId(department.id) : '')

  const inviteLink = useMemo(() => {
    if (!department || inviteStopped) return ''
    return buildOrgInviteLink(department.id, departmentPublicId, inviteToken)
  }, [department, departmentPublicId, inviteStopped, inviteToken])

  const inviteCode = useMemo(() => {
    if (!department || inviteStopped) return ''
    return createOrgInviteCode(departmentPublicId, inviteToken)
  }, [department, departmentPublicId, inviteStopped, inviteToken])

  const qrCodeUrl = useMemo(() => {
    if (!inviteLink) return ''
    return buildOrgInviteQrCodeUrl(inviteLink)
  }, [inviteLink])

  const linkDisplayValue = inviteStopped
    ? acT(locale, 'inviteMembersStoppedPlaceholder')
    : inviteLink

  const inviteCodeDisplayValue = inviteStopped
    ? acT(locale, 'inviteMembersStoppedPlaceholder')
    : inviteCode

  useEffect(() => {
    if (!open) return
    setCopied(false)
    setCodeCopied(false)
    setAllowMemberInvite(true)
    setNoApprovalRequired(true)
    setLinkExpiry('permanent')
    setInviteToken(createOrgInviteToken())
    setInviteStopped(false)
  }, [open, department?.id])

  if (!open || !department) return null

  const handleCopyLink = async () => {
    if (inviteStopped || !inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleCopyInviteCode = async () => {
    if (inviteStopped || !inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCodeCopied(true)
      window.setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      setCodeCopied(false)
    }
  }

  const handleRefreshLink = () => {
    setInviteToken(createOrgInviteToken())
    setInviteStopped(false)
    setCopied(false)
    setCodeCopied(false)
  }

  const handleStopInvite = () => {
    setInviteStopped(true)
    setCopied(false)
    setCodeCopied(false)
  }

  const handleDownloadQr = async () => {
    if (inviteStopped || !qrCodeUrl || !department) return
    const fileName = `org-invite-qr-${department.id}.png`

    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = fileName
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--invite-members"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--dept-edit">
          <h2 id={titleId} className="ac-modal-title">{acT(locale, 'inviteMembersTitle')}</h2>
          <button
            type="button"
            className="ac-modal-close"
            onClick={onClose}
            aria-label={acT(locale, 'modalClose')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="ac-invite-members-body">
          {inviteStopped ? (
            <p className="ac-invite-members-stopped-banner">{acT(locale, 'inviteMembersStoppedHint')}</p>
          ) : null}

          <section className="ac-invite-members-section ac-invite-members-section--code">
            <h3 className="ac-invite-members-section-title">
              {acT(locale, 'inviteMembersInviteCodeSection')}
            </h3>
            <p className="ac-invite-members-section-hint">
              {acT(locale, 'inviteMembersInviteCodeHint')}
            </p>
            <div className="ac-invite-members-link-main">
              <input
                id={inviteCodeInputId}
                type="text"
                className={`ac-invite-members-link-input ac-invite-members-code-input${inviteStopped ? ' is-stopped' : ''}`}
                value={inviteCodeDisplayValue}
                readOnly
                aria-label={acT(locale, 'inviteMembersInviteCodeSection')}
              />
            </div>
            <button
              type="button"
              className="agents-btn ac-invite-members-copy-btn ac-invite-members-section-action"
              disabled={inviteStopped}
              onClick={() => void handleCopyInviteCode()}
            >
              <CopyIcon />
              <span>
                {codeCopied
                  ? acT(locale, 'inviteMembersCopyInviteCodeSuccess')
                  : acT(locale, 'inviteMembersCopyInviteCode')}
              </span>
            </button>
          </section>

          <div className="ac-invite-members-share-row">
            <section className="ac-invite-members-section ac-invite-members-section--link">
              <h3 className="ac-invite-members-section-title">
                {acT(locale, 'inviteMembersOrgLinkSection')}
              </h3>
              <p className="ac-invite-members-section-hint">
                {acT(locale, 'inviteMembersOrgLinkHint')}
              </p>
              <div className="ac-invite-members-link-main">
                <input
                  id={linkInputId}
                  type="text"
                  className={`ac-invite-members-link-input${inviteStopped ? ' is-stopped' : ''}`}
                  value={linkDisplayValue}
                  readOnly
                  aria-label={acT(locale, 'inviteMembersOrgLinkSection')}
                />
              </div>
              <button
                type="button"
                className="agents-btn ac-invite-members-copy-btn ac-invite-members-section-action"
                disabled={inviteStopped}
                onClick={() => void handleCopyLink()}
              >
                <CopyIcon />
                <span>
                  {copied ? acT(locale, 'inviteMembersCopyLinkSuccess') : acT(locale, 'inviteMembersCopyLink')}
                </span>
              </button>
            </section>

            <section className="ac-invite-members-section ac-invite-members-section--qr">
              <h3 className="ac-invite-members-section-title">
                {acT(locale, 'inviteMembersOrgQrSection')}
              </h3>
              <p className="ac-invite-members-section-hint">{acT(locale, 'inviteMembersOrgQrHint')}</p>
              <div className={`ac-invite-members-qr-wrap${inviteStopped ? ' is-stopped' : ''}`}>
                {inviteStopped ? (
                  <div className="ac-invite-members-qr-stopped">
                    {acT(locale, 'inviteMembersStoppedPlaceholder')}
                  </div>
                ) : (
                  <img
                    className="ac-invite-members-qr-image"
                    src={qrCodeUrl}
                    width={160}
                    height={160}
                    alt={acT(locale, 'inviteMembersOrgQrAlt')}
                  />
                )}
              </div>
              <div className="ac-invite-members-qr-actions">
                <button
                  type="button"
                  className="agents-btn ac-invite-members-download-btn ac-invite-members-section-action"
                  disabled={inviteStopped}
                  onClick={() => void handleDownloadQr()}
                >
                  <DownloadIcon />
                  <span>{acT(locale, 'inviteMembersDownloadQr')}</span>
                </button>
              </div>
            </section>
          </div>

          <div className="ac-invite-members-config">
            <h3 className="ac-invite-members-config-heading">
              {acT(locale, 'inviteMembersConfigSection')}
            </h3>
            <div className="ac-invite-members-config-panel">
              <div className="ac-invite-members-config-setting">
                <div className="ac-invite-members-config-setting-text">
                  <span className="ac-invite-members-config-setting-label">
                    {acT(locale, 'inviteMembersAllowMemberInvite')}
                  </span>
                  <span className="ac-invite-members-config-setting-hint">
                    {acT(locale, 'inviteMembersAllowMemberInviteHint')}
                  </span>
                </div>
                <ToggleSwitch
                  checked={allowMemberInvite}
                  onChange={setAllowMemberInvite}
                  ariaLabel={acT(locale, 'inviteMembersAllowMemberInvite')}
                />
              </div>

              <div className="ac-invite-members-config-setting">
                <div className="ac-invite-members-config-setting-text">
                  <span className="ac-invite-members-config-setting-label">
                    {acT(locale, 'inviteMembersNoApprovalRequired')}
                  </span>
                  <span className="ac-invite-members-config-setting-hint">
                    {acT(locale, 'inviteMembersNoApprovalRequiredHint')}
                  </span>
                </div>
                <ToggleSwitch
                  checked={noApprovalRequired}
                  onChange={setNoApprovalRequired}
                  ariaLabel={acT(locale, 'inviteMembersNoApprovalRequired')}
                />
              </div>

              <div className="ac-invite-members-config-field">
                <label className="ac-invite-members-config-field-label" htmlFor={expirySelectId}>
                  {acT(locale, 'inviteMembersLinkExpiry')}
                </label>
                <select
                  id={expirySelectId}
                  className="ac-dept-edit-select ac-invite-members-expiry-select"
                  value={linkExpiry}
                  onChange={(event) => setLinkExpiry(event.target.value as InviteLinkExpiry)}
                >
                  {INVITE_LINK_EXPIRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {inviteLinkExpiryLabel(locale, option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="ac-modal-actions ac-modal-actions--invite-members">
          <button
            type="button"
            className="agents-btn ac-invite-members-refresh-btn"
            onClick={handleRefreshLink}
          >
            <RefreshIcon />
            <span>{acT(locale, 'inviteMembersRefreshLink')}</span>
          </button>
          <button
            type="button"
            className="agents-btn ac-btn--danger ac-invite-members-stop-btn"
            disabled={inviteStopped}
            onClick={handleStopInvite}
          >
            {acT(locale, 'inviteMembersStopInvite')}
          </button>
        </div>
      </div>
    </div>
  )
}
