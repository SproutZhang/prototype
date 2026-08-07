import type { AppLocale } from '../i18n/homeStrings'
import { scenarioT } from '../i18n/scenarioStrings'

type ScenarioWorkspaceMoreMenuProps = {
  locale: AppLocale
  frozen?: boolean
  onActivate?: () => void
  onDuplicate: () => void
  onRename: () => void
  onViewPublishVersionHistory: () => void
  onFreezeRun: () => void
  onDelete: () => void
}

export function ScenarioWorkspaceMoreMenu({
  locale,
  frozen = false,
  onActivate,
  onDuplicate,
  onRename,
  onViewPublishVersionHistory,
  onFreezeRun,
  onDelete,
}: ScenarioWorkspaceMoreMenuProps) {
  const frozenHint = scenarioT(locale, 'scenarioFrozenMustActivate')

  return (
    <div className="scenario-workspace-more-wrap">
      <button
        type="button"
        className="scenario-workspace-more-btn"
        aria-label={scenarioT(locale, 'workspaceMoreActions')}
        aria-haspopup="menu"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <circle cx="12" cy="6" r="1.75" fill="currentColor" />
          <circle cx="12" cy="12" r="1.75" fill="currentColor" />
          <circle cx="12" cy="18" r="1.75" fill="currentColor" />
        </svg>
      </button>
      <div className="scenario-workspace-more-menu" role="menu" aria-label={scenarioT(locale, 'workspaceMoreActions')}>
        {frozen && onActivate ? (
          <button type="button" className="scenario-workspace-more-menu-item" role="menuitem" onClick={onActivate}>
            {scenarioT(locale, 'scenarioActivateRun')}
          </button>
        ) : null}
        <button
          type="button"
          className={frozen ? 'scenario-workspace-more-menu-item is-disabled' : 'scenario-workspace-more-menu-item'}
          role="menuitem"
          disabled={frozen}
          title={frozen ? frozenHint : undefined}
          onClick={() => {
            if (frozen) return
            onDuplicate()
          }}
        >
          {scenarioT(locale, 'workspaceMoreDuplicate')}
        </button>
        <button
          type="button"
          className={frozen ? 'scenario-workspace-more-menu-item is-disabled' : 'scenario-workspace-more-menu-item'}
          role="menuitem"
          disabled={frozen}
          title={frozen ? frozenHint : undefined}
          onClick={() => {
            if (frozen) return
            onRename()
          }}
        >
          {scenarioT(locale, 'workspaceMoreRename')}
        </button>
        <button
          type="button"
          className={frozen ? 'scenario-workspace-more-menu-item is-disabled' : 'scenario-workspace-more-menu-item'}
          role="menuitem"
          disabled={frozen}
          title={frozen ? frozenHint : undefined}
          onClick={() => {
            if (frozen) return
            onViewPublishVersionHistory()
          }}
        >
          {scenarioT(locale, 'publishVersionHistoryBtn')}
        </button>
        <button
          type="button"
          className={frozen ? 'scenario-workspace-more-menu-item is-disabled' : 'scenario-workspace-more-menu-item'}
          role="menuitem"
          disabled={frozen}
          title={frozen ? frozenHint : undefined}
          onClick={() => {
            if (frozen) return
            onFreezeRun()
          }}
        >
          {scenarioT(locale, 'workspaceMoreFreezeRun')}
        </button>
        <button
          type="button"
          className={
            frozen
              ? 'scenario-workspace-more-menu-item scenario-workspace-more-menu-item--danger is-disabled'
              : 'scenario-workspace-more-menu-item scenario-workspace-more-menu-item--danger'
          }
          role="menuitem"
          disabled={frozen}
          title={frozen ? frozenHint : undefined}
          onClick={() => {
            if (frozen) return
            onDelete()
          }}
        >
          {scenarioT(locale, 'workspaceMoreDelete')}
        </button>
      </div>
    </div>
  )
}
