import { useEffect, useId, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { EMBEDDING_MODEL_OPTIONS, findEmbeddingModelOption } from '../data/embeddingModelOptions'
import { kbT } from '../i18n/strings'

type EmbeddingModelSelectProps = {
  locale: AppLocale
  value: string
  onChange: (value: string) => void
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

function EmbeddingModelLogo({ label, logoSrc }: { label: string; logoSrc: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="kb-embedding-model-logo kb-embedding-model-logo--fallback" aria-hidden="true">
        {label.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <span className="kb-embedding-model-logo" aria-hidden="true">
      <img src={logoSrc} alt="" draggable={false} onError={() => setFailed(true)} />
    </span>
  )
}

export function EmbeddingModelSelect({ locale, value, onChange }: EmbeddingModelSelectProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = findEmbeddingModelOption(value)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const pickOption = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={`kb-embedding-model-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="kb-embedding-model-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? (
          <>
            <EmbeddingModelLogo label={selected.label} logoSrc={selected.logoSrc} />
            <span className="kb-embedding-model-select-value">{selected.label}</span>
          </>
        ) : (
          <span className="kb-embedding-model-select-placeholder">
            {kbT(locale, 'docInsertBlockSelectEmbeddingModelPlaceholder')}
          </span>
        )}
        <span className="kb-embedding-model-select-chevron" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>
      {open ? (
        <ul id={listboxId} className="kb-embedding-model-select-menu" role="listbox">
          {EMBEDDING_MODEL_OPTIONS.map((option) => {
            const isSelected = value === option.value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`kb-embedding-model-select-option${isSelected ? ' is-selected' : ''}`}
                  onClick={() => pickOption(option.value)}
                >
                  <EmbeddingModelLogo label={option.label} logoSrc={option.logoSrc} />
                  <span className="kb-embedding-model-select-option-label">{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
