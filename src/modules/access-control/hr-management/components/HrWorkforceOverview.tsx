import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  HR_EMPLOYMENT_TYPE_STAT_KEYS,
  HR_TENURE_STAT_KEYS,
  type HrWorkforceStatKey,
  type HrWorkforceStats,
} from '../data/hrWorkforceSeed'

const STAT_LABEL_KEYS: Record<
  HrWorkforceStatKey,
  | 'hrStatTotal'
  | 'hrStatFullTime'
  | 'hrStatPartTime'
  | 'hrStatIntern'
  | 'hrStatLaborDispatch'
  | 'hrStatProbation'
  | 'hrStatRegularized'
  | 'hrStatPendingResignation'
> = {
  total: 'hrStatTotal',
  fullTime: 'hrStatFullTime',
  partTime: 'hrStatPartTime',
  intern: 'hrStatIntern',
  laborDispatch: 'hrStatLaborDispatch',
  probation: 'hrStatProbation',
  regularized: 'hrStatRegularized',
  pendingResignation: 'hrStatPendingResignation',
}

type HrWorkforceOverviewProps = {
  locale: AppLocale
  stats: HrWorkforceStats
}

function HrStatCard({
  locale,
  statKey,
  value,
}: {
  locale: AppLocale
  statKey: HrWorkforceStatKey
  value: number
}) {
  const label = acT(locale, STAT_LABEL_KEYS[statKey])

  return (
    <article className="ac-hr-stat-card">
      <span className="ac-hr-stat-card__label">{label}</span>
      <span className="ac-hr-stat-card__value" aria-label={`${label}：${value}`}>
        {value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
      </span>
    </article>
  )
}

export function HrWorkforceOverview({ locale, stats }: HrWorkforceOverviewProps) {
  return (
    <div className="ac-hr-overview">
      <div className="ac-hr-stats-panel" aria-label={acT(locale, 'hrStatsGridAria')}>
        <div className="ac-hr-stats-row">
          {HR_EMPLOYMENT_TYPE_STAT_KEYS.map((key) => (
            <HrStatCard key={key} locale={locale} statKey={key} value={stats[key]} />
          ))}
          <span className="ac-hr-stats-divider" aria-hidden="true" />
          {HR_TENURE_STAT_KEYS.map((key) => (
            <HrStatCard key={key} locale={locale} statKey={key} value={stats[key]} />
          ))}
        </div>
      </div>
    </div>
  )
}
