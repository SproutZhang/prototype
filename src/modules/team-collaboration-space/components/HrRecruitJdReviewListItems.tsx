import type { AppLocale } from '../../../i18n/homeStrings'
import type { UserInitiatedRequest } from '../data/userInitiatedRequestsSeed'
import { tcsT } from '../i18n/strings'

type HrRecruitJdReviewListItemsProps = {
  locale: AppLocale
  requests: UserInitiatedRequest[]
  onOpenRequest?: (requestId: string) => void
}

export function HrRecruitJdReviewListItems({
  locale,
  requests,
  onOpenRequest,
}: HrRecruitJdReviewListItemsProps) {
  return (
    <>
      {requests.map((request) => {
        const title = locale === 'zh' ? request.titleZh : request.titleEn
        const summary = locale === 'zh' ? request.summaryZh : request.summaryEn
        const progress = locale === 'zh' ? request.progressZh : request.progressEn
        const kind = tcsT(locale, 'userInitiatedKindRecruit')

        const main = (
          <>
            <span className="tcs-tasks-list-item-main">
              <span className="tcs-tasks-list-item-title-row">
                <strong className="tcs-tasks-list-item-title">{title}</strong>
                <span className="tcs-tasks-list-item-badge tcs-tasks-list-item-badge--pending">
                  {tcsT(locale, 'taskStatusPending')}
                </span>
              </span>
              <span className="tcs-tasks-list-item-sub">
                {kind} · {summary}
                {request.ticketId ? ` · ${request.ticketId}` : ''}
              </span>
              <span className="tcs-tasks-list-item-progress tcs-tasks-list-item-progress--pending">
                {progress}
              </span>
            </span>
            <span className="tcs-tasks-list-item-meta">
              <span className="tcs-tasks-list-item-time">{request.submittedAt}</span>
            </span>
          </>
        )

        return (
          <li key={request.id}>
            {onOpenRequest ? (
              <button
                type="button"
                className="tcs-tasks-list-item tcs-tasks-list-item--pending"
                onClick={() => onOpenRequest(request.id)}
              >
                {main}
              </button>
            ) : (
              <div className="tcs-tasks-list-item tcs-tasks-list-item--pending">{main}</div>
            )}
          </li>
        )
      })}
    </>
  )
}
