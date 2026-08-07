import type { AppLocale } from '../../../i18n/homeStrings'
import type { UserInitiatedRequest, UserInitiatedRequestKind } from '../data/userInitiatedRequestsSeed'
import { tcsT } from '../i18n/strings'

type UserInitiatedRequestsListProps = {
  locale: AppLocale
  requests: UserInitiatedRequest[]
}

function kindLabel(locale: AppLocale, kind: UserInitiatedRequestKind): string {
  switch (kind) {
    case 'recruit':
      return tcsT(locale, 'userInitiatedKindRecruit')
    case 'leave':
      return tcsT(locale, 'userInitiatedKindLeave')
    case 'expense':
      return tcsT(locale, 'userInitiatedKindExpense')
  }
}

function statusLabel(locale: AppLocale, status: UserInitiatedRequest['status']): string {
  switch (status) {
    case 'approved':
      return tcsT(locale, 'userInitiatedStatusApproved')
    case 'rejected':
      return tcsT(locale, 'userInitiatedStatusRejected')
    default:
      return tcsT(locale, 'userInitiatedStatusPending')
  }
}

function itemVariant(status: UserInitiatedRequest['status']): string {
  switch (status) {
    case 'approved':
      return 'tcs-tasks-list-item--approved'
    case 'rejected':
      return 'tcs-tasks-list-item--rejected'
    default:
      return 'tcs-tasks-list-item--running'
  }
}

function badgeClass(status: UserInitiatedRequest['status']): string {
  switch (status) {
    case 'approved':
      return 'tcs-tasks-list-item-badge tcs-tasks-list-item-badge--approved'
    case 'rejected':
      return 'tcs-tasks-list-item-badge tcs-tasks-list-item-badge--rejected'
    default:
      return 'tcs-tasks-list-item-badge tcs-tasks-list-item-badge--instance-running'
  }
}

function progressClass(status: UserInitiatedRequest['status']): string {
  switch (status) {
    case 'approved':
      return 'tcs-tasks-list-item-progress tcs-tasks-list-item-progress--completed'
    case 'rejected':
      return 'tcs-tasks-list-item-progress tcs-tasks-list-item-progress--failed'
    default:
      return 'tcs-tasks-list-item-progress tcs-tasks-list-item-progress--running'
  }
}

export function UserInitiatedRequestListItems({ locale, requests }: UserInitiatedRequestsListProps) {
  return (
    <>
      {requests.map((request) => {
        const title = locale === 'zh' ? request.titleZh : request.titleEn
        const summary = locale === 'zh' ? request.summaryZh : request.summaryEn
        const progress = locale === 'zh' ? request.progressZh : request.progressEn
        const kind = kindLabel(locale, request.kind)
        return (
          <li key={request.id}>
            <div className={`tcs-tasks-list-item ${itemVariant(request.status)}`}>
              <span className="tcs-tasks-list-item-main">
                <span className="tcs-tasks-list-item-title-row">
                  <strong className="tcs-tasks-list-item-title">{title}</strong>
                  <span className={badgeClass(request.status)}>
                    {statusLabel(locale, request.status)}
                  </span>
                </span>
                <span className="tcs-tasks-list-item-sub">
                  {kind} · {summary}
                  {request.ticketId ? ` · ${request.ticketId}` : ''}
                </span>
                <span className={progressClass(request.status)}>{progress}</span>
              </span>
              <span className="tcs-tasks-list-item-meta">
                <span className="tcs-tasks-list-item-time">{request.submittedAt}</span>
              </span>
            </div>
          </li>
        )
      })}
    </>
  )
}

export function UserInitiatedRequestsList({ locale, requests }: UserInitiatedRequestsListProps) {
  return (
    <ul className="tcs-tasks-list">
      <UserInitiatedRequestListItems locale={locale} requests={requests} />
    </ul>
  )
}
