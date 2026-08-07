import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'

import { BatchSelectUsersModal } from '../../access-control/components/BatchSelectUsersModal'
import type { AppLocale } from '../../../i18n/homeStrings'
import {
  buildInitialMembersForAccessMode,
  buildPreviewMemberAssignments,
  mapRolePresetToInviteCategory,
} from '../utils/memberInit'
import { TcsAccessModeSelect } from './TcsAccessModeSelect'
import { TcsFormMemberPreviewListItem } from './TcsFormMemberPreviewListItem'
import { TcsSearchableSelect } from './TcsSearchableSelect'
import {
  inviteMemberRoleLabel,
  defaultInvitePresetForAccessMode,
  INVITE_MEMBER_PRESET_OPTIONS,
  localizeProjectGroupName,
  PREVIEW_MEMBER_GROUP_ORDER,
  tcsT,
  type InviteMemberPreset,
} from '../i18n/strings'
import type {
  InvitedMemberAssignment,
  ProjectGroup,
  ProjectGroupFormDraft,
  SpaceAccessMode,
  TeamCollaborationSpaceItem,
  TcsOrgMember,
} from '../types'

type RoleMemberPreviewGroup = {
  preset: InviteMemberPreset
  label: string
  members: TcsOrgMember[]
}

type RoleMemberPreviewGroupsProps = {
  locale: AppLocale
  groups: RoleMemberPreviewGroup[]
  expandedPresets: Set<InviteMemberPreset>
  onTogglePreset: (preset: InviteMemberPreset) => void
  className?: string
  onRemoveMember?: (memberId: string) => void
}

function RoleMemberPreviewGroups({
  locale,
  groups,
  expandedPresets,
  onTogglePreset,
  className,
  onRemoveMember,
}: RoleMemberPreviewGroupsProps) {
  return (
    <div className={className ?? 'tcs-form-members-preview-groups'}>
      {groups.map((group) => {
        const isExpanded = expandedPresets.has(group.preset)
        return (
          <div key={group.preset} className="tcs-form-members-preview-group">
            <button
              type="button"
              className="tcs-form-members-preview-group-toggle"
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? tcsT(locale, 'formPreviewMembersCollapse')
                  : tcsT(locale, 'formPreviewMembersExpand')
              }
              onClick={() => onTogglePreset(group.preset)}
            >
              <span className="tcs-form-members-preview-group-title">
                {group.label} ({group.members.length})
              </span>
              <svg
                className={`tcs-form-members-preview-chevron${isExpanded ? ' is-open' : ''}`}
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isExpanded ? (
              <ul className="tcs-form-members-preview-list">
                {group.members.map((member) => (
                  <TcsFormMemberPreviewListItem
                    key={member.id}
                    locale={locale}
                    member={member}
                    onRemove={onRemoveMember ? () => onRemoveMember(member.id) : undefined}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

type ProjectGroupFormModalProps = {
  locale: AppLocale
  open: boolean
  editingGroup: ProjectGroup | null
  copySourceOptions: TeamCollaborationSpaceItem[]
  orgMembers?: TcsOrgMember[]
  showAccessSettings?: boolean
  /** 仅编辑访问权限（公共空间）：隐藏名称字段 */
  accessSettingsOnly?: boolean
  /** 公共空间等场景：不展示引入成员（全员可见） */
  hideInviteMembers?: boolean
  /** 新建项目空间：访问权限中不展示「共享」 */
  excludeSharedAccessMode?: boolean
  onClose: () => void
  onSubmit: (draft: ProjectGroupFormDraft) => void
}

export function ProjectGroupFormModal({
  locale,
  open,
  editingGroup,
  copySourceOptions,
  orgMembers = [],
  showAccessSettings = true,
  accessSettingsOnly = false,
  hideInviteMembers = false,
  excludeSharedAccessMode = false,
  onClose,
  onSubmit,
}: ProjectGroupFormModalProps) {
  const [name, setName] = useState('')
  const [accessMode, setAccessMode] = useState<SpaceAccessMode>('default')
  const [copyFromSpaceId, setCopyFromSpaceId] = useState<string>('')
  const [invitedMembers, setInvitedMembers] = useState<InvitedMemberAssignment[]>([])
  const [excludedMemberIds, setExcludedMemberIds] = useState<string[]>([])
  const [invitePreset, setInvitePreset] = useState<InviteMemberPreset>('collaborator')
  const [batchPickerOpen, setBatchPickerOpen] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [inlinePreviewExpanded, setInlinePreviewExpanded] = useState(false)
  const [expandedRoleGroups, setExpandedRoleGroups] = useState<Set<InviteMemberPreset>>(
    () => new Set(),
  )
  const wasOpenRef = useRef(false)
  const batchPickerOpenRef = useRef(false)
  const suppressOverlayCloseRef = useRef(false)

  batchPickerOpenRef.current = batchPickerOpen

  const toggleRoleGroup = (preset: InviteMemberPreset) => {
    setExpandedRoleGroups((current) => {
      const next = new Set(current)
      if (next.has(preset)) {
        next.delete(preset)
      } else {
        next.add(preset)
      }
      return next
    })
  }

  const expandAllRoleGroups = (groups: RoleMemberPreviewGroup[]) => {
    setExpandedRoleGroups(new Set(groups.map((group) => group.preset)))
  }

  const handlePreviewExpandedToggle = () => {
    if (previewExpanded) {
      setPreviewExpanded(false)
      setExpandedRoleGroups(new Set())
      return
    }
    setPreviewExpanded(true)
    expandAllRoleGroups(previewMembersByRole)
  }

  const handleInlinePreviewExpandedToggle = () => {
    if (inlinePreviewExpanded) {
      setInlinePreviewExpanded(false)
      setExpandedRoleGroups(new Set())
      return
    }
    setInlinePreviewExpanded(true)
    expandAllRoleGroups(previewMembersByRole)
  }

  const resetFormState = () => {
    let nextAccessMode: SpaceAccessMode = 'default'
    if (editingGroup) {
      setName(localizeProjectGroupName(editingGroup, locale))
      const groupAccessMode = editingGroup.accessMode ?? 'default'
      nextAccessMode = accessSettingsOnly
        ? groupAccessMode === 'private'
          ? 'private'
          : 'shared'
        : groupAccessMode
      setAccessMode(nextAccessMode)
      setCopyFromSpaceId(editingGroup.copyFromSpaceId ?? copySourceOptions[0]?.id ?? '')
    } else {
      setName('')
      setAccessMode('default')
      setCopyFromSpaceId(copySourceOptions[0]?.id ?? '')
    }
    setInvitedMembers([])
    setExcludedMemberIds([])
    setInvitePreset(defaultInvitePresetForAccessMode(nextAccessMode))
    setBatchPickerOpen(false)
    setPreviewExpanded(false)
    setInlinePreviewExpanded(false)
    setExpandedRoleGroups(new Set())
  }

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true
    resetFormState()
  }, [open, editingGroup, locale, copySourceOptions, accessSettingsOnly])

  useEffect(() => {
    if (accessMode !== 'private') return
    setInvitedMembers([])
    setExcludedMemberIds([])
    setBatchPickerOpen(false)
    setPreviewExpanded(false)
    setInlinePreviewExpanded(false)
    setExpandedRoleGroups(new Set())
  }, [accessMode])

  useEffect(() => {
    if (accessMode === 'open') {
      setInvitePreset('observer')
    }
  }, [accessMode])

  const copyCandidates = useMemo(
    () => copySourceOptions.filter((item) => item.id !== editingGroup?.id),
    [copySourceOptions, editingGroup?.id],
  )

  const copyCandidateOptions = useMemo(
    () =>
      copyCandidates.map((item) => ({
        value: item.id,
        label: locale === 'zh' ? item.nameZh : item.nameEn,
      })),
    [copyCandidates, locale],
  )

  const copySource = useMemo(
    () =>
      accessMode === 'copy' && copyFromSpaceId
        ? copySourceOptions.find((item) => item.id === copyFromSpaceId) ?? null
        : null,
    [accessMode, copyFromSpaceId, copySourceOptions],
  )

  const previewBaseMembers = useMemo(() => {
    if (!editingGroup) return []
    const accessModeChanged =
      !editingGroup.permissionsCustomized &&
      (accessMode !== (editingGroup.accessMode ?? 'default') ||
        copyFromSpaceId !== (editingGroup.copyFromSpaceId ?? null))
    if (accessModeChanged) {
      return buildInitialMembersForAccessMode(accessMode, copySource)
    }
    return editingGroup.members ?? []
  }, [editingGroup, accessMode, copySource, copyFromSpaceId])

  const inviteMemberCandidates = useMemo(() => {
    if (!editingGroup) return orgMembers
    const existing = new Set((editingGroup.members ?? []).map((member) => member.memberId))
    return orgMembers.filter((member) => !existing.has(member.id))
  }, [editingGroup, orgMembers])

  const memberIdsForCurrentPreset = useMemo(
    () => invitedMembers.filter((entry) => entry.preset === invitePreset).map((entry) => entry.memberId),
    [invitedMembers, invitePreset],
  )

  const previewMembersByRole = useMemo(() => {
    const assignments = buildPreviewMemberAssignments(previewBaseMembers, invitedMembers, excludedMemberIds)
    const groups: Record<InviteMemberPreset, TcsOrgMember[]> = {
      space_admin: [],
      collaborator: [],
      observer: [],
    }

    for (const assignment of assignments) {
      const member = orgMembers.find((item) => item.id === assignment.memberId)
      if (!member) continue
      const category = mapRolePresetToInviteCategory(assignment.rolePreset)
      groups[category].push(member)
    }

    return PREVIEW_MEMBER_GROUP_ORDER.map((preset) => ({
      preset,
      label: inviteMemberRoleLabel(locale, preset),
      members: groups[preset],
    })).filter((group) => group.members.length > 0)
  }, [previewBaseMembers, invitedMembers, excludedMemberIds, orgMembers, locale])

  const previewMemberCount = useMemo(
    () => previewMembersByRole.reduce((total, group) => total + group.members.length, 0),
    [previewMembersByRole],
  )

  const modalTitleKey = accessSettingsOnly
    ? 'modalEditPublicGroupAccessTitle'
    : editingGroup
      ? 'modalEditProjectGroupTitle'
      : 'modalCreateProjectGroupTitle'

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = accessSettingsOnly && editingGroup
      ? (locale === 'zh' ? editingGroup.nameZh : editingGroup.nameEn)
      : name.trim()
    if (!trimmedName) return
    const effectiveAccessMode = (() => {
      if (!showAccessSettings) return 'default' as const
      if (hideInviteMembers && accessMode === 'copy') {
        return 'shared' as const
      }
      return accessMode
    })()
    if (effectiveAccessMode === 'copy' && !copyFromSpaceId) return
    onSubmit({
      name: trimmedName,
      accessMode: effectiveAccessMode,
      copyFromSpaceId: effectiveAccessMode === 'copy' ? copyFromSpaceId : null,
      invitedMemberAssignments:
        !hideInviteMembers && accessMode !== 'private' && invitedMembers.length > 0
          ? invitedMembers
          : undefined,
      excludedMemberIds: excludedMemberIds.length > 0 ? excludedMemberIds : undefined,
    })
  }

  const handleOverlayClose = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (suppressOverlayCloseRef.current) return
    if (batchPickerOpenRef.current) {
      setBatchPickerOpen(false)
      return
    }
    onClose()
  }

  const closeBatchPicker = () => {
    suppressOverlayCloseRef.current = true
    window.setTimeout(() => {
      setBatchPickerOpen(false)
      window.setTimeout(() => {
        suppressOverlayCloseRef.current = false
      }, 0)
    }, 0)
  }

  const handleRemovePreviewMember = (memberId: string) => {
    setExcludedMemberIds((current) => (current.includes(memberId) ? current : [...current, memberId]))
    setInvitedMembers((current) => current.filter((entry) => entry.memberId !== memberId))
  }

  const handleBatchSave = (memberIds: string[]) => {
    setInvitedMembers((current) => {
      const rest = current.filter(
        (entry) => entry.preset !== invitePreset && !memberIds.includes(entry.memberId),
      )
      const nextForPreset = memberIds.map((memberId) => ({ memberId, preset: invitePreset }))
      return [...rest, ...nextForPreset]
    })
    setExcludedMemberIds((current) => current.filter((memberId) => !memberIds.includes(memberId)))
    closeBatchPicker()
  }

  return (
    <div className="tcs-modal-overlay" role="presentation" onClick={handleOverlayClose}>
      <div
        className={`tcs-modal tcs-modal--form${batchPickerOpen ? ' tcs-modal--stacked-behind' : ''}`}
        role="dialog"
        aria-modal={!batchPickerOpen}
        aria-hidden={batchPickerOpen}
        aria-labelledby="tcs-project-group-form-title"
        onClick={(event) => event.stopPropagation()}
      >
          <h2 id="tcs-project-group-form-title" className="tcs-modal-title">
            {tcsT(locale, modalTitleKey)}
          </h2>
          <form className="tcs-modal-form" onSubmit={handleSubmit}>
            {!accessSettingsOnly ? (
            <label className="tcs-field">
              <span>{tcsT(locale, 'formName')}</span>
              <input type="text" value={name} required onChange={(event) => setName(event.target.value)} />
            </label>
            ) : null}

            {showAccessSettings ? (
              <>
                <TcsAccessModeSelect
                  locale={locale}
                  label={tcsT(locale, 'formAccessMode')}
                  value={accessMode}
                  onChange={setAccessMode}
                  excludedModes={
                    accessSettingsOnly
                      ? ['default', 'open', 'copy']
                      : excludeSharedAccessMode
                        ? ['shared']
                        : undefined
                  }
                />

                {accessMode === 'copy' && !hideInviteMembers ? (
                  <TcsSearchableSelect
                    label={tcsT(locale, 'formCopyFrom')}
                    value={copyFromSpaceId}
                    options={copyCandidateOptions}
                    onChange={setCopyFromSpaceId}
                    placeholder={tcsT(locale, 'formCopyFromPlaceholder')}
                    searchPlaceholder={tcsT(locale, 'searchPlaceholder')}
                    emptyMessage={tcsT(locale, 'formSearchNoResults')}
                    required
                    disabled={copyCandidateOptions.length === 0}
                    ariaLabel={tcsT(locale, 'formCopyFrom')}
                  />
                ) : null}

                {!hideInviteMembers && accessMode !== 'private' ? (
                <section className="tcs-form-section">
                  <h3 className="tcs-form-section-title">{tcsT(locale, 'formInviteMembers')}</h3>
                  <label className="tcs-field">
                    <span>{tcsT(locale, 'formInviteMemberRole')}</span>
                    <select
                      value={invitePreset}
                      onChange={(event) => setInvitePreset(event.target.value as InviteMemberPreset)}
                    >
                      {INVITE_MEMBER_PRESET_OPTIONS.map((preset) => (
                        <option key={preset} value={preset}>
                          {inviteMemberRoleLabel(locale, preset)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="tcs-form-invite-btn"
                    onClick={() => setBatchPickerOpen(true)}
                  >
                    {memberIdsForCurrentPreset.length > 0
                      ? tcsT(locale, 'formInviteMembersEdit')
                      : tcsT(locale, 'formInviteMembersSelect')}
                  </button>
                  {previewMemberCount > 0 && !editingGroup ? (
                    <div className="tcs-form-members-preview">
                      <button
                        type="button"
                        className="tcs-form-members-preview-toggle"
                        aria-expanded={inlinePreviewExpanded}
                        aria-label={
                          inlinePreviewExpanded
                            ? tcsT(locale, 'formPreviewMembersCollapse')
                            : tcsT(locale, 'formPreviewMembersExpand')
                        }
                        onClick={handleInlinePreviewExpandedToggle}
                      >
                        <span className="tcs-form-members-preview-label">
                          {tcsT(locale, 'formPreviewMembersLabel').replace(
                            '{count}',
                            String(previewMemberCount),
                          )}
                        </span>
                        <svg
                          className={`tcs-form-members-preview-chevron${inlinePreviewExpanded ? ' is-open' : ''}`}
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {inlinePreviewExpanded ? (
                        <RoleMemberPreviewGroups
                          locale={locale}
                          groups={previewMembersByRole}
                          expandedPresets={expandedRoleGroups}
                          onTogglePreset={toggleRoleGroup}
                          className="tcs-form-members-preview-groups tcs-form-members-preview-groups--inline"
                          onRemoveMember={handleRemovePreviewMember}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </section>
                ) : null}

                {editingGroup && !hideInviteMembers && accessMode !== 'private' ? (
                  <div className="tcs-form-members-preview">
                    <button
                      type="button"
                      className="tcs-form-members-preview-toggle"
                      aria-expanded={previewExpanded}
                      aria-label={
                        previewExpanded
                          ? tcsT(locale, 'formPreviewMembersCollapse')
                          : tcsT(locale, 'formPreviewMembersExpand')
                      }
                      disabled={previewMemberCount === 0}
                      onClick={handlePreviewExpandedToggle}
                    >
                      <span className="tcs-form-members-preview-label">
                        {tcsT(locale, 'formPreviewMembersEditLabel').replace(
                          '{count}',
                          String(previewMemberCount),
                        )}
                      </span>
                      <svg
                        className={`tcs-form-members-preview-chevron${previewExpanded ? ' is-open' : ''}`}
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {previewExpanded && previewMemberCount > 0 ? (
                      <RoleMemberPreviewGroups
                        locale={locale}
                        groups={previewMembersByRole}
                        expandedPresets={expandedRoleGroups}
                        onTogglePreset={toggleRoleGroup}
                        onRemoveMember={handleRemovePreviewMember}
                      />
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="tcs-modal-actions">
              <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>
                {tcsT(locale, 'formCancel')}
              </button>
              <button type="submit" className="agents-btn agents-btn-primary">
                {tcsT(locale, editingGroup ? 'formSave' : 'formCreate')}
              </button>
            </div>
          </form>
      </div>
      {batchPickerOpen ? (
        <BatchSelectUsersModal
          locale={locale}
          open
          embedded
          candidates={inviteMemberCandidates}
          initialSelectedIds={memberIdsForCurrentPreset}
          allowEmptySave
          titleKey="selectMembers"
          onClose={closeBatchPicker}
          onSave={handleBatchSave}
        />
      ) : null}
    </div>
  )
}
