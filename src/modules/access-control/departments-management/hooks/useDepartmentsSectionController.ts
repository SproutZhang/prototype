import { useCallback, useMemo, useState } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import { useAccessControlDemo } from '../../context/AccessControlDemoProvider'
import type {
  AddDepartmentMemberPayload,
  AddDepartmentMembersByStructurePayload,
} from '../../members-management/components/AddDepartmentMemberModal'
import { findOrgDepartmentById } from '../../members-management/utils/orgDepartmentTree'
import {
  ORG_DEPARTMENT_ROWS,

  localizeDepartmentName,

  isDepartmentManagementRootRow,

  type OrgDepartmentRow,

} from '../data/departmentsSeed'

import {
  buildDepartmentTreeMemberCounts,
  countMembersForDepartment,
} from '../utils/countDepartmentMembers'



export type DepartmentFormSavePayload = {

  nameZh: string

  nameEn: string

  descriptionZh: string

  descriptionEn: string

  parentId: string | null

  departmentCode?: string

  departmentType?: string

  effectiveDate?: string

  establishedDate?: string

  createDepartmentGroup?: boolean

  supervisorIds?: string[]

  includeHiddenSubDepartments?: boolean

  includeSelfVisibleSubDepartments?: boolean

  includeAssociatedOrgs?: boolean

}



export type DepartmentEditSavePayload = {

  nameZh: string

  nameEn: string

  parentId: string | null

  departmentCode: string

  departmentType: string

  descriptionZh: string

  descriptionEn: string

  effectiveDate: string

  supervisorIds: string[]

  includeHiddenSubDepartments: boolean

  includeSelfVisibleSubDepartments: boolean

  includeAssociatedOrgs: boolean

}



export type DepartmentBulkEditPayload = {

  parentId: string | null

  hideDepartment: boolean

  restrictAddressBook: boolean

}

export type DepartmentBulkEditSaveOptions = {
  close?: boolean
}



/**

 * 部门管理子模块控制器：独立状态与操作，不依赖其他访问控制子页面。

 */

export function useDepartmentsSectionController() {

  const { locale } = useLocale()
  const {
    orgMembers,
    roles,
    roleOverridesById,
    handleAddOrgMember,
    handleBatchAdjustMemberDepartments,
  } = useAccessControlDemo()

  const [departments, setDepartments] = useState<OrgDepartmentRow[]>(() => [...ORG_DEPARTMENT_ROWS])

  const [searchQuery, setSearchQuery] = useState('')

  const [addOpen, setAddOpen] = useState(false)

  const [addChildParent, setAddChildParent] = useState<OrgDepartmentRow | null>(null)

  const [batchCreateOpen, setBatchCreateOpen] = useState(false)

  const [thirdPartyImportOpen, setThirdPartyImportOpen] = useState(false)

  const [editDepartment, setEditDepartment] = useState<OrgDepartmentRow | null>(null)

  const [bulkEditIds, setBulkEditIds] = useState<string[] | null>(null)

  const [pendingRemove, setPendingRemove] = useState<OrgDepartmentRow | null>(null)

  const [pendingBulkRemoveIds, setPendingBulkRemoveIds] = useState<string[] | null>(null)

  const [selectionClearSignal, setSelectionClearSignal] = useState(0)

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([])

  const [addDepartmentMemberOpen, setAddDepartmentMemberOpen] = useState(false)
  const [addDepartmentMemberTarget, setAddDepartmentMemberTarget] = useState<OrgDepartmentRow | null>(
    null,
  )
  const [inviteDepartmentMembersOpen, setInviteDepartmentMembersOpen] = useState(false)
  const [batchImportMembersOpen, setBatchImportMembersOpen] = useState(false)
  const [manualDepartmentMemberIds, setManualDepartmentMemberIds] = useState<
    Record<string, string[]>
  >({})

  const memberCountById = useMemo(() => {
    const counts = new Map<string, number>()
    for (const department of departments) {
      counts.set(department.id, countMembersForDepartment(department))
    }
    return counts
  }, [departments])

  const displayMemberCountById = useMemo(() => {
    const display = buildDepartmentTreeMemberCounts(departments)
    const manualEntries = Object.entries(manualDepartmentMemberIds)
    if (manualEntries.length === 0) return display

    for (const [deptId, ids] of manualEntries) {
      display.set(deptId, (display.get(deptId) ?? 0) + ids.length)
    }

    const childrenByParentId = new Map<string, OrgDepartmentRow[]>()
    for (const department of departments) {
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

    for (const department of departments) {
      if (childrenByParentId.get(department.id)?.length) {
        display.set(department.id, subtreeSum(department.id))
      }
    }

    return display
  }, [departments, manualDepartmentMemberIds])

  const resolveParentLabel = useCallback(

    (parentId: string | null) => {

      if (!parentId) return null

      const parent = departments.find((item) => item.id === parentId)

      if (!parent) return null

      return localizeDepartmentName(parent, locale)

    },

    [departments, locale],

  )



  const handleAddDepartment = useCallback((payload: DepartmentFormSavePayload) => {

    const id = `dept-${Date.now()}`

    setDepartments((prev) => [

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

      },

    ])

    setAddOpen(false)

    setAddChildParent(null)

  }, [])



  const handleBatchCreateDepartments = useCallback((payloads: DepartmentFormSavePayload[]) => {

    if (payloads.length === 0) return

    setDepartments((prev) => {

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

        const id = `dept-batch-${Date.now()}-${next.length}`
        next.push({
          id,
          nameZh: payload.nameZh,
          nameEn: payload.nameEn,
          descriptionZh: payload.descriptionZh,
          descriptionEn: payload.descriptionEn,
          parentId: payload.parentId,
          hideDepartment: false,
          restrictAddressBook: false,
          supervisorIds: [],
          includeHiddenSubDepartments: false,
          includeSelfVisibleSubDepartments: false,
          includeAssociatedOrgs: false,
          departmentCode: '',
          departmentType: '',
          effectiveDate: '',
          establishedDate: '',
          createDepartmentGroup: false,
        })
        indexByNameZh.set(payload.nameZh, next.length - 1)
      }

      return next

    })

    setBatchCreateOpen(false)

  }, [])



  const handleSaveDepartment = useCallback(

    (departmentId: string, payload: DepartmentEditSavePayload) => {

      setDepartments((prev) =>

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



  const handleDepartmentSelectionChange = useCallback((ids: string[]) => {
    setSelectedDepartmentIds(ids)
  }, [])

  const handleEditSelectedDepartments = useCallback(() => {
    const topLevelIds = selectedDepartmentIds.filter((id) => {
      const department = departments.find((item) => item.id === id)
      return department != null && isDepartmentManagementRootRow(department.id)
    })
    if (topLevelIds.length === 0) return
    setBulkEditIds(topLevelIds)
  }, [departments, selectedDepartmentIds])

  const handleBulkEditSave = useCallback(

    (
      departmentIds: string[],
      payload: DepartmentBulkEditPayload,
      options?: DepartmentBulkEditSaveOptions,
    ) => {

      if (departmentIds.length === 0) return

      const idSet = new Set(departmentIds)

      setDepartments((prev) =>

        prev.map((item) =>

          idSet.has(item.id)

            ? {

                ...item,

                parentId: payload.parentId,

                hideDepartment: payload.hideDepartment,

                restrictAddressBook: payload.restrictAddressBook,

              }

            : item,

        ),

      )

      if (options?.close !== false) setBulkEditIds(null)

    },

    [],

  )



  const handleRequestRemove = useCallback((department: OrgDepartmentRow) => {

    setPendingRemove(department)

  }, [])



  const handleConfirmRemove = useCallback(() => {

    if (!pendingRemove) return

    const memberCount = memberCountById.get(pendingRemove.id) ?? 0

    if (memberCount > 0) return

    const removeId = pendingRemove.id

    setDepartments((prev) =>

      prev

        .filter((item) => item.id !== removeId)

        .map((item) =>

          item.parentId === removeId ? { ...item, parentId: null } : item,

        ),

    )

    if (editDepartment?.id === removeId) setEditDepartment(null)

    if (bulkEditIds?.includes(removeId)) {

      setBulkEditIds((prev) => (prev ? prev.filter((id) => id !== removeId) : null))

    }

    setPendingRemove(null)

    setSelectionClearSignal((value) => value + 1)

  }, [pendingRemove, memberCountById, editDepartment, bulkEditIds])



  const handleRequestBulkRemove = useCallback(

    (departmentIds: string[]) => {

      if (departmentIds.length === 0) return

      const removableIds = departmentIds.filter((id) => (memberCountById.get(id) ?? 0) === 0)

      const blockedIds = departmentIds.filter((id) => (memberCountById.get(id) ?? 0) > 0)



      if (removableIds.length === 0) {

        const blocked = departments.find((item) => item.id === blockedIds[0])

        if (blocked) setPendingRemove(blocked)

        return

      }



      setPendingBulkRemoveIds(removableIds)

    },

    [departments, memberCountById],

  )



  const handleConfirmBulkRemove = useCallback(() => {

    if (!pendingBulkRemoveIds || pendingBulkRemoveIds.length === 0) return

    const removeSet = new Set(pendingBulkRemoveIds)

    setDepartments((prev) =>

      prev

        .filter((item) => !removeSet.has(item.id))

        .map((item) =>

          item.parentId && removeSet.has(item.parentId) ? { ...item, parentId: null } : item,

        ),

    )

    if (editDepartment && removeSet.has(editDepartment.id)) setEditDepartment(null)

    if (bulkEditIds?.some((id) => removeSet.has(id))) {

      setBulkEditIds((prev) => (prev ? prev.filter((id) => !removeSet.has(id)) : null))

    }

    setPendingBulkRemoveIds(null)

    setSelectionClearSignal((value) => value + 1)

  }, [pendingBulkRemoveIds, editDepartment, bulkEditIds])



  const handleDeleteDepartmentsFromBulkEdit = useCallback(

    (departmentIds: string[]) => {

      const removableIds = departmentIds.filter((id) => (memberCountById.get(id) ?? 0) === 0)

      if (removableIds.length === 0) return

      const removeSet = new Set(removableIds)

      setDepartments((prev) =>

        prev

          .filter((item) => !removeSet.has(item.id))

          .map((item) =>

            item.parentId && removeSet.has(item.parentId) ? { ...item, parentId: null } : item,

          ),

      )

      if (editDepartment && removeSet.has(editDepartment.id)) setEditDepartment(null)

      setBulkEditIds(null)

      setSelectionClearSignal((value) => value + 1)

    },

    [memberCountById, editDepartment],

  )

  const handleOpenAddDepartmentMember = useCallback((department: OrgDepartmentRow) => {
    setAddDepartmentMemberTarget(department)
    setAddDepartmentMemberOpen(true)
  }, [])

  const handleOpenAddDepartmentMemberFromHeader = useCallback(() => {
    if (selectedDepartmentIds.length === 1) {
      const department = findOrgDepartmentById(departments, selectedDepartmentIds[0])
      if (department) {
        setAddDepartmentMemberTarget(department)
        setAddDepartmentMemberOpen(true)
        return
      }
    }
    setAddDepartmentMemberTarget(null)
    setAddDepartmentMemberOpen(true)
  }, [departments, selectedDepartmentIds])

  const handleCloseAddDepartmentMember = useCallback(() => {
    setAddDepartmentMemberOpen(false)
    setAddDepartmentMemberTarget(null)
  }, [])

  const handleSwitchToInviteFromAddMember = useCallback(() => {
    setAddDepartmentMemberOpen(false)
    setInviteDepartmentMembersOpen(true)
  }, [])

  const handleSwitchToBatchImportFromAddMember = useCallback(() => {
    setAddDepartmentMemberOpen(false)
    setBatchImportMembersOpen(true)
  }, [])

  const handleCloseInviteDepartmentMembers = useCallback(() => {
    setInviteDepartmentMembersOpen(false)
    setAddDepartmentMemberTarget(null)
  }, [])

  const handleCloseBatchImportMembers = useCallback(() => {
    setBatchImportMembersOpen(false)
    setAddDepartmentMemberTarget(null)
  }, [])

  const handleSaveDepartmentMember = useCallback(
    (payload: AddDepartmentMemberPayload) => {
      const department = findOrgDepartmentById(departments, payload.departmentId)
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
      setAddDepartmentMemberOpen(false)
      setAddDepartmentMemberTarget(null)
    },
    [departments, handleAddOrgMember],
  )

  const handleAddMembersByStructure = useCallback(
    (payload: AddDepartmentMembersByStructurePayload) => {
      const department = findOrgDepartmentById(departments, payload.departmentId)
      if (!department || payload.memberIds.length === 0) return

      const uniqueIds = [...new Set(payload.memberIds)]
      handleBatchAdjustMemberDepartments(uniqueIds, department.nameZh, department.nameEn)

      setManualDepartmentMemberIds((prev) => {
        const targetExisting = prev[payload.departmentId] ?? []
        const toAdd = uniqueIds.filter((id) => !targetExisting.includes(id))
        if (toAdd.length === 0) return prev
        return { ...prev, [payload.departmentId]: [...toAdd, ...targetExisting] }
      })

      setAddDepartmentMemberOpen(false)
      setAddDepartmentMemberTarget(null)
    },
    [departments, handleBatchAdjustMemberDepartments],
  )

  const pendingRemoveMemberCount = pendingRemove

    ? (memberCountById.get(pendingRemove.id) ?? 0)

    : 0



  return {

    locale,

    departments,

    searchQuery,

    setSearchQuery,

    memberCountById,

    displayMemberCountById,

    addOpen,

    setAddOpen,

    addChildParent,

    setAddChildParent,

    batchCreateOpen,

    setBatchCreateOpen,

    thirdPartyImportOpen,

    setThirdPartyImportOpen,

    editDepartment,

    setEditDepartment,

    bulkEditIds,

    setBulkEditIds,

    pendingRemove,

    setPendingRemove,

    pendingBulkRemoveIds,

    setPendingBulkRemoveIds,

    selectionClearSignal,

    selectedDepartmentIds,

    handleDepartmentSelectionChange,

    handleEditSelectedDepartments,

    resolveParentLabel,

    handleAddDepartment,

    handleBatchCreateDepartments,

    handleSaveDepartment,

    handleBulkEditSave,

    handleRequestRemove,

    handleRequestBulkRemove,

    handleConfirmRemove,

    handleConfirmBulkRemove,

    handleDeleteDepartmentsFromBulkEdit,

    pendingRemoveMemberCount,

    orgMembers,

    roles,

    roleOverridesById,

    addDepartmentMemberOpen,

    addDepartmentMemberTarget,

    handleOpenAddDepartmentMember,

    handleOpenAddDepartmentMemberFromHeader,

    handleCloseAddDepartmentMember,

    handleSaveDepartmentMember,

    handleAddMembersByStructure,

    inviteDepartmentMembersOpen,

    handleSwitchToInviteFromAddMember,

    handleCloseInviteDepartmentMembers,

    batchImportMembersOpen,

    handleSwitchToBatchImportFromAddMember,

    handleCloseBatchImportMembers,

  }

}


