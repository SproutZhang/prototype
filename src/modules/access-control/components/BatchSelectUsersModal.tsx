import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  buildMemberChatGroups,
  filterMemberChatGroups,
  localizeChatGroupName,
} from '../data/memberChatGroups'
import { acT, type AccessControlTranslationKey } from '../i18n/strings'
import type { OrgMember } from '../types'
import {
  memberAvatarColors,
  memberAvatarInitialsForMember,
} from '../utils/memberAvatar'
import { BatchSelectMemberTable } from './BatchSelectMemberTable'

const MAX_BATCH_SELECT = 1000
const EMPTY_INITIAL_SELECTED_IDS: string[] = []
/** 按群组选：暂未开放，先隐藏入口 */
const ENABLE_GROUP_SELECT_TAB = false

type BatchSelectTab = 'list' | 'org' | 'group'

type BatchSelectUsersModalProps = {
  locale: AppLocale
  open: boolean
  candidates: OrgMember[]
  initialSelectedIds?: string[]
  embedded?: boolean
  membersOnly?: boolean
  orgOnly?: boolean
  panelMode?: boolean
  singleSelect?: boolean
  allowEmptySave?: boolean
  titleKey?: AccessControlTranslationKey
  nestedOverlay?: boolean
  onClose: () => void
  onSave: (memberIds: string[]) => void
  onSelectionChange?: (memberIds: string[]) => void
}

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

function localizeMemberName(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function localizeMemberDept(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.departmentZh : member.departmentEn
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.8 16.8 21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ListTabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 19c0-3.3 2.7-6 6-6s6 2.7 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function OrgTabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="4" y="4" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="8.5" y="13" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function GroupTabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="9" cy="9" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15.5" cy="9" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 18c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5M11 18c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MemberCountIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 19c0-3.3 2.7-6 6-6s6 2.7 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BatchSelectGroupHead({
  name,
  memberCount,
  permissionsStyle = false,
}: {
  name: string
  memberCount: number
  permissionsStyle?: boolean
}) {
  if (permissionsStyle) {
    return (
      <div className="ac-batch-select-chat-head kb-permissions-chat-head">
        <span className="kb-permissions-chat-head-name">{name}</span>
        <span className="kb-permissions-chat-head-sep" aria-hidden="true">
          |
        </span>
        <span className="kb-permissions-chat-head-members">
          <MemberCountIcon />
          <span>{memberCount}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="ac-batch-select-chat-head ac-batch-select-group-head">
      <span className="ac-batch-select-group-head-name">{name}</span>
      <span className="ac-batch-select-group-head-sep" aria-hidden="true">
        |
      </span>
      <span className="ac-batch-select-group-head-members">
        <MemberCountIcon />
        <span>{memberCount}</span>
      </span>
    </div>
  )
}

function BatchCategoryItem({
  name,
  memberCountLabel,
  selectAllLabel,
  icon,
  allSelected,
  someSelected,
  onOpen,
  onToggleAll,
}: {
  name: string
  memberCountLabel: string
  selectAllLabel: string
  icon: ReactNode
  allSelected: boolean
  someSelected: boolean
  onOpen: () => void
  onToggleAll: () => void
}) {
  return (
    <div className="ac-batch-select-chat-group-item">
      <button type="button" className="ac-batch-select-chat-group-trigger" onClick={onOpen}>
        <span className="ac-batch-select-chat-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="ac-batch-select-chat-meta ac-batch-select-chat-group-line">
          <span className="ac-batch-select-chat-group-name">{name}</span>
          <span className="ac-batch-select-chat-count">{memberCountLabel}</span>
        </span>
        <span className="ac-batch-select-chat-group-chevron" aria-hidden="true">
          <ChevronRightIcon />
        </span>
      </button>
      <label
        className="ac-batch-select-chat-group-select-all"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={allSelected}
          ref={(element) => {
            if (element) {
              element.indeterminate = someSelected && !allSelected
            }
          }}
          onChange={onToggleAll}
        />
        <span>{selectAllLabel}</span>
      </label>
    </div>
  )
}

function BatchSelectAutoAuthControl({
  locale,
  enabled,
  onToggle,
}: {
  locale: AppLocale
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="ac-batch-select-settings kb-permissions-auto-auth">
      <span
        className="kb-permissions-auto-auth-label"
        title={acT(locale, 'batchSelectAutoAuthHint')}
      >
        {acT(locale, 'batchSelectAutoAuth')}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={acT(locale, 'batchSelectAutoAuth')}
        title={acT(locale, 'batchSelectAutoAuthHint')}
        className={`kb-configure-connector-switch${enabled ? ' is-on' : ''}`}
        onClick={onToggle}
      >
        <span className="kb-configure-connector-switch-thumb" />
      </button>
    </div>
  )
}

export function BatchSelectUsersModal({
  locale,
  open,
  candidates,
  initialSelectedIds,
  embedded = false,
  membersOnly = false,
  orgOnly = false,
  panelMode = false,
  singleSelect = false,
  allowEmptySave = false,
  titleKey,
  nestedOverlay = false,
  onClose,
  onSave,
  onSelectionChange,
}: BatchSelectUsersModalProps) {
  const resolvedInitialSelectedIds = initialSelectedIds ?? EMPTY_INITIAL_SELECTED_IDS
  const initialSelectedIdsKey = resolvedInitialSelectedIds.join('\0')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<BatchSelectTab>('list')
  const [selectedChatGroupId, setSelectedChatGroupId] = useState<string | null>(null)
  const [selectedOrgDept, setSelectedOrgDept] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [orgAutoAuthDepts, setOrgAutoAuthDepts] = useState<Set<string>>(new Set())

  const filteredCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return candidates
    return candidates.filter((member) => {
      const name = localizeMemberName(member, locale).toLowerCase()
      const dept = localizeMemberDept(member, locale).toLowerCase()
      return (
        name.includes(query) ||
        dept.includes(query) ||
        member.email.toLowerCase().includes(query)
      )
    })
  }, [candidates, locale, searchQuery])

  const orgGroups = useMemo(() => {
    const groups = new Map<string, OrgMember[]>()
    for (const member of filteredCandidates) {
      const dept = localizeMemberDept(member, locale)
      const list = groups.get(dept) ?? []
      list.push(member)
      groups.set(dept, list)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, locale))
  }, [filteredCandidates, locale])

  const allOrgGroups = useMemo(() => {
    const groups = new Map<string, OrgMember[]>()
    for (const member of candidates) {
      const dept = localizeMemberDept(member, locale)
      const list = groups.get(dept) ?? []
      list.push(member)
      groups.set(dept, list)
    }
    return groups
  }, [candidates, locale])

  const allMembersInSelectedDept = useMemo(() => {
    if (!selectedOrgDept) return []
    return allOrgGroups.get(selectedOrgDept) ?? []
  }, [allOrgGroups, selectedOrgDept])

  const chatGroups = useMemo(
    () => filterMemberChatGroups(buildMemberChatGroups(candidates), searchQuery, locale),
    [candidates, locale, searchQuery],
  )

  const selectedChatGroup = useMemo(
    () => chatGroups.find((group) => group.id === selectedChatGroupId) ?? null,
    [chatGroups, selectedChatGroupId],
  )

  const selectedOrgMembers = useMemo(
    () => orgGroups.find(([dept]) => dept === selectedOrgDept)?.[1] ?? null,
    [orgGroups, selectedOrgDept],
  )

  const selectedMembers = useMemo(
    () => candidates.filter((member) => selectedIds.has(member.id)),
    [candidates, selectedIds],
  )

  useEffect(() => {
    if (!open) return
    setSearchQuery('')
    setActiveTab(orgOnly ? 'org' : 'list')
    setSelectedChatGroupId(null)
    setSelectedOrgDept(null)
    setSelectedIds(new Set(resolvedInitialSelectedIds))
    setOrgAutoAuthDepts(new Set())
  }, [open, initialSelectedIdsKey, orgOnly])

  useEffect(() => {
    if (!open || !onSelectionChange) return
    onSelectionChange([...selectedIds])
  }, [open, onSelectionChange, selectedIds])

  useEffect(() => {
    if (activeTab !== 'group') {
      setSelectedChatGroupId(null)
    }
    if (activeTab !== 'org') {
      setSelectedOrgDept(null)
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedChatGroupId && !chatGroups.some((group) => group.id === selectedChatGroupId)) {
      setSelectedChatGroupId(null)
    }
  }, [chatGroups, selectedChatGroupId])

  useEffect(() => {
    if (selectedOrgDept && !orgGroups.some(([dept]) => dept === selectedOrgDept)) {
      setSelectedOrgDept(null)
    }
  }, [orgGroups, selectedOrgDept])

  const maxSelectable = singleSelect
    ? 1
    : Math.min(MAX_BATCH_SELECT, candidates.length)

  useEffect(() => {
    if (!open || orgAutoAuthDepts.size === 0 || singleSelect) return
    setSelectedIds((prev) => {
      let next: Set<string> | null = null
      for (const member of candidates) {
        const dept = localizeMemberDept(member, locale)
        if (!orgAutoAuthDepts.has(dept) || prev.has(member.id)) continue
        if (prev.size >= maxSelectable) break
        if (!next) next = new Set(prev)
        next.add(member.id)
      }
      return next ?? prev
    })
  }, [open, candidates, locale, maxSelectable, orgAutoAuthDepts, singleSelect])

  if (!open) return null

  const disableOrgAutoAuth = (dept: string) => {
    setOrgAutoAuthDepts((prev) => {
      if (!prev.has(dept)) return prev
      const next = new Set(prev)
      next.delete(dept)
      return next
    })
  }

  const addMembersToSelection = (members: readonly OrgMember[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (singleSelect) {
        const first = members[0]
        return first ? new Set([first.id]) : next
      }
      for (const member of members) {
        if (next.size >= maxSelectable) break
        next.add(member.id)
      }
      return next
    })
  }

  const toggleMember = (memberId: string) => {
    if (singleSelect) {
      setSelectedIds((prev) => {
        if (prev.has(memberId)) return new Set()
        return new Set([memberId])
      })
      return
    }

    const wasSelected = selectedIds.has(memberId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
        return next
      }
      if (next.size >= maxSelectable) return prev
      next.add(memberId)
      return next
    })

    if (wasSelected) {
      const member = candidates.find((item) => item.id === memberId)
      if (member) disableOrgAutoAuth(localizeMemberDept(member, locale))
    }
  }

  const toggleOrgGroup = (members: readonly OrgMember[]) => {
    const allSelected = members.every((member) => selectedIds.has(member.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const member of members) next.delete(member.id)
        return next
      }
      for (const member of members) {
        if (next.size >= maxSelectable) break
        next.add(member.id)
      }
      return next
    })
  }

  const handleOrgDeptToggleAll = (visibleMembers: readonly OrgMember[]) => {
    if (selectedOrgDept) disableOrgAutoAuth(selectedOrgDept)
    toggleOrgGroup(visibleMembers)
  }

  const handleOrgAutoAuthToggle = () => {
    if (!selectedOrgDept) return
    if (orgAutoAuthDepts.has(selectedOrgDept)) {
      disableOrgAutoAuth(selectedOrgDept)
      return
    }
    setOrgAutoAuthDepts((prev) => new Set(prev).add(selectedOrgDept))
    addMembersToSelection(allMembersInSelectedDept)
  }

  const isCurrentDeptAutoAuth =
    selectedOrgDept != null && orgAutoAuthDepts.has(selectedOrgDept)

  const toggleChatGroup = toggleOrgGroup

  const removeSelected = (memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(memberId)
      return next
    })
  }

  const stopOverlayEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  const handleConfirm = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (selectedIds.size === 0 && !allowEmptySave) return
    onSave([...selectedIds])
    if (!embedded) {
      onClose()
    }
  }

  const handleClose = (event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
    onClose()
  }

  const atLimit = selectedIds.size >= maxSelectable

  const isCategoryList =
    (activeTab === 'org' && !selectedOrgMembers) ||
    (ENABLE_GROUP_SELECT_TAB && activeTab === 'group' && !selectedChatGroup)

  const showLeftPermissionsTable =
    ((membersOnly || activeTab === 'list') && filteredCandidates.length > 0) ||
    (activeTab === 'org' && selectedOrgMembers != null) ||
    (ENABLE_GROUP_SELECT_TAB && activeTab === 'group' && selectedChatGroup != null)

  const handleListToggleAll = (visibleMembers: readonly OrgMember[]) => {
    const allSelected =
      visibleMembers.length > 0 && visibleMembers.every((member) => selectedIds.has(member.id))
    if (allSelected) {
      for (const member of visibleMembers) {
        disableOrgAutoAuth(localizeMemberDept(member, locale))
      }
    }
    toggleOrgGroup(visibleMembers)
  }

  const body = (
        <div className="ac-batch-select-body">
          <div className="ac-batch-select-left">
            <div className="ac-batch-select-search">
              <SearchIcon />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={acT(locale, 'batchSelectSearchPlaceholder')}
                aria-label={acT(locale, 'batchSelectSearchPlaceholder')}
              />
            </div>

            {!membersOnly && !orgOnly ? (
              <div className="ac-batch-select-sources" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'org'}
                  className={`ac-batch-select-source${activeTab === 'org' ? ' is-active' : ''}`}
                  onClick={() => setActiveTab('org')}
                >
                  <OrgTabIcon />
                  <span>{acT(locale, 'batchSelectTabOrg')}</span>
                </button>
                {ENABLE_GROUP_SELECT_TAB ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'group'}
                    className={`ac-batch-select-source${activeTab === 'group' ? ' is-active' : ''}`}
                    onClick={() => setActiveTab('group')}
                  >
                    <GroupTabIcon />
                    <span>{acT(locale, 'batchSelectTabImport')}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'list'}
                  className={`ac-batch-select-source${activeTab === 'list' ? ' is-active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <ListTabIcon />
                  <span>{acT(locale, 'batchSelectTabList')}</span>
                </button>
              </div>
            ) : null}

            <div
              className={`ac-batch-select-list${isCategoryList ? ' ac-batch-select-list--categories' : ''}${showLeftPermissionsTable ? ' ac-batch-select-list--permissions' : ''}${membersOnly ? ' ac-batch-select-list--members-only' : ''}`}
              role="tabpanel"
            >
              {membersOnly || activeTab === 'list' ? (
                filteredCandidates.length > 0 ? (
                  <div className="kb-permissions-left-config-panel">
                    <BatchSelectMemberTable
                      locale={locale}
                      members={filteredCandidates}
                      selectedIds={selectedIds}
                      atLimit={atLimit}
                      onToggleMember={toggleMember}
                      onToggleAll={handleListToggleAll}
                    />
                  </div>
                ) : (
                  <div className="ac-batch-select-empty">{acT(locale, 'formSearchNoResults')}</div>
                )
              ) : null}

              {!membersOnly && activeTab === 'org' ? (
                orgGroups.length > 0 ? (
                  selectedOrgMembers ? (
                    <div className="ac-batch-select-group-panel">
                      <div className="ac-batch-select-group-toolbar">
                        <button
                          type="button"
                          className="ac-batch-select-group-back"
                          aria-label={acT(locale, 'batchSelectBackToOrg')}
                          onClick={() => setSelectedOrgDept(null)}
                        >
                          <ChevronLeftIcon />
                        </button>
                        <div className="ac-batch-select-org-header">
                          <BatchSelectGroupHead
                            permissionsStyle
                            name={selectedOrgDept ?? ''}
                            memberCount={selectedOrgMembers.length}
                          />
                          {singleSelect ? null : (
                            <BatchSelectAutoAuthControl
                              locale={locale}
                              enabled={isCurrentDeptAutoAuth}
                              onToggle={handleOrgAutoAuthToggle}
                            />
                          )}
                        </div>
                      </div>
                      <div className="kb-permissions-left-config-panel">
                        <BatchSelectMemberTable
                          locale={locale}
                          members={selectedOrgMembers}
                          selectedIds={selectedIds}
                          atLimit={atLimit}
                          onToggleMember={toggleMember}
                          onToggleAll={handleOrgDeptToggleAll}
                        />
                      </div>
                    </div>
                  ) : (
                    orgGroups.map(([dept, members]) => {
                      const allGroupSelected =
                        members.length > 0 && members.every((member) => selectedIds.has(member.id))
                      const someGroupSelected = members.some((member) => selectedIds.has(member.id))
                      return (
                        <BatchCategoryItem
                          key={dept}
                          name={dept}
                          memberCountLabel={acT(locale, 'batchSelectGroupMembers').replace(
                            '{count}',
                            String(members.length),
                          )}
                          selectAllLabel={acT(locale, 'rolePermissionsSelectAll')}
                          icon={<OrgTabIcon />}
                          allSelected={allGroupSelected}
                          someSelected={someGroupSelected}
                          onOpen={() => setSelectedOrgDept(dept)}
                          onToggleAll={() => toggleOrgGroup(members)}
                        />
                      )
                    })
                  )
                ) : (
                  <div className="ac-batch-select-empty">{acT(locale, 'formSearchNoResults')}</div>
                )
              ) : null}

              {!membersOnly && ENABLE_GROUP_SELECT_TAB && activeTab === 'group' ? (
                chatGroups.length > 0 ? (
                  selectedChatGroup ? (
                    <div className="ac-batch-select-group-panel">
                      <div className="ac-batch-select-group-toolbar">
                        <button
                          type="button"
                          className="ac-batch-select-group-back"
                          aria-label={acT(locale, 'batchSelectBackToGroups')}
                          onClick={() => setSelectedChatGroupId(null)}
                        >
                          <ChevronLeftIcon />
                        </button>
                        <div className="ac-batch-select-org-header">
                          <BatchSelectGroupHead
                            permissionsStyle
                            name={localizeChatGroupName(selectedChatGroup, locale)}
                            memberCount={selectedChatGroup.members.length}
                          />
                        </div>
                      </div>
                      <div className="kb-permissions-left-config-panel">
                        <BatchSelectMemberTable
                          locale={locale}
                          members={selectedChatGroup.members}
                          selectedIds={selectedIds}
                          atLimit={atLimit}
                          onToggleMember={toggleMember}
                          onToggleAll={toggleChatGroup}
                        />
                      </div>
                    </div>
                  ) : (
                    chatGroups.map((group) => {
                      const members = group.members
                      const allGroupSelected =
                        members.length > 0 && members.every((member) => selectedIds.has(member.id))
                      const someGroupSelected = members.some((member) => selectedIds.has(member.id))
                      return (
                        <BatchCategoryItem
                          key={group.id}
                          name={localizeChatGroupName(group, locale)}
                          memberCountLabel={acT(locale, 'batchSelectGroupMembers').replace(
                            '{count}',
                            String(members.length),
                          )}
                          selectAllLabel={acT(locale, 'rolePermissionsSelectAll')}
                          icon={<GroupTabIcon />}
                          allSelected={allGroupSelected}
                          someSelected={someGroupSelected}
                          onOpen={() => setSelectedChatGroupId(group.id)}
                          onToggleAll={() => toggleChatGroup(members)}
                        />
                      )
                    })
                  )
                ) : (
                  <div className="ac-batch-select-empty">{acT(locale, 'formSearchNoResults')}</div>
                )
              ) : null}
            </div>
          </div>

          <div className="ac-batch-select-right">
            <div className="ac-batch-select-selected-head">
              {acT(locale, 'batchSelectedCount')
                .replace('{count}', String(selectedIds.size))
                .replace('{max}', String(maxSelectable))}
            </div>

            <div className="ac-batch-select-chips">
              {selectedMembers.length > 0 ? (
                selectedMembers.map((member) => {
                  const name = localizeMemberName(member, locale)
                  const avatar = memberAvatarColors(member.id)
                  return (
                    <span key={member.id} className="ac-batch-select-chip">
                      <span
                        className="ac-batch-select-chip-avatar"
                        style={{ background: avatar.background, color: avatar.color }}
                      >
                        {memberAvatarInitialsForMember(member, locale)}
                      </span>
                      <span className="ac-batch-select-chip-name">{name}</span>
                      <button
                        type="button"
                        className="ac-batch-select-chip-remove"
                        aria-label={acT(locale, 'modalClose')}
                        onClick={() => removeSelected(member.id)}
                      >
                        ×
                      </button>
                    </span>
                  )
                })
              ) : (
                <div className="ac-batch-select-chips-empty">{acT(locale, 'batchSelectEmptyHint')}</div>
              )}
            </div>

            {panelMode ? null : (
              <div className="ac-batch-select-actions">
                <button
                  type="button"
                  className="ac-btn ac-btn--secondary"
                  onClick={handleClose}
                  onMouseDown={stopOverlayEvent}
                >
                  {acT(locale, 'formCancel')}
                </button>
                <button
                  type="button"
                  className="agents-btn agents-btn-primary"
                  disabled={selectedIds.size === 0 && !allowEmptySave}
                  onClick={handleConfirm}
                  onMouseDown={stopOverlayEvent}
                >
                  {acT(locale, 'formSave')}
                </button>
              </div>
            )}
          </div>
        </div>
  )

  const modal = panelMode ? (
    <div className="ac-batch-select-panel" onClick={(event) => event.stopPropagation()}>
      {body}
    </div>
  ) : (
    <div
      className="ac-modal ac-modal--batch-select"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ac-batch-select-title"
      onClick={stopOverlayEvent}
      onMouseDown={stopOverlayEvent}
    >
      <div className="ac-modal-title-row ac-modal-title-row--batch">
        <h2 id="ac-batch-select-title" className="ac-modal-title">
          {acT(locale, titleKey ?? 'batchSelectUsersTitle')}
        </h2>
        <button
          type="button"
          className="ac-modal-close"
          aria-label={acT(locale, 'modalClose')}
          onClick={handleClose}
        >
          <ModalCloseIcon />
        </button>
      </div>
      {body}
    </div>
  )

  if (embedded) return modal

  return (
    <div
      className={`ac-modal-overlay${nestedOverlay ? ' ac-modal-overlay--nested' : ''}`}
      role="presentation"
      onClick={handleClose}
    >
      {modal}
    </div>
  )
}
