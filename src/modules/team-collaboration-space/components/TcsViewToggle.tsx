import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import type { TcsListViewMode } from '../types'

type TcsViewToggleProps = {
  locale: AppLocale
  viewMode: TcsListViewMode
  onViewModeChange: (mode: TcsListViewMode) => void
}

export function TcsViewToggle({ locale, viewMode, onViewModeChange }: TcsViewToggleProps) {
  return (
    <div className="tools-directory-view-toggle" role="tablist" aria-label={tcsT(locale, 'viewToggle')}>
      <button
        type="button"
        className={viewMode === 'list' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
        role="tab"
        aria-selected={viewMode === 'list'}
        onClick={() => onViewModeChange('list')}
        title={tcsT(locale, 'listView')}
      >
        ☰
      </button>
      <button
        type="button"
        className={viewMode === 'cards' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
        role="tab"
        aria-selected={viewMode === 'cards'}
        onClick={() => onViewModeChange('cards')}
        title={tcsT(locale, 'cardsView')}
      >
        ⊞
      </button>
    </div>
  )
}
