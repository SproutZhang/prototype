import type { AppLocale } from '../../../i18n/homeStrings'
import { TcsSectionHintIcon } from './TcsSectionHintIcon'
import { TcsContentEmptyState } from './TcsContentEmptyState'
import type { RecruitPassedCandidate } from '../data/recruitPassedCandidatesSeed'
import type { ProjectSpaceTasksScope } from '../types'
import { tcsT, type TeamCollaborationSpaceTranslationKey } from '../i18n/strings'

type RecruitPassedCandidatesSectionProps = {
  locale: AppLocale
  candidates: RecruitPassedCandidate[]
  onConfirm?: (candidateId: string) => void
  onOpenCandidate?: (candidateId: string) => void
  /** 嵌入「我的待办」等 Tab 主列表时隐藏版块标题 */
  embedded?: boolean
  /** embedded 时空状态文案对应的 scope */
  embeddedScope?: ProjectSpaceTasksScope
}

function statusLabel(locale: AppLocale, status: RecruitPassedCandidate['status']): string {
  return tcsT(
    locale,
    status === 'confirmed'
      ? 'recruitPassedCandidateStatusConfirmed'
      : 'recruitPassedCandidateStatusAwaitingConfirm',
  )
}

export function filterOnboardingCandidatesForUserScope(
  candidates: RecruitPassedCandidate[],
  scope: ProjectSpaceTasksScope,
): RecruitPassedCandidate[] {
  switch (scope) {
    case 'inbox':
      return candidates.filter((item) => item.status === 'awaiting_confirm')
    case 'done':
      return candidates.filter((item) => item.status === 'confirmed')
    case 'all':
      return candidates
    default:
      return []
  }
}

function onboardingEmptyMessageKey(scope: ProjectSpaceTasksScope): TeamCollaborationSpaceTranslationKey {
  switch (scope) {
    case 'inbox':
      return 'recruitPassedCandidatesEmpty'
    case 'done':
      return 'taskDoneEmpty'
    case 'all':
      return 'taskAllEmpty'
    default:
      return 'taskInboxEmpty'
  }
}

type RecruitPassedCandidateListItemsProps = {
  locale: AppLocale
  candidates: RecruitPassedCandidate[]
  onConfirm?: (candidateId: string) => void
  onOpenCandidate?: (candidateId: string) => void
}

export function RecruitPassedCandidateListItems({
  locale,
  candidates,
  onConfirm,
  onOpenCandidate,
}: RecruitPassedCandidateListItemsProps) {
  return (
    <>
      {candidates.map((candidate) => {
        const name = locale === 'zh' ? candidate.candidateNameZh : candidate.candidateNameEn
        const role = locale === 'zh' ? candidate.roleTitleZh : candidate.roleTitleEn
        const summary = locale === 'zh' ? candidate.summaryZh : candidate.summaryEn
        const awaiting = candidate.status === 'awaiting_confirm'
        const itemClass = [
          'tcs-tasks-list-item',
          awaiting ? 'tcs-tasks-list-item--pending' : 'tcs-tasks-list-item--approved',
        ].join(' ')
        const badgeClass = awaiting
          ? 'tcs-tasks-list-item-badge tcs-tasks-list-item-badge--pending'
          : 'tcs-tasks-list-item-badge tcs-tasks-list-item-badge--approved'

        return (
          <li key={candidate.id}>
            <div className={`${itemClass}${onOpenCandidate ? ' tcs-tasks-list-item--interactive' : ''}`}>
              {onOpenCandidate ? (
                <button
                  type="button"
                  className="tcs-tasks-list-item-open"
                  onClick={() => onOpenCandidate(candidate.id)}
                >
                  <span className="tcs-tasks-list-item-main">
                    <span className="tcs-tasks-list-item-title-row">
                      <strong className="tcs-tasks-list-item-title">{name}</strong>
                      <span className={badgeClass}>{statusLabel(locale, candidate.status)}</span>
                    </span>
                    <span className="tcs-tasks-list-item-sub">
                      {role} · {summary}
                    </span>
                    {awaiting ? (
                      <span className="tcs-tasks-list-item-progress tcs-tasks-list-item-progress--pending">
                        {tcsT(locale, 'recruitPassedCandidateConfirmHint')}
                      </span>
                    ) : null}
                  </span>
                </button>
              ) : (
                <span className="tcs-tasks-list-item-main">
                  <span className="tcs-tasks-list-item-title-row">
                    <strong className="tcs-tasks-list-item-title">{name}</strong>
                    <span className={badgeClass}>{statusLabel(locale, candidate.status)}</span>
                  </span>
                  <span className="tcs-tasks-list-item-sub">
                    {role} · {summary}
                  </span>
                  {awaiting ? (
                    <span className="tcs-tasks-list-item-progress tcs-tasks-list-item-progress--pending">
                      {tcsT(locale, 'recruitPassedCandidateConfirmHint')}
                    </span>
                  ) : null}
                </span>
              )}
              <span className="tcs-tasks-list-item-meta">
                <span className="tcs-tasks-list-item-time">{candidate.companyConfirmedAt}</span>
                {onOpenCandidate || (awaiting && onConfirm) ? (
                  <span className="tcs-tasks-list-item-actions">
                    {onOpenCandidate ? (
                      <button
                        type="button"
                        className="tcs-tasks-list-item-action tcs-tasks-list-item-action--secondary"
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenCandidate(candidate.id)
                        }}
                      >
                        {tcsT(locale, 'recruitPassedCandidateViewBtn')}
                      </button>
                    ) : null}
                    {awaiting && onConfirm ? (
                      <button
                        type="button"
                        className="tcs-tasks-list-item-action"
                        onClick={(event) => {
                          event.stopPropagation()
                          onConfirm(candidate.id)
                        }}
                      >
                        {tcsT(locale, 'recruitPassedCandidateConfirmBtn')}
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </span>
            </div>
          </li>
        )
      })}
    </>
  )
}

export function RecruitPassedCandidatesSection({
  locale,
  candidates,
  onConfirm,
  onOpenCandidate,
  embedded = false,
  embeddedScope = 'inbox',
}: RecruitPassedCandidatesSectionProps) {
  const list =
    candidates.length === 0 ? (
      embedded ? (
        <TcsContentEmptyState locale={locale} messageKey={onboardingEmptyMessageKey(embeddedScope)} />
      ) : (
        <TcsContentEmptyState locale={locale} messageKey={onboardingEmptyMessageKey('all')} />
      )
    ) : (
      <ul className="tcs-tasks-list">
        <RecruitPassedCandidateListItems
          locale={locale}
          candidates={candidates}
          onConfirm={onConfirm}
          onOpenCandidate={onOpenCandidate}
        />
      </ul>
    )

  if (embedded) {
    return list
  }

  return (
    <section
      className="tcs-recruit-passed-section"
      aria-labelledby="tcs-recruit-passed-candidates-title"
    >
      <div className="tcs-recruit-passed-section-head">
        <h3 id="tcs-recruit-passed-candidates-title" className="tcs-recruit-passed-section-title">
          {tcsT(locale, 'recruitPassedCandidatesTitle')}
        </h3>
        <TcsSectionHintIcon
          hintId="tcs-recruit-passed-candidates-hint"
          hint={tcsT(locale, 'recruitPassedCandidatesHint')}
          ariaLabel={tcsT(locale, 'recruitPassedCandidatesHintAria')}
        />
      </div>
      {list}
    </section>
  )
}
