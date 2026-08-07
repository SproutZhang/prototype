import { useEffect } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { DepartmentsManagementView } from '../../departments-management'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { navigateAccessControlSection } from '../../utils/routing'

/** 访问控制 · 部门管理（Admin） */
export function AccessControlDepartmentsPage() {
  const { locale } = useLocale()
  const { canViewDepartmentsManagement } = useAccessControlCapabilities()

  useEffect(() => {
    if (!canViewDepartmentsManagement) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewDepartmentsManagement])

  if (!canViewDepartmentsManagement) return null

  return (
    <AccessControlSectionShell section="departments" locale={locale} sideDrawerOpen={false}>
      <DepartmentsManagementView />
    </AccessControlSectionShell>
  )
}
