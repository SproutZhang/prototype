/** 产品部默认部门 Manager：成员目录中的 徐建华11 */
export const PRODUCT_DEPARTMENT_MANAGER_MEMBER_ID = 'member-gen-011'

export const PRODUCT_DEPARTMENT_ID = 'dept-product'

const DEFAULT_DEPARTMENT_MANAGER_BY_DEPT_ID: Record<string, string> = {
  [PRODUCT_DEPARTMENT_ID]: PRODUCT_DEPARTMENT_MANAGER_MEMBER_ID,
}

export function getDefaultDepartmentManagerMap(): Record<string, string> {
  return { ...DEFAULT_DEPARTMENT_MANAGER_BY_DEPT_ID }
}

export function getDepartmentManagerMemberId(
  departmentId: string | null | undefined,
  managerByDeptId: Record<string, string>,
): string | null {
  if (!departmentId) return null
  return managerByDeptId[departmentId] ?? null
}

export function isDepartmentManagerMember(
  departmentId: string | null | undefined,
  memberId: string,
  managerByDeptId: Record<string, string>,
): boolean {
  const managerId = getDepartmentManagerMemberId(departmentId, managerByDeptId)
  return managerId != null && managerId === memberId
}

export function filterOutDepartmentManagers(
  departmentId: string | null | undefined,
  memberIds: readonly string[],
  managerByDeptId: Record<string, string>,
): string[] {
  const managerId = getDepartmentManagerMemberId(departmentId, managerByDeptId)
  if (!managerId) return [...memberIds]
  return memberIds.filter((id) => id !== managerId)
}
