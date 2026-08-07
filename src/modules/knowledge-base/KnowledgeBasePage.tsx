import { useCallback, useState } from 'react'

import { useLocale } from '../../i18n/LocaleContext'
import { KnowledgeBaseSuccessToast } from './components/KnowledgeBaseSuccessToast'
import { KnowledgeBaseCreateModal } from './components/KnowledgeBaseCreateModal'
import { KnowledgeBaseCreateFolderModal } from './components/KnowledgeBaseCreateFolderModal'
import { KnowledgeBaseDeleteDocumentModal } from './components/KnowledgeBaseDeleteDocumentModal'
import { KnowledgeBaseDeleteIntegrationModal } from './components/KnowledgeBaseDeleteIntegrationModal'
import { KnowledgeBaseDeleteModal } from './components/KnowledgeBaseDeleteModal'
import { KnowledgeBaseDeleteWorkspaceFolderModal } from './components/KnowledgeBaseDeleteWorkspaceFolderModal'
import { KnowledgeBaseEditModal } from './components/KnowledgeBaseEditModal'
import { KnowledgeBaseEditWorkspaceFolderModal } from './components/KnowledgeBaseEditWorkspaceFolderModal'
import { KnowledgeBasePermissionsDrawer } from './components/KnowledgeBasePermissionsDrawer'
import { KnowledgeBaseDetailView } from './components/KnowledgeBaseDetailView'
import { KnowledgeBaseFolderView } from './components/KnowledgeBaseFolderView'
import { KnowledgeBaseHeader } from './components/KnowledgeBaseHeader'
import { KnowledgeBaseListView } from './components/KnowledgeBaseListView'
import { KnowledgeBaseMoveItemModal } from './components/KnowledgeBaseMoveItemModal'
import { useKnowledgeBase } from './hooks/useKnowledgeBase'
import { useKnowledgeBaseCapabilities } from './hooks/useKnowledgeBaseCapabilities'
import type { KnowledgeBaseItem, KnowledgeBaseListViewMode, KnowledgeBaseWorkspaceFolder } from './types'
import '../access-control/access-control.css'
import './knowledge-base.css'

/** 知识库模块唯一对外页面入口，不依赖 Agent / 场景 / 应用市场等业务状态 */
export function KnowledgeBasePage() {
  const { locale } = useLocale()
  const kb = useKnowledgeBase(locale)
  const caps = useKnowledgeBaseCapabilities(kb.view, kb.selectedItem)

  const localizeName = useCallback(
    (item: KnowledgeBaseItem) => kb.localizeName(item, locale),
    [kb, locale],
  )
  const localizeDescription = useCallback(
    (item: KnowledgeBaseItem) => kb.localizeDescription(item, locale),
    [kb, locale],
  )
  const localizeFolderName = useCallback(
    (folder: KnowledgeBaseWorkspaceFolder) => (locale === 'zh' ? folder.nameZh : folder.nameEn),
    [locale],
  )
  const [processViewActive, setProcessViewActive] = useState(false)
  const [listViewMode, setListViewMode] = useState<KnowledgeBaseListViewMode>('cards')
  const permissionsOpen = kb.permissionsItem != null || kb.permissionsFolder != null

  return (
    <div className={`kb-page${processViewActive ? ' kb-page--doc-process' : ''}`}>
      <KnowledgeBaseSuccessToast
        locale={locale}
        open={kb.createSuccessToastOpen}
        titleKey={kb.successToastTitleKey}
        subKey={kb.successToastSubKey}
      />
      <div className="kb-page-shell">
        <div className="kb-page-shell-main">
      {!processViewActive ? (
        <KnowledgeBaseHeader
          locale={locale}
          showCreateActions={kb.view === 'list'}
          canCreateKb={caps.canCreateKbAtRoot}
          canCreateFolder={caps.canCreateFolder}
          onCreate={kb.openCreate}
          onCreateFolder={kb.openCreateFolder}
        />
      ) : null}
      {kb.view === 'detail' && kb.selectedItem ? (
        <KnowledgeBaseDetailView
          locale={locale}
          item={kb.selectedItem}
          name={localizeName(kb.selectedItem)}
          description={localizeDescription(kb.selectedItem)}
          onBack={kb.closeDetail}
          onProcessViewActiveChange={setProcessViewActive}
          onDownloadDocument={(documentId) => kb.downloadDocument(kb.selectedItem!.id, documentId)}
          onRetryDocument={(documentId) => kb.retryDocumentIndex(kb.selectedItem!.id, documentId)}
          onRequestDeleteDocument={(documentId) =>
            kb.requestDeleteDocument(kb.selectedItem!.id, documentId)
          }
          onDeleteDocuments={(documentIds) =>
            kb.deleteDocuments(kb.selectedItem!.id, documentIds)
          }
          onUploadLocalDocuments={(documents) =>
            kb.uploadLocalDocuments(kb.selectedItem!.id, documents)
          }
          onConfirmIntegrationFolders={(provider, folderIds) =>
            kb.confirmIntegrationFolderPick(kb.selectedItem!.id, provider, folderIds)
          }
          onDownloadIntegrationItem={(itemId) =>
            kb.downloadIntegrationItem(kb.selectedItem!.id, itemId)
          }
          onRetryIntegrationItem={(itemId) =>
            kb.retryIntegrationItemIndex(kb.selectedItem!.id, itemId)
          }
          onRequestDeleteIntegrationItem={(itemId) =>
            kb.requestDeleteIntegrationItem(kb.selectedItem!.id, itemId)
          }
          onRequestDeleteKnowledgeBase={() => kb.requestDeleteItem(kb.selectedItem!)}
          canUploadDocuments={caps.canUploadDocuments}
          canOpenUploadSourcePicker={caps.canOpenUploadSourcePicker}
          canViewIntegrations={caps.canViewIntegrations}
          canManageIntegrations={caps.canManageIntegrations}
          canConnectIntegrations={caps.canConnectIntegrations}
          canEditKb={caps.canEditKb}
          canUseUploadAdvancedSettings={caps.canUseUploadAdvancedSettings}
          canUseFullDocActions={caps.canUseFullDocActions}
        />
      ) : kb.view === 'folder' && kb.selectedFolder ? (
        <KnowledgeBaseFolderView
          locale={locale}
          folderName={localizeFolderName(kb.selectedFolder)}
          items={kb.filteredFolderItems}
          search={kb.search}
          sort={kb.sort}
          viewMode={listViewMode}
          onSearchChange={kb.setSearch}
          onSortChange={kb.setSort}
          onViewModeChange={setListViewMode}
          onBack={kb.closeFolder}
          onCreate={kb.openCreate}
          onCreateFolder={kb.openCreateFolder}
          onOpenFolderPermissions={() => {
            if (kb.selectedFolder && caps.canManagePermissions) kb.openPermissionsFolder(kb.selectedFolder)
          }}
          canManagePermissions={caps.canManagePermissions}
          canCreateKb={caps.canCreateKb}
          canCreateFolder={caps.canCreateFolder}
          canEditKb={caps.canEditKb}
          onOpen={kb.openDetail}
          onEditItem={kb.openEditItem}
          onMoveItem={kb.openMoveItem}
          onOpenPermissionsItem={caps.canManagePermissions ? kb.openPermissionsItem : () => {}}
          onRequestDeleteItem={kb.requestDeleteItem}
          localizeName={localizeName}
          localizeDescription={localizeDescription}
        />
      ) : (
        <KnowledgeBaseListView
          locale={locale}
          folders={kb.filteredWorkspaceFolders}
          items={kb.filteredRootItems}
          allItems={kb.items}
          search={kb.search}
          sort={kb.sort}
          viewMode={listViewMode}
          onSearchChange={kb.setSearch}
          onSortChange={kb.setSort}
          onViewModeChange={setListViewMode}
          onOpenFolder={kb.openFolder}
          onEditFolder={kb.openEditWorkspaceFolder}
          onAuthorizeFolder={caps.canManagePermissions ? kb.openPermissionsFolder : () => {}}
          onRequestDeleteFolder={kb.requestDeleteWorkspaceFolder}
          onOpen={kb.openDetail}
          onEditItem={kb.openEditItem}
          onMoveItem={kb.openMoveItem}
          onOpenPermissionsItem={caps.canManagePermissions ? kb.openPermissionsItem : () => {}}
          canManagePermissions={caps.canManagePermissions}
          canEditKb={caps.canEditKb}
          onRequestDeleteItem={kb.requestDeleteItem}
          onBulkDelete={kb.bulkDeleteListSelection}
          localizeFolderName={localizeFolderName}
          localizeName={localizeName}
          localizeDescription={localizeDescription}
        />
      )}
        </div>
      </div>
      <KnowledgeBaseCreateModal
        locale={locale}
        open={kb.createOpen}
        onClose={kb.closeCreate}
        onSubmit={kb.createKnowledgeBase}
      />
      <KnowledgeBaseCreateFolderModal
        locale={locale}
        open={kb.createFolderOpen}
        onClose={kb.closeCreateFolder}
        onSubmit={(name) => kb.createFolder({ name })}
      />
      <KnowledgeBaseEditWorkspaceFolderModal
        locale={locale}
        folder={kb.editingWorkspaceFolder}
        onClose={kb.closeEditWorkspaceFolder}
        onSubmit={kb.updateWorkspaceFolder}
      />
      <KnowledgeBaseDeleteWorkspaceFolderModal
        locale={locale}
        folder={kb.deletingWorkspaceFolder}
        folderName={
          kb.deletingWorkspaceFolder ? localizeFolderName(kb.deletingWorkspaceFolder) : ''
        }
        onClose={kb.closeDeleteWorkspaceFolder}
        onConfirm={kb.confirmDeleteWorkspaceFolder}
      />
      <KnowledgeBaseMoveItemModal
        locale={locale}
        item={kb.movingItem}
        itemName={kb.movingItem ? localizeName(kb.movingItem) : ''}
        folders={kb.workspaceFolders}
        localizeFolderName={localizeFolderName}
        onClose={kb.closeMoveItem}
        onSubmit={kb.moveItemToFolder}
      />
      <KnowledgeBaseEditModal
        locale={locale}
        item={kb.editingItem}
        onClose={kb.closeEditItem}
        onSubmit={kb.updateKnowledgeBase}
      />
      <KnowledgeBaseDeleteModal
        locale={locale}
        item={kb.deletingItem}
        itemName={kb.deletingItem ? localizeName(kb.deletingItem) : ''}
        onClose={kb.closeDeleteItem}
        onConfirm={kb.confirmDeleteItem}
      />
      <KnowledgeBaseDeleteDocumentModal
        locale={locale}
        document={kb.deletingDocument?.document ?? null}
        documentName={
          kb.deletingDocument
            ? locale === 'zh'
              ? kb.deletingDocument.document.nameZh
              : kb.deletingDocument.document.nameEn
            : ''
        }
        onClose={kb.closeDeleteDocument}
        onConfirm={kb.confirmDeleteDocument}
      />
      <KnowledgeBaseDeleteIntegrationModal
        locale={locale}
        item={kb.deletingIntegration?.item ?? null}
        itemName={
          kb.deletingIntegration
            ? locale === 'zh'
              ? kb.deletingIntegration.item.nameZh
              : kb.deletingIntegration.item.nameEn
            : ''
        }
        onClose={kb.closeDeleteIntegration}
        onConfirm={kb.confirmDeleteIntegrationItem}
      />
      {caps.canManagePermissions && permissionsOpen ? (
        <KnowledgeBasePermissionsDrawer
          locale={locale}
          item={kb.permissionsItem}
          folder={kb.permissionsFolder}
          targetName={
            kb.permissionsItem
              ? localizeName(kb.permissionsItem)
              : kb.permissionsFolder
                ? localizeFolderName(kb.permissionsFolder)
                : ''
          }
          onClose={kb.closePermissionsItem}
          onSave={kb.savePermissionsItem}
        />
      ) : null}
    </div>
  )
}
