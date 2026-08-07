import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { PlanBlueprintToolIcon } from '../../../components/shared/WfBlueprintStepsBlock'
import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketSubAgentCountBadge, appMarketT } from '../i18n/strings'
import { PluginToolLogo } from '../shared/PluginToolLogo'
import type { AppMarketItem } from '../shared/types'

type AgentTemplateDetailModalProps = {
  locale: AppLocale
  item: AppMarketItem
  onClose: () => void
  onUseTemplate: () => void
}

type UseTemplatePhase = 'idle' | 'loading' | 'success'

const USE_TEMPLATE_LOADING_MS = 2000
const USE_TEMPLATE_SUCCESS_TOAST_MS = 3200

function ModalCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function resolvePluginTools(
  locale: AppLocale,
  zh: readonly string[] | undefined,
  en: readonly string[] | undefined,
): string[] {
  return locale === 'zh' ? [...(zh ?? [])] : [...(en ?? zh ?? [])]
}

type TemplatePluginToolsSectionProps = {
  locale: AppLocale
  tools: readonly string[]
  labelId: string
  variant?: 'default' | 'with-desc'
}

function TemplatePluginToolsSection({
  locale,
  tools,
  labelId,
  variant = 'default',
}: TemplatePluginToolsSectionProps) {
  const sectionClass =
    variant === 'with-desc'
      ? 'app-market-template-modal-tools app-market-template-modal-tools--with-desc'
      : 'app-market-template-modal-tools'

  return (
    <section className={sectionClass} aria-labelledby={labelId}>
      <h3 id={labelId} className="app-market-template-modal-tools-label">
        {appMarketT(locale, 'pluginTools')}
      </h3>
      {tools.length > 0 ? (
        <ul className="app-market-template-modal-tools-list">
          {tools.map((tool) => (
            <li key={tool} className="app-market-template-modal-tool-item">
              <span
                className="app-market-template-modal-tool-icon"
                data-tooltip={tool}
                tabIndex={0}
                role="img"
                aria-label={tool}
              >
                <PluginToolLogo name={tool} size={22} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="app-market-template-modal-tools-empty">{appMarketT(locale, 'pluginToolsEmpty')}</p>
      )}
    </section>
  )
}

function SubAgentTriggerPluginTools({ tools }: { tools: readonly string[] }) {
  if (tools.length === 0) return null
  return (
    <ul className="app-market-template-modal-subagent-trigger-tools" aria-label="使用的插件工具">
      {tools.map((tool) => (
        <li key={tool} className="app-market-template-modal-tool-item">
          <span
            className="app-market-template-modal-tool-icon app-market-template-modal-tool-icon--inline"
            data-tooltip={tool}
            tabIndex={-1}
            role="img"
            aria-label={tool}
          >
            <PluginToolLogo name={tool} size={16} />
          </span>
        </li>
      ))}
    </ul>
  )
}

type SubAgentDetailPluginsProps = {
  locale: AppLocale
  tools: readonly string[]
}

function SubAgentDetailPlugins({ locale, tools }: SubAgentDetailPluginsProps) {
  if (tools.length === 0) return null
  const label = appMarketT(locale, 'pluginsUsed')
  return (
    <section className="manus-wf-pipeline-card__detail-block" aria-label={label}>
      <h4 className="manus-wf-pipeline-card__detail-section-title">{label}</h4>
      <div className="manus-wf-pipeline-card__detail-plugins">
        {tools.map((tool) => (
          <span key={tool} className="manus-wf-pipeline-card__detail-plugin-pill" title={tool}>
            <span className="manus-wf-pipeline-card__detail-plugin-icon" aria-hidden="true">
              <PlanBlueprintToolIcon label={tool} />
            </span>
            <span className="manus-wf-pipeline-card__detail-plugin-label">{tool}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

function SubAgentChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      className={`app-market-template-modal-subagent-chevron${expanded ? ' is-expanded' : ''}`}
    >
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AgentTemplateDetailModal({
  locale,
  item,
  onClose,
  onUseTemplate,
}: AgentTemplateDetailModalProps) {
  const reactId = useId()
  const titleId = `${reactId}-agent-template-modal-title`
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const successToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [usePhase, setUsePhase] = useState<UseTemplatePhase>('idle')
  const [successToastOpen, setSuccessToastOpen] = useState(false)
  const [expandedSubAgentId, setExpandedSubAgentId] = useState<string | null>(null)

  const name = locale === 'zh' ? item.nameZh : item.nameEn
  const description =
    locale === 'zh'
      ? (item.modalDescriptionZh ?? item.descriptionZh)
      : (item.modalDescriptionEn ?? item.descriptionEn)
  const pluginTools = resolvePluginTools(locale, item.pluginToolsZh, item.pluginToolsEn)
  const subAgents = item.subAgents ?? []

  const clearSuccessToastTimer = () => {
    if (successToastTimerRef.current) {
      clearTimeout(successToastTimerRef.current)
      successToastTimerRef.current = null
    }
  }

  const showSuccessToast = () => {
    setSuccessToastOpen(true)
    clearSuccessToastTimer()
    successToastTimerRef.current = setTimeout(() => {
      setSuccessToastOpen(false)
      successToastTimerRef.current = null
    }, USE_TEMPLATE_SUCCESS_TOAST_MS)
  }

  useEffect(() => {
    setExpandedSubAgentId(null)
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      clearSuccessToastTimer()
    }
  }, [item.id])

  const toggleSubAgentPrompt = (id: string) => {
    setExpandedSubAgentId((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && usePhase !== 'loading') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, usePhase])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleUseTemplate = () => {
    if (usePhase === 'loading') return
    setUsePhase('loading')
    loadingTimerRef.current = setTimeout(() => {
      onUseTemplate()
      setUsePhase('success')
      showSuccessToast()
      loadingTimerRef.current = null
    }, USE_TEMPLATE_LOADING_MS)
  }

  const useTemplateLabel =
    usePhase === 'loading'
      ? appMarketT(locale, 'useTemplateCreating')
      : usePhase === 'success'
        ? appMarketT(locale, 'useTemplateAgain')
        : appMarketT(locale, 'useTemplate')

  const useTemplateBtnClass =
    usePhase === 'success'
      ? 'app-market-template-modal-btn app-market-template-modal-btn--ghost'
      : 'app-market-template-modal-btn app-market-template-modal-btn--primary'

  const successToast =
    successToastOpen && usePhase === 'success'
      ? createPortal(
          <div className="app-market-template-success-toast" role="status" aria-live="polite">
            <span className="app-market-template-success-toast__icon" aria-hidden="true">
              ✓
            </span>
            <div className="app-market-template-success-toast__text">
              <strong className="app-market-template-success-toast__title">
                {appMarketT(locale, 'useTemplateSuccessTitle')}
              </strong>
              <span className="app-market-template-success-toast__sub">
                {appMarketT(locale, 'useTemplateSuccessSub')}
              </span>
            </div>
          </div>,
          document.body,
        )
      : null

  return createPortal(
    <>
      {successToast}
    <div className="app-market-template-modal-root" role="presentation">
      <button
        type="button"
        className="app-market-template-modal-backdrop"
        aria-label={appMarketT(locale, 'modalClose')}
        onClick={onClose}
        disabled={usePhase === 'loading'}
      />
      <div
        className="app-market-template-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-market-template-modal-header">
          <h2 id={titleId} className="app-market-template-modal-title">
            {name}
          </h2>
          <button
            type="button"
            className="app-market-template-modal-close"
            aria-label={appMarketT(locale, 'modalClose')}
            onClick={onClose}
            disabled={usePhase === 'loading'}
          >
            <ModalCloseIcon />
          </button>
        </div>
        <div className="app-market-template-modal-body">
          <div className="app-market-template-modal-content">
            <div className="app-market-template-modal-intro">
              <p className="app-market-template-modal-desc">{description}</p>
              <TemplatePluginToolsSection
                locale={locale}
                tools={pluginTools}
                labelId={`${reactId}-tools-label`}
                variant="with-desc"
              />
            </div>
            {subAgents.length > 0 ? (
              <section
                className="app-market-template-modal-subagents"
                aria-labelledby={`${reactId}-subagents-label`}
              >
                <div className="app-market-template-modal-subagents-head">
                  <h3 id={`${reactId}-subagents-label`} className="app-market-template-modal-subagents-label">
                    {appMarketT(locale, 'subAgents')}
                  </h3>
                  <span className="app-market-template-modal-subagents-count">
                    {appMarketSubAgentCountBadge(locale, subAgents.length)}
                  </span>
                </div>
                <ul className="app-market-template-modal-subagents-list">
                  {subAgents.map((agent) => {
                    const agentName = locale === 'zh' ? agent.nameZh : agent.nameEn
                    const agentPrompt = locale === 'zh' ? agent.promptZh : agent.promptEn
                    const agentPluginToolsRaw = resolvePluginTools(
                      locale,
                      agent.pluginToolsZh,
                      agent.pluginToolsEn,
                    )
                    const agentPluginTools =
                      agentPluginToolsRaw.length > 0 ? agentPluginToolsRaw : pluginTools
                    const isExpanded = expandedSubAgentId === agent.id
                    const promptPanelId = `${reactId}-subagent-prompt-${agent.id}`
                    return (
                      <li
                        key={agent.id}
                        className={`app-market-template-modal-subagent-item${isExpanded ? ' is-expanded' : ''}`}
                      >
                        <button
                          type="button"
                          className="app-market-template-modal-subagent-trigger"
                          aria-expanded={isExpanded}
                          aria-controls={promptPanelId}
                          onClick={() => toggleSubAgentPrompt(agent.id)}
                        >
                          <span className="app-market-template-modal-subagent-name">{agentName}</span>
                          <span className="app-market-template-modal-subagent-trigger-aside">
                            {agentPluginTools.length > 0 ? (
                              <SubAgentTriggerPluginTools tools={agentPluginTools} />
                            ) : null}
                            <SubAgentChevronIcon expanded={isExpanded} />
                          </span>
                        </button>
                        {isExpanded ? (
                          <div
                            id={promptPanelId}
                            className="app-market-template-modal-subagent-prompt"
                            role="region"
                            aria-label={agentName}
                          >
                            <p className="app-market-template-modal-subagent-prompt-text">{agentPrompt}</p>
                            <SubAgentDetailPlugins locale={locale} tools={agentPluginTools} />
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
        <div className="app-market-template-modal-footer">
          <button
            type="button"
            className={`${useTemplateBtnClass}${usePhase === 'loading' ? ' is-loading' : ''}`}
            disabled={usePhase === 'loading'}
            aria-busy={usePhase === 'loading'}
            onClick={handleUseTemplate}
          >
            {usePhase === 'loading' ? (
              <span className="app-market-template-modal-btn-spinner" aria-hidden="true" />
            ) : null}
            {useTemplateLabel}
          </button>
        </div>
      </div>
    </div>
    </>,
    document.body,
  )
}
