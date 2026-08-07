import { useEffect, useState, useSyncExternalStore } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import { AccessControlHeader } from '../../components/AccessControlHeader'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { navigateAccessControlSection, parseScenarioTraceRoute } from '../../utils/routing'
import { WorkLogView } from '../../work-log'
import { useWorkLogSectionController } from '../../work-log/hooks/useWorkLogSectionController'
import { AccessControlScenarioTracePage } from './AccessControlScenarioTracePage'

function subscribeAccessControlPath(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getAccessControlPathSnapshot() {
  return typeof window !== 'undefined' ? window.location.pathname : '/access-control/work-log'
}

function getAccessControlSearchSnapshot() {
  return typeof window !== 'undefined' ? window.location.search : ''
}

/** 访问控制 · 工作日志（仅 Admin） */
export function AccessControlWorkLogPage() {
  const { locale } = useLocale()
  const { canViewWorkLog } = useAccessControlCapabilities()
  const [searchQuery, setSearchQuery] = useState('')
  const { entries } = useWorkLogSectionController()
  const pathname = useSyncExternalStore(
    subscribeAccessControlPath,
    getAccessControlPathSnapshot,
    () => '/access-control/work-log',
  )
  const locationSearch = useSyncExternalStore(
    subscribeAccessControlPath,
    getAccessControlSearchSnapshot,
    () => '',
  )
  const scenarioRoute = parseScenarioTraceRoute(pathname, locationSearch)

  useEffect(() => {
    if (!canViewWorkLog) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewWorkLog])

  if (!canViewWorkLog) return null

  if (scenarioRoute) {
    return (
      <AccessControlScenarioTracePage
        workflowKey={scenarioRoute.workflowKey}
        sessionId={scenarioRoute.sessionId}
      />
    )
  }

  return (
    <AccessControlSectionShell section="work-log" locale={locale} sideDrawerOpen={false}>
      <AccessControlHeader
        locale={locale}
        section="work-log"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
      <WorkLogView locale={locale} searchQuery={searchQuery} entries={entries} />
    </AccessControlSectionShell>
  )
}
