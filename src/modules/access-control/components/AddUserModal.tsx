import { useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeWorkspaceOption, WORKSPACE_OPTIONS } from '../data/orgMembersCatalog'
import type { WorkspaceRoleRow } from '../data/workspaceRoles'
import { acT } from '../i18n/strings'
import type { OrgMember } from '../types'
import { resolveRoleLabel, type RoleDisplayOverride } from '../utils/roleDisplay'
import { AddUserBatchSelectionPreview } from './AddUserBatchSelectionPreview'
import { BatchSelectUsersModal } from './BatchSelectUsersModal'
import { SearchableSelect } from './SearchableSelect'

export type AddUserPayload = {
  memberIds: string[]
  workspaceId: string
  roleId: string
}

export type CreateSpacePayload = {
  name: string
  description: string
}

type AddUserModalProps = {
  locale: AppLocale
  open: boolean
  candidates: OrgMember[]
  roles: WorkspaceRoleRow[]
  roleOverridesById?: Record<string, RoleDisplayOverride>
  initialBatchPickerOpen?: boolean
  fixedWorkspaceId?: string
  fixedWorkspaceLabel?: string
  fixedRoleId?: string
  fixedRoleLabel?: string
  initialMemberIds?: string[]
  initialRoleId?: string
  variant?: 'addUser' | 'createSpace'
  titleKey?: 'inviteUserTitle' | 'createNewSpace' | 'memberActionInvite'
  submitKey?: 'inviteUserSend' | 'confirmCreate'
  onClose: () => void
  onConfirm: (payload: AddUserPayload | CreateSpacePayload) => void
}

type AddUserFormErrors = Partial<Record<'memberIds' | 'workspaceId' | 'roleId', string>>
type CreateSpaceFormErrors = Partial<Record<'name', string>>

function ModalCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AddUserModal({
  locale,
  open,
  candidates,
  roles,
  roleOverridesById,
  initialBatchPickerOpen = false,
  fixedWorkspaceId,
  fixedWorkspaceLabel,
  fixedRoleId,
  fixedRoleLabel,
  initialMemberIds,
  initialRoleId,
  variant = 'addUser',
  titleKey = 'inviteUserTitle',
  submitKey = 'inviteUserSend',
  onClose,
  onConfirm,
}: AddUserModalProps) {
  const isCreateSpace = variant === 'createSpace'
  const [batchPickerOpen, setBatchPickerOpen] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [workspaceId, setWorkspaceId] = useState(WORKSPACE_OPTIONS[0]?.id ?? '')
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const [spaceName, setSpaceName] = useState('')
  const [spaceDescription, setSpaceDescription] = useState('')
  const [addUserErrors, setAddUserErrors] = useState<AddUserFormErrors>({})
  const [createSpaceErrors, setCreateSpaceErrors] = useState<CreateSpaceFormErrors>({})

  const userOptions = useMemo(
    () =>
      candidates.map((member) => ({
        value: member.id,
        label: `${locale === 'zh' ? member.nameZh : member.nameEn} · ${member.email}`,
      })),
    [candidates, locale],
  )

  const selectedMembers = useMemo(
    () =>
      selectedMemberIds
        .map((id) => candidates.find((member) => member.id === id))
        .filter((member): member is OrgMember => member != null),
    [selectedMemberIds, candidates],
  )

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        label: resolveRoleLabel(role, roleOverridesById?.[role.id]),
      })),
    [roles, roleOverridesById],
  )

  useEffect(() => {
    if (!open) return
    setBatchPickerOpen(initialBatchPickerOpen)
    setSelectedMemberIds(initialMemberIds ?? [])
    setWorkspaceId(fixedWorkspaceId ?? WORKSPACE_OPTIONS[0]?.id ?? '')
    setRoleId(fixedRoleId ?? initialRoleId ?? roles[0]?.id ?? '')
    setSpaceName('')
    setSpaceDescription('')
    setAddUserErrors({})
    setCreateSpaceErrors({})
  }, [
    open,
    candidates,
    roles,
    initialBatchPickerOpen,
    fixedWorkspaceId,
    fixedRoleId,
    initialMemberIds,
    initialRoleId,
  ])

  if (!open) return null

  const validateAddUser = (): AddUserFormErrors => {
    const next: AddUserFormErrors = {}
    if (selectedMemberIds.length === 0) next.memberIds = acT(locale, 'createNewUserRequired')
    if (!workspaceId) next.workspaceId = acT(locale, 'createNewUserRequired')
    if (!roleId) next.roleId = acT(locale, 'createNewUserRequired')
    return next
  }

  const validateCreateSpace = (): CreateSpaceFormErrors => {
    const next: CreateSpaceFormErrors = {}
    if (!spaceName.trim()) next.name = acT(locale, 'createNewUserRequired')
    return next
  }

  const handleSubmit = () => {
    if (isCreateSpace) {
      const nextErrors = validateCreateSpace()
      setCreateSpaceErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return
      onConfirm({
        name: spaceName.trim(),
        description: spaceDescription.trim(),
      })
      onClose()
      return
    }

    const nextErrors = validateAddUser()
    setAddUserErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onConfirm({
      memberIds: selectedMemberIds,
      workspaceId: fixedWorkspaceId ?? workspaceId,
      roleId: fixedRoleId ?? roleId,
    })
    onClose()
  }

  const handleBatchBack = () => {
    setBatchPickerOpen(false)
  }

  const handleBatchSave = (memberIds: string[]) => {
    setSelectedMemberIds(memberIds)
    setBatchPickerOpen(false)
    setAddUserErrors((prev) => ({ ...prev, memberIds: undefined }))
  }

  const handleSelectedMembersChange = (memberIds: string[]) => {
    setSelectedMemberIds(memberIds)
    setAddUserErrors((prev) => ({ ...prev, memberIds: undefined }))
  }

  const overlayClose = isCreateSpace ? onClose : batchPickerOpen ? handleBatchBack : onClose

  return (
    <div
      className="ac-modal-overlay"
      role="presentation"
      onClick={overlayClose}
    >
      {!isCreateSpace && batchPickerOpen ? (
        <BatchSelectUsersModal
          locale={locale}
          open
          embedded
          candidates={candidates}
          initialSelectedIds={selectedMemberIds}
          onClose={handleBatchBack}
          onSave={handleBatchSave}
        />
      ) : (
        <div
          className="ac-modal ac-modal--create-user"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ac-add-user-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ac-modal-title-row">
            <h2 id="ac-add-user-title" className="ac-modal-title">
              {acT(locale, titleKey)}
            </h2>
            <button
              type="button"
              className="ac-modal-close"
              aria-label={acT(locale, 'modalClose')}
              onClick={onClose}
            >
              <ModalCloseIcon />
            </button>
          </div>
          <div className="ac-modal-form ac-modal-form--create-user">
            {isCreateSpace ? (
              <>
                <label className="ac-field">
                  <span>{acT(locale, 'createSpaceName')}</span>
                  <input
                    type="text"
                    value={spaceName}
                    onChange={(event) => {
                      setSpaceName(event.target.value)
                      setCreateSpaceErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    autoComplete="off"
                  />
                  {createSpaceErrors.name ? (
                    <span className="ac-field-error">{createSpaceErrors.name}</span>
                  ) : null}
                </label>
                <label className="ac-field">
                  <span>{acT(locale, 'createSpaceDescription')}</span>
                  <textarea
                    value={spaceDescription}
                    onChange={(event) => setSpaceDescription(event.target.value)}
                    rows={4}
                  />
                </label>
              </>
            ) : (
              <>
            <section className="ac-modal-form-section">
              <h3 className="ac-modal-form-section-title">{acT(locale, 'addUserSelectUser')}</h3>
              <SearchableSelect
                multiple
                value={selectedMemberIds}
                options={userOptions}
                onChange={handleSelectedMembersChange}
                placeholder={acT(locale, 'addUserSelectUserPlaceholder')}
                searchPlaceholder={acT(locale, 'searchPlaceholder')}
                emptyMessage={acT(locale, 'formSearchNoResults')}
                ariaLabel={acT(locale, 'addUserSelectUser')}
              />
              <AddUserBatchSelectionPreview locale={locale} members={selectedMembers} />
              <button
                type="button"
                className="ac-add-user-mode-toggle"
                onClick={() => setBatchPickerOpen(true)}
              >
                {acT(locale, 'batchAddUsers')}
              </button>
              {addUserErrors.memberIds ? (
                <span className="ac-field-error">{addUserErrors.memberIds}</span>
              ) : null}
            </section>
            {fixedWorkspaceLabel ? (
            <section className="ac-modal-form-section">
              <h3 className="ac-modal-form-section-title">{acT(locale, 'addUserWorkspace')}</h3>
              <label className="ac-field">
                <input
                  type="text"
                  value={fixedWorkspaceLabel}
                  disabled
                  readOnly
                  aria-readonly="true"
                />
              </label>
            </section>
            ) : fixedWorkspaceId ? null : (
            <section className="ac-modal-form-section">
              <h3 className="ac-modal-form-section-title">{acT(locale, 'addUserWorkspace')}</h3>
              <label className="ac-field">
                <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
                  {WORKSPACE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {localizeWorkspaceOption(option, locale)}
                    </option>
                  ))}
                </select>
                {addUserErrors.workspaceId ? (
                  <span className="ac-field-error">{addUserErrors.workspaceId}</span>
                ) : null}
              </label>
            </section>
            )}
            {fixedRoleLabel ? (
              <section className="ac-modal-form-section">
                <h3 className="ac-modal-form-section-title">{acT(locale, 'addUserAssignRole')}</h3>
                <label className="ac-field">
                  <input
                    type="text"
                    value={fixedRoleLabel}
                    disabled
                    readOnly
                    aria-readonly="true"
                  />
                </label>
              </section>
            ) : (
              <section className="ac-modal-form-section">
                <h3 className="ac-modal-form-section-title">{acT(locale, 'addUserAssignRole')}</h3>
                <label className="ac-field">
                  <select value={roleId} onChange={(event) => setRoleId(event.target.value)}>
                    {roleOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {addUserErrors.roleId ? (
                    <span className="ac-field-error">{addUserErrors.roleId}</span>
                  ) : null}
                </label>
              </section>
            )}
              </>
            )}
          </div>
          <div className="ac-modal-actions">
            <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
              {acT(locale, 'formCancel')}
            </button>
            <button type="button" className="agents-btn agents-btn-primary" onClick={handleSubmit}>
              {acT(locale, submitKey)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
