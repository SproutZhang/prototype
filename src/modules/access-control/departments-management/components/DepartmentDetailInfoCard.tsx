import { useState, type ReactNode } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
type DepartmentDetailInfoCardProps = {
  locale: AppLocale
  departmentName: string
  parentLabel: string
  isOrgRootParent: boolean
  departmentCode: string
  departmentTypeLabel: string
  description: string
}

function ParentDepartmentIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="3.5" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path
        d="M8 5v2M8 7H4.8M8 7h3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DepartmentCodeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M5.5 5.5L3 8l2.5 2.5M10.5 5.5L13 8l-2.5 2.5M9 3L7 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DepartmentTypeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M2.5 5.5L8 2.5l5.5 3v5L8 13.5l-5.5-3v-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 6v5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DepartmentDescriptionIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M3 4.5h10M3 8h10M3 11.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function OrgRootIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="4" r="2" fill="#3b82f6" />
      <circle cx="4" cy="12" r="2" fill="#3b82f6" />
      <circle cx="12" cy="12" r="2" fill="#3b82f6" />
    </svg>
  )
}

type DetailRowProps = {
  icon: ReactNode
  label: string
  value: ReactNode
}

function DetailChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
      className={`ac-dept-detail-card-chevron${expanded ? ' is-expanded' : ''}`}
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="ac-dept-detail-row">
      <div className="ac-dept-detail-row-main">
        <span className="ac-dept-detail-row-label">
          <span className="ac-dept-detail-row-icon">{icon}</span>
          {label}
        </span>
        <span className="ac-dept-detail-row-value">{value}</span>
      </div>
    </div>
  )
}

export function DepartmentDetailInfoCard({
  locale,
  departmentName,
  parentLabel,
  isOrgRootParent,
  departmentCode,
  departmentTypeLabel,
  description,
}: DepartmentDetailInfoCardProps) {
  const [expanded, setExpanded] = useState(false)
  const emptyPlaceholder = acT(locale, 'departmentDetailEmptyValue')
  const parentValue = parentLabel ? (
    <span className="ac-dept-detail-parent-value">
      {isOrgRootParent ? <OrgRootIcon /> : null}
      {parentLabel}
    </span>
  ) : (
    emptyPlaceholder
  )

  const displayDepartmentName = departmentName || emptyPlaceholder

  return (
    <section
      className={`ac-dept-detail-card${expanded ? ' is-expanded' : ' is-collapsed'}`}
      aria-label={acT(locale, 'departmentDetailTitle')}
    >
      <header className="ac-dept-detail-card-header">
        <button
          type="button"
          className="ac-dept-detail-card-toggle"
          aria-expanded={expanded}
          aria-label={`${acT(locale, 'departmentDetailTitle')}: ${displayDepartmentName}`}
          onClick={() => setExpanded((prev) => !prev)}
        >
          <h3 className="ac-dept-detail-card-title">{displayDepartmentName}</h3>
          <DetailChevronIcon expanded={expanded} />
        </button>
      </header>

      {expanded ? (
      <div className="ac-dept-detail-rows">
        <DetailRow
          icon={<ParentDepartmentIcon />}
          label={acT(locale, 'departmentFieldParent')}
          value={parentValue}
        />
        <DetailRow
          icon={<DepartmentCodeIcon />}
          label={acT(locale, 'departmentFieldCode')}
          value={departmentCode || emptyPlaceholder}
        />
        <DetailRow
          icon={<DepartmentTypeIcon />}
          label={acT(locale, 'departmentFieldType')}
          value={
            departmentTypeLabel ? (
              <span className="ac-dept-detail-type-badge">
                <span className="ac-dept-detail-type-badge-dot" aria-hidden="true" />
                {departmentTypeLabel}
              </span>
            ) : (
              emptyPlaceholder
            )
          }
        />
        <div className="ac-dept-detail-row ac-dept-detail-row--stacked">
          <div className="ac-dept-detail-row-label">
            <span className="ac-dept-detail-row-icon">
              <DepartmentDescriptionIcon />
            </span>
            {acT(locale, 'departmentDetailDescriptionLabel')}
          </div>
          <p className="ac-dept-detail-desc">
            {description.trim() || emptyPlaceholder}
          </p>
        </div>
      </div>
      ) : null}
    </section>
  )
}
