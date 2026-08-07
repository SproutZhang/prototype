import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { DepartmentFormSavePayload } from '../hooks/useDepartmentsSectionController'

type BatchCreateDepartmentsModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
  onCreate: (payloads: DepartmentFormSavePayload[]) => void
}

function parseBatchDepartmentFile(text: string): DepartmentFormSavePayload[] {
  const seen = new Set<string>()
  const results: DepartmentFormSavePayload[] = []

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/部门名称|department name/i.test(trimmed) && trimmed.includes(',')) continue

    const parts = trimmed.split(/[,，]/).map((part) => part.trim().replace(/^"|"$/g, ''))
    const nameZh = parts[0] ?? ''
    if (!nameZh || seen.has(nameZh)) continue
    seen.add(nameZh)

    const nameEn = parts[1] || nameZh
    const description = parts[2] || ''
    results.push({
      nameZh,
      nameEn,
      descriptionZh: description,
      descriptionEn: description,
      parentId: null,
    })
  }

  return results
}

function downloadDepartmentTemplate(locale: AppLocale) {
  const header =
    locale === 'zh'
      ? '部门名称（中文）,部门名称（英文）,描述'
      : 'Department name (ZH),Department name (EN),Description'
  const sample =
    locale === 'zh'
      ? '示例部门,Sample Department,示例描述'
      : 'Sample Department,Sample Department,Sample description'
  const content = `${header}\n${sample}\n`
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download =
    locale === 'zh' ? '组织部门导入模板.csv' : 'department-import-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function BatchCreateDepartmentsModal({
  locale,
  open,
  onClose,
  onCreate,
}: BatchCreateDepartmentsModalProps) {
  const titleId = useId()
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open])

  if (!open) return null

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    if (error) setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(acT(locale, 'departmentBatchCreateNoFile'))
      return
    }

    try {
      const text = await selectedFile.text()
      const payloads = parseBatchDepartmentFile(text)
      if (payloads.length === 0) {
        setError(acT(locale, 'departmentBatchCreateEmpty'))
        return
      }
      setError(null)
      onCreate(payloads)
    } catch {
      setError(acT(locale, 'departmentBatchCreateParseError'))
    }
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--department-batch-create"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ac-dept-batch-create-title">
          {acT(locale, 'departmentBatchCreateTitle')}
        </h2>

        <div className="ac-dept-batch-create-notice" role="note">
          <p>{acT(locale, 'departmentBatchCreateNotice1')}</p>
          <p>{acT(locale, 'departmentBatchCreateNotice2')}</p>
          <p>{acT(locale, 'departmentBatchCreateNotice3')}</p>
        </div>

        <div className="ac-dept-batch-create-panel">
          <div className="ac-dept-batch-create-step">
            <span className="ac-dept-batch-create-step-index" aria-hidden="true">1</span>
            <span className="ac-dept-batch-create-step-label">
              {acT(locale, 'departmentBatchCreateStep1')}
            </span>
            <button
              type="button"
              className="ac-dept-batch-create-action-link"
              onClick={() => downloadDepartmentTemplate(locale)}
            >
              {acT(locale, 'departmentBatchCreateDownload')}
            </button>
          </div>

          <div className="ac-dept-batch-create-step">
            <span className="ac-dept-batch-create-step-index" aria-hidden="true">2</span>
            <span className="ac-dept-batch-create-step-label">
              {acT(locale, 'departmentBatchCreateStep2')}
            </span>
            <button
              type="button"
              className="ac-dept-batch-create-action-link"
              onClick={handleSelectFile}
            >
              {acT(locale, 'departmentBatchCreateSelectFile')}
            </button>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              className="ac-dept-batch-create-file-input"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={handleFileChange}
            />
            <span className="ac-dept-batch-create-file-status">
              {selectedFile
                ? selectedFile.name
                : acT(locale, 'departmentBatchCreateNoFileUploaded')}
            </span>
          </div>
        </div>

        {error ? <p className="ac-form-error ac-dept-batch-create-error">{error}</p> : null}

        <p className="ac-dept-batch-create-legal">{acT(locale, 'departmentBatchCreateLegal')}</p>

        <div className="ac-dept-batch-create-footer">
          <button
            type="button"
            className="ac-dept-batch-create-upload-btn"
            disabled={!selectedFile}
            onClick={handleUpload}
          >
            {acT(locale, 'departmentBatchCreateUpload')}
          </button>
        </div>
      </div>
    </div>
  )
}
