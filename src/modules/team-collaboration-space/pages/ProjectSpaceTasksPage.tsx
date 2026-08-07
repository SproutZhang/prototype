import { useCallback, useEffect, useMemo, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { OnboardingCandidateDetailPanel } from '../components/OnboardingCandidateDetailPanel'
import { RecruitJdReviewDetailPanel } from '../components/RecruitJdReviewDetailPanel'
import { ProjectSpaceHeader } from '../components/ProjectSpaceHeader'
import { ProjectSpaceSidebar } from '../components/ProjectSpaceSidebar'
import { ProjectSpaceTasksPanel } from '../components/ProjectSpaceTasksPanel'
import { TcsSectionHintIcon } from '../components/TcsSectionHintIcon'
import { WorkflowInstanceDetailPanel } from '../components/WorkflowInstanceDetailPanel'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import {
  APPROVAL_TASKS_SEED,
  WORKFLOW_INSTANCES_SEED,
} from '../data/approvalTasksSeed'
import {
  listRecruitPassedCandidatesForHm,
  confirmOnboardingCandidate as persistOnboardingCandidateConfirm,
  subscribeOnboardingCandidatesSync,
} from '../utils/recruitPassedCandidatesSync'
import {
  findRecruitJdRequestById,
  listPendingRecruitJdReviewTasks,
  listUserInitiatedRequestsForMember,
  reviewRecruitJdRequest,
  subscribeUserInitiatedRequestsSync,
} from '../utils/userInitiatedRequestsSync'
import { countProjectsInGroup, getDefaultProjectGroupId } from '../data/projectSpaceSeed'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { useProjectGroups } from '../hooks/useProjectGroups'
import { useProjectSpaceItems } from '../hooks/useProjectSpaceItems'
import { localizeProjectGroupName, tcsT } from '../i18n/strings'
import type {
  ApprovalTask,
  ProjectGroup,
  ProjectSpaceTasksScope,
  WorkflowInstance,
} from '../types'
import { resolveCurrentMemberId, resolveCurrentRole } from '../utils/currentMember'
import { filterGroupsForTaskApproval, isPublicProjectGroup } from '../utils/projectGroups'
import {
  computeProjectSpacePendingCounts,
  filterInitiatedInstances,
  filterRecruitJdInboxByGroup,
  filterVisibleTasks,
} from '../utils/taskVisibility'

type ProjectSpaceTasksPageProps = {
  groupId?: string
  instanceId?: string
  onboardingCandidateId?: string
  recruitJdRequestId?: string
  tasksScope?: ProjectSpaceTasksScope
}

function resolveTasksFilterGroupId(groupId: string | undefined, groups: ProjectGroup[]): string | null {
  if (!groupId) return null
  const group = groups.find((item) => item.id === groupId)
  if (!group || isPublicProjectGroup(group)) return null
  return groupId
}

export function ProjectSpaceTasksPage({
  groupId,
  instanceId,
  onboardingCandidateId,
  recruitJdRequestId,
  tasksScope = 'inbox',
}: ProjectSpaceTasksPageProps) {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const {
    canViewProjectSpaceMineAndGroups,
    canViewProjectTasks,
    canShowProjectTasksNav,
    canViewApprovalTaskDetail,
    canViewApprovalTaskProgress,
    canApproveProjectTask,
    isAdmin,
    isUser,
    canManageCustomRoles,
    canProjectSpaceViewChangelog,
  } = useTeamCollaborationCapabilities()
  const [searchQuery, setSearchQuery] = useState('')
  const groups = useProjectGroups()
  const projectItems = useProjectSpaceItems()
  const [tasks, setTasks] = useState<ApprovalTask[]>(() => [...APPROVAL_TASKS_SEED])
  const [instances, setInstances] = useState<WorkflowInstance[]>(() => [...WORKFLOW_INSTANCES_SEED])
  const taskFilterGroups = useMemo(() => filterGroupsForTaskApproval(groups), [groups])
  const [filterGroupId, setFilterGroupId] = useState<string | null>(() =>
    resolveTasksFilterGroupId(groupId, groups),
  )

  const role = resolveCurrentRole()
  const memberId = resolveCurrentMemberId()

  useEffect(() => {
    if (!canShowProjectTasksNav) {
      if (canViewProjectSpaceMineAndGroups) {
        tcs.navigate({ view: 'project-space', scope: 'mine' })
      } else if (canManageCustomRoles) {
        tcs.navigate({ view: 'project-space-roles' })
      }
    }
  }, [canManageCustomRoles, canShowProjectTasksNav, canViewProjectSpaceMineAndGroups, tcs])

  useEffect(() => {
    setFilterGroupId(resolveTasksFilterGroupId(groupId, groups))
  }, [groupId, groups])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const group of groups) {
      counts[group.id] = countProjectsInGroup(group.id, projectItems)
    }
    return counts
  }, [groups, projectItems])

  const canViewTaskInstanceDetail = canViewApprovalTaskProgress || canViewApprovalTaskDetail

  const passedInterviewCandidates = useMemo(
    () => listRecruitPassedCandidatesForHm(memberId),
    [memberId],
  )
  const [onboardingCandidates, setOnboardingCandidates] = useState(passedInterviewCandidates)

  useEffect(() => {
    setOnboardingCandidates(listRecruitPassedCandidatesForHm(memberId))
  }, [memberId])

  useEffect(() => {
    return subscribeOnboardingCandidatesSync(() => {
      setOnboardingCandidates(listRecruitPassedCandidatesForHm(memberId))
    })
  }, [memberId])

  const [userInitiatedRequestsState, setUserInitiatedRequestsState] = useState(() =>
    listUserInitiatedRequestsForMember(memberId),
  )
  const [hrRecruitJdInboxState, setHrRecruitJdInboxState] = useState(() =>
    listPendingRecruitJdReviewTasks(),
  )

  useEffect(() => {
    setUserInitiatedRequestsState(listUserInitiatedRequestsForMember(memberId))
  }, [memberId])

  useEffect(() => {
    setHrRecruitJdInboxState(listPendingRecruitJdReviewTasks())
  }, [])

  useEffect(() => {
    return subscribeUserInitiatedRequestsSync(() => {
      setUserInitiatedRequestsState(listUserInitiatedRequestsForMember(memberId))
      setHrRecruitJdInboxState(listPendingRecruitJdReviewTasks())
    })
  }, [memberId])

  const pendingCounts = useMemo(() => {
    if (isUser) {
      return {
        total: onboardingCandidates.filter((item) => item.status === 'awaiting_confirm').length,
        byGroup: {} as Record<string, number>,
      }
    }
    return computeProjectSpacePendingCounts(
      tasks,
      taskFilterGroups.map((group) => group.id),
      role,
      memberId,
      hrRecruitJdInboxState.length,
    )
  }, [hrRecruitJdInboxState.length, isUser, onboardingCandidates, taskFilterGroups, tasks, role, memberId])

  const pendingCount = pendingCounts.total
  const tasksGroupPendingCounts = pendingCounts.byGroup

  const handleConfirmOnboardingCandidate = useCallback((candidateId: string) => {
    persistOnboardingCandidateConfirm(candidateId)
  }, [])

  const handleReviewRecruitJd = useCallback(
    (requestId: string, decision: 'approved' | 'rejected', rejectReason?: string) => {
      reviewRecruitJdRequest(requestId, decision, rejectReason)
    },
    [],
  )

  const visibleHrRecruitJdInbox = useMemo(
    () => filterRecruitJdInboxByGroup(hrRecruitJdInboxState, filterGroupId),
    [filterGroupId, hrRecruitJdInboxState],
  )

  const visibleTasks = useMemo(() => {
    if (tasksScope === 'initiated') return []

    const filtered = filterVisibleTasks(tasks, {
      role,
      memberId,
      groupId: filterGroupId,
      scope: tasksScope,
    })
    const query = searchQuery.trim().toLowerCase()
    if (!query) return filtered

    return filtered.filter((task) => {
      const instance = instances.find((item) => item.id === task.instanceId)
      if (!instance) return false
      const haystack = [
        instance.subjectZh,
        instance.subjectEn,
        instance.scenarioTitleZh,
        instance.scenarioTitleEn,
        instance.projectNameZh,
        instance.projectNameEn,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [filterGroupId, instances, memberId, role, searchQuery, tasks, tasksScope])

  const visibleInitiatedInstances = useMemo(() => {
    if (tasksScope !== 'initiated') return []

    const filtered = filterInitiatedInstances(instances, {
      role,
      memberId,
      groupId: filterGroupId,
    })
    const query = searchQuery.trim().toLowerCase()
    const matched = query
      ? filtered.filter((instance) => {
          const haystack = [
            instance.subjectZh,
            instance.subjectEn,
            instance.scenarioTitleZh,
            instance.scenarioTitleEn,
            instance.projectNameZh,
            instance.projectNameEn,
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(query)
        })
      : filtered

    return [...matched].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [filterGroupId, instances, memberId, role, searchQuery, tasksScope])

  const activeInstance = useMemo(
    () => (instanceId ? instances.find((item) => item.id === instanceId) : undefined),
    [instanceId, instances],
  )

  const activeOnboardingCandidate = useMemo(
    () =>
      onboardingCandidateId
        ? onboardingCandidates.find((item) => item.id === onboardingCandidateId)
        : undefined,
    [onboardingCandidateId, onboardingCandidates],
  )

  const activeRecruitJdRequest = useMemo(
    () => (recruitJdRequestId ? findRecruitJdRequestById(recruitJdRequestId) : undefined),
    [recruitJdRequestId, hrRecruitJdInboxState, userInitiatedRequestsState],
  )

  const sectionTitle = recruitJdRequestId
    ? tcsT(locale, 'recruitJdReviewDetailTitle')
    : onboardingCandidateId
    ? tcsT(locale, 'onboardingCandidateDetailTitle')
    : instanceId
    ? tcsT(locale, 'taskDetailTitle')
    : filterGroupId
      ? `${localizeProjectGroupName(groups.find((g) => g.id === filterGroupId)!, locale)} · ${tcsT(locale, 'projectSpaceNavTasks')}`
      : tcsT(locale, 'projectSpaceNavTasks')

  const handleApprove = (stepId: string) => {
    if (!activeInstance) return
    const step = activeInstance.steps.find((item) => item.id === stepId)
    if (!step) return

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    setInstances((current) =>
      current.map((instance) => {
        if (instance.id !== activeInstance.id) return instance
        const stepIndex = instance.steps.findIndex((item) => item.id === stepId)
        const nextSteps = instance.steps.map((item, index) => {
          if (item.id === stepId) {
            return {
              ...item,
              status: 'completed' as const,
              completedAt: now,
              approvalDecision: 'approved' as const,
            }
          }
          if (index === stepIndex + 1 && item.status === 'waiting') {
            return { ...item, status: item.kind === 'approval' ? ('pending' as const) : item.status }
          }
          return item
        })
        const nextPending = nextSteps.find((item) => item.status === 'pending')
        return {
          ...instance,
          steps: nextSteps,
          currentStepId: nextPending?.id ?? stepId,
          status: nextPending ? 'running' : 'completed',
        }
      }),
    )

    setTasks((current) =>
      current.map((task) => {
        if (task.instanceId !== activeInstance.id || task.nodeId !== step.nodeId) return task
        return { ...task, status: 'approved', completedAt: now }
      }),
    )
  }

  const handleReject = (stepId: string, reason: string) => {
    if (!activeInstance) return
    const step = activeInstance.steps.find((item) => item.id === stepId)
    if (!step) return

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    setInstances((current) =>
      current.map((instance) => {
        if (instance.id !== activeInstance.id) return instance
        return {
          ...instance,
          status: 'failed',
          steps: instance.steps.map((item) =>
            item.id === stepId
              ? {
                  ...item,
                  status: 'completed' as const,
                  completedAt: now,
                  approvalDecision: 'rejected' as const,
                  rejectReason: reason,
                }
              : item,
          ),
        }
      }),
    )

    setTasks((current) =>
      current.map((task) => {
        if (task.instanceId !== activeInstance.id || task.nodeId !== step.nodeId) return task
        return { ...task, status: 'rejected', completedAt: now }
      }),
    )
  }

  if (!canShowProjectTasksNav) return null

  const displayInstance =
    activeInstance && instances.find((item) => item.id === activeInstance.id)
  const showOnboardingCandidateDetail = Boolean(activeOnboardingCandidate && onboardingCandidateId)
  const showRecruitJdReviewDetail = Boolean(activeRecruitJdRequest && recruitJdRequestId)
  const showSectionHead =
    !isUser ||
    Boolean((displayInstance && instanceId) || showOnboardingCandidateDetail || showRecruitJdReviewDetail)
  const showDetailBack = Boolean(
    (displayInstance && instanceId) || showOnboardingCandidateDetail || showRecruitJdReviewDetail,
  )

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcsT(locale, 'projectSpaceNavTasks')}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <ProjectSpaceHeader locale={locale} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

        <div className={`tcs-project-space-body${isUser ? ' tcs-project-space-body--no-sidebar' : ''}`}>
          {!isUser ? (
            <ProjectSpaceSidebar
              locale={locale}
              groups={taskFilterGroups}
              activeGroupId={filterGroupId ?? getDefaultProjectGroupId()}
              activeNavTab="tasks"
              groupCounts={groupCounts}
              pendingTaskCount={pendingCount}
              tasksGroupPendingCounts={tasksGroupPendingCounts}
              tasksGroupFilterId={filterGroupId}
              onNavTabChange={(tab) => {
                if (tab === 'roles') {
                  tcs.navigate({ view: 'project-space-roles' })
                  return
                }
                if (tab === 'changelog') {
                  tcs.navigate({ view: 'project-space-changelog' })
                  return
                }
                if (tab === 'tasks') return
                tcs.navigate({ view: 'project-space', scope: 'mine' })
              }}
              onGroupSelect={(nextGroupId) => {
                setFilterGroupId(nextGroupId)
              }}
              onTasksGroupFilter={(nextGroupId) => {
                setFilterGroupId((current) => (current === nextGroupId ? null : nextGroupId))
              }}
              onCreateGroup={undefined}
              showRolesNav={canManageCustomRoles}
              showChangelogNav={canProjectSpaceViewChangelog}
              showTasksNav={canShowProjectTasksNav}
              showMineNav={canViewProjectSpaceMineAndGroups}
            />
          ) : null}

          <section
            className="tcs-section tcs-project-space-section"
            aria-labelledby={showSectionHead ? 'tcs-project-space-tasks-title' : undefined}
            aria-label={showSectionHead ? undefined : tcsT(locale, 'projectSpaceNavTasks')}
          >
            {showSectionHead ? (
            <div className="tcs-section-head">
              <div
                className={`tcs-section-title-row${showDetailBack ? ' tcs-section-title-row--tasks-detail' : ''}`}
              >
                {showDetailBack ? (
                  <button
                    type="button"
                    className="tcs-tasks-detail-back"
                    aria-label={tcsT(locale, 'taskDetailBack')}
                    onClick={() => tcs.navigate({ view: 'project-space-tasks', tasksScope })}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path
                        d="M14.5 6.5 9 12l5.5 5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : null}
                <h2 id="tcs-project-space-tasks-title" className="tcs-section-title">
                  {sectionTitle}
                </h2>
                <TcsSectionHintIcon
                  hintId="tcs-project-space-tasks-hint"
                  hint={tcsT(locale, 'projectSpaceTasksHint')}
                  ariaLabel={tcsT(locale, 'projectSpaceTasksHintAria')}
                />
              </div>
            </div>
            ) : null}

            {showRecruitJdReviewDetail && activeRecruitJdRequest ? (
              <RecruitJdReviewDetailPanel
                locale={locale}
                request={activeRecruitJdRequest}
                onApprove={
                  canApproveProjectTask && activeRecruitJdRequest.status === 'pending'
                    ? (requestId) => handleReviewRecruitJd(requestId, 'approved')
                    : undefined
                }
                onReject={
                  canApproveProjectTask && activeRecruitJdRequest.status === 'pending'
                    ? (requestId, reason) => handleReviewRecruitJd(requestId, 'rejected', reason)
                    : undefined
                }
              />
            ) : showOnboardingCandidateDetail && activeOnboardingCandidate ? (
              <OnboardingCandidateDetailPanel
                locale={locale}
                candidate={activeOnboardingCandidate}
                onConfirm={handleConfirmOnboardingCandidate}
              />
            ) : displayInstance && instanceId && canViewTaskInstanceDetail ? (
              <WorkflowInstanceDetailPanel
                locale={locale}
                instance={displayInstance}
                tasks={tasks}
                role={role}
                memberId={memberId}
                onApprove={canApproveProjectTask ? handleApprove : undefined}
                onReject={canApproveProjectTask ? handleReject : undefined}
              />
            ) : displayInstance && instanceId ? (
              <div className="skills-empty">{tcsT(locale, 'projectSpaceTasksDetailDenied')}</div>
            ) : canViewProjectTasks ? (
              <ProjectSpaceTasksPanel
                locale={locale}
                tasks={visibleTasks}
                initiatedInstances={visibleInitiatedInstances}
                scope={tasksScope}
                pendingCount={pendingCount}
                isAdmin={isAdmin}
                isUser={isUser}
                passedInterviewCandidates={onboardingCandidates}
                userInitiatedRequests={userInitiatedRequestsState}
                hrRecruitJdInboxTasks={!isUser ? visibleHrRecruitJdInbox : []}
                onConfirmOnboardingCandidate={handleConfirmOnboardingCandidate}
                onOpenOnboardingCandidate={(id) => {
                  tcs.navigate({
                    view: 'project-space-tasks',
                    onboardingCandidateId: id,
                    tasksScope,
                    groupId: filterGroupId ?? undefined,
                  })
                }}
                onOpenRecruitJdReview={(id) => {
                  tcs.navigate({
                    view: 'project-space-tasks',
                    recruitJdRequestId: id,
                    tasksScope,
                    groupId: filterGroupId ?? undefined,
                  })
                }}
                onScopeChange={(scope) => tcs.navigate({ view: 'project-space-tasks', tasksScope: scope, groupId: filterGroupId ?? undefined })}
                onOpenInstance={(id) => {
                  if (!canViewTaskInstanceDetail) return
                  tcs.navigate({
                    view: 'project-space-tasks',
                    instanceId: id,
                    tasksScope,
                    groupId: filterGroupId ?? undefined,
                  })
                }}
              />
            ) : (
              <div className="skills-empty">{tcsT(locale, 'projectSpaceTasksListDenied')}</div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
