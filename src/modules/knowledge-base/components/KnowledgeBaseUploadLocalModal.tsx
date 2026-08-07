import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { kbDocStatusLabel, kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'
import { createDocumentFromFile, LOCAL_UPLOAD_ACCEPT } from '../utils/localDocumentUpload'
import { KnowledgeBaseDocStatusIcon } from './KnowledgeBaseDocStatusIcon'
import { KnowledgeBaseUploadLocalAdvancedSettings } from './KnowledgeBaseUploadLocalAdvancedSettings'

type KnowledgeBaseUploadLocalModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onConfirm: (documents: KnowledgeBaseDocument[]) => void
  showAdvancedSettings?: boolean
}

export function KnowledgeBaseUploadLocalModal({
  locale,
  open,
  onClose,
  onConfirm,
  showAdvancedSettings = false,
}: KnowledgeBaseUploadLocalModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const indexTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([])
  const [unsupportedNames, setUnsupportedNames] = useState<string[]>([])
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const clearIndexTimers = useCallback(() => {
    for (const timer of indexTimersRef.current.values()) {
      clearTimeout(timer)
    }
    indexTimersRef.current.clear()
  }, [])

  const scheduleIndexComplete = useCallback((docId: string) => {
    const existing = indexTimersRef.current.get(docId)
    if (existing) {
      clearTimeout(existing)
      indexTimersRef.current.delete(docId)
    }

    const timer = setTimeout(() => {
      indexTimersRef.current.delete(docId)
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, status: 'ready' as const } : doc)),
      )
    }, 2500)
    indexTimersRef.current.set(docId, timer)
  }, [])

  useEffect(() => {
    if (!open) {
      clearIndexTimers()
      setDocuments([])
      setUnsupportedNames([])
      setAdvancedOpen(false)
      return
    }
    const timer = window.setTimeout(() => inputRef.current?.click(), 0)
    return () => window.clearTimeout(timer)
  }, [clearIndexTimers, open])

  useEffect(() => () => clearIndexTimers(), [clearIndexTimers])

  if (!open) return null

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files] : []
    event.target.value = ''

    if (files.length === 0) {
      if (documents.length === 0) onClose()
      return
    }

    const nextDocs: KnowledgeBaseDocument[] = []
    const rejected: string[] = []

    for (const file of files) {
      const doc = createDocumentFromFile(file)
      if (doc) {
        nextDocs.push(doc)
      } else {
        rejected.push(file.name)
      }
    }

    setDocuments((prev) => [...prev, ...nextDocs])
    for (const doc of nextDocs) {
      scheduleIndexComplete(doc.id)
    }
    if (rejected.length > 0) {
      setUnsupportedNames((prev) => [...prev, ...rejected])
    }
  }

  const previewStatusLabel = (status: KnowledgeBaseDocument['status']) => {
    if (status === 'ready') return kbT(locale, 'statusIndexSuccess')
    return kbDocStatusLabel(locale, status)
  }

  const handleConfirm = () => {
    if (documents.length === 0) return
    onConfirm(documents)
    setDocuments([])
    setUnsupportedNames([])
  }

  const showPreview = documents.length > 0

  return (
    <div className="kb-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="kb-modal kb-modal--source kb-modal--upload-local"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-upload-local-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kb-upload-local-scroll">
        <div className="kb-modal-header-row">
          <h2 id="kb-upload-local-title" className="kb-modal-title">
            {kbT(locale, showPreview ? 'uploadLocalPreviewTitle' : 'uploadLocalTitle')}
          </h2>
          <button type="button" className="kb-modal-close" onClick={onClose} aria-label={kbT(locale, 'createCancel')}>
            ×
          </button>
        </div>

        <p className="kb-modal-hint">
          {kbT(locale, showPreview ? 'uploadLocalPreviewHint' : 'uploadLocalHint')}
        </p>

        <input
          ref={inputRef}
          type="file"
          className="kb-upload-local-input"
          accept={LOCAL_UPLOAD_ACCEPT}
          multiple
          onChange={handleFileChange}
        />

        {!showPreview ? (
          <button type="button" className="kb-upload-local-dropzone" onClick={() => inputRef.current?.click()}>
            <span className="kb-upload-local-dropzone-title">{kbT(locale, 'uploadLocalPickBtn')}</span>
            <span className="kb-upload-local-dropzone-desc">{kbT(locale, 'addSourceLocalDesc')}</span>
          </button>
        ) : (
          <>
            <div className="kb-upload-local-preview">
              <div className="kb-upload-local-table-head" role="row">
                <span>{kbT(locale, 'docListColName')}</span>
                <span>{kbT(locale, 'docListColSize')}</span>
                <span>{kbT(locale, 'docListColUpdated')}</span>
                <span>{kbT(locale, 'docListColStatus')}</span>
              </div>
              <ul className="kb-upload-local-table-body" role="list">
                {documents.map((doc) => (
                  <li key={doc.id} className="kb-upload-local-row">
                    <span className="kb-upload-local-row-name" title={doc.nameZh}>
                      {locale === 'zh' ? doc.nameZh : doc.nameEn}
                    </span>
                    <span>{doc.sizeLabel}</span>
                    <span>{doc.updatedAt}</span>
                    <span className="kb-upload-local-row-status">
                      <KnowledgeBaseDocStatusIcon locale={locale} status={doc.status} />
                      {doc.status !== 'ready' ? previewStatusLabel(doc.status) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {showAdvancedSettings ? (
            <button
              type="button"
              className={`kb-upload-advanced-toggle${advancedOpen ? ' is-expanded' : ''}`}
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((value) => !value)}
            >
              <span>{kbT(locale, 'uploadLocalAdvanced')}</span>
              <span className="kb-upload-advanced-toggle-chevron" aria-hidden="true">
                ›
              </span>
            </button>
            ) : null}

            {showAdvancedSettings && advancedOpen ? (
              <KnowledgeBaseUploadLocalAdvancedSettings locale={locale} />
            ) : null}
          </>
        )}

        {unsupportedNames.length > 0 ? (
          <p className="kb-modal-error">
            {kbT(locale, 'uploadLocalUnsupported').replace('{name}', unsupportedNames.join(', '))}
          </p>
        ) : null}
        </div>

        <div className="kb-modal-actions">
          <button type="button" className="kb-btn kb-btn--secondary" onClick={onClose}>
            {kbT(locale, 'createCancel')}
          </button>
          {showPreview ? (
            <>
              <button type="button" className="kb-btn kb-btn--secondary" onClick={() => inputRef.current?.click()}>
                {kbT(locale, 'uploadLocalAddMore')}
              </button>
              <button type="button" className="agents-btn agents-btn-primary" onClick={handleConfirm}>
                {kbT(locale, 'uploadLocalConfirm')}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
