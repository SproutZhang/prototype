import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'

type KnowledgeBaseListBulkBarProps = {
  locale: AppLocale
  selectedCount: number
  onDelete: () => void
  onClearSelection: () => void
}

export function KnowledgeBaseListBulkBar({
  locale,
  selectedCount,
  onDelete,
  onClearSelection,
}: KnowledgeBaseListBulkBarProps) {
  if (selectedCount <= 0) return null

  return (
    <div className="kb-table-foot" role="status" aria-live="polite" aria-label={kbT(locale, 'listBulkBarLabel')}>
      <span className="kb-table-foot-selected">
        {kbT(locale, 'listBulkSelectedCount').replace('{count}', String(selectedCount))}
      </span>
      <div className="kb-table-foot-actions">
        <button type="button" className="kb-table-foot-action kb-table-foot-action--danger" onClick={onDelete}>
          {kbT(locale, 'listBulkDeleteAction')}
        </button>
        <button type="button" className="kb-table-foot-action" onClick={onClearSelection}>
          {kbT(locale, 'listBulkClearSelection')}
        </button>
      </div>
    </div>
  )
}
