import type { AppLocale } from '../../../i18n/homeStrings'
import {
  APPROVAL_TASKS_SEED,
  findWorkflowInstance,
} from '../data/approvalTasksSeed'
import { listPendingRecruitJdReviewTasks } from './userInitiatedRequestsSync'
import { filterVisibleTasks } from './taskVisibility'

export type HomePendingApprovalTaskItem = {
  id: string
  instanceId?: string
  requestId?: string
  title: string
  subtitle: string
  submittedAt: string
}

function mapRecruitJdReviewTask(
  locale: AppLocale,
  request: ReturnType<typeof listPendingRecruitJdReviewTasks>[number],
): HomePendingApprovalTaskItem {
  const summary = locale === 'zh' ? request.summaryZh : request.summaryEn
  const progress = locale === 'zh' ? request.progressZh : request.progressEn
  return {
    id: request.id,
    requestId: request.id,
    title: locale === 'zh' ? request.titleZh : request.titleEn,
    subtitle: [summary, request.ticketId, progress].filter(Boolean).join(' · '),
    submittedAt: request.submittedAt,
  }
}

export function listHomePendingApprovalTasks(
  locale: AppLocale,
  role: string,
  memberId: string,
): HomePendingApprovalTaskItem[] {
  const recruitJdTasks = listPendingRecruitJdReviewTasks().map((item) =>
    mapRecruitJdReviewTask(locale, item),
  )

  const workflowTasks = filterVisibleTasks(APPROVAL_TASKS_SEED, { role, memberId, scope: 'inbox' })
    .map((task) => {
      const instance = findWorkflowInstance(task.instanceId)
      const step = instance?.steps.find((item) => item.nodeId === task.nodeId)
      const subject = instance
        ? locale === 'zh'
          ? instance.subjectZh
          : instance.subjectEn
        : task.instanceId
      const scenario = instance
        ? locale === 'zh'
          ? instance.scenarioTitleZh
          : instance.scenarioTitleEn
        : ''
      const stepTitle = step ? (locale === 'zh' ? step.titleZh : step.titleEn) : ''
      const project = instance
        ? locale === 'zh'
          ? instance.projectNameZh
          : instance.projectNameEn
        : ''

      return {
        id: task.id,
        instanceId: task.instanceId,
        title: subject,
        subtitle: [scenario, stepTitle, project].filter(Boolean).join(' · '),
        submittedAt: task.requestedAt,
      }
    })

  return [...recruitJdTasks, ...workflowTasks].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  )
}
