import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAccessControlDemo } from '../../context/AccessControlDemoProvider'
import { assignmentFromPreset } from '../../data/permissions'
import type {
  AddDepartmentMemberPayload,
  AddDepartmentMembersByStructurePayload,
} from '../components/AddDepartmentMemberModal'
import {
  ORG_DEPARTMENT_ROWS,
  ORG_ROOT_PARENT_ID,
  type OrgDepartmentRow,
} from '../../departments-management/data/departmentsSeed'
import type {
  DepartmentEditSavePayload,
  DepartmentFormSavePayload,
} from '../../departments-management/hooks/useDepartmentsSectionController'
import {
  buildDepartmentMemberIdMap,
  buildDepartmentTreeMemberCounts,
} from '../../departments-management/utils/countDepartmentMembers'
import { resolveRoleLabel } from '../../utils/roleDisplay'
import {
  findOrgDepartmentById,
  collectOrderedOrgDepartmentSubtreeMemberIds,
  getDefaultSelectableOrgDepartmentId,
  getOrgDepartmentChildren,
  getOrgDepartmentRoots,
  isOrgDepartmentVisibleInFilter,
} from '../utils/orgDepartmentTree'
import {
  filterOutDepartmentManagers,
  getDefaultDepartmentManagerMap,
  getDepartmentManagerMemberId,
  isDepartmentManagerMember,
} from '../utils/departmentManager'
import { getOrgMemberById } from '../../data/orgMembersCatalog'

/**
 * 成员管理子模块控制器：聚合演示态中的成员数据与操作，供成员管理 UI 独占使用。
 * 其他访问控制子模块不依赖此 hook。
 */
export function useMembersSectionController() {
  const demo = useAccessControlDemo()
  const [membersSearchQuery, setMembersSearchQuery] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    () => getDefaultSelectableOrgDepartmentId(ORG_DEPARTMENT_ROWS),
  )
  const [orgDepartments, setOrgDepartments] = useState<OrgDepartmentRow[]>(
    () => [...ORG_DEPARTMENT_ROWS],
  )

  const {
    locale,
    members,
    orgMembers,
    roles,
    roleOverridesById,
    memberStatusOverrides,
    removedMemberIds,
    createNewUserOpen,
    setCreateNewUserOpen,
    editMember,
    setEditMember,
    memberPendingRemove,
    setMemberPendingRemove,
    localizeMember,
    localizeMemberDept,
    handleCreateNewUser,
    handleAddOrgMember,
    handleRequestRemoveMember,
    handleConfirmRemoveMember,
    handleSaveMemberStatus,
    handleBatchEnableMembers,
    handleBatchDisableMembers,
    handleBatchRemoveMembers: demoBatchRemoveMembers,
    handleBatchAdjustMemberDepartments: demoBatchAdjustMemberDepartments,
    editingMemberOrg,
    editingMemberRole,
    editingMemberStatus,
    resolveMemberWorkspaceLabelForMember,
    pendingRemoveMemberOrg,
  } = demo

  const demoMemberById = useMemo(
    () => new Map(members.map((member) => [member.memberId, member])),
    [members],
  )

  const [manualDepartmentMemberIds, setManualDepartmentMemberIds] = useState<
    Record<string, string[]>
  >({})
  const [pinnedMemberIds, setPinnedMemberIds] = useState<string[]>([])
  const [memberDepartmentIdOverrides, setMemberDepartmentIdOverrides] = useState<
    Record<string, string>
  >({})
  const [departmentManagerByDeptId, setDepartmentManagerByDeptId] = useState<Record<string, string>>(
    () => getDefaultDepartmentManagerMap(),
  )
  const [transferDepartmentManagerOpen, setTransferDepartmentManagerOpen] = useState(false)
  const [departmentManagerTransferHint, setDepartmentManagerTransferHint] = useState<string | null>(
    null,
  )

  const departmentDisplayMemberCountById = useMemo(() => {
    const display = buildDepartmentTreeMemberCounts(orgDepartments)
    const manualEntries = Object.entries(manualDepartmentMemberIds)
    if (manualEntries.length === 0) return display

    for (const [deptId, ids] of manualEntries) {
      display.set(deptId, (display.get(deptId) ?? 0) + ids.length)
    }

    const childrenByParentId = new Map<string, OrgDepartmentRow[]>()
    for (const department of orgDepartments) {
      if (!department.parentId) continue
      const siblings = childrenByParentId.get(department.parentId) ?? []
      siblings.push(department)
      childrenByParentId.set(department.parentId, siblings)
    }

    function subtreeSum(departmentId: string): number {
      const children = childrenByParentId.get(departmentId)
      if (!children || children.length === 0) return display.get(departmentId) ?? 0
      return children.reduce((sum, child) => sum + subtreeSum(child.id), 0)
    }

    for (const department of orgDepartments) {
      if (childrenByParentId.get(department.id)?.length) {
        display.set(department.id, subtreeSum(department.id))
      }
    }

    return display
  }, [orgDepartments, manualDepartmentMemberIds])

  const departmentMemberIdsByDepartmentId = useMemo(() => {
    const base = buildDepartmentMemberIdMap(orgDepartments)
    const merged = new Map(base)

    for (const [deptId, ids] of Object.entries(manualDepartmentMemberIds)) {
      const existing = merged.get(deptId) ?? []
      const newIds = ids.filter((id) => !existing.includes(id))
      if (newIds.length > 0) {
        merged.set(deptId, [...newIds, ...existing])
      }
    }

    const overrideEntries = Object.entries(memberDepartmentIdOverrides)
    if (overrideEntries.length > 0) {
      for (const [deptId, ids] of merged.entries()) {
        merged.set(
          deptId,
          ids.filter((memberId) => !memberDepartmentIdOverrides[memberId]),
        )
      }
      for (const [memberId, targetDeptId] of overrideEntries) {
        const existing = merged.get(targetDeptId) ?? []
        if (!existing.includes(memberId)) {
          merged.set(targetDeptId, [memberId, ...existing])
        }
      }
    }

    return merged
  }, [orgDepartments, manualDepartmentMemberIds, memberDepartmentIdOverrides])

  const totalOrgMemberCount = useMemo(() => {
    const removedSet = new Set(removedMemberIds)
    const allIds = new Set<string>()
    for (const ids of departmentMemberIdsByDepartmentId.values()) {
      for (const memberId of ids) {
        if (!removedSet.has(memberId)) allIds.add(memberId)
      }
    }
    return allIds.size
  }, [departmentMemberIdsByDepartmentId, removedMemberIds])

  const orgDepartmentRoots = useMemo(() => getOrgDepartmentRoots(orgDepartments), [orgDepartments])

  const filteredOrgDepartmentRoots = useMemo(() => {
    const query = membersSearchQuery.trim().toLowerCase()
    if (!query) return orgDepartmentRoots

    return orgDepartmentRoots.filter((root) => {
      if (
        isOrgDepartmentVisibleInFilter(
          root,
          query,
          locale,
          departmentMemberIdsByDepartmentId,
          orgMembers,
          localizeMember,
          localizeMemberDept,
        )
      ) {
        return true
      }

      return getOrgDepartmentChildren(orgDepartments, root.id, locale).some((child) =>
        isOrgDepartmentVisibleInFilter(
          child,
          query,
          locale,
          departmentMemberIdsByDepartmentId,
          orgMembers,
          localizeMember,
          localizeMemberDept,
        ),
      )
    })
  }, [
    departmentMemberIdsByDepartmentId,
    locale,
    localizeMember,
    localizeMemberDept,
    membersSearchQuery,
    orgDepartmentRoots,
    orgDepartments,
    orgMembers,
  ])

  const isDepartmentIdVisible = useCallback(
    (departmentId: string) => {
      const department = findOrgDepartmentById(orgDepartments, departmentId)
      if (!department) return false

      const query = membersSearchQuery.trim().toLowerCase()
      if (!query) return true

      if (
        isOrgDepartmentVisibleInFilter(
          department,
          query,
          locale,
          departmentMemberIdsByDepartmentId,
          orgMembers,
          localizeMember,
          localizeMemberDept,
        )
      ) {
        return true
      }

      if (!department.parentId) {
        return getOrgDepartmentChildren(orgDepartments, department.id, locale).some((child) =>
          isOrgDepartmentVisibleInFilter(
            child,
            query,
            locale,
            departmentMemberIdsByDepartmentId,
            orgMembers,
            localizeMember,
            localizeMemberDept,
          ),
        )
      }

      return false
    },
    [
      departmentMemberIdsByDepartmentId,
      locale,
      localizeMember,
      localizeMemberDept,
      membersSearchQuery,
      orgDepartments,
      orgMembers,
    ],
  )

  useEffect(() => {
    if (selectedDepartmentId === ORG_ROOT_PARENT_ID) return
    if (filteredOrgDepartmentRoots.length === 0) return
    if (isDepartmentIdVisible(selectedDepartmentId)) return

    const firstRoot = filteredOrgDepartmentRoots[0]
    const children = getOrgDepartmentChildren(orgDepartments, firstRoot.id, locale)
    const fallbackId =
      isDepartmentIdVisible(firstRoot.id)
        ? firstRoot.id
        : children.find((child) => isDepartmentIdVisible(child.id))?.id ??
          getDefaultSelectableOrgDepartmentId(orgDepartments)

    setSelectedDepartmentId(fallbackId)
  }, [filteredOrgDepartmentRoots, isDepartmentIdVisible, locale, orgDepartments, selectedDepartmentId])

  const isOrgRootSelected = selectedDepartmentId === ORG_ROOT_PARENT_ID

  const selectedDepartment = useMemo(() => {
    if (isOrgRootSelected) return null
    return findOrgDepartmentById(orgDepartments, selectedDepartmentId) ?? null
  }, [isOrgRootSelected, orgDepartments, selectedDepartmentId])

  const departmentManagerMemberId = useMemo(() => {
    if (isOrgRootSelected) return null
    return getDepartmentManagerMemberId(selectedDepartment?.id, departmentManagerByDeptId)
  }, [departmentManagerByDeptId, isOrgRootSelected, selectedDepartment?.id])

  const membersForOrgRoot = useMemo(() => {
    const removedSet = new Set(removedMemberIds)
    const allIds = new Set<string>()
    for (const ids of departmentMemberIdsByDepartmentId.values()) {
      for (const memberId of ids) {
        if (!removedSet.has(memberId)) allIds.add(memberId)
      }
    }
    return [...allIds].map((memberId) => {
      const existing = demoMemberById.get(memberId)
      return existing ?? assignmentFromPreset(memberId, 'observer')
    })
  }, [departmentMemberIdsByDepartmentId, demoMemberById, removedMemberIds])

  const membersForSelectedDepartment = useMemo(() => {
    if (!selectedDepartment) return []
    const removedSet = new Set(removedMemberIds)
    const orderedMemberIds = collectOrderedOrgDepartmentSubtreeMemberIds(
      orgDepartments,
      selectedDepartment.id,
      departmentMemberIdsByDepartmentId,
    ).filter((memberId) => !removedSet.has(memberId))
    const managerId = getDepartmentManagerMemberId(selectedDepartment.id, departmentManagerByDeptId)
    const sortedMemberIds = [...orderedMemberIds].sort((memberIdA, memberIdB) => {
      if (managerId) {
        if (memberIdA === managerId) return -1
        if (memberIdB === managerId) return 1
      }
      const pinnedIndexA = pinnedMemberIds.indexOf(memberIdA)
      const pinnedIndexB = pinnedMemberIds.indexOf(memberIdB)
      if (pinnedIndexA !== -1 && pinnedIndexB !== -1) return pinnedIndexA - pinnedIndexB
      if (pinnedIndexA !== -1) return -1
      if (pinnedIndexB !== -1) return 1
      return orderedMemberIds.indexOf(memberIdA) - orderedMemberIds.indexOf(memberIdB)
    })
    return sortedMemberIds.map((memberId) => {
      const existing = demoMemberById.get(memberId)
      return existing ?? assignmentFromPreset(memberId, 'observer')
    })
  }, [
    departmentMemberIdsByDepartmentId,
    demoMemberById,
    orgDepartments,
    pinnedMemberIds,
    removedMemberIds,
    selectedDepartment,
    departmentManagerByDeptId,
  ])

  const membersForSelectedScope = isOrgRootSelected
    ? membersForOrgRoot
    : membersForSelectedDepartment

  const editingMemberRoleLabel = useMemo(
    () =>
      editingMemberRole
        ? resolveRoleLabel(editingMemberRole, roleOverridesById[editingMemberRole.id])
        : '',
    [editingMemberRole, roleOverridesById],
  )

  const handleSelectDepartment = useCallback((departmentId: string) => {
    setSelectedDepartmentId(departmentId)
  }, [])

  const [editDepartment, setEditDepartment] = useState<OrgDepartmentRow | null>(null)
  const [addChildParent, setAddChildParent] = useState<OrgDepartmentRow | null>(null)
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false)
  const [addDepartmentMemberOpen, setAddDepartmentMemberOpen] = useState(false)
  const [inviteDepartmentMembersOpen, setInviteDepartmentMembersOpen] = useState(false)
  const [thirdPartyImportOpen, setThirdPartyImportOpen] = useState(false)
  const [batchCreateDepartmentsOpen, setBatchCreateDepartmentsOpen] = useState(false)
  const [expandDepartmentIds, setExpandDepartmentIds] = useState<string[]>([])
  const [pendingRemoveDepartment, setPendingRemoveDepartment] = useState<OrgDepartmentRow | null>(
    null,
  )

  const handleEditDepartment = useCallback((department: OrgDepartmentRow) => {
    setEditDepartment(department)
  }, [])

  const handleSaveDepartment = useCallback(
    (departmentId: string, payload: DepartmentEditSavePayload) => {
      setOrgDepartments((prev) =>
        prev.map((item) =>
          item.id === departmentId
            ? {
                ...item,
                nameZh: payload.nameZh,
                nameEn: payload.nameEn,
                parentId: payload.parentId,
                departmentCode: payload.departmentCode,
                departmentType: payload.departmentType,
                descriptionZh: payload.descriptionZh,
                descriptionEn: payload.descriptionEn,
                effectiveDate: payload.effectiveDate,
                supervisorIds: payload.supervisorIds,
                includeHiddenSubDepartments: payload.includeHiddenSubDepartments,
                includeSelfVisibleSubDepartments: payload.includeSelfVisibleSubDepartments,
                includeAssociatedOrgs: payload.includeAssociatedOrgs,
              }
            : item,
        ),
      )
      setEditDepartment(null)
    },
    [],
  )

  const handleAddChildDepartment = useCallback((department: OrgDepartmentRow) => {
    setAddChildParent(department)
  }, [])

  const handleOpenAddDepartment = useCallback(() => {
    setAddDepartmentOpen(true)
  }, [])

  const handleSaveAddDepartment = useCallback((payload: DepartmentFormSavePayload) => {
    const id = `dept-members-${Date.now()}`
    setOrgDepartments((prev) => [
      ...prev,
      {
        id,
        nameZh: payload.nameZh,
        nameEn: payload.nameEn,
        descriptionZh: payload.descriptionZh,
        descriptionEn: payload.descriptionEn,
        parentId: payload.parentId,
        hideDepartment: false,
        restrictAddressBook: false,
        supervisorIds: payload.supervisorIds ?? [],
        includeHiddenSubDepartments: payload.includeHiddenSubDepartments ?? false,
        includeSelfVisibleSubDepartments: payload.includeSelfVisibleSubDepartments ?? false,
        includeAssociatedOrgs: payload.includeAssociatedOrgs ?? false,
        departmentCode: payload.departmentCode ?? '',
        departmentType: payload.departmentType ?? '',
        effectiveDate: payload.effectiveDate ?? '',
        establishedDate: payload.establishedDate ?? '',
        createDepartmentGroup: payload.createDepartmentGroup ?? false,
        isUserCreated: true,
      },
    ])
    setSelectedDepartmentId(id)
    setAddDepartmentOpen(false)
  }, [])

  const handleBatchCreateDepartments = useCallback((payloads: DepartmentFormSavePayload[]) => {
    if (payloads.length === 0) return

    setOrgDepartments((prev) => {
      const next = [...prev]
      const indexByNameZh = new Map(next.map((item, index) => [item.nameZh, index]))

      for (const payload of payloads) {
        const existingIndex = indexByNameZh.get(payload.nameZh)
        if (existingIndex != null) {
          const existing = next[existingIndex]
          next[existingIndex] = {
            ...existing,
            nameEn: payload.nameEn,
            descriptionZh: payload.descriptionZh,
            descriptionEn: payload.descriptionEn,
            parentId: payload.parentId ?? existing.parentId,
          }
          continue
        }

        const id = `dept-members-batch-${Date.now()}-${next.length}`
        next.push({
          id,
          nameZh: payload.nameZh,
          nameEn: payload.nameEn,
          descriptionZh: payload.descriptionZh,
          descriptionEn: payload.descriptionEn,
          parentId: payload.parentId,
          hideDepartment: false,
          restrictAddressBook: false,
          supervisorIds: payload.supervisorIds ?? [],
          includeHiddenSubDepartments: payload.includeHiddenSubDepartments ?? false,
          includeSelfVisibleSubDepartments: payload.includeSelfVisibleSubDepartments ?? false,
          includeAssociatedOrgs: payload.includeAssociatedOrgs ?? false,
          departmentCode: payload.departmentCode ?? '',
          departmentType: payload.departmentType ?? '',
          effectiveDate: payload.effectiveDate ?? '',
          establishedDate: payload.establishedDate ?? '',
          createDepartmentGroup: payload.createDepartmentGroup ?? false,
          isUserCreated: true,
        })
        indexByNameZh.set(payload.nameZh, next.length - 1)
      }

      return next
    })

    setBatchCreateDepartmentsOpen(false)
  }, [])

  const handleSaveAddChildDepartment = useCallback(
    (payload: DepartmentFormSavePayload) => {
      if (!addChildParent) return

      const parentId = addChildParent.id
      const id = `dept-members-${Date.now()}`
      setOrgDepartments((prev) => [
        ...prev,
        {
          id,
          nameZh: payload.nameZh,
          nameEn: payload.nameEn,
          descriptionZh: payload.descriptionZh,
          descriptionEn: payload.descriptionEn,
          parentId,
          hideDepartment: false,
          restrictAddressBook: false,
          supervisorIds: payload.supervisorIds ?? [],
          includeHiddenSubDepartments: payload.includeHiddenSubDepartments ?? false,
          includeSelfVisibleSubDepartments: payload.includeSelfVisibleSubDepartments ?? false,
          includeAssociatedOrgs: payload.includeAssociatedOrgs ?? false,
          departmentCode: payload.departmentCode ?? '',
          departmentType: payload.departmentType ?? '',
          effectiveDate: payload.effectiveDate ?? '',
          establishedDate: payload.establishedDate ?? '',
          createDepartmentGroup: payload.createDepartmentGroup ?? false,
          isUserCreated: true,
        },
      ])

      const expandIds = new Set<string>([parentId])
      let ancestorId = addChildParent.parentId
      while (ancestorId) {
        expandIds.add(ancestorId)
        const ancestor = orgDepartments.find((item) => item.id === ancestorId)
        ancestorId = ancestor?.parentId ?? null
      }
      setExpandDepartmentIds(Array.from(expandIds))
      setAddChildParent(null)
    },
    [addChildParent, orgDepartments],
  )

  const handleOpenAddDepartmentMember = useCallback(() => {
    setAddDepartmentMemberOpen(true)
  }, [])

  const handleOpenInviteDepartmentMembers = useCallback(() => {
    setInviteDepartmentMembersOpen(true)
  }, [])

  const handleSaveDepartmentMember = useCallback(
    (payload: AddDepartmentMemberPayload) => {
      const department = findOrgDepartmentById(orgDepartments, payload.departmentId)
      if (!department) return

      const memberId = handleAddOrgMember({
        name: payload.name,
        email: payload.email,
        departmentZh: department.nameZh,
        departmentEn: department.nameEn,
        phone: payload.phone || undefined,
        supervisorId: payload.supervisorId,
        positionZh: payload.position,
        positionEn: payload.position,
        employeeId: payload.employeeId || undefined,
        officeLocation: payload.officeLocation || undefined,
        joinDate: payload.joinDate || undefined,
        staffUserId: payload.staffUserId || undefined,
        notes: payload.notes || undefined,
        roleId: payload.roleId,
      })
      if (!memberId) return

      setManualDepartmentMemberIds((prev) => {
        const existing = prev[payload.departmentId] ?? []
        if (existing.includes(memberId)) return prev
        return { ...prev, [payload.departmentId]: [memberId, ...existing] }
      })
      setPinnedMemberIds((prev) => [memberId, ...prev.filter((id) => id !== memberId)])
      setAddDepartmentMemberOpen(false)
    },
    [handleAddOrgMember, orgDepartments],
  )

  const handleClearExpandDepartmentIds = useCallback(() => {
    setExpandDepartmentIds([])
  }, [])

  const handleBatchRemoveMembers = useCallback(
    (memberIds: string[]) => {
      const eligibleIds = filterOutDepartmentManagers(
        selectedDepartment?.id,
        memberIds,
        departmentManagerByDeptId,
      )
      const count = demoBatchRemoveMembers(eligibleIds)
      if (count === 0) return 0

      const removeSet = new Set(eligibleIds)
      setPinnedMemberIds((prev) => prev.filter((id) => !removeSet.has(id)))
      setManualDepartmentMemberIds((prev) => {
        const next: Record<string, string[]> = {}
        for (const [deptId, ids] of Object.entries(prev)) {
          const filtered = ids.filter((id) => !removeSet.has(id))
          if (filtered.length > 0) next[deptId] = filtered
        }
        return next
      })
      setMemberDepartmentIdOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of eligibleIds) {
          delete next[memberId]
        }
        return next
      })
      return count
    },
    [demoBatchRemoveMembers, departmentManagerByDeptId, selectedDepartment?.id],
  )

  const guardDepartmentManagerMemberId = useCallback(
    (memberId: string) =>
      !isDepartmentManagerMember(selectedDepartment?.id, memberId, departmentManagerByDeptId),
    [departmentManagerByDeptId, selectedDepartment?.id],
  )

  const requestRemoveMember = useCallback(
    (memberId: string) => {
      if (!guardDepartmentManagerMemberId(memberId)) return
      handleRequestRemoveMember(memberId)
    },
    [guardDepartmentManagerMemberId, handleRequestRemoveMember],
  )

  const saveMemberStatus = useCallback(
    (memberId: string, status: Parameters<typeof handleSaveMemberStatus>[1]) => {
      if (!guardDepartmentManagerMemberId(memberId) && status === 'inactive') return
      handleSaveMemberStatus(memberId, status)
    },
    [guardDepartmentManagerMemberId, handleSaveMemberStatus],
  )

  const batchDisableMembers = useCallback(
    (memberIds: string[]) => {
      const eligibleIds = filterOutDepartmentManagers(
        selectedDepartment?.id,
        memberIds,
        departmentManagerByDeptId,
      )
      return handleBatchDisableMembers(eligibleIds)
    },
    [departmentManagerByDeptId, handleBatchDisableMembers, selectedDepartment?.id],
  )

  const transferDepartmentManagerCandidates = useMemo(() => {
    if (!selectedDepartment || !departmentManagerMemberId) return []
    const memberIds = membersForSelectedDepartment
      .map((member) => member.memberId)
      .filter((memberId) => memberId !== departmentManagerMemberId)
    return memberIds
      .map((memberId) => getOrgMemberById(memberId))
      .filter((member): member is NonNullable<typeof member> => member != null)
  }, [departmentManagerMemberId, membersForSelectedDepartment, selectedDepartment])

  const handleOpenTransferDepartmentManager = useCallback(() => {
    setTransferDepartmentManagerOpen(true)
  }, [])

  const handleConfirmTransferDepartmentManager = useCallback(
    (nextManagerMemberId: string) => {
      if (!selectedDepartment || !departmentManagerMemberId) return
      if (nextManagerMemberId === departmentManagerMemberId) return
      setDepartmentManagerByDeptId((prev) => ({
        ...prev,
        [selectedDepartment.id]: nextManagerMemberId,
      }))
      const nextMember = getOrgMemberById(nextManagerMemberId)
      if (nextMember) {
        setDepartmentManagerTransferHint(localizeMember(nextMember))
      }
      setTransferDepartmentManagerOpen(false)
    },
    [departmentManagerMemberId, localizeMember, selectedDepartment],
  )

  const handleBatchAdjustMemberDepartments = useCallback(
    (memberIds: string[], targetDepartmentId: string) => {
      const department = findOrgDepartmentById(orgDepartments, targetDepartmentId)
      const eligibleIds = filterOutDepartmentManagers(
        selectedDepartment?.id,
        memberIds,
        departmentManagerByDeptId,
      )
      if (!department || eligibleIds.length === 0) return 0

      const uniqueIds = [...new Set(eligibleIds)]
      demoBatchAdjustMemberDepartments(uniqueIds, department.nameZh, department.nameEn)

      setMemberDepartmentIdOverrides((prev) => {
        const next = { ...prev }
        for (const memberId of uniqueIds) {
          next[memberId] = targetDepartmentId
        }
        return next
      })

      setManualDepartmentMemberIds((prev) => {
        const memberSet = new Set(uniqueIds)
        const next: Record<string, string[]> = {}
        for (const [deptId, ids] of Object.entries(prev)) {
          const filtered = ids.filter((id) => !memberSet.has(id))
          if (filtered.length > 0) next[deptId] = filtered
        }
        const targetExisting = next[targetDepartmentId] ?? []
        const toAdd = uniqueIds.filter((id) => !targetExisting.includes(id))
        if (toAdd.length > 0) {
          next[targetDepartmentId] = [...toAdd, ...targetExisting]
        }
        return next
      })

      return uniqueIds.length
    },
    [demoBatchAdjustMemberDepartments, departmentManagerByDeptId, orgDepartments, selectedDepartment?.id],
  )

  const handleAddMembersByStructure = useCallback(
    (payload: AddDepartmentMembersByStructurePayload) => {
      const transferredCount = handleBatchAdjustMemberDepartments(
        payload.memberIds,
        payload.departmentId,
      )
      if (transferredCount > 0) {
        setAddDepartmentMemberOpen(false)
      }
    },
    [handleBatchAdjustMemberDepartments],
  )

  const handleRequestRemoveDepartment = useCallback((department: OrgDepartmentRow) => {
    setPendingRemoveDepartment(department)
  }, [])

  const handleConfirmRemoveDepartment = useCallback(() => {
    if (!pendingRemoveDepartment) return

    const memberCount = departmentDisplayMemberCountById.get(pendingRemoveDepartment.id) ?? 0
    if (memberCount > 0) return

    const removeId = pendingRemoveDepartment.id
    setOrgDepartments((prev) => {
      const next = prev
        .filter((item) => item.id !== removeId)
        .map((item) => (item.parentId === removeId ? { ...item, parentId: null } : item))

      if (
        selectedDepartmentId === removeId ||
        !findOrgDepartmentById(next, selectedDepartmentId)
      ) {
        setSelectedDepartmentId(getDefaultSelectableOrgDepartmentId(next))
      }

      return next
    })

    if (editDepartment?.id === removeId) setEditDepartment(null)
    if (addChildParent?.id === removeId) setAddChildParent(null)

    setPendingRemoveDepartment(null)
  }, [
    addChildParent,
    departmentDisplayMemberCountById,
    editDepartment,
    pendingRemoveDepartment,
    selectedDepartmentId,
  ])

  const pendingRemoveDepartmentMemberCount = pendingRemoveDepartment
    ? (departmentDisplayMemberCountById.get(pendingRemoveDepartment.id) ?? 0)
    : 0

  return {
    locale,
    members,
    membersForSelectedDepartment,
    membersForOrgRoot,
    membersForSelectedScope,
    orgMembers,
    orgDepartments,
    roles,
    roleOverridesById,
    memberStatusOverrides,
    membersSearchQuery,
    setMembersSearchQuery,
    orgDepartmentRoots: filteredOrgDepartmentRoots as OrgDepartmentRow[],
    selectedDepartmentId,
    selectedDepartment,
    isOrgRootSelected,
    totalOrgMemberCount,
    departmentDisplayMemberCountById,
    departmentMemberIdsByDepartmentId,
    expandDepartmentIds,
    handleClearExpandDepartmentIds,
    handleSelectDepartment,
    editDepartment,
    setEditDepartment,
    addChildParent,
    setAddChildParent,
    addDepartmentOpen,
    setAddDepartmentOpen,
    handleEditDepartment,
    handleSaveDepartment,
    handleAddChildDepartment,
    handleOpenAddDepartment,
    handleSaveAddChildDepartment,
    handleSaveAddDepartment,
    addDepartmentMemberOpen,
    setAddDepartmentMemberOpen,
    handleOpenAddDepartmentMember,
    handleSaveDepartmentMember,
    handleAddMembersByStructure,
    inviteDepartmentMembersOpen,
    setInviteDepartmentMembersOpen,
    handleOpenInviteDepartmentMembers,
    thirdPartyImportOpen,
    setThirdPartyImportOpen,
    batchCreateDepartmentsOpen,
    setBatchCreateDepartmentsOpen,
    handleBatchCreateDepartments,
    handleRequestRemoveDepartment,
    handleConfirmRemoveDepartment,
    pendingRemoveDepartment,
    setPendingRemoveDepartment,
    pendingRemoveDepartmentMemberCount,
    createNewUserOpen,
    setCreateNewUserOpen,
    editMember,
    setEditMember,
    memberPendingRemove,
    setMemberPendingRemove,
    localizeMember,
    localizeMemberDept,
    handleCreateNewUser,
    handleRequestRemoveMember: requestRemoveMember,
    handleConfirmRemoveMember,
    handleSaveMemberStatus: saveMemberStatus,
    handleBatchEnableMembers,
    handleBatchDisableMembers: batchDisableMembers,
    handleBatchRemoveMembers,
    handleBatchAdjustMemberDepartments,
    departmentManagerMemberId,
    transferDepartmentManagerOpen,
    setTransferDepartmentManagerOpen,
    transferDepartmentManagerCandidates,
    handleOpenTransferDepartmentManager,
    handleConfirmTransferDepartmentManager,
    departmentManagerTransferHint,
    setDepartmentManagerTransferHint,
    editingMemberOrg,
    editingMemberRoleLabel,
    editingMemberStatus,
    resolveMemberWorkspaceLabelForMember,
    pendingRemoveMemberOrg,
  }
}
