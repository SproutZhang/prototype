import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type {
  KnowledgeBaseDocument,
  KnowledgeBaseIntegrationItem,
  KnowledgeBaseIntegrationProvider,
  KnowledgeBaseItem,
} from '../types'
import {
  KnowledgeBaseAddSourceModal,
  type KnowledgeBaseAddSourceKind,
} from './KnowledgeBaseAddSourceModal'
import {
  KnowledgeBaseConnectIntegrationModal,
  type KnowledgeBaseConnectIntegrationDraft,
} from './KnowledgeBaseConnectIntegrationModal'
import { KnowledgeBaseConnectConnectorModal } from './KnowledgeBaseConnectConnectorModal'
import { KnowledgeBaseManageConnectorsModal } from './KnowledgeBaseManageConnectorsModal'
import { KnowledgeBaseDeleteConnectorModal } from './KnowledgeBaseDeleteConnectorModal'
import { KnowledgeBaseEditConnectorModal } from './KnowledgeBaseEditConnectorModal'
import { KnowledgeBaseConfigureConnectorModal } from './KnowledgeBaseConfigureConnectorModal'
import { KnowledgeBaseCreateConnectorModal } from './KnowledgeBaseCreateConnectorModal'
import {
  KnowledgeBaseCreateConnectionModal,
  type KnowledgeBaseCreateConnectionDraft,
} from './KnowledgeBaseCreateConnectionModal'
import {
  KNOWLEDGE_BASE_CONNECTIONS,
  type KnowledgeBaseConnectionDef,
} from '../data/integrationConnections'
import type { KnowledgeBaseCreatedConnector } from '../types/createdConnector'
import { KnowledgeBaseDocActionMenu } from './KnowledgeBaseDocActionMenu'
import { KnowledgeBaseDocApiModal } from './KnowledgeBaseDocApiModal'
import { KnowledgeBaseDocChunksDrawer } from './KnowledgeBaseDocChunksDrawer'
import { KnowledgeBaseDocInsertBlockDrawer } from './KnowledgeBaseDocInsertBlockDrawer'
import { KnowledgeBaseDocProcessDrawer } from './KnowledgeBaseDocProcessDrawer'
import { KnowledgeBaseDocTable } from './KnowledgeBaseDocTable'
import { KnowledgeBaseIntegrationPanel } from './KnowledgeBaseIntegrationPanel'
import { KnowledgeBasePickIntegrationFolderModal } from './KnowledgeBasePickIntegrationFolderModal'
import {
  KnowledgeBasePickIntegrationModal,
  type KnowledgeBasePickIntegrationVariant,
} from './KnowledgeBasePickIntegrationModal'
import { KnowledgeBaseUploadLocalModal } from './KnowledgeBaseUploadLocalModal'
import { resolveKnowledgeBaseIconColors } from '../utils/kbIconColors'

type KnowledgeBaseDetailViewProps = {
  locale: AppLocale
  item: KnowledgeBaseItem
  name: string
  description: string
  onBack: () => void
  onDownloadDocument: (documentId: string) => void
  onRetryDocument: (documentId: string) => void
  onRequestDeleteDocument: (documentId: string) => void
  onDeleteDocuments: (documentIds: string[]) => void
  onUploadLocalDocuments: (documents: KnowledgeBaseDocument[]) => void
  onConfirmIntegrationFolders: (
    provider: KnowledgeBaseIntegrationProvider,
    folderIds: string[],
  ) => void
  onDownloadIntegrationItem: (itemId: string) => void
  onRetryIntegrationItem: (itemId: string) => void
  onRequestDeleteIntegrationItem: (itemId: string) => void
  onRequestDeleteKnowledgeBase: () => void
  onProcessViewActiveChange?: (active: boolean) => void
  canUploadDocuments?: boolean
  canOpenUploadSourcePicker?: boolean
  canViewIntegrations?: boolean
  canManageIntegrations?: boolean
  canConnectIntegrations?: boolean
  canEditKb?: boolean
  canUseUploadAdvancedSettings?: boolean
  canUseFullDocActions?: boolean
}

function docName(doc: KnowledgeBaseDocument, locale: AppLocale): string {
  return locale === 'zh' ? doc.nameZh : doc.nameEn
}

function integrationItemName(item: KnowledgeBaseIntegrationItem, locale: AppLocale): string {
  return locale === 'zh' ? item.nameZh : item.nameEn
}

export function KnowledgeBaseDetailView({
  locale,
  item,
  name,
  description,
  onBack,
  onDownloadDocument,
  onRetryDocument,
  onRequestDeleteDocument,
  onDeleteDocuments,
  onUploadLocalDocuments,
  onConfirmIntegrationFolders,
  onDownloadIntegrationItem,
  onRetryIntegrationItem,
  onRequestDeleteIntegrationItem,
  onRequestDeleteKnowledgeBase,
  onProcessViewActiveChange,
  canUploadDocuments = true,
  canOpenUploadSourcePicker = false,
  canViewIntegrations = true,
  canManageIntegrations = true,
  canConnectIntegrations = true,
  canEditKb = false,
  canUseUploadAdvancedSettings = false,
  canUseFullDocActions = true,
}: KnowledgeBaseDetailViewProps) {
  const [addSourceOpen, setAddSourceOpen] = useState(false)
  const [uploadLocalOpen, setUploadLocalOpen] = useState(false)
  const [pickIntegrationOpen, setPickIntegrationOpen] = useState(false)
  const [pickIntegrationVariant, setPickIntegrationVariant] =
    useState<KnowledgeBasePickIntegrationVariant>('content-providers')
  const [pickFolderOpen, setPickFolderOpen] = useState(false)
  const [pickedProvider, setPickedProvider] = useState<KnowledgeBaseIntegrationProvider | null>(null)
  const [connectTarget, setConnectTarget] = useState<KnowledgeBaseConnectionDef | null>(null)
  const [connectorPickerOpen, setConnectorPickerOpen] = useState(false)
  const [connectorCreateOpen, setConnectorCreateOpen] = useState(false)
  const [connectorEditOpen, setConnectorEditOpen] = useState(false)
  const [connectorConfigureOpen, setConnectorConfigureOpen] = useState(false)
  const [pendingConnectorName, setPendingConnectorName] = useState<string | null>(null)
  const [connectorManageOpen, setConnectorManageOpen] = useState(false)
  const [createConnectionOpen, setCreateConnectionOpen] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<{ id: string; name: string } | null>(null)
  const [createdConnectors, setCreatedConnectors] = useState<KnowledgeBaseCreatedConnector[]>([])
  const [disabledConnectorIds, setDisabledConnectorIds] = useState<Set<string>>(() => new Set())
  const [editingConnector, setEditingConnector] = useState<{ id: string; name: string } | null>(null)
  const [deletingConnector, setDeletingConnector] = useState<{ id: string; name: string } | null>(null)
  const [connectorCreateReturnToManage, setConnectorCreateReturnToManage] = useState(false)
  const [connectorEditReturnToManage, setConnectorEditReturnToManage] = useState(false)
  const [sessionConnectedConnectionIds, setSessionConnectedConnectionIds] = useState<Set<string>>(
    () => new Set(['jira', 'outlook', 'confluence', 'notion']),
  )
  const [connectorPickerSkipCredentials, setConnectorPickerSkipCredentials] = useState(false)
  const [processDoc, setProcessDoc] = useState<KnowledgeBaseDocument | null>(null)
  const [chunksDoc, setChunksDoc] = useState<KnowledgeBaseDocument | null>(null)
  const [insertBlockDoc, setInsertBlockDoc] = useState<KnowledgeBaseDocument | null>(null)
  const [apiDoc, setApiDoc] = useState<KnowledgeBaseDocument | null>(null)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const moreActionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setProcessDoc(null)
    setChunksDoc(null)
    setInsertBlockDoc(null)
    setApiDoc(null)
    setMoreActionsOpen(false)
  }, [item.id])

  useEffect(() => {
    onProcessViewActiveChange?.(Boolean(processDoc || chunksDoc || insertBlockDoc))
  }, [chunksDoc, insertBlockDoc, onProcessViewActiveChange, processDoc])

  useEffect(() => {
    return () => {
      onProcessViewActiveChange?.(false)
    }
  }, [onProcessViewActiveChange])

  useEffect(() => {
    if (!moreActionsOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!moreActionsRef.current?.contains(event.target as Node)) {
        setMoreActionsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreActionsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [moreActionsOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const closeMoreActionsMenu = (event: MouseEvent) => {
    stopMenuEvent(event)
    setMoreActionsOpen(false)
  }

  const handleDetailRefresh = () => {
    closeAllDocDrawers()
  }

  const closeAllDocDrawers = () => {
    setProcessDoc(null)
    setChunksDoc(null)
    setInsertBlockDoc(null)
    setApiDoc(null)
  }

  const handlePreviewProcess = (doc: KnowledgeBaseDocument) => {
    setChunksDoc(null)
    setInsertBlockDoc(null)
    setApiDoc(null)
    setProcessDoc(doc)
  }

  const handleViewEditChunks = (doc: KnowledgeBaseDocument) => {
    setProcessDoc(null)
    setInsertBlockDoc(null)
    setApiDoc(null)
    setChunksDoc(doc)
  }

  const handleInsertBlock = (doc: KnowledgeBaseDocument) => {
    setProcessDoc(null)
    setChunksDoc(null)
    setApiDoc(null)
    setInsertBlockDoc(doc)
  }

  const handleViewApi = (doc: KnowledgeBaseDocument) => {
    setProcessDoc(null)
    setChunksDoc(null)
    setInsertBlockDoc(null)
    setApiDoc(doc)
  }

  const connectedProviders = useMemo(
    () => new Set(item.integrationItems.map((entry) => entry.provider)),
    [item.integrationItems],
  )

  const connectedConnectionIds = useMemo(() => {
    const ids = new Set(sessionConnectedConnectionIds)
    for (const connection of KNOWLEDGE_BASE_CONNECTIONS) {
      if (connection.provider && connectedProviders.has(connection.provider)) {
        ids.add(connection.id)
      }
    }
    return ids
  }, [sessionConnectedConnectionIds, connectedProviders])

  const resetConnectFlow = () => {
    setConnectTarget(null)
    setConnectorPickerOpen(false)
    setConnectorCreateOpen(false)
    setConnectorEditOpen(false)
    setConnectorConfigureOpen(false)
    setPendingConnectorName(null)
    setConnectorManageOpen(false)
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
    setEditingConnector(null)
    setDeletingConnector(null)
    setConnectorCreateReturnToManage(false)
    setConnectorEditReturnToManage(false)
    setConnectorPickerSkipCredentials(false)
  }

  const handlePickIntegration = (provider: KnowledgeBaseIntegrationProvider) => {
    setPickedProvider(provider)
    setPickIntegrationOpen(false)
    resetConnectFlow()
    setPickFolderOpen(true)
  }

  const handleBackToIntegrationPick = () => {
    setPickFolderOpen(false)
    setPickedProvider(null)
    setPickIntegrationOpen(true)
  }

  const handleCloseIntegrationPick = () => {
    setPickIntegrationOpen(false)
    setPickIntegrationVariant('content-providers')
    setPickedProvider(null)
    resetConnectFlow()
    setCreatedConnectors([])
    setDisabledConnectorIds(new Set())
  }

  /** 「选择文件」：打开「选择集成」（飞书 / Notion / Confluence） */
  const handleOpenIntegrationFilePick = () => {
    setAddSourceOpen(false)
    setPickFolderOpen(false)
    setPickedProvider(null)
    resetConnectFlow()
    setPickIntegrationVariant('content-providers')
    setPickIntegrationOpen(true)
  }

  const handlePickSource = (kind: KnowledgeBaseAddSourceKind) => {
    if (kind === 'integration') {
      if (!canManageIntegrations) return
      setAddSourceOpen(false)
      setPickFolderOpen(false)
      setPickedProvider(null)
      resetConnectFlow()
      setPickIntegrationVariant('all-connections')
      setPickIntegrationOpen(true)
      return
    }
    setAddSourceOpen(false)
    setUploadLocalOpen(true)
  }

  const handleCloseUploadLocal = () => {
    setUploadLocalOpen(false)
  }

  const handleConfirmUploadLocal = (documents: KnowledgeBaseDocument[]) => {
    onUploadLocalDocuments(documents)
    setUploadLocalOpen(false)
  }

  const handleOpenConnectorPicker = (connection: KnowledgeBaseConnectionDef) => {
    setAddSourceOpen(false)
    setPickIntegrationOpen(false)
    setPickFolderOpen(false)
    setPickedProvider(null)
    setConnectTarget(connection)
    setConnectorPickerOpen(true)
    setConnectorPickerSkipCredentials(true)
    setConnectorCreateOpen(false)
    setConnectorEditOpen(false)
    setConnectorConfigureOpen(false)
    setPendingConnectorName(null)
    setConnectorManageOpen(false)
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
    setEditingConnector(null)
    setDeletingConnector(null)
    setConnectorCreateReturnToManage(false)
    setConnectorEditReturnToManage(false)
  }

  const handleConnectRequest = (connection: KnowledgeBaseConnectionDef) => {
    setAddSourceOpen(false)
    setPickIntegrationOpen(false)
    setPickFolderOpen(false)
    setPickedProvider(null)
    setConnectTarget(connection)
    setConnectorPickerOpen(false)
    setConnectorPickerSkipCredentials(false)
    setConnectorCreateOpen(false)
    setConnectorEditOpen(false)
    setConnectorConfigureOpen(false)
    setPendingConnectorName(null)
    setConnectorManageOpen(false)
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
    setCreatedConnectors([])
    setDisabledConnectorIds(new Set())
    setEditingConnector(null)
    setDeletingConnector(null)
    setConnectorCreateReturnToManage(false)
    setConnectorEditReturnToManage(false)
  }

  const handleCloseConnect = () => {
    setConnectTarget(null)
    setConnectorPickerOpen(false)
    setConnectorCreateOpen(false)
    setConnectorEditOpen(false)
    setConnectorConfigureOpen(false)
    setPendingConnectorName(null)
    setConnectorManageOpen(false)
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
    setCreatedConnectors([])
    setDisabledConnectorIds(new Set())
    setEditingConnector(null)
    setDeletingConnector(null)
    setConnectorCreateReturnToManage(false)
    setConnectorEditReturnToManage(false)
  }

  const handleConfirmConnect = (_draft: KnowledgeBaseConnectIntegrationDraft) => {
    if (connectTarget) {
      setSessionConnectedConnectionIds((prev) => {
        const next = new Set(prev)
        next.add(connectTarget.id)
        return next
      })
    }
    setConnectorPickerSkipCredentials(false)
    setConnectorPickerOpen(true)
  }

  const handleBackToConnectCredentials = () => {
    if (connectorPickerSkipCredentials) {
      setConnectorPickerOpen(false)
      setConnectTarget(null)
      setConnectorPickerSkipCredentials(false)
      setPickIntegrationOpen(true)
      return
    }
    setConnectorPickerOpen(false)
  }

  const handleOpenConnectorCreate = (returnToManage = false) => {
    setConnectorManageOpen(false)
    setConnectorCreateOpen(true)
    setConnectorCreateReturnToManage(returnToManage)
  }

  const handleEditConnector = (connector: { id: string; name: string }, returnToManage = false) => {
    setEditingConnector(connector)
    setConnectorManageOpen(false)
    setConnectorEditOpen(true)
    setConnectorEditReturnToManage(returnToManage)
  }

  const handleCloseConnectorEdit = () => {
    setConnectorEditOpen(false)
    setEditingConnector(null)
    setConnectorManageOpen(connectorEditReturnToManage)
    setConnectorEditReturnToManage(false)
  }

  const handleConfirmEditConnector = (connectorName: string) => {
    if (!editingConnector) return
    const trimmed = connectorName.trim()
    if (!trimmed) return
    const returnToManage = connectorEditReturnToManage
    setCreatedConnectors((prev) =>
      prev.map((entry) => (entry.id === editingConnector.id ? { ...entry, name: trimmed } : entry)),
    )
    setConnectorEditOpen(false)
    setEditingConnector(null)
    setConnectorManageOpen(returnToManage)
    setConnectorEditReturnToManage(false)
  }

  const handleRequestDeleteConnector = (connector: { id: string; name: string }) => {
    setDeletingConnector(connector)
  }

  const handleCloseDeleteConnector = () => {
    setDeletingConnector(null)
  }

  const handleConfirmDeleteConnector = () => {
    if (!deletingConnector) return
    setCreatedConnectors((prev) => prev.filter((entry) => entry.id !== deletingConnector.id))
    setDisabledConnectorIds((prev) => {
      const next = new Set(prev)
      next.delete(deletingConnector.id)
      return next
    })
    setDeletingConnector(null)
  }

  const handleOpenConnectorManage = () => {
    setConnectorManageOpen(true)
  }

  const handleBackFromConnectorManage = () => {
    setConnectorManageOpen(false)
  }

  const handleSetConnectorDisabled = (connectorId: string, disabled: boolean) => {
    setDisabledConnectorIds((prev) => {
      const next = new Set(prev)
      if (disabled) {
        next.add(connectorId)
      } else {
        next.delete(connectorId)
      }
      return next
    })
  }

  const handleCloseConnectorCreate = () => {
    setConnectorCreateOpen(false)
    setPendingConnectorName(null)
    setConnectorManageOpen(connectorCreateReturnToManage)
    setConnectorCreateReturnToManage(false)
  }

  const handleConnectorSelect = (connector: { id: string; name: string }) => {
    setSelectedConnector(connector)
    setCreateConnectionOpen(true)
  }

  const handleBackFromCreateConnection = () => {
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
  }

  const handleCloseCreateConnection = () => {
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
  }

  const handleSubmitCreateConnection = (_draft: KnowledgeBaseCreateConnectionDraft) => {
    setCreateConnectionOpen(false)
    setSelectedConnector(null)
  }

  const handleProceedToConnectorConfig = (connectorName: string) => {
    const trimmed = connectorName.trim()
    if (!trimmed) return
    setPendingConnectorName(trimmed)
    setConnectorCreateOpen(false)
    setConnectorConfigureOpen(true)
  }

  const handleBackFromConnectorConfig = () => {
    setConnectorConfigureOpen(false)
    setConnectorCreateOpen(true)
  }

  const handleDiscardConnectorConfig = () => {
    setConnectorConfigureOpen(false)
    setPendingConnectorName(null)
    setConnectorManageOpen(connectorCreateReturnToManage)
    setConnectorCreateReturnToManage(false)
  }

  const handleSaveConnectorConfig = () => {
    if (!connectTarget || !pendingConnectorName) return
    const returnToManage = connectorCreateReturnToManage
    const trimmedName = pendingConnectorName.trim()
    if (!trimmedName) return

    setCreatedConnectors((prev) => [
      ...prev,
      {
        id: `connector-${connectTarget.id}-${Date.now()}`,
        connectionId: connectTarget.id,
        name: trimmedName,
        createdAt: Date.now(),
      },
    ])
    setConnectorConfigureOpen(false)
    setConnectorCreateOpen(false)
    setPendingConnectorName(null)
    setConnectorCreateReturnToManage(false)

    if (returnToManage) {
      setConnectorPickerOpen(false)
      setConnectorManageOpen(true)
    } else {
      setConnectorManageOpen(false)
      setConnectorPickerOpen(true)
    }
  }

  const activeCreatedConnectors = useMemo(
    () =>
      connectTarget
        ? createdConnectors.filter((entry) => entry.connectionId === connectTarget.id)
        : [],
    [connectTarget, createdConnectors],
  )

  const activeSourceModal = useMemo(() => {
    if (pickFolderOpen) return 'folder' as const
    if (pickIntegrationOpen) return 'integration' as const
    if (addSourceOpen) return 'add-source' as const
    return null
  }, [pickFolderOpen, pickIntegrationOpen, addSourceOpen])

  const activeConnectModal = useMemo(() => {
    if (!connectTarget || pickIntegrationOpen || pickFolderOpen || addSourceOpen || uploadLocalOpen) return null
    if (deletingConnector) return 'delete-connector' as const
    if (connectorConfigureOpen) return 'configure' as const
    if (connectorCreateOpen) return 'create' as const
    if (connectorEditOpen) return 'edit' as const
    if (createConnectionOpen) return 'create-connection' as const
    if (connectorManageOpen) return 'manage' as const
    if (connectorPickerOpen) return 'connector-picker' as const
    return 'credentials' as const
  }, [
    connectTarget,
    deletingConnector,
    connectorConfigureOpen,
    connectorCreateOpen,
    connectorEditOpen,
    createConnectionOpen,
    connectorManageOpen,
    connectorPickerOpen,
    pickIntegrationOpen,
    pickFolderOpen,
    addSourceOpen,
    uploadLocalOpen,
  ])

  const showConnectorPickerModal = Boolean(
    connectTarget &&
      connectorPickerOpen &&
      !pickIntegrationOpen &&
      !pickFolderOpen &&
      !uploadLocalOpen &&
      !connectorManageOpen &&
      !deletingConnector &&
      activeConnectModal !== 'credentials',
  )

  const handleCloseFolderPick = () => {
    setPickFolderOpen(false)
    setPickedProvider(null)
  }

  const handleConfirmFolders = (
    provider: KnowledgeBaseIntegrationProvider,
    folderIds: string[],
  ) => {
    onConfirmIntegrationFolders(provider, folderIds)
    setPickFolderOpen(false)
    setPickedProvider(null)
  }

  const { iconFrom, iconTo } = resolveKnowledgeBaseIconColors(item)
  const iconStyle = {
    '--kb-icon-from': iconFrom,
    '--kb-icon-to': iconTo,
  } as CSSProperties

  return (
    <div className="kb-detail-workspace">
      {processDoc ? (
        <KnowledgeBaseDocProcessDrawer
          locale={locale}
          doc={processDoc}
          label={docName(processDoc, locale)}
          onClose={() => setProcessDoc(null)}
        />
      ) : chunksDoc ? (
        <KnowledgeBaseDocChunksDrawer
          locale={locale}
          doc={chunksDoc}
          label={docName(chunksDoc, locale)}
          onClose={() => setChunksDoc(null)}
        />
      ) : insertBlockDoc ? (
        <KnowledgeBaseDocInsertBlockDrawer
          key={insertBlockDoc.id}
          locale={locale}
          doc={insertBlockDoc}
          label={docName(insertBlockDoc, locale)}
          onClose={() => setInsertBlockDoc(null)}
        />
      ) : (
        <>
      <KnowledgeBaseDocApiModal
        locale={locale}
        open={Boolean(apiDoc)}
        knowledgeBaseId={item.id}
        document={apiDoc}
        documentName={apiDoc ? docName(apiDoc, locale) : ''}
        onClose={() => setApiDoc(null)}
      />
      <div className="kb-detail">
      <button
        type="button"
        className="kb-back-btn"
        onClick={() => {
          closeAllDocDrawers()
          onBack()
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {kbT(locale, 'detailBack')}
      </button>

      <header className="kb-detail-header">
        <div className="kb-detail-title-row">
          <div className="kb-detail-title-main">
            <div className="kb-card-icon kb-card-icon--lg" style={iconStyle} aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  d="M4 6a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M14 4v6h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="kb-detail-title-content">
              <h2 className="kb-detail-title">{name}</h2>
              <p className="kb-detail-desc">{description}</p>
              <dl className="kb-detail-stats">
                <div>
                  <dt>{kbT(locale, 'documents')}</dt>
                  <dd>{item.documentCount}</dd>
                </div>
                <div>
                  <dt>{kbT(locale, 'chunks')}</dt>
                  <dd>{item.chunkCount}</dd>
                </div>
                <div>
                  <dt>{kbT(locale, 'linkedAgents')}</dt>
                  <dd>{item.linkedAgents}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="kb-detail-header-actions">
            {canUploadDocuments ? (
            <button
              type="button"
              className="agents-btn agents-btn-primary kb-detail-upload-btn"
              onClick={() =>
                canOpenUploadSourcePicker ? setAddSourceOpen(true) : setUploadLocalOpen(true)
              }
            >
              {kbT(locale, 'detailUploadBtn')}
            </button>
            ) : null}
            {canEditKb ? (
            <div
              className="kb-doc-menu-wrap kb-detail-more-actions"
              ref={moreActionsRef}
              onClick={stopMenuEvent}
              onMouseDown={stopMenuEvent}
            >
              <button
                type="button"
                className={`agents-btn kb-detail-more-actions-btn${moreActionsOpen ? ' is-open' : ''}`}
                aria-expanded={moreActionsOpen}
                aria-haspopup="menu"
                onClick={(event) => {
                  stopMenuEvent(event)
                  setMoreActionsOpen((open) => !open)
                }}
              >
                {kbT(locale, 'detailMoreActions')}
              </button>
              <KnowledgeBaseDocActionMenu
                open={moreActionsOpen}
                locale={locale}
                hiddenKeys={[
                  'docPreviewProcess',
                  'docViewEditChunks',
                  'docInsertBlock',
                  'docViewApi',
                ]}
                leadingItems={[
                  {
                    key: 'detail-refresh',
                    labelKey: 'detailRefresh',
                    icon: 'refresh',
                    onClick: handleDetailRefresh,
                  },
                ]}
                onMouseDown={stopMenuEvent}
                onRequestDelete={onRequestDeleteKnowledgeBase}
                onItemClick={closeMoreActionsMenu}
              />
            </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="kb-detail-docs" aria-labelledby="kb-detail-docs-heading">
        <div className="kb-detail-docs-head">
          <h3 id="kb-detail-docs-heading">{kbT(locale, 'detailDocuments')}</h3>
        </div>
        <KnowledgeBaseDocTable
          key={item.id}
          locale={locale}
          documents={item.documents}
          docLabel={(doc) => docName(doc, locale)}
          onPreviewProcess={handlePreviewProcess}
          onViewEditChunks={handleViewEditChunks}
          onInsertBlock={handleInsertBlock}
          onViewApi={handleViewApi}
          onDownloadDocument={onDownloadDocument}
          onRetryDocument={onRetryDocument}
          onRequestDeleteDocument={onRequestDeleteDocument}
          onDeleteDocuments={onDeleteDocuments}
          canDeleteDocuments={canEditKb}
          canUseFullDocActions={canUseFullDocActions}
        />
      </section>

      {canViewIntegrations ? (
      <section className="kb-detail-integrations" aria-labelledby="kb-detail-integrations-heading">
        <div className="kb-detail-docs-head">
          <div>
            <div className="kb-detail-docs-head-title">
              <h3 id="kb-detail-integrations-heading">{kbT(locale, 'detailIntegrations')}</h3>
              <span className="kb-detail-section-info-wrap">
                <button
                  type="button"
                  className="kb-detail-section-info"
                  aria-label={kbT(locale, 'detailIntegrationsHint')}
                  aria-describedby="kb-detail-integrations-hint"
                >
                  <span aria-hidden="true">i</span>
                </button>
                <span
                  id="kb-detail-integrations-hint"
                  role="tooltip"
                  className="kb-detail-section-info-popover"
                >
                  {kbT(locale, 'detailIntegrationsHint')}
                </span>
              </span>
            </div>
          </div>
          {canManageIntegrations ? (
          <button
            type="button"
            className="agents-btn agents-btn-primary kb-detail-upload-btn"
            onClick={handleOpenIntegrationFilePick}
          >
            {kbT(locale, 'integrationPickFilesBtn')}
          </button>
          ) : null}
        </div>
        <KnowledgeBaseIntegrationPanel
          locale={locale}
          items={item.integrationItems}
          itemLabel={(integrationItem) => integrationItemName(integrationItem, locale)}
          onDownloadItem={onDownloadIntegrationItem}
          onRetryItem={onRetryIntegrationItem}
          onRequestDeleteItem={onRequestDeleteIntegrationItem}
          canDeleteItems={canEditKb}
        />
      </section>
      ) : null}

      {canOpenUploadSourcePicker ? (
        <KnowledgeBaseAddSourceModal
          locale={locale}
          open={activeSourceModal === 'add-source'}
          onClose={() => setAddSourceOpen(false)}
          onPick={handlePickSource}
        />
      ) : null}

      <KnowledgeBaseUploadLocalModal
        locale={locale}
        open={uploadLocalOpen}
        onClose={handleCloseUploadLocal}
        onConfirm={handleConfirmUploadLocal}
        showAdvancedSettings={canUseUploadAdvancedSettings}
      />

      {canManageIntegrations ? (
        <>
      <KnowledgeBasePickIntegrationModal
        locale={locale}
        open={activeSourceModal === 'integration'}
        variant={pickIntegrationVariant}
        connectedConnectionIds={connectedConnectionIds}
        canConnectWhenDisconnected={canConnectIntegrations}
        onClose={handleCloseIntegrationPick}
        onPick={handlePickIntegration}
        onConnect={handleConnectRequest}
        onOpenConnectorPicker={handleOpenConnectorPicker}
      />

      {activeConnectModal === 'credentials' ? (
        <KnowledgeBaseConnectIntegrationModal
          locale={locale}
          connection={connectTarget}
          onClose={handleCloseConnect}
          onSubmit={handleConfirmConnect}
        />
      ) : null}

      {showConnectorPickerModal ? (
        <KnowledgeBaseConnectConnectorModal
          locale={locale}
          connection={connectTarget}
          createdConnectors={activeCreatedConnectors}
          disabledConnectorIds={disabledConnectorIds}
          onBack={handleBackToConnectCredentials}
          onClose={handleCloseConnect}
          onOpenCreate={() => handleOpenConnectorCreate()}
          onOpenManage={handleOpenConnectorManage}
          onEditConnector={(connector) => handleEditConnector(connector)}
          onSetConnectorDisabled={handleSetConnectorDisabled}
          onConnectorSelect={handleConnectorSelect}
        />
      ) : null}

      {activeConnectModal === 'manage' ? (
        <KnowledgeBaseManageConnectorsModal
          locale={locale}
          connection={connectTarget}
          createdConnectors={activeCreatedConnectors}
          disabledConnectorIds={disabledConnectorIds}
          onBack={handleBackFromConnectorManage}
          onClose={handleCloseConnect}
          onOpenCreate={() => handleOpenConnectorCreate(true)}
          onEditConnector={(connector) => handleEditConnector(connector, true)}
          onDeleteConnector={handleRequestDeleteConnector}
          onSetConnectorDisabled={handleSetConnectorDisabled}
        />
      ) : null}

      {activeConnectModal === 'delete-connector' ? (
        <KnowledgeBaseDeleteConnectorModal
          locale={locale}
          connectorName={deletingConnector?.name ?? null}
          onClose={handleCloseDeleteConnector}
          onConfirm={handleConfirmDeleteConnector}
        />
      ) : null}

      {activeConnectModal === 'create-connection' ? (
        <KnowledgeBaseCreateConnectionModal
          locale={locale}
          connection={connectTarget}
          connectorName={selectedConnector?.name ?? null}
          open
          onBack={handleBackFromCreateConnection}
          onClose={handleCloseCreateConnection}
          onSubmit={handleSubmitCreateConnection}
        />
      ) : null}

      {activeConnectModal === 'create' ? (
        <KnowledgeBaseCreateConnectorModal
          locale={locale}
          connection={connectTarget}
          open
          draftName={pendingConnectorName ?? ''}
          onClose={handleCloseConnectorCreate}
          onSubmit={handleProceedToConnectorConfig}
        />
      ) : null}

      {activeConnectModal === 'configure' ? (
        <KnowledgeBaseConfigureConnectorModal
          locale={locale}
          connection={connectTarget}
          connectorName={pendingConnectorName}
          open
          onBack={handleBackFromConnectorConfig}
          onClose={handleDiscardConnectorConfig}
          onDelete={handleDiscardConnectorConfig}
          onSave={handleSaveConnectorConfig}
        />
      ) : null}

      {activeConnectModal === 'edit' ? (
        <KnowledgeBaseEditConnectorModal
          locale={locale}
          connector={editingConnector}
          open
          onClose={handleCloseConnectorEdit}
          onSubmit={handleConfirmEditConnector}
        />
      ) : null}

      {activeSourceModal === 'folder' ? (
        <KnowledgeBasePickIntegrationFolderModal
          locale={locale}
          open
          provider={pickedProvider}
          onClose={handleCloseFolderPick}
          onBack={handleBackToIntegrationPick}
          onConfirm={handleConfirmFolders}
        />
      ) : null}
        </>
      ) : null}
    </div>
        </>
      )}
    </div>
  )
}
