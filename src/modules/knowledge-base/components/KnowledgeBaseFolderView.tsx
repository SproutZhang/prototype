import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem, KnowledgeBaseListViewMode, KnowledgeBaseSort } from '../types'
import { KnowledgeBaseCreateActions } from './KnowledgeBaseCreateActions'
import { KnowledgeBaseGrid } from './KnowledgeBaseGrid'
import { KnowledgeBaseListTable } from './KnowledgeBaseListTable'
import { KnowledgeBaseToolbar } from './KnowledgeBaseToolbar'

type KnowledgeBaseFolderViewProps = {
  locale: AppLocale
  folderName: string
  items: KnowledgeBaseItem[]
  search: string
  sort: KnowledgeBaseSort
  viewMode: KnowledgeBaseListViewMode
  onSearchChange: (value: string) => void
  onSortChange: (sort: KnowledgeBaseSort) => void
  onViewModeChange: (mode: KnowledgeBaseListViewMode) => void
  onBack: () => void
  onCreate: () => void
  onCreateFolder: () => void
  onOpenFolderPermissions: () => void
  canManagePermissions?: boolean
  canCreateKb?: boolean
  canCreateFolder?: boolean
  canEditKb?: boolean
  onOpen: (id: string) => void
  onEditItem: (item: KnowledgeBaseItem) => void
  onMoveItem: (item: KnowledgeBaseItem) => void
  onOpenPermissionsItem: (item: KnowledgeBaseItem) => void
  onRequestDeleteItem: (item: KnowledgeBaseItem) => void
  localizeName: (item: KnowledgeBaseItem) => string
  localizeDescription: (item: KnowledgeBaseItem) => string
}

function FolderPermissionsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M12 3 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KnowledgeBaseFolderView({
  locale,
  folderName,
  items,
  search,
  sort,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onBack,
  onCreate,
  onCreateFolder,
  onOpenFolderPermissions,
  canManagePermissions = false,
  canCreateKb = true,
  canCreateFolder = true,
  canEditKb = false,
  onOpen,
  onEditItem,
  onMoveItem,
  onOpenPermissionsItem,
  onRequestDeleteItem,
  localizeName,
  localizeDescription,
}: KnowledgeBaseFolderViewProps) {
  return (
    <div className="kb-folder-view">
      <button type="button" className="kb-back-btn" onClick={onBack}>
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
        {kbT(locale, 'folderViewBack')}
      </button>

      <header className="kb-folder-view-header">
        <div className="kb-folder-view-header-lead">
          <div className="kb-folder-view-title-row">
            <h2 className="kb-folder-view-title">{folderName}</h2>
            {canManagePermissions ? (
              <button
                type="button"
                className="kb-folder-view-permissions-btn"
                aria-label={kbT(locale, 'folderPermissionsAction')}
                title={kbT(locale, 'folderPermissionsAction')}
                onClick={onOpenFolderPermissions}
              >
                <FolderPermissionsIcon />
              </button>
            ) : null}
          </div>
          <p className="kb-folder-view-hint">{kbT(locale, 'folderViewHint')}</p>
        </div>
        <div className="kb-folder-view-header-actions">
          {(canCreateKb || canCreateFolder) ? (
            <KnowledgeBaseCreateActions
              locale={locale}
              canCreateKb={canCreateKb}
              canCreateFolder={canCreateFolder}
              onCreate={onCreate}
              onCreateFolder={onCreateFolder}
            />
          ) : null}
        </div>
      </header>

      <KnowledgeBaseToolbar
        locale={locale}
        search={search}
        sort={sort}
        viewMode={viewMode}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onViewModeChange={onViewModeChange}
      />

      {viewMode === 'table' ? (
        items.length > 0 ? (
          <KnowledgeBaseListTable
            locale={locale}
            folders={[]}
            items={items}
            allItems={items}
            showFolders={false}
            localizeFolderName={() => ''}
            localizeName={localizeName}
            localizeDescription={localizeDescription}
            onOpenFolder={() => {}}
            onEditFolder={() => {}}
            onAuthorizeFolder={() => {}}
            onRequestDeleteFolder={() => {}}
            onOpen={onOpen}
            onEditItem={onEditItem}
            onMoveItem={onMoveItem}
            onOpenPermissionsItem={onOpenPermissionsItem}
            onRequestDeleteItem={onRequestDeleteItem}
            canManagePermissions={canManagePermissions}
            canEditKb={canEditKb}
          />
        ) : (
          <div className="kb-empty" role="status">
            <p className="kb-empty-title">{kbT(locale, 'folderViewEmptyTitle')}</p>
            <p className="kb-empty-hint">{kbT(locale, 'folderViewEmptyHint')}</p>
          </div>
        )
      ) : (
        <KnowledgeBaseGrid
          locale={locale}
          items={items}
          localizeName={localizeName}
          localizeDescription={localizeDescription}
          onOpen={onOpen}
          onEditItem={onEditItem}
          onMoveItem={onMoveItem}
          onOpenPermissionsItem={onOpenPermissionsItem}
          onRequestDeleteItem={onRequestDeleteItem}
          canManagePermissions={canManagePermissions}
          canEditKb={canEditKb}
          emptyTitle={kbT(locale, 'folderViewEmptyTitle')}
          emptyHint={kbT(locale, 'folderViewEmptyHint')}
        />
      )}
    </div>
  )
}
