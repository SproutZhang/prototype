import { useEffect, useMemo, useState, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { connectionName, type KnowledgeBaseConnectionDef } from '../data/integrationConnections'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseCreatedConnector } from '../types/createdConnector'

type ManageConnectorRow = {
  id: string
  name: string
  createdAt?: number
}

type KnowledgeBaseManageConnectorsModalProps = {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef | null
  createdConnectors: KnowledgeBaseCreatedConnector[]
  disabledConnectorIds: Set<string>
  onBack: () => void
  onClose: () => void
  onOpenCreate: () => void
  onEditConnector: (connector: { id: string; name: string }) => void
  onDeleteConnector: (connector: { id: string; name: string }) => void
  onSetConnectorDisabled: (connectorId: string, disabled: boolean) => void
}

function isTemplateConnectorId(connectorId: string, connectionId: string): boolean {
  return connectorId === `${connectionId}-template`
}

function formatCreatedAt(timestamp: number | undefined, locale: AppLocale): string {
  if (!timestamp) return kbT(locale, 'manageConnectorsCreatedNa')
  const date = new Date(timestamp)
  if (locale === 'zh') {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }
  return date.toLocaleDateString('en-US')
}

function ManageConnectorRowMenu({
  locale,
  rowId,
  disabled,
  canEditDelete,
  onSetDisabled,
  onEdit,
  onDelete,
}: {
  locale: AppLocale
  rowId: string
  disabled: boolean
  canEditDelete: boolean
  onSetDisabled: (disabled: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [rowId, disabled])

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <div className="kb-manage-connectors-row-menu-wrap" onClick={stopMenuEvent} onMouseDown={stopMenuEvent}>
      <button
        type="button"
        className={`kb-doc-kebab kb-manage-connectors-row-kebab${menuOpen ? ' is-open' : ''}`}
        aria-label={kbT(locale, 'connectBridgeConnectorMenu')}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => {
          stopMenuEvent(event)
          setMenuOpen((open) => !open)
        }}
      >
        ⋮
      </button>
      <div
        className={
          menuOpen
            ? 'kb-doc-menu kb-manage-connectors-row-menu is-open'
            : 'kb-doc-menu kb-manage-connectors-row-menu'
        }
        role="menu"
        aria-label={kbT(locale, 'connectBridgeConnectorMenu')}
        onMouseDown={stopMenuEvent}
      >
        {canEditDelete ? (
          <button
            type="button"
            className="kb-doc-menu-item"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              onEdit()
              setMenuOpen(false)
            }}
          >
            {kbT(locale, 'manageConnectorsEdit')}
          </button>
        ) : null}
        {disabled ? (
          <button
            type="button"
            className="kb-doc-menu-item"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              onSetDisabled(false)
              setMenuOpen(false)
            }}
          >
            {kbT(locale, 'connectBridgeConnectorActivate')}
          </button>
        ) : (
          <button
            type="button"
            className="kb-doc-menu-item"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              onSetDisabled(true)
              setMenuOpen(false)
            }}
          >
            {kbT(locale, 'connectBridgeConnectorDisable')}
          </button>
        )}
        {canEditDelete ? (
          <button
            type="button"
            className="kb-doc-menu-item kb-doc-menu-item--danger"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              onDelete()
              setMenuOpen(false)
            }}
          >
            {kbT(locale, 'manageConnectorsDelete')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function KnowledgeBaseManageConnectorsModal({
  locale,
  connection,
  createdConnectors,
  disabledConnectorIds,
  onBack,
  onClose,
  onOpenCreate,
  onEditConnector,
  onDeleteConnector,
  onSetConnectorDisabled,
}: KnowledgeBaseManageConnectorsModalProps) {
  const name = connection ? connectionName(connection, locale === 'zh' ? 'zh' : 'en') : ''
  const defaultConnectorTitle = connection
    ? kbT(locale, 'connectBridgeConnectorName').replace('{name}', name)
    : ''
  const authLabel = kbT(locale, 'manageConnectorsAuthCredentials')

  const rows = useMemo<ManageConnectorRow[]>(() => {
    if (!connection) return []
    const items: ManageConnectorRow[] = [
      {
        id: `${connection.id}-template`,
        name: defaultConnectorTitle,
      },
    ]
    for (const connector of createdConnectors) {
      items.push({
        id: connector.id,
        name: connector.name,
        createdAt: connector.createdAt,
      })
    }
    return items
  }, [connection, defaultConnectorTitle, createdConnectors])

  if (!connection) return null

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-manage" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--manage-connectors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-manage-connectors-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-manage-connectors-toolbar">
          <button type="button" className="kb-connect-connector-back" onClick={onBack}>
            ‹
          </button>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <div className="kb-manage-connectors-header">
          <div className="kb-manage-connectors-header-main">
            <span className="kb-manage-connectors-logo">
              <img src={connection.logoSrc} alt="" width={28} height={28} draggable={false} />
            </span>
            <div className="kb-manage-connectors-header-text">
              <h2 id="kb-manage-connectors-title" className="kb-manage-connectors-title">
                {name}
              </h2>
              <p className="kb-manage-connectors-subtitle">
                {kbT(locale, 'manageConnectorsSubtitle').replace('{name}', name)}
              </p>
            </div>
          </div>
          <button type="button" className="kb-btn kb-btn--solid kb-manage-connectors-new" onClick={onOpenCreate}>
            {kbT(locale, 'manageConnectorsNew')}
          </button>
        </div>

        <div className="kb-manage-connectors-table-wrap">
          <table className="kb-manage-connectors-table">
            <thead>
              <tr>
                <th scope="col">{kbT(locale, 'manageConnectorsColName')}</th>
                <th scope="col">{kbT(locale, 'manageConnectorsColAuth')}</th>
                <th scope="col">{kbT(locale, 'manageConnectorsColCreated')}</th>
                <th scope="col">{kbT(locale, 'manageConnectorsColStatus')}</th>
                <th scope="col" className="kb-manage-connectors-col-actions">
                  <span className="sr-only">{kbT(locale, 'connectBridgeConnectorMenu')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const inactive = disabledConnectorIds.has(row.id)
                return (
                  <tr key={row.id} className={inactive ? 'kb-manage-connectors-row--inactive' : undefined}>
                    <td className="kb-manage-connectors-cell-name">{row.name}</td>
                    <td>{authLabel}</td>
                    <td>{formatCreatedAt(row.createdAt, locale)}</td>
                    <td>
                      <span
                        className={
                          inactive
                            ? 'kb-manage-connectors-status kb-manage-connectors-status--inactive'
                            : 'kb-manage-connectors-status kb-manage-connectors-status--active'
                        }
                      >
                        {inactive
                          ? kbT(locale, 'manageConnectorsStatusInactive')
                          : kbT(locale, 'manageConnectorsStatusActive')}
                      </span>
                    </td>
                    <td className="kb-manage-connectors-cell-actions">
                      <ManageConnectorRowMenu
                        locale={locale}
                        rowId={row.id}
                        disabled={inactive}
                        canEditDelete={!isTemplateConnectorId(row.id, connection.id)}
                        onSetDisabled={(nextDisabled) => onSetConnectorDisabled(row.id, nextDisabled)}
                        onEdit={() => onEditConnector({ id: row.id, name: row.name })}
                        onDelete={() => onDeleteConnector({ id: row.id, name: row.name })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
