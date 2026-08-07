import type { AppLocale } from '../../../i18n/homeStrings'
import { DOC_CHUNK_VIEW_DEFAULT_SETTINGS } from '../data/docChunkPreviewSeed'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'
import { KnowledgeBaseDocChunkPreview } from './KnowledgeBaseDocChunkPreview'

type KnowledgeBaseDocChunksDrawerProps = {
  locale: AppLocale
  doc: KnowledgeBaseDocument
  label: string
  onClose: () => void
}

export function KnowledgeBaseDocChunksDrawer({
  locale,
  label,
  onClose,
}: KnowledgeBaseDocChunksDrawerProps) {
  return (
    <div className="kb-doc-chunks-page" aria-label={kbT(locale, 'docViewEditChunks')}>
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

      <div className="kb-doc-chunks-page-head">
        <h2 className="kb-doc-chunks-page-title">{kbT(locale, 'docViewEditChunks')}</h2>
        <p className="kb-doc-process-drawer-doc" title={label}>
          {label}
        </p>
      </div>

      <div className="kb-doc-chunks-page-body">
        <KnowledgeBaseDocChunkPreview
          locale={locale}
          previewSettings={DOC_CHUNK_VIEW_DEFAULT_SETTINGS}
        />
      </div>
    </div>
  )
}
