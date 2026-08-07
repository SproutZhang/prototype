import { WORKSPACE_OPTIONS } from '../data/orgMembersCatalog'
import type { WorkspaceRow } from '../data/workspacesSeed'
import type { MemberAssignment, OrgMember } from '../types'

export function resolveMemberWorkspaceId(
  memberId: string,
  orgMembers: OrgMember[],
  memberWorkspaceOverrides: Record<string, string>,
): string | null {
  const overrideId = memberWorkspaceOverrides[memberId]
  if (overrideId) return overrideId

  const member = orgMembers.find((item) => item.id === memberId)
  if (!member) return null

  const matched = WORKSPACE_OPTIONS.find((option) => option.departmentZh === member.departmentZh)
  return matched?.id ?? 'default'
}

export function buildWorkspaceMemberCounts(
  workspaces: WorkspaceRow[],
  members: MemberAssignment[],
  orgMembers: OrgMember[],
  memberWorkspaceOverrides: Record<string, string>,
): Record<string, number> {
  const counts = Object.fromEntries(workspaces.map((workspace) => [workspace.id, 0])) as Record<
    string,
    number
  >

  for (const assignment of members) {
    const workspaceId = resolveMemberWorkspaceId(
      assignment.memberId,
      orgMembers,
      memberWorkspaceOverrides,
    )
    if (workspaceId && workspaceId in counts) {
      counts[workspaceId] = (counts[workspaceId] ?? 0) + 1
    }
  }

  return counts
}
