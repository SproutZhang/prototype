import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { TCS_ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import { tcsT } from '../i18n/strings'
import type { ApprovalTask, WorkflowInstance, WorkflowInstanceStep } from '../types'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { canEditApprovalStep } from '../utils/taskVisibility'

type WorkflowInstanceDetailPanelProps = {
  locale: AppLocale
  instance: WorkflowInstance
  tasks: ApprovalTask[]
  role: string
  memberId: string
  onApprove?: (stepId: string) => void
  onReject?: (stepId: string, reason: string) => void
}

function stepStatusLabel(
  locale: AppLocale,
  step: WorkflowInstanceStep,
): string {
  switch (step.status) {
    case 'completed':
      return tcsT(locale, 'taskStepStatusCompleted')
    case 'pending':
      return tcsT(locale, 'taskStepStatusPending')
    case 'skipped':
      return tcsT(locale, 'taskStepStatusSkipped')
    default:
      return tcsT(locale, 'taskStepStatusWaiting')
  }
}

function StepTimelineStatusIcon({
  status,
  label,
}: {
  status: WorkflowInstanceStep['status']
  label: string
}) {
  return (
    <span
      className={`tcs-tasks-timeline-status-icon tcs-tasks-timeline-status-icon--${status}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
        {status === 'completed' ? (
          <path
            d="M6.5 10.2 8.8 12.5 13.5 7.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : status === 'pending' ? (
          <>
            <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M10 7v3.2l2 1.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : status === 'skipped' ? (
          <path
            d="M6.5 10h7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.5 2.5" />
        )}
      </svg>
    </span>
  )
}

function resolveStepTimestamp(
  step: WorkflowInstanceStep,
  previousStep: WorkflowInstanceStep | undefined,
  instance: WorkflowInstance,
): string | undefined {
  if (step.completedAt) return step.completedAt
  if (step.startedAt) return step.startedAt
  if (step.status === 'pending' || step.status === 'skipped') {
    return previousStep?.completedAt ?? previousStep?.startedAt ?? instance.createdAt
  }
  return undefined
}

function memberName(memberId: string, locale: AppLocale): string {
  const member = TCS_ORG_MEMBERS_SEED.find((item) => item.id === memberId)
  if (!member) return memberId
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function resolveMatterStep(
  instance: WorkflowInstance,
  tasks: ApprovalTask[],
): WorkflowInstanceStep | undefined {
  const decided = [...instance.steps]
    .filter((step) => step.kind === 'approval' && step.approvalDecision)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0]
  if (decided) return decided

  const pending = instance.steps.find((step) => step.status === 'pending' && step.kind === 'approval')
  if (pending) return pending

  const resolvedTask = [...tasks]
    .filter(
      (task) =>
        task.instanceId === instance.id &&
        (task.status === 'approved' || task.status === 'rejected'),
    )
    .sort((a, b) => (b.completedAt ?? b.requestedAt).localeCompare(a.completedAt ?? a.requestedAt))[0]

  if (resolvedTask) {
    return instance.steps.find(
      (step) => step.nodeId === resolvedTask.nodeId && step.kind === 'approval',
    )
  }

  return undefined
}

function resolveStepDecision(
  step: WorkflowInstanceStep,
  tasks: ApprovalTask[],
  instanceId: string,
): 'approved' | 'rejected' | undefined {
  if (step.approvalDecision) return step.approvalDecision

  const task = tasks.find(
    (item) =>
      item.instanceId === instanceId &&
      item.nodeId === step.nodeId &&
      (item.status === 'approved' || item.status === 'rejected'),
  )
  if (task?.status === 'approved') return 'approved'
  if (task?.status === 'rejected') return 'rejected'
  return undefined
}

export function WorkflowInstanceDetailPanel({
  locale,
  instance,
  tasks,
  role,
  memberId,
  onApprove,
  onReject,
}: WorkflowInstanceDetailPanelProps) {
  const { canViewApprovalTaskProgress, canViewApprovalTaskDetail } = useTeamCollaborationCapabilities()
  const showTimeline = canViewApprovalTaskProgress
  const showApprovalMatter = canViewApprovalTaskDetail
  const title = locale === 'zh' ? instance.subjectZh : instance.subjectEn
  const scenario = locale === 'zh' ? instance.scenarioTitleZh : instance.scenarioTitleEn
  const project = locale === 'zh' ? instance.projectNameZh : instance.projectNameEn
  const matterStep = resolveMatterStep(instance, tasks)
  const matterDecision = matterStep ? resolveStepDecision(matterStep, tasks, instance.id) : undefined
  const isPendingMatter = matterStep?.status === 'pending' && !matterDecision
  const canActOnPending = isPendingMatter && matterStep ? canEditApprovalStep(role, memberId, matterStep) : false
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectReasonError, setRejectReasonError] = useState(false)

  const approvalTask = matterStep
    ? tasks.find((task) => task.instanceId === instance.id && task.nodeId === matterStep.nodeId)
    : undefined

  const resetRejectForm = () => {
    setShowRejectForm(false)
    setRejectReason('')
    setRejectReasonError(false)
  }

  const submitReject = () => {
    if (!matterStep || !isPendingMatter) return
    const trimmed = rejectReason.trim()
    if (!trimmed) {
      setRejectReasonError(true)
      return
    }
    onReject?.(matterStep.id, trimmed)
    resetRejectForm()
  }

  const matterTitle = matterStep
    ? locale === 'zh'
      ? matterStep.titleZh
      : matterStep.titleEn
    : null
  const matterPayload = matterStep?.approvalPayload
  const matterAssignees = matterStep?.assigneeIds?.map((id) => memberName(id, locale)).join('、')
  const attachmentNames =
    locale === 'zh' ? matterPayload?.attachmentNamesZh : matterPayload?.attachmentNamesEn
  const matterStatusLabel = matterDecision
    ? matterDecision === 'approved'
      ? tcsT(locale, 'taskStatusApproved')
      : tcsT(locale, 'taskStatusRejected')
    : tcsT(locale, 'taskStatusPending')
  const matterStatusClass = matterDecision
    ? `tcs-tasks-approval-matter-status--${matterDecision}`
    : 'tcs-tasks-approval-matter-status--pending'

  return (
    <div className="tcs-tasks-detail">
      <header className="tcs-tasks-detail-head">
        <div className="tcs-tasks-detail-head-main">
          <h2 className="tcs-tasks-detail-title">{title}</h2>
          <p className="tcs-tasks-detail-meta">
            {scenario} · {project} · {instance.createdAt}
          </p>
        </div>
        <span className={`tcs-tasks-detail-status tcs-tasks-detail-status--${instance.status}`}>
          {tcsT(locale, instance.status === 'running' ? 'taskInstanceRunning' : 'taskInstanceCompleted')}
        </span>
      </header>

      <div
        className={`tcs-tasks-detail-body${showTimeline && showApprovalMatter ? '' : ' tcs-tasks-detail-body--single-panel'}`}
      >
        {showTimeline ? (
        <section className="tcs-tasks-timeline" aria-label={tcsT(locale, 'taskTimelineAria')}>
          <h3 className="tcs-tasks-timeline-title">{tcsT(locale, 'taskTimelineTitle')}</h3>
          <ol className="tcs-tasks-timeline-list">
            {instance.steps.map((step, index) => {
              const stepTitle = locale === 'zh' ? step.titleZh : step.titleEn
              const isCurrent = step.id === instance.currentStepId
              const previousStep = index > 0 ? instance.steps[index - 1] : undefined
              const timestamp = resolveStepTimestamp(step, previousStep, instance)

              return (
                <li
                  key={step.id}
                  className={[
                    'tcs-tasks-timeline-item',
                    `tcs-tasks-timeline-item--${step.status}`,
                    isCurrent ? 'is-current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="tcs-tasks-timeline-track">
                    <span className="tcs-tasks-timeline-dot">{index + 1}</span>
                    {index < instance.steps.length - 1 ? (
                      <span className="tcs-tasks-timeline-line" aria-hidden="true" />
                    ) : null}
                  </div>
                  <div className="tcs-tasks-timeline-content">
                    {timestamp ? (
                      <time className="tcs-tasks-timeline-time">{timestamp}</time>
                    ) : null}
                    <div className="tcs-tasks-timeline-row">
                      <strong className="tcs-tasks-timeline-name">{stepTitle}</strong>
                      <StepTimelineStatusIcon status={step.status} label={stepStatusLabel(locale, step)} />
                    </div>
                    {step.kind === 'branch' && step.branchLabelZh ? (
                      <p className="tcs-tasks-timeline-sub">
                        {tcsT(locale, 'taskBranchSelected')}:{' '}
                        {locale === 'zh' ? step.branchLabelZh : step.branchLabelEn}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
        ) : null}

        {showApprovalMatter ? (
        <section
          className="tcs-tasks-approval-matter"
          aria-label={tcsT(locale, 'taskActionPanelAria')}
        >
          {matterStep ? (
            <>
              <div className="tcs-tasks-approval-matter-head">
                <h3 className="tcs-tasks-approval-matter-title">
                  {tcsT(locale, 'taskApprovalMatterTitle')}
                </h3>
                <span className={`tcs-tasks-approval-matter-status ${matterStatusClass}`}>
                  {matterStatusLabel}
                </span>
              </div>

              {matterDecision ? (
                <div className={`tcs-tasks-approval-result tcs-tasks-approval-result--${matterDecision}`}>
                  <p className="tcs-tasks-approval-result-title">
                    {tcsT(locale, 'taskApprovalResultTitle')}
                  </p>
                  <p className="tcs-tasks-approval-result-value">
                    {matterDecision === 'approved'
                      ? tcsT(locale, 'taskApprovalResultApproved')
                      : tcsT(locale, 'taskApprovalResultRejected')}
                  </p>
                  {matterStep.completedAt ? (
                    <p className="tcs-tasks-approval-result-meta">
                      {tcsT(locale, 'taskApprovalResultAt')}：{matterStep.completedAt}
                    </p>
                  ) : null}
                  {matterDecision === 'rejected' && matterStep.rejectReason ? (
                    <p className="tcs-tasks-approval-result-meta">
                      {tcsT(locale, 'taskApprovalResultReason')}：{matterStep.rejectReason}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="tcs-tasks-approval-matter-card">
                <h4 className="tcs-tasks-approval-matter-step">{matterTitle}</h4>

                {matterPayload ? (
                  <>
                    <p className="tcs-tasks-approval-matter-summary">
                      {locale === 'zh' ? matterPayload.summaryZh : matterPayload.summaryEn}
                    </p>

                    <div className="tcs-tasks-approval-matter-meta">
                      {matterAssignees ? (
                        <div className="tcs-tasks-approval-matter-meta-row">
                          <span className="tcs-tasks-approval-matter-meta-k">
                            {tcsT(locale, 'taskAssigneeLabel')}
                          </span>
                          <span className="tcs-tasks-approval-matter-meta-v">{matterAssignees}</span>
                        </div>
                      ) : null}
                      {approvalTask?.requestedAt ? (
                        <div className="tcs-tasks-approval-matter-meta-row">
                          <span className="tcs-tasks-approval-matter-meta-k">
                            {tcsT(locale, 'taskApprovalRequestedAt')}
                          </span>
                          <span className="tcs-tasks-approval-matter-meta-v">
                            {approvalTask.requestedAt}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <p className="tcs-tasks-approval-matter-section-title">
                      {tcsT(locale, 'taskApprovalFieldsTitle')}
                    </p>
                    <dl className="tcs-tasks-approval-matter-fields">
                      {matterPayload.fields.map((field) => (
                        <div key={field.labelZh} className="tcs-tasks-approval-matter-field">
                          <dt>{locale === 'zh' ? field.labelZh : field.labelEn}</dt>
                          <dd>{locale === 'zh' ? field.valueZh : field.valueEn}</dd>
                        </div>
                      ))}
                    </dl>

                    {attachmentNames?.length ? (
                      <>
                        <p className="tcs-tasks-approval-matter-section-title">
                          {tcsT(locale, 'taskApprovalAttachments')}
                        </p>
                        <ul className="tcs-tasks-approval-matter-attachments">
                          {attachmentNames.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="tcs-tasks-approval-matter-summary">{matterTitle}</p>
                )}
              </div>

              {canActOnPending ? (
                <div className="tcs-tasks-approval-actions">
                  <div className="tcs-tasks-action-buttons">
                    <button
                      type="button"
                      className="tcs-tasks-action-btn tcs-tasks-action-btn--approve"
                      onClick={() => {
                        resetRejectForm()
                        onApprove?.(matterStep.id)
                      }}
                    >
                      {tcsT(locale, 'taskApprove')}
                    </button>
                    <button
                      type="button"
                      className={`tcs-tasks-action-btn tcs-tasks-action-btn--reject${showRejectForm ? ' is-active' : ''}`}
                      onClick={() => setShowRejectForm((open) => !open)}
                      aria-expanded={showRejectForm}
                    >
                      {tcsT(locale, 'taskReject')}
                    </button>
                  </div>
                  {showRejectForm ? (
                    <div className="tcs-tasks-reject-form">
                      <label className="tcs-tasks-reject-label" htmlFor="tcs-tasks-reject-reason">
                        {tcsT(locale, 'taskRejectReasonLabel')}
                      </label>
                      <textarea
                        id="tcs-tasks-reject-reason"
                        className={`tcs-tasks-reject-input${rejectReasonError ? ' is-error' : ''}`}
                        rows={4}
                        value={rejectReason}
                        placeholder={tcsT(locale, 'taskRejectReasonPlaceholder')}
                        onChange={(event) => {
                          setRejectReason(event.target.value)
                          if (event.target.value.trim()) setRejectReasonError(false)
                        }}
                      />
                      {rejectReasonError ? (
                        <p className="tcs-tasks-reject-error" role="alert">
                          {tcsT(locale, 'taskRejectReasonRequired')}
                        </p>
                      ) : null}
                      <div className="tcs-tasks-reject-actions">
                        <button type="button" className="tcs-tasks-reject-cancel" onClick={resetRejectForm}>
                          {tcsT(locale, 'taskRejectCancel')}
                        </button>
                        <button
                          type="button"
                          className="tcs-tasks-action-btn tcs-tasks-action-btn--reject"
                          onClick={submitReject}
                        >
                          {tcsT(locale, 'taskRejectConfirm')}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : isPendingMatter ? (
                <p className="tcs-tasks-approval-readonly">{tcsT(locale, 'taskWaitingOtherAssignee')}</p>
              ) : null}
            </>
          ) : (
            <div className="tcs-tasks-approval-matter-empty">
              <h3 className="tcs-tasks-approval-matter-title">
                {tcsT(locale, 'taskApprovalMatterTitle')}
              </h3>
              <p>{tcsT(locale, 'taskNoPendingApproval')}</p>
            </div>
          )}
        </section>
        ) : null}
      </div>
    </div>
  )
}
