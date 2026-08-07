import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeSpaceUpdatedAt, tcsT } from '../i18n/strings'
import type { TeamCollaborationSpaceItem } from '../types'

type TeamCollaborationSpaceSharedCardProps = {
  locale: AppLocale
  item: TeamCollaborationSpaceItem
  name: string
  description: string
  memberCountLabel: string
  resourceCountLabel: string
  onOpen: () => void
  onEdit?: (item: TeamCollaborationSpaceItem) => void
  onRequestDelete?: (item: TeamCollaborationSpaceItem) => void
}

export function TeamCollaborationSpaceSharedCard({
  locale,
  item,
  name,
  description,
  memberCountLabel,
  resourceCountLabel,
  onOpen,
  onEdit,
  onRequestDelete,
}: TeamCollaborationSpaceSharedCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showActions = onEdit != null || onRequestDelete != null

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('.tcs-space-card-more-wrap')) return
    onOpen()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpen()
  }

  return (
    <article
      className={`agent-card tcs-space-card tcs-space-card--shared is-clickable${menuOpen ? ' tcs-space-card--menu-open' : ''}`}
      aria-label={name}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {showActions ? (
        <div
          className="agent-card-more-wrap kb-list-card-more-wrap tcs-space-card-more-wrap"
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
              menuOpen
                ? 'agent-card-menu kb-list-card-menu tcs-space-card-menu is-open'
                : 'agent-card-menu kb-list-card-menu tcs-space-card-menu'
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
      <div className="tcs-space-card-head">
        <span
          className="agent-card-icon tcs-space-card-icon"
          style={{
            background: `linear-gradient(135deg, ${item.accent} 0%, color-mix(in srgb, ${item.accent} 72%, #111) 100%)`,
            color: '#fff',
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path
              d="M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Zm0 2.18 6 2.25v4.66c0 3.87-2.55 7.49-6 8.56-3.45-1.07-6-4.69-6-8.56V6.43l6-2.25ZM11 7h2v6h-2V7Zm0 8h2v2h-2v-2Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div className="tcs-space-card-title-wrap">
          <div className="tcs-space-card-title-row">
            <div className="tcs-space-card-title">{name}</div>
            <span className="tcs-space-access-badge tcs-space-access-badge--shared">
              {tcsT(locale, 'accessBadgeShared')}
            </span>
          </div>
          <div className="tcs-space-card-meta">
            {memberCountLabel}
            {resourceCountLabel ? (
              <>
                <span className="tcs-space-card-meta-dot" aria-hidden="true">
                  ·
                </span>
                {resourceCountLabel}
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="tcs-space-card-desc">{description}</div>
      <div className="tcs-space-card-footer">
        <div className="tcs-space-card-updated">{localizeSpaceUpdatedAt(item, locale)}</div>
        <span className="tcs-space-card-default-hint">{tcsT(locale, 'cardEnter')}</span>
      </div>
    </article>
  )
}
