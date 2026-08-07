import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { TCS_ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import type { UserInitiatedRequest } from '../data/userInitiatedRequestsSeed'
import { tcsT, type TeamCollaborationSpaceTranslationKey } from '../i18n/strings'
import { resolveCurrentMemberId } from '../utils/currentMember'

type RecruitJdReviewDetailPanelProps = {
  locale: AppLocale
  request: UserInitiatedRequest
  onApprove?: (requestId: string) => void
  onReject?: (requestId: string, reason: string) => void
}

type RecruitJdTimelineStepStatus = 'completed' | 'pending' | 'waiting' | 'skipped'

type RecruitJdTimelineStep = {
  id: string
  titleKey: TeamCollaborationSpaceTranslationKey
  status: RecruitJdTimelineStepStatus
  timestamp?: string
  isCurrent?: boolean
}

function memberName(memberId: string, locale: AppLocale): string {
  const member = TCS_ORG_MEMBERS_SEED.find((item) => item.id === memberId)
  if (!member) return memberId
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function stepStatusLabel(locale: AppLocale, status: RecruitJdTimelineStepStatus): string {
  switch (status) {
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
  status: RecruitJdTimelineStepStatus
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

function buildRecruitJdTimelineSteps(request: UserInitiatedRequest): RecruitJdTimelineStep[] {
  const isPending = request.status === 'pending'
  const isApproved = request.status === 'approved'
  const isRejected = request.status === 'rejected'

  return [
    {
      id: 'submit',
      titleKey: 'recruitJdTimelineStepSubmit',
      status: 'completed',
      timestamp: request.submittedAt,
    },
    {
      id: 'hr-review',
      titleKey: 'recruitJdTimelineStepHrReview',
      status: isPending ? 'pending' : 'completed',
      timestamp: request.submittedAt,
      isCurrent: isPending,
    },
    {
      id: 'publish',
      titleKey: 'recruitJdTimelineStepPublish',
      status: isApproved ? 'waiting' : isRejected ? 'skipped' : 'waiting',
    },
  ]
}

function buildMatterSummary(locale: AppLocale, request: UserInitiatedRequest): string {
  const initiator = memberName(request.initiatorMemberId, locale)
  const title = locale === 'zh' ? request.titleZh : request.titleEn
  return locale === 'zh'
    ? `请审核${initiator}提交的${title}是否符合公司招聘规范与编制要求。`
    : `Please review whether the ${title} submitted by ${initiator} meets company hiring standards and headcount requirements.`
}

function buildApprovalFields(
  locale: AppLocale,
  request: UserInitiatedRequest,
): { labelZh: string; labelEn: string; valueZh: string; valueEn: string }[] {
  const initiator = memberName(request.initiatorMemberId, locale)
  const title = locale === 'zh' ? request.titleZh : request.titleEn
  const summary = locale === 'zh' ? request.summaryZh : request.summaryEn
  const fields = [
    {
      labelZh: '发起人',
      labelEn: 'Initiator',
      valueZh: initiator,
      valueEn: initiator,
    },
    {
      labelZh: '招聘岗位',
      labelEn: 'Role',
      valueZh: title,
      valueEn: title,
    },
    {
      labelZh: '招聘需求',
      labelEn: 'Requirements',
      valueZh: summary,
      valueEn: summary,
    },
  ]

  if (request.ticketId) {
    fields.splice(2, 0, {
      labelZh: '申请单号',
      labelEn: 'Ticket ID',
      valueZh: request.ticketId,
      valueEn: request.ticketId,
    })
  }

  return fields
}

export function RecruitJdReviewDetailPanel({
  locale,
  request,
  onApprove,
  onReject,
}: RecruitJdReviewDetailPanelProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectReasonError, setRejectReasonError] = useState(false)

  const title = locale === 'zh' ? request.titleZh : request.titleEn
  const summary = locale === 'zh' ? request.summaryZh : request.summaryEn
  const isPending = request.status === 'pending'
  const matterDecision = isPending ? null : request.status
  const statusLabel = isPending
    ? tcsT(locale, 'taskStatusPending')
    : request.status === 'approved'
      ? tcsT(locale, 'userInitiatedStatusApproved')
      : tcsT(locale, 'userInitiatedStatusRejected')
  const matterStatusClass = isPending
    ? 'tcs-tasks-approval-matter-status--pending'
    : request.status === 'approved'
      ? 'tcs-tasks-approval-matter-status--approved'
      : 'tcs-tasks-approval-matter-status--rejected'
  const timelineSteps = buildRecruitJdTimelineSteps(request)
  const matterSummary = buildMatterSummary(locale, request)
  const matterFields = buildApprovalFields(locale, request)
  const assigneeName = memberName(resolveCurrentMemberId(), locale)
  const canActOnPending = isPending && Boolean(onApprove || onReject)

  const resetRejectForm = () => {
    setShowRejectForm(false)
    setRejectReason('')
    setRejectReasonError(false)
  }

  const submitReject = () => {
    if (!onReject) return
    const trimmed = rejectReason.trim()
    if (!trimmed) {
      setRejectReasonError(true)
      return
    }
    onReject(request.id, trimmed)
    resetRejectForm()
  }

  return (
    <div className="tcs-tasks-detail">
      <header className="tcs-tasks-detail-head">
        <div className="tcs-tasks-detail-head-main">
          <h2 className="tcs-tasks-detail-title">{title}</h2>
          <p className="tcs-tasks-detail-meta">
            {tcsT(locale, 'userInitiatedKindRecruit')} · {summary}
            {request.ticketId ? ` · ${request.ticketId}` : ''}
          </p>
        </div>
        <span className={`tcs-tasks-detail-status tcs-tasks-detail-status--${isPending ? 'running' : request.status === 'approved' ? 'completed' : 'failed'}`}>
          {isPending ? tcsT(locale, 'taskInstanceRunning') : tcsT(locale, 'taskInstanceCompleted')}
        </span>
      </header>

      <div className="tcs-tasks-detail-body">
        <section className="tcs-tasks-timeline" aria-label={tcsT(locale, 'taskTimelineAria')}>
          <h3 className="tcs-tasks-timeline-title">{tcsT(locale, 'taskTimelineTitle')}</h3>
          <ol className="tcs-tasks-timeline-list">
            {timelineSteps.map((step, index) => {
              const stepTitle = tcsT(locale, step.titleKey)
              return (
                <li
                  key={step.id}
                  className={[
                    'tcs-tasks-timeline-item',
                    `tcs-tasks-timeline-item--${step.status}`,
                    step.isCurrent ? 'is-current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="tcs-tasks-timeline-track">
                    <span className="tcs-tasks-timeline-dot">{index + 1}</span>
                    {index < timelineSteps.length - 1 ? (
                      <span className="tcs-tasks-timeline-line" aria-hidden="true" />
                    ) : null}
                  </div>
                  <div className="tcs-tasks-timeline-content">
                    {step.timestamp ? (
                      <time className="tcs-tasks-timeline-time">{step.timestamp}</time>
                    ) : null}
                    <div className="tcs-tasks-timeline-row">
                      <strong className="tcs-tasks-timeline-name">{stepTitle}</strong>
                      <StepTimelineStatusIcon
                        status={step.status}
                        label={stepStatusLabel(locale, step.status)}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="tcs-tasks-approval-matter" aria-label={tcsT(locale, 'taskActionPanelAria')}>
          <div className="tcs-tasks-approval-matter-head">
            <h3 className="tcs-tasks-approval-matter-title">{tcsT(locale, 'taskApprovalMatterTitle')}</h3>
            <span className={`tcs-tasks-approval-matter-status ${matterStatusClass}`}>{statusLabel}</span>
          </div>

          {matterDecision ? (
            <div className={`tcs-tasks-approval-result tcs-tasks-approval-result--${matterDecision}`}>
              <p className="tcs-tasks-approval-result-title">{tcsT(locale, 'taskApprovalResultTitle')}</p>
              <p className="tcs-tasks-approval-result-value">
                {matterDecision === 'approved'
                  ? tcsT(locale, 'taskApprovalResultApproved')
                  : tcsT(locale, 'taskApprovalResultRejected')}
              </p>
              <p className="tcs-tasks-approval-result-meta">
                {tcsT(locale, 'taskApprovalResultAt')}：{request.submittedAt}
              </p>
              {matterDecision === 'rejected' && request.rejectReason ? (
                <p className="tcs-tasks-approval-result-meta">
                  {tcsT(locale, 'taskApprovalResultReason')}：{request.rejectReason}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="tcs-tasks-approval-matter-card">
            <h4 className="tcs-tasks-approval-matter-step">
              {tcsT(locale, 'recruitJdTimelineStepHrReview')}
            </h4>
            <p className="tcs-tasks-approval-matter-summary">{matterSummary}</p>

            <div className="tcs-tasks-approval-matter-meta">
              <div className="tcs-tasks-approval-matter-meta-row">
                <span className="tcs-tasks-approval-matter-meta-k">{tcsT(locale, 'taskAssigneeLabel')}</span>
                <span className="tcs-tasks-approval-matter-meta-v">{assigneeName}</span>
              </div>
              <div className="tcs-tasks-approval-matter-meta-row">
                <span className="tcs-tasks-approval-matter-meta-k">
                  {tcsT(locale, 'taskApprovalRequestedAt')}
                </span>
                <span className="tcs-tasks-approval-matter-meta-v">{request.submittedAt}</span>
              </div>
            </div>

            <p className="tcs-tasks-approval-matter-section-title">
              {tcsT(locale, 'taskApprovalFieldsTitle')}
            </p>
            <dl className="tcs-tasks-approval-matter-fields">
              {matterFields.map((field) => (
                <div key={field.labelZh} className="tcs-tasks-approval-matter-field">
                  <dt>{locale === 'zh' ? field.labelZh : field.labelEn}</dt>
                  <dd>{locale === 'zh' ? field.valueZh : field.valueEn}</dd>
                </div>
              ))}
            </dl>
          </div>

          {canActOnPending ? (
            <div className="tcs-tasks-approval-actions">
              <div className="tcs-tasks-action-buttons">
                {onApprove ? (
                  <button
                    type="button"
                    className="tcs-tasks-action-btn tcs-tasks-action-btn--approve"
                    onClick={() => {
                      resetRejectForm()
                      onApprove(request.id)
                    }}
                  >
                    {tcsT(locale, 'taskApprove')}
                  </button>
                ) : null}
                {onReject ? (
                  <button
                    type="button"
                    className={`tcs-tasks-action-btn tcs-tasks-action-btn--reject${showRejectForm ? ' is-active' : ''}`}
                    onClick={() => setShowRejectForm((open) => !open)}
                    aria-expanded={showRejectForm}
                  >
                    {tcsT(locale, 'taskReject')}
                  </button>
                ) : null}
              </div>
              {showRejectForm ? (
                <div className="tcs-tasks-reject-form">
                  <label className="tcs-tasks-reject-label" htmlFor="tcs-recruit-jd-reject-reason">
                    {tcsT(locale, 'taskRejectReasonLabel')}
                  </label>
                  <textarea
                    id="tcs-recruit-jd-reject-reason"
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
          ) : null}
        </section>
      </div>
    </div>
  )
}
