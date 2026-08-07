import { useEffect, useId, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseCreateActionsProps = {
  locale: AppLocale
  canCreateKb?: boolean
  canCreateFolder?: boolean
  onCreate: () => void
  onCreateFolder: () => void
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KnowledgeBaseCreateActions({
  locale,
  canCreateKb = true,
  canCreateFolder = true,
  onCreate,
  onCreateFolder,
}: KnowledgeBaseCreateActionsProps) {
  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const pickCreateKb = () => {
    setMenuOpen(false)
    onCreate()
  }

  const pickCreateFolder = () => {
    if (!canCreateFolder) return
    setMenuOpen(false)
    onCreateFolder()
  }

  if (!canCreateKb && !canCreateFolder) {
    return null
  }

  if (!canCreateKb && canCreateFolder) {
    return (
      <button
        type="button"
        className="agents-btn agents-btn-primary kb-toolbar-create-main"
        onClick={onCreateFolder}
      >
        {kbT(locale, 'createMenuFolder')}
      </button>
    )
  }

  if (canCreateKb && !canCreateFolder) {
    return (
      <button type="button" className="agents-btn agents-btn-primary kb-toolbar-create-main" onClick={onCreate}>
        {kbT(locale, 'create')}
      </button>
    )
  }

  return (
    <div className="kb-toolbar-create-group" ref={groupRef}>
      <button type="button" className="agents-btn agents-btn-primary kb-toolbar-create-main" onClick={onCreate}>
        {kbT(locale, 'create')}
      </button>
      <button
        type="button"
        className="agents-btn agents-btn-primary kb-toolbar-create-toggle"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <ChevronDownIcon />
      </button>
      {menuOpen ? (
        <div id={menuId} className="kb-toolbar-create-menu" role="menu">
          <button type="button" className="kb-toolbar-create-menu-item" role="menuitem" onClick={pickCreateKb}>
            {kbT(locale, 'createMenuKb')}
          </button>
          <button
            type="button"
            className="kb-toolbar-create-menu-item"
            role="menuitem"
            disabled={!canCreateFolder}
            onClick={pickCreateFolder}
          >
            {kbT(locale, 'createMenuFolder')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
