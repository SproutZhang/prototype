import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import {
  getAllSelectableIds,
  getFolderSelectableIds,
  getIntegrationFolders,
  type KnowledgeBaseIntegrationFolder,
  type KnowledgeBaseIntegrationFolderFile,
} from '../data/integrationFolders'
import { kbIntegrationProviderLabel, kbT } from '../i18n/strings'
import type { KnowledgeBaseIntegrationProvider } from '../types'

type KnowledgeBasePickIntegrationFolderModalProps = {
  locale: AppLocale
  open: boolean
  provider: KnowledgeBaseIntegrationProvider | null
  onClose: () => void
  onBack: () => void
  onConfirm: (provider: KnowledgeBaseIntegrationProvider, folderIds: string[]) => void
}

function FolderIcon() {
  return (
    <span className="kb-int-folder-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
        <path
          d="M2.5 4.5h4.2l1.3 1.5h5.5v7.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M2.5 6h11.5" stroke="#f59e0b" strokeWidth="0.8" />
      </svg>
    </span>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M4 2.5h5.5L13 6v7.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
        fill="#ecfdf5"
        stroke="#059669"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path d="M9.5 2.5V6H13" fill="none" stroke="#059669" strokeWidth="0.9" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={expanded ? 'kb-integration-folder-chevron-icon is-expanded' : 'kb-integration-folder-chevron-icon'}
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function folderName(folder: KnowledgeBaseIntegrationFolder, locale: AppLocale): string {
  return locale === 'zh' ? folder.nameZh : folder.nameEn
}

function fileName(file: KnowledgeBaseIntegrationFolderFile, locale: AppLocale): string {
  return locale === 'zh' ? file.nameZh : file.nameEn
}

function stopEvent(event: MouseEvent) {
  event.stopPropagation()
}

export function KnowledgeBasePickIntegrationFolderModal({
  locale,
  open,
  provider,
  onClose,
  onBack,
  onConfirm,
}: KnowledgeBasePickIntegrationFolderModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const folders = provider ? getIntegrationFolders(provider) : []
  const selectableIds = useMemo(() => getAllSelectableIds(folders), [folders])

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set())
      setExpandedFolderIds(new Set())
    }
  }, [open, provider])

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
  const someSelected = selectableIds.some((id) => selectedIds.has(id)) && !allSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  if (!open || !provider) return null

  const toggleExpanded = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleFolderGroup = (folder: KnowledgeBaseIntegrationFolder) => {
    const ids = getFolderSelectableIds(folder)
    if (ids.length === 0) return
    const allChecked = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (allChecked) {
          next.delete(id)
        } else {
          next.add(id)
        }
      }
      return next
    })
  }

  const isFolderChecked = (folder: KnowledgeBaseIntegrationFolder) => {
    const ids = getFolderSelectableIds(folder)
    return ids.length > 0 && ids.every((id) => selectedIds.has(id))
  }

  const isFolderIndeterminate = (folder: KnowledgeBaseIntegrationFolder) => {
    const ids = getFolderSelectableIds(folder)
    const selectedCount = ids.filter((id) => selectedIds.has(id)).length
    return selectedCount > 0 && selectedCount < ids.length
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(selectableIds))
  }

  const handleConfirm = () => {
    if (selectedIds.size === 0) return
    onConfirm(provider, [...selectedIds])
  }

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--source kb-modal--integration-folder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-pick-integration-folder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="kb-integration-folder-back" onClick={onBack}>
          ‹ {kbT(locale, 'integrationPickFolderBack')}
        </button>
        <h2 id="kb-pick-integration-folder-title" className="kb-modal-title">
          {kbT(locale, 'integrationPickFolderTitle')}
        </h2>
        <p className="kb-modal-hint">
          {kbT(locale, 'integrationPickFolderHint').replace(
            '{provider}',
            kbIntegrationProviderLabel(locale, provider),
          )}
        </p>

        <div className="kb-integration-folder-table">
          <div className="kb-integration-folder-table-head" role="row">
            <label className="kb-integration-folder-table-check">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={kbT(locale, 'integrationPickFolderSelectAll')}
                disabled={selectableIds.length === 0}
              />
            </label>
            <span className="kb-integration-folder-table-col-name">{kbT(locale, 'integrationListColName')}</span>
            <span className="kb-integration-folder-table-col-size">{kbT(locale, 'docListColSize')}</span>
          </div>

          <ul className="kb-integration-folder-table-body" role="list">
            {folders.map((folder) => {
              const expanded = expandedFolderIds.has(folder.id)
              const folderChecked = isFolderChecked(folder)
              const folderIndeterminate = isFolderIndeterminate(folder)
              const hasFiles = folder.files.length > 0

              return (
                <li key={folder.id} className="kb-integration-folder-table-group">
                  <div
                    className={`kb-integration-folder-table-row${folderChecked ? ' is-selected' : ''}${folder.disabled ? ' is-disabled' : ''}`}
                  >
                    <label className="kb-integration-folder-table-check" onClick={stopEvent}>
                      <input
                        type="checkbox"
                        checked={folderChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = folderIndeterminate
                        }}
                        disabled={folder.disabled}
                        onChange={() => toggleFolderGroup(folder)}
                        aria-label={folderName(folder, locale)}
                      />
                    </label>
                    <div className="kb-integration-folder-table-col-name">
                      {hasFiles ? (
                        <button
                          type="button"
                          className="kb-integration-folder-chevron-btn"
                          aria-expanded={expanded}
                          aria-label={folderName(folder, locale)}
                          onClick={() => toggleExpanded(folder.id)}
                        >
                          <ChevronIcon expanded={expanded} />
                        </button>
                      ) : (
                        <span className="kb-integration-folder-chevron-spacer" aria-hidden="true" />
                      )}
                      <FolderIcon />
                      <span className="kb-integration-folder-table-name">{folderName(folder, locale)}</span>
                    </div>
                    <span className="kb-integration-folder-table-col-size">{folder.sizeLabel}</span>
                  </div>

                  {expanded && hasFiles
                    ? folder.files.map((file) => {
                        const fileChecked = selectedIds.has(file.id)
                        return (
                          <div
                            key={file.id}
                            className={`kb-integration-folder-table-row kb-integration-folder-table-row--file${fileChecked ? ' is-selected' : ''}${file.disabled ? ' is-disabled' : ''}`}
                          >
                            <label className="kb-integration-folder-table-check" onClick={stopEvent}>
                              <input
                                type="checkbox"
                                checked={fileChecked}
                                disabled={file.disabled}
                                onChange={() => toggleOne(file.id)}
                                aria-label={fileName(file, locale)}
                              />
                            </label>
                            <div className="kb-integration-folder-table-col-name">
                              <span className="kb-integration-folder-chevron-spacer" aria-hidden="true" />
                              <FileIcon />
                              <span className="kb-integration-folder-table-name">{fileName(file, locale)}</span>
                            </div>
                            <span className="kb-integration-folder-table-col-size">{file.sizeLabel}</span>
                          </div>
                        )
                      })
                    : null}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button
            type="button"
            className="kb-btn kb-btn--primary"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            {kbT(locale, 'integrationPickFolderConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
