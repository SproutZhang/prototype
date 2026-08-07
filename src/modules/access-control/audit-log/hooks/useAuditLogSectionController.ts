import { useCallback, useState } from 'react'

import { AUDIT_LOG_EVENTS, type AuditLogEvent } from '../data/auditLogSeed'

/** 审计日志子模块控制器 */
export function useAuditLogSectionController() {
  const [events, setEvents] = useState<AuditLogEvent[]>(() => [...AUDIT_LOG_EVENTS])

  const handleRevokeAuditEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id && event.status === 'active'
          ? { ...event, status: 'cancelled' }
          : event,
      ),
    )
  }, [])

  const handleRestoreAuditEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id && event.status === 'cancelled'
          ? { ...event, status: 'active' }
          : event,
      ),
    )
  }, [])

  return {
    events,
    handleRevokeAuditEvent,
    handleRestoreAuditEvent,
  }
}
