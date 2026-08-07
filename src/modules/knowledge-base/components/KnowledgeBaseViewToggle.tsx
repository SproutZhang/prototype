import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseListViewMode } from '../types'

type KnowledgeBaseViewToggleProps = {
  locale: AppLocale
  viewMode: KnowledgeBaseListViewMode
  onViewModeChange: (mode: KnowledgeBaseListViewMode) => void
}

export function KnowledgeBaseViewToggle({ locale, viewMode, onViewModeChange }: KnowledgeBaseViewToggleProps) {
  return (
    <div className="tools-directory-view-toggle" role="tablist" aria-label={kbT(locale, 'viewToggle')}>
      <button
        type="button"
        className={
          viewMode === 'table' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'
        }
        role="tab"
        aria-selected={viewMode === 'table'}
        onClick={() => onViewModeChange('table')}
        title={kbT(locale, 'listView')}
      >
        ☰
      </button>
      <button
        type="button"
        className={
          viewMode === 'cards' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'
        }
        role="tab"
        aria-selected={viewMode === 'cards'}
        onClick={() => onViewModeChange('cards')}
        title={kbT(locale, 'cardsView')}
      >
        ⊞
      </button>
    </div>
  )
}
