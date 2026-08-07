import { useEffect, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem } from '../types'
import { resolveKnowledgeBaseIconColors } from '../utils/kbIconColors'

type KnowledgeBaseCardProps = {
  locale: AppLocale
  item: KnowledgeBaseItem
  name: string
  description: string
  onOpen: () => void
  onEdit: (item: KnowledgeBaseItem) => void
  onMove: (item: KnowledgeBaseItem) => void
  onOpenPermissions: (item: KnowledgeBaseItem) => void
  onRequestDelete: (item: KnowledgeBaseItem) => void
  canManagePermissions?: boolean
  canEditKb?: boolean
}

export function KnowledgeBaseCard({
  locale,
  item,
  name,
  description,
  onOpen,
  onEdit,
  onMove,
  onOpenPermissions,
  onRequestDelete,
  canManagePermissions = false,
  canEditKb = false,
}: KnowledgeBaseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMenuActions = canEditKb || canManagePermissions

  const { iconFrom, iconTo } = resolveKnowledgeBaseIconColors(item)
  const iconStyle = {
    '--agent-icon-from': iconFrom,
    '--agent-icon-via': iconTo,
    '--agent-icon-to': iconTo,
    '--agent-icon-shadow': 'rgba(124, 92, 255, 0.24)',
  } as CSSProperties

  const ariaLabel =
    locale === 'zh' ? `查看知识库：${name}` : `Open knowledge base: ${name}`

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

  return (
    <article
      className={
        menuOpen
          ? 'agent-card agent-card--clickable is-clickable kb-list-card kb-list-card--menu-open'
          : 'agent-card agent-card--clickable is-clickable kb-list-card'
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
          aria-label={kbT(locale, 'cardMoreActions')}
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
          aria-label={kbT(locale, 'cardMoreActions')}
          onMouseDown={stopMenuEvent}
        >
          {canEditKb ? (
            <>
          <button
            type="button"
            className="agent-card-menu-item"
            role="menuitem"
            onClick={(e) => {
              stopMenuEvent(e)
              setMenuOpen(false)
              onEdit(item)
            }}
          >
            {kbT(locale, 'cardEdit')}
          </button>
          <button
            type="button"
            className="agent-card-menu-item"
            role="menuitem"
            onClick={(e) => {
              stopMenuEvent(e)
              setMenuOpen(false)
              onMove(item)
            }}
          >
            {kbT(locale, 'cardMove')}
          </button>
            </>
          ) : null}
          {canManagePermissions ? (
            <button
              type="button"
              className="agent-card-menu-item"
              role="menuitem"
              onClick={(e) => {
                stopMenuEvent(e)
                setMenuOpen(false)
                onOpenPermissions(item)
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
              onRequestDelete(item)
            }}
          >
            {kbT(locale, 'cardDelete')}
          </button>
          ) : null}
        </div>
          </>
        ) : null}
      </div>

      <div className="agent-card-icon agent-card-icon-grad" style={iconStyle} aria-hidden="true" />
      <div className="kb-list-card-name-row">
        <div className="agent-card-name">{name}</div>
      </div>
      <div className="agent-card-desc">{description}</div>
      <div className="kb-list-card-footer">
        <p className="kb-list-card-updated">
          {kbT(locale, 'updated')} {item.updatedAt}
        </p>
      </div>
    </article>
  )
}
