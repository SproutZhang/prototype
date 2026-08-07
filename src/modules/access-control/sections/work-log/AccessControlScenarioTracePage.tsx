import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import {
  AiTraceExplorerView,
  getScenarioTraceRecords,
  getScenarioWorkflowMeta,
} from '../../ai-trace-explorer'
import { AccessControlSectionShell } from '../../context/AccessControlSectionShell'
import { useAccessControlCapabilities } from '../../hooks/useAccessControlCapabilities'
import { acT } from '../../i18n/strings'
import { navigateAccessControlSection } from '../../utils/routing'

type AccessControlScenarioTracePageProps = {
  workflowKey: string
  sessionId?: string
}

function subscribeLocation(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getLocationSearchSnapshot() {
  return typeof window !== 'undefined' ? window.location.search : ''
}

/** 工作日志 · 场景 Agent 追踪详情（复用 AI 追踪探索器 UI） */
export function AccessControlScenarioTracePage({
  workflowKey,
  sessionId,
}: AccessControlScenarioTracePageProps) {
  const { locale } = useLocale()
  const { canViewWorkLog } = useAccessControlCapabilities()
  const search = useSyncExternalStore(subscribeLocation, getLocationSearchSnapshot, () => '')
  const sessionFromUrl = new URLSearchParams(search).get('session') ?? undefined
  const effectiveSessionId = sessionId ?? sessionFromUrl

  const records = useMemo(() => getScenarioTraceRecords(workflowKey), [workflowKey])
  const meta = getScenarioWorkflowMeta(workflowKey)
  const scenarioTitle = meta
    ? `${locale === 'zh' ? meta.labelZh : meta.labelEn} · ${workflowKey}`
    : workflowKey

  useEffect(() => {
    if (!canViewWorkLog) {
      navigateAccessControlSection('workspace')
    }
  }, [canViewWorkLog])

  if (!canViewWorkLog) return null

  if (records.length === 0) {
    return (
      <AccessControlSectionShell section="work-log" locale={locale} sideDrawerOpen={false}>
        <div className="ac-trace-explorer-empty">
          <p>{acT(locale, 'traceScenarioEmpty')}</p>
          <button
            type="button"
            className="ac-trace-scenario-back ac-trace-scenario-back--standalone"
            onClick={() => navigateAccessControlSection('work-log')}
            aria-label={acT(locale, 'traceScenarioBack')}
            title={acT(locale, 'traceScenarioBack')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </AccessControlSectionShell>
    )
  }

  return (
    <AccessControlSectionShell section="work-log" locale={locale} sideDrawerOpen={false}>
      <AiTraceExplorerView
        locale={locale}
        records={records}
        initialSessionId={effectiveSessionId}
        scenarioTitle={scenarioTitle}
        onBack={() => navigateAccessControlSection('work-log')}
      />
    </AccessControlSectionShell>
  )
}
