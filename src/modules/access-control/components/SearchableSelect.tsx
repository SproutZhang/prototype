import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type SearchableSelectOption = {
  value: string
  label: string
}

type SearchableSelectBaseProps = {
  options: SearchableSelectOption[]
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  required?: boolean
  ariaLabel?: string
}

type SearchableSelectSingleProps = SearchableSelectBaseProps & {
  multiple?: false
  value: string
  onChange: (value: string) => void
}

type SearchableSelectMultipleProps = SearchableSelectBaseProps & {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

type SearchableSelectProps = SearchableSelectSingleProps | SearchableSelectMultipleProps

type MenuLayout = {
  top: number
  left: number
  width: number
  maxHeight: number
}

const MENU_GAP = 6
const VIEWPORT_PADDING = 8
const MENU_PREFERRED_MAX_HEIGHT = 320

function computeMenuLayout(trigger: HTMLElement): MenuLayout {
  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING

  if (spaceBelow >= 180 || spaceBelow >= spaceAbove) {
    return {
      top: rect.bottom + MENU_GAP,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(140, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceBelow)),
    }
  }

  const maxHeight = Math.max(140, Math.min(MENU_PREFERRED_MAX_HEIGHT, spaceAbove - MENU_GAP))
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
      className={`ac-searchable-select-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    options,
    onChange,
    label,
    placeholder = '',
    searchPlaceholder = '',
    emptyMessage = '',
    disabled = false,
    required = false,
    ariaLabel,
    multiple = false,
  } = props

  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const searchInputId = useId()

  const selectedValues = useMemo(
    () => (multiple ? props.value : props.value ? [props.value] : []),
    [multiple, props.value],
  )

  const selectedOption = useMemo(() => {
    if (multiple) return null
    return options.find((option) => option.value === props.value) ?? null
  }, [multiple, options, props.value])

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) => option.label.toLowerCase().includes(query))
  }, [options, searchQuery])

  const updateMenuLayout = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    setMenuLayout(computeMenuLayout(trigger))
  }, [])

  useEffect(() => {
    if (!open) {
      setMenuLayout(null)
      setSearchQuery('')
      return
    }
    updateMenuLayout()
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus())
    const onReposition = () => updateMenuLayout()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.cancelAnimationFrame(frame)
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

  const toggleOption = (optionValue: string) => {
    if (multiple) {
      const current = props.value
      const next = current.includes(optionValue)
        ? current.filter((id) => id !== optionValue)
        : [...current, optionValue]
      props.onChange(next)
      return
    }

    props.onChange(optionValue)
    setOpen(false)
  }

  const menu =
    open && menuLayout
      ? createPortal(
          <div
            ref={menuRef}
            className="ac-searchable-select-menu"
            style={{
              position: 'fixed',
              top: menuLayout.top,
              left: menuLayout.left,
              width: menuLayout.width,
              maxHeight: menuLayout.maxHeight,
              zIndex: 1300,
            }}
          >
            <div className="ac-searchable-select-search">
              <input
                ref={searchInputRef}
                id={searchInputId}
                type="search"
                value={searchQuery}
                placeholder={searchPlaceholder}
                autoComplete="off"
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    setOpen(false)
                    triggerRef.current?.focus()
                  }
                }}
              />
            </div>
            <ul
              id={listboxId}
              className="ac-searchable-select-options"
              role="listbox"
              aria-label={ariaLabel ?? label}
              aria-multiselectable={multiple || undefined}
            >
              {filteredOptions.length === 0 ? (
                <li className="ac-searchable-select-empty" role="presentation">
                  {emptyMessage}
                </li>
              ) : (
                filteredOptions.map((option) => {
                  const selected = selectedValues.includes(option.value)
                  return (
                    <li key={option.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`ac-searchable-select-option${selected ? ' is-selected' : ''}${
                          multiple ? ' ac-searchable-select-option--multi' : ''
                        }`}
                        onClick={() => toggleOption(option.value)}
                      >
                        {multiple ? (
                          <span
                            className={`ac-searchable-select-checkbox${selected ? ' is-checked' : ''}`}
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="ac-searchable-select-option-label">{option.label}</span>
                        {!multiple && selected ? (
                          <span className="ac-searchable-select-check" aria-hidden="true">
                            ✓
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="ac-field ac-searchable-select-field">
      {label ? <span className="ac-searchable-select-label">{label}</span> : null}
      <div ref={rootRef} className={`ac-searchable-select${open ? ' is-open' : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          className="ac-searchable-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-required={required || undefined}
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setOpen((current) => !current)
          }}
        >
          <span
            className={`ac-searchable-select-value${
              !multiple && selectedOption ? '' : ' is-placeholder'
            }`}
          >
            {!multiple && selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown open={open} />
        </button>
        {menu}
      </div>
    </div>
  )
}

export type { SearchableSelectOption }
