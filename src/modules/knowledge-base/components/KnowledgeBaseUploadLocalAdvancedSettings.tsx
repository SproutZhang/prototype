import { useEffect, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { DocChunkPreviewParams } from '../data/docChunkPreviewSeed'
import { kbT } from '../i18n/strings'

type UploadUsage = 'onePerPage' | 'onePerFile'

export type UploadSplitter = DocChunkPreviewParams['splitter']
const SPLITTER_OPTIONS: { value: UploadSplitter; labelKey: 'uploadAdvancedSplitterNone' | 'uploadAdvancedSplitterCharacter' | 'uploadAdvancedSplitterCode' | 'uploadAdvancedSplitterHtmlToMarkdown' | 'uploadAdvancedSplitterMarkdown' | 'uploadAdvancedSplitterRecursiveCharacter' | 'uploadAdvancedSplitterToken' }[] = [
  { value: 'none', labelKey: 'uploadAdvancedSplitterNone' },
  { value: 'characterTextSplitter', labelKey: 'uploadAdvancedSplitterCharacter' },
  { value: 'codeTextSplitter', labelKey: 'uploadAdvancedSplitterCode' },
  { value: 'htmlToMarkdownTextSplitter', labelKey: 'uploadAdvancedSplitterHtmlToMarkdown' },
  { value: 'markdownTextSplitter', labelKey: 'uploadAdvancedSplitterMarkdown' },
  { value: 'recursiveCharacterTextSplitter', labelKey: 'uploadAdvancedSplitterRecursiveCharacter' },
  { value: 'tokenTextSplitter', labelKey: 'uploadAdvancedSplitterToken' },
]

type KnowledgeBaseUploadLocalAdvancedSettingsProps = {
  locale: AppLocale
  onPreviewSettingsChange?: (settings: DocChunkPreviewParams) => void
}

function FieldInfoIcon({ label }: { label: string }) {
  return (
    <span className="kb-upload-advanced-info" title={label} aria-label={label}>
      i
    </span>
  )
}

function MetadataBraceIcon() {
  return (
    <span className="kb-upload-metadata-brace" aria-hidden="true">
      {'{ }'}
    </span>
  )
}

export function KnowledgeBaseUploadLocalAdvancedSettings({
  locale,
  onPreviewSettingsChange,
}: KnowledgeBaseUploadLocalAdvancedSettingsProps) {
  const [usage, setUsage] = useState<UploadUsage>('onePerPage')
  const [useLegacy, setUseLegacy] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [omitMetadataKeys, setOmitMetadataKeys] = useState('')
  const [splitter, setSplitter] = useState<UploadSplitter>('none')
  const [language, setLanguage] = useState('')
  const [chunkSize, setChunkSize] = useState('1000')
  const [chunkOverlap, setChunkOverlap] = useState('200')

  useEffect(() => {
    onPreviewSettingsChange?.({
      splitter,
      chunkSize: Math.max(1, Number.parseInt(chunkSize, 10) || 1000),
      chunkOverlap: Math.max(0, Number.parseInt(chunkOverlap, 10) || 0),
    })
  }, [splitter, chunkSize, chunkOverlap, onPreviewSettingsChange])

  return (
    <div className="kb-upload-advanced-panel">
      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'uploadAdvancedUsage')}
          <span className="kb-field-required" aria-hidden="true">
            *
          </span>
        </span>
        <select value={usage} onChange={(e) => setUsage(e.target.value as UploadUsage)}>
          <option value="onePerPage">{kbT(locale, 'uploadAdvancedUsageOnePerPage')}</option>
          <option value="onePerFile">{kbT(locale, 'uploadAdvancedUsageOnePerFile')}</option>
        </select>
      </label>

      <div className="kb-upload-advanced-row">
        <span className="kb-upload-advanced-row-label">{kbT(locale, 'uploadAdvancedUseLegacy')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={useLegacy}
          className={`kb-configure-connector-switch${useLegacy ? ' is-on' : ''}`}
          onClick={() => setUseLegacy((value) => !value)}
        >
          <span className="kb-configure-connector-switch-thumb" />
        </button>
      </div>

      <div className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'uploadAdvancedAttachMetadata')}
          <FieldInfoIcon label={kbT(locale, 'uploadAdvancedAttachMetadataHint')} />
        </span>
        <button
          type="button"
          className="kb-upload-metadata-toggle"
          aria-expanded={metadataOpen}
          onClick={() => setMetadataOpen((value) => !value)}
        >
          <span className={`kb-upload-metadata-chevron${metadataOpen ? ' is-expanded' : ''}`} aria-hidden="true">
            ›
          </span>
          <MetadataBraceIcon />
          <span>{kbT(locale, 'uploadAdvancedMetadataCount').replace('{count}', '0')}</span>
        </button>
        {metadataOpen ? (
          <p className="kb-upload-metadata-empty">{kbT(locale, 'uploadAdvancedMetadataEmpty')}</p>
        ) : null}
      </div>

      <label className="kb-field">
        <span className="kb-field-label">
          {kbT(locale, 'uploadAdvancedOmitMetadataKeys')}
          <FieldInfoIcon label={kbT(locale, 'uploadAdvancedOmitMetadataKeysHint')} />
        </span>
        <textarea
          rows={3}
          value={omitMetadataKeys}
          placeholder={kbT(locale, 'uploadAdvancedOmitMetadataKeysPlaceholder')}
          onChange={(e) => setOmitMetadataKeys(e.target.value)}
        />
      </label>

      <div className="kb-upload-advanced-section">
        <h3 className="kb-upload-advanced-section-title">
          {kbT(locale, 'uploadAdvancedCodeSplitterTitle')}
        </h3>

        <label className="kb-field">
          <span className="kb-field-label">{kbT(locale, 'uploadAdvancedSplitter')}</span>
          <select
            value={splitter}
            onChange={(e) => setSplitter(e.target.value as UploadSplitter)}
          >
            {SPLITTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {kbT(locale, option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        {splitter !== 'none' ? (
          <>
            <label className="kb-field">
              <span className="kb-field-label">
                {kbT(locale, 'uploadAdvancedLanguage')}
                <span className="kb-field-required" aria-hidden="true">
                  *
                </span>
              </span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} required>
                <option value="">{kbT(locale, 'uploadAdvancedLanguagePlaceholder')}</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="csharp">C#</option>
              </select>
            </label>

            <label className="kb-field">
              <span className="kb-field-label">
                {kbT(locale, 'uploadAdvancedChunkSize')}
                <FieldInfoIcon label={kbT(locale, 'uploadAdvancedChunkSizeHint')} />
              </span>
              <input
                type="number"
                min={1}
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
              />
            </label>

            <label className="kb-field">
              <span className="kb-field-label">
                {kbT(locale, 'uploadAdvancedChunkOverlap')}
                <FieldInfoIcon label={kbT(locale, 'uploadAdvancedChunkOverlapHint')} />
              </span>
              <input
                type="number"
                min={0}
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(e.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
  )
}
