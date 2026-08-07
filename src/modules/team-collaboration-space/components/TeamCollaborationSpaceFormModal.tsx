import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'

import { BatchSelectUsersModal } from '../../access-control/components/BatchSelectUsersModal'
import type { AppLocale } from '../../../i18n/homeStrings'
import { buildInitialMembersForAccessMode, buildPreviewMemberAssignments, mapRolePresetToInviteCategory } from '../utils/memberInit'
import { TcsAccessModeSelect } from './TcsAccessModeSelect'
import { TcsFormMemberPreviewListItem } from './TcsFormMemberPreviewListItem'
import { TcsSearchableSelect } from './TcsSearchableSelect'
import {
  localizeSpaceName,
  inviteMemberRoleLabel,
  defaultInvitePresetForAccessMode,
  INVITE_MEMBER_PRESET_OPTIONS,
  PREVIEW_MEMBER_GROUP_ORDER,
  tcsT,
  type InviteMemberPreset,
  type TeamCollaborationSpaceTranslationKey,
} from '../i18n/strings'
import type {
  InvitedMemberAssignment,
  SpaceAccessMode,
  SpaceFormDraft,
  SpaceKind,
  TeamCollaborationSpaceItem,
  TcsOrgMember,
} from '../types'

type TeamCollaborationSpaceFormModalProps = {
  locale: AppLocale
  open: boolean
  editingSpace: TeamCollaborationSpaceItem | null
  formSpaceKind?: SpaceKind
  createTitleKey?: TeamCollaborationSpaceTranslationKey
  copySourceOptions: TeamCollaborationSpaceItem[]
  orgMembers?: TcsOrgMember[]
  showAccessSettings?: boolean
  /** 公共空间等场景：不展示引入成员（全员可见） */
  hideInviteMembers?: boolean
  /** 项目空间创建流程：选择「共享」时不展示引入成员 */
  hideInviteMembersForSharedAccess?: boolean
  /** 项目创建：显示时间期限（开始 / 结束日期） */
  showDeadlineField?: boolean
  initialDeadlineStart?: string | null
  initialDeadlineEnd?: string | null
  onClose: () => void
  onSubmit: (draft: SpaceFormDraft) => void
}

type ProjectDeadlineKind = 'permanent' | 'custom'

function resolveInitialDeadlineKind(
  start: string | null | undefined,
  end: string | null | undefined,
): ProjectDeadlineKind {
  if (start?.trim() || end?.trim()) return 'custom'
  return 'permanent'
}

export function TeamCollaborationSpaceFormModal({
  locale,
  open,
  editingSpace,
  formSpaceKind = 'team',
  createTitleKey,
  copySourceOptions,
  orgMembers = [],
  showAccessSettings = true,
  hideInviteMembers = false,
  hideInviteMembersForSharedAccess = false,
  showDeadlineField = false,
  initialDeadlineStart = null,
  initialDeadlineEnd = null,
  onClose,
  onSubmit,
}: TeamCollaborationSpaceFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadlineKind, setDeadlineKind] = useState<ProjectDeadlineKind>('permanent')
  const [deadlineStart, setDeadlineStart] = useState('')
  const [deadlineEnd, setDeadlineEnd] = useState('')
  const [accessMode, setAccessMode] = useState<SpaceAccessMode>('default')
  const [copyFromSpaceId, setCopyFromSpaceId] = useState<string>('')
  const [invitedMembers, setInvitedMembers] = useState<InvitedMemberAssignment[]>([])
  const [excludedMemberIds, setExcludedMemberIds] = useState<string[]>([])
  const [invitePreset, setInvitePreset] = useState<InviteMemberPreset>('collaborator')
  const [batchPickerOpen, setBatchPickerOpen] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const wasOpenRef = useRef(false)
  const batchPickerOpenRef = useRef(false)
  const suppressOverlayCloseRef = useRef(false)

  batchPickerOpenRef.current = batchPickerOpen

  const isTeamSpaceForm = editingSpace ? editingSpace.kind === 'team' : formSpaceKind === 'team'
  const sharedAccessHidesInvite = hideInviteMembersForSharedAccess && accessMode === 'shared'
  const showInviteMembers =
    isTeamSpaceForm &&
    showAccessSettings &&
    !hideInviteMembers &&
    accessMode !== 'private' &&
    !sharedAccessHidesInvite
  const showMembersPreview =
    isTeamSpaceForm &&
    !hideInviteMembers &&
    accessMode !== 'private' &&
    !sharedAccessHidesInvite

  const resetFormState = () => {
    let nextAccessMode: SpaceAccessMode = 'default'
    if (editingSpace) {
      setName(localizeSpaceName(editingSpace, locale))
      setDescription(locale === 'zh' ? editingSpace.descriptionZh : editingSpace.descriptionEn)
      nextAccessMode =
        editingSpace.accessMode ?? (editingSpace.kind === 'shared' ? 'shared' : 'default')
      setAccessMode(nextAccessMode)
      setCopyFromSpaceId(editingSpace.copyFromSpaceId ?? copySourceOptions[0]?.id ?? '')
      if (showDeadlineField) {
        const start = editingSpace.deadlineStart ?? initialDeadlineStart ?? ''
        const end = editingSpace.deadlineEnd ?? initialDeadlineEnd ?? ''
        setDeadlineStart(start)
        setDeadlineEnd(end)
        setDeadlineKind(resolveInitialDeadlineKind(start, end))
      }
    } else {
      setName('')
      setDescription('')
      setDeadlineKind('permanent')
      setDeadlineStart('')
      setDeadlineEnd('')
      nextAccessMode =
        hideInviteMembers
          ? 'shared'
          : formSpaceKind === 'shared'
            ? 'shared'
            : 'default'
      setAccessMode(nextAccessMode)
      setCopyFromSpaceId(copySourceOptions[0]?.id ?? '')
    }
    setInvitedMembers([])
    setExcludedMemberIds([])
    setInvitePreset(defaultInvitePresetForAccessMode(nextAccessMode))
    setBatchPickerOpen(false)
    setPreviewExpanded(false)
  }

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true
    resetFormState()
  }, [open, editingSpace, locale, copySourceOptions, formSpaceKind, showDeadlineField, initialDeadlineStart, initialDeadlineEnd, hideInviteMembers])

  useEffect(() => {
    if (accessMode !== 'private' && !sharedAccessHidesInvite) return
    setInvitedMembers([])
    setExcludedMemberIds([])
    setBatchPickerOpen(false)
    setPreviewExpanded(false)
  }, [accessMode, sharedAccessHidesInvite])

  useEffect(() => {
    if (accessMode === 'open') {
      setInvitePreset('observer')
    }
  }, [accessMode])

  const copyCandidates = useMemo(
    () => copySourceOptions.filter((item) => item.id !== editingSpace?.id),
    [copySourceOptions, editingSpace?.id],
  )

  const copyCandidateOptions = useMemo(
    () =>
      copyCandidates.map((item) => ({
        value: item.id,
        label: localizeSpaceName(item, locale),
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
    if (editingSpace) {
      const accessModeChanged =
        !editingSpace.permissionsCustomized &&
        (accessMode !== (editingSpace.accessMode ?? 'default') ||
          copyFromSpaceId !== (editingSpace.copyFromSpaceId ?? null))
      if (accessModeChanged) {
        return buildInitialMembersForAccessMode(accessMode, copySource)
      }
      return editingSpace.members
    }
    return []
  }, [editingSpace, accessMode, copySource, copyFromSpaceId])

  const inviteMemberCandidates = useMemo(() => {
    if (!editingSpace) return orgMembers
    const existing = new Set(editingSpace.members.map((member) => member.memberId))
    return orgMembers.filter((member) => !existing.has(member.id))
  }, [editingSpace, orgMembers])

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

  const modalTitleKey = editingSpace
    ? 'modalEditTitle'
    : createTitleKey ??
      (formSpaceKind === 'personal'
        ? 'modalCreatePersonalTitle'
        : formSpaceKind === 'shared'
          ? 'modalCreateSharedTitle'
          : 'modalCreateTitle')

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    const effectiveAccessMode = (() => {
      if (!showAccessSettings) return 'default' as const
      if (hideInviteMembers && (accessMode === 'copy' || accessMode === 'private')) {
        return 'shared' as const
      }
      return accessMode
    })()
    if (effectiveAccessMode === 'copy' && !copyFromSpaceId) return
    onSubmit({
      name: trimmedName,
      description: description.trim(),
      accessMode: effectiveAccessMode,
      copyFromSpaceId: effectiveAccessMode === 'copy' ? copyFromSpaceId : null,
      invitedMemberAssignments:
        showInviteMembers && invitedMembers.length > 0 ? invitedMembers : undefined,
      excludedMemberIds: excludedMemberIds.length > 0 ? excludedMemberIds : undefined,
      ...(showDeadlineField
        ? {
            deadlineStart:
              deadlineKind === 'custom' ? deadlineStart.trim() || null : null,
            deadlineEnd: deadlineKind === 'custom' ? deadlineEnd.trim() || null : null,
          }
        : {}),
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
        aria-labelledby="tcs-form-title"
        onClick={(event) => event.stopPropagation()}
      >
          <h2 id="tcs-form-title" className="tcs-modal-title">
            {tcsT(locale, modalTitleKey)}
          </h2>
          <form className="tcs-modal-form" onSubmit={handleSubmit}>
            <label className="tcs-field">
              <span>{tcsT(locale, 'formName')}</span>
              <input type="text" value={name} required onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="tcs-field">
              <span>{tcsT(locale, 'formDescription')}</span>
              <textarea
                value={description}
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            {showDeadlineField ? (
              <fieldset className="tcs-deadline-fieldset">
                <legend>{tcsT(locale, 'formProjectDeadline')}</legend>
                <div
                  className="tcs-deadline-mode-list"
                  role="radiogroup"
                  aria-label={tcsT(locale, 'formProjectDeadline')}
                >
                  <label className="tcs-deadline-mode-option">
                    <input
                      type="radio"
                      name="tcs-project-deadline-mode"
                      value="permanent"
                      checked={deadlineKind === 'permanent'}
                      onChange={() => {
                        setDeadlineKind('permanent')
                        setDeadlineStart('')
                        setDeadlineEnd('')
                      }}
                    />
                    <span>{tcsT(locale, 'formProjectDeadlinePermanent')}</span>
                  </label>
                  <label className="tcs-deadline-mode-option">
                    <input
                      type="radio"
                      name="tcs-project-deadline-mode"
                      value="custom"
                      checked={deadlineKind === 'custom'}
                      onChange={() => setDeadlineKind('custom')}
                    />
                    <span>{tcsT(locale, 'formProjectDeadlineCustom')}</span>
                  </label>
                </div>
                {deadlineKind === 'custom' ? (
                  <div className="tcs-deadline-range">
                    <label className="tcs-deadline-field">
                      <span className="tcs-deadline-field-label">
                        {tcsT(locale, 'formProjectDeadlineStart')}
                      </span>
                      <input
                        type="date"
                        value={deadlineStart}
                        max={deadlineEnd || undefined}
                        onChange={(event) => setDeadlineStart(event.target.value)}
                      />
                    </label>
                    <label className="tcs-deadline-field">
                      <span className="tcs-deadline-field-label">
                        {tcsT(locale, 'formProjectDeadlineEnd')}
                      </span>
                      <input
                        type="date"
                        value={deadlineEnd}
                        min={deadlineStart || undefined}
                        onChange={(event) => setDeadlineEnd(event.target.value)}
                      />
                    </label>
                  </div>
                ) : null}
              </fieldset>
            ) : null}

            {showAccessSettings ? (
              <>
                <TcsAccessModeSelect
                  locale={locale}
                  label={tcsT(locale, 'formAccessMode')}
                  value={accessMode}
                  onChange={setAccessMode}
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

                {showInviteMembers ? (
                  <section className="tcs-form-section">
                    <h3 className="tcs-form-section-title">{tcsT(locale, 'formInviteMembers')}</h3>
                    <label className="tcs-field">
                      <span>{tcsT(locale, 'formInviteMemberRole')}</span>
                      <select
                        value={invitePreset}
                        onChange={(event) =>
                          setInvitePreset(event.target.value as InviteMemberPreset)
                        }
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
                  </section>
                ) : null}

                {showMembersPreview ? (
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
                      onClick={() => setPreviewExpanded((expanded) => !expanded)}
                    >
                      <span className="tcs-form-members-preview-label">
                        {tcsT(locale, editingSpace ? 'formPreviewMembersEditLabel' : 'formPreviewMembersLabel').replace(
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
                      <div className="tcs-form-members-preview-groups">
                        {previewMembersByRole.map((group) => (
                          <div key={group.preset} className="tcs-form-members-preview-group">
                            <span className="tcs-form-members-preview-group-title">{group.label}</span>
                            <ul className="tcs-form-members-preview-list">
                              {group.members.map((member) => (
                                <TcsFormMemberPreviewListItem
                                  key={member.id}
                                  locale={locale}
                                  member={member}
                                  onRemove={() => handleRemovePreviewMember(member.id)}
                                />
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
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
                {tcsT(locale, editingSpace ? 'formSave' : 'formCreate')}
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
