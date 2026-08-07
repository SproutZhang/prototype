import { useEffect, useState, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'
import type { DocActionMenuItemKey } from './KnowledgeBaseDocActionMenu'
import { KnowledgeBaseDocActionMenu } from './KnowledgeBaseDocActionMenu'
import { KnowledgeBaseDocStatusIcon } from './KnowledgeBaseDocStatusIcon'

type KnowledgeBaseDocRowProps = {
  locale: AppLocale
  doc: KnowledgeBaseDocument
  label: string
  selected: boolean
  onSelectedChange: () => void
  onPreviewProcess: () => void
  onViewEditChunks: () => void
  onInsertBlock: () => void
  onViewApi: () => void
  onRequestDelete: () => void
  onRetry?: () => void
  canDelete?: boolean
  canUseFullDocActions?: boolean
}

const FORMAT_COLORS: Record<KnowledgeBaseDocument['format'], string> = {
  pdf: '#e74c3c',
  doc: '#2563eb',
  docx: '#2563eb',
  ppt: '#ea580c',
  pptx: '#ea580c',
  xlsx: '#059669',
  md: '#64748b',
  csv: '#0d9488',
  png: '#8b5cf6',
  jpg: '#8b5cf6',
  txt: '#6b7280',
  msg: '#0891b2',
  json: '#ca8a04',
  url: '#7c3aed',
}

function DocFormatIcon({ format }: { format: KnowledgeBaseDocument['format'] }) {
  return (
    <span className="kb-doc-file-icon" style={{ color: FORMAT_COLORS[format] }} aria-hidden="true">
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

export function KnowledgeBaseDocRow({
  locale,
  doc,
  label,
  selected,
  onSelectedChange,
  onPreviewProcess,
  onViewEditChunks,
  onInsertBlock,
  onViewApi,
  onRequestDelete,
  onRetry,
  canDelete = true,
  canUseFullDocActions = true,
}: KnowledgeBaseDocRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showRetry = doc.status === 'failed' && onRetry != null && canUseFullDocActions

  const hiddenKeys: DocActionMenuItemKey[] | undefined = (() => {
    const keys: DocActionMenuItemKey[] = []
    if (!canUseFullDocActions) {
      keys.push('docPreviewProcess', 'docViewEditChunks', 'docInsertBlock', 'docViewApi')
    }
    if (!canDelete) {
      keys.push('docDelete')
    }
    return keys.length > 0 ? keys : undefined
  })()

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = () => setMenuOpen(false)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const stopMenuEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const closeMenu = (event: MouseEvent) => {
    stopMenuEvent(event)
    setMenuOpen(false)
  }

  return (
    <li className={`kb-doc-table-row${menuOpen ? ' kb-doc-table-row--menu-open' : ''}`}>
      <label className="kb-doc-table-check">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelectedChange}
          aria-label={label}
        />
      </label>
      <div className="kb-doc-table-col kb-doc-table-col--name">
        <DocFormatIcon format={doc.format} />
        <span className="kb-doc-table-name" title={label}>
          {label}
        </span>
      </div>
      <span className="kb-doc-table-col kb-doc-table-col--size">{doc.sizeLabel}</span>
      <span className="kb-doc-table-col kb-doc-table-col--updated">{doc.updatedAt}</span>
      <div className="kb-doc-table-col kb-doc-table-col--status">
        <KnowledgeBaseDocStatusIcon locale={locale} status={doc.status} />
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
          <KnowledgeBaseDocActionMenu
            open={menuOpen}
            locale={locale}
            onMouseDown={stopMenuEvent}
            onPreviewProcess={onPreviewProcess}
            onViewEditChunks={onViewEditChunks}
            onInsertBlock={onInsertBlock}
            onViewApi={onViewApi}
            onRequestDelete={onRequestDelete}
            hiddenKeys={hiddenKeys}
            showRetry={showRetry}
            onRetry={onRetry}
            onItemClick={closeMenu}
          />
        </div>
      </div>
    </li>
  )
}
