import {
  getOrgMemberById,
  ORG_MEMBERS_CATALOG,
} from '../../data/orgMembersCatalog'
import { ORG_MEMBERS_SEED } from '../../data/orgMembersSeed'
import type { OrgMember } from '../../types'

const MAX_FREQUENT_SUPERVISORS = 6

/** 跨部门常用主管种子 ID（演示数据） */
const FREQUENT_SUPERVISOR_SEED_IDS: string[] = [
  'member-self',
  'member-mgr-wang',
  'member-hr-zhang',
  'member-it-li',
  'member-ops-chen',
  'member-sales-zhao',
]

export function getFrequentSupervisorCandidates(departmentNameZh: string): OrgMember[] {
  const seen = new Set<string>()
  const result: OrgMember[] = []

  const add = (member: OrgMember | undefined) => {
    if (!member || seen.has(member.id) || result.length >= MAX_FREQUENT_SUPERVISORS) return
    seen.add(member.id)
    result.push(member)
  }

  for (const member of ORG_MEMBERS_SEED) {
    if (member.departmentZh === departmentNameZh) add(member)
  }

  for (const member of ORG_MEMBERS_CATALOG) {
    if (member.departmentZh === departmentNameZh) add(member)
    if (result.length >= MAX_FREQUENT_SUPERVISORS) return result
  }

  for (const id of FREQUENT_SUPERVISOR_SEED_IDS) {
    add(getOrgMemberById(id))
    if (result.length >= MAX_FREQUENT_SUPERVISORS) break
  }

  return result
}
