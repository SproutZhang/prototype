import { useEffect, useRef, type RefObject } from 'react'
import type { AppLocale } from '../i18n/homeStrings'
import type { RecruitPassedCandidate } from '../modules/team-collaboration-space/data/recruitPassedCandidatesSeed'
import type { HomePendingApprovalTaskItem } from '../modules/team-collaboration-space/utils/homePendingApprovalTasks'
import { tcsT } from '../modules/team-collaboration-space/i18n/strings'

type HomePendingApprovalPopoverProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onboardingItems?: RecruitPassedCandidate[]
  approvalTasks?: HomePendingApprovalTaskItem[]
  anchorRef: RefObject<HTMLElement | null>
  onNavigateToInbox?: () => void
  onNavigateToTask?: (instanceId: string) => void
  onNavigateToRecruitJdReview?: (requestId: string) => void
  onConfirmCandidate?: (candidateId: string) => void
}

export function HomePendingApprovalPopover({
  locale,
  open,
  onClose,
  onboardingItems = [],
  approvalTasks = [],
  anchorRef,
  onNavigateToInbox,
  onNavigateToTask,
  onNavigateToRecruitJdReview,
  onConfirmCandidate,
}: HomePendingApprovalPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const hasItems = onboardingItems.length > 0 || approvalTasks.length > 0

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [anchorRef, onClose, open])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="home-pending-approval-popover"
      role="dialog"
      aria-label={tcsT(locale, 'taskScopeInbox')}
    >
      {onNavigateToInbox ? (
        <button
          type="button"
          className="home-pending-approval-popover-title home-pending-approval-popover-title-btn"
          onClick={onNavigateToInbox}
        >
          {tcsT(locale, 'taskScopeInbox')}
        </button>
      ) : (
        <div className="home-pending-approval-popover-title">{tcsT(locale, 'taskScopeInbox')}</div>
      )}
      {!hasItems ? (
        <p className="home-pending-approval-popover-empty">
          {tcsT(locale, 'homePendingApprovalPopoverEmpty')}
        </p>
      ) : (
        <ul className="home-pending-approval-popover-list">
          {onboardingItems.map((candidate) => {
            const name = locale === 'zh' ? candidate.candidateNameZh : candidate.candidateNameEn
            const role = locale === 'zh' ? candidate.roleTitleZh : candidate.roleTitleEn
            const summary = locale === 'zh' ? candidate.summaryZh : candidate.summaryEn
            return (
              <li key={candidate.id} className="home-pending-approval-popover-item">
                <button
                  type="button"
                  className="home-pending-approval-popover-item-link"
                  onClick={onNavigateToInbox}
                >
                  <span className="home-pending-approval-popover-item-head">
                    <strong className="home-pending-approval-popover-item-title">{name}</strong>
                    <span className="home-pending-approval-popover-item-badge">
                      {tcsT(locale, 'recruitPassedCandidateStatusAwaitingConfirm')}
                    </span>
                  </span>
                  <span className="home-pending-approval-popover-item-sub">
                    {role} · {summary}
                  </span>
                </button>
                {onConfirmCandidate ? (
                  <button
                    type="button"
                    className="home-pending-approval-popover-item-action"
                    onClick={(event) => {
                      event.stopPropagation()
                      onConfirmCandidate(candidate.id)
                    }}
                  >
                    {tcsT(locale, 'recruitPassedCandidateConfirmBtn')}
                  </button>
                ) : null}
              </li>
            )
          })}
          {approvalTasks.map((task) => (
            <li key={task.id} className="home-pending-approval-popover-item">
              <button
                type="button"
                className="home-pending-approval-popover-item-link"
                onClick={() => {
                  if (task.requestId && onNavigateToRecruitJdReview) {
                    onNavigateToRecruitJdReview(task.requestId)
                    return
                  }
                  if (task.instanceId && onNavigateToTask) {
                    onNavigateToTask(task.instanceId)
                    return
                  }
                  onNavigateToInbox?.()
                }}
              >
                <span className="home-pending-approval-popover-item-head">
                  <strong className="home-pending-approval-popover-item-title">{task.title}</strong>
                  <span className="home-pending-approval-popover-item-badge">
                    {tcsT(locale, 'taskStatusPending')}
                  </span>
                </span>
                <span className="home-pending-approval-popover-item-sub">{task.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
