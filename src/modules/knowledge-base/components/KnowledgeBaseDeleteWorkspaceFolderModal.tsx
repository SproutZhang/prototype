import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseWorkspaceFolder } from '../types'

type KnowledgeBaseDeleteWorkspaceFolderModalProps = {
  locale: AppLocale
  folder: KnowledgeBaseWorkspaceFolder | null
  folderName: string
  onClose: () => void
  onConfirm: () => void
}

export function KnowledgeBaseDeleteWorkspaceFolderModal({
  locale,
  folder,
  folderName,
  onClose,
  onConfirm,
}: KnowledgeBaseDeleteWorkspaceFolderModalProps) {
  if (!folder) return null

  const message = kbT(locale, 'deleteWorkspaceFolderMessage').replace('{name}', folderName)

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--compact"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kb-delete-workspace-folder-title"
        aria-describedby="kb-delete-workspace-folder-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="kb-delete-workspace-folder-title" className="kb-modal-title">
          {kbT(locale, 'deleteWorkspaceFolderTitle')}
        </h2>
        <p id="kb-delete-workspace-folder-desc" className="kb-modal-hint">
          {message}
        </p>
        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          <button type="button" className="kb-btn kb-btn--danger" onClick={onConfirm}>
            {kbT(locale, 'deleteWorkspaceFolderConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
