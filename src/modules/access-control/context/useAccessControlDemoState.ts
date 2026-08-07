import { useCallback, useMemo, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { type AddUserPayload } from '../components/AddUserModal'
import { type CreateNewUserPayload } from '../components/CreateNewUserModal'
import type { SpaceFormDraft } from '../../team-collaboration-space/types'
import { type RoleFormSavePayload } from '../components/EditRoleModal'
import { WORKSPACE_ROLE_ROWS, type WorkspaceRoleRow } from '../components/RolesPanel'
import { buildCatalogGrantsByRoleId, buildInitialCatalogGrantsForRole, getAllCatalogGrantIds } from '../data/rolePermissionsCatalog'
import { writeCatalogGrantsByRoleId, readCatalogGrantsSnapshot } from '../../../auth/roleCatalogGrantsStorage'
import {
  ORG_MEMBERS_CATALOG,
  getWorkspaceOptionById,
  localizeWorkspaceOption,
  resolveMemberWorkspaceLabel,
} from '../data/orgMembersCatalog'
import {
  isDeletableWorkspace,
  isWorkspaceLockedMember,
  WORKSPACE_ROWS,
  type WorkspaceRow,
} from '../data/workspacesSeed'
import { createWorkspaceRowFromFormDraft } from '../utils/createWorkspaceFromFormDraft'
import { detectRolePreset, permissionsForPreset } from '../data/permissions'
import { readLoginSession } from '../../../auth/session'
import { canActorMutateWorkspaceRole, isBuiltinWorkspaceRole } from '../data/workspaceRoles'
import type { AccessMode, MemberAssignment, OrgMember, RolePreset } from '../types'
import { buildInitialMembersForAccessMode } from '../utils/memberInit'
import { findWorkspaceRoleForMember } from '../utils/memberWorkspaceRole'
import { type RoleDisplayOverride } from '../utils/roleDisplay'
import { resolveMemberStatus, type MockMemberStatus } from '../utils/memberTableDisplay'

export type AddOrgMemberPayload = {
  name: string
  email: string
  departmentZh: string
  departmentEn: string
  phone?: string
  supervisorId?: string | null
  positionZh?: string
  positionEn?: string
  employeeId?: string
  officeLocation?: string
  joinDate?: string
  staffUserId?: string
  notes?: string
  roleId: string
}

export type RolesDrawerState =
  | { type: 'permissions'; role: WorkspaceRoleRow }
  | { type: 'assigned-users'; role: WorkspaceRoleRow }

/** 访问控制演示态：工作区 / 用户 / 角色三个子模块共享的数据与操作 */
export function useAccessControlDemoState() {
  const { locale } = useLocale()
  const [members, setMembers] = useState<MemberAssignment[]>(() =>
    buildInitialMembersForAccessMode('default', null),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [createNewUserOpen, setCreateNewUserOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>(() => [...WORKSPACE_ROWS])
  const [workspaceEditDrawerId, setWorkspaceEditDrawerId] = useState<string | null>(null)
  const [workspaceDrawerAddUserOpen, setWorkspaceDrawerAddUserOpen] = useState(false)
  const [workspaceRemoveConfirmIds, setWorkspaceRemoveConfirmIds] = useState<string[] | null>(null)
  const [workspacePendingRemove, setWorkspacePendingRemove] = useState<WorkspaceRow | null>(null)
  const [workspaceMembersDrawer, setWorkspaceMembersDrawer] = useState<WorkspaceRow | null>(null)
  const [extraOrgMembers, setExtraOrgMembers] = useState<OrgMember[]>([])
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [editMember, setEditMember] = useState<MemberAssignment | null>(null)
  const [editMemberRole, setEditMemberRole] = useState<{ memberId: string; roleId: string } | null>(null)
  const [editMemberInvite, setEditMemberInvite] = useState<{ memberId: string; roleId: string } | null>(null)
  const [memberStatusOverrides, setMemberStatusOverrides] = useState<Record<string, MockMemberStatus>>({})
  const [memberDepartmentOverrides, setMemberDepartmentOverrides] = useState<
    Record<string, { departmentZh: string; departmentEn: string }>
  >({})
  const [memberWorkspaceOverrides, setMemberWorkspaceOverrides] = useState<Record<string, string>>({})
  const [memberPendingRemove, setMemberPendingRemove] = useState<string | null>(null)
  const [removedMemberIds, setRemovedMemberIds] = useState<string[]>([])
  const [editRole, setEditRole] = useState<WorkspaceRoleRow | null>(null)
  const [rolePendingRemove, setRolePendingRemove] = useState<WorkspaceRoleRow | null>(null)
  const [roles, setRoles] = useState<WorkspaceRoleRow[]>(() => [...WORKSPACE_ROLE_ROWS])
  const [rolesDrawer, setRolesDrawer] = useState<RolesDrawerState | null>(null)
  const [roleAssignedUsersAddUserOpen, setRoleAssignedUsersAddUserOpen] = useState(false)
  const [catalogGrantsByRoleId, setCatalogGrantsByRoleId] = useState<Record<string, string[]>>(() => {
    const snapshot = readCatalogGrantsSnapshot()
    const resolved = buildCatalogGrantsByRoleId(
      WORKSPACE_ROLE_ROWS,
      snapshot?.grants ?? null,
      snapshot?.previousCatalogIds,
    )
    const currentCatalogIds = getAllCatalogGrantIds()
    const catalogExpanded =
      !snapshot ||
      snapshot.previousCatalogIds.size === 0 ||
      snapshot.previousCatalogIds.size < currentCatalogIds.length
    const adminNeedsPersist =
      resolved.admin?.length !== currentCatalogIds.length
    const managerDefaults = buildInitialCatalogGrantsForRole(
      WORKSPACE_ROLE_ROWS.find((role) => role.id === 'manager')!,
    )
    const managerNeedsPersist = resolved.manager?.length !== managerDefaults.length
    if (!snapshot || catalogExpanded || adminNeedsPersist || managerNeedsPersist) {
      writeCatalogGrantsByRoleId(resolved)
    }
    return resolved
  })
  const [roleOverridesById, setRoleOverridesById] = useState<Record<string, RoleDisplayOverride>>({})

  const patchCatalogGrants = useCallback((roleId: string, grantedIds: string[]) => {
    setCatalogGrantsByRoleId((prev) => {
      const next = { ...prev, [roleId]: grantedIds }
      writeCatalogGrantsByRoleId(next)
      return next
    })
  }, [])

  const handleSaveCatalogGrants = useCallback(
    (roleId: string, grantedIds: string[]) => {
      const actorRole = readLoginSession()?.role
      if (!canActorMutateWorkspaceRole(actorRole, roleId, actorRole === 'admin')) return
      patchCatalogGrants(roleId, grantedIds)
    },
    [patchCatalogGrants],
  )

  const handleSaveRole = useCallback(
    (roleId: string, payload: RoleFormSavePayload) => {
      const actorRole = readLoginSession()?.role
      if (!canActorMutateWorkspaceRole(actorRole, roleId, actorRole === 'admin')) return
      if (isBuiltinWorkspaceRole(roleId)) {
        patchCatalogGrants(roleId, payload.grantedIds)
        return
      }
      setRoleOverridesById((prev) => ({
        ...prev,
        [roleId]: { label: payload.label, description: payload.description },
      }))
      patchCatalogGrants(roleId, payload.grantedIds)
    },
    [patchCatalogGrants],
  )

  const handleAddRole = useCallback(
    (payload: RoleFormSavePayload) => {
      const roleId = `role-${Date.now()}`
      const newRole: WorkspaceRoleRow = {
        id: roleId,
        label: payload.label,
        descriptionKey: 'roleDescUser',
        catalogProfile: 'user',
        permissions: permissionsForPreset('observer'),
        assignedMemberIds: [],
      }
      setRoles((prev) => [...prev, newRole])
      setRoleOverridesById((prev) => ({
        ...prev,
        [roleId]: { label: payload.label, description: payload.description },
      }))
      patchCatalogGrants(roleId, payload.grantedIds)
    },
    [patchCatalogGrants],
  )

  const handleRequestRemoveRole = useCallback(
    (roleId: string) => {
      if (isBuiltinWorkspaceRole(roleId)) return
      const role = roles.find((item) => item.id === roleId)
      if (role) setRolePendingRemove(role)
    },
    [roles],
  )

  const handleConfirmRemoveRole = useCallback(() => {
    if (!rolePendingRemove) return
    const roleId = rolePendingRemove.id
    setRoles((prev) => prev.filter((role) => role.id !== roleId))
    setCatalogGrantsByRoleId((prev) => {
      const next = { ...prev }
      delete next[roleId]
      return next
    })
    setRoleOverridesById((prev) => {
      const next = { ...prev }
      delete next[roleId]
      return next
    })
    if (editRole?.id === roleId) setEditRole(null)
    if (rolesDrawer?.role.id === roleId) setRolesDrawer(null)
    setRolePendingRemove(null)
  }, [rolePendingRemove, editRole, rolesDrawer])

  const localizeMember = useCallback(
    (member: OrgMember) => (locale === 'zh' ? member.nameZh : member.nameEn),
    [locale],
  )
  const localizeMemberDept = useCallback(
    (member: OrgMember) => {
      const override = memberDepartmentOverrides[member.id]
      if (override) {
        return locale === 'zh' ? override.departmentZh : override.departmentEn
      }
      return locale === 'zh' ? member.departmentZh : member.departmentEn
    },
    [locale, memberDepartmentOverrides],
  )


  const orgMembers = useMemo(
    () => [...ORG_MEMBERS_CATALOG, ...extraOrgMembers],
    [extraOrgMembers],
  )

  const resolveOrgMember = useCallback(
    (memberId: string) => orgMembers.find((member) => member.id === memberId),
    [orgMembers],
  )

  const assignedMemberIds = useMemo(
    () => new Set(roles.flatMap((role) => role.assignedMemberIds)),
    [roles],
  )

  const addCandidates = useMemo(() => {
    return orgMembers.filter((member) => !assignedMemberIds.has(member.id)).slice(0, 50)
  }, [orgMembers, assignedMemberIds])

  const activeWorkspaceEdit = useMemo(
    () =>
      workspaceEditDrawerId
        ? (workspaces.find((workspace) => workspace.id === workspaceEditDrawerId) ?? null)
        : null,
    [workspaceEditDrawerId, workspaces],
  )

  const activeWorkspaceMembers = useMemo(
    () =>
      workspaceMembersDrawer
        ? (workspaces.find((workspace) => workspace.id === workspaceMembersDrawer.id) ??
          workspaceMembersDrawer)
        : null,
    [workspaceMembersDrawer, workspaces],
  )

  const workspaceAddTarget = activeWorkspaceEdit ?? activeWorkspaceMembers

  const workspaceAddCandidates = useMemo(() => {
    if (!workspaceAddTarget) return []
    const inWorkspace = new Set(workspaceAddTarget.members.map((entry) => entry.memberId))
    return orgMembers.filter((member) => !inWorkspace.has(member.id)).slice(0, 50)
  }, [workspaceAddTarget, orgMembers])

  const assignedUsersRole = useMemo(() => {
    if (rolesDrawer?.type !== 'assigned-users') return null
    return roles.find((role) => role.id === rolesDrawer.role.id) ?? rolesDrawer.role
  }, [roles, rolesDrawer])

  const roleAssignedAddCandidates = useMemo(() => {
    if (!assignedUsersRole) return []
    const assigned = new Set(assignedUsersRole.assignedMemberIds)
    return orgMembers.filter((member) => !assigned.has(member.id)).slice(0, 50)
  }, [assignedUsersRole, orgMembers])

  const editInviteCandidates = useMemo(() => {
    if (!activeWorkspaceEdit) return []
    const inWorkspace = new Set(activeWorkspaceEdit.members.map((entry) => entry.memberId))
    return orgMembers
      .filter(
        (member) => !inWorkspace.has(member.id) || member.id === editMemberInvite?.memberId,
      )
      .slice(0, 50)
  }, [activeWorkspaceEdit, editMemberInvite?.memberId, orgMembers])

  const resolveMemberWorkspaceLabelForMember = useCallback(
    (memberId: string) => {
      const overrideId = memberWorkspaceOverrides[memberId]
      if (overrideId) {
        const workspace = getWorkspaceOptionById(overrideId)
        if (workspace) return localizeWorkspaceOption(workspace, locale)
      }
      return resolveMemberWorkspaceLabel(memberId, locale)
    },
    [locale, memberWorkspaceOverrides],
  )

  const handleAddUser = useCallback(
    (payload: AddUserPayload) => {
      const actorRole = readLoginSession()?.role
      if (!canActorMutateWorkspaceRole(actorRole, payload.roleId, actorRole === 'admin')) return
      const role = roles.find((item) => item.id === payload.roleId)
      if (!role) return

      const detectedPreset = detectRolePreset(role.permissions)
      const rolePreset: RolePreset =
        detectedPreset === 'custom' ? 'observer' : detectedPreset

      const validMemberIds = payload.memberIds.filter((id) => resolveOrgMember(id))
      if (validMemberIds.length === 0) return

      setMemberWorkspaceOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of validMemberIds) {
          next[memberId] = payload.workspaceId
        }
        return next
      })
      setMembers((prev) => {
        const existing = new Set(prev.map((item) => item.memberId))
        const additions = validMemberIds
          .filter((memberId) => !existing.has(memberId))
          .map((memberId) => ({
            memberId,
            rolePreset,
            permissions: [...role.permissions],
          }))
        return additions.length > 0 ? [...prev, ...additions] : prev
      })
      setRoles((prev) =>
        prev.map((item) =>
          item.id === payload.roleId
            ? {
                ...item,
                assignedMemberIds: [
                  ...item.assignedMemberIds,
                  ...validMemberIds.filter((id) => !item.assignedMemberIds.includes(id)),
                ],
              }
            : item,
        ),
      )
      setMemberStatusOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of validMemberIds) {
          next[memberId] = 'pending'
        }
        return next
      })
    },
    [roles, resolveOrgMember],
  )

  const handleRemoveUserFromRole = useCallback((roleId: string, memberId: string) => {
    const actorRole = readLoginSession()?.role
    if (!canActorMutateWorkspaceRole(actorRole, roleId, actorRole === 'admin')) return
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              assignedMemberIds: role.assignedMemberIds.filter((id) => id !== memberId),
            }
          : role,
      ),
    )
    setWorkspaces((prev) =>
      prev.map((workspace) => {
        const members = workspace.members.filter(
          (entry) => !(entry.memberId === memberId && entry.roleId === roleId),
        )
        if (members.length === workspace.members.length) return workspace
        return { ...workspace, members, memberCount: members.length }
      }),
    )
  }, [])

  const handleAddUserToWorkspace = useCallback(
    (payload: AddUserPayload) => {
      handleAddUser(payload)
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== payload.workspaceId) return workspace
          const existing = new Set(workspace.members.map((entry) => entry.memberId))
          const additions = payload.memberIds
            .filter((memberId) => !existing.has(memberId))
            .map((memberId) => ({ memberId, roleId: payload.roleId }))
          if (additions.length === 0) return workspace
          const members = [...workspace.members, ...additions]
          return { ...workspace, members, memberCount: members.length }
        }),
      )
    },
    [handleAddUser],
  )

  const handleSaveEditInvite = useCallback(
    (previousMemberId: string, payload: AddUserPayload) => {
      if (!activeWorkspaceEdit) return
      const role = roles.find((item) => item.id === payload.roleId)
      if (!role) return

      const validMemberIds = payload.memberIds.filter((id) => resolveOrgMember(id))
      if (validMemberIds.length === 0) return

      const previousRoleId =
        activeWorkspaceEdit.members.find((entry) => entry.memberId === previousMemberId)?.roleId ?? ''

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== payload.workspaceId) return workspace
          const withoutPrevious = workspace.members.filter(
            (entry) => entry.memberId !== previousMemberId,
          )
          const memberMap = new Map(withoutPrevious.map((entry) => [entry.memberId, entry]))
          for (const memberId of validMemberIds) {
            memberMap.set(memberId, { memberId, roleId: payload.roleId })
          }
          const members = Array.from(memberMap.values())
          return { ...workspace, members, memberCount: members.length }
        }),
      )

      const detectedPreset = detectRolePreset(role.permissions)
      const rolePreset: RolePreset = detectedPreset === 'custom' ? 'observer' : detectedPreset

      setMemberWorkspaceOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of validMemberIds) {
          next[memberId] = payload.workspaceId
        }
        return next
      })

      setMembers((prev) => {
        const existing = new Set(prev.map((item) => item.memberId))
        const updated = prev.map((member) =>
          validMemberIds.includes(member.memberId)
            ? { memberId: member.memberId, rolePreset, permissions: [...role.permissions] }
            : member,
        )
        const additions = validMemberIds
          .filter((memberId) => !existing.has(memberId))
          .map((memberId) => ({
            memberId,
            rolePreset,
            permissions: [...role.permissions],
          }))
        return additions.length > 0 ? [...updated, ...additions] : updated
      })

      setRoles((prev) =>
        prev.map((item) => {
          let assignedMemberIds = [...item.assignedMemberIds]
          if (
            assignedMemberIds.includes(previousMemberId) &&
            !validMemberIds.includes(previousMemberId)
          ) {
            assignedMemberIds = assignedMemberIds.filter((id) => id !== previousMemberId)
          }
          if (previousRoleId && item.id === previousRoleId && previousRoleId !== payload.roleId) {
            assignedMemberIds = assignedMemberIds.filter((id) => !validMemberIds.includes(id))
          }
          if (item.id === payload.roleId) {
            for (const memberId of validMemberIds) {
              if (!assignedMemberIds.includes(memberId)) {
                assignedMemberIds = [...assignedMemberIds, memberId]
              }
            }
          }
          return { ...item, assignedMemberIds }
        }),
      )

      setMemberStatusOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of validMemberIds) {
          next[memberId] = 'pending'
        }
        return next
      })
    },
    [activeWorkspaceEdit, resolveOrgMember, roles],
  )

  const handleRemoveUsersFromWorkspace = useCallback(
    (memberIds: string[]) => {
      if (!activeWorkspaceEdit || memberIds.length === 0) return
      const viewerIsAdmin = readLoginSession()?.role === 'admin'
      const removeSet = new Set(
        memberIds.filter((memberId) => {
          const entry = activeWorkspaceEdit.members.find((item) => item.memberId === memberId)
          if (!entry) return false
          if (!viewerIsAdmin && isWorkspaceLockedMember(entry)) return false
          return true
        }),
      )
      if (removeSet.size === 0) return
      const removedEntries = activeWorkspaceEdit.members.filter((entry) =>
        removeSet.has(entry.memberId),
      )

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceEdit.id) return workspace
          const members = workspace.members.filter((entry) => !removeSet.has(entry.memberId))
          return { ...workspace, members, memberCount: members.length }
        }),
      )

      setRoles((prev) =>
        prev.map((role) => {
          const removedFromRole = removedEntries.some((entry) => entry.roleId === role.id)
          if (!removedFromRole) return role
          return {
            ...role,
            assignedMemberIds: role.assignedMemberIds.filter((id) => !removeSet.has(id)),
          }
        }),
      )
    },
    [activeWorkspaceEdit],
  )

  const handleCreateSpace = useCallback(
    (draft: SpaceFormDraft, copySourceOptions: Parameters<typeof createWorkspaceRowFromFormDraft>[1]) => {
      setWorkspaces((prev) => [...prev, createWorkspaceRowFromFormDraft(draft, copySourceOptions)])
    },
    [],
  )

  const handleUpdateWorkspaceAccessMode = useCallback((workspaceId: string, accessMode: AccessMode) => {
    if (workspaceId === 'default') return
    setWorkspaces((prev) =>
      prev.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, accessMode } : workspace,
      ),
    )
  }, [])

  const handleRequestRemoveWorkspace = useCallback((workspace: WorkspaceRow) => {
    if (!isDeletableWorkspace(workspace)) return
    setWorkspacePendingRemove(workspace)
  }, [])

  const handleConfirmRemoveWorkspace = useCallback(() => {
    if (!workspacePendingRemove) return
    const workspaceId = workspacePendingRemove.id
    const deletedMemberIds = workspacePendingRemove.members.map((entry) => entry.memberId)
    const remaining = workspaces.filter((workspace) => workspace.id !== workspaceId)
    const stillAssigned = new Set(
      remaining.flatMap((workspace) => workspace.members.map((entry) => entry.memberId)),
    )
    const orphanIds = deletedMemberIds.filter((memberId) => !stillAssigned.has(memberId))
    const orphanSet = new Set(orphanIds)

    setWorkspaces(remaining)

    if (workspaceEditDrawerId === workspaceId) {
      setWorkspaceEditDrawerId(null)
      setWorkspaceDrawerAddUserOpen(false)
      setWorkspaceRemoveConfirmIds(null)
      setEditMemberRole(null)
      setEditMemberInvite(null)
      setEditMember(null)
    }
    if (workspaceMembersDrawer?.id === workspaceId) {
      setWorkspaceMembersDrawer(null)
      setWorkspaceDrawerAddUserOpen(false)
    }

    if (orphanSet.size > 0) {
      setRoles((prev) =>
        prev.map((role) => ({
          ...role,
          assignedMemberIds: role.assignedMemberIds.filter((id) => !orphanSet.has(id)),
        })),
      )
      setMembers((prev) => prev.filter((member) => !orphanSet.has(member.memberId)))
      setMemberWorkspaceOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of orphanIds) {
          if (next[memberId] === workspaceId) delete next[memberId]
        }
        return next
      })
    }

    setWorkspacePendingRemove(null)
  }, [
    workspacePendingRemove,
    workspaces,
    workspaceEditDrawerId,
    workspaceMembersDrawer,
  ])

  const handleOpenWorkspaceEditDrawer = useCallback((workspace: WorkspaceRow) => {
    setWorkspaceMembersDrawer(null)
    setWorkspaceDrawerAddUserOpen(false)
    setWorkspaceEditDrawerId(workspace.id)
  }, [])

  const handleOpenWorkspaceMembersDrawer = useCallback((workspace: WorkspaceRow) => {
    setWorkspaceEditDrawerId(null)
    setWorkspaceDrawerAddUserOpen(false)
    setWorkspaceMembersDrawer(workspace)
  }, [])

  const handleCreateNewUser = useCallback(
    (payload: CreateNewUserPayload) => {
      const workspace = getWorkspaceOptionById(payload.workspaceId)
      const role = roles.find((item) => item.id === payload.roleId)
      if (!workspace || !role) return

      const memberId = `member-new-${Date.now()}`
      const newMember: OrgMember = {
        id: memberId,
        nameZh: payload.name,
        nameEn: payload.name,
        email: payload.email,
        departmentZh: workspace.departmentZh,
        departmentEn: workspace.departmentEn,
      }

      const detectedPreset = detectRolePreset(role.permissions)
      const rolePreset: RolePreset =
        detectedPreset === 'custom' ? 'observer' : detectedPreset

      setExtraOrgMembers((prev) => [...prev, newMember])
      setMemberWorkspaceOverrides((prev) => ({ ...prev, [memberId]: payload.workspaceId }))
      setMembers((prev) => [
        ...prev,
        {
          memberId,
          rolePreset,
          permissions: [...role.permissions],
        },
      ])
      setRoles((prev) =>
        prev.map((item) =>
          item.id === payload.roleId
            ? {
                ...item,
                assignedMemberIds: item.assignedMemberIds.includes(memberId)
                  ? item.assignedMemberIds
                  : [...item.assignedMemberIds, memberId],
              }
            : item,
        ),
      )
      setMemberStatusOverrides((prev) => ({ ...prev, [memberId]: 'pending' }))
    },
    [roles],
  )

  const handleAddOrgMember = useCallback(
    (payload: AddOrgMemberPayload) => {
      const role = roles.find((item) => item.id === payload.roleId)
      if (!role) return null

      const memberId = `member-dept-${Date.now()}`
      const newMember: OrgMember = {
        id: memberId,
        nameZh: payload.name,
        nameEn: payload.name,
        email: payload.email,
        departmentZh: payload.departmentZh,
        departmentEn: payload.departmentEn,
        phone: payload.phone || undefined,
        supervisorId: payload.supervisorId || undefined,
        employeeId: payload.employeeId || undefined,
        positionZh: payload.positionZh || undefined,
        positionEn: payload.positionEn || undefined,
        officeLocation: payload.officeLocation || undefined,
        joinDate: payload.joinDate || undefined,
        staffUserId: payload.staffUserId || undefined,
        notes: payload.notes || undefined,
      }

      const detectedPreset = detectRolePreset(role.permissions)
      const rolePreset: RolePreset =
        detectedPreset === 'custom' ? 'observer' : detectedPreset

      setExtraOrgMembers((prev) => [...prev, newMember])
      setMembers((prev) => [
        ...prev,
        {
          memberId,
          rolePreset,
          permissions: [...role.permissions],
        },
      ])
      setRoles((prev) =>
        prev.map((item) =>
          item.id === payload.roleId
            ? {
                ...item,
                assignedMemberIds: item.assignedMemberIds.includes(memberId)
                  ? item.assignedMemberIds
                  : [...item.assignedMemberIds, memberId],
              }
            : item,
        ),
      )
      setMemberStatusOverrides((prev) => ({ ...prev, [memberId]: 'active' }))
      return memberId
    },
    [roles],
  )

  const editingMemberOrg = editMember ? resolveOrgMember(editMember.memberId) : null
  const editingMemberRole = editMember
    ? findWorkspaceRoleForMember(editMember.memberId, roles)
    : null
  const editingMemberStatus = editMember
    ? resolveMemberStatus(editMember.memberId, memberStatusOverrides)
    : 'active'

  const handleSaveMemberStatus = useCallback((memberId: string, status: MockMemberStatus) => {
    setMemberStatusOverrides((prev) => ({ ...prev, [memberId]: status }))
  }, [])

  const handleBatchEnableMembers = useCallback(
    (memberIds: string[]) => {
      const toActivate = memberIds.filter(
        (memberId) => resolveMemberStatus(memberId, memberStatusOverrides) === 'pending',
      )
      if (toActivate.length === 0) return 0
      setMemberStatusOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of toActivate) {
          next[memberId] = 'active'
        }
        return next
      })
      return toActivate.length
    },
    [memberStatusOverrides],
  )

  const handleBatchDisableMembers = useCallback(
    (memberIds: string[]) => {
      const toDisable = memberIds.filter(
        (memberId) => resolveMemberStatus(memberId, memberStatusOverrides) === 'active',
      )
      if (toDisable.length === 0) return 0
      setMemberStatusOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of toDisable) {
          next[memberId] = 'inactive'
        }
        return next
      })
      return toDisable.length
    },
    [memberStatusOverrides],
  )

  const handleBatchAdjustMemberDepartments = useCallback(
    (memberIds: string[], departmentZh: string, departmentEn: string) => {
      if (memberIds.length === 0) return
      const override = { departmentZh, departmentEn }
      setMemberDepartmentOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of memberIds) {
          next[memberId] = override
        }
        return next
      })
      setExtraOrgMembers((prev) =>
        prev.map((member) =>
          memberIds.includes(member.id)
            ? { ...member, departmentZh, departmentEn }
            : member,
        ),
      )
    },
    [],
  )

  const handleSaveMemberRole = useCallback(
    (payload: { memberId: string; roleId: string; previousRoleId: string }) => {
      if (!activeWorkspaceEdit) return
      const entry = activeWorkspaceEdit.members.find((item) => item.memberId === payload.memberId)
      const viewerIsAdmin = readLoginSession()?.role === 'admin'
      if (entry && !viewerIsAdmin && isWorkspaceLockedMember(entry)) return
      const role = roles.find((item) => item.id === payload.roleId)
      if (!role) return

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceEdit.id) return workspace
          return {
            ...workspace,
            members: workspace.members.map((entry) =>
              entry.memberId === payload.memberId ? { ...entry, roleId: payload.roleId } : entry,
            ),
          }
        }),
      )

      setRoles((prev) =>
        prev.map((item) => {
          if (item.id === payload.previousRoleId) {
            return {
              ...item,
              assignedMemberIds: item.assignedMemberIds.filter((id) => id !== payload.memberId),
            }
          }
          if (item.id === payload.roleId) {
            return {
              ...item,
              assignedMemberIds: item.assignedMemberIds.includes(payload.memberId)
                ? item.assignedMemberIds
                : [...item.assignedMemberIds, payload.memberId],
            }
          }
          return item
        }),
      )

      const detectedPreset = detectRolePreset(role.permissions)
      const rolePreset: RolePreset = detectedPreset === 'custom' ? 'observer' : detectedPreset

      setMembers((prev) =>
        prev.map((member) =>
          member.memberId === payload.memberId
            ? { memberId: payload.memberId, rolePreset, permissions: [...role.permissions] }
            : member,
        ),
      )
    },
    [activeWorkspaceEdit, roles],
  )

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((member) => member.memberId !== memberId))
    setExtraOrgMembers((prev) => prev.filter((member) => member.id !== memberId))
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        assignedMemberIds: role.assignedMemberIds.filter((id) => id !== memberId),
      })),
    )
    setRemovedMemberIds((prev) => (prev.includes(memberId) ? prev : [...prev, memberId]))
    setMemberStatusOverrides((prev) => {
      if (!prev[memberId]) return prev
      const next = { ...prev }
      delete next[memberId]
      return next
    })
  }

  const handleBatchRemoveMembers = useCallback((memberIds: string[]) => {
    const uniqueIds = [...new Set(memberIds)]
    if (uniqueIds.length === 0) return 0

    const removeSet = new Set(uniqueIds)
    setMembers((prev) => prev.filter((member) => !removeSet.has(member.memberId)))
    setExtraOrgMembers((prev) => prev.filter((member) => !removeSet.has(member.id)))
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        assignedMemberIds: role.assignedMemberIds.filter((id) => !removeSet.has(id)),
      })),
    )
    setRemovedMemberIds((prev) => [...new Set([...prev, ...uniqueIds])])
    setMemberStatusOverrides((prev) => {
      const hasOverride = uniqueIds.some((id) => prev[id] != null)
      if (!hasOverride) return prev
      const next = { ...prev }
      for (const memberId of uniqueIds) {
        delete next[memberId]
      }
      return next
    })
    return uniqueIds.length
  }, [])

  const handleRequestRemoveMember = useCallback((memberId: string) => {
    setMemberPendingRemove(memberId)
  }, [])

  const handleConfirmRemoveMember = useCallback(() => {
    if (!memberPendingRemove) return
    handleRemoveMember(memberPendingRemove)
    setMemberPendingRemove(null)
  }, [memberPendingRemove])

  const pendingRemoveMemberOrg = memberPendingRemove ? resolveOrgMember(memberPendingRemove) : null

  const editingMemberRoleOrg = editMemberRole ? resolveOrgMember(editMemberRole.memberId) : null

  return {
    locale,
    members,
    searchQuery,
    setSearchQuery,
    createNewUserOpen,
    setCreateNewUserOpen,
    inviteOpen,
    setInviteOpen,
    workspaces,
    workspaceEditDrawerId,
    setWorkspaceEditDrawerId,
    workspaceDrawerAddUserOpen,
    setWorkspaceDrawerAddUserOpen,
    workspaceRemoveConfirmIds,
    setWorkspaceRemoveConfirmIds,
    workspacePendingRemove,
    setWorkspacePendingRemove,
    workspaceMembersDrawer,
    setWorkspaceMembersDrawer,
    addRoleOpen,
    setAddRoleOpen,
    editMember,
    setEditMember,
    editMemberRole,
    setEditMemberRole,
    editMemberInvite,
    setEditMemberInvite,
    memberStatusOverrides,
    memberPendingRemove,
    setMemberPendingRemove,
    removedMemberIds,
    editRole,
    setEditRole,
    rolePendingRemove,
    setRolePendingRemove,
    roles,
    rolesDrawer,
    setRolesDrawer,
    roleAssignedUsersAddUserOpen,
    setRoleAssignedUsersAddUserOpen,
    catalogGrantsByRoleId,
    roleOverridesById,
    orgMembers,
    addCandidates,
    activeWorkspaceEdit,
    activeWorkspaceMembers,
    workspaceAddCandidates,
    assignedUsersRole,
    roleAssignedAddCandidates,
    editInviteCandidates,
    localizeMember,
    localizeMemberDept,
    resolveMemberWorkspaceLabelForMember,
    handleSaveCatalogGrants,
    handleSaveRole,
    handleAddRole,
    handleRequestRemoveRole,
    handleConfirmRemoveRole,
    handleAddUser,
    handleRemoveUserFromRole,
    handleAddUserToWorkspace,
    handleSaveEditInvite,
    handleRemoveUsersFromWorkspace,
    handleCreateSpace,
    handleUpdateWorkspaceAccessMode,
    handleRequestRemoveWorkspace,
    handleConfirmRemoveWorkspace,
    handleOpenWorkspaceEditDrawer,
    handleOpenWorkspaceMembersDrawer,
    handleCreateNewUser,
    handleAddOrgMember,
    editingMemberOrg,
    editingMemberRole,
    editingMemberStatus,
    handleSaveMemberStatus,
    handleBatchEnableMembers,
    handleBatchDisableMembers,
    handleSaveMemberRole,
    handleRequestRemoveMember,
    handleConfirmRemoveMember,
    handleBatchRemoveMembers,
    handleBatchAdjustMemberDepartments,
    pendingRemoveMemberOrg,
    editingMemberRoleOrg,
  }
}
