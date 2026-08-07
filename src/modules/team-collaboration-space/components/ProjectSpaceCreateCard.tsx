import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'

type ProjectSpaceCreateCardProps = {
  locale: AppLocale
  onCreate?: () => void
}

export function ProjectSpaceCreateCard({ locale, onCreate }: ProjectSpaceCreateCardProps) {
  return (
    <article className="agent-card tcs-project-create-card">
      <button
        type="button"
        className="tcs-project-create-card-btn"
        onClick={onCreate}
        aria-label={tcsT(locale, 'projectSpaceCreateProject')}
      >
        <span className="tcs-project-create-card-icon" aria-hidden="true">
          +
        </span>
        <span className="tcs-project-create-card-label">{tcsT(locale, 'projectSpaceCreateProject')}</span>
      </button>
    </article>
  )
}
