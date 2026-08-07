import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import { KnowledgeBaseCreateActions } from './KnowledgeBaseCreateActions'

type KnowledgeBaseHeaderProps = {
  locale: AppLocale
  showCreateActions?: boolean
  canCreateKb?: boolean
  canCreateFolder?: boolean
  onCreate?: () => void
  onCreateFolder?: () => void
}

function KnowledgeBasePageTagline({ locale }: { locale: AppLocale }) {
  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={locale === 'zh' ? '内容·场景·工具·流程' : 'Content · Scenario · Tool · Flow'}
    >
      <span className="agents-subtitle-part">{locale === 'zh' ? '内容' : 'Content'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '场景' : 'Scenario'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '工具' : 'Tool'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '流程' : 'Flow'}</span>
    </div>
  )
}

export function KnowledgeBaseHeader({
  locale,
  showCreateActions = false,
  canCreateKb = true,
  canCreateFolder = true,
  onCreate,
  onCreateFolder,
}: KnowledgeBaseHeaderProps) {
  const showCreate = showCreateActions && onCreate && onCreateFolder && (canCreateKb || canCreateFolder)

  return (
    <header className="agents-header kb-header">
      <div className="agents-header-lead">
        <h1 className="agents-title kb-header-title">{kbT(locale, 'pageTitle')}</h1>
        <KnowledgeBasePageTagline locale={locale} />
      </div>
      {showCreate ? (
        <div className="agents-header-actions">
          <KnowledgeBaseCreateActions
            locale={locale}
            canCreateKb={canCreateKb}
            canCreateFolder={canCreateFolder}
            onCreate={onCreate}
            onCreateFolder={onCreateFolder}
          />
        </div>
      ) : null}
    </header>
  )
}
