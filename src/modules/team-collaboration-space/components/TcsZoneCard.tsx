import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  accessModeBadgeLabel,
  localizeZoneDescription,
  localizeZoneUpdatedAt,
  tcsT,
} from '../i18n/strings'
import type { CollaborationZone, SpaceAccessMode } from '../types'
import { resolveZoneAccessBadgeMode } from '../utils/accessBadge'
import { TcsFolderIcon } from './TcsFolderIcon'

type TcsZoneCardProps = {
  locale: AppLocale
  zone: CollaborationZone
  siblingZones: CollaborationZone[]
  name: string
  showExpiredBadge?: boolean
  onOpen: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TcsZoneCard({
  locale,
  zone,
  siblingZones,
  name,
  showExpiredBadge = false,
  onOpen,
  onEdit,
  onDelete,
}: TcsZoneCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badgeMode: SpaceAccessMode = resolveZoneAccessBadgeMode(zone, siblingZones)
  const accessBadge = accessModeBadgeLabel(locale, badgeMode)
  const description = localizeZoneDescription(zone, locale)
  const memberCountLabel = tcsT(locale, 'memberCount').replace('{count}', String(zone.members.length))
  const resourceCountLabel = tcsT(locale, 'resourceCount').replace('{count}', String(zone.resourceCount))
  const ariaLabel = showExpiredBadge
    ? locale === 'zh'
      ? `已失效子级空间（可查看）：${name}`
      : `Expired sub-space (view only): ${name}`
    : locale === 'zh'
      ? `查看子级空间：${name}`
      : `Open sub-space: ${name}`

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

  const showActions = !showExpiredBadge && (onEdit || onDelete)

  const cardClassName = [
    'agent-card',
    'agent-card--clickable',
    'is-clickable',
    'kb-list-card',
    'tcs-list-card',
    'tcs-zone-card',
    showExpiredBadge ? 'tcs-list-card--expired' : '',
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
      {showActions ? (
        <div
          className="agent-card-more-wrap kb-list-card-more-wrap"
          onClick={stopMenuEvent}
          onMouseDown={stopMenuEvent}
        >
          <button
            type="button"
            className="agent-card-more"
            aria-label={tcsT(locale, 'zoneCardMenuAria')}
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
            aria-label={tcsT(locale, 'zoneCardMenuAria')}
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
                  onEdit()
                }}
              >
                {tcsT(locale, 'cardMenuEdit')}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="agent-card-menu-item is-danger"
                role="menuitem"
                onClick={(event) => {
                  stopMenuEvent(event)
                  setMenuOpen(false)
                  onDelete()
                }}
              >
                {tcsT(locale, 'cardMenuDelete')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="tcs-zone-folder-card-icon" aria-hidden="true">
        <TcsFolderIcon />
      </div>
      <div className="kb-list-card-name-row tcs-list-card-name-row">
        <div className="agent-card-name">{name}</div>
        {showExpiredBadge ? (
          <span className="tcs-space-status-badge tcs-space-status-badge--expired">
            {tcsT(locale, 'projectSpaceExpiredBadge')}
          </span>
        ) : zone.accessMode ? (
          <span className={`tcs-space-access-badge tcs-space-access-badge--${badgeMode}`}>{accessBadge}</span>
        ) : null}
      </div>
      <p className="tcs-list-card-meta">
        {memberCountLabel}
        <span className="tcs-space-card-meta-dot" aria-hidden="true">
          ·
        </span>
        {resourceCountLabel}
      </p>
      <div className="agent-card-desc">{description}</div>
      <div className="kb-list-card-footer">
        <p className="kb-list-card-updated">{localizeZoneUpdatedAt(zone, locale)}</p>
      </div>
    </article>
  )
}
