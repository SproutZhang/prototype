import { useEffect, useId, useRef, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type DepartmentCreateActionsProps = {
  locale: AppLocale
  onAddDepartment: () => void
  onThirdPartyImport: () => void
  onBatchCreate: () => void
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

export function DepartmentCreateActions({
  locale,
  onAddDepartment,
  onThirdPartyImport,
  onBatchCreate,
}: DepartmentCreateActionsProps) {
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

  const pickThirdPartyImport = () => {
    setMenuOpen(false)
    onThirdPartyImport()
  }

  const pickBatchCreate = () => {
    setMenuOpen(false)
    onBatchCreate()
  }

  return (
    <div className="ac-dept-toolbar-create-group" ref={groupRef}>
      <button
        type="button"
        className="agents-btn agents-btn-primary ac-dept-toolbar-create-main"
        onClick={onAddDepartment}
      >
        + {acT(locale, 'addDepartment')}
      </button>
      <button
        type="button"
        className="agents-btn agents-btn-primary ac-dept-toolbar-create-toggle"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={acT(locale, 'departmentCreateMoreActions')}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <ChevronDownIcon />
      </button>
      {menuOpen ? (
        <div id={menuId} className="ac-dept-toolbar-create-menu" role="menu">
          <button
            type="button"
            className="ac-dept-toolbar-create-menu-item"
            role="menuitem"
            onClick={pickThirdPartyImport}
          >
            {acT(locale, 'departmentThirdPartyImport')}
          </button>
          <button
            type="button"
            className="ac-dept-toolbar-create-menu-item"
            role="menuitem"
            onClick={pickBatchCreate}
          >
            {acT(locale, 'batchCreateDepartments')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
