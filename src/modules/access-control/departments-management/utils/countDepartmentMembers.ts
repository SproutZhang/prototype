import { ORG_MEMBERS_CATALOG } from '../../data/orgMembersCatalog'
import type { OrgDepartmentRow } from '../data/departmentsSeed'

function isUserCreatedDepartment(department: OrgDepartmentRow): boolean {
  return department.isUserCreated === true || department.id.startsWith('dept-members-')
}

function isAllocatableDepartment(department: OrgDepartmentRow): boolean {
  return !isUserCreatedDepartment(department)
}

/** 按部门名称统计组织目录中的成员数量（演示数据） */
export function countMembersForDepartment(department: OrgDepartmentRow): number {
  if (isUserCreatedDepartment(department)) return 0
  return ORG_MEMBERS_CATALOG.filter(
    (member) => member.departmentZh === department.nameZh,
  ).length
}

export function getMemberIdsForDepartment(department: OrgDepartmentRow): string[] {
  if (isUserCreatedDepartment(department)) return []
  return ORG_MEMBERS_CATALOG.filter(
    (member) => member.departmentZh === department.nameZh,
  ).map((member) => member.id)
}

/** 将父级直接挂靠的成员 ID 均分给子级，父级为空 */
export function buildDepartmentMemberIdMap(
  departments: OrgDepartmentRow[],
): Map<string, string[]> {
  const membersById = new Map<string, string[]>()
  for (const department of departments) {
    membersById.set(department.id, getMemberIdsForDepartment(department))
  }

  const childrenByParentId = new Map<string, OrgDepartmentRow[]>()
  for (const department of departments) {
    if (!department.parentId) continue
    const siblings = childrenByParentId.get(department.parentId) ?? []
    siblings.push(department)
    childrenByParentId.set(department.parentId, siblings)
  }

  function allocateToChildren(parentId: string) {
    const children = childrenByParentId.get(parentId)
    if (!children || children.length === 0) return

    const allocatableChildren = children.filter(isAllocatableDepartment)
    const parentMembers = membersById.get(parentId) ?? []
    if (parentMembers.length > 0 && allocatableChildren.length > 0) {
      membersById.set(parentId, [])
      const base = Math.floor(parentMembers.length / allocatableChildren.length)
      let remainder = parentMembers.length % allocatableChildren.length
      let offset = 0

      for (const child of allocatableChildren) {
        const share = base + (remainder > 0 ? 1 : 0)
        if (remainder > 0) remainder -= 1
        const slice = parentMembers.slice(offset, offset + share)
        offset += share
        membersById.set(child.id, [...(membersById.get(child.id) ?? []), ...slice])
      }
    }

    for (const child of children) {
      if (isUserCreatedDepartment(child)) {
        membersById.set(child.id, [])
      }
      allocateToChildren(child.id)
    }
  }

  for (const department of departments) {
    if (childrenByParentId.get(department.id)?.length) {
      allocateToChildren(department.id)
    }
  }

  return membersById
}

/**
 * 树形列表展示用成员数：父级直接挂靠的成员均分给子级，父级行显示 0。
 * 删除/批量操作仍使用 {@link countMembersForDepartment} 的原始统计。
 */
export function buildDepartmentDisplayMemberCounts(
  departments: OrgDepartmentRow[],
): Map<string, number> {
  const display = new Map<string, number>()
  for (const department of departments) {
    display.set(department.id, countMembersForDepartment(department))
  }

  const childrenByParentId = new Map<string, OrgDepartmentRow[]>()
  for (const department of departments) {
    if (!department.parentId) continue
    const siblings = childrenByParentId.get(department.parentId) ?? []
    siblings.push(department)
    childrenByParentId.set(department.parentId, siblings)
  }

  function allocateToChildren(parentId: string) {
    const children = childrenByParentId.get(parentId)
    if (!children || children.length === 0) return

    const allocatableChildren = children.filter(isAllocatableDepartment)
    const parentCount = display.get(parentId) ?? 0
    if (parentCount > 0 && allocatableChildren.length > 0) {
      const base = Math.floor(parentCount / allocatableChildren.length)
      let remainder = parentCount % allocatableChildren.length
      display.set(parentId, 0)

      for (const child of allocatableChildren) {
        const share = base + (remainder > 0 ? 1 : 0)
        if (remainder > 0) remainder -= 1
        display.set(child.id, (display.get(child.id) ?? 0) + share)
      }
    }

    for (const child of children) {
      if (isUserCreatedDepartment(child)) {
        display.set(child.id, 0)
      }
      allocateToChildren(child.id)
    }
  }

  for (const department of departments) {
    if (childrenByParentId.get(department.id)?.length) {
      allocateToChildren(department.id)
    }
  }

  return display
}

/**
 * 树形展示用成员数：子级为分配后人数，父级为所有子级人数之和（与部门管理列表一致）。
 */
export function buildDepartmentTreeMemberCounts(
  departments: OrgDepartmentRow[],
): Map<string, number> {
  const display = buildDepartmentDisplayMemberCounts(departments)

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
}
