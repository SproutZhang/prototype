import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseWorkspaceFolder } from '../types'

type KnowledgeBaseWorkspaceFolderCardProps = {
  locale: AppLocale
  folder: KnowledgeBaseWorkspaceFolder
  name: string
  kbCount: number
  onOpen: () => void
  onEdit: (folder: KnowledgeBaseWorkspaceFolder) => void
  onAuthorize: (folder: KnowledgeBaseWorkspaceFolder) => void
  onRequestDelete: (folder: KnowledgeBaseWorkspaceFolder) => void
  canManagePermissions?: boolean
  canEditKb?: boolean
}

function WorkspaceFolderIcon() {
  return (
    <svg viewBox="0 0 1024 1024" width="22" height="22" aria-hidden="true" focusable="false">
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

export function KnowledgeBaseWorkspaceFolderCard({
  locale,
  folder,
  name,
  kbCount,
  onOpen,
  onEdit,
  onAuthorize,
  onRequestDelete,
  canManagePermissions = false,
  canEditKb = false,
}: KnowledgeBaseWorkspaceFolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMenuActions = canEditKb || canManagePermissions

  const ariaLabel =
    locale === 'zh' ? `打开文件夹：${name}` : `Open folder: ${name}`

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('.agent-card-more-wrap')) return
    onOpen()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpen()
  }

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const description = kbT(locale, 'workspaceFolderKbCount').replace('{count}', String(kbCount))

  return (
    <article
      className={
        menuOpen
          ? 'agent-card agent-card--clickable is-clickable kb-list-card kb-list-card--workspace-folder kb-list-card--menu-open'
          : 'agent-card agent-card--clickable is-clickable kb-list-card kb-list-card--workspace-folder'
      }
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="agent-card-more-wrap kb-list-card-more-wrap"
        onClick={stopMenuEvent}
        onMouseDown={stopMenuEvent}
      >
        {hasMenuActions ? (
          <>
        <button
          type="button"
          className="agent-card-more"
          aria-label={kbT(locale, 'workspaceFolderMoreActions')}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            stopMenuEvent(e)
            setMenuOpen((v) => !v)
          }}
        >
          ⋮
        </button>
        <div
          className={menuOpen ? 'agent-card-menu kb-list-card-menu is-open' : 'agent-card-menu kb-list-card-menu'}
          role="menu"
          aria-label={kbT(locale, 'workspaceFolderMoreActions')}
          onMouseDown={stopMenuEvent}
        >
          {canEditKb ? (
          <button
            type="button"
            className="agent-card-menu-item"
            role="menuitem"
            onClick={(e) => {
              stopMenuEvent(e)
              setMenuOpen(false)
              onEdit(folder)
            }}
          >
            {kbT(locale, 'cardEdit')}
          </button>
          ) : null}
          {canManagePermissions ? (
            <button
              type="button"
              className="agent-card-menu-item"
              role="menuitem"
              onClick={(e) => {
                stopMenuEvent(e)
                setMenuOpen(false)
                onAuthorize(folder)
              }}
            >
              {kbT(locale, 'folderPermissionsAction')}
            </button>
          ) : null}
          {canEditKb ? (
          <button
            type="button"
            className="agent-card-menu-item is-danger"
            role="menuitem"
            onClick={(e) => {
              stopMenuEvent(e)
              setMenuOpen(false)
              onRequestDelete(folder)
            }}
          >
            {kbT(locale, 'cardDelete')}
          </button>
          ) : null}
        </div>
          </>
        ) : null}
      </div>

      <div className="agent-card-icon kb-workspace-folder-card-icon" aria-hidden="true">
        <WorkspaceFolderIcon />
      </div>
      <div className="kb-list-card-name-row">
        <div className="agent-card-name">{name}</div>
      </div>
      <div className="agent-card-desc">{description}</div>
      <div className="kb-list-card-footer">
        <p className="kb-list-card-updated">
          {kbT(locale, 'updated')} {folder.updatedAt}
        </p>
      </div>
    </article>
  )
}
