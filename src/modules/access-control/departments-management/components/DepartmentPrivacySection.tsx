import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type DepartmentPrivacySectionProps = {
  locale: AppLocale
  expanded: boolean
  onToggle: () => void
  includeHiddenSubDepartments: boolean
  includeSelfVisibleSubDepartments: boolean
  includeAssociatedOrgs: boolean
  hiddenIncludeText: string
  selfVisibleIncludeText: string
  associatedOrgsIncludeText: string
  onIncludeHiddenChange: (checked: boolean) => void
  onIncludeSelfVisibleChange: (checked: boolean) => void
  onIncludeAssociatedOrgsChange: (checked: boolean) => void
}

function PrivacyChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
      className={`ac-dept-edit-privacy-chevron${expanded ? ' is-expanded' : ''}`}
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

export function DepartmentPrivacySection({
  locale,
  expanded,
  onToggle,
  includeHiddenSubDepartments,
  includeSelfVisibleSubDepartments,
  includeAssociatedOrgs,
  hiddenIncludeText,
  selfVisibleIncludeText,
  associatedOrgsIncludeText,
  onIncludeHiddenChange,
  onIncludeSelfVisibleChange,
  onIncludeAssociatedOrgsChange,
}: DepartmentPrivacySectionProps) {
  const privacyLabel = acT(locale, 'departmentEditPrivacySection')

  return (
    <div className="ac-dept-edit-privacy-section">
      <div
        className={`ac-dept-edit-privacy-panel${expanded ? ' is-expanded' : ' is-collapsed'}`}
      >
        <button
          type="button"
          className="ac-dept-edit-privacy-toggle"
          aria-expanded={expanded}
          aria-label={privacyLabel}
          onClick={onToggle}
        >
          <PrivacyChevronIcon expanded={expanded} />
        </button>

        {expanded ? (
          <div className="ac-dept-edit-privacy-content">
            <div className="ac-dept-edit-privacy-option">
              <label className="ac-dept-edit-privacy-option-head">
                <input
                  type="checkbox"
                  checked={includeHiddenSubDepartments}
                  onChange={(event) => onIncludeHiddenChange(event.target.checked)}
                />
                <span>{acT(locale, 'departmentIncludeHiddenSubDepts')}</span>
              </label>
              <p className="ac-dept-edit-privacy-option-hint">
                {acT(locale, 'departmentHiddenSubDeptsInclude')}
                {hiddenIncludeText}
              </p>
            </div>

            <div className="ac-dept-edit-privacy-option">
              <label className="ac-dept-edit-privacy-option-head">
                <input
                  type="checkbox"
                  checked={includeSelfVisibleSubDepartments}
                  onChange={(event) => onIncludeSelfVisibleChange(event.target.checked)}
                />
                <span>{acT(locale, 'departmentIncludeSelfVisibleSubDepts')}</span>
              </label>
              <p className="ac-dept-edit-privacy-option-hint">
                {acT(locale, 'departmentSelfVisibleSubDeptsInclude')}
                {selfVisibleIncludeText}
              </p>
            </div>

            <div className="ac-dept-edit-privacy-option">
              <label className="ac-dept-edit-privacy-option-head">
                <input
                  type="checkbox"
                  checked={includeAssociatedOrgs}
                  onChange={(event) => onIncludeAssociatedOrgsChange(event.target.checked)}
                />
                <span>{acT(locale, 'departmentIncludeAssociatedOrgs')}</span>
              </label>
              <p className="ac-dept-edit-privacy-option-hint">
                {acT(locale, 'departmentAssociatedOrgsInclude')}
                {associatedOrgsIncludeText}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
