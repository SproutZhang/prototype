import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import { readLoginSession } from '../../../auth/session'
import { isLoginRoleTier } from '../../../auth/types'
import { TcsSuccessToast } from '../components/TcsSuccessToast'
import { TCS_ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import {
  clampToSpacePermissions,
  detectRolePreset,
  permissionsForPreset,
} from '../data/permissions'
import { TEAM_COLLABORATION_SPACES_SEED } from '../data/spacesSeed'
import { flattenTeamCollaborationSpaces } from '../utils/flattenTeamSpaces'
import { SHARED_SPACE_ID } from '../data/sharedSpace'
import {
  localizeSpaceDescription,
  localizeSpaceName,
  localizeZoneDescription,
  localizeZoneName,
  type TeamCollaborationSpaceTranslationKey,
} from '../i18n/strings'
import type {
  CollaborationZone,
  SpaceCustomRole,
  SpaceCustomRoleDraft,
  SpaceFormDraft,
  SpaceKind,
  TeamCollaborationSpaceItem,
  TeamRoute,
  TcsMemberAssignment,
  TcsOrgMember,
  TcsPermission,
  TcsRolePreset,
  ZoneDeleteMode,
  ZoneFormDraft,
} from '../types'
import {
  applyExcludedMembers,
  buildInitialZoneMembersForAccessMode,
  buildMembersForSpaceDraft,
  mergeInvitedMemberAssignments,
  mergeInvitedMembers,
  resolveInvitedMemberAssignments,
} from '../utils/memberInit'
import { getDemoExpiredProjectSpaceId } from '../utils/projectItems'
import { createTeamSpaceFromDraft } from '../utils/createTeamSpaceFromDraft'
import {
  mergePublishCreatedSpaces,
  resolvePublishCreatedSpace,
  subscribePublishSpaceSync,
} from '../utils/publishSpaceSync'
import { registerTeamSpacesUpdater } from '../utils/teamCollaborationSpaceRuntime'
import { buildTeamPath } from '../utils/routing'
import { resolveSpaceResourceIds } from '../utils/spaceResources'
import {
  addProjectSpaceCustomRoleRecord,
  getProjectSpaceRolesStoreSnapshot,
  removeProjectSpaceCustomRoleRecord,
  resolveProjectSpacePresetPermissions,
  resolveSpaceMemberPresetPermissions,
  subscribeProjectSpaceCustomRoles,
  updateProjectSpaceBuiltinRolePermissions as persistProjectSpaceBuiltinRolePermissions,
  updateProjectSpaceCustomRoleRecord,
  type ProjectSpaceBuiltinPreset,
} from '../utils/projectSpaceCustomRolesSync'

const ACCENT_PALETTE = ['#6366f1', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6']

function buildMemberAssignment(
  memberId: string,
  preset: TcsRolePreset,
  permissions: TcsPermission[],
  customRoleId?: string,
): TcsMemberAssignment {
  const assignment: TcsMemberAssignment = {
    memberId,
    rolePreset: preset,
    permissions: [...permissions],
  }
  if (customRoleId) assignment.customRoleId = customRoleId
  return assignment
}

function syncZoneMemberFromSpace(
  zoneMember: TcsMemberAssignment,
  spaceMember: TcsMemberAssignment,
): TcsMemberAssignment {
  const clamped = clampToSpacePermissions(spaceMember.permissions, zoneMember.permissions)
  const detected = detectRolePreset(clamped)
  if (spaceMember.customRoleId && detected === 'custom') {
    return buildMemberAssignment(zoneMember.memberId, 'custom', clamped, spaceMember.customRoleId)
  }
  return buildMemberAssignment(zoneMember.memberId, detected, clamped)
}

function nowLabel(): { zh: string; en: string; updatedAtLabelZh: string; updatedAtLabelEn: string } {
  return { zh: '刚刚更新', en: 'Updated just now', updatedAtLabelZh: '刚刚更新', updatedAtLabelEn: 'Updated just now' }
}

function buildTeamSpaceFromDraft(
  draft: SpaceFormDraft,
  allSpaces: TeamCollaborationSpaceItem[],
  existing?: TeamCollaborationSpaceItem,
  spaceKind: SpaceKind = 'team',
): TeamCollaborationSpaceItem {
  return createTeamSpaceFromDraft(draft, allSpaces, existing, spaceKind)
}

function syncSpacesForCustomRoleChange(
  spaces: TeamCollaborationSpaceItem[],
  roleId: string,
  role: SpaceCustomRole | null,
): TeamCollaborationSpaceItem[] {
  const fallbackPermissions = resolveProjectSpacePresetPermissions('observer')
  return spaces.map((space) => {
    if (space.kind === 'shared') return space
    const hasMatchingMember =
      space.members.some((member) => member.customRoleId === roleId) ||
      space.zones.some((zone) => zone.members.some((member) => member.customRoleId === roleId))
    if (!hasMatchingMember && role) return space

    const nextMembers = space.members.map((member) => {
      if (member.customRoleId !== roleId) return member
      if (!role) return buildMemberAssignment(member.memberId, 'observer', fallbackPermissions)
      return buildMemberAssignment(member.memberId, 'custom', role.permissions, roleId)
    })
    const nextZones = space.zones.map((zone) => ({
      ...zone,
      members: zone.members.map((zoneMember) => {
        if (zoneMember.customRoleId !== roleId) return zoneMember
        const spaceMember = nextMembers.find((member) => member.memberId === zoneMember.memberId)
        if (!spaceMember) return zoneMember
        return syncZoneMemberFromSpace(zoneMember, spaceMember)
      }),
    }))
    const updated = nowLabel()
    return {
      ...space,
      members: nextMembers,
      zones: nextZones,
      updatedAtLabelZh: updated.updatedAtLabelZh,
      updatedAtLabelEn: updated.updatedAtLabelEn,
    }
  })
}

function syncSpacesForBuiltinPresetChange(
  spaces: TeamCollaborationSpaceItem[],
  preset: ProjectSpaceBuiltinPreset,
  permissions: TcsPermission[],
): TeamCollaborationSpaceItem[] {
  return spaces.map((space) => {
    if (space.kind === 'shared') return space
    const nextMembers = space.members.map((member) => {
      if (member.customRoleId || member.rolePreset !== preset) return member
      return buildMemberAssignment(member.memberId, preset, permissions)
    })
    const nextZones = space.zones.map((zone) => ({
      ...zone,
      members: zone.members.map((zoneMember) => {
        if (zoneMember.customRoleId || zoneMember.rolePreset !== preset) return zoneMember
        const spaceMember = nextMembers.find((member) => member.memberId === zoneMember.memberId)
        if (!spaceMember) return zoneMember
        return syncZoneMemberFromSpace(zoneMember, spaceMember)
      }),
    }))
    const updated = nowLabel()
    return {
      ...space,
      members: nextMembers,
      zones: nextZones,
      updatedAtLabelZh: updated.updatedAtLabelZh,
      updatedAtLabelEn: updated.updatedAtLabelEn,
    }
  })
}

function withSpaceResourceIds(
  space: TeamCollaborationSpaceItem,
  resourceIds: string[],
): TeamCollaborationSpaceItem {
  const updated = nowLabel()
  return {
    ...space,
    resourceIds,
    resourceCount: resourceIds.length,
    updatedAtLabelZh: updated.updatedAtLabelZh,
    updatedAtLabelEn: updated.updatedAtLabelEn,
  }
}

/** 新建时按访问权限决定归属版块：共享 → 共享空间，其余 → 团队协作空间 */
function resolveCreateSpaceKind(draft: SpaceFormDraft, formSpaceKind: SpaceKind): SpaceKind {
  if (draft.accessMode === 'shared') return 'shared'
  if (formSpaceKind === 'shared') return formSpaceKind
  return 'team'
}

export type TeamCollaborationSpaceContextValue = {
  navigate: (route: TeamRoute) => void
  spaces: TeamCollaborationSpaceItem[]
  orgMembers: TcsOrgMember[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  sharedSpace: TeamCollaborationSpaceItem | null
  sharedSpaces: TeamCollaborationSpaceItem[]
  teamSpaces: TeamCollaborationSpaceItem[]
  personalSpaces: TeamCollaborationSpaceItem[]
  sharedSpaceVisible: boolean
  getSpace: (id: string) => TeamCollaborationSpaceItem | undefined
  getZone: (spaceId: string, zoneId: string) => CollaborationZone | undefined
  localizeName: (item: { nameZh: string; nameEn: string }) => string
  localizeDescription: (item: { descriptionZh: string; descriptionEn: string }) => string
  localizeZoneTitle: (zone: CollaborationZone) => string
  localizeZoneDesc: (zone: CollaborationZone) => string
  localizeMember: (member: TcsOrgMember) => string
  localizeMemberDept: (member: TcsOrgMember) => string
  formOpen: boolean
  formSpaceKind: SpaceKind
  editingSpace: TeamCollaborationSpaceItem | null
  copySourceOptions: TeamCollaborationSpaceItem[]
  openCreateForm: (kind?: 'team' | 'personal' | 'shared') => void
  openEditForm: (item: TeamCollaborationSpaceItem) => void
  closeForm: () => void
  submitForm: (
    draft: SpaceFormDraft,
    options?: { kind?: SpaceKind; editSpaceId?: string; forceKind?: boolean },
  ) => string | null
  updateSpaceInfo: (spaceId: string, draft: SpaceFormDraft) => void
  updateSpaceMember: (
    spaceId: string,
    memberId: string,
    preset: TcsRolePreset,
    permissions: TcsPermission[],
    customRoleId?: string,
  ) => void
  addSpaceMembers: (spaceId: string, memberIds: string[], preset: Exclude<TcsRolePreset, 'custom'>) => void
  projectSpaceCustomRoles: readonly SpaceCustomRole[]
  projectSpaceBuiltinRolePermissions: Record<ProjectSpaceBuiltinPreset, TcsPermission[]>
  addProjectSpaceCustomRole: (draft: SpaceCustomRoleDraft) => string
  updateProjectSpaceCustomRole: (roleId: string, draft: SpaceCustomRoleDraft) => void
  updateProjectSpaceBuiltinRolePermissions: (preset: ProjectSpaceBuiltinPreset, permissions: TcsPermission[]) => void
  removeProjectSpaceCustomRole: (roleId: string) => void
  addSpaceResources: (spaceId: string, resourceIds: string[]) => void
  removeSpaceResource: (spaceId: string, resourceId: string) => void
  moveSpaceResource: (fromSpaceId: string, resourceId: string, toSpaceId: string) => void
  removeSpaceMember: (spaceId: string, memberId: string) => void
  deleteTeamSpace: (spaceId: string) => void
  isProjectSpaceExpired: (spaceId: string) => boolean
  activateProjectSpace: (
    spaceId: string,
    draft: { deadlineStart: string | null; deadlineEnd: string | null },
  ) => void
  zoneFormOpen: boolean
  editingZone: CollaborationZone | null
  openCreateZoneForm: (spaceId: string) => void
  openEditZoneForm: (spaceId: string, zone: CollaborationZone) => void
  closeZoneForm: () => void
  submitZoneForm: (spaceId: string, draft: ZoneFormDraft) => string | null
  updateZoneMember: (
    spaceId: string,
    zoneId: string,
    memberId: string,
    preset: TcsRolePreset,
    permissions: TcsPermission[],
    customRoleId?: string,
  ) => void
  addZoneMembers: (
    spaceId: string,
    zoneId: string,
    memberIds: string[],
    preset: Exclude<TcsRolePreset, 'custom'>,
  ) => void
  removeZoneMember: (spaceId: string, zoneId: string, memberId: string) => void
  deleteZone: (spaceId: string, zoneId: string, mode: ZoneDeleteMode) => void
}

const TeamCollaborationSpaceContext = createContext<TeamCollaborationSpaceContextValue | null>(null)

export function TeamCollaborationSpaceProvider({
  locale,
  children,
}: {
  locale: AppLocale
  children: ReactNode
}) {
  const [spaces, setSpaces] = useState<TeamCollaborationSpaceItem[]>(() =>
    mergePublishCreatedSpaces(flattenTeamCollaborationSpaces(TEAM_COLLABORATION_SPACES_SEED)),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formSpaceKind, setFormSpaceKind] = useState<SpaceKind>('team')
  const [editingSpace, setEditingSpace] = useState<TeamCollaborationSpaceItem | null>(null)
  const [createSuccessToastOpen, setCreateSuccessToastOpen] = useState(false)
  const [successToastTitleKey, setSuccessToastTitleKey] =
    useState<TeamCollaborationSpaceTranslationKey>('createSpaceSuccessTitle')
  const [successToastSubKey, setSuccessToastSubKey] =
    useState<TeamCollaborationSpaceTranslationKey>('createSpaceSuccessSub')
  const createSuccessToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [zoneFormOpen, setZoneFormOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<CollaborationZone | null>(null)
  const [expiredProjectSpaceIds, setExpiredProjectSpaceIds] = useState<string[]>(() => {
    const spaceId = getDemoExpiredProjectSpaceId()
    return spaceId ? [spaceId] : []
  })
  const projectSpaceRolesStore = useSyncExternalStore(
    subscribeProjectSpaceCustomRoles,
    getProjectSpaceRolesStoreSnapshot,
    getProjectSpaceRolesStoreSnapshot,
  )

  const navigate = useCallback((next: TeamRoute) => {
    const path = buildTeamPath(next)
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ tcsRoute: next }, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    window.scrollTo(0, 0)
  }, [])

  const filterByQuery = useCallback(
    (items: TeamCollaborationSpaceItem[]) => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return items
      return items.filter((item) => {
        const haystack = [item.nameZh, item.nameEn, item.descriptionZh, item.descriptionEn]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    },
    [searchQuery],
  )

  const sharedSpaces = useMemo(
    () => filterByQuery(spaces.filter((s) => s.kind === 'shared')),
    [spaces, filterByQuery],
  )
  const sharedSpace = useMemo(
    () => sharedSpaces.find((s) => s.id === SHARED_SPACE_ID) ?? sharedSpaces[0] ?? null,
    [sharedSpaces],
  )
  const teamSpaces = useMemo(
    () => filterByQuery(spaces.filter((s) => s.kind === 'team')),
    [spaces, filterByQuery],
  )
  const personalSpaces = useMemo(
    () => filterByQuery(spaces.filter((s) => s.kind === 'personal')),
    [spaces, filterByQuery],
  )
  const sharedSpaceVisible = useMemo(() => sharedSpaces.length > 0, [sharedSpaces.length])
  const copySourceOptions = useMemo(() => {
    const kind = editingSpace?.kind ?? formSpaceKind
    if (kind === 'shared') {
      return spaces.filter((s) => s.kind === 'shared' || s.kind === 'team')
    }
    return spaces.filter((s) => s.kind === kind)
  }, [spaces, editingSpace, formSpaceKind])

  const getSpace = useCallback(
    (id: string) => resolvePublishCreatedSpace(id, spaces),
    [spaces],
  )
  const getZone = useCallback(
    (spaceId: string, zoneId: string) => spaces.find((s) => s.id === spaceId)?.zones.find((z) => z.id === zoneId),
    [spaces],
  )

  const localizeName = useCallback(
    (item: { nameZh: string; nameEn: string }) => localizeSpaceName(item, locale),
    [locale],
  )
  const localizeDescription = useCallback(
    (item: { descriptionZh: string; descriptionEn: string }) => localizeSpaceDescription(item, locale),
    [locale],
  )
  const localizeZoneTitle = useCallback((zone: CollaborationZone) => localizeZoneName(zone, locale), [locale])
  const localizeZoneDesc = useCallback((zone: CollaborationZone) => localizeZoneDescription(zone, locale), [locale])
  const localizeMember = useCallback(
    (member: TcsOrgMember) => (locale === 'zh' ? member.nameZh : member.nameEn),
    [locale],
  )
  const localizeMemberDept = useCallback(
    (member: TcsOrgMember) => (locale === 'zh' ? member.departmentZh : member.departmentEn),
    [locale],
  )

  const openCreateForm = useCallback((kind: 'team' | 'personal' | 'shared' = 'team') => {
    setEditingSpace(null)
    setFormSpaceKind(kind)
    setFormOpen(true)
  }, [])
  const openEditForm = useCallback((item: TeamCollaborationSpaceItem) => {
    setEditingSpace(item)
    setFormSpaceKind(item.kind === 'shared' ? 'shared' : item.kind)
    setFormOpen(true)
  }, [])
  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingSpace(null)
    setFormSpaceKind('team')
  }, [])

  const showSuccessToast = useCallback(
    (titleKey: TeamCollaborationSpaceTranslationKey, subKey: TeamCollaborationSpaceTranslationKey) => {
      setSuccessToastTitleKey(titleKey)
      setSuccessToastSubKey(subKey)
      setCreateSuccessToastOpen(true)
      if (createSuccessToastTimerRef.current) {
        clearTimeout(createSuccessToastTimerRef.current)
      }
      createSuccessToastTimerRef.current = setTimeout(() => {
        createSuccessToastTimerRef.current = undefined
        setCreateSuccessToastOpen(false)
      }, 3200)
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (createSuccessToastTimerRef.current) {
        clearTimeout(createSuccessToastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return subscribePublishSpaceSync(() => {
      setSpaces((current) => mergePublishCreatedSpaces(current))
    })
  }, [])

  useEffect(() => {
    return registerTeamSpacesUpdater((apply) => {
      setSpaces(apply)
    })
  }, [])

  const submitForm = useCallback(
    (
      draft: SpaceFormDraft,
      options?: { kind?: SpaceKind; editSpaceId?: string; forceKind?: boolean },
    ): string | null => {
      const editSpaceId = options?.editSpaceId ?? editingSpace?.id
      if (editSpaceId) {
        setSpaces((current) =>
          current.map((item) => {
            if (item.id !== editSpaceId) return item
            const copySource =
              draft.accessMode === 'copy' && draft.copyFromSpaceId
                ? current.find((s) => s.id === draft.copyFromSpaceId) ?? null
                : null
            const membersChanged =
              !item.permissionsCustomized &&
              (draft.accessMode !== (item.accessMode ?? 'default') ||
                draft.copyFromSpaceId !== item.copyFromSpaceId)
            const built = buildTeamSpaceFromDraft(draft, current, item)
            const invitedAssignments = resolveInvitedMemberAssignments(draft)
            let nextMembers = membersChanged
              ? buildMembersForSpaceDraft(draft.accessMode, copySource, draft)
              : item.members
            if (!membersChanged && invitedAssignments?.length) {
              nextMembers = mergeInvitedMemberAssignments(nextMembers, invitedAssignments)
            }
            if (!membersChanged) {
              nextMembers = applyExcludedMembers(nextMembers, draft.excludedMemberIds)
            }
            return {
              ...built,
              members: nextMembers,
              zones: item.zones,
              resourceCount: item.resourceCount,
              permissionsCustomized:
                item.permissionsCustomized ||
                (invitedAssignments?.length ?? 0) > 0 ||
                (draft.excludedMemberIds?.length ?? 0) > 0,
            }
          }),
        )
        closeForm()
        showSuccessToast('saveSpaceSuccessTitle', 'saveSpaceSuccessSub')
        return editSpaceId
      }
      const requestedKind = options?.kind ?? formSpaceKind
      const createKind =
        options?.forceKind && requestedKind != null
          ? requestedKind
          : resolveCreateSpaceKind(draft, requestedKind)
      const newId = `tcs-${createKind}-${Date.now()}`
      flushSync(() => {
        setSpaces((current) => [
          ...current,
          { ...buildTeamSpaceFromDraft(draft, current, undefined, createKind), id: newId },
        ])
        closeForm()
      })
      showSuccessToast('createSpaceSuccessTitle', 'createSpaceSuccessSub')
      return newId
    },
    [closeForm, editingSpace, formSpaceKind, showSuccessToast, spaces],
  )

  const updateSpaceInfo = useCallback((spaceId: string, draft: SpaceFormDraft) => {
    setSpaces((current) =>
      current.map((item) => {
        if (item.id !== spaceId) return item
        const copySource =
          draft.accessMode === 'copy' && draft.copyFromSpaceId
            ? current.find((s) => s.id === draft.copyFromSpaceId) ?? null
            : null
        const membersChanged =
          !item.permissionsCustomized &&
          (draft.accessMode !== item.accessMode || draft.copyFromSpaceId !== item.copyFromSpaceId)
        const updated = nowLabel()
        return {
          ...item,
          nameZh: draft.name,
          nameEn: draft.name,
          descriptionZh: draft.description,
          descriptionEn: draft.description,
          accessMode: draft.accessMode,
          copyFromSpaceId: draft.accessMode === 'copy' ? draft.copyFromSpaceId ?? null : null,
          members: membersChanged
            ? buildMembersForSpaceDraft(draft.accessMode, copySource, draft)
            : item.members,
          updatedAtLabelZh: updated.updatedAtLabelZh,
          updatedAtLabelEn: updated.updatedAtLabelEn,
          ...('deadlineStart' in draft
            ? { deadlineStart: draft.deadlineStart ?? null, deadlineEnd: draft.deadlineEnd ?? null }
            : {}),
        }
      }),
    )
  }, [])

  const updateSpaceMember = useCallback(
    (
      spaceId: string,
      memberId: string,
      preset: TcsRolePreset,
      permissions: TcsPermission[],
      customRoleId?: string,
    ) => {
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== spaceId || space.kind === 'shared') return space
          const nextMembers = space.members.map((m) =>
            m.memberId === memberId
              ? buildMemberAssignment(memberId, preset, permissions, customRoleId)
              : m,
          )
          const updated = nowLabel()
          return {
            ...space,
            permissionsCustomized: true,
            members: nextMembers,
            zones: space.zones.map((zone) => ({
              ...zone,
              members: zone.members.flatMap((zm) => {
                if (zm.memberId !== memberId) return [zm]
                const spaceMember = nextMembers.find((m) => m.memberId === memberId)
                if (!spaceMember) return []
                return [syncZoneMemberFromSpace(zm, spaceMember)]
              }),
            })),
            updatedAtLabelZh: updated.updatedAtLabelZh,
            updatedAtLabelEn: updated.updatedAtLabelEn,
          }
        }),
      )
    },
    [],
  )

  const addSpaceMembers = useCallback(
    (spaceId: string, memberIds: string[], preset: Exclude<TcsRolePreset, 'custom'>) => {
      const permissions = resolveSpaceMemberPresetPermissions(preset)
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== spaceId || space.kind === 'shared') return space
          const existing = new Set(space.members.map((m) => m.memberId))
          const additions = memberIds
            .filter((id) => !existing.has(id))
            .map((id) => ({ memberId: id, rolePreset: preset, permissions: [...permissions] }))
          const updated = nowLabel()
          return {
            ...space,
            permissionsCustomized: true,
            members: [...space.members, ...additions],
            updatedAtLabelZh: updated.updatedAtLabelZh,
            updatedAtLabelEn: updated.updatedAtLabelEn,
          }
        }),
      )
    },
    [],
  )

  const addProjectSpaceCustomRole = useCallback((draft: SpaceCustomRoleDraft): string => {
    return addProjectSpaceCustomRoleRecord(draft)
  }, [])

  const updateProjectSpaceCustomRole = useCallback((roleId: string, draft: SpaceCustomRoleDraft) => {
    const nextRole = updateProjectSpaceCustomRoleRecord(roleId, draft)
    if (!nextRole) return
    setSpaces((current) => syncSpacesForCustomRoleChange(current, roleId, nextRole))
  }, [])

  const updateProjectSpaceBuiltinRolePermissions = useCallback(
    (preset: ProjectSpaceBuiltinPreset, permissions: TcsPermission[]) => {
      const nextPermissions = persistProjectSpaceBuiltinRolePermissions(preset, permissions)
      setSpaces((current) => syncSpacesForBuiltinPresetChange(current, preset, nextPermissions))
    },
    [],
  )

  const removeProjectSpaceCustomRole = useCallback((roleId: string) => {
    if (!removeProjectSpaceCustomRoleRecord(roleId)) return
    setSpaces((current) => syncSpacesForCustomRoleChange(current, roleId, null))
  }, [])

  const addSpaceResources = useCallback((spaceId: string, resourceIds: string[]) => {
    if (resourceIds.length === 0) return
    if (expiredProjectSpaceIds.includes(spaceId)) return
    setSpaces((current) =>
      current.map((space) => {
        if (space.id !== spaceId || space.kind === 'shared') return space
        const currentIds = resolveSpaceResourceIds(space)
        const merged = [...currentIds]
        for (const resourceId of resourceIds) {
          if (!merged.includes(resourceId)) merged.push(resourceId)
        }
        const updated = nowLabel()
        return {
          ...space,
          resourceIds: merged,
          resourceCount: merged.length,
          updatedAtLabelZh: updated.updatedAtLabelZh,
          updatedAtLabelEn: updated.updatedAtLabelEn,
        }
      }),
    )
    showSuccessToast('importResourcesSuccessTitle', 'importResourcesSuccessSub')
  }, [expiredProjectSpaceIds, showSuccessToast])

  const removeSpaceResource = useCallback(
    (spaceId: string, resourceId: string) => {
      if (expiredProjectSpaceIds.includes(spaceId)) return
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== spaceId) return space
          const currentIds = resolveSpaceResourceIds(space)
          if (!currentIds.includes(resourceId)) return space
          return withSpaceResourceIds(
            space,
            currentIds.filter((id) => id !== resourceId),
          )
        }),
      )
      showSuccessToast('removeResourceSuccessTitle', 'removeResourceSuccessSub')
    },
    [expiredProjectSpaceIds, showSuccessToast],
  )

  const moveSpaceResource = useCallback(
    (fromSpaceId: string, resourceId: string, toSpaceId: string) => {
      if (fromSpaceId === toSpaceId) return
      if (expiredProjectSpaceIds.includes(fromSpaceId)) return
      setSpaces((current) => {
        const fromSpace = current.find((space) => space.id === fromSpaceId)
        const toSpace = current.find((space) => space.id === toSpaceId)
        if (!fromSpace || !toSpace) return current
        const fromIds = resolveSpaceResourceIds(fromSpace)
        if (!fromIds.includes(resourceId)) return current

        return current.map((space) => {
          if (space.id === fromSpaceId) {
            return withSpaceResourceIds(
              space,
              fromIds.filter((id) => id !== resourceId),
            )
          }
          if (space.id === toSpaceId) {
            const toIds = resolveSpaceResourceIds(space)
            const merged = toIds.includes(resourceId) ? toIds : [...toIds, resourceId]
            return withSpaceResourceIds(space, merged)
          }
          return space
        })
      })
      showSuccessToast('moveResourceSuccessTitle', 'moveResourceSuccessSub')
    },
    [expiredProjectSpaceIds, showSuccessToast],
  )

  const removeSpaceMember = useCallback((spaceId: string, memberId: string) => {
    setSpaces((current) =>
      current.map((space) => {
        if (space.id !== spaceId || space.kind === 'shared') return space
        const updated = nowLabel()
        return {
          ...space,
          permissionsCustomized: true,
          members: space.members.filter((m) => m.memberId !== memberId),
          zones: space.zones.map((zone) => ({
            ...zone,
            members: zone.members.filter((m) => m.memberId !== memberId),
          })),
          updatedAtLabelZh: updated.updatedAtLabelZh,
          updatedAtLabelEn: updated.updatedAtLabelEn,
        }
      }),
    )
  }, [])

  const openCreateZoneForm = useCallback((spaceId: string) => {
    void spaceId
    setEditingZone(null)
    setZoneFormOpen(true)
  }, [])
  const openEditZoneForm = useCallback((_spaceId: string, zone: CollaborationZone) => {
    setEditingZone(zone)
    setZoneFormOpen(true)
  }, [])
  const closeZoneForm = useCallback(() => {
    setZoneFormOpen(false)
    setEditingZone(null)
  }, [])

  const submitZoneForm = useCallback(
    (spaceId: string, draft: ZoneFormDraft): string | null => {
      const loginRole = readLoginSession()?.role
      if (isLoginRoleTier(loginRole, 'user') || isLoginRoleTier(loginRole, 'manager')) return null
      const targetSpace = spaces.find((item) => item.id === spaceId)
      if (!targetSpace || targetSpace.kind === 'team' || targetSpace.kind === 'personal') return null

      const updated = nowLabel()
      if (editingZone) {
        setSpaces((current) =>
          current.map((space) => {
            if (space.id !== spaceId) return space
            const copySource =
              draft.accessMode === 'copy' && draft.copyFromZoneId
                ? space.zones.find((zone) => zone.id === draft.copyFromZoneId) ?? null
                : null
            const membersChanged =
              !space.zones.find((zone) => zone.id === editingZone.id)?.permissionsCustomized &&
              (draft.accessMode !== editingZone.accessMode ||
                draft.copyFromZoneId !== editingZone.copyFromZoneId)
            return {
              ...space,
              zones: space.zones.map((zone) =>
                zone.id === editingZone.id
                  ? {
                      ...zone,
                      nameZh: draft.name,
                      nameEn: draft.name,
                      descriptionZh: draft.description,
                      descriptionEn: draft.description,
                      accessMode: draft.accessMode,
                      copyFromZoneId: draft.accessMode === 'copy' ? draft.copyFromZoneId ?? null : null,
                      members: membersChanged
                        ? buildInitialZoneMembersForAccessMode(draft.accessMode, space, copySource)
                        : zone.members,
                      updatedAtLabelZh: updated.updatedAtLabelZh,
                      updatedAtLabelEn: updated.updatedAtLabelEn,
                    }
                  : zone,
              ),
              updatedAtLabelZh: updated.updatedAtLabelZh,
              updatedAtLabelEn: updated.updatedAtLabelEn,
            }
          }),
        )
        closeZoneForm()
        return editingZone.id
      }
      const zoneId = `zone-${Date.now()}`
      setSpaces((current) =>
        current.map((s) => {
          if (s.id !== spaceId) return s
          const copySource =
            draft.accessMode === 'copy' && draft.copyFromZoneId
              ? s.zones.find((zone) => zone.id === draft.copyFromZoneId) ?? null
              : null
          const members = buildInitialZoneMembersForAccessMode(draft.accessMode, s, copySource)
          const zoneCount = s.zones.length
          return {
            ...s,
            zones: [
              ...s.zones,
              {
                id: zoneId,
                spaceId,
                nameZh: draft.name,
                nameEn: draft.name,
                descriptionZh: draft.description,
                descriptionEn: draft.description,
                accent: ACCENT_PALETTE[zoneCount % ACCENT_PALETTE.length] ?? '#6366f1',
                accessMode: draft.accessMode,
                copyFromZoneId: draft.accessMode === 'copy' ? draft.copyFromZoneId ?? null : null,
                permissionsCustomized: false,
                members,
                resourceCount: 0,
                updatedAtLabelZh: updated.updatedAtLabelZh,
                updatedAtLabelEn: updated.updatedAtLabelEn,
              },
            ],
            updatedAtLabelZh: updated.updatedAtLabelZh,
            updatedAtLabelEn: updated.updatedAtLabelEn,
          }
        }),
      )
      closeZoneForm()
      return zoneId
    },
    [closeZoneForm, editingZone, spaces],
  )

  const updateZoneMember = useCallback(
    (
      spaceId: string,
      zoneId: string,
      memberId: string,
      _preset: TcsRolePreset,
      permissions: TcsPermission[],
      customRoleId?: string,
    ) => {
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== spaceId) return space
          const spaceMember = space.members.find((m) => m.memberId === memberId)
          if (!spaceMember) return space
          const clamped = clampToSpacePermissions(spaceMember.permissions, permissions)
          const finalPreset = customRoleId ? 'custom' : detectRolePreset(clamped)
          const updated = nowLabel()
          return {
            ...space,
            zones: space.zones.map((zone) => {
              if (zone.id !== zoneId) return zone
              return {
                ...zone,
                permissionsCustomized: true,
                members: zone.members.map((m) =>
                  m.memberId === memberId
                    ? buildMemberAssignment(memberId, finalPreset, clamped, customRoleId)
                    : m,
                ),
                updatedAtLabelZh: updated.updatedAtLabelZh,
                updatedAtLabelEn: updated.updatedAtLabelEn,
              }
            }),
            updatedAtLabelZh: updated.updatedAtLabelZh,
            updatedAtLabelEn: updated.updatedAtLabelEn,
          }
        }),
      )
    },
    [],
  )

  const addZoneMembers = useCallback(
    (spaceId: string, zoneId: string, memberIds: string[], preset: Exclude<TcsRolePreset, 'custom'>) => {
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== spaceId) return space
          const updated = nowLabel()
          return {
            ...space,
            zones: space.zones.map((zone) => {
              if (zone.id !== zoneId) return zone
              const existing = new Set(zone.members.map((m) => m.memberId))
              const additions = memberIds
                .filter((id) => !existing.has(id))
                .map((memberId) => {
                  const spaceMember = space.members.find((m) => m.memberId === memberId)
                  if (!spaceMember) return null
                  const perms = clampToSpacePermissions(
                    spaceMember.permissions,
                    resolveSpaceMemberPresetPermissions(preset),
                  )
                  return { memberId, rolePreset: detectRolePreset(perms), permissions: perms }
                })
                .filter((m): m is TcsMemberAssignment => m != null)
              return {
                ...zone,
                permissionsCustomized: true,
                members: [...zone.members, ...additions],
                updatedAtLabelZh: updated.updatedAtLabelZh,
                updatedAtLabelEn: updated.updatedAtLabelEn,
              }
            }),
            updatedAtLabelZh: updated.updatedAtLabelZh,
            updatedAtLabelEn: updated.updatedAtLabelEn,
          }
        }),
      )
    },
    [],
  )

  const removeZoneMember = useCallback((spaceId: string, zoneId: string, memberId: string) => {
    setSpaces((current) =>
      current.map((space) => {
        if (space.id !== spaceId) return space
        const updated = nowLabel()
        return {
          ...space,
          zones: space.zones.map((zone) =>
            zone.id === zoneId
              ? {
                  ...zone,
                  permissionsCustomized: true,
                  members: zone.members.filter((m) => m.memberId !== memberId),
                  updatedAtLabelZh: updated.updatedAtLabelZh,
                  updatedAtLabelEn: updated.updatedAtLabelEn,
                }
              : zone,
          ),
          updatedAtLabelZh: updated.updatedAtLabelZh,
          updatedAtLabelEn: updated.updatedAtLabelEn,
        }
      }),
    )
  }, [])

  const deleteTeamSpace = useCallback((spaceId: string) => {
    const isAdmin = readLoginSession()?.role === 'admin'
    setSpaces((current) =>
      current
        .filter((space) => {
          if (space.id !== spaceId) return true
          if (space.kind === 'shared') return !isAdmin
          return false
        })
        .map((space) =>
          space.copyFromSpaceId === spaceId ? { ...space, copyFromSpaceId: null } : space,
        ),
    )
    setEditingSpace((current) => {
      if (current?.id === spaceId) {
        setFormOpen(false)
        return null
      }
      return current
    })
  }, [])

  const deleteZone = useCallback((spaceId: string, zoneId: string, mode: ZoneDeleteMode) => {
    setSpaces((current) =>
      current.map((space) => {
        if (space.id !== spaceId) return space
        const zone = space.zones.find((z) => z.id === zoneId)
        if (!zone) return space
        const resourceDelta = mode === 'delete_all' ? -zone.resourceCount : 0
        const updated = nowLabel()
        return {
          ...space,
          resourceCount: Math.max(0, space.resourceCount + resourceDelta),
          zones: space.zones.filter((z) => z.id !== zoneId),
          updatedAtLabelZh: updated.updatedAtLabelZh,
          updatedAtLabelEn: updated.updatedAtLabelEn,
        }
      }),
    )
  }, [])

  const isProjectSpaceExpired = useCallback(
    (spaceId: string) => expiredProjectSpaceIds.includes(spaceId),
    [expiredProjectSpaceIds],
  )

  const activateProjectSpace = useCallback(
    (spaceId: string, draft: { deadlineStart: string | null; deadlineEnd: string | null }) => {
      setExpiredProjectSpaceIds((current) => {
        if (!current.includes(spaceId)) return current
        return current.filter((id) => id !== spaceId)
      })
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== spaceId) return space
          const updated = nowLabel()
          return {
            ...space,
            deadlineStart: draft.deadlineStart,
            deadlineEnd: draft.deadlineEnd,
            updatedAtLabelZh: updated.updatedAtLabelZh,
            updatedAtLabelEn: updated.updatedAtLabelEn,
          }
        }),
      )
      showSuccessToast('projectSpaceActivateSuccessTitle', 'projectSpaceActivateSuccessSub')
    },
    [showSuccessToast],
  )

  const value = useMemo(
    (): TeamCollaborationSpaceContextValue => ({
      navigate,
      spaces,
      orgMembers: TCS_ORG_MEMBERS_SEED,
      searchQuery,
      setSearchQuery,
      sharedSpace,
      sharedSpaces,
      teamSpaces,
      personalSpaces,
      sharedSpaceVisible,
      getSpace,
      getZone,
      localizeName,
      localizeDescription,
      localizeZoneTitle,
      localizeZoneDesc,
      localizeMember,
      localizeMemberDept,
      formOpen,
      formSpaceKind,
      editingSpace,
      copySourceOptions,
      openCreateForm,
      openEditForm,
      closeForm,
      submitForm,
      updateSpaceInfo,
      updateSpaceMember,
      addSpaceMembers,
      projectSpaceCustomRoles: projectSpaceRolesStore.customRoles,
      projectSpaceBuiltinRolePermissions: projectSpaceRolesStore.builtinRolePermissions,
      addProjectSpaceCustomRole,
      updateProjectSpaceCustomRole,
      updateProjectSpaceBuiltinRolePermissions,
      removeProjectSpaceCustomRole,
      addSpaceResources,
      removeSpaceResource,
      moveSpaceResource,
      removeSpaceMember,
      deleteTeamSpace,
      isProjectSpaceExpired,
      activateProjectSpace,
      zoneFormOpen,
      editingZone,
      openCreateZoneForm,
      openEditZoneForm,
      closeZoneForm,
      submitZoneForm,
      updateZoneMember,
      addZoneMembers,
      removeZoneMember,
      deleteZone,
    }),
    [
      navigate,
      spaces,
      searchQuery,
      sharedSpace,
      sharedSpaces,
      teamSpaces,
      personalSpaces,
      sharedSpaceVisible,
      getSpace,
      getZone,
      localizeName,
      localizeDescription,
      localizeZoneTitle,
      localizeZoneDesc,
      localizeMember,
      localizeMemberDept,
      formOpen,
      formSpaceKind,
      editingSpace,
      copySourceOptions,
      openCreateForm,
      openEditForm,
      closeForm,
      submitForm,
      updateSpaceInfo,
      updateSpaceMember,
      addSpaceMembers,
      projectSpaceRolesStore,
      addProjectSpaceCustomRole,
      updateProjectSpaceCustomRole,
      updateProjectSpaceBuiltinRolePermissions,
      removeProjectSpaceCustomRole,
      addSpaceResources,
      removeSpaceResource,
      moveSpaceResource,
      removeSpaceMember,
      deleteTeamSpace,
      isProjectSpaceExpired,
      activateProjectSpace,
      zoneFormOpen,
      editingZone,
      openCreateZoneForm,
      openEditZoneForm,
      closeZoneForm,
      submitZoneForm,
      updateZoneMember,
      addZoneMembers,
      removeZoneMember,
      deleteZone,
    ],
  )

  return (
    <TeamCollaborationSpaceContext.Provider value={value}>
      {children}
      <TcsSuccessToast
        locale={locale}
        open={createSuccessToastOpen}
        titleKey={successToastTitleKey}
        subKey={successToastSubKey}
      />
    </TeamCollaborationSpaceContext.Provider>
  )
}

export function useTeamCollaborationSpaceStore(): TeamCollaborationSpaceContextValue {
  const ctx = useContext(TeamCollaborationSpaceContext)
  if (!ctx) throw new Error('useTeamCollaborationSpaceStore must be used within TeamCollaborationSpaceProvider')
  return ctx
}
