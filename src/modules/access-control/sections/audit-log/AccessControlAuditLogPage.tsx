import { useEffect, useState } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import { AuditLogView } from '../../audit-log'
import { useAuditLogSectionController } from '../../audit-log/hooks/useAuditLogSectionController'
import { AccessControlHeader } from '../../components/AccessControlHeader'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { navigateAccessControlSection } from '../../utils/routing'

/** 访问控制 · 审计日志 */
export function AccessControlAuditLogPage() {
  const { locale } = useLocale()
  const { canViewAuditLog, canManageAuditLog } = useAccessControlCapabilities()
  const [searchQuery, setSearchQuery] = useState('')
  const { events, handleRevokeAuditEvent, handleRestoreAuditEvent } = useAuditLogSectionController()

  useEffect(() => {
    if (!canViewAuditLog) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewAuditLog])

  if (!canViewAuditLog) return null

  return (
    <AccessControlSectionShell section="audit-log" locale={locale} sideDrawerOpen={false}>
      <AccessControlHeader
        locale={locale}
        section="audit-log"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
      <AuditLogView
        locale={locale}
        searchQuery={searchQuery}
        events={events}
        canManage={canManageAuditLog}
        onRevokeEvent={canManageAuditLog ? handleRevokeAuditEvent : undefined}
        onRestoreEvent={canManageAuditLog ? handleRestoreAuditEvent : undefined}
      />
    </AccessControlSectionShell>
  )
}
