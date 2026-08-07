import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem, KnowledgeBaseWorkspaceFolder } from '../types'
import { resolveKnowledgeBaseIconColors } from '../utils/kbIconColors'
import { KnowledgeBaseListBulkBar } from './KnowledgeBaseListBulkBar'

type KnowledgeBaseListTableProps = {
  locale: AppLocale
  folders: KnowledgeBaseWorkspaceFolder[]
  items: KnowledgeBaseItem[]
  allItems: KnowledgeBaseItem[]
  showFolders?: boolean
  localizeFolderName: (folder: KnowledgeBaseWorkspaceFolder) => string
  localizeName: (item: KnowledgeBaseItem) => string
  localizeDescription: (item: KnowledgeBaseItem) => string
  onOpenFolder: (folderId: string) => void
  onEditFolder: (folder: KnowledgeBaseWorkspaceFolder) => void
  onAuthorizeFolder: (folder: KnowledgeBaseWorkspaceFolder) => void
  onRequestDeleteFolder: (folder: KnowledgeBaseWorkspaceFolder) => void
  onOpen: (id: string) => void
  onEditItem: (item: KnowledgeBaseItem) => void
  onMoveItem: (item: KnowledgeBaseItem) => void
  onOpenPermissionsItem: (item: KnowledgeBaseItem) => void
  onRequestDeleteItem: (item: KnowledgeBaseItem) => void
  selectedIds?: Set<string>
  onSelectedIdsChange?: (ids: Set<string>) => void
  onRequestBulkDelete?: () => void
  onClearSelection?: () => void
  canManagePermissions?: boolean
  canEditKb?: boolean
}

function WorkspaceFolderIcon() {
  return (
    <svg viewBox="0 0 1024 1024" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d="M918.673 883H104.327C82.578 883 65 867.368 65 848.027V276.973C65 257.632 82.578 242 104.327 242h814.346C940.422 242 958 257.632 958 276.973v571.054C958 867.28 940.323 883 918.673 883z"
        fill="#FFE9B4"
      />
      <path
        d="M512 411H65V210.37C65 188.597 82.598 171 104.371 171h305.92c17.4 0 32.71 11.334 37.681 28.036L512 411z"
        fill="#FFB02C"
      />
      <path
        d="M918.673 883H104.327C82.578 883 65 865.42 65 843.668V335.332C65 313.58 82.578 296 104.327 296h814.346C940.422 296 958 313.58 958 335.332v508.336C958 865.32 940.323 883 918.673 883z"
        fill="#FFCA28"
      />
    </svg>
  )
}

function KnowledgeBaseRowIcon({ item }: { item: KnowledgeBaseItem }) {
  const { iconFrom, iconTo } = resolveKnowledgeBaseIconColors(item)
  const iconStyle = {
    '--agent-icon-from': iconFrom,
    '--agent-icon-via': iconTo,
    '--agent-icon-to': iconTo,
  } as CSSProperties

  return <span className="kb-table-name-icon agent-card-icon agent-card-icon-grad" style={iconStyle} aria-hidden="true" />
}

type RowActionsProps = {
  menuId: string
  menuLabel: string
  activeMenuId: string | null
  onToggleMenu: (menuId: string) => void
  onCloseMenu: () => void
  items: { key: string; label: string; danger?: boolean; onClick: () => void }[]
}

function RowActions({
  menuId,
  menuLabel,
  activeMenuId,
  onToggleMenu,
  onCloseMenu,
  items,
}: RowActionsProps) {
  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <div className="kb-table-actions-wrap" onClick={stopMenuEvent} onMouseDown={stopMenuEvent}>
      <button
        type="button"
        className="kb-table-actions-trigger"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={activeMenuId === menuId}
        onClick={(event) => {
          stopMenuEvent(event)
          onToggleMenu(menuId)
        }}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {activeMenuId === menuId ? (
        <div className="kb-table-actions-menu" role="menu" aria-label={menuLabel} onMouseDown={stopMenuEvent}>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`kb-table-actions-item${item.danger ? ' kb-table-actions-item--danger' : ''}`}
              role="menuitem"
              onClick={(event) => {
                stopMenuEvent(event)
                onCloseMenu()
                item.onClick()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function KnowledgeBaseListTable({
  locale,
  folders,
  items,
  allItems,
  showFolders = true,
  localizeFolderName,
  localizeName,
  localizeDescription,
  onOpenFolder,
  onEditFolder,
  onAuthorizeFolder,
  onRequestDeleteFolder,
  onOpen,
  onEditItem,
  onMoveItem,
  onOpenPermissionsItem,
  onRequestDeleteItem,
  selectedIds: controlledSelectedIds,
  onSelectedIdsChange,
  onRequestBulkDelete,
  onClearSelection,
  canManagePermissions = false,
  canEditKb = false,
}: KnowledgeBaseListTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(() => new Set())
  const isControlled = controlledSelectedIds != null && onSelectedIdsChange != null
  const selectedIds = isControlled ? controlledSelectedIds : internalSelectedIds
  const selectAllRef = useRef<HTMLInputElement>(null)

  const updateSelection = (next: Set<string>) => {
    if (isControlled) {
      onSelectedIdsChange(next)
      return
    }
    setInternalSelectedIds(next)
  }

  const visibleRowIds = useMemo(() => {
    const ids: string[] = []
    if (showFolders) {
      folders.forEach((folder) => ids.push(`folder-${folder.id}`))
    }
    items.forEach((item) => ids.push(`kb-${item.id}`))
    return ids
  }, [showFolders, folders, items])

  const allSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((rowId) => selectedIds.has(rowId))
  const someSelected = visibleRowIds.some((rowId) => selectedIds.has(rowId)) && !allSelected

  useEffect(() => {
    if (!activeMenuId) return
    const onDocClick = () => setActiveMenuId(null)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [activeMenuId])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  useEffect(() => {
    const visibleIdSet = new Set(visibleRowIds)
    if (isControlled) {
      const next = new Set([...controlledSelectedIds!].filter((id) => visibleIdSet.has(id)))
      if (next.size !== controlledSelectedIds!.size) {
        onSelectedIdsChange!(next)
      }
      return
    }
    setInternalSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIdSet.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [controlledSelectedIds, isControlled, onSelectedIdsChange, visibleRowIds])

  const toggleMenu = (menuId: string) => {
    setActiveMenuId((current) => (current === menuId ? null : menuId))
  }

  const stopRowEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const toggleAll = () => {
    if (allSelected) {
      updateSelection(new Set())
      return
    }
    updateSelection(new Set(visibleRowIds))
  }

  const toggleOne = (rowId: string) => {
    const next = new Set(selectedIds)
    if (next.has(rowId)) {
      next.delete(rowId)
    } else {
      next.add(rowId)
    }
    updateSelection(next)
  }

  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    action()
  }

  return (
    <section className="kb-table-shell" aria-label={kbT(locale, 'listTableLabel')}>
      <div className="kb-table-head">
        {canEditKb ? (
        <label className="kb-table-check" onClick={stopRowEvent} onMouseDown={stopRowEvent}>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label={kbT(locale, 'docListSelectAll')}
            disabled={visibleRowIds.length === 0}
          />
        </label>
        ) : null}
        <div>{kbT(locale, 'listColumnName')}</div>
        <div>{kbT(locale, 'listColumnDescription')}</div>
        <div>{kbT(locale, 'listColumnDocuments')}</div>
        <div>{kbT(locale, 'listColumnUpdated')}</div>
        <div aria-hidden="true" />
      </div>
      <div className="kb-table-body">
        {showFolders
          ? folders.map((folder) => {
              const name = localizeFolderName(folder)
              const kbCount = allItems.filter((item) => item.workspaceFolderId === folder.id).length
              const description = kbT(locale, 'workspaceFolderKbCount').replace('{count}', String(kbCount))
              const menuId = `folder-${folder.id}`
              const rowId = menuId

              return (
                <div
                  key={folder.id}
                  className="kb-table-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenFolder(folder.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => onOpenFolder(folder.id))}
                >
                  {canEditKb ? (
                  <label className="kb-table-check" onClick={stopRowEvent} onMouseDown={stopRowEvent}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rowId)}
                      onChange={() => toggleOne(rowId)}
                      aria-label={name}
                    />
                  </label>
                  ) : null}
                  <div className="kb-table-name-cell">
                    <span className="kb-table-name-icon agent-card-icon kb-table-folder-icon" aria-hidden="true">
                      <WorkspaceFolderIcon />
                    </span>
                    <span className="kb-table-name-text">{name}</span>
                  </div>
                  <div className="kb-table-desc">{description}</div>
                  <div className="kb-table-meta">{kbCount}</div>
                  <div className="kb-table-meta">{folder.updatedAt}</div>
                  {(canEditKb || canManagePermissions) ? (
                  <RowActions
                    menuId={menuId}
                    menuLabel={kbT(locale, 'workspaceFolderMoreActions')}
                    activeMenuId={activeMenuId}
                    onToggleMenu={toggleMenu}
                    onCloseMenu={() => setActiveMenuId(null)}
                    items={[
                      ...(canEditKb
                        ? [
                            {
                              key: 'edit',
                              label: kbT(locale, 'cardEdit'),
                              onClick: () => onEditFolder(folder),
                            },
                          ]
                        : []),
                      ...(canManagePermissions
                        ? [
                            {
                              key: 'authorize',
                              label: kbT(locale, 'folderPermissionsAction'),
                              onClick: () => onAuthorizeFolder(folder),
                            },
                          ]
                        : []),
                      ...(canEditKb
                        ? [
                            {
                              key: 'delete',
                              label: kbT(locale, 'cardDelete'),
                              danger: true,
                              onClick: () => onRequestDeleteFolder(folder),
                            },
                          ]
                        : []),
                    ]}
                  />
                  ) : null}
                </div>
              )
            })
          : null}
        {items.map((item) => {
          const name = localizeName(item)
          const description = localizeDescription(item)
          const menuId = `kb-${item.id}`
          const rowId = menuId

          return (
            <div
              key={item.id}
              className="kb-table-row"
              role="button"
              tabIndex={0}
              onClick={() => onOpen(item.id)}
              onKeyDown={(event) => handleRowKeyDown(event, () => onOpen(item.id))}
            >
              {canEditKb ? (
              <label className="kb-table-check" onClick={stopRowEvent} onMouseDown={stopRowEvent}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(rowId)}
                  onChange={() => toggleOne(rowId)}
                  aria-label={name}
                />
              </label>
              ) : null}
              <div className="kb-table-name-cell">
                <KnowledgeBaseRowIcon item={item} />
                <span className="kb-table-name-text">{name}</span>
              </div>
              <div className="kb-table-desc">{description}</div>
              <div className="kb-table-meta">{item.documentCount}</div>
              <div className="kb-table-meta">{item.updatedAt}</div>
              {(canEditKb || canManagePermissions) ? (
              <RowActions
                menuId={menuId}
                menuLabel={kbT(locale, 'cardMoreActions')}
                activeMenuId={activeMenuId}
                onToggleMenu={toggleMenu}
                onCloseMenu={() => setActiveMenuId(null)}
                items={[
                  ...(canEditKb
                    ? [
                        {
                          key: 'edit',
                          label: kbT(locale, 'cardEdit'),
                          onClick: () => onEditItem(item),
                        },
                        {
                          key: 'move',
                          label: kbT(locale, 'cardMove'),
                          onClick: () => onMoveItem(item),
                        },
                      ]
                    : []),
                  ...(canManagePermissions
                    ? [
                        {
                          key: 'permissions',
                          label: kbT(locale, 'folderPermissionsAction'),
                          onClick: () => onOpenPermissionsItem(item),
                        },
                      ]
                    : []),
                  ...(canEditKb
                    ? [
                        {
                          key: 'delete',
                          label: kbT(locale, 'cardDelete'),
                          danger: true,
                          onClick: () => onRequestDeleteItem(item),
                        },
                      ]
                    : []),
                ]}
              />
              ) : null}
            </div>
          )
        })}
      </div>
      {canEditKb && selectedIds.size > 0 && onRequestBulkDelete && onClearSelection ? (
        <KnowledgeBaseListBulkBar
          locale={locale}
          selectedCount={selectedIds.size}
          onDelete={onRequestBulkDelete}
          onClearSelection={onClearSelection}
        />
      ) : null}
    </section>
  )
}
