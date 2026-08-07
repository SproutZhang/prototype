import { useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseItem, KnowledgeBaseWorkspaceFolder } from '../types'

type KnowledgeBaseMoveItemModalProps = {
  locale: AppLocale
  item: KnowledgeBaseItem | null
  itemName: string
  folders: KnowledgeBaseWorkspaceFolder[]
  localizeFolderName: (folder: KnowledgeBaseWorkspaceFolder) => string
  onClose: () => void
  onSubmit: (itemId: string, targetFolderId: string | null) => void
}

type MoveTarget = { kind: 'root' } | { kind: 'folder'; folderId: string }

export function KnowledgeBaseMoveItemModal({
  locale,
  item,
  itemName,
  folders,
  localizeFolderName,
  onClose,
  onSubmit,
}: KnowledgeBaseMoveItemModalProps) {
  const targets = useMemo<MoveTarget[]>(() => {
    if (!item) return []
    const list: MoveTarget[] = []
    if (item.workspaceFolderId !== null) {
      list.push({ kind: 'root' })
    }
    for (const folder of folders) {
      if (folder.id !== item.workspaceFolderId) {
        list.push({ kind: 'folder', folderId: folder.id })
      }
    }
    return list
  }, [folders, item])

  const [selectedKey, setSelectedKey] = useState('')

  useEffect(() => {
    if (!item) return
    const first = targets[0]
    if (!first) {
      setSelectedKey('')
      return
    }
    setSelectedKey(first.kind === 'root' ? 'root' : first.folderId)
  }, [item, targets])

  if (!item) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedKey) return
    const targetFolderId = selectedKey === 'root' ? null : selectedKey
    onSubmit(item.id, targetFolderId)
  }

  const targetLabel = (target: MoveTarget) => {
    if (target.kind === 'root') return kbT(locale, 'moveItemTargetRoot')
    const folder = folders.find((entry) => entry.id === target.folderId)
    return folder ? localizeFolderName(folder) : target.folderId
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--move-item"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-move-item-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <h2 id="kb-move-item-title" className="kb-modal-title">
            {kbT(locale, 'moveItemTitle')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>
        <p className="kb-modal-hint">{kbT(locale, 'moveItemHint').replace('{name}', itemName)}</p>
        <form className="kb-modal-form" onSubmit={handleSubmit}>
          {targets.length === 0 ? (
            <p className="kb-modal-hint">{kbT(locale, 'moveItemNoTargets')}</p>
          ) : (
            <fieldset className="kb-move-item-targets">
              <legend className="sr-only">{kbT(locale, 'moveItemTargetLabel')}</legend>
              {targets.map((target) => {
                const key = target.kind === 'root' ? 'root' : target.folderId
                return (
                  <label key={key} className="kb-move-item-target">
                    <input
                      type="radio"
                      name="kb-move-target"
                      value={key}
                      checked={selectedKey === key}
                      onChange={() => setSelectedKey(key)}
                    />
                    <span>{targetLabel(target)}</span>
                  </label>
                )
              })}
            </fieldset>
          )}
          <div className="kb-modal-actions">
            <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
              {kbT(locale, 'createCancel')}
            </button>
            <button type="submit" className="agents-btn agents-btn-primary" disabled={!selectedKey}>
              {kbT(locale, 'moveItemConfirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
