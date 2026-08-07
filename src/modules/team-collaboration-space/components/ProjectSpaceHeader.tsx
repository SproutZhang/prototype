import type { AppLocale } from '../../../i18n/homeStrings'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { tcsT } from '../i18n/strings'

type ProjectSpaceHeaderProps = {
  locale: AppLocale
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

function ProjectSpaceTagline({ locale }: { locale: AppLocale }) {
  const { isUser } = useTeamCollaborationCapabilities()

  if (isUser) {
    const text = tcsT(locale, 'projectSpaceUserTagline')
    return (
      <div className="agents-subtitle agents-subtitle--tagline" aria-label={text}>
        {text}
      </div>
    )
  }

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={tcsT(locale, 'projectSpacePageSubtitle')}
    >
      <span className="agents-subtitle-part">{tcsT(locale, 'projectSpaceGroupsTitle')}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">
        ·
      </span>
      <span className="agents-subtitle-part">{tcsT(locale, 'sectionTeamTitle')}</span>
    </div>
  )
}

export function ProjectSpaceHeader({
  locale,
  searchQuery,
  onSearchQueryChange,
}: ProjectSpaceHeaderProps) {
  return (
    <>
      <header className="agents-header skills-page-header tcs-page-header">
        <div className="agents-header-lead">
          <div className="agents-title">{tcsT(locale, 'projectSpaceTitle')}</div>
          <ProjectSpaceTagline locale={locale} />
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
                type="search"
                className="agents-search-input"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder={tcsT(locale, 'projectSpaceSearchPlaceholder')}
                aria-label={tcsT(locale, 'projectSpaceSearchPlaceholder')}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
