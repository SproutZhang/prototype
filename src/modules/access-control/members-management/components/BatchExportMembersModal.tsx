import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

type BatchExportMembersModalProps = {
  locale: AppLocale
  open: boolean
  onClose: () => void
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M8 2.5v7M5 7.5 8 10.5l3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 12.5h9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ExcelIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false">
      <rect x="8" y="6" width="24" height="28" rx="3" fill="#e8f7ee" stroke="#52c41a" strokeWidth="1.5" />
      <path d="M14 14h12M14 20h12M14 26h8" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12.5 17.5 14 20l2.5-3.5"
        fill="none"
        stroke="#52c41a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3.2l2 1.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function downloadMemberExport(locale: AppLocale, inactiveOnly: boolean) {
  const header =
    locale === 'zh'
      ? '姓名,手机,邮箱,部门,职位,工号,状态'
      : 'Name,Phone,Email,Department,Position,Employee ID,Status'
  const rows =
    locale === 'zh'
      ? inactiveOnly
        ? ['李四,13900000001,lisi@example.com,研发部,工程师,E002,未激活']
        : [
            '张三,13800000000,zhangsan@example.com,产品部,产品经理,E001,已激活',
            '李四,13900000001,lisi@example.com,研发部,工程师,E002,未激活',
          ]
      : inactiveOnly
        ? ['Bob,13900000001,bob@example.com,R&D,Engineer,E002,Inactive']
        : [
            'Alice,13800000000,alice@example.com,Product,PM,E001,Active',
            'Bob,13900000001,bob@example.com,R&D,Engineer,E002,Inactive',
          ]
  const content = `${header}\n${rows.join('\n')}\n`
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = locale === 'zh' ? '员工信息导出.csv' : 'employee-export.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function BatchExportMembersModal({ locale, open, onClose }: BatchExportMembersModalProps) {
  const titleId = useId()
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setInactiveOnly(false)
    setSelectedFile(null)
    setIsDragOver(false)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open])

  if (!open) return null

  const acceptFile = (file: File | null) => {
    if (!file) return
    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx')) return
    setSelectedFile(file)
    if (error) setError(null)
  }

  const handleImport = () => {
    if (!selectedFile) {
      setError(acT(locale, 'memberBatchImportNoFile'))
      return
    }
    setError(null)
    onClose()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0] ?? null)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    acceptFile(event.dataTransfer.files?.[0] ?? null)
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--member-batch-import"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ac-member-batch-import-title">
          {acT(locale, 'memberBatchExportTitle')}
        </h2>

        <section className="ac-member-batch-import-section">
          <h3 className="ac-member-batch-import-step-title">
            {acT(locale, 'memberBatchExportStep1')}
          </h3>
          <label className="ac-member-batch-import-checkbox ac-member-batch-export-checkbox">
            <input
              type="checkbox"
              checked={inactiveOnly}
              onChange={(event) => setInactiveOnly(event.target.checked)}
            />
            <span>{acT(locale, 'memberBatchExportInactiveOnly')}</span>
          </label>
          <button
            type="button"
            className="ac-member-batch-import-download-btn"
            onClick={() => downloadMemberExport(locale, inactiveOnly)}
          >
            <DownloadIcon />
            <span>{acT(locale, 'memberBatchExportAction')}</span>
          </button>
        </section>

        <section className="ac-member-batch-import-section">
          <div className="ac-member-batch-import-step-header">
            <h3 className="ac-member-batch-import-step-title">
              {acT(locale, 'memberBatchExportStep2')}
            </h3>
            <button type="button" className="ac-member-batch-import-records-link">
              <HistoryIcon />
              <span>{acT(locale, 'memberBatchImportUploadRecords')}</span>
            </button>
          </div>

          <div
            className={`ac-member-batch-import-upload-zone${isDragOver ? ' is-drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ExcelIcon />
            <p className="ac-member-batch-import-upload-hint">{acT(locale, 'memberBatchExportUploadHint')}</p>
            <button
              type="button"
              className="ac-member-batch-import-select-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {acT(locale, 'memberBatchImportSelectFile')}
            </button>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              className="ac-member-batch-import-file-input"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <p className="ac-member-batch-import-file-name">{selectedFile.name}</p>
            ) : null}
          </div>

          <ul className="ac-member-batch-import-notes">
            <li>{acT(locale, 'memberBatchImportNote1')}</li>
            <li>{acT(locale, 'memberBatchImportNote2')}</li>
            <li>
              {acT(locale, 'memberBatchImportNote3Prefix')}
              <button type="button" className="ac-member-batch-import-text-link">
                {acT(locale, 'memberBatchExportSmsTemplate')}
              </button>
            </li>
          </ul>
        </section>

        {error ? <p className="ac-form-error ac-member-batch-import-error">{error}</p> : null}

        <div className="ac-modal-actions ac-member-batch-import-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            disabled={!selectedFile}
            onClick={handleImport}
          >
            {acT(locale, 'memberBatchImportConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
