import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { memberAvatarColors, memberAvatarInitials } from '../../utils/memberAvatar'
import {
  type AuditLogEvent,
  type AuditLogEventCategory,
} from '../data/auditLogSeed'
import type { useAuditLogSectionController } from '../hooks/useAuditLogSectionController'

type AuditLogTab = 'all' | AuditLogEventCategory

type AuditLogViewProps = {
  locale: AppLocale
  searchQuery: string
  events: AuditLogEvent[]
  canManage?: boolean
  onRevokeEvent?: ReturnType<typeof useAuditLogSectionController>['handleRevokeAuditEvent']
  onRestoreEvent?: ReturnType<typeof useAuditLogSectionController>['handleRestoreAuditEvent']
}

function formatAuditTimestamp(iso: string, locale: AppLocale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function auditActionLabel(locale: AppLocale, actionKey: AuditLogEvent['actionKey']): string {
  const operationKeyMap: Partial<Record<AuditLogEvent['actionKey'], Parameters<typeof acT>[1]>> = {
    agentCreate: 'workLogActionAgentCreate',
    agentEdit: 'workLogActionAgentEdit',
    agentSave: 'workLogActionAgentSave',
    agentPublish: 'workLogActionAgentPublish',
    agentFreeze: 'workLogActionAgentFreeze',
    agentDelete: 'workLogActionAgentDelete',
    agentDuplicate: 'workLogActionAgentDuplicate',
    scenarioCreate: 'workLogActionScenarioCreate',
    scenarioEdit: 'workLogActionScenarioEdit',
    scenarioSave: 'workLogActionScenarioSave',
    scenarioPublish: 'workLogActionScenarioPublish',
    scenarioRunTest: 'workLogActionScenarioRunTest',
  }
  if (operationKeyMap[actionKey]) {
    return acT(locale, operationKeyMap[actionKey]!)
  }
  const keyMap: Record<
    Exclude<AuditLogEvent['actionKey'], AuditLogOperationActionKey>,
    Parameters<typeof acT>[1]
  > = {
    rolePermissionEdit: 'auditLogActionRolePermissionEdit',
    memberPermissionChange: 'auditLogActionMemberPermissionChange',
    memberInvite: 'auditLogActionMemberInvite',
    roleMemberAssign: 'auditLogActionRoleMemberAssign',
    roleMemberRemove: 'auditLogActionRoleMemberRemove',
    departmentManagerTransfer: 'auditLogActionDepartmentManagerTransfer',
    userLoginSuccess: 'auditLogActionUserLoginSuccess',
    userLoginFailed: 'auditLogActionUserLoginFailed',
    userLogout: 'auditLogActionUserLogout',
  }
  return acT(locale, keyMap[actionKey as keyof typeof keyMap])
}

function auditCategoryClass(category: AuditLogEventCategory, actionKey: AuditLogEvent['actionKey']): string {
  if (category === 'operation') {
    if (actionKey.startsWith('agent')) return 'ac-audit-log-action--agent'
    if (actionKey.startsWith('scenario')) return 'ac-audit-log-action--scenario'
    return 'ac-audit-log-action--permission'
  }
  if (category === 'invite') return 'ac-audit-log-action--invite'
  if (category === 'login') return 'ac-audit-log-action--login'
  return 'ac-audit-log-action--permission'
}

function filterAuditEvents(events: AuditLogEvent[], tab: AuditLogTab, query: string): AuditLogEvent[] {
  const normalized = query.trim().toLowerCase()
  return events.filter((event) => {
    if (tab !== 'all' && event.category !== tab) return false
    if (!normalized) return true
    const haystack = [
      event.actorNameZh,
      event.actorNameEn,
      event.actorEmail,
      event.targetLabelZh,
      event.targetLabelEn,
      event.detailZh,
      event.detailEn,
      auditActionLabel('zh', event.actionKey),
      auditActionLabel('en', event.actionKey),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

function AuditActorCell({
  locale,
  event,
}: {
  locale: AppLocale
  event: AuditLogEvent
}) {
  const name = locale === 'zh' ? event.actorNameZh : event.actorNameEn
  const avatar = memberAvatarColors(event.actorId)
  const initials = memberAvatarInitials(name)

  return (
    <span className="ac-audit-log-actor" title={`${name} · ${event.actorEmail}`}>
      <span
        className="ac-audit-log-avatar"
        style={{ background: avatar.background, color: avatar.color }}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className="ac-audit-log-actor-meta">
        <span className="ac-audit-log-actor-name">{name}</span>
        <span className="ac-audit-log-actor-email">{event.actorEmail}</span>
      </span>
    </span>
  )
}

export function AuditLogView({
  locale,
  searchQuery,
  events,
  canManage = false,
  onRevokeEvent,
  onRestoreEvent,
}: AuditLogViewProps) {
  const [activeTab, setActiveTab] = useState<AuditLogTab>('all')

  const filteredEvents = useMemo(
    () => filterAuditEvents(events, activeTab, searchQuery),
    [activeTab, events, searchQuery],
  )

  const showActions = canManage && onRevokeEvent != null && onRestoreEvent != null

  return (
    <section className="ac-section ac-audit-log-section">
        <div className="ac-audit-log-panel">
          <div className="ac-audit-log-tabs" role="tablist" aria-label={acT(locale, 'sectionTitleAuditLog')}>
            <button
              type="button"
              role="tab"
              className={`ac-audit-log-tab${activeTab === 'all' ? ' is-active' : ''}`}
              aria-selected={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            >
              {acT(locale, 'auditLogTabAll')}
            </button>
            <button
              type="button"
              role="tab"
              className={`ac-audit-log-tab${activeTab === 'permission' ? ' is-active' : ''}`}
              aria-selected={activeTab === 'permission'}
              onClick={() => setActiveTab('permission')}
            >
              {acT(locale, 'auditLogTabPermission')}
            </button>
            <button
              type="button"
              role="tab"
              className={`ac-audit-log-tab${activeTab === 'invite' ? ' is-active' : ''}`}
              aria-selected={activeTab === 'invite'}
              onClick={() => setActiveTab('invite')}
            >
              {acT(locale, 'auditLogTabInvite')}
            </button>
            <button
              type="button"
              role="tab"
              className={`ac-audit-log-tab${activeTab === 'login' ? ' is-active' : ''}`}
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
            >
              {acT(locale, 'auditLogTabLogin')}
            </button>
            <button
              type="button"
              role="tab"
              className={`ac-audit-log-tab${activeTab === 'operation' ? ' is-active' : ''}`}
              aria-selected={activeTab === 'operation'}
              onClick={() => setActiveTab('operation')}
            >
              {acT(locale, 'auditLogTabOperation')}
            </button>
          </div>

          <div className="ac-audit-log-table" role="table">
            <div className="ac-audit-log-table-head" role="rowgroup">
              <div
                className={`ac-audit-log-table-row ac-audit-log-table-row--head${showActions ? ' ac-audit-log-table-row--with-actions' : ''}`}
                role="row"
              >
                <span role="columnheader">{acT(locale, 'auditLogColumnTime')}</span>
                <span role="columnheader">{acT(locale, 'auditLogColumnActor')}</span>
                <span role="columnheader">{acT(locale, 'auditLogColumnAction')}</span>
                <span role="columnheader">{acT(locale, 'auditLogColumnTarget')}</span>
                <span role="columnheader">{acT(locale, 'auditLogColumnDetail')}</span>
                {showActions ? (
                  <span role="columnheader" className="ac-audit-log-actions-col">
                    {acT(locale, 'auditLogColumnActions')}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="ac-audit-log-table-body ac-audit-log-table-body--rows" role="rowgroup">
              {filteredEvents.length === 0 ? (
                <div className="ac-audit-log-empty" role="row">
                  <p>{acT(locale, 'auditLogEmpty')}</p>
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const isCancelled = event.status === 'cancelled'
                  const detail =
                    locale === 'zh'
                      ? isCancelled
                        ? `${event.detailZh}（${acT(locale, 'auditLogStatusCancelled')}）`
                        : event.detailZh
                      : isCancelled
                        ? `${event.detailEn} (${acT(locale, 'auditLogStatusCancelled')})`
                        : event.detailEn

                  return (
                    <div
                      key={event.id}
                      className={`ac-audit-log-table-row ac-audit-log-table-row--body${showActions ? ' ac-audit-log-table-row--with-actions' : ''}${isCancelled ? ' is-cancelled' : ''}`}
                      role="row"
                    >
                      <span role="cell" className="ac-audit-log-cell-time" title={event.occurredAt}>
                        {formatAuditTimestamp(event.occurredAt, locale)}
                      </span>
                      <span role="cell">
                        <AuditActorCell locale={locale} event={event} />
                      </span>
                      <span role="cell">
                        <span className="ac-audit-log-action-wrap">
                          <span className={`ac-audit-log-action ${auditCategoryClass(event.category, event.actionKey)}`}>
                            {auditActionLabel(locale, event.actionKey)}
                          </span>
                          {isCancelled ? (
                            <span className="ac-audit-log-status ac-audit-log-status--cancelled">
                              {acT(locale, 'auditLogStatusCancelled')}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span
                        role="cell"
                        className="ac-audit-log-cell-text"
                        title={locale === 'zh' ? event.targetLabelZh : event.targetLabelEn}
                      >
                        {locale === 'zh' ? event.targetLabelZh : event.targetLabelEn}
                      </span>
                      <span role="cell" className="ac-audit-log-cell-detail" title={detail}>
                        {detail}
                      </span>
                      {showActions ? (
                        <span role="cell" className="ac-audit-log-row-actions">
                          {isCancelled ? (
                            <button
                              type="button"
                              className="ac-row-text-btn"
                              onClick={() => onRestoreEvent(event.id)}
                            >
                              {acT(locale, 'auditLogRestoreAction')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ac-row-text-btn"
                              onClick={() => onRevokeEvent(event.id)}
                            >
                              {acT(locale, 'auditLogRevokeAction')}
                            </button>
                          )}
                        </span>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
    </section>
  )
}
