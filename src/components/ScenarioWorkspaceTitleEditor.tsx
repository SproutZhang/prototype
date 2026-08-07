import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT } from '../i18n/scenarioStrings'

type ScenarioWorkspaceTitleEditorProps = {
  locale: AppLocale
  title: string
  onSave: (title: string) => void
  disabled?: boolean
}

export function ScenarioWorkspaceTitleEditor({ locale, title, onSave, disabled = false }: ScenarioWorkspaceTitleEditorProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)

  useEffect(() => {
    setDraft(title)
  }, [title])

  useEffect(() => {
    if (!isEditing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  const handleCancel = () => {
    setDraft(title)
    setIsEditing(false)
  }

  const handleSave = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSave(trimmed)
    setIsEditing(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    handleSave()
  }

  if (isEditing) {
    return (
      <form
        className="scenario-workspace-title-editor scenario-workspace-title-editor--editing"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor={inputId}>
          {scenarioT(locale, 'renameModalLabel')}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          className="scenario-workspace-title-editor__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              handleCancel()
            }
          }}
          placeholder={scenarioT(locale, 'renameModalPlaceholder')}
        />
        <div className="scenario-workspace-title-editor__actions">
          <button type="button" className="scenario-workspace-title-editor__cancel" onClick={handleCancel}>
            {scenarioT(locale, 'cancel')}
          </button>
          <button type="submit" className="scenario-workspace-title-editor__save" disabled={!draft.trim()}>
            {scenarioT(locale, 'save')}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div
      className={
        disabled
          ? 'scenario-workspace-title-editor scenario-workspace-title-editor--locked'
          : 'scenario-workspace-title-editor'
      }
    >
      <h1 className="agents-back-panel-title">{title}</h1>
      <button
        type="button"
        className={
          disabled
            ? 'scenario-workspace-title-editor__trigger is-disabled'
            : 'scenario-workspace-title-editor__trigger'
        }
        aria-label={scenarioT(locale, 'workspaceTitleEdit')}
        disabled={disabled}
        title={disabled ? scenarioT(locale, 'scenarioFrozenMustActivate') : undefined}
        onClick={() => {
          if (disabled) return
          setIsEditing(true)
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
          <path
            d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
