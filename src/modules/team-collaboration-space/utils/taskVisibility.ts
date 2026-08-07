import type { ApprovalTask, ProjectSpaceTasksScope, WorkflowInstance, WorkflowInstanceStep } from '../types'
import { resolveCurrentMemberId, resolveCurrentRole } from './currentMember'

export function canViewWorkflowInstance(role: string, memberId: string, instance: WorkflowInstance): boolean {
  if (role === 'admin') return true
  if (instance.initiatorId === memberId) return true
  const isAssignee = instance.steps.some(
    (step) => step.kind === 'approval' && step.assigneeIds?.includes(memberId),
  )
  return isAssignee
}

export function canEditApprovalStep(
  role: string,
  memberId: string,
  step: WorkflowInstanceStep,
): boolean {
  if (step.kind !== 'approval' || step.status !== 'pending') return false
  if (role === 'admin') return true
  return step.assigneeIds?.includes(memberId) ?? false
}

export function filterVisibleTasks(
  tasks: ApprovalTask[],
  options: { role?: string; memberId?: string; groupId?: string | null; scope?: ProjectSpaceTasksScope },
): ApprovalTask[] {
  const role = options.role ?? resolveCurrentRole()
  const memberId = options.memberId ?? resolveCurrentMemberId()
  const { groupId, scope = 'inbox' } = options

  return tasks.filter((task) => {
    if (groupId && task.projectGroupId !== groupId) return false
    if (scope === 'inbox' && task.status !== 'pending') return false
    if (scope === 'done' && task.status === 'pending') return false
    if (role === 'admin') return true
    return task.assigneeId === memberId
  })
}

export function countPendingTasksForMember(tasks: ApprovalTask[], role: string, memberId: string): number {
  return filterVisibleTasks(tasks, { role, memberId, scope: 'inbox' }).length
}

export function countPendingTasksByGroup(
  tasks: ApprovalTask[],
  groupIds: string[],
  role: string,
  memberId: string,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const groupId of groupIds) {
    counts[groupId] = filterVisibleTasks(tasks, { role, memberId, groupId, scope: 'inbox' }).length
  }
  return counts
}

/** 招聘 JD 审核待办归入行政人事部分组 */
export const RECRUIT_JD_REVIEW_PROJECT_GROUP_ID = 'pg-hr'

export function computeProjectSpacePendingCounts(
  tasks: ApprovalTask[],
  groupIds: string[],
  role: string,
  memberId: string,
  pendingRecruitJdCount = 0,
): { total: number; byGroup: Record<string, number> } {
  const byGroup = countPendingTasksByGroup(tasks, groupIds, role, memberId)

  if (pendingRecruitJdCount > 0 && groupIds.includes(RECRUIT_JD_REVIEW_PROJECT_GROUP_ID)) {
    byGroup[RECRUIT_JD_REVIEW_PROJECT_GROUP_ID] =
      (byGroup[RECRUIT_JD_REVIEW_PROJECT_GROUP_ID] ?? 0) + pendingRecruitJdCount
  }

  const total =
    filterVisibleTasks(tasks, { role, memberId, scope: 'inbox' }).length + pendingRecruitJdCount

  return { total, byGroup }
}

export function filterRecruitJdInboxByGroup<T extends { id: string }>(
  requests: T[],
  groupId: string | null,
): T[] {
  if (!groupId || groupId === RECRUIT_JD_REVIEW_PROJECT_GROUP_ID) return requests
  return []
}

export function filterInitiatedInstances(
  instances: WorkflowInstance[],
  options: { role?: string; memberId?: string; groupId?: string | null },
): WorkflowInstance[] {
  const role = options.role ?? resolveCurrentRole()
  const memberId = options.memberId ?? resolveCurrentMemberId()
  const { groupId } = options

  return instances.filter((instance) => {
    if (groupId && instance.projectGroupId !== groupId) return false
    if (role === 'admin') return true
    return instance.initiatorId === memberId
  })
}
