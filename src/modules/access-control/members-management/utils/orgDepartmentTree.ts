import type { AppLocale } from '../../../../i18n/homeStrings'
import {
  isDepartmentManagementRootRow,
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../../departments-management/data/departmentsSeed'

export function getOrgDepartmentRoots(departments: OrgDepartmentRow[]): OrgDepartmentRow[] {
  return departments.filter(
    (department) =>
      isDepartmentManagementRootRow(department.id) ||
      (department.parentId === null && !isDepartmentManagementRootRow(department.id)),
  )
}

export function getOrgDepartmentChildren(
  departments: OrgDepartmentRow[],
  parentId: string,
  locale: AppLocale,
): OrgDepartmentRow[] {
  return departments
    .filter((department) => department.parentId === parentId)
    .sort((a, b) =>
      localizeDepartmentName(a, locale).localeCompare(localizeDepartmentName(b, locale), locale),
    )
}

export function findOrgDepartmentById(
  departments: OrgDepartmentRow[],
  id: string,
): OrgDepartmentRow | undefined {
  return departments.find((department) => department.id === id)
}

/** 收集部门及其所有子级部门下的成员 ID（父级选中时展示整棵子树成员） */
export function collectOrgDepartmentSubtreeMemberIds(
  departments: OrgDepartmentRow[],
  departmentId: string,
  memberIdsByDepartmentId: Map<string, string[]>,
): Set<string> {
  const memberIds = new Set(memberIdsByDepartmentId.get(departmentId) ?? [])
  for (const child of departments.filter((department) => department.parentId === departmentId)) {
    for (const memberId of collectOrgDepartmentSubtreeMemberIds(
      departments,
      child.id,
      memberIdsByDepartmentId,
    )) {
      memberIds.add(memberId)
    }
  }
  return memberIds
}

/** 按部门树遍历顺序收集成员 ID，保留各部门成员列表中的先后顺序 */
export function collectOrderedOrgDepartmentSubtreeMemberIds(
  departments: OrgDepartmentRow[],
  departmentId: string,
  memberIdsByDepartmentId: Map<string, string[]>,
): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []

  function addMemberIds(memberIds: string[]) {
    for (const memberId of memberIds) {
      if (seen.has(memberId)) continue
      seen.add(memberId)
      ordered.push(memberId)
    }
  }

  function walk(currentDepartmentId: string) {
    addMemberIds(memberIdsByDepartmentId.get(currentDepartmentId) ?? [])
    for (const child of departments.filter((department) => department.parentId === currentDepartmentId)) {
      walk(child.id)
    }
  }

  walk(departmentId)
  return ordered
}

export function getDefaultSelectableOrgDepartmentId(departments: OrgDepartmentRow[]): string {
  const roots = getOrgDepartmentRoots(departments)
  return roots[0]?.id ?? ''
}

export function isOrgDepartmentVisibleInFilter(
  department: OrgDepartmentRow,
  query: string,
  locale: AppLocale,
  memberIdsByDepartmentId: Map<string, string[]>,
  orgMembers: { id: string; email: string }[],
  localizeMember: (m: { id: string }) => string,
  localizeMemberDept: (m: { id: string }) => string,
): boolean {
  if (!query) return true
  const name = localizeDepartmentName(department, locale)
  if (name.toLowerCase().includes(query)) return true

  const memberIds = memberIdsByDepartmentId.get(department.id) ?? []
  return memberIds.some((memberId) => {
    const orgMember = orgMembers.find((member) => member.id === memberId)
    if (!orgMember) return false
    const haystack = [
      localizeMember(orgMember),
      orgMember.email,
      localizeMemberDept(orgMember),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
}
