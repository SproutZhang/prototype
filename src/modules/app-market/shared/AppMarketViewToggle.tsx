import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketT } from '../i18n/strings'

export type AppMarketListViewMode = 'cards' | 'list'

type AppMarketViewToggleProps = {
  locale: AppLocale
  viewMode: AppMarketListViewMode
  onViewModeChange: (mode: AppMarketListViewMode) => void
}

export function AppMarketViewToggle({ locale, viewMode, onViewModeChange }: AppMarketViewToggleProps) {
  return (
    <div className="tools-directory-view-toggle" role="tablist" aria-label={appMarketT(locale, 'viewToggle')}>
      <button
        type="button"
        className={viewMode === 'list' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
        role="tab"
        aria-selected={viewMode === 'list'}
        onClick={() => onViewModeChange('list')}
        title={appMarketT(locale, 'listView')}
      >
        ☰
      </button>
      <button
        type="button"
        className={viewMode === 'cards' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
        role="tab"
        aria-selected={viewMode === 'cards'}
        onClick={() => onViewModeChange('cards')}
        title={appMarketT(locale, 'cardsView')}
      >
        ⊞
      </button>
    </div>
  )
}
