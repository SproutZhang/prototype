import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'
import { TcsViewToggle } from './TcsViewToggle'
import type { TcsListViewMode } from '../types'

type TeamCollaborationSpaceHeaderProps = {
  locale: AppLocale
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  viewMode: TcsListViewMode
  onViewModeChange: (mode: TcsListViewMode) => void
  onCreate?: () => void
}

function TeamCollaborationSpaceTagline({ locale }: { locale: AppLocale }) {
  if (locale === 'zh') {
    return (
      <div
        className="agents-subtitle agents-subtitle--tagline"
        aria-label={tcsT(locale, 'pageSubtitle')}
      >
        <span className="agents-subtitle-part">共享空间</span>
        <span className="agents-subtitle-dot" aria-hidden="true">·</span>
        <span className="agents-subtitle-part">团队协作空间</span>
      </div>
    )
  }

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={tcsT(locale, 'pageSubtitle')}
    >
      <span className="agents-subtitle-part">Shared Space</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">Team Collaboration</span>
    </div>
  )
}

export function TeamCollaborationSpaceHeader({
  locale,
  searchQuery,
  onSearchQueryChange,
  viewMode,
  onViewModeChange,
  onCreate,
}: TeamCollaborationSpaceHeaderProps) {
  return (
    <>
      <header className="agents-header skills-page-header tcs-page-header">
        <div className="agents-header-lead">
          <div className="agents-title">{tcsT(locale, 'pageTitle')}</div>
          <TeamCollaborationSpaceTagline locale={locale} />
        </div>
        <div className="agents-header-actions">
          {onCreate ? (
            <button type="button" className="agents-btn agents-btn-primary" onClick={onCreate}>
              + {tcsT(locale, 'createSpace')}
            </button>
          ) : null}
        </div>
      </header>

      <div className="agents-toolbar skills-page-toolbar tcs-page-toolbar">
        <div className="skills-page-toolbar-left tcs-page-toolbar-left">
          <div className="tcs-page-toolbar-search-row">
            <div className="agents-search skills-page-search tcs-page-search">
              <span className="agents-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.8 16.8 21 21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                className="agents-search-input"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder={tcsT(locale, 'searchPlaceholder')}
                aria-label={tcsT(locale, 'searchPlaceholder')}
              />
            </div>
            <TcsViewToggle locale={locale} viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </div>
        </div>
      </div>
    </>
  )
}
