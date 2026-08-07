import { useCallback, useEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { localizeOrgMemberName } from '../../data/orgMembersCatalog'
import type { OrgMember } from '../../types'

const MENU_GAP = 6
const VIEWPORT_PADDING = 8
const MENU_PREFERRED_MAX_HEIGHT = 240
const PICKER_BUTTON_WIDTH = 44

type MenuLayout = {
  top: number
  left: number
  width: number
  maxHeight: number
}

function computeSupervisorMenuLayout(anchor: HTMLElement): MenuLayout {
  const rect = anchor.getBoundingClientRect()
  const width = Math.max(0, rect.width - PICKER_BUTTON_WIDTH)
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING

  if (spaceBelow >= 140 || spaceBelow >= spaceAbove) {
    return {
      top: rect.bottom + MENU_GAP,
      left: rect.left,
      width,
      maxHeight: Math.max(120, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceBelow)),
    }
  }

  const maxHeight = Math.max(120, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceAbove - MENU_GAP))
  return {
    top: Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - maxHeight),
    left: rect.left,
    width,
    maxHeight,
  }
}

type SupervisorQuickPickDropdownProps = {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  menuRef: RefObject<HTMLUListElement | null>
  locale: AppLocale
  ariaLabel: string
  candidates: OrgMember[]
  selectedIds: string[]
  onToggle: (memberId: string) => void
}

export function SupervisorQuickPickDropdown({
  open,
  anchorRef,
  menuRef,
  locale,
  ariaLabel,
  candidates,
  selectedIds,
  onToggle,
}: SupervisorQuickPickDropdownProps) {
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null)

  const updateMenuLayout = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    setMenuLayout(computeSupervisorMenuLayout(anchor))
  }, [anchorRef])

  useEffect(() => {
    if (!open) {
      setMenuLayout(null)
      return
    }
    updateMenuLayout()
    const onReposition = () => updateMenuLayout()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updateMenuLayout])

  if (!open || !menuLayout) return null

  return createPortal(
    <ul
      ref={menuRef}
      className="ac-dept-edit-supervisor-menu ac-dept-edit-supervisor-menu--portaled"
      role="listbox"
      aria-label={ariaLabel}
      aria-multiselectable="true"
      style={{
        position: 'fixed',
        top: menuLayout.top,
        left: menuLayout.left,
        width: menuLayout.width,
        maxHeight: menuLayout.maxHeight,
        zIndex: 1300,
      }}
    >
      {candidates.map((member) => {
        const selected = selectedIds.includes(member.id)
        return (
          <li key={member.id} role="option" aria-selected={selected}>
            <button
              type="button"
              className={`ac-dept-edit-supervisor-option${selected ? ' is-selected' : ''}`}
              onClick={() => onToggle(member.id)}
            >
              <input
                type="checkbox"
                className="ac-dept-edit-supervisor-option-check"
                checked={selected}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
              />
              <span>{localizeOrgMemberName(member, locale)}</span>
            </button>
          </li>
        )
      })}
    </ul>,
    document.body,
  )
}
