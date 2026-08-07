import type { CSSProperties } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketProductLineLabel, appMarketT } from '../i18n/strings'
import type { AppMarketItem } from './types'

type AppMarketDetailViewProps = {
  locale: AppLocale
  item: AppMarketItem
  installed: boolean
  installing: boolean
  onBack: () => void
  onInstall: () => void
}

export function AppMarketDetailView({
  locale,
  item,
  installed,
  installing,
  onBack,
  onInstall,
}: AppMarketDetailViewProps) {
  const name = locale === 'zh' ? item.nameZh : item.nameEn
  const description = locale === 'zh' ? item.descriptionZh : item.descriptionEn
  const iconStyle = {
    '--agent-icon-from': item.iconFrom,
    '--agent-icon-via': item.iconFrom,
    '--agent-icon-to': item.iconTo,
    '--agent-icon-shadow': 'rgba(91, 124, 255, 0.24)',
  } as CSSProperties

  return (
    <div className="app-market-tool-detail-modal-root" role="presentation">
      <button
        type="button"
        className="app-market-tool-detail-modal-backdrop"
        aria-label={appMarketT(locale, 'detailClose')}
        onClick={onBack}
      />
      <div className="app-market-tool-detail-modal-panel" role="dialog" aria-modal="true" aria-label={name}>
        <div className="app-market-tool-detail-modal-header">
          <div className="app-market-tool-detail-modal-title-wrap">
            <div className="app-market-tool-detail-modal-title">{name}</div>
            <div className="app-market-tool-detail-modal-subtitle">
              {appMarketProductLineLabel(locale, item.productLine)}
            </div>
          </div>
          <button
            type="button"
            className="app-market-tool-detail-modal-close"
            aria-label={appMarketT(locale, 'detailClose')}
            onClick={onBack}
          >
            ×
          </button>
        </div>
        <div className="app-market-tool-detail-modal-body">
          <article className="app-market-detail-card agent-card" aria-busy={installing}>
            <div className="agent-card-icon agent-card-icon-grad app-market-detail-icon" style={iconStyle} aria-hidden="true" />
            <p className="agent-card-desc app-market-detail-desc">{description}</p>
            <dl className="app-market-detail-facts">
              <div>
                <dt>{appMarketT(locale, 'publisher')}</dt>
                <dd>{item.publisher}</dd>
              </div>
              <div>
                <dt>{appMarketT(locale, 'rating')}</dt>
                <dd>{item.rating.toFixed(1)}</dd>
              </div>
              <div>
                <dt>{appMarketT(locale, 'installs')}</dt>
                <dd>{item.installs}</dd>
              </div>
              <div>
                <dt>{appMarketT(locale, 'productLine')}</dt>
                <dd>{appMarketProductLineLabel(locale, item.productLine)}</dd>
              </div>
            </dl>
            <div className="app-market-detail-actions">
              <button
                type="button"
                className={installed ? 'agents-btn' : 'agents-btn agents-btn-primary'}
                disabled={installed || installing}
                onClick={onInstall}
              >
                {installed
                  ? appMarketT(locale, 'installed')
                  : installing
                    ? appMarketT(locale, 'installPreparing')
                    : appMarketT(locale, 'install')}
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
