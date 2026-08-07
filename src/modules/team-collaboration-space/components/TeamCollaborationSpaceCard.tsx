import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { accessModeBadgeLabel, localizeSpaceUpdatedAt, tcsT } from '../i18n/strings'
import type { SpaceAccessMode, TeamCollaborationSpaceItem, TcsListViewMode } from '../types'
import { resolveSpaceAccessBadgeMode } from '../utils/accessBadge'
import { TcsFolderIcon } from './TcsFolderIcon'

type TeamCollaborationSpaceCardProps = {
  locale: AppLocale
  item: TeamCollaborationSpaceItem
  allSpaces: TeamCollaborationSpaceItem[]
  viewMode?: TcsListViewMode
  name: string
  description: string
  memberCountLabel: string
  resourceCountLabel: string
  showExpiredBadge?: boolean
  onOpen: () => void
  onEdit?: (item: TeamCollaborationSpaceItem) => void
  onRequestMoveOut?: (item: TeamCollaborationSpaceItem) => void
  onRequestDelete?: (item: TeamCollaborationSpaceItem) => void
}

export function TeamCollaborationSpaceCard({
  locale,
  item,
  allSpaces,
  viewMode = 'cards',
  name,
  description,
  memberCountLabel,
  resourceCountLabel,
  showExpiredBadge = false,
  onOpen,
  onEdit,
  onRequestMoveOut,
  onRequestDelete,
}: TeamCollaborationSpaceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const badgeMode: SpaceAccessMode = resolveSpaceAccessBadgeMode(item, allSpaces)
  const accessBadge = accessModeBadgeLabel(locale, badgeMode)

  const ariaLabel = showExpiredBadge
    ? locale === 'zh'
      ? `已失效项目（可查看）：${name}`
      : `Expired project (view only): ${name}`
    : locale === 'zh'
      ? `查看协作空间：${name}`
      : `Open team space: ${name}`

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

  const showManageMenu = Boolean(onEdit || onRequestMoveOut || onRequestDelete)

  const cardClassName = [
    'agent-card',
    'agent-card--clickable',
    'is-clickable',
    'kb-list-card',
    'tcs-list-card',
    showExpiredBadge ? 'tcs-list-card--expired' : '',
    viewMode === 'list' ? 'agent-card--list' : '',
    menuOpen ? 'tcs-list-card--menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={cardClassName}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {showManageMenu ? (
      <div
        className="agent-card-more-wrap kb-list-card-more-wrap"
        onClick={stopMenuEvent}
        onMouseDown={stopMenuEvent}
      >
        <button
          type="button"
          className="agent-card-more"
          aria-label={tcsT(locale, 'cardMenuAria')}
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
            menuOpen ? 'agent-card-menu kb-list-card-menu is-open' : 'agent-card-menu kb-list-card-menu'
          }
          role="menu"
          aria-label={tcsT(locale, 'cardMenuAria')}
          onMouseDown={stopMenuEvent}
        >
          {onEdit ? (
          <button
            type="button"
            className="agent-card-menu-item"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              setMenuOpen(false)
              onEdit(item)
            }}
          >
            {tcsT(locale, 'cardMenuEdit')}
          </button>
          ) : null}
          {onRequestMoveOut ? (
            <button
              type="button"
              className="agent-card-menu-item"
              role="menuitem"
              onClick={(event) => {
                stopMenuEvent(event)
                setMenuOpen(false)
                onRequestMoveOut(item)
              }}
            >
              {tcsT(locale, 'cardMenuMoveOut')}
            </button>
          ) : null}
          {onRequestDelete ? (
          <button
            type="button"
            className="agent-card-menu-item is-danger"
            role="menuitem"
            onClick={(event) => {
              stopMenuEvent(event)
              setMenuOpen(false)
              onRequestDelete(item)
            }}
          >
            {tcsT(locale, 'cardMenuDelete')}
          </button>
          ) : null}
        </div>
      </div>
      ) : null}

      <div className="tcs-team-space-folder-icon" aria-hidden="true">
        <TcsFolderIcon />
      </div>
      <div className="kb-list-card-name-row tcs-list-card-name-row">
        <div className="agent-card-name">{name}</div>
        {showExpiredBadge ? (
          <span className="tcs-space-status-badge tcs-space-status-badge--expired">
            {tcsT(locale, 'projectSpaceExpiredBadge')}
          </span>
        ) : item.kind !== 'personal' ? (
          <span className={`tcs-space-access-badge tcs-space-access-badge--${badgeMode}`}>
            {accessBadge}
          </span>
        ) : null}
      </div>
      {item.kind !== 'personal' ? (
        <p className="tcs-list-card-meta">
          {memberCountLabel}
          {resourceCountLabel ? (
            <>
              <span className="tcs-space-card-meta-dot" aria-hidden="true">
                ·
              </span>
              {resourceCountLabel}
            </>
          ) : null}
        </p>
      ) : null}
      <div className="agent-card-desc">{description}</div>
      <div className="kb-list-card-footer">
        <p className="kb-list-card-updated">{localizeSpaceUpdatedAt(item, locale)}</p>
      </div>
    </article>
  )
}
