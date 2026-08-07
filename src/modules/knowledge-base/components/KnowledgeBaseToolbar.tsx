import type { AppLocale } from '../../../i18n/homeStrings'
import { kbSortLabel, kbT } from '../i18n/strings'
import type { KnowledgeBaseListViewMode, KnowledgeBaseSort } from '../types'
import { KnowledgeBaseViewToggle } from './KnowledgeBaseViewToggle'

const SORT_OPTIONS: KnowledgeBaseSort[] = ['updated', 'name', 'documents']

type KnowledgeBaseToolbarProps = {
  locale: AppLocale
  search: string
  sort: KnowledgeBaseSort
  viewMode: KnowledgeBaseListViewMode
  onSearchChange: (value: string) => void
  onSortChange: (sort: KnowledgeBaseSort) => void
  onViewModeChange: (mode: KnowledgeBaseListViewMode) => void
}

export function KnowledgeBaseToolbar({
  locale,
  search,
  sort,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
}: KnowledgeBaseToolbarProps) {
  return (
    <div className="kb-toolbar">
      <label className="kb-search">
        <span className="kb-search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          placeholder={kbT(locale, 'searchPlaceholder')}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <div className="kb-toolbar-actions">
        <label className="kb-sort">
          <select value={sort} onChange={(e) => onSortChange(e.target.value as KnowledgeBaseSort)}>
            {SORT_OPTIONS.map((id) => (
              <option key={id} value={id}>
                {kbSortLabel(locale, id)}
              </option>
            ))}
          </select>
        </label>
        <KnowledgeBaseViewToggle locale={locale} viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
    </div>
  )
}
