import { useEffect, useMemo, useState, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { connectionName, type KnowledgeBaseConnectionDef } from '../data/integrationConnections'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseCreatedConnector } from '../types/createdConnector'

type KnowledgeBaseConnectConnectorModalProps = {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef | null
  createdConnectors: KnowledgeBaseCreatedConnector[]
  disabledConnectorIds: Set<string>
  onBack: () => void
  onClose: () => void
  onOpenCreate: () => void
  onOpenManage: () => void
  onEditConnector: (connector: { id: string; name: string }) => void
  onSetConnectorDisabled: (connectorId: string, disabled: boolean) => void
  onConnectorSelect: (connector: { id: string; name: string }) => void
}

type ConnectorCardItem = {
  id: string
  title: string
  subtitle: string
}

function isTemplateConnectorId(connectorId: string, connectionId: string): boolean {
  return connectorId === `${connectionId}-template`
}

const COMPANY_LOGO_SRC = '/studio-x-logo.png'

function CompanyLogo({ size = 22 }: { size?: number }) {
  return (
    <img
      className="kb-connect-company-logo"
      src={COMPANY_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  )
}

function BridgeDots() {
  return (
    <span className="kb-connect-bridge-dots" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} className="kb-connect-bridge-dot" />
      ))}
    </span>
  )
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="8.5" cy="12.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12.5 12.5h7v2.5h-2v2.5h-2v-2.5h-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function stableEnabledActionCount(cardId: string, disabled: boolean): number {
  let hash = 0
  for (let i = 0; i < cardId.length; i += 1) {
    hash = (hash * 31 + cardId.charCodeAt(i)) | 0
  }
  const min = 1
  const max = disabled ? 8 : 20
  return min + (Math.abs(hash) % (max - min + 1))
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M6 3.5h6.5V10M9.5 6.5 12.5 3.5 9.5 3.5H6.5V6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ConnectorCard({
  locale,
  cardId,
  title,
  subtitle,
  disabled,
  canEdit,
  onSetDisabled,
  onEdit,
  onSelect,
}: {
  locale: AppLocale
  cardId: string
  title: string
  subtitle: string
  disabled: boolean
  canEdit: boolean
  onSetDisabled: (disabled: boolean) => void
  onEdit?: () => void
  onSelect?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [cardId, disabled])

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const enabledCount = useMemo(
    () => String(stableEnabledActionCount(cardId, disabled)),
    [cardId, disabled],
  )
  const enabledActions = kbT(locale, 'connectBridgeEnabledActions').replace('{count}', enabledCount)
  const displaySubtitle = disabled ? kbT(locale, 'connectBridgeConnectorDisabledHint') : subtitle

  return (
    <div
      className={`kb-connect-connector-card${disabled ? ' kb-connect-connector-card--disabled' : ' kb-connect-connector-card--selectable'}${
        menuOpen ? ' kb-connect-connector-card--menu-open' : ''
      }`}
      onClick={disabled ? undefined : onSelect}
      role={disabled ? undefined : onSelect ? 'button' : undefined}
      tabIndex={disabled ? undefined : onSelect ? 0 : undefined}
      onKeyDown={
        disabled
          ? undefined
          : onSelect
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect()
                }
              }
            : undefined
      }
    >
      <span className="kb-connect-connector-card-icon">
        <KeyIcon />
      </span>
      <span className="kb-connect-connector-card-body">
        <span className="kb-connect-connector-card-title">{title}</span>
        <span className="kb-connect-connector-card-subtitle">{displaySubtitle}</span>
      </span>
      <span className="kb-connect-connector-card-status">
        <span className="kb-connect-connector-card-check" aria-hidden="true">
          ✓
        </span>
        {enabledActions}
      </span>
      {disabled ? (
        <span className="kb-connect-connector-card-inactive-badge">{kbT(locale, 'connectBridgeInactive')}</span>
      ) : null}
      <div className="kb-connect-connector-card-menu-wrap" onClick={stopMenuEvent} onMouseDown={stopMenuEvent}>
        <button
          type="button"
          className={`kb-doc-kebab kb-connect-connector-card-kebab${menuOpen ? ' is-open' : ''}`}
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
              ? 'kb-doc-menu kb-connect-connector-card-menu is-open'
              : 'kb-doc-menu kb-connect-connector-card-menu'
          }
          role="menu"
          aria-label={kbT(locale, 'connectBridgeConnectorMenu')}
          onMouseDown={stopMenuEvent}
        >
          {canEdit && onEdit ? (
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
            <>
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
              <button
                type="button"
                className="kb-doc-menu-item"
                role="menuitem"
                disabled
              >
                {kbT(locale, 'connectBridgeConnectorActivate')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function KnowledgeBaseConnectConnectorModal({
  locale,
  connection,
  createdConnectors,
  disabledConnectorIds,
  onBack,
  onClose,
  onOpenCreate,
  onOpenManage,
  onEditConnector,
  onSetConnectorDisabled,
  onConnectorSelect,
}: KnowledgeBaseConnectConnectorModalProps) {
  const name = connection ? connectionName(connection, locale === 'zh' ? 'zh' : 'en') : ''
  const connectorTypeLabel = kbT(locale, 'connectBridgeConnectorType')
  const defaultConnectorTitle = connection
    ? kbT(locale, 'connectBridgeConnectorName').replace('{name}', name)
    : ''
  const connectorItems = useMemo<ConnectorCardItem[]>(() => {
    if (!connection) return []
    const items: ConnectorCardItem[] = [
      {
        id: `${connection.id}-template`,
        title: defaultConnectorTitle,
        subtitle: connectorTypeLabel,
      },
    ]
    for (const connector of createdConnectors) {
      items.push({
        id: connector.id,
        title: connector.name,
        subtitle: connectorTypeLabel,
      })
    }
    return items
  }, [connection, defaultConnectorTitle, connectorTypeLabel, createdConnectors])

  if (!connection) return null

  const activeConnectors = connectorItems.filter((item) => !disabledConnectorIds.has(item.id))
  const disabledConnectors = connectorItems.filter((item) => disabledConnectorIds.has(item.id))

  const renderConnectorCard = (item: ConnectorCardItem, disabled: boolean) => {
    const canEdit = !isTemplateConnectorId(item.id, connection.id)
    return (
      <ConnectorCard
        key={item.id}
        locale={locale}
        cardId={item.id}
        title={item.title}
        subtitle={item.subtitle}
        disabled={disabled}
        canEdit={canEdit}
        onSetDisabled={(nextDisabled) => onSetConnectorDisabled(item.id, nextDisabled)}
        onEdit={canEdit ? () => onEditConnector({ id: item.id, name: item.title }) : undefined}
        onSelect={disabled ? undefined : () => onConnectorSelect({ id: item.id, name: item.title })}
      />
    )
  }

  return (
    <div className="kb-modal-overlay kb-modal-overlay--stacked-top" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--connector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-connect-connector-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-connect-connector-toolbar">
          <button type="button" className="kb-connect-connector-back" onClick={onBack}>
            ‹
          </button>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <div className="kb-connect-bridge">
          <span className="kb-connect-bridge-logo">
            <CompanyLogo />
          </span>
          <BridgeDots />
          <span className="kb-connect-bridge-logo kb-connect-bridge-logo--target">
            <img src={connection.logoSrc} alt="" width={22} height={22} draggable={false} />
          </span>
        </div>

        <h2 id="kb-connect-connector-title" className="kb-connect-connector-title">
          {kbT(locale, 'connectBridgeTitle').replace('{name}', name)}
        </h2>
        <p className="kb-connect-connector-hint">
          {kbT(locale, 'connectBridgeHint').replace('{name}', name)}
        </p>

        <div className="kb-connect-connector-section-head">
          <span>{kbT(locale, 'connectBridgeAvailable')}</span>
          <button type="button" className="kb-connect-connector-manage" onClick={onOpenManage}>
            {kbT(locale, 'connectBridgeManage')}
            <ExternalLinkIcon />
          </button>
        </div>

        <div className="kb-connect-connector-list">
          {activeConnectors.map((item) => renderConnectorCard(item, false))}
        </div>

        {disabledConnectors.length > 0 ? (
          <>
            <div className="kb-connect-connector-section-head kb-connect-connector-section-head--disabled">
              <span>{kbT(locale, 'connectBridgeDisabled')}</span>
            </div>
            <div className="kb-connect-connector-list kb-connect-connector-list--disabled">
              {disabledConnectors.map((item) => renderConnectorCard(item, true))}
            </div>
          </>
        ) : null}

        <div className="kb-connect-connector-footer">
          <button type="button" className="kb-btn kb-btn--secondary kb-connect-connector-back-btn" onClick={onBack}>
            {kbT(locale, 'integrationPickFolderBack')}
          </button>
          <button type="button" className="kb-btn kb-btn--primary kb-connect-connector-create" onClick={onOpenCreate}>
            {kbT(locale, 'connectBridgeCreate')}
          </button>
        </div>
      </div>
    </div>
  )
}
