import { useId } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { DepartmentCreateActions } from '../departments-management/components/DepartmentCreateActions'
import { acT, accessControlSectionTitle, accessControlTaglineFirstPart } from '../i18n/strings'
import type { AccessControlSection } from '../utils/routing'
import { AcSectionHintIcon } from './AcSectionHintIcon'

type AccessControlHeaderProps = {
  locale: AppLocale
  section: AccessControlSection
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onAddMember?: () => void
  /** 部门管理 · 添加成员（与创建部门区分） */
  onAddDepartmentMember?: () => void
  onBatchCreate?: () => void
  onThirdPartyImport?: () => void
  onEditSelectedDepartments?: () => void
  selectedDepartmentCount?: number
  onInviteUser?: () => void
}

function AccessControlTagline({
  locale,
  section,
}: {
  locale: AppLocale
  section: AccessControlSection
}) {
  const firstPart = accessControlTaglineFirstPart(locale, section)
  const membersPart = acT(locale, 'taglineMembers')
  const permissionsPart = acT(locale, 'taglinePermissions')

  return (
    <div className="agents-subtitle agents-subtitle--tagline" aria-label={acT(locale, 'pageSubtitle')}>
      <span className="agents-subtitle-part">{firstPart}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">
        ·
      </span>
      <span className="agents-subtitle-part">{membersPart}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">
        ·
      </span>
      <span className="agents-subtitle-part">{permissionsPart}</span>
    </div>
  )
}

export function AccessControlHeader({
  locale,
  section,
  searchQuery,
  onSearchQueryChange,
  onAddMember,
  onAddDepartmentMember,
  onBatchCreate,
  onThirdPartyImport,
  onEditSelectedDepartments,
  selectedDepartmentCount = 0,
  onInviteUser,
}: AccessControlHeaderProps) {
  const auditLogHintId = useId()
  const workLogHintId = useId()
  const apiKeysHintId = useId()
  const modelManagementHintId = useId()
  const pageTitle = accessControlSectionTitle(locale, section)
  const addActionLabel =
    section === 'roles'
      ? acT(locale, 'addRole')
      : section === 'departments'
        ? acT(locale, 'addDepartment')
        : section === 'members'
          ? acT(locale, 'addMember')
          : section === 'api-keys'
            ? acT(locale, 'apiKeyCreate')
            : section === 'model-management'
              ? acT(locale, 'modelCreate')
          : acT(locale, 'createNewUser')
  const showInviteUser =
    section !== 'roles' &&
    section !== 'departments' &&
    section !== 'members' &&
    section !== 'audit-log' &&
    section !== 'work-log' &&
    section !== 'api-keys' &&
    section !== 'model-management' &&
    onInviteUser
  const searchPlaceholderKey =
    section === 'departments'
      ? 'searchDepartmentsPlaceholder'
      : section === 'audit-log'
        ? 'searchAuditLogPlaceholder'
        : section === 'work-log'
          ? 'searchWorkLogPlaceholder'
          : section === 'api-keys'
          ? 'searchApiKeysPlaceholder'
          : section === 'model-management'
            ? 'searchModelsPlaceholder'
        : 'searchPlaceholder'
  const showAddPrefix =
    section === 'roles' || section === 'departments' || section === 'api-keys' || section === 'model-management'

  return (
    <>
      <header className="agents-header skills-page-header ac-page-header">
        <div className="agents-header-lead">
          <div className="ac-page-title-row">
            <div className="agents-title">{pageTitle}</div>
            {section === 'audit-log' ? (
              <AcSectionHintIcon
                hintId={auditLogHintId}
                hint={acT(locale, 'auditLogHint')}
                ariaLabel={acT(locale, 'auditLogHintAria')}
              />
            ) : null}
            {section === 'work-log' ? (
              <AcSectionHintIcon
                hintId={workLogHintId}
                hint={acT(locale, 'workLogHint')}
                ariaLabel={acT(locale, 'workLogHintAria')}
              />
            ) : null}
            {section === 'api-keys' ? (
              <AcSectionHintIcon
                hintId={apiKeysHintId}
                hint={acT(locale, 'apiKeyHint')}
                ariaLabel={acT(locale, 'apiKeyHintAria')}
              />
            ) : null}
            {section === 'model-management' ? (
              <AcSectionHintIcon
                hintId={modelManagementHintId}
                hint={acT(locale, 'modelHint')}
                ariaLabel={acT(locale, 'modelHintAria')}
              />
            ) : null}
          </div>
          <AccessControlTagline locale={locale} section={section} />
        </div>
        {onAddMember || onBatchCreate || onAddDepartmentMember || showInviteUser ? (
          <div className="agents-header-actions ac-page-header-actions">
            {section === 'departments' &&
            selectedDepartmentCount > 0 &&
            onEditSelectedDepartments ? (
              <button type="button" className="agents-btn" onClick={onEditSelectedDepartments}>
                {acT(locale, 'departmentBulkEditSelected')}
              </button>
            ) : null}
            {section === 'departments' && onAddDepartmentMember ? (
              <button type="button" className="agents-btn" onClick={onAddDepartmentMember}>
                {acT(locale, 'addMember')}
              </button>
            ) : null}
            {section === 'departments' && onAddMember && onBatchCreate && onThirdPartyImport ? (
              <DepartmentCreateActions
                locale={locale}
                onAddDepartment={onAddMember}
                onThirdPartyImport={onThirdPartyImport}
                onBatchCreate={onBatchCreate}
              />
            ) : onAddMember ? (
              <button
                type="button"
                className={
                  section === 'departments' || section === 'api-keys' || section === 'model-management'
                    ? 'agents-btn agents-btn-primary'
                    : 'agents-btn'
                }
                onClick={onAddMember}
              >
                {showAddPrefix ? `+ ${addActionLabel}` : addActionLabel}
              </button>
            ) : null}
            {showInviteUser ? (
              <button type="button" className="agents-btn agents-btn-primary" onClick={onInviteUser}>
                {acT(locale, section === 'workspace' ? 'createNewSpace' : 'inviteUser')}
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="agents-toolbar skills-page-toolbar ac-page-toolbar">
        <div className="skills-page-toolbar-left ac-page-toolbar-left">
          <div className="agents-search skills-page-search ac-page-search">
            <span className="agents-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path
                  d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16.8 16.8 21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="text"
              className="agents-search-input"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={acT(locale, searchPlaceholderKey)}
              aria-label={acT(locale, searchPlaceholderKey)}
            />
          </div>
        </div>
      </div>
    </>
  )
}
