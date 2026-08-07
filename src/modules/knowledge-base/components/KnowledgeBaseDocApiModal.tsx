import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'

type KnowledgeBaseDocApiModalProps = {
  locale: AppLocale
  open: boolean
  knowledgeBaseId: string
  document: KnowledgeBaseDocument | null
  documentName: string
  onClose: () => void
}

function buildRequestBody(
  locale: AppLocale,
  knowledgeBaseId: string,
  documentId: string,
  documentName: string,
): string {
  const query =
    locale === 'zh'
      ? `请输入与「${documentName}」相关的检索问题`
      : `Enter a retrieval question related to "${documentName}"`

  return JSON.stringify(
    {
      knowledge_base_id: knowledgeBaseId,
      document_ids: [documentId],
      query,
      top_k: 4,
      score_threshold: 0.5,
    },
    null,
    2,
  )
}

function buildCurlExample(endpoint: string, requestBody: string): string {
  return [
    `curl --request POST \\`,
    `  --url '${endpoint}' \\`,
    `  --header 'Authorization: Bearer YOUR_API_KEY' \\`,
    `  --header 'Content-Type: application/json' \\`,
    `  --data '${requestBody.replace(/\n/g, '\n  ')}'`,
  ].join('\n')
}

function CopyButton({
  label,
  copiedLabel,
  value,
}: {
  label: string
  copiedLabel: string
  value: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" className="kb-doc-api-copy-btn" onClick={() => void handleCopy()}>
      {copied ? copiedLabel : label}
    </button>
  )
}

export function KnowledgeBaseDocApiModal({
  locale,
  open,
  knowledgeBaseId,
  document,
  documentName,
  onClose,
}: KnowledgeBaseDocApiModalProps) {
  const endpoint = useMemo(() => {
    if (!document) return ''
    return `https://api.studiox.ai/v1/knowledge-bases/${knowledgeBaseId}/retrieve`
  }, [document, knowledgeBaseId])

  const requestBody = useMemo(() => {
    if (!document) return ''
    return buildRequestBody(locale, knowledgeBaseId, document.id, documentName)
  }, [document, documentName, knowledgeBaseId, locale])

  const curlExample = useMemo(() => {
    if (!endpoint || !requestBody) return ''
    return buildCurlExample(endpoint, requestBody)
  }, [endpoint, requestBody])

  if (!open || !document) return null

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--doc-api"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-doc-api-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="kb-modal-header-row">
          <h2 id="kb-doc-api-title" className="kb-modal-title">
            {kbT(locale, 'docViewApi')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <p className="kb-modal-hint">{kbT(locale, 'docApiHint')}</p>

        <div className="kb-doc-api-section">
          <div className="kb-doc-api-section-head">
            <span className="kb-doc-api-section-label">{kbT(locale, 'docApiEndpoint')}</span>
            <span className="kb-doc-api-method">POST</span>
          </div>
          <div className="kb-doc-api-copy-field">
            <code className="kb-doc-api-code-inline">{endpoint}</code>
            <CopyButton
              label={kbT(locale, 'docApiCopy')}
              copiedLabel={kbT(locale, 'docApiCopied')}
              value={endpoint}
            />
          </div>
        </div>

        <div className="kb-doc-api-section">
          <span className="kb-doc-api-section-label">{kbT(locale, 'docApiAuth')}</span>
          <div className="kb-doc-api-copy-field">
            <code className="kb-doc-api-code-inline">Authorization: Bearer YOUR_API_KEY</code>
            <CopyButton
              label={kbT(locale, 'docApiCopy')}
              copiedLabel={kbT(locale, 'docApiCopied')}
              value="Authorization: Bearer YOUR_API_KEY"
            />
          </div>
        </div>

        <div className="kb-doc-api-section">
          <div className="kb-doc-api-section-head">
            <span className="kb-doc-api-section-label">{kbT(locale, 'docApiRequestExample')}</span>
            <CopyButton
              label={kbT(locale, 'docApiCopy')}
              copiedLabel={kbT(locale, 'docApiCopied')}
              value={requestBody}
            />
          </div>
          <pre className="kb-doc-api-code-block">{requestBody}</pre>
        </div>

        <div className="kb-doc-api-section">
          <div className="kb-doc-api-section-head">
            <span className="kb-doc-api-section-label">{kbT(locale, 'docApiCurl')}</span>
            <CopyButton
              label={kbT(locale, 'docApiCopy')}
              copiedLabel={kbT(locale, 'docApiCopied')}
              value={curlExample}
            />
          </div>
          <pre className="kb-doc-api-code-block">{curlExample}</pre>
        </div>

        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
