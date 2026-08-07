import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem, KnowledgeBaseListViewMode, KnowledgeBaseSort, KnowledgeBaseWorkspaceFolder } from '../types'
import { KnowledgeBaseBulkDeleteModal } from './KnowledgeBaseBulkDeleteModal'
import { KnowledgeBaseCard } from './KnowledgeBaseCard'
import { KnowledgeBaseListTable } from './KnowledgeBaseListTable'
import { KnowledgeBaseToolbar } from './KnowledgeBaseToolbar'
import { KnowledgeBaseWorkspaceFolderCard } from './KnowledgeBaseWorkspaceFolderCard'

type KnowledgeBaseListTab = 'all' | 'folders' | 'knowledge-bases'

type KnowledgeBaseListViewProps = {
  locale: AppLocale
  folders: KnowledgeBaseWorkspaceFolder[]
  items: KnowledgeBaseItem[]
  allItems: KnowledgeBaseItem[]
  search: string
  sort: KnowledgeBaseSort
  viewMode: KnowledgeBaseListViewMode
  onSearchChange: (value: string) => void
  onSortChange: (sort: KnowledgeBaseSort) => void
  onViewModeChange: (mode: KnowledgeBaseListViewMode) => void
  onOpenFolder: (folderId: string) => void
  onEditFolder: (folder: KnowledgeBaseWorkspaceFolder) => void
  onAuthorizeFolder: (folder: KnowledgeBaseWorkspaceFolder) => void
  onRequestDeleteFolder: (folder: KnowledgeBaseWorkspaceFolder) => void
  onOpen: (id: string) => void
  onEditItem: (item: KnowledgeBaseItem) => void
  onMoveItem: (item: KnowledgeBaseItem) => void
  onOpenPermissionsItem: (item: KnowledgeBaseItem) => void
  onRequestDeleteItem: (item: KnowledgeBaseItem) => void
  onBulkDelete: (payload: { folderIds: string[]; itemIds: string[] }) => void
  canManagePermissions?: boolean
  canEditKb?: boolean
  localizeFolderName: (folder: KnowledgeBaseWorkspaceFolder) => string
  localizeName: (item: KnowledgeBaseItem) => string
  localizeDescription: (item: KnowledgeBaseItem) => string
}

function parseSelectedIds(selectedIds: Set<string>) {
  const folderIds: string[] = []
  const itemIds: string[] = []

  selectedIds.forEach((rowId) => {
    if (rowId.startsWith('folder-')) {
      folderIds.push(rowId.slice('folder-'.length))
      return
    }
    if (rowId.startsWith('kb-')) {
      itemIds.push(rowId.slice('kb-'.length))
    }
  })

  return { folderIds, itemIds }
}

export function KnowledgeBaseListView({
  locale,
  folders,
  items,
  allItems,
  search,
  sort,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onOpenFolder,
  onEditFolder,
  onAuthorizeFolder,
  onRequestDeleteFolder,
  onOpen,
  onEditItem,
  onMoveItem,
  onOpenPermissionsItem,
  onRequestDeleteItem,
  onBulkDelete,
  canManagePermissions = false,
  canEditKb = false,
  localizeFolderName,
  localizeName,
  localizeDescription,
}: KnowledgeBaseListViewProps) {
  const [listTab, setListTab] = useState<KnowledgeBaseListTab>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const tabCounts = useMemo(
    () => ({
      all: folders.length + items.length,
      folders: folders.length,
      'knowledge-bases': items.length,
    }),
    [folders.length, items.length],
  )

  const visibleFolders = listTab === 'knowledge-bases' ? [] : folders
  const visibleItems = listTab === 'folders' ? [] : items
  const isEmpty = visibleFolders.length === 0 && visibleItems.length === 0
  const selectedCount = selectedIds.size

  const clearSelection = () => setSelectedIds(new Set())

  const handleConfirmBulkDelete = () => {
    const payload = parseSelectedIds(selectedIds)
    onBulkDelete(payload)
    setBulkDeleteOpen(false)
    clearSelection()
  }

  return (
    <div className="kb-list-layout">
      <div className="agents-tabs" role="tablist" aria-label={kbT(locale, 'listFilterLabel')}>
        {([
          ['all', kbT(locale, 'categoryAll'), tabCounts.all],
          ['folders', kbT(locale, 'listTabFolders'), tabCounts.folders],
          ['knowledge-bases', kbT(locale, 'listTabKnowledgeBases'), tabCounts['knowledge-bases']],
        ] as Array<[KnowledgeBaseListTab, string, number]>).map(([key, label, count]) => (
          <button
            key={key}
            className={listTab === key ? 'agents-tab is-active' : 'agents-tab'}
            type="button"
            role="tab"
            aria-selected={listTab === key}
            onClick={() => {
              setListTab(key)
              clearSelection()
            }}
          >
            {label} <span className="agents-tab-count">{count}</span>
          </button>
        ))}
      </div>

      <KnowledgeBaseToolbar
        locale={locale}
        search={search}
        sort={sort}
        viewMode={viewMode}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onViewModeChange={(mode) => {
          onViewModeChange(mode)
          clearSelection()
        }}
      />

      {isEmpty ? (
        <div className="kb-empty" role="status">
          <p className="kb-empty-title">{kbT(locale, 'emptyTitle')}</p>
          <p className="kb-empty-hint">{kbT(locale, 'emptyHint')}</p>
        </div>
      ) : viewMode === 'table' ? (
        <KnowledgeBaseListTable
          locale={locale}
          folders={visibleFolders}
          items={visibleItems}
          allItems={allItems}
          localizeFolderName={localizeFolderName}
          localizeName={localizeName}
          localizeDescription={localizeDescription}
          onOpenFolder={onOpenFolder}
          onEditFolder={onEditFolder}
          onAuthorizeFolder={onAuthorizeFolder}
          onRequestDeleteFolder={onRequestDeleteFolder}
          onOpen={onOpen}
          onEditItem={onEditItem}
          onMoveItem={onMoveItem}
          onOpenPermissionsItem={onOpenPermissionsItem}
          onRequestDeleteItem={onRequestDeleteItem}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onRequestBulkDelete={() => setBulkDeleteOpen(true)}
          onClearSelection={clearSelection}
          canManagePermissions={canManagePermissions}
          canEditKb={canEditKb}
        />
      ) : (
        <div className="agents-grid kb-grid">
          {visibleFolders.map((folder) => (
            <KnowledgeBaseWorkspaceFolderCard
              key={folder.id}
              locale={locale}
              folder={folder}
              name={localizeFolderName(folder)}
              kbCount={allItems.filter((item) => item.workspaceFolderId === folder.id).length}
              onOpen={() => onOpenFolder(folder.id)}
              onEdit={onEditFolder}
              onAuthorize={onAuthorizeFolder}
              onRequestDelete={onRequestDeleteFolder}
              canManagePermissions={canManagePermissions}
              canEditKb={canEditKb}
            />
          ))}
          {visibleItems.map((item) => (
            <KnowledgeBaseCard
              key={item.id}
              locale={locale}
              item={item}
              name={localizeName(item)}
              description={localizeDescription(item)}
              onOpen={() => onOpen(item.id)}
              onEdit={onEditItem}
              onMove={onMoveItem}
              onOpenPermissions={onOpenPermissionsItem}
              onRequestDelete={onRequestDeleteItem}
              canManagePermissions={canManagePermissions}
              canEditKb={canEditKb}
            />
          ))}
        </div>
      )}

      <KnowledgeBaseBulkDeleteModal
        locale={locale}
        open={bulkDeleteOpen}
        selectedCount={selectedCount}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  )
}
