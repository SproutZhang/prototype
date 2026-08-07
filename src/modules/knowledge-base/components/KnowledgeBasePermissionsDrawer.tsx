import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { ORG_MEMBERS_SEED } from '../../access-control/data/orgMembersSeed'
import { WORKSPACE_ROLE_ROWS, type WorkspaceRoleRow } from '../../access-control/data/workspaceRoles'
import type { OrgMember } from '../../access-control/types'
import {
  buildMemberChatGroups,
  filterMemberChatGroups,
  localizeChatGroupName,
} from '../../access-control/data/memberChatGroups'
import { acT } from '../../access-control/i18n/strings'
import {
  memberAvatarColors,
  memberAvatarInitials,
  memberAvatarInitialsForMember,
} from '../../access-control/utils/memberAvatar'
import { findWorkspaceRoleForMember } from '../../access-control/utils/memberWorkspaceRole'
import { resolveRoleLabel } from '../../access-control/utils/roleDisplay'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem, KnowledgeBasePermissionLevel, KnowledgeBaseWorkspaceFolder } from '../types'

export type KnowledgeBasePermissionRow = {
  id: string
  type: KnowledgeBasePermissionPrincipalType
  nameZh: string
  nameEn: string
  level: KnowledgeBasePermissionLevel
}

export type KnowledgeBasePermissionPrincipalType = 'role' | 'org' | 'member'

type LeftPane = 'org' | 'group' | 'list'

/** 按群组选：暂未开放，先隐藏入口 */
const ENABLE_GROUP_SELECT_TAB = false

type SubjectItem = {
  id: string
  type: KnowledgeBasePermissionPrincipalType
  groupZh: string
  groupEn: string
  nameZh: string
  nameEn: string
  username?: string
  email?: string
}

type RoleFilterField = 'role' | 'username' | 'email'

const WORKSPACE_ROLES = WORKSPACE_ROLE_ROWS

const ROLE_MATCH_PRIORITY = [
  'admin',
  'manager',
  'knowledge-admin',
  'ops-specialist',
  'auditor',
  'user',
] as const

function localizeMemberName(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function roleBadgeVariant(role: WorkspaceRoleRow): KnowledgeBasePermissionLevel {
  switch (role.catalogProfile) {
    case 'admin':
      return 'manage'
    case 'manager':
    case 'knowledge':
    case 'ops':
    case 'publish-reviewer':
    case 'security':
    case 'hr':
    case 'meeting':
    case 'bi':
    case 'analyst':
    case 'support':
      return 'edit'
    default:
      return 'view'
  }
}

function roleRepresentativeMember(role: WorkspaceRoleRow): OrgMember | null {
  for (const memberId of role.assignedMemberIds) {
    const member = ORG_MEMBERS_SEED.find((item) => item.id === memberId)
    if (member) return member
  }
  return null
}

function emptyRoleGrants(): Record<string, boolean> {
  return Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, false]))
}

function buildMemberDefaultGrants(memberId: string): Record<string, boolean> {
  const role = findWorkspaceRoleForMember(memberId, WORKSPACE_ROLES)
  const roleId = role?.id ?? 'user'
  return Object.fromEntries(WORKSPACE_ROLES.map((item) => [item.id, item.id === roleId]))
}

function grantedWorkspaceRoles(grants: Record<string, boolean>): WorkspaceRoleRow[] {
  return WORKSPACE_ROLES.filter((role) => grants[role.id])
}

function memberPermissionRoleLabel(
  locale: AppLocale,
  memberId: string,
  grants: Record<string, boolean>,
): string {
  const granted = grantedWorkspaceRoles(grants)
  if (granted.length > 1) {
    return granted.map((role) => resolveRoleLabel(role)).join(locale === 'zh' ? '、' : ', ')
  }
  if (granted.length === 1) {
    return resolveRoleLabel(granted[0]!)
  }
  const workspaceRole = findWorkspaceRoleForMember(memberId, WORKSPACE_ROLES)
  if (workspaceRole) return resolveRoleLabel(workspaceRole)
  const fallback = WORKSPACE_ROLES.find((role) => role.id === 'user')
  return fallback ? resolveRoleLabel(fallback) : 'User'
}

function memberPermissionBadgeVariant(
  memberId: string,
  grants: Record<string, boolean>,
): KnowledgeBasePermissionLevel {
  const granted = grantedWorkspaceRoles(grants)
  if (granted.length > 0) {
    for (const roleId of ROLE_MATCH_PRIORITY) {
      const hit = granted.find((role) => role.id === roleId)
      if (hit) return roleBadgeVariant(hit)
    }
    return roleBadgeVariant(granted[0]!)
  }
  const workspaceRole = findWorkspaceRoleForMember(memberId, WORKSPACE_ROLES)
  if (workspaceRole) return roleBadgeVariant(workspaceRole)
  return 'view'
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

function OrgTabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="4" y="4" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="8.5" y="13" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
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

function PermissionsGroupHead({ name, memberCount }: { name: string; memberCount: number }) {
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

function localizeMemberDept(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.departmentZh : member.departmentEn
}

function PermissionCategoryItem({
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

type GrantMatrix = Record<string, Record<string, boolean>>

const ORG_SUBJECTS: SubjectItem[] = [
  {
    id: 'org-hr',
    type: 'org',
    groupZh: '一级部门',
    groupEn: 'Divisions',
    nameZh: '人力资源部',
    nameEn: 'Human Resources',
  },
  {
    id: 'org-product',
    type: 'org',
    groupZh: '一级部门',
    groupEn: 'Divisions',
    nameZh: '产品部',
    nameEn: 'Product',
  },
  {
    id: 'org-it',
    type: 'org',
    groupZh: '一级部门',
    groupEn: 'Divisions',
    nameZh: '信息技术部',
    nameEn: 'IT',
  },
  {
    id: 'org-onboarding',
    type: 'org',
    groupZh: '二级团队',
    groupEn: 'Teams',
    nameZh: '入职流程组',
    nameEn: 'Onboarding Team',
  },
]

const DEFAULT_GRANTS: Record<string, string[]> = {
  'org-hr': ['manager', 'user'],
  'org-product': ['knowledge-admin'],
}

function buildFlatMemberSubjects(): SubjectItem[] {
  return ORG_MEMBERS_SEED.map((member) => ({
    id: member.id,
    type: 'member' as const,
    groupZh: '',
    groupEn: '',
    nameZh: member.nameZh,
    nameEn: member.nameEn,
    username: member.email.split('@')[0],
    email: member.email,
  }))
}

function buildMemberSubjects(): SubjectItem[] {
  const byDept = new Map<string, SubjectItem[]>()
  for (const member of ORG_MEMBERS_SEED) {
    const groupZh = member.departmentZh
    const groupEn = member.departmentEn
    const item: SubjectItem = {
      id: member.id,
      type: 'member',
      groupZh,
      groupEn,
      nameZh: member.nameZh,
      nameEn: member.nameEn,
      username: member.email.split('@')[0],
      email: member.email,
    }
    const bucket = byDept.get(groupZh) ?? []
    bucket.push(item)
    byDept.set(groupZh, bucket)
  }
  return [...byDept.values()].flat()
}

function buildSubjectGrantsFromDefaults(subjectId: string): Record<string, boolean> {
  const enabledRoles = DEFAULT_GRANTS[subjectId]
  if (enabledRoles) {
    return Object.fromEntries(
      WORKSPACE_ROLES.map((role) => [role.id, enabledRoles.includes(role.id)]),
    )
  }
  if (ORG_MEMBERS_SEED.some((member) => member.id === subjectId)) {
    return buildMemberDefaultGrants(subjectId)
  }
  return emptyRoleGrants()
}

function buildAllRoleGrants(): Record<string, boolean> {
  return Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, true]))
}

function memberHasGrant(grants: Record<string, boolean>): boolean {
  return Object.values(grants).some(Boolean)
}

/** 开启员工授权：优先默认角色；否则按成员在工作区中的角色匹配单一授权 */
function buildMemberAccessGrants(memberId: string): Record<string, boolean> {
  const fromDefaults = buildSubjectGrantsFromDefaults(memberId)
  if (memberHasGrant(fromDefaults)) return fromDefaults
  return buildMemberDefaultGrants(memberId)
}

/** 自动授权：为组织内全部员工写入授权（无专属默认时按查看权限） */
function applyAutoAuthMemberGrants(matrix: GrantMatrix): GrantMatrix {
  const next = { ...matrix }
  for (const member of ORG_MEMBERS_SEED) {
    next[member.id] = buildMemberAccessGrants(member.id)
  }
  return next
}

function buildDefaultMatrix(): GrantMatrix {
  const matrix: GrantMatrix = {}
  const subjects = [...ORG_SUBJECTS, ...buildMemberSubjects()]
  for (const subject of subjects) {
    matrix[subject.id] = buildSubjectGrantsFromDefaults(subject.id)
  }
  return matrix
}

function groupSubjects(subjects: SubjectItem[], locale: AppLocale) {
  const groups = new Map<string, SubjectItem[]>()
  for (const subject of subjects) {
    const key = locale === 'zh' ? subject.groupZh : subject.groupEn
    const bucket = groups.get(key) ?? []
    bucket.push(subject)
    groups.set(key, bucket)
  }
  return [...groups.entries()]
}

type KnowledgeBasePermissionsDrawerProps = {
  locale: AppLocale
  item: KnowledgeBaseItem | null
  folder: KnowledgeBaseWorkspaceFolder | null
  targetName: string
  onClose: () => void
  onSave: (
    targetId: string,
    rows: KnowledgeBasePermissionRow[],
    targetType: 'item' | 'folder',
  ) => void
}

function CloseIcon() {
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

export function KnowledgeBasePermissionsDrawer({
  locale,
  item,
  folder,
  targetName,
  onClose,
  onSave,
}: KnowledgeBasePermissionsDrawerProps) {
  const headingId = useId()
  const [leftPane, setLeftPane] = useState<LeftPane>('list')
  const [leftSearch, setLeftSearch] = useState('')
  const [selectedChatGroupId, setSelectedChatGroupId] = useState<string | null>(null)
  const [selectedOrgSubjectId, setSelectedOrgSubjectId] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [roleFilter, setRoleFilter] = useState('')
  const [roleFilterField, setRoleFilterField] = useState<RoleFilterField>('role')
  const [autoAuth, setAutoAuth] = useState(false)
  const [grantMatrix, setGrantMatrix] = useState<GrantMatrix>(buildDefaultMatrix)
  const target = item ?? folder

  const chatGroups = useMemo(() => buildMemberChatGroups(ORG_MEMBERS_SEED), [])
  const filteredChatGroups = useMemo(
    () => filterMemberChatGroups(chatGroups, leftSearch, locale),
    [chatGroups, leftSearch, locale],
  )
  const selectedChatGroup = useMemo(
    () => chatGroups.find((group) => group.id === selectedChatGroupId) ?? null,
    [chatGroups, selectedChatGroupId],
  )
  const selectedOrgSubject = useMemo(
    () => ORG_SUBJECTS.find((subject) => subject.id === selectedOrgSubjectId) ?? null,
    [selectedOrgSubjectId],
  )
  const isCategoryList =
    (leftPane === 'group' && !selectedChatGroupId) ||
    (leftPane === 'org' && !selectedOrgSubjectId)

  useEffect(() => {
    if (!target) return
    setLeftPane('list')
    setLeftSearch('')
    setSelectedChatGroupId(null)
    setSelectedOrgSubjectId('')
    setSelectedMemberIds(new Set())
    setRoleFilter('')
    setRoleFilterField('role')
    setAutoAuth(false)
    setGrantMatrix(buildDefaultMatrix())
  }, [target?.id])

  useEffect(() => {
    if (leftPane !== 'group') {
      setSelectedChatGroupId(null)
    }
    if (leftPane !== 'org') {
      setSelectedOrgSubjectId('')
    }
  }, [leftPane])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filteredListMembers = useMemo(() => {
    const query = leftSearch.trim().toLowerCase()
    if (!query) return ORG_MEMBERS_SEED
    return ORG_MEMBERS_SEED.filter((member) => {
      const name = localizeMemberName(member, locale).toLowerCase()
      const dept = (locale === 'zh' ? member.departmentZh : member.departmentEn).toLowerCase()
      return name.includes(query) || dept.includes(query) || member.email.toLowerCase().includes(query)
    })
  }, [leftSearch, locale])

  const filteredOrgSubjects = useMemo(() => {
    const query = leftSearch.trim().toLowerCase()
    if (!query) return ORG_SUBJECTS
    return ORG_SUBJECTS.filter((subject) =>
      [subject.nameZh, subject.nameEn, subject.groupZh, subject.groupEn]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [leftSearch])

  const allOrgGrantedEntries = useMemo(() => {
    const entries: Array<{ subject: SubjectItem; role: WorkspaceRoleRow }> = []
    for (const subject of ORG_SUBJECTS) {
      const grants = grantMatrix[subject.id] ?? {}
      for (const role of WORKSPACE_ROLES) {
        if (grants[role.id]) entries.push({ subject, role })
      }
    }
    return entries
  }, [grantMatrix])

  const dedupedOrgGrantedRoles = useMemo(() => {
    const byRoleId = new Map<string, WorkspaceRoleRow>()
    for (const { role } of allOrgGrantedEntries) {
      if (!byRoleId.has(role.id)) byRoleId.set(role.id, role)
    }
    return [...byRoleId.values()]
  }, [allOrgGrantedEntries])

  const allGroupGrantedMembers = useMemo(() => {
    const members: OrgMember[] = []
    const seen = new Set<string>()
    for (const group of chatGroups) {
      for (const member of group.members) {
        if (memberHasGrant(grantMatrix[member.id] ?? {}) && !seen.has(member.id)) {
          seen.add(member.id)
          members.push(member)
        }
      }
    }
    return members
  }, [chatGroups, grantMatrix])

  const selectedListMembers = useMemo(
    () => ORG_MEMBERS_SEED.filter((member) => selectedMemberIds.has(member.id)),
    [selectedMemberIds],
  )

  const allPersistedMembers = useMemo(() => {
    const members: OrgMember[] = []
    const seen = new Set<string>()
    const addMember = (member: OrgMember) => {
      if (seen.has(member.id)) return
      seen.add(member.id)
      members.push(member)
    }
    for (const member of selectedListMembers) addMember(member)
    for (const member of allGroupGrantedMembers) addMember(member)
    return members
  }, [selectedListMembers, allGroupGrantedMembers])

  const totalPersistedSelections = dedupedOrgGrantedRoles.length + allPersistedMembers.length
  const persistedSelectionMax = WORKSPACE_ROLES.length + ORG_MEMBERS_SEED.length

  const showRoleTable = leftPane === 'org' && selectedOrgSubject != null
  const showGroupMemberTable = leftPane === 'group' && selectedChatGroup != null
  const showRightPickerHint = totalPersistedSelections === 0
  const showLeftPermissionsTable =
    showGroupMemberTable ||
    showRoleTable ||
    (leftPane === 'list' && filteredListMembers.length > 0)

  const subjectRoleGrants = selectedOrgSubject ? grantMatrix[selectedOrgSubject.id] ?? {} : {}

  const filteredRoles = useMemo(() => {
    const q = roleFilter.trim().toLowerCase()
    if (!q) return WORKSPACE_ROLES
    return WORKSPACE_ROLES.filter((role) => {
      switch (roleFilterField) {
        case 'username':
          return role.assignedMemberIds.some((memberId) => {
            const member = ORG_MEMBERS_SEED.find((item) => item.id === memberId)
            if (!member) return false
            return localizeMemberName(member, locale).toLowerCase().includes(q)
          })
        case 'email':
          return role.assignedMemberIds.some((memberId) => {
            const member = ORG_MEMBERS_SEED.find((item) => item.id === memberId)
            return member?.email.toLowerCase().includes(q) ?? false
          })
        case 'role':
        default:
          return resolveRoleLabel(role).toLowerCase().includes(q)
      }
    })
  }, [roleFilter, roleFilterField, locale])

  const memberTableSource = useMemo(() => {
    if (leftPane === 'group' && selectedChatGroup) {
      return selectedChatGroup.members
    }
    return []
  }, [leftPane, selectedChatGroup])

  const filteredMembers = useMemo(() => {
    const q = roleFilter.trim().toLowerCase()
    if (!q) return memberTableSource
    return memberTableSource.filter((member) =>
      [member.nameZh, member.nameEn, member.email, member.departmentZh, member.departmentEn]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [memberTableSource, roleFilter])

  useEffect(() => {
    if (!autoAuth) return
    setGrantMatrix((prev) => {
      let next = applyAutoAuthMemberGrants(prev)
      if (leftPane === 'org' && selectedOrgSubject) {
        next = {
          ...next,
          [selectedOrgSubject.id]: buildAllRoleGrants(),
        }
      }
      return next
    })
  }, [autoAuth, leftPane, selectedOrgSubject?.id])

  if (!target) return null

  const subtitle = kbT(locale, 'permissionsSubtitle').replace('{name}', targetName)
  const selectedOrgName = selectedOrgSubject
    ? locale === 'zh'
      ? selectedOrgSubject.nameZh
      : selectedOrgSubject.nameEn
    : ''
  const rightPanelHeadText =
    totalPersistedSelections > 0
      ? acT(locale, 'batchSelectedCount')
          .replace('{count}', String(totalPersistedSelections))
          .replace('{max}', String(persistedSelectionMax))
      : ''

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const toggleAllMemberSelection = (members: readonly OrgMember[]) => {
    const allSelected =
      members.length > 0 && members.every((member) => selectedMemberIds.has(member.id))
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      for (const member of members) {
        if (allSelected) next.delete(member.id)
        else next.add(member.id)
      }
      return next
    })
  }

  const setSubjectRoleGrant = (subjectId: string, roleId: string, enabled: boolean) => {
    if (!enabled && autoAuth) setAutoAuth(false)
    setGrantMatrix((prev) => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] ?? {}),
        [roleId]: enabled,
      },
    }))
  }

  const setRoleGrant = (roleId: string, enabled: boolean) => {
    if (!selectedOrgSubject) return
    setSubjectRoleGrant(selectedOrgSubject.id, roleId, enabled)
  }

  const setMemberAccessGrant = (memberId: string, enabled: boolean) => {
    if (!enabled && autoAuth) setAutoAuth(false)
    setGrantMatrix((prev) => ({
      ...prev,
      [memberId]: enabled
        ? buildMemberAccessGrants(memberId)
        : Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, false])),
    }))
  }

  const removePersistedMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      next.delete(memberId)
      return next
    })
    setMemberAccessGrant(memberId, false)
  }

  const clearOrgRoleGrant = (roleId: string) => {
    if (autoAuth) setAutoAuth(false)
    setGrantMatrix((prev) => {
      const next = { ...prev }
      for (const subject of ORG_SUBJECTS) {
        const grants = next[subject.id]
        if (!grants?.[roleId]) continue
        next[subject.id] = { ...grants, [roleId]: false }
      }
      return next
    })
  }

  const handleAutoAuthToggle = () => {
    const next = !autoAuth
    setAutoAuth(next)
    if (!next) return
    setGrantMatrix((prev) => {
      let updated = applyAutoAuthMemberGrants(prev)
      if (leftPane === 'org' && selectedOrgSubject) {
        updated = {
          ...updated,
          [selectedOrgSubject.id]: buildAllRoleGrants(),
        }
      }
      return updated
    })
  }

  const toggleAllVisible = (enabled: boolean, membersOverride?: readonly OrgMember[]) => {
    if (!enabled && autoAuth) setAutoAuth(false)
    if (membersOverride) {
      const members = membersOverride
      setGrantMatrix((prev) => {
        const next = { ...prev }
        for (const member of members) {
          next[member.id] = enabled
            ? buildMemberAccessGrants(member.id)
            : Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, false]))
        }
        return next
      })
      return
    }
    if (showGroupMemberTable) {
      setGrantMatrix((prev) => {
        const next = { ...prev }
        for (const member of filteredMembers) {
          next[member.id] = enabled
            ? buildMemberAccessGrants(member.id)
            : Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, false]))
        }
        return next
      })
      return
    }
    if (!selectedOrgSubject) return
    setGrantMatrix((prev) => {
      const next = { ...(prev[selectedOrgSubject.id] ?? {}) }
      for (const role of filteredRoles) next[role.id] = enabled
      return { ...prev, [selectedOrgSubject.id]: next }
    })
  }


  const toggleGroupMemberGrants = (members: readonly OrgMember[]) => {
    const allGranted =
      members.length > 0 && members.every((member) => memberHasGrant(grantMatrix[member.id] ?? {}))
    if (!allGranted && autoAuth) setAutoAuth(false)
    setGrantMatrix((prev) => {
      const next = { ...prev }
      for (const member of members) {
        next[member.id] = allGranted
          ? Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, false]))
          : buildMemberAccessGrants(member.id)
      }
      return next
    })
  }

  const toggleOrgSubjectRoleGrants = (orgId: string) => {
    const grants = grantMatrix[orgId] ?? {}
    const allGranted = WORKSPACE_ROLES.length > 0 && WORKSPACE_ROLES.every((role) => grants[role.id])
    if (!allGranted && autoAuth) setAutoAuth(false)
    setGrantMatrix((prev) => ({
      ...prev,
      [orgId]: Object.fromEntries(WORKSPACE_ROLES.map((role) => [role.id, !allGranted])),
    }))
  }

  const handleSave = () => {
    const allSubjects = [...ORG_SUBJECTS, ...buildMemberSubjects()]
    const rows: KnowledgeBasePermissionRow[] = []
    for (const subject of allSubjects) {
      const grants = grantMatrix[subject.id] ?? {}
      for (const role of WORKSPACE_ROLES) {
        if (!grants[role.id]) continue
        rows.push({
          id: `${subject.id}:${role.id}`,
          type: subject.type,
          nameZh: `${locale === 'zh' ? subject.nameZh : subject.nameEn} · ${resolveRoleLabel(role)}`,
          nameEn: `${subject.nameEn} · ${resolveRoleLabel(role)}`,
          level: roleBadgeVariant(role),
        })
      }
    }
    onSave(target.id, rows, item ? 'item' : 'folder')
  }

  const renderMemberPickerTable = (members: readonly OrgMember[]) => {
    const allSelected =
      members.length > 0 && members.every((member) => selectedMemberIds.has(member.id))
    const someSelected = members.some((member) => selectedMemberIds.has(member.id))

    return (
      <div className="kb-permissions-config-inner">
        <div className="kb-permissions-table-wrap">
          <table className="kb-permissions-table">
            <thead>
              <tr>
                <th scope="col" className="kb-permissions-table-user-col">
                  {kbT(locale, 'permissionsUsername')}
                </th>
                <th scope="col">{kbT(locale, 'permissionsPermissionConfig')}</th>
                <th scope="col" className="kb-permissions-table-auth-col">
                  <label className="kb-permissions-table-auth-all">
                    <span>{kbT(locale, 'permissionsTableSelectAll')}</span>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate = someSelected && !allSelected
                        }
                      }}
                      onChange={() => toggleAllMemberSelection(members)}
                      aria-label={kbT(locale, 'permissionsAuth')}
                    />
                  </label>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="kb-permissions-table-empty">
                    {kbT(locale, 'permissionsEmpty')}
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const memberName = localizeMemberName(member, locale)
                  const avatar = memberAvatarColors(member.id)
                  const isSelected = selectedMemberIds.has(member.id)
                  const memberGrants = grantMatrix[member.id] ?? {}
                  const badgeVariant = memberPermissionBadgeVariant(member.id, memberGrants)
                  const roleLabel = memberPermissionRoleLabel(locale, member.id, memberGrants)
                  return (
                    <tr key={member.id} className={isSelected ? 'is-selected' : undefined}>
                      <td className="kb-permissions-table-user">
                        <div className="kb-permissions-table-user-cell">
                          <span
                            className="kb-permissions-table-user-avatar"
                            style={{ background: avatar.background, color: avatar.color }}
                            aria-hidden="true"
                          >
                            {memberAvatarInitialsForMember(member, locale)}
                          </span>
                          <div className="kb-permissions-table-user-meta">
                            <span className="kb-permissions-table-user-name">{memberName}</span>
                            <span className="kb-permissions-table-user-email">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="kb-permissions-table-level">
                        <span
                          className={`kb-permissions-table-level-badge kb-permissions-table-level-badge--${badgeVariant}`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="kb-permissions-table-auth-col">
                        <div className="kb-permissions-table-auth-cell">
                          <label className="kb-permissions-table-auth-row">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              aria-label={`${memberName} ${kbT(locale, 'permissionsAuth')}`}
                              onChange={() => toggleMemberSelection(member.id)}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderAvatarChip = (
    key: string,
    avatarKey: string,
    label: string,
    initials: string,
    onRemove: () => void,
  ) => {
    const avatar = memberAvatarColors(avatarKey)
    return (
      <span key={key} className="ac-batch-select-chip">
        <span
          className="ac-batch-select-chip-avatar"
          style={{ background: avatar.background, color: avatar.color }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="ac-batch-select-chip-name">{label}</span>
        <button
          type="button"
          className="ac-batch-select-chip-remove"
          aria-label={`${label} ${acT(locale, 'modalClose')}`}
          onClick={onRemove}
        >
          ×
        </button>
      </span>
    )
  }

  const renderMemberChips = (
    members: readonly OrgMember[],
    onRemove: (memberId: string) => void,
  ) =>
    members.map((member) =>
      renderAvatarChip(
        member.id,
        member.id,
        localizeMemberName(member, locale),
        memberAvatarInitialsForMember(member, locale),
        () => onRemove(member.id),
      ),
    )

  const renderPersistedSelectionChips = () => (
    <>
      {dedupedOrgGrantedRoles.map((role) => {
        const roleLabel = resolveRoleLabel(role)
        const representative = roleRepresentativeMember(role)
        const chipLabel = representative ? localizeMemberName(representative, locale) : roleLabel
        const avatarKey = representative?.id ?? role.id
        const initials = representative
          ? memberAvatarInitialsForMember(representative, locale)
          : memberAvatarInitials(roleLabel)
        return renderAvatarChip(
          `org-role-${role.id}`,
          avatarKey,
          chipLabel,
          initials,
          () => clearOrgRoleGrant(role.id),
        )
      })}
      {renderMemberChips(allPersistedMembers, removePersistedMember)}
    </>
  )

  const renderAutoAuthControl = () => (
    <div className="ac-batch-select-settings kb-permissions-auto-auth">
      <span className="kb-permissions-auto-auth-label" title={kbT(locale, 'permissionsAutoAuthHint')}>
        {kbT(locale, 'permissionsAutoAuth')}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={autoAuth}
        aria-label={kbT(locale, 'permissionsAutoAuth')}
        title={kbT(locale, 'permissionsAutoAuthHint')}
        className={`kb-configure-connector-switch${autoAuth ? ' is-on' : ''}`}
        onClick={handleAutoAuthToggle}
      >
        <span className="kb-configure-connector-switch-thumb" />
      </button>
    </div>
  )

  const renderPermissionsConfig = (
    isMemberMode: boolean,
    memberRowsOverride?: readonly OrgMember[],
    showAutoAuth = true,
  ) => {
    const visibleMembers = memberRowsOverride ?? filteredMembers
    const visibleMembersAllGranted =
      visibleMembers.length > 0 &&
      visibleMembers.every((member) => memberHasGrant(grantMatrix[member.id] ?? {}))
    const headerAllGranted = isMemberMode
      ? visibleMembersAllGranted
      : filteredRoles.length > 0 && filteredRoles.every((role) => subjectRoleGrants[role.id])

    return (
    <div className="kb-permissions-config-inner">
      {showAutoAuth ? renderAutoAuthControl() : null}

      <div className="kb-permissions-table-wrap">
        <table className="kb-permissions-table">
          <thead>
            <tr>
              <th scope="col" className="kb-permissions-table-user-col">
                {kbT(locale, 'permissionsUsername')}
              </th>
              <th scope="col">{kbT(locale, 'permissionsPermissionConfig')}</th>
              <th scope="col" className="kb-permissions-table-auth-col">
                <label className="kb-permissions-table-auth-all">
                  <span>{kbT(locale, 'permissionsTableSelectAll')}</span>
                  <input
                    type="checkbox"
                    checked={headerAllGranted}
                    onChange={(event) =>
                      isMemberMode
                        ? toggleAllVisible(event.target.checked, visibleMembers)
                        : toggleAllVisible(event.target.checked)
                    }
                    aria-label={kbT(locale, 'permissionsSelectAll')}
                  />
                </label>
              </th>
            </tr>
          </thead>
          <tbody>
            {isMemberMode ? (
              visibleMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="kb-permissions-table-empty">
                    {kbT(locale, 'permissionsEmpty')}
                  </td>
                </tr>
              ) : (
                visibleMembers.map((member) => {
                  const memberName = localizeMemberName(member, locale)
                  const memberGrants = grantMatrix[member.id] ?? {}
                  const isGranted = memberHasGrant(memberGrants)
                  const badgeVariant = memberPermissionBadgeVariant(member.id, memberGrants)
                  const roleLabel = memberPermissionRoleLabel(locale, member.id, memberGrants)
                  const avatar = memberAvatarColors(member.id)
                  return (
                    <tr key={member.id}>
                      <td className="kb-permissions-table-user">
                        <div className="kb-permissions-table-user-cell">
                          <span
                            className="kb-permissions-table-user-avatar"
                            style={{ background: avatar.background, color: avatar.color }}
                            aria-hidden="true"
                          >
                            {memberAvatarInitialsForMember(member, locale)}
                          </span>
                          <div className="kb-permissions-table-user-meta">
                            <span className="kb-permissions-table-user-name">{memberName}</span>
                            <span className="kb-permissions-table-user-email">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="kb-permissions-table-level">
                        <span
                          className={`kb-permissions-table-level-badge kb-permissions-table-level-badge--${badgeVariant}`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="kb-permissions-table-auth-col">
                        <div className="kb-permissions-table-auth-cell">
                          <label className="kb-permissions-table-auth-row">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              aria-label={`${memberName} ${kbT(locale, 'permissionsAuth')}`}
                              onChange={(event) => setMemberAccessGrant(member.id, event.target.checked)}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={3} className="kb-permissions-table-empty">
                  {kbT(locale, 'permissionsEmpty')}
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => {
                const roleLabel = resolveRoleLabel(role)
                const badgeVariant = roleBadgeVariant(role)
                const representative = roleRepresentativeMember(role)
                const displayName = representative
                  ? localizeMemberName(representative, locale)
                  : roleLabel
                const displayEmail = representative?.email ?? ''
                const avatarKey = representative?.id ?? role.id
                const avatar = memberAvatarColors(avatarKey)
                const avatarInitials = representative
                  ? memberAvatarInitialsForMember(representative, locale)
                  : memberAvatarInitials(roleLabel)
                return (
                  <tr key={role.id}>
                    <td className="kb-permissions-table-user">
                      <div className="kb-permissions-table-user-cell">
                        <span
                          className="kb-permissions-table-user-avatar"
                          style={{ background: avatar.background, color: avatar.color }}
                          aria-hidden="true"
                        >
                          {avatarInitials}
                        </span>
                        <div className="kb-permissions-table-user-meta">
                          <span className="kb-permissions-table-user-name">{displayName}</span>
                          <span className="kb-permissions-table-user-email">{displayEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="kb-permissions-table-level">
                      <span
                        className={`kb-permissions-table-level-badge kb-permissions-table-level-badge--${badgeVariant}`}
                      >
                        {roleLabel}
                      </span>
                    </td>
                    <td className="kb-permissions-table-auth-col">
                      <div className="kb-permissions-table-auth-cell">
                        <label className="kb-permissions-table-auth-row">
                          <input
                            type="checkbox"
                            checked={Boolean(subjectRoleGrants[role.id])}
                            aria-label={`${roleLabel} ${kbT(locale, 'permissionsAuth')}`}
                            onChange={(event) => setRoleGrant(role.id, event.target.checked)}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    )
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--batch-select kb-permissions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ac-modal-title-row ac-modal-title-row--batch kb-permissions-modal-header">
          <div className="kb-permissions-modal-heading">
            <h2 id={headingId} className="ac-modal-title">
              {kbT(locale, 'permissionsTitle')}
            </h2>
            <p className="kb-permissions-modal-target">{subtitle}</p>
          </div>
          <button
            type="button"
            className="ac-modal-close"
            aria-label={acT(locale, 'modalClose')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="ac-batch-select-body kb-permissions-modal-body">
          <div className="ac-batch-select-left">
            <div className="ac-batch-select-search">
              <SearchIcon />
              <input
                type="search"
                value={leftSearch}
                placeholder={acT(locale, 'batchSelectSearchPlaceholder')}
                onChange={(event) => setLeftSearch(event.target.value)}
                aria-label={acT(locale, 'batchSelectSearchPlaceholder')}
              />
            </div>

            <div className="ac-batch-select-sources" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={leftPane === 'org'}
                className={`ac-batch-select-source${leftPane === 'org' ? ' is-active' : ''}`}
                onClick={() => setLeftPane('org')}
              >
                <OrgTabIcon />
                <span>{acT(locale, 'batchSelectTabOrg')}</span>
              </button>
              {ENABLE_GROUP_SELECT_TAB ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={leftPane === 'group'}
                  className={`ac-batch-select-source${leftPane === 'group' ? ' is-active' : ''}`}
                  onClick={() => setLeftPane('group')}
                >
                  <GroupTabIcon />
                  <span>{acT(locale, 'batchSelectTabImport')}</span>
                </button>
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={leftPane === 'list'}
                className={`ac-batch-select-source${leftPane === 'list' ? ' is-active' : ''}`}
                onClick={() => setLeftPane('list')}
              >
                <ListTabIcon />
                <span>{acT(locale, 'batchSelectTabList')}</span>
              </button>
            </div>

            <div
              className={`ac-batch-select-list${
                isCategoryList ? ' ac-batch-select-list--categories' : ''
              }${showLeftPermissionsTable ? ' ac-batch-select-list--permissions' : ''}`}
              role="tabpanel"
            >
              {leftPane === 'list' ? (
                filteredListMembers.length > 0 ? (
                  <div className="kb-permissions-left-config-panel">
                    {renderMemberPickerTable(filteredListMembers)}
                  </div>
                ) : (
                  <div className="ac-batch-select-empty">{acT(locale, 'formSearchNoResults')}</div>
                )
              ) : null}

              {leftPane === 'org' ? (
                selectedOrgSubject ? (
                  <div className="ac-batch-select-group-panel">
                    <div className="ac-batch-select-group-toolbar">
                      <button
                        type="button"
                        className="ac-batch-select-group-back"
                        aria-label={acT(locale, 'batchSelectBackToOrg')}
                        onClick={() => setSelectedOrgSubjectId('')}
                      >
                        <ChevronLeftIcon />
                      </button>
                      <div className="ac-batch-select-org-header">
                        <PermissionsGroupHead name={selectedOrgName} memberCount={WORKSPACE_ROLES.length} />
                        {renderAutoAuthControl()}
                      </div>
                    </div>
                    <div className="kb-permissions-left-config-panel">
                      {renderPermissionsConfig(false, undefined, false)}
                    </div>
                  </div>
                ) : filteredOrgSubjects.length > 0 ? (
                  filteredOrgSubjects.map((subject) => {
                    const label = locale === 'zh' ? subject.nameZh : subject.nameEn
                    const grants = grantMatrix[subject.id] ?? {}
                    const allGranted =
                      WORKSPACE_ROLES.length > 0 && WORKSPACE_ROLES.every((role) => grants[role.id])
                    const someGranted = WORKSPACE_ROLES.some((role) => grants[role.id])
                    return (
                      <PermissionCategoryItem
                        key={subject.id}
                        name={label}
                        memberCountLabel={acT(locale, 'batchSelectGroupMembers').replace(
                          '{count}',
                          String(WORKSPACE_ROLES.length),
                        )}
                        selectAllLabel={acT(locale, 'rolePermissionsSelectAll')}
                        icon={<OrgTabIcon />}
                        allSelected={allGranted}
                        someSelected={someGranted}
                        onOpen={() => setSelectedOrgSubjectId(subject.id)}
                        onToggleAll={() => toggleOrgSubjectRoleGrants(subject.id)}
                      />
                    )
                  })
                ) : (
                  <div className="ac-batch-select-empty">{acT(locale, 'formSearchNoResults')}</div>
                )
              ) : null}

              {leftPane === 'group' ? (
                filteredChatGroups.length > 0 ? (
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
                          <PermissionsGroupHead
                            name={localizeChatGroupName(selectedChatGroup, locale)}
                            memberCount={selectedChatGroup.members.length}
                          />
                          {renderAutoAuthControl()}
                        </div>
                      </div>
                      <div className="kb-permissions-left-config-panel">
                        {renderPermissionsConfig(true, selectedChatGroup.members, false)}
                      </div>
                    </div>
                  ) : (
                    filteredChatGroups.map((group) => {
                      const members = group.members
                      const allGroupGranted =
                        members.length > 0 &&
                        members.every((member) => memberHasGrant(grantMatrix[member.id] ?? {}))
                      const someGroupGranted = members.some((member) =>
                        memberHasGrant(grantMatrix[member.id] ?? {}),
                      )
                      return (
                        <PermissionCategoryItem
                          key={group.id}
                          name={localizeChatGroupName(group, locale)}
                          memberCountLabel={acT(locale, 'batchSelectGroupMembers').replace(
                            '{count}',
                            String(members.length),
                          )}
                          selectAllLabel={acT(locale, 'rolePermissionsSelectAll')}
                          icon={<GroupTabIcon />}
                          allSelected={allGroupGranted}
                          someSelected={someGroupGranted}
                          onOpen={() => setSelectedChatGroupId(group.id)}
                          onToggleAll={() => toggleGroupMemberGrants(members)}
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
            <div className="ac-batch-select-selected-head">{rightPanelHeadText}</div>

            <div className="ac-batch-select-chips">
              {showRightPickerHint ? (
                <div className="ac-batch-select-chips-empty">{acT(locale, 'batchSelectEmptyHint')}</div>
              ) : (
                renderPersistedSelectionChips()
              )}
            </div>

            <div className="ac-batch-select-actions">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
                {acT(locale, 'formCancel')}
              </button>
              <button type="button" className="agents-btn agents-btn-primary" onClick={handleSave}>
                {acT(locale, 'formSave')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
