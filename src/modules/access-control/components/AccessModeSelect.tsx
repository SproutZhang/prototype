import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  ACCESS_MODE_OPTIONS,
  accessModeHint,
  accessModeLabel,
  acT,
} from '../i18n/strings'
import type { AccessMode } from '../types'

type AccessModeSelectProps = {
  locale: AppLocale
  value: AccessMode
  onChange: (mode: AccessMode) => void
  label?: string
  hintForMode?: (locale: AppLocale, mode: AccessMode) => string
  excludedModes?: AccessMode[]
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

function computeMenuLayout(trigger: HTMLElement): MenuLayout {
  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING

  if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
    return {
      top: rect.bottom + MENU_GAP,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceBelow)),
    }
  }

  const maxHeight = Math.max(120, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceAbove - MENU_GAP))
  return {
    top: Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - maxHeight),
    left: rect.left,
    width: rect.width,
    maxHeight,
  }
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`ac-access-mode-select-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function AccessModeSelect({
  locale,
  value,
  onChange,
  label,
  hintForMode = accessModeHint,
  excludedModes,
}: AccessModeSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()
  const excludedModeSet = useMemo(() => new Set(excludedModes ?? []), [excludedModes])
  const visibleModes = useMemo(
    () => ACCESS_MODE_OPTIONS.filter((mode) => !excludedModeSet.has(mode)),
    [excludedModeSet],
  )

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

  const menu =
    open && menuLayout
      ? createPortal(
          <ul
            ref={menuRef}
            className="ac-access-mode-select-menu"
            id={listboxId}
            role="listbox"
            aria-label={label ?? acT(locale, 'formAccessMode')}
            style={{
              position: 'fixed',
              top: menuLayout.top,
              left: menuLayout.left,
              width: menuLayout.width,
              maxHeight: menuLayout.maxHeight,
              zIndex: 1300,
            }}
          >
            {visibleModes.map((mode) => {
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
                      <span className="ac-access-mode-select-hint">{hintForMode(locale, mode)}</span>
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
    <div className="ac-field ac-access-mode-select-field">
      {label ? <span className="ac-access-mode-select-label">{label}</span> : null}
      <div ref={rootRef} className={`ac-access-mode-select${open ? ' is-open' : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          className="ac-access-mode-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="ac-access-mode-select-value">
            <span className="ac-access-mode-select-title">{accessModeLabel(locale, value)}</span>
            <span className="ac-access-mode-select-hint">{hintForMode(locale, value)}</span>
          </span>
          <ChevronDown open={open} />
        </button>
        {menu}
      </div>
    </div>
  )
}
