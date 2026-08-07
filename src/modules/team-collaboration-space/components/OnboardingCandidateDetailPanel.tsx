import type { AppLocale } from '../../../i18n/homeStrings'
import { TCS_ORG_MEMBERS_SEED } from '../data/orgMembersSeed'
import type { RecruitPassedCandidate } from '../data/recruitPassedCandidatesSeed'
import { tcsT } from '../i18n/strings'

type OnboardingCandidateDetailPanelProps = {
  locale: AppLocale
  candidate: RecruitPassedCandidate
  onConfirm?: (candidateId: string) => void
}

function memberName(memberId: string, locale: AppLocale): string {
  const member = TCS_ORG_MEMBERS_SEED.find((item) => item.id === memberId)
  if (!member) return memberId
  return locale === 'zh' ? member.nameZh : member.nameEn
}

export function OnboardingCandidateDetailPanel({
  locale,
  candidate,
  onConfirm,
}: OnboardingCandidateDetailPanelProps) {
  const name = locale === 'zh' ? candidate.candidateNameZh : candidate.candidateNameEn
  const role = locale === 'zh' ? candidate.roleTitleZh : candidate.roleTitleEn
  const summary = locale === 'zh' ? candidate.summaryZh : candidate.summaryEn
  const notes =
    locale === 'zh'
      ? candidate.detailNotesZh ?? candidate.detailNotesEn
      : candidate.detailNotesEn ?? candidate.detailNotesZh
  const awaiting = candidate.status === 'awaiting_confirm'
  const statusLabel = tcsT(
    locale,
    awaiting ? 'recruitPassedCandidateStatusAwaitingConfirm' : 'recruitPassedCandidateStatusConfirmed',
  )
  const statusClass = awaiting
    ? 'tcs-tasks-approval-matter-status--pending'
    : 'tcs-tasks-approval-matter-status--approved'

  const fields: { label: string; value: string }[] = [
    { label: tcsT(locale, 'onboardingCandidateFieldCandidate'), value: name },
    { label: tcsT(locale, 'onboardingCandidateFieldRole'), value: role },
    { label: tcsT(locale, 'onboardingCandidateFieldCompanyConfirmed'), value: candidate.companyConfirmedAt },
    { label: tcsT(locale, 'onboardingCandidateFieldExpectedStart'), value: summary },
    { label: tcsT(locale, 'onboardingCandidateFieldHm'), value: memberName(candidate.hmMemberId, locale) },
    { label: tcsT(locale, 'onboardingCandidateFieldStatus'), value: statusLabel },
  ]

  if (candidate.hmConfirmedAt) {
    fields.push({
      label: tcsT(locale, 'onboardingCandidateFieldHmConfirmed'),
      value: candidate.hmConfirmedAt,
    })
  }

  return (
    <div className="tcs-tasks-detail">
      <header className="tcs-tasks-detail-head">
        <div className="tcs-tasks-detail-head-main">
          <h2 className="tcs-tasks-detail-title">
            {name} · {role}
          </h2>
          <p className="tcs-tasks-detail-meta">{summary}</p>
        </div>
        <span className={`tcs-tasks-approval-matter-status ${statusClass}`}>{statusLabel}</span>
      </header>

      <div className="tcs-tasks-detail-body tcs-tasks-detail-body--single-panel">
        <section
          className="tcs-tasks-approval-matter"
          aria-label={tcsT(locale, 'onboardingCandidateDetailTitle')}
        >
          <div className="tcs-tasks-approval-matter-head">
            <h3 className="tcs-tasks-approval-matter-title">
              {tcsT(locale, 'onboardingCandidateDetailTitle')}
            </h3>
            <span className={`tcs-tasks-approval-matter-status ${statusClass}`}>{statusLabel}</span>
          </div>

          <dl className="tcs-tasks-approval-matter-fields">
            {fields.map((field) => (
              <div key={field.label} className="tcs-tasks-approval-matter-field">
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>

          {notes ? (
            <div className="tcs-onboarding-candidate-detail-notes">
              <h4 className="tcs-onboarding-candidate-detail-notes-title">
                {tcsT(locale, 'onboardingCandidateFieldNotes')}
              </h4>
              <p>{notes}</p>
            </div>
          ) : null}

          {awaiting && onConfirm ? (
            <div className="tcs-onboarding-candidate-detail-actions">
              <button
                type="button"
                className="tcs-tasks-list-item-action"
                onClick={() => onConfirm(candidate.id)}
              >
                {tcsT(locale, 'recruitPassedCandidateConfirmBtn')}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
