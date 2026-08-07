import type { AppLocale } from '../../../i18n/homeStrings'
import type { RecruitPassedCandidate } from '../data/recruitPassedCandidatesSeed'
import {
  filterCompletedUserInitiatedRequests,
  filterPendingUserInitiatedRequests,
  type UserInitiatedRequest,
} from '../data/userInitiatedRequestsSeed'
import { findWorkflowInstance } from '../data/approvalTasksSeed'
import { HrRecruitJdReviewListItems } from './HrRecruitJdReviewListItems'
import { RecruitPassedCandidatesSection, RecruitPassedCandidateListItems, filterOnboardingCandidatesForUserScope } from './RecruitPassedCandidatesSection'
import { TcsContentEmptyState } from './TcsContentEmptyState'
import { UserInitiatedRequestsList, UserInitiatedRequestListItems } from './UserInitiatedRequestsList'
import { tcsT, type TeamCollaborationSpaceTranslationKey } from '../i18n/strings'
import type { ApprovalTask, ProjectSpaceTasksScope, WorkflowInstance } from '../types'

type ProjectSpaceTasksPanelProps = {
  locale: AppLocale
  tasks: ApprovalTask[]
  initiatedInstances?: WorkflowInstance[]
  scope: ProjectSpaceTasksScope
  pendingCount?: number
  onScopeChange: (scope: ProjectSpaceTasksScope) => void
  onOpenInstance: (instanceId: string) => void
  isAdmin?: boolean
  isUser?: boolean
  passedInterviewCandidates?: RecruitPassedCandidate[]
  userInitiatedRequests?: UserInitiatedRequest[]
  hrRecruitJdInboxTasks?: UserInitiatedRequest[]
  onConfirmOnboardingCandidate?: (candidateId: string) => void
  onOpenOnboardingCandidate?: (candidateId: string) => void
  onOpenRecruitJdReview?: (requestId: string) => void
}

function taskStepTitle(instanceId: string, nodeId: string, locale: AppLocale): string {
  const instance = findWorkflowInstance(instanceId)
  if (!instance) return nodeId
  const step = instance.steps.find((item) => item.nodeId === nodeId)
  if (!step) return nodeId
  return locale === 'zh' ? step.titleZh : step.titleEn
}

function taskSubject(instanceId: string, locale: AppLocale): string {
  const instance = findWorkflowInstance(instanceId)
  if (!instance) return instanceId
  return locale === 'zh' ? instance.subjectZh : instance.subjectEn
}

function taskScenario(instanceId: string, locale: AppLocale): string {
  const instance = findWorkflowInstance(instanceId)
  if (!instance) return ''
  return locale === 'zh' ? instance.scenarioTitleZh : instance.scenarioTitleEn
}

function taskProjectName(instanceId: string, locale: AppLocale): string {
  const instance = findWorkflowInstance(instanceId)
  if (!instance) return ''
  return locale === 'zh' ? instance.projectNameZh : instance.projectNameEn
}

function instanceStatusLabel(locale: AppLocale, status: WorkflowInstance['status']): string {
  switch (status) {
    case 'running':
      return tcsT(locale, 'taskInstanceRunning')
    case 'completed':
      return tcsT(locale, 'taskStatusApproved')
    default:
      return tcsT(locale, 'taskStatusRejected')
  }
}

function instanceProgressLabel(instance: WorkflowInstance, locale: AppLocale): string | null {
  if (instance.status === 'completed') {
    const lastCompleted = [...instance.steps].reverse().find((step) => step.completedAt)
    if (lastCompleted?.completedAt) {
      return `${tcsT(locale, 'taskStatusApproved')} · ${lastCompleted.completedAt}`
    }
    return tcsT(locale, 'taskStatusApproved')
  }

  const stepTitle = currentStepTitle(instance, locale)
  if (!stepTitle) return null
  return `${tcsT(locale, 'taskInitiatedCurrentStep')}: ${stepTitle}`
}

function currentStepTitle(instance: WorkflowInstance, locale: AppLocale): string {
  const step = instance.steps.find((item) => item.id === instance.currentStepId)
  if (!step) return ''
  return locale === 'zh' ? step.titleZh : step.titleEn
}

function emptyMessageKey(scope: ProjectSpaceTasksScope, isUser: boolean): TeamCollaborationSpaceTranslationKey {
  if (isUser) {
    switch (scope) {
      case 'inbox':
        return 'recruitPassedCandidatesEmpty'
      case 'initiated':
        return 'userInitiatedRequestsEmpty'
      case 'done':
        return 'taskDoneEmpty'
      case 'all':
        return 'taskAllEmpty'
    }
  }
  switch (scope) {
    case 'inbox':
      return 'taskInboxEmpty'
    case 'initiated':
      return 'taskInitiatedEmpty'
    case 'done':
      return 'taskDoneEmpty'
    case 'all':
      return 'taskAllEmpty'
  }
}

function ProjectSpaceTasksEmptyState({
  locale,
  scope,
  isUser,
}: {
  locale: AppLocale
  scope: ProjectSpaceTasksScope
  isUser: boolean
}) {
  return <TcsContentEmptyState locale={locale} messageKey={emptyMessageKey(scope, isUser)} />
}

export function ProjectSpaceTasksPanel({
  locale,
  tasks,
  initiatedInstances = [],
  scope,
  pendingCount = 0,
  onScopeChange,
  onOpenInstance,
  isAdmin,
  isUser = false,
  passedInterviewCandidates = [],
  userInitiatedRequests = [],
  hrRecruitJdInboxTasks = [],
  onConfirmOnboardingCandidate,
  onOpenOnboardingCandidate,
  onOpenRecruitJdReview,
}: ProjectSpaceTasksPanelProps) {
  const isInitiatedScope = scope === 'initiated'
  const isUserAllScope = isUser && scope === 'all'
  const isUserInboxScope = isUser && scope === 'inbox'
  const isUserDoneScope = isUser && scope === 'done'
  const userInboxCandidates = isUser
    ? filterOnboardingCandidatesForUserScope(passedInterviewCandidates, 'inbox')
    : []
  const userDoneCandidates = isUser
    ? filterOnboardingCandidatesForUserScope(passedInterviewCandidates, 'done')
    : []
  const userPendingInitiatedRequests = isUser
    ? filterPendingUserInitiatedRequests(userInitiatedRequests)
    : []
  const userDoneInitiatedRequests = isUser
    ? filterCompletedUserInitiatedRequests(userInitiatedRequests)
    : []

  const userAllHasContent =
    userInboxCandidates.length > 0 ||
    userPendingInitiatedRequests.length > 0 ||
    userDoneCandidates.length > 0 ||
    userDoneInitiatedRequests.length > 0

  const userDoneHasContent = userDoneCandidates.length > 0 || userDoneInitiatedRequests.length > 0

  const managerInboxHasContent =
    !isUser && scope === 'inbox' && (hrRecruitJdInboxTasks.length > 0 || tasks.length > 0)

  const renderManagerInboxScope = () => {
    if (!managerInboxHasContent) {
      return <ProjectSpaceTasksEmptyState locale={locale} scope="inbox" isUser={isUser} />
    }

    return (
      <ul className="tcs-tasks-list">
        <HrRecruitJdReviewListItems
          locale={locale}
          requests={hrRecruitJdInboxTasks}
          onOpenRequest={onOpenRecruitJdReview}
        />
        {tasks.map((task) => {
          const stepTitle = taskStepTitle(task.instanceId, task.nodeId, locale)
          const subject = taskSubject(task.instanceId, locale)
          const scenario = taskScenario(task.instanceId, locale)
          const project = taskProjectName(task.instanceId, locale)
          const isPending = task.status === 'pending'
          const isRejected = task.status === 'rejected'
          const isApproved = task.status === 'approved'
          const pendingProgress = isPending
            ? `${tcsT(locale, 'taskInitiatedCurrentStep')}: ${stepTitle}`
            : null

          return (
            <li key={task.id}>
              <button
                type="button"
                className={[
                  'tcs-tasks-list-item',
                  isPending ? 'tcs-tasks-list-item--pending' : '',
                  isRejected ? 'tcs-tasks-list-item--rejected' : '',
                  isApproved ? 'tcs-tasks-list-item--approved' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onOpenInstance(task.instanceId)}
              >
                <span className="tcs-tasks-list-item-main">
                  <strong className="tcs-tasks-list-item-title">
                    {isPending ? subject : stepTitle}
                  </strong>
                  <span className="tcs-tasks-list-item-sub">
                    {isPending ? `${scenario} · ${project}` : `${subject} · ${scenario}`}
                  </span>
                  {pendingProgress ? (
                    <span className="tcs-tasks-list-item-progress tcs-tasks-list-item-progress--pending">
                      {pendingProgress}
                    </span>
                  ) : null}
                </span>
                <span className="tcs-tasks-list-item-meta">
                  <span
                    className={`tcs-tasks-list-item-badge ${
                      isPending
                        ? 'tcs-tasks-list-item-badge--pending'
                        : isRejected
                          ? 'tcs-tasks-list-item-badge--rejected'
                          : 'tcs-tasks-list-item-badge--approved'
                    }`}
                  >
                    {isPending
                      ? tcsT(locale, 'taskStatusPending')
                      : isRejected
                        ? tcsT(locale, 'taskStatusRejected')
                        : tcsT(locale, 'taskStatusApproved')}
                  </span>
                  <span className="tcs-tasks-list-item-time">{task.requestedAt}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  const renderUserDoneScope = () => {
    if (!userDoneHasContent) {
      return <ProjectSpaceTasksEmptyState locale={locale} scope="done" isUser={isUser} />
    }

    return (
      <ul className="tcs-tasks-list">
        <RecruitPassedCandidateListItems
          locale={locale}
          candidates={userDoneCandidates}
          onConfirm={onConfirmOnboardingCandidate}
          onOpenCandidate={onOpenOnboardingCandidate}
        />
        <UserInitiatedRequestListItems locale={locale} requests={userDoneInitiatedRequests} />
      </ul>
    )
  }

  const renderUserAllScope = () => {
    if (!userAllHasContent) {
      return <ProjectSpaceTasksEmptyState locale={locale} scope="all" isUser={isUser} />
    }

    return (
      <ul className="tcs-tasks-list">
        <RecruitPassedCandidateListItems
          locale={locale}
          candidates={userInboxCandidates}
          onConfirm={onConfirmOnboardingCandidate}
          onOpenCandidate={onOpenOnboardingCandidate}
        />
        <UserInitiatedRequestListItems locale={locale} requests={userPendingInitiatedRequests} />
        <RecruitPassedCandidateListItems
          locale={locale}
          candidates={userDoneCandidates}
          onConfirm={onConfirmOnboardingCandidate}
          onOpenCandidate={onOpenOnboardingCandidate}
        />
        <UserInitiatedRequestListItems locale={locale} requests={userDoneInitiatedRequests} />
      </ul>
    )
  }

  return (
    <div className="tcs-tasks-panel">
      <div className="tcs-tasks-panel-tabs" role="tablist" aria-label={tcsT(locale, 'taskScopeTabsAria')}>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'all'}
          className={`tcs-tasks-panel-tab${scope === 'all' ? ' is-active' : ''}`}
          onClick={() => onScopeChange('all')}
        >
          {tcsT(locale, 'taskScopeAll')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'inbox'}
          className={`tcs-tasks-panel-tab${scope === 'inbox' ? ' is-active' : ''}`}
          onClick={() => onScopeChange('inbox')}
        >
          <span className="tcs-tasks-panel-tab-label">{tcsT(locale, 'taskScopeInbox')}</span>
          {pendingCount > 0 ? (
            <span
              className="tcs-tasks-panel-tab-badge"
              aria-label={tcsT(locale, 'projectSpaceTasksBadgeAria').replace('{count}', String(pendingCount))}
            >
              {pendingCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'initiated'}
          className={`tcs-tasks-panel-tab${scope === 'initiated' ? ' is-active' : ''}`}
          onClick={() => onScopeChange('initiated')}
        >
          {tcsT(locale, 'taskScopeInitiated')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'done'}
          className={`tcs-tasks-panel-tab${scope === 'done' ? ' is-active' : ''}`}
          onClick={() => onScopeChange('done')}
        >
          {tcsT(locale, 'taskScopeDone')}
        </button>
      </div>

      {isAdmin && scope === 'inbox' ? (
        <p className="tcs-tasks-panel-admin-hint">{tcsT(locale, 'taskAdminViewHint')}</p>
      ) : null}

      {isUserAllScope ? (
        renderUserAllScope()
      ) : isInitiatedScope ? (
        isUser ? (
          userPendingInitiatedRequests.length === 0 ? (
            <ProjectSpaceTasksEmptyState locale={locale} scope="initiated" isUser={isUser} />
          ) : (
            <UserInitiatedRequestsList locale={locale} requests={userPendingInitiatedRequests} />
          )
        ) : initiatedInstances.length === 0 ? (
          <ProjectSpaceTasksEmptyState locale={locale} scope="initiated" isUser={isUser} />
        ) : (
          <ul className="tcs-tasks-list">
            {initiatedInstances.map((instance) => {
              const subject = locale === 'zh' ? instance.subjectZh : instance.subjectEn
              const scenario = locale === 'zh' ? instance.scenarioTitleZh : instance.scenarioTitleEn
              const project = locale === 'zh' ? instance.projectNameZh : instance.projectNameEn
              const progressLabel = instanceProgressLabel(instance, locale)
              return (
                <li key={instance.id}>
                  <button
                    type="button"
                    className={[
                      'tcs-tasks-list-item',
                      instance.status === 'running' ? 'tcs-tasks-list-item--running' : '',
                      instance.status === 'failed' ? 'tcs-tasks-list-item--rejected' : '',
                      instance.status === 'completed' ? 'tcs-tasks-list-item--approved' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onOpenInstance(instance.id)}
                  >
                    <span className="tcs-tasks-list-item-main">
                      <strong className="tcs-tasks-list-item-title">{subject}</strong>
                      <span className="tcs-tasks-list-item-sub">
                        {scenario} · {project}
                      </span>
                      {progressLabel ? (
                        <span
                          className={`tcs-tasks-list-item-progress tcs-tasks-list-item-progress--${instance.status}`}
                        >
                          {progressLabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="tcs-tasks-list-item-meta">
                      <span
                        className={`tcs-tasks-list-item-badge tcs-tasks-list-item-badge--instance-${instance.status}`}
                      >
                        {instanceStatusLabel(locale, instance.status)}
                      </span>
                      <span className="tcs-tasks-list-item-time">{instance.createdAt}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )
      ) : isUserDoneScope ? (
        renderUserDoneScope()
      ) : isUserInboxScope ? (
        userInboxCandidates.length === 0 ? (
          <ProjectSpaceTasksEmptyState locale={locale} scope="inbox" isUser={isUser} />
        ) : (
          <RecruitPassedCandidatesSection
            embedded
            locale={locale}
            candidates={userInboxCandidates}
            onConfirm={onConfirmOnboardingCandidate}
            onOpenCandidate={onOpenOnboardingCandidate}
          />
        )
      ) : !isUser && scope === 'inbox' ? (
        renderManagerInboxScope()
      ) : tasks.length === 0 ? (
        <ProjectSpaceTasksEmptyState locale={locale} scope={scope} isUser={isUser} />
      ) : (
        <ul className="tcs-tasks-list">
          {tasks.map((task) => {
            const stepTitle = taskStepTitle(task.instanceId, task.nodeId, locale)
            const subject = taskSubject(task.instanceId, locale)
            const scenario = taskScenario(task.instanceId, locale)
            const project = taskProjectName(task.instanceId, locale)
            const isPending = task.status === 'pending'
            const isRejected = task.status === 'rejected'
            const isApproved = task.status === 'approved'
            const pendingProgress = isPending
              ? `${tcsT(locale, 'taskInitiatedCurrentStep')}: ${stepTitle}`
              : null

            return (
              <li key={task.id}>
                <button
                  type="button"
                  className={[
                    'tcs-tasks-list-item',
                    isPending ? 'tcs-tasks-list-item--pending' : '',
                    isRejected ? 'tcs-tasks-list-item--rejected' : '',
                    isApproved ? 'tcs-tasks-list-item--approved' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onOpenInstance(task.instanceId)}
                >
                  <span className="tcs-tasks-list-item-main">
                    <strong className="tcs-tasks-list-item-title">
                      {isPending ? subject : stepTitle}
                    </strong>
                    <span className="tcs-tasks-list-item-sub">
                      {isPending ? `${scenario} · ${project}` : `${subject} · ${scenario}`}
                    </span>
                    {pendingProgress ? (
                      <span className="tcs-tasks-list-item-progress tcs-tasks-list-item-progress--pending">
                        {pendingProgress}
                      </span>
                    ) : null}
                  </span>
                  <span className="tcs-tasks-list-item-meta">
                    <span
                      className={`tcs-tasks-list-item-badge tcs-tasks-list-item-badge--${task.status}`}
                    >
                      {tcsT(
                        locale,
                        task.status === 'pending'
                          ? 'taskStatusPending'
                          : task.status === 'approved'
                            ? 'taskStatusApproved'
                            : 'taskStatusRejected',
                      )}
                    </span>
                    <span className="tcs-tasks-list-item-time">
                      {task.completedAt ?? task.requestedAt}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

    </div>
  )
}
