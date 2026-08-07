import { useEffect, useId, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { PlanBlueprintToolIcon } from '../../../components/shared/WfBlueprintStepsBlock'
import type { ToolDirectoryItem } from '../../../data/tools-directory'
import type { AppLocale } from '../../../i18n/homeStrings'
import { localizeToolForDisplay } from '../../../i18n/toolsStrings'
import {
  getToolDirectoryBrandLabel,
  getToolDirectoryCardIconStyle,
  getToolIntegrationLabel,
  renderToolDirectoryCardIconContent,
} from '../../../utils/toolDirectoryCardIcon'
import { buildToolInputSchemaRows } from '../../../utils/toolDirectoryInputSchema'
import { tcsT } from '../i18n/strings'

type MineContentToolDetailDrawerProps = {
  open: boolean
  locale: AppLocale
  tool: ToolDirectoryItem | null
  onClose: () => void
}

function formatTimesRun(value: number, locale: AppLocale): string {
  return locale === 'zh' ? `${value} 次` : `${value} runs`
}

export function MineContentToolDetailDrawer({
  open,
  locale,
  tool,
  onClose,
}: MineContentToolDetailDrawerProps) {
  const headingId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || !tool) return null

  const displayTool = localizeToolForDisplay(tool, locale)
  const inputRows = buildToolInputSchemaRows(tool)
  const brandLabel = getToolDirectoryBrandLabel(tool)
  const iconStyle = brandLabel ? ({} as CSSProperties) : getToolDirectoryCardIconStyle(tool.iconTone)

  const modal = (
    <div
      className="tcs-mine-tool-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <button
        type="button"
        className="tcs-mine-tool-detail-modal__backdrop"
        aria-label={tcsT(locale, 'formCancel')}
        onClick={onClose}
      />
      <div className="tcs-mine-tool-detail-modal__panel">
        <header className="tcs-mine-tool-detail-modal__header">
          <div className="tcs-mine-tool-detail-modal__heading">
            <span
              className={`agent-card-icon tcs-mine-tool-detail-modal__icon${brandLabel ? ' has-custom-content' : ''}`}
              style={iconStyle}
              aria-hidden="true"
            >
              {renderToolDirectoryCardIconContent(tool) ?? displayTool.iconText}
            </span>
            <div>
              <p className="tcs-mine-tool-detail-modal__eyebrow">
                {tcsT(locale, 'mineToolDetailDrawerTitle')}
              </p>
              <h2 id={headingId} className="tcs-mine-tool-detail-modal__title">
                {displayTool.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="tcs-mine-tool-detail-modal__close"
            aria-label={tcsT(locale, 'formCancel')}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="tcs-mine-tool-detail-modal__body">
          <ToolDetailSection title={tcsT(locale, 'mineToolDetailPurpose')}>
            <p className="tcs-mine-tool-detail-description">{displayTool.description}</p>
            <dl className="tcs-mine-tool-detail-meta tcs-mine-tool-detail-meta--spaced">
              <div>
                <dt>{tcsT(locale, 'mineToolDetailType')}</dt>
                <dd>{displayTool.type}</dd>
              </div>
              <div>
                <dt>{tcsT(locale, 'mineToolDetailOwner')}</dt>
                <dd>{displayTool.owner}</dd>
              </div>
            </dl>
          </ToolDetailSection>

          {displayTool.integrations.length > 0 ? (
            <ToolDetailSection title={tcsT(locale, 'mineToolDetailIntegrations')}>
              <ul className="tcs-mine-tool-detail-chip-list">
                {displayTool.integrations.map((integration) => {
                  const label = getToolIntegrationLabel(integration)
                  return (
                    <li key={integration} className="tcs-mine-tool-detail-chip">
                      <span className="app-market-brand-icon" aria-hidden="true">
                        <PlanBlueprintToolIcon label={label} />
                      </span>
                      <span>{label}</span>
                    </li>
                  )
                })}
              </ul>
            </ToolDetailSection>
          ) : null}

          {displayTool.agents.length > 0 ? (
            <ToolDetailSection title={tcsT(locale, 'mineToolDetailAgents')}>
              <ul className="tcs-mine-tool-detail-list">
                {displayTool.agents.map((agent) => (
                  <li key={agent}>{agent}</li>
                ))}
              </ul>
            </ToolDetailSection>
          ) : null}

          <ToolDetailSection title={tcsT(locale, 'mineToolDetailUsage')}>
            <dl className="tcs-mine-tool-detail-meta">
              <div>
                <dt>{tcsT(locale, 'mineToolDetailTimesRun')}</dt>
                <dd>{formatTimesRun(displayTool.timesRun, locale)}</dd>
              </div>
              <div>
                <dt>{tcsT(locale, 'mineToolDetailLastRun')}</dt>
                <dd>{displayTool.lastRunLabel}</dd>
              </div>
            </dl>
          </ToolDetailSection>

          {inputRows.length > 0 ? (
            <ToolDetailSection title={tcsT(locale, 'mineToolDetailInputs')}>
              <ul className="tcs-mine-tool-detail-input-list">
                {inputRows.map((row) => (
                  <li key={row.property} className="tcs-mine-tool-detail-input-row">
                    <div className="tcs-mine-tool-detail-input-head">
                      <code className="tcs-mine-tool-detail-input-property">{row.property}</code>
                      <span className="tcs-mine-tool-detail-input-type">{row.type}</span>
                      <span
                        className={`tcs-mine-tool-detail-input-required${row.required ? ' is-required' : ''}`}
                      >
                        {row.required
                          ? tcsT(locale, 'mineToolDetailRequired')
                          : tcsT(locale, 'mineToolDetailOptional')}
                      </span>
                    </div>
                    <p className="tcs-mine-tool-detail-input-desc">{row.description}</p>
                  </li>
                ))}
              </ul>
            </ToolDetailSection>
          ) : null}
        </div>

        <footer className="tcs-mine-tool-detail-modal__footer">
          <button type="button" className="agents-btn agents-btn-secondary" onClick={onClose}>
            {tcsT(locale, 'formCancel')}
          </button>
        </footer>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function ToolDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tcs-mine-tool-detail-section">
      <h3 className="tcs-mine-tool-detail-section-title">{title}</h3>
      {children}
    </section>
  )
}
