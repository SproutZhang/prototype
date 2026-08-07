import { useCallback, useEffect, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { DocChunkPreviewParams } from '../data/docChunkPreviewSeed'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'
import { KnowledgeBaseDocChunkPreview } from './KnowledgeBaseDocChunkPreview'
import { KnowledgeBaseUploadLocalAdvancedSettings } from './KnowledgeBaseUploadLocalAdvancedSettings'

type KnowledgeBaseDocProcessDrawerProps = {
  locale: AppLocale
  doc: KnowledgeBaseDocument
  label: string
  onClose: () => void
}

const DEFAULT_PREVIEW_SETTINGS: DocChunkPreviewParams = {
  splitter: 'none',
  chunkSize: 1000,
  chunkOverlap: 200,
}

export function KnowledgeBaseDocProcessDrawer({
  locale,
  doc,
  label,
  onClose,
}: KnowledgeBaseDocProcessDrawerProps) {
  const [chunksVisible, setChunksVisible] = useState(false)
  const [chunksLoading, setChunksLoading] = useState(false)
  const [previewSettings, setPreviewSettings] = useState<DocChunkPreviewParams>(DEFAULT_PREVIEW_SETTINGS)

  const handlePreviewSettingsChange = useCallback((settings: DocChunkPreviewParams) => {
    setPreviewSettings(settings)
  }, [])

  useEffect(() => {
    setChunksVisible(false)
    setChunksLoading(false)
    setPreviewSettings(DEFAULT_PREVIEW_SETTINGS)
  }, [doc.id])

  useEffect(() => {
    if (!chunksLoading) return undefined
    const timer = window.setTimeout(() => {
      setChunksLoading(false)
      setChunksVisible(true)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [chunksLoading])

  const handlePreviewBlocks = () => {
    if (previewSettings.splitter === 'none') return
    setChunksLoading(true)
  }

  const handleConfirm = () => {
    setChunksLoading(true)
  }

  const canPreviewBlocks = previewSettings.splitter !== 'none'

  useEffect(() => {
    if (previewSettings.splitter === 'none') {
      setChunksVisible(false)
      setChunksLoading(false)
    }
  }, [previewSettings.splitter])

  return (
    <div className="kb-doc-process-page" aria-label={kbT(locale, 'docPreviewProcess')}>
      <button type="button" className="kb-back-btn" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {kbT(locale, 'docPreviewProcessBack')}
      </button>

      <div className="kb-doc-process-page-head">
        <h2 className="kb-doc-process-page-title">{kbT(locale, 'docPreviewProcess')}</h2>
        <p className="kb-doc-process-drawer-doc" title={label}>
          {label}
        </p>
      </div>

      <div className="kb-doc-process-page-shell">
        <section className="kb-doc-process-drawer-panel kb-doc-process-drawer-panel--process">
          <div className="kb-doc-process-page-body">
            <KnowledgeBaseUploadLocalAdvancedSettings
              locale={locale}
              key={doc.id}
              onPreviewSettingsChange={handlePreviewSettingsChange}
            />
          </div>
          <div className="kb-doc-process-page-footer">
            <button
              type="button"
              className="scenario-collect-drawer-btn scenario-collect-drawer-btn--primary kb-doc-process-drawer-confirm-btn"
              onClick={handleConfirm}
            >
              {kbT(locale, 'docPreviewProcessConfirm')}
            </button>
          </div>
        </section>
        <section
          className="kb-doc-process-drawer-panel kb-doc-process-drawer-panel--preview"
          aria-label={kbT(locale, 'docPreviewModule')}
        >
          <div className="kb-doc-process-drawer-side-body">
            {chunksVisible ? (
              <KnowledgeBaseDocChunkPreview locale={locale} previewSettings={previewSettings} />
            ) : chunksLoading ? (
              <div
                className="kb-doc-process-drawer-preview-loading"
                role="status"
                aria-live="polite"
                aria-label={kbT(locale, 'docPreviewBlockLoading')}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="#e4e4e7" strokeWidth="2.5" />
                  <g className="kb-doc-process-drawer-preview-loading-spinner">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="#111"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="14 42"
                    />
                  </g>
                </svg>
                <p className="kb-doc-process-drawer-preview-loading-text">
                  {kbT(locale, 'docPreviewBlockLoading')}
                </p>
              </div>
            ) : (
              <div className="kb-doc-process-drawer-preview">
                <div className="kb-doc-process-drawer-preview-grid" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="kb-doc-process-drawer-preview-block" />
                  ))}
                </div>
                <button
                  type="button"
                  className="kb-doc-process-drawer-preview-cta"
                  onClick={handlePreviewBlocks}
                  disabled={!canPreviewBlocks}
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path
                      d="M8 3.5C4.5 3.5 2 8 2 8s2.5 4.5 6 4.5 6-4.5 6-4.5-2.5-4.5-6-4.5Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="8" r="1.8" fill="currentColor" />
                  </svg>
                  {kbT(locale, 'docPreviewBlock')}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
