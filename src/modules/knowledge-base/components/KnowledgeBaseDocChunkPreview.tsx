import type { AppLocale } from '../../../i18n/homeStrings'
import {
  buildDocChunkPreview,
  getDocChunkPreviewTotalChars,
  type DocChunkPreviewParams,
} from '../data/docChunkPreviewSeed'
import { kbT } from '../i18n/strings'

type KnowledgeBaseDocChunkPreviewProps = {
  locale: AppLocale
  previewSettings: DocChunkPreviewParams
}

export function KnowledgeBaseDocChunkPreview({
  locale,
  previewSettings,
}: KnowledgeBaseDocChunkPreviewProps) {
  const chunks = buildDocChunkPreview(previewSettings)
  const total = chunks.length
  const totalChars = getDocChunkPreviewTotalChars(chunks)
  const rangeLabel = kbT(locale, 'docChunkPreviewRange')
    .replace('{from}', total > 0 ? '1' : '0')
    .replace('{to}', String(total))
    .replace('{total}', String(total))
  const charsLabel = `${totalChars.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')} ${kbT(locale, 'docChunkPreviewChars')}`

  return (
    <div className="kb-doc-chunk-preview">
      <div className="kb-doc-chunk-preview-meta">
        <span className="kb-doc-chunk-preview-meta-range">{rangeLabel}</span>
        <span className="kb-doc-chunk-preview-meta-chars">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 10.5 13 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {charsLabel}
        </span>
      </div>
      <div className="kb-doc-chunk-preview-columns">
        {chunks.map((chunk) => (
          <article key={chunk.index} className="kb-doc-chunk-preview-card">
            <header className="kb-doc-chunk-preview-card-head">
              #{chunk.index} · {kbT(locale, 'docChunkPreviewWordCount')}: {chunk.charCount}
            </header>
            <pre className="kb-doc-chunk-preview-card-body">{chunk.content}</pre>
          </article>
        ))}
      </div>
    </div>
  )
}
