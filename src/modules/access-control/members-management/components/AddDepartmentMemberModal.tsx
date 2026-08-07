import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { localizeOrgMemberName } from '../../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../../data/workspaceRoles'
import { acT } from '../../i18n/strings'
import type { OrgMember } from '../../types'
import { resolveRoleLabel, type RoleDisplayOverride } from '../../utils/roleDisplay'
import {
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../../departments-management/data/departmentsSeed'
import { BatchSelectUsersModal } from '../../components/BatchSelectUsersModal'
import { mockDepartmentPublicId } from '../utils/departmentPublicId'
import {
  buildOrgInviteLink,
  buildOrgInviteQrCodeUrl,
  createOrgInviteCode,
  createOrgInviteToken,
} from '../utils/orgInviteLink'

export type AddDepartmentMemberPayload = {
  name: string
  departmentId: string
  phone: string
  supervisorId: string | null
  position: string
  email: string
  roleId: string
  employeeId: string
  officeLocation: string
  joinDate: string
  staffUserId: string
  notes: string
}

export type AddDepartmentMembersByStructurePayload = {
  departmentId: string
  memberIds: string[]
}

type AddDepartmentMemberModalProps = {
  locale: AppLocale
  open: boolean
  department: OrgDepartmentRow | null
  departments: OrgDepartmentRow[]
  orgMembers: OrgMember[]
  roles: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  onClose: () => void
  onSave: (payload: AddDepartmentMemberPayload) => void
  onAddByStructure?: (payload: AddDepartmentMembersByStructurePayload) => void
  onInviteMembers?: () => void
  onBatchImport?: () => void
}

type AddMemberMode = 'single' | 'members' | 'invite' | 'batch'

type MemberFormSnapshot = {
  name: string
  departmentId: string
  phone: string
  supervisorId: string
  position: string
  email: string
  roleId: string
  employeeId: string
  officeLocation: string
  joinDate: string
  staffUserId: string
  notes: string
}

type InviteLinkExpiry = 'permanent' | '7d' | '30d' | '90d' | '1y'

const INVITE_LINK_EXPIRY_OPTIONS: InviteLinkExpiry[] = ['permanent', '7d', '30d', '90d', '1y']

function serializeMemberFormSnapshot(snapshot: MemberFormSnapshot): string {
  return JSON.stringify(snapshot)
}

function AdvancedChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
      className={`ac-dept-edit-advanced-chevron${expanded ? ' is-expanded' : ''}`}
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InviteToggleSwitch({
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
      <path d="M3 12.5h10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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

function BatchExcelIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false">
      <rect x="8" y="6" width="24" height="28" rx="3" fill="#e8f7ee" stroke="#52c41a" strokeWidth="1.5" />
      <path d="M14 14h12M14 20h12M14 26h8" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" />
      <text x="11" y="24" fill="#52c41a" fontSize="10" fontWeight="700">X</text>
    </svg>
  )
}

function BatchHistoryIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3.2l2 1.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function downloadMemberTemplate(locale: AppLocale) {
  const header =
    locale === 'zh'
      ? '姓名,手机,邮箱,部门,职位,工号'
      : 'Name,Phone,Email,Department,Position,Employee ID'
  const sample =
    locale === 'zh'
      ? '张三,13800000000,zhangsan@example.com,产品部,产品经理,E001'
      : 'Alice,13800000000,alice@example.com,Product,PM,E001'
  const content = `${header}\n${sample}\n`
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = locale === 'zh' ? '通讯录导入模板.csv' : 'member-import-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function AddDepartmentMemberInvitePanel({
  locale,
  department,
}: {
  locale: AppLocale
  department: OrgDepartmentRow
}) {
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

  const departmentPublicId = department.departmentCode || mockDepartmentPublicId(department.id)

  const inviteLink = useMemo(() => {
    if (inviteStopped) return ''
    return buildOrgInviteLink(department.id, departmentPublicId, inviteToken)
  }, [department.id, departmentPublicId, inviteStopped, inviteToken])

  const inviteCode = useMemo(() => {
    if (inviteStopped) return ''
    return createOrgInviteCode(departmentPublicId, inviteToken)
  }, [departmentPublicId, inviteStopped, inviteToken])

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
    setCopied(false)
    setCodeCopied(false)
    setAllowMemberInvite(true)
    setNoApprovalRequired(true)
    setLinkExpiry('permanent')
    setInviteToken(createOrgInviteToken())
    setInviteStopped(false)
  }, [department.id])

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
    if (inviteStopped || !qrCodeUrl) return
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
    <>
      <div className="ac-invite-members-body">
        {inviteStopped ? (
          <p className="ac-invite-members-stopped-banner">{acT(locale, 'inviteMembersStoppedHint')}</p>
        ) : null}

        <section className="ac-invite-members-section ac-invite-members-section--code">
          <h3 className="ac-invite-members-section-title">
            {acT(locale, 'inviteMembersInviteCodeSection')}
          </h3>
          <p className="ac-invite-members-section-hint">{acT(locale, 'inviteMembersInviteCodeHint')}</p>
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
            <p className="ac-invite-members-section-hint">{acT(locale, 'inviteMembersOrgLinkHint')}</p>
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
          <h3 className="ac-invite-members-config-heading">{acT(locale, 'inviteMembersConfigSection')}</h3>
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
              <InviteToggleSwitch
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
              <InviteToggleSwitch
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
        <button type="button" className="agents-btn ac-invite-members-refresh-btn" onClick={handleRefreshLink}>
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
    </>
  )
}

function AddDepartmentMemberBatchImportPanel({
  locale,
  onCancel,
  onImport,
}: {
  locale: AppLocale
  onCancel: () => void
  onImport: () => void
}) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [autoCreateDeptGroups, setAutoCreateDeptGroups] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedFile(null)
    setAutoCreateDeptGroups(false)
    setIsDragOver(false)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const acceptFile = (file: File | null) => {
    if (!file) return
    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx') && !lowerName.endsWith('.csv')) {
      return
    }
    setSelectedFile(file)
    if (error) setError(null)
  }

  const handleImport = () => {
    if (!selectedFile) {
      setError(acT(locale, 'memberBatchImportNoFile'))
      return
    }
    setError(null)
    onImport()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0] ?? null)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    acceptFile(event.dataTransfer.files?.[0] ?? null)
  }

  return (
    <>
      <div className="ac-add-member-batch-import-body">
        <section className="ac-member-batch-import-section">
          <h3 className="ac-member-batch-import-step-title">{acT(locale, 'memberBatchImportStep1')}</h3>
          <p className="ac-member-batch-import-step-hint">
            {acT(locale, 'memberBatchImportStep1HintPrefix')}
            <button type="button" className="ac-member-batch-import-text-link">
              {acT(locale, 'memberBatchImportModifyFields')}
            </button>
          </p>
          <button
            type="button"
            className="ac-member-batch-import-download-btn"
            onClick={() => downloadMemberTemplate(locale)}
          >
            <DownloadIcon />
            <span>{acT(locale, 'memberBatchImportDownloadTemplate')}</span>
          </button>
        </section>

        <section className="ac-member-batch-import-section">
          <div className="ac-member-batch-import-step-header">
            <h3 className="ac-member-batch-import-step-title">{acT(locale, 'memberBatchImportStep2')}</h3>
            <button type="button" className="ac-member-batch-import-records-link">
              <BatchHistoryIcon />
              <span>{acT(locale, 'memberBatchImportUploadRecords')}</span>
            </button>
          </div>

          <div
            className={`ac-member-batch-import-upload-zone${isDragOver ? ' is-drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <BatchExcelIcon />
            <p className="ac-member-batch-import-upload-hint">{acT(locale, 'memberBatchImportUploadHint')}</p>
            <button
              type="button"
              className="ac-member-batch-import-select-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {acT(locale, 'memberBatchImportSelectFile')}
            </button>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              className="ac-member-batch-import-file-input"
              accept=".xls,.xlsx,.csv"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <p className="ac-member-batch-import-file-name">{selectedFile.name}</p>
            ) : null}
          </div>

          <label className="ac-member-batch-import-checkbox">
            <input
              type="checkbox"
              checked={autoCreateDeptGroups}
              onChange={(event) => setAutoCreateDeptGroups(event.target.checked)}
            />
            <span>{acT(locale, 'memberBatchImportAutoCreateDeptGroups')}</span>
          </label>

          <ul className="ac-member-batch-import-notes">
            <li>{acT(locale, 'memberBatchImportNote1')}</li>
            <li>{acT(locale, 'memberBatchImportNote2')}</li>
            <li>
              {acT(locale, 'memberBatchImportNote3Prefix')}
              <button type="button" className="ac-member-batch-import-text-link">
                {acT(locale, 'memberBatchImportSmsTemplate')}
              </button>
            </li>
          </ul>
        </section>

        {error ? <p className="ac-form-error ac-member-batch-import-error">{error}</p> : null}
      </div>

      <div className="ac-modal-actions ac-modal-actions--dept-edit">
        <button type="button" className="ac-btn ac-btn--secondary" onClick={onCancel}>
          {acT(locale, 'formCancel')}
        </button>
        <button
          type="button"
          className="agents-btn agents-btn-primary"
          disabled={!selectedFile}
          onClick={handleImport}
        >
          {acT(locale, 'memberBatchImportConfirm')}
        </button>
      </div>
    </>
  )
}

function AddDepartmentMemberByMembersPanel({
  locale,
  titleId,
  departmentId,
  departmentOptions,
  candidates,
  onDepartmentIdChange,
  onSelectionChange,
}: {
  locale: AppLocale
  titleId: string
  departmentId: string
  departmentOptions: Array<{ id: string; label: string }>
  candidates: OrgMember[]
  onDepartmentIdChange: (departmentId: string) => void
  onSelectionChange: (memberIds: string[]) => void
}) {
  return (
    <>
      <div className="ac-add-member-by-members-dept-row">
        <div className="ac-dept-edit-field">
          <label className="ac-dept-edit-label" htmlFor={`${titleId}-members-department`}>
            {acT(locale, 'memberDept')}
          </label>
          <select
            id={`${titleId}-members-department`}
            className="ac-dept-edit-select"
            value={departmentId}
            onChange={(event) => onDepartmentIdChange(event.target.value)}
          >
            {departmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="ac-add-member-by-members-hint">{acT(locale, 'addMemberByMembersHint')}</p>
      </div>
      <BatchSelectUsersModal
        locale={locale}
        open
        embedded
        panelMode
        membersOnly
        candidates={candidates}
        initialSelectedIds={[]}
        onClose={() => undefined}
        onSave={() => undefined}
        onSelectionChange={onSelectionChange}
      />
    </>
  )
}

export function AddDepartmentMemberModal({
  locale,
  open,
  department,
  departments,
  orgMembers,
  roles,
  roleOverridesById,
  onClose,
  onSave,
  onAddByStructure,
  onInviteMembers: showInviteTab,
  onBatchImport: showBatchTab,
}: AddDepartmentMemberModalProps) {
  const titleId = useId()
  const formBaselineRef = useRef('')
  const [activeMode, setActiveMode] = useState<AddMemberMode>('single')
  const [membersSelectedMemberIds, setMembersSelectedMemberIds] = useState<string[]>([])
  const [membersError, setMembersError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [phone, setPhone] = useState('')
  const [supervisorId, setSupervisorId] = useState('')
  const [position, setPosition] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [officeLocation, setOfficeLocation] = useState('')
  const [joinDate, setJoinDate] = useState('')
  const [staffUserId, setStaffUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  const showMembersTab = onAddByStructure != null && orgMembers.length > 0
  const showModeTabs =
    showMembersTab || showInviteTab != null || showBatchTab != null

  const resolvedDepartment = useMemo(() => {
    if (department) return department
    if (!departmentId) return null
    return departments.find((item) => item.id === departmentId) ?? null
  }, [department, departmentId, departments])

  const departmentOptions = useMemo(
    () =>
      departments.map((item) => ({
        id: item.id,
        label: localizeDepartmentName(item, locale),
      })),
    [departments, locale],
  )

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        label: resolveRoleLabel(role, roleOverridesById?.[role.id]),
      })),
    [roles, roleOverridesById],
  )

  const supervisorOptions = useMemo(
    () =>
      orgMembers.map((member) => ({
        id: member.id,
        label: localizeOrgMemberName(member, locale),
      })),
    [locale, orgMembers],
  )

  useEffect(() => {
    if (!open) return
    const initialDepartmentId = department?.id ?? departments[0]?.id ?? ''
    setActiveMode('single')
    setMembersSelectedMemberIds([])
    setMembersError(null)
    setName('')
    setDepartmentId(initialDepartmentId)
    setPhone('')
    setSupervisorId('')
    setPosition('')
    setEmail('')
    setRoleId(roles[0]?.id ?? '')
    setEmployeeId('')
    setOfficeLocation('')
    setJoinDate('')
    setStaffUserId('')
    setNotes('')
    setAdvancedExpanded(false)
    formBaselineRef.current = serializeMemberFormSnapshot({
      name: '',
      departmentId: initialDepartmentId,
      phone: '',
      supervisorId: '',
      position: '',
      email: '',
      roleId: roles[0]?.id ?? '',
      employeeId: '',
      officeLocation: '',
      joinDate: '',
      staffUserId: '',
      notes: '',
    })
  }, [open, department?.id, departments, roles])

  const canSaveMembers =
    Boolean(departmentId) && membersSelectedMemberIds.length > 0

  const currentFormSnapshot = serializeMemberFormSnapshot({
    name,
    departmentId,
    phone,
    supervisorId,
    position,
    email,
    roleId,
    employeeId,
    officeLocation,
    joinDate,
    staffUserId,
    notes,
  })

  const canSave = currentFormSnapshot !== formBaselineRef.current

  if (!open) return null

  const handleSave = () => {
    if (!canSave) return

    onSave({
      name: name.trim(),
      departmentId: departmentId || (department?.id ?? ''),
      phone: phone.trim(),
      supervisorId: supervisorId || null,
      position: position.trim(),
      email: email.trim(),
      roleId: roleId || (roles[0]?.id ?? ''),
      employeeId: employeeId.trim(),
      officeLocation: officeLocation.trim(),
      joinDate: joinDate.trim(),
      staffUserId: staffUserId.trim(),
      notes: notes.trim(),
    })
  }

  const handleMembersSave = () => {
    if (!departmentId) {
      setMembersError(acT(locale, 'addMemberByMembersNoDepartment'))
      return
    }
    if (membersSelectedMemberIds.length === 0) {
      setMembersError(acT(locale, 'addMemberByMembersNoSelection'))
      return
    }
    setMembersError(null)
    onAddByStructure?.({
      departmentId,
      memberIds: membersSelectedMemberIds,
    })
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--department-edit ac-modal--add-department-member"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--dept-edit">
          <h2 id={titleId} className="ac-modal-title">{acT(locale, 'addDepartmentMemberTitle')}</h2>
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

        {showModeTabs ? (
          <div className="ac-add-member-modal-toolbar">
            <div
              className="ac-add-member-mode-tabs"
              role="tablist"
              aria-label={acT(locale, 'addDepartmentMemberTitle')}
            >
              <button
                type="button"
                role="tab"
                className={`ac-add-member-mode-tab${activeMode === 'single' ? ' is-active' : ''}`}
                aria-selected={activeMode === 'single'}
                onClick={() => setActiveMode('single')}
              >
                {acT(locale, 'addUserSwitchToSingle')}
              </button>
              {showMembersTab ? (
                <button
                  type="button"
                  role="tab"
                  className={`ac-add-member-mode-tab${activeMode === 'members' ? ' is-active' : ''}`}
                  aria-selected={activeMode === 'members'}
                  onClick={() => setActiveMode('members')}
                >
                  {acT(locale, 'addMemberByMembers')}
                </button>
              ) : null}
              {showInviteTab != null ? (
                <button
                  type="button"
                  role="tab"
                  className={`ac-add-member-mode-tab${activeMode === 'invite' ? ' is-active' : ''}`}
                  aria-selected={activeMode === 'invite'}
                  onClick={() => setActiveMode('invite')}
                >
                  {acT(locale, 'inviteMembers')}
                </button>
              ) : null}
              {showBatchTab != null ? (
                <button
                  type="button"
                  role="tab"
                  className={`ac-add-member-mode-tab${activeMode === 'batch' ? ' is-active' : ''}`}
                  aria-selected={activeMode === 'batch'}
                  onClick={() => setActiveMode('batch')}
                >
                  {acT(locale, 'memberBatchImport')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeMode === 'single' ? (
          <div className="ac-add-member-modal-panel" role="tabpanel">
            <div className="ac-dept-edit-body">
              <div className="ac-dept-edit-field-row">
                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-name`}>
                    {acT(locale, 'memberDirectoryName')}
                  </label>
                  <input
                    id={`${titleId}-name`}
                    type="text"
                    className="ac-dept-edit-input"
                    value={name}
                    placeholder={acT(locale, 'formInputPlaceholder')}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>

                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-department`}>
                    {acT(locale, 'memberDept')}
                  </label>
                  <select
                    id={`${titleId}-department`}
                    className="ac-dept-edit-select"
                    value={departmentId}
                    onChange={(event) => setDepartmentId(event.target.value)}
                  >
                    {departmentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ac-dept-edit-field-row">
                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-supervisor`}>
                    {acT(locale, 'memberDirectSupervisor')}
                  </label>
                  <select
                    id={`${titleId}-supervisor`}
                    className="ac-dept-edit-select"
                    value={supervisorId}
                    onChange={(event) => setSupervisorId(event.target.value)}
                  >
                    <option value="">{acT(locale, 'memberDirectSupervisorPlaceholder')}</option>
                    {supervisorOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-position`}>
                    {acT(locale, 'memberPosition')}
                  </label>
                  <input
                    id={`${titleId}-position`}
                    type="text"
                    className="ac-dept-edit-input"
                    value={position}
                    placeholder={acT(locale, 'formInputPlaceholder')}
                    onChange={(event) => setPosition(event.target.value)}
                  />
                </div>
              </div>

              <div className="ac-dept-edit-field-row">
                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-role`}>
                    {acT(locale, 'memberColumnRole')}
                  </label>
                  <select
                    id={`${titleId}-role`}
                    className="ac-dept-edit-select"
                    value={roleId}
                    onChange={(event) => setRoleId(event.target.value)}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-employee-id`}>
                    {acT(locale, 'memberEmployeeId')}
                  </label>
                  <input
                    id={`${titleId}-employee-id`}
                    type="text"
                    className="ac-dept-edit-input"
                    value={employeeId}
                    placeholder={acT(locale, 'formInputPlaceholder')}
                    onChange={(event) => setEmployeeId(event.target.value)}
                  />
                </div>
              </div>

              <div className="ac-dept-edit-field-row">
                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-email`}>
                    {acT(locale, 'memberEmail')}
                  </label>
                  <input
                    id={`${titleId}-email`}
                    type="email"
                    className="ac-dept-edit-input"
                    value={email}
                    placeholder={acT(locale, 'formInputPlaceholder')}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-phone`}>
                    {acT(locale, 'memberPhone')}
                  </label>
                  <input
                    id={`${titleId}-phone`}
                    type="text"
                    className="ac-dept-edit-input"
                    value={phone}
                    placeholder={acT(locale, 'formInputPlaceholder')}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
              </div>

              <div className="ac-dept-edit-advanced-section">
                <div
                  className={`ac-dept-edit-advanced-panel${advancedExpanded ? ' is-expanded' : ' is-collapsed'}`}
                >
                  <button
                    type="button"
                    className="ac-dept-edit-advanced-toggle"
                    aria-expanded={advancedExpanded}
                    onClick={() => setAdvancedExpanded((prev) => !prev)}
                  >
                    <span className="ac-dept-edit-advanced-title">
                      {acT(locale, 'addMemberAdvancedSettings')}
                    </span>
                    <AdvancedChevronIcon expanded={advancedExpanded} />
                  </button>

                  {advancedExpanded ? (
                    <div className="ac-dept-edit-advanced-fields">
                      <div className="ac-dept-edit-field">
                        <label className="ac-dept-edit-label" htmlFor={`${titleId}-office-location`}>
                          {acT(locale, 'memberOfficeLocation')}
                        </label>
                        <input
                          id={`${titleId}-office-location`}
                          type="text"
                          className="ac-dept-edit-input"
                          value={officeLocation}
                          placeholder={acT(locale, 'formInputPlaceholder')}
                          onChange={(event) => setOfficeLocation(event.target.value)}
                        />
                      </div>

                      <div className="ac-dept-edit-field">
                        <label className="ac-dept-edit-label" htmlFor={`${titleId}-join-date`}>
                          {acT(locale, 'memberJoinDate')}
                        </label>
                        <input
                          id={`${titleId}-join-date`}
                          type="date"
                          className="ac-dept-edit-input ac-dept-edit-input--date"
                          value={joinDate}
                          onChange={(event) => setJoinDate(event.target.value)}
                        />
                      </div>

                      <div className="ac-dept-edit-field">
                        <label className="ac-dept-edit-label" htmlFor={`${titleId}-staff-id`}>
                          {acT(locale, 'memberStaffId')}
                        </label>
                        <input
                          id={`${titleId}-staff-id`}
                          type="text"
                          className="ac-dept-edit-input"
                          value={staffUserId}
                          placeholder={acT(locale, 'formInputPlaceholder')}
                          onChange={(event) => setStaffUserId(event.target.value)}
                        />
                      </div>

                      <div className="ac-dept-edit-field">
                        <label className="ac-dept-edit-label" htmlFor={`${titleId}-notes`}>
                          {acT(locale, 'memberNotes')}
                        </label>
                        <textarea
                          id={`${titleId}-notes`}
                          className="ac-dept-edit-textarea"
                          rows={3}
                          value={notes}
                          placeholder={acT(locale, 'formInputPlaceholder')}
                          onChange={(event) => setNotes(event.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ac-modal-actions ac-modal-actions--dept-edit">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
                {acT(locale, 'formCancel')}
              </button>
              <button
                type="button"
                className="agents-btn agents-btn-primary"
                disabled={!canSave}
                onClick={handleSave}
              >
                {acT(locale, 'formSave')}
              </button>
            </div>
          </div>
        ) : null}

        {activeMode === 'members' ? (
          <div className="ac-add-member-modal-panel ac-add-member-modal-panel--members" role="tabpanel">
            <AddDepartmentMemberByMembersPanel
              locale={locale}
              titleId={titleId}
              departmentId={departmentId}
              departmentOptions={departmentOptions}
              candidates={orgMembers}
              onDepartmentIdChange={(nextDepartmentId) => {
                setDepartmentId(nextDepartmentId)
                setMembersError(null)
              }}
              onSelectionChange={setMembersSelectedMemberIds}
            />
            {membersError ? (
              <p className="ac-form-error ac-add-member-by-members-error">{membersError}</p>
            ) : null}
            <div className="ac-modal-actions ac-modal-actions--dept-edit">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
                {acT(locale, 'formCancel')}
              </button>
              <button
                type="button"
                className="agents-btn agents-btn-primary"
                disabled={!canSaveMembers}
                onClick={handleMembersSave}
              >
                {acT(locale, 'formSave')}
              </button>
            </div>
          </div>
        ) : null}

        {activeMode === 'invite' ? (
          <div
            className="ac-add-member-modal-panel"
            role="tabpanel"
            key={resolvedDepartment ? `invite-${resolvedDepartment.id}` : 'invite-no-dept'}
          >
            {resolvedDepartment ? (
              <AddDepartmentMemberInvitePanel locale={locale} department={resolvedDepartment} />
            ) : (
              <div className="ac-dept-edit-body ac-invite-members-select-dept">
                <p className="ac-invite-members-select-dept-hint">
                  {acT(locale, 'inviteMembersSelectDepartmentHint')}
                </p>
                <div className="ac-dept-edit-field">
                  <label className="ac-dept-edit-label" htmlFor={`${titleId}-invite-department`}>
                    {acT(locale, 'memberDept')}
                  </label>
                  <select
                    id={`${titleId}-invite-department`}
                    className="ac-dept-edit-select"
                    value={departmentId}
                    onChange={(event) => setDepartmentId(event.target.value)}
                  >
                    <option value="">{acT(locale, 'formSelectPlaceholder')}</option>
                    {departmentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {activeMode === 'batch' ? (
          <div className="ac-add-member-modal-panel" role="tabpanel" key="batch-import">
            <AddDepartmentMemberBatchImportPanel locale={locale} onCancel={onClose} onImport={onClose} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
