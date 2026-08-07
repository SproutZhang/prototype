import { useState, type ReactNode } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT, type AccessControlTranslationKey } from '../../i18n/strings'
import {
  HR_COMPENSATION_LINE_A,
  HR_COMPENSATION_LINE_B,
  HR_COMPENSATION_METRICS,
  HR_OKR_RANKING,
  HR_OKR_RINGS,
  HR_PERFORMANCE_DONUT,
  HR_PERFORMANCE_LINE_A,
  HR_PERFORMANCE_LINE_B,
  HR_QUICK_ENTRIES,
  HR_RECRUITMENT_FUNNEL,
  HR_TODO_ITEMS,
  HR_TRAINING_DONUT,
  type HrDonutSegment,
  type HrQuickEntryItem,
} from '../data/hrDashboardSeed'

const HR_TODO_TIME_OPTIONS = [
  { value: 'today', labelKey: 'hrTodoTimeToday' },
  { value: 'week', labelKey: 'hrTodoTimeWeek' },
  { value: 'month', labelKey: 'hrTodoTimeMonth' },
  { value: 'quarter', labelKey: 'hrTodoTimeQuarter' },
] as const

type HrTodoTimeRange = (typeof HR_TODO_TIME_OPTIONS)[number]['value']

function HrTodoPanel({ locale }: { locale: AppLocale }) {
  const [timeRange, setTimeRange] = useState<HrTodoTimeRange>('week')

  return (
    <article className="ac-hr-dash-card ac-hr-dash-card--todo">
      <header className="ac-hr-dash-card__head">
        <span className="ac-hr-dash-card__icon ac-hr-dash-card__icon--todo" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="ac-hr-dash-card__title">{acT(locale, 'hrTodoTitle')}</h3>
      </header>
      <div className="ac-hr-todo-time">
        <label className="ac-hr-todo-time__label" htmlFor="ac-hr-todo-time-select">
          {acT(locale, 'hrTodoTimeLabel')}
        </label>
        <div className="ac-hr-todo-time__select-wrap">
          <select
            id="ac-hr-todo-time-select"
            className="ac-hr-todo-time__select"
            value={timeRange}
            aria-label={acT(locale, 'hrTodoTimeAria')}
            onChange={(event) => setTimeRange(event.target.value as HrTodoTimeRange)}
          >
            {HR_TODO_TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {acT(locale, option.labelKey)}
              </option>
            ))}
          </select>
          <span className="ac-hr-todo-time__chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>
      <ul className="ac-hr-todo-list">
        {HR_TODO_ITEMS.map((item) => (
          <li key={item.id}>
            <button type="button" className="ac-hr-todo-list__item">
              <span className="ac-hr-todo-list__label">
                {acT(locale, item.labelKey as AccessControlTranslationKey)}
              </span>
              <span
                className={`ac-hr-todo-list__badge${item.tone === 'urgent' ? ' ac-hr-todo-list__badge--urgent' : ''}`}
              >
                {item.count}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}

type HrDashboardPanelsProps = {
  locale: AppLocale
}

function HrCardShell({
  locale,
  titleKey,
  icon,
  children,
  className = '',
}: {
  locale: AppLocale
  titleKey: AccessControlTranslationKey
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <article className={`ac-hr-dash-card ${className}`.trim()}>
      <header className="ac-hr-dash-card__head">
        <span className="ac-hr-dash-card__icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="ac-hr-dash-card__title">{acT(locale, titleKey)}</h3>
      </header>
      <div className="ac-hr-dash-card__body">{children}</div>
    </article>
  )
}

function HrFunnelChart({ locale }: { locale: AppLocale }) {
  const max = HR_RECRUITMENT_FUNNEL[0]?.value ?? 1
  const widths = [100, 78, 58, 38]

  return (
    <div className="ac-hr-funnel">
      {HR_RECRUITMENT_FUNNEL.map((step, index) => {
        const label = acT(locale, step.labelKey)
        const width = widths[index] ?? 40
        return (
          <div key={step.labelKey} className="ac-hr-funnel__row">
            <div className="ac-hr-funnel__bar-wrap">
              <div
                className="ac-hr-funnel__bar"
                style={{ width: `${width}%`, opacity: 1 - index * 0.12 }}
                title={`${label} ${step.value}`}
              >
                <span className="ac-hr-funnel__value">{step.value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
              </div>
            </div>
            <span className="ac-hr-funnel__label">{label}</span>
          </div>
        )
      })}
      <span className="ac-hr-visually-hidden">
        {acT(locale, 'hrRecruitFunnelAria').replace('{max}', String(max))}
      </span>
    </div>
  )
}

function buildLinePath(points: number[], width: number, height: number, pad = 8): string {
  if (points.length === 0) return ''
  const stepX = (width - pad * 2) / Math.max(points.length - 1, 1)
  return points
    .map((value, index) => {
      const x = pad + index * stepX
      const y = height - pad - (value / 100) * (height - pad * 2)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function HrLineChart({
  seriesA,
  seriesB,
  colorA = '#3b82f6',
  colorB = '#f59e0b',
}: {
  seriesA: number[]
  seriesB: number[]
  colorA?: string
  colorB?: string
}) {
  const width = 320
  const height = 120
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  return (
    <div className="ac-hr-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="ac-hr-line-chart__svg" aria-hidden="true">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - 8 - (tick / 100) * (height - 16)
          return (
            <line
              key={tick}
              x1={8}
              y1={y}
              x2={width - 8}
              y2={y}
              className="ac-hr-line-chart__grid"
            />
          )
        })}
        <path d={buildLinePath(seriesA, width, height)} fill="none" stroke={colorA} strokeWidth="2.5" />
        <path d={buildLinePath(seriesB, width, height)} fill="none" stroke={colorB} strokeWidth="2.5" />
      </svg>
      <div className="ac-hr-line-chart__axis">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  )
}

function HrDonutChart({
  locale,
  segments,
  centerValue,
  centerLabelKey,
}: {
  locale: AppLocale
  segments: HrDonutSegment[]
  centerValue: string
  centerLabelKey: AccessControlTranslationKey
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0)
  let offset = 0
  const radius = 42
  const circumference = 2 * Math.PI * radius

  return (
    <div className="ac-hr-donut">
      <ul className="ac-hr-donut__legend">
        {segments.map((segment) => (
          <li key={segment.labelKey}>
            <span className="ac-hr-donut__dot" style={{ background: segment.color }} />
            <span className="ac-hr-donut__legend-label">{acT(locale, segment.labelKey as AccessControlTranslationKey)}</span>
            <span className="ac-hr-donut__legend-value">{segment.value}%</span>
          </li>
        ))}
      </ul>
      <div className="ac-hr-donut__chart">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="14" />
          {segments.map((segment) => {
            const length = (segment.value / Math.max(total, 1)) * circumference
            const dasharray = `${length} ${circumference - length}`
            const dashoffset = -offset
            offset += length
            return (
              <circle
                key={segment.labelKey}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                transform="rotate(-90 60 60)"
              />
            )
          })}
        </svg>
        <div className="ac-hr-donut__center">
          <strong>{centerValue}</strong>
          <span>{acT(locale, centerLabelKey)}</span>
        </div>
      </div>
    </div>
  )
}

function HrProgressRing({
  locale,
  labelKey,
  percent,
  color,
}: {
  locale: AppLocale
  labelKey: AccessControlTranslationKey
  percent: number
  color: string
}) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const length = (percent / 100) * circumference

  return (
    <div className="ac-hr-progress-ring">
      <div className="ac-hr-progress-ring__chart">
        <svg viewBox="0 0 88 88" aria-hidden="true">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#eef0f3" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${length} ${circumference - length}`}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <span className="ac-hr-progress-ring__value">{percent}%</span>
      </div>
      <span className="ac-hr-progress-ring__label">{acT(locale, labelKey)}</span>
    </div>
  )
}

function HrQuickEntryIcon({ icon }: { icon: HrQuickEntryItem['icon'] }) {
  switch (icon) {
    case 'roster':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 9h8M8 12h8M8 15h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'onboarding':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v8l4 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'offboarding':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 12h6M12 9v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 20h14a2 2 0 0 0 2-2V8l-4-4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'transfer':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h10M17 7l-3-3M17 7l-3 3M17 17H7M7 17l3 3M7 17l3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'contract':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 4h8l4 4v12H8V4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 4v4h4M10 12h6M10 15h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'attendance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 3v4M16 3v4M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'payroll':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v8M9 10.5h4a1.5 1.5 0 0 1 0 3H9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'report':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18V9l4-2 4 2v9M14 18V11l4-2v9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}

export function HrDashboardPanels({ locale }: HrDashboardPanelsProps) {
  return (
    <div className="ac-hr-dashboard">
      <div className="ac-hr-dashboard__main">
        <HrCardShell
          locale={locale}
          titleKey="hrCardRecruitment"
          className="ac-hr-dash-card--recruitment"
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4h8v4H8V4ZM6 8h12v12H6V8Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        >
          <HrFunnelChart locale={locale} />
        </HrCardShell>

        <HrCardShell
          locale={locale}
          titleKey="hrCardCompensation"
          className="ac-hr-dash-card--compensation"
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v8M9 10.5h4a1.5 1.5 0 0 1 0 3H9" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        >
          <div className="ac-hr-pay-tabs" role="tablist" aria-label={acT(locale, 'hrPayTabsAria')}>
            <button type="button" className="ac-hr-pay-tabs__item is-active" role="tab" aria-selected="true">
              {acT(locale, 'hrPayTabOverview')}
            </button>
            <button type="button" className="ac-hr-pay-tabs__item" role="tab" aria-selected="false">
              {acT(locale, 'hrPayTabTrend')}
            </button>
          </div>
          <HrLineChart seriesA={HR_COMPENSATION_LINE_A} seriesB={HR_COMPENSATION_LINE_B} />
          <div className="ac-hr-metric-grid">
            {HR_COMPENSATION_METRICS.map((metric) => (
              <div key={metric.labelKey} className="ac-hr-metric-grid__item">
                <span className="ac-hr-metric-grid__label">
                  {acT(locale, metric.labelKey as AccessControlTranslationKey)}
                </span>
                <strong className="ac-hr-metric-grid__value">{metric.value}</strong>
              </div>
            ))}
          </div>
        </HrCardShell>

        <HrCardShell
          locale={locale}
          titleKey="hrCardPerformance"
          className="ac-hr-dash-card--performance"
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18V8l4-2 4 2v10M14 10l4-2v10" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        >
          <div className="ac-hr-split-charts ac-hr-split-charts--stacked">
            <HrLineChart seriesA={HR_PERFORMANCE_LINE_A} seriesB={HR_PERFORMANCE_LINE_B} colorA="#22c55e" colorB="#3b82f6" />
            <HrDonutChart
              locale={locale}
              segments={HR_PERFORMANCE_DONUT}
              centerValue="86"
              centerLabelKey="hrPerfCenterLabel"
            />
          </div>
        </HrCardShell>

        <HrCardShell
          locale={locale}
          titleKey="hrCardTraining"
          className="ac-hr-dash-card--training"
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8l8-4 8 4-8 4-8-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 12v8M6 10v6M18 10v6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        >
          <div className="ac-hr-split-charts ac-hr-split-charts--stacked">
            <HrDonutChart
              locale={locale}
              segments={HR_TRAINING_DONUT}
              centerValue="128"
              centerLabelKey="hrTrainCenterLabel"
            />
            <div className="ac-hr-metric-grid ac-hr-metric-grid--compact">
              <div className="ac-hr-metric-grid__item">
                <span className="ac-hr-metric-grid__label">{acT(locale, 'hrTrainMetricCourses')}</span>
                <strong className="ac-hr-metric-grid__value">24</strong>
              </div>
              <div className="ac-hr-metric-grid__item">
                <span className="ac-hr-metric-grid__label">{acT(locale, 'hrTrainMetricHours')}</span>
                <strong className="ac-hr-metric-grid__value">1,860</strong>
              </div>
            </div>
          </div>
        </HrCardShell>

        <HrCardShell
          locale={locale}
          titleKey="hrCardOkr"
          className="ac-hr-dash-card--okr"
          icon={
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        >
          <div className="ac-hr-okr">
            <div className="ac-hr-okr__rings">
              {HR_OKR_RINGS.map((ring) => (
                <HrProgressRing
                  key={ring.labelKey}
                  locale={locale}
                  labelKey={ring.labelKey as AccessControlTranslationKey}
                  percent={ring.percent}
                  color={ring.color}
                />
              ))}
            </div>
            <div className="ac-hr-okr__ranking">
              <h4 className="ac-hr-okr__ranking-title">{acT(locale, 'hrOkrRankingTitle')}</h4>
              <ol className="ac-hr-okr__ranking-list">
                {HR_OKR_RANKING.map((item, index) => {
                  const name = locale === 'zh' ? item.nameZh : item.nameEn
                  return (
                    <li key={item.nameZh} className="ac-hr-okr__ranking-item">
                      <span className="ac-hr-okr__rank">{index + 1}</span>
                      <span className="ac-hr-okr__avatar" style={{ background: item.accent }}>
                        {name.slice(0, 1)}
                      </span>
                      <span className="ac-hr-okr__name">{name}</span>
                      <span className="ac-hr-okr__growth">{item.growth}</span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </HrCardShell>
      </div>

      <aside className="ac-hr-dashboard__aside">
        <HrTodoPanel locale={locale} />

        <article className="ac-hr-dash-card ac-hr-dash-card--quick">
          <header className="ac-hr-dash-card__head">
            <span className="ac-hr-dash-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 7h16M4 12h10M4 17h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <h3 className="ac-hr-dash-card__title">{acT(locale, 'hrQuickEntryTitle')}</h3>
          </header>
          <div className="ac-hr-quick-grid">
            {HR_QUICK_ENTRIES.map((entry) => (
              <button key={entry.id} type="button" className="ac-hr-quick-grid__item">
                <span className="ac-hr-quick-grid__icon">
                  <HrQuickEntryIcon icon={entry.icon} />
                </span>
                <span className="ac-hr-quick-grid__label">
                  {acT(locale, entry.labelKey as AccessControlTranslationKey)}
                </span>
              </button>
            ))}
          </div>
        </article>
      </aside>
    </div>
  )
}
