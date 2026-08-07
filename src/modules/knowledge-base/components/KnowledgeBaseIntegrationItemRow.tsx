import { useEffect, useState, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseIntegrationItem, KnowledgeBaseIntegrationKind } from '../types'
import { KnowledgeBaseDocStatusIcon } from './KnowledgeBaseDocStatusIcon'

type KnowledgeBaseIntegrationItemRowProps = {
  locale: AppLocale
  item: KnowledgeBaseIntegrationItem
  label: string
  selected: boolean
  onSelectedChange: () => void
  onDownload: () => void
  onRetry?: () => void
  onRequestDelete: () => void
  canDelete?: boolean
}

function KindFileIcon({ kind }: { kind: KnowledgeBaseIntegrationKind }) {
  const color =
    kind === 'document'
      ? '#2563eb'
      : kind === 'video'
        ? '#ea580c'
        : kind === 'sheet'
          ? '#059669'
          : '#7c3aed'

  return (
    <span className="kb-doc-file-icon" style={{ color }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
        <path
          d="M8 4h6l4 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          fill="currentColor"
          opacity="0.16"
        />
        <path
          d="M8 4h6l4 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M14 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function KnowledgeBaseIntegrationItemRow({
  locale,
  item,
  label,
  selected,
  onSelectedChange,
  onDownload,
  onRetry,
  onRequestDelete,
  canDelete = true,
}: KnowledgeBaseIntegrationItemRowProps) {
  const showRetry = item.status === 'indexing' || item.status === 'failed'
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <div
      className={`kb-doc-table-row kb-int-table-row kb-int-table-row--item${menuOpen ? ' kb-doc-table-row--menu-open' : ''}`}
    >
      <label className="kb-doc-table-check">
        <input type="checkbox" checked={selected} onChange={onSelectedChange} aria-label={label} />
      </label>
      <div className="kb-doc-table-col kb-doc-table-col--name">
        <span className="kb-int-toggle-spacer" aria-hidden="true" />
        <KindFileIcon kind={item.kind} />
        <span className="kb-doc-table-name" title={label}>
          {label}
        </span>
      </div>
      <span className="kb-doc-table-col kb-doc-table-col--size">{item.sizeLabel}</span>
      <span className="kb-doc-table-col kb-doc-table-col--updated">{item.updatedAt}</span>
      <div className="kb-doc-table-col kb-doc-table-col--status">
        <KnowledgeBaseDocStatusIcon locale={locale} status={item.status} />
        <div className="kb-doc-menu-wrap" onClick={stopMenuEvent} onMouseDown={stopMenuEvent}>
          <button
            type="button"
            className={`kb-doc-kebab${menuOpen ? ' is-open' : ''}`}
            aria-label={kbT(locale, 'docMenu')}
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
            className={menuOpen ? 'kb-doc-menu is-open' : 'kb-doc-menu'}
            role="menu"
            aria-label={kbT(locale, 'docMenu')}
            onMouseDown={stopMenuEvent}
          >
            {showRetry && onRetry ? (
              <button
                type="button"
                className="kb-doc-menu-item"
                role="menuitem"
                onClick={(e) => {
                  stopMenuEvent(e)
                  setMenuOpen(false)
                  onRetry()
                }}
              >
                {kbT(locale, 'docRetry')}
              </button>
            ) : null}
            <button
              type="button"
              className="kb-doc-menu-item"
              role="menuitem"
              onClick={(e) => {
                stopMenuEvent(e)
                setMenuOpen(false)
                onDownload()
              }}
            >
              {kbT(locale, 'docDownload')}
            </button>
            {canDelete ? (
            <button
              type="button"
              className="kb-doc-menu-item kb-doc-menu-item--danger"
              role="menuitem"
              onClick={(e) => {
                stopMenuEvent(e)
                setMenuOpen(false)
                onRequestDelete()
              }}
            >
              {kbT(locale, 'docDelete')}
            </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
