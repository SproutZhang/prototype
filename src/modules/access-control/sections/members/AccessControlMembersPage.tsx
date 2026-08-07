import { useEffect, useSyncExternalStore } from 'react'

import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlDemo } from '../../context/AccessControlDemoProvider'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { MembersManagementView } from '../../members-management'
import { MemberAddApplyRecordsView } from '../../members-management/components/MemberAddApplyRecordsView'
import { isMemberAddApplyRecordsPath, navigateAccessControlSection } from '../../utils/routing'

function subscribeAccessControlPath(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getAccessControlPathSnapshot() {
  return typeof window !== 'undefined' ? window.location.pathname : '/access-control/members'
}

/** 访问控制 · 成员管理模块 */
export function AccessControlMembersPage() {
  const { locale } = useAccessControlDemo()
  const { canViewMembersManagement } = useAccessControlCapabilities()
  const pathname = useSyncExternalStore(
    subscribeAccessControlPath,
    getAccessControlPathSnapshot,
    () => '/access-control/members',
  )
  const showRecords = isMemberAddApplyRecordsPath(pathname)

  useEffect(() => {
    if (!canViewMembersManagement) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewMembersManagement])

  if (!canViewMembersManagement) return null

  return (
    <AccessControlSectionShell section="members" locale={locale} sideDrawerOpen={false}>
      {showRecords ? (
        <MemberAddApplyRecordsView locale={locale} />
      ) : (
        <MembersManagementView />
      )}
    </AccessControlSectionShell>
  )
}
