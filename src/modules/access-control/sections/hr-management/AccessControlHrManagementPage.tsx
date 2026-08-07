import { useEffect } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { HrDashboardPanels } from '../../hr-management/components/HrDashboardPanels'
import { HrWorkforceOverview } from '../../hr-management/components/HrWorkforceOverview'
import { HR_WORKFORCE_STATS } from '../../hr-management/data/hrWorkforceSeed'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { acT, accessControlSectionTitle, accessControlTaglineFirstPart } from '../../i18n/strings'
import { navigateAccessControlSection } from '../../utils/routing'

/** 访问控制 · 人事管理（Admin / Manager） */
export function AccessControlHrManagementPage() {
  const { locale } = useLocale()
  const { canViewHrManagement } = useAccessControlCapabilities()

  useEffect(() => {
    if (!canViewHrManagement) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewHrManagement])

  if (!canViewHrManagement) return null

  const pageTitle = accessControlSectionTitle(locale, 'hr-management')
  const taglineFirst = accessControlTaglineFirstPart(locale, 'hr-management')

  return (
    <AccessControlSectionShell section="hr-management" locale={locale} sideDrawerOpen={false}>
      <header className="agents-header skills-page-header ac-page-header">
        <div className="agents-header-lead">
          <div className="agents-title">{pageTitle}</div>
          <div className="agents-subtitle agents-subtitle--tagline" aria-label={acT(locale, 'pageSubtitle')}>
            <span className="agents-subtitle-part">{taglineFirst}</span>
            <span className="agents-subtitle-dot" aria-hidden="true">
              ·
            </span>
            <span className="agents-subtitle-part">{acT(locale, 'taglineMembers')}</span>
            <span className="agents-subtitle-dot" aria-hidden="true">
              ·
            </span>
            <span className="agents-subtitle-part">{acT(locale, 'hrTaglineStats')}</span>
          </div>
        </div>
      </header>

      <section className="ac-section ac-hr-section">
        <div className="ac-hr-page-body">
          <HrWorkforceOverview locale={locale} stats={HR_WORKFORCE_STATS} />
          <HrDashboardPanels locale={locale} />
        </div>
      </section>
    </AccessControlSectionShell>
  )
}
