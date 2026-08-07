import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  connectionName,
  connectionUsesConnectorBridge,
  KNOWLEDGE_BASE_CONNECTIONS,
  KNOWLEDGE_BASE_CONTENT_PROVIDER_CONNECTIONS,
  type KnowledgeBaseConnectionDef,
} from '../data/integrationConnections'
import { kbIntegrationProviderLabel, kbT } from '../i18n/strings'
import type { KnowledgeBaseIntegrationProvider } from '../types'

export type KnowledgeBasePickIntegrationVariant = 'content-providers' | 'all-connections'

type KnowledgeBasePickIntegrationModalProps = {
  locale: AppLocale
  open: boolean
  variant?: KnowledgeBasePickIntegrationVariant
  connectedConnectionIds: Set<string>
  /** false 时未连接项不可发起连接（如 Manager 仅可查看提示） */
  canConnectWhenDisconnected?: boolean
  onClose: () => void
  onPick: (provider: KnowledgeBaseIntegrationProvider) => void
  onConnect: (connection: KnowledgeBaseConnectionDef) => void
  onOpenConnectorPicker: (connection: KnowledgeBaseConnectionDef) => void
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ConnectionLogo({ src }: { src: string }) {
  return (
    <span className="kb-connection-card-icon kb-connection-card-icon--logo">
      <img className="kb-connection-card-logo" src={src} alt="" width={22} height={22} draggable={false} />
    </span>
  )
}

function handleConnectionClick(
  variant: KnowledgeBasePickIntegrationVariant,
  connection: KnowledgeBaseConnectionDef,
  connected: boolean,
  canConnectWhenDisconnected: boolean,
  onPick: (provider: KnowledgeBaseIntegrationProvider) => void,
  onConnect: (connection: KnowledgeBaseConnectionDef) => void,
  onOpenConnectorPicker: (connection: KnowledgeBaseConnectionDef) => void,
  onDisconnectedBlocked?: () => void,
) {
  if (variant === 'content-providers' && connection.provider) {
    if (connected) {
      onPick(connection.provider)
    } else if (canConnectWhenDisconnected) {
      onConnect(connection)
    } else {
      onDisconnectedBlocked?.()
    }
    return
  }
  if (connected) {
    if (connectionUsesConnectorBridge(connection)) {
      onOpenConnectorPicker(connection)
      return
    }
    if (connection.provider) {
      onPick(connection.provider)
    }
    return
  }
  if (canConnectWhenDisconnected) {
    onConnect(connection)
  } else {
    onDisconnectedBlocked?.()
  }
}

function ContentProviderListItem({
  locale,
  connection,
  connectedConnectionIds,
  canConnectWhenDisconnected,
  onPick,
  onConnect,
  onOpenConnectorPicker,
  onDisconnectedBlocked,
}: {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef
  connectedConnectionIds: Set<string>
  canConnectWhenDisconnected: boolean
  onPick: (provider: KnowledgeBaseIntegrationProvider) => void
  onConnect: (connection: KnowledgeBaseConnectionDef) => void
  onOpenConnectorPicker: (connection: KnowledgeBaseConnectionDef) => void
  onDisconnectedBlocked: () => void
}) {
  const connected = connectedConnectionIds.has(connection.id)
  const blocked = !connected && !canConnectWhenDisconnected
  const provider = connection.provider!
  const label = connectionName(connection, locale === 'zh' ? 'zh' : 'en')
  const providerLabel = kbIntegrationProviderLabel(locale, provider)

  return (
    <button
      type="button"
      className={`kb-source-option kb-integration-pick-option${blocked ? ' is-disconnected-blocked' : ''}`}
      aria-disabled={blocked || undefined}
      onClick={() =>
        handleConnectionClick(
          'content-providers',
          connection,
          connected,
          canConnectWhenDisconnected,
          onPick,
          onConnect,
          onOpenConnectorPicker,
          onDisconnectedBlocked,
        )
      }
    >
      <span
        className={`kb-source-option-icon kb-integration-pick-icon kb-integration-pick-icon--${provider}`}
        aria-hidden="true"
      >
        <img className="kb-integration-provider-logo" src={connection.logoSrc} alt="" draggable={false} />
      </span>
      <span className="kb-source-option-text">
        <span className="kb-source-option-title">{label}</span>
        <span className="kb-source-option-desc">
          {kbT(locale, 'integrationPickProviderDesc').replace('{provider}', providerLabel)}
        </span>
      </span>
      <span
        className={
          connected
            ? 'kb-integration-pick-status kb-connection-card-meta--connected'
            : 'kb-integration-pick-status kb-connection-card-meta--disconnected'
        }
      >
        {kbT(locale, connected ? 'newConnectionConnected' : 'newConnectionDisconnected')}
      </span>
      <span className="kb-source-option-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
}

function ConnectionGridCard({
  locale,
  connection,
  connectedConnectionIds,
  canConnectWhenDisconnected,
  onPick,
  onConnect,
  onOpenConnectorPicker,
  onDisconnectedBlocked,
}: {
  locale: AppLocale
  connection: KnowledgeBaseConnectionDef
  connectedConnectionIds: Set<string>
  canConnectWhenDisconnected: boolean
  onPick: (provider: KnowledgeBaseIntegrationProvider) => void
  onConnect: (connection: KnowledgeBaseConnectionDef) => void
  onOpenConnectorPicker: (connection: KnowledgeBaseConnectionDef) => void
  onDisconnectedBlocked: () => void
}) {
  const connected = connectedConnectionIds.has(connection.id)
  const blocked = !connected && !canConnectWhenDisconnected
  const label = connectionName(connection, locale === 'zh' ? 'zh' : 'en')

  return (
    <button
      type="button"
      className={`kb-connection-card${blocked ? ' is-disconnected-blocked' : ''}`}
      aria-disabled={blocked || undefined}
      onClick={() =>
        handleConnectionClick(
          'all-connections',
          connection,
          connected,
          canConnectWhenDisconnected,
          onPick,
          onConnect,
          onOpenConnectorPicker,
          onDisconnectedBlocked,
        )
      }
    >
      <ConnectionLogo src={connection.logoSrc} />
      <span className="kb-connection-card-body">
        <span className="kb-connection-card-name">{label}</span>
        <span
          className={
            connected
              ? 'kb-connection-card-meta kb-connection-card-meta--connected'
              : 'kb-connection-card-meta kb-connection-card-meta--disconnected'
          }
        >
          {kbT(locale, connected ? 'newConnectionConnected' : 'newConnectionDisconnected')}
        </span>
      </span>
    </button>
  )
}

export function KnowledgeBasePickIntegrationModal({
  locale,
  open,
  variant = 'content-providers',
  connectedConnectionIds,
  canConnectWhenDisconnected = true,
  onClose,
  onPick,
  onConnect,
  onOpenConnectorPicker,
}: KnowledgeBasePickIntegrationModalProps) {
  const [search, setSearch] = useState('')
  const [blockedHint, setBlockedHint] = useState<string | null>(null)
  const isContentProviders = variant === 'content-providers'
  const catalog = isContentProviders
    ? KNOWLEDGE_BASE_CONTENT_PROVIDER_CONNECTIONS
    : KNOWLEDGE_BASE_CONNECTIONS

  useEffect(() => {
    if (open) {
      setSearch('')
      setBlockedHint(null)
    }
  }, [open])

  const showDisconnectedBlockedHint = useCallback(() => {
    setBlockedHint(kbT(locale, 'integrationDisconnectedManagerHint'))
  }, [locale])

  const filteredConnections = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return catalog
    return catalog.filter((connection) => {
      const haystack = [connection.nameEn, connection.nameZh].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [catalog, search])

  if (!open) return null

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`kb-modal${isContentProviders ? ' kb-modal--source' : ' kb-modal--connections'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-pick-integration-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <h2 id="kb-pick-integration-title" className="kb-modal-title">
            {kbT(locale, isContentProviders ? 'integrationPickTitle' : 'newConnectionTitle')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        {isContentProviders ? (
          <p className="kb-modal-hint">{kbT(locale, 'integrationPickHint')}</p>
        ) : null}

        {!isContentProviders ? (
          <label className="kb-connection-search">
            <SearchIcon />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={kbT(locale, 'newConnectionSearch')}
              aria-label={kbT(locale, 'newConnectionSearch')}
            />
          </label>
        ) : null}

        {filteredConnections.length > 0 ? isContentProviders ? (
          <ul className="kb-source-options kb-integration-pick-list" role="list">
            {filteredConnections.map((connection) => (
              <li key={connection.id}>
                <ContentProviderListItem
                  locale={locale}
                  connection={connection}
                  connectedConnectionIds={connectedConnectionIds}
                  canConnectWhenDisconnected={canConnectWhenDisconnected}
                  onPick={onPick}
                  onConnect={onConnect}
                  onOpenConnectorPicker={onOpenConnectorPicker}
                  onDisconnectedBlocked={showDisconnectedBlockedHint}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="kb-connection-grid" role="list">
            {filteredConnections.map((connection) => (
              <ConnectionGridCard
                key={connection.id}
                locale={locale}
                connection={connection}
                connectedConnectionIds={connectedConnectionIds}
                canConnectWhenDisconnected={canConnectWhenDisconnected}
                onPick={onPick}
                onConnect={onConnect}
                onOpenConnectorPicker={onOpenConnectorPicker}
                onDisconnectedBlocked={showDisconnectedBlockedHint}
              />
            ))}
          </div>
        ) : (
          <p className="kb-connection-empty">{kbT(locale, 'newConnectionEmpty')}</p>
        )}

        {blockedHint ? (
          <p className="kb-integration-pick-blocked-hint" role="status">
            {blockedHint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
