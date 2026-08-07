import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  ACCESS_MODE_BADGE_SELECT_OPTIONS,
  accessModeHint,
  accessModeLabel,
  acT,
} from '../i18n/strings'
import type { AccessMode } from '../types'
import { AccessBadge } from './AccessBadge'

type AccessModeBadgeSelectProps = {
  locale: AppLocale
  value: AccessMode
  onChange: (mode: AccessMode) => void
  disabled?: boolean
}

type MenuLayout = {
  top: number
  left: number
  width: number
  maxHeight: number
}

const MENU_GAP = 6
const VIEWPORT_PADDING = 8
const MENU_PREFERRED_MAX_HEIGHT = 280
const MENU_MIN_WIDTH = 280

function computeMenuLayout(trigger: HTMLElement): MenuLayout {
  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const width = Math.max(rect.width, MENU_MIN_WIDTH)
  const left = Math.min(rect.left, window.innerWidth - VIEWPORT_PADDING - width)

  if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
    return {
      top: rect.bottom + MENU_GAP,
      left,
      width,
      maxHeight: Math.max(120, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceBelow)),
    }
  }

  const maxHeight = Math.max(120, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceAbove - MENU_GAP))
  return {
    top: Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - maxHeight),
    left,
    width,
    maxHeight,
  }
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`ac-access-mode-badge-select-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function AccessModeBadgeSelect({
  locale,
  value,
  onChange,
  disabled = false,
}: AccessModeBadgeSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const updateMenuLayout = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    setMenuLayout(computeMenuLayout(trigger))
  }, [])

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

  useEffect(() => {
    if (!open) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (disabled) {
    return <AccessBadge locale={locale} mode={value} />
  }

  const menu =
    open && menuLayout
      ? createPortal(
          <ul
            ref={menuRef}
            className="ac-access-mode-select-menu"
            id={listboxId}
            role="listbox"
            aria-label={acT(locale, 'formAccessMode')}
            style={{
              position: 'fixed',
              top: menuLayout.top,
              left: menuLayout.left,
              width: menuLayout.width,
              maxHeight: menuLayout.maxHeight,
              zIndex: 1300,
            }}
          >
            {ACCESS_MODE_BADGE_SELECT_OPTIONS.map((mode) => {
              const selected = mode === value
              return (
                <li key={mode} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`ac-access-mode-select-option${selected ? ' is-selected' : ''}`}
                    onClick={() => {
                      onChange(mode)
                      setOpen(false)
                    }}
                  >
                    <span className="ac-access-mode-select-option-body">
                      <span className="ac-access-mode-select-title">{accessModeLabel(locale, mode)}</span>
                      <span className="ac-access-mode-select-hint">{accessModeHint(locale, mode)}</span>
                    </span>
                    {selected ? (
                      <span className="ac-access-mode-select-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={`ac-access-mode-badge-select${open ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="ac-access-mode-badge-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={acT(locale, 'formAccessMode')}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
      >
        <AccessBadge locale={locale} mode={value} />
        <ChevronDown open={open} />
      </button>
      {menu}
    </div>
  )
}
