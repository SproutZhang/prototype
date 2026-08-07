import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import { SectionIterationBumpBadge } from './SectionIterationBumpBadge'
import { tcsT, defaultSectionMigrationNote, versionBumpDescription, versionBumpLabel } from '../i18n/strings'
import type { SectionType, VersionBump } from '../types/sectionIteration'
import type { SectionIterationPublishPayload } from '../utils/appendSectionIterationRecord'
import { validateSectionIterationPublish } from '../utils/appendSectionIterationRecord'
import { formatSectionVersionLabel } from '../utils/sectionIterationSync'
import { getSectionIterationRecords } from '../utils/sectionIterationSync'
import { showSectionVersionPublishSuccessToast } from '../utils/sectionVersionPublishToast'

type SectionIterationVersionModalProps = {
  open: boolean
  locale: AppLocale
  sectionType: SectionType
  sectionId: string
  sectionName: string
  onClose: () => void
  onConfirm: (payload: SectionIterationPublishPayload) => void
}

const BUMP_OPTIONS: VersionBump[] = ['patch', 'minor', 'major']

function computeNextVersionLabel(
  current: { version: { major: number; minor: number; patch: number } } | undefined,
  bump: VersionBump,
): string {
  if (!current) return 'v1.0.0'
  const version = current.version
  if (bump === 'major') return formatSectionVersionLabel({ major: version.major + 1, minor: 0, patch: 0 })
  if (bump === 'minor') return formatSectionVersionLabel({ major: version.major, minor: version.minor + 1, patch: 0 })
  return formatSectionVersionLabel({ major: version.major, minor: version.minor, patch: version.patch + 1 })
}

export function SectionIterationVersionModal({
  open,
  locale,
  sectionType,
  sectionId,
  sectionName,
  onClose,
  onConfirm,
}: SectionIterationVersionModalProps) {
  const titleId = useId()
  const [bump, setBump] = useState<VersionBump>('minor')
  const [summaryZh, setSummaryZh] = useState('')
  const [migrationNoteZh, setMigrationNoteZh] = useState('')
  const [migrationNoteIsSuggested, setMigrationNoteIsSuggested] = useState(false)

  const existingRecords = getSectionIterationRecords(sectionType, sectionId)
  const current = existingRecords.find((record) => record.isCurrent) ?? existingRecords[0]
  const currentVersionLabel = current?.versionLabel ?? 'v1.0.0'
  const previewVersion = computeNextVersionLabel(current, bump)

  useEffect(() => {
    if (!open) return
    setBump('minor')
    setSummaryZh('')
    setMigrationNoteZh('')
    setMigrationNoteIsSuggested(false)
  }, [open, sectionId, sectionType])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const payload: SectionIterationPublishPayload = {
    bump,
    summaryZh,
    summaryEn: '',
    migrationNoteZh: bump === 'major' ? migrationNoteZh : undefined,
    migrationNoteEn: undefined,
  }
  const canSubmit = validateSectionIterationPublish(payload) && summaryZh.trim()

  const handleConfirm = () => {
    if (!canSubmit) return
    onConfirm(payload)
    showSectionVersionPublishSuccessToast(locale)
  }

  return createPortal(
    <div className="ac-modal-overlay tcs-section-version-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal tcs-section-version-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tcs-section-version-modal-header">
          <h2 id={titleId} className="ac-modal-title">
            {tcsT(locale, 'sectionVersionModalTitle')}
          </h2>
          <button type="button" className="ac-modal-close" aria-label={tcsT(locale, 'formCancel')} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="tcs-section-version-modal-hint">
          {tcsT(locale, 'sectionVersionModalHint').replace('{name}', sectionName)}
        </p>

        <div className="tcs-section-version-modal-flow" aria-label={tcsT(locale, 'sectionVersionBumpLabel')}>
          <span className="tcs-section-version-modal-current">
            {tcsT(locale, 'sectionVersionCurrentLabel').replace('{version}', currentVersionLabel)}
          </span>
          <span className="tcs-section-version-modal-flow-chevron" aria-hidden="true">
            ›
          </span>
          <span className="tcs-section-version-modal-next">{previewVersion}</span>
          <SectionIterationBumpBadge locale={locale} bump={bump} requiresMigration={bump === 'major'} />
        </div>

        <div className="tcs-section-version-modal-bump-panel">
          <div className="tcs-section-version-modal-bump-label">{tcsT(locale, 'sectionVersionBumpLabel')}</div>
          <div className="tcs-section-version-modal-bump-options" role="radiogroup" aria-label={tcsT(locale, 'sectionVersionBumpLabel')}>
            {BUMP_OPTIONS.map((option) => {
              const selected = bump === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`tcs-section-version-bump-card${selected ? ' is-selected' : ''}`}
                  onClick={() => {
                    setBump(option)
                    if (option === 'major') {
                      setMigrationNoteZh(
                        defaultSectionMigrationNote(
                          locale,
                          sectionType,
                          sectionName,
                          currentVersionLabel,
                          computeNextVersionLabel(current, 'major'),
                        ),
                      )
                      setMigrationNoteIsSuggested(true)
                    } else {
                      setMigrationNoteZh('')
                      setMigrationNoteIsSuggested(false)
                    }
                  }}
                >
                  <span className="tcs-section-version-bump-card-radio" aria-hidden="true" />
                  <span className="tcs-section-version-bump-card-body">
                    <strong>{versionBumpLabel(locale, option)}</strong>
                    <span>{versionBumpDescription(locale, option)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="tcs-section-version-modal-fields">
          <label className="tcs-section-version-field">
            <span>{tcsT(locale, 'sectionVersionSummaryZh')}</span>
            <textarea
              rows={3}
              value={summaryZh}
              onChange={(event) => setSummaryZh(event.target.value)}
              placeholder={tcsT(locale, 'sectionVersionSummaryZhPlaceholder')}
            />
          </label>

          {bump === 'major' ? (
            <label className="tcs-section-version-field">
              <span>{tcsT(locale, 'sectionVersionMigrationZh')}</span>
              <textarea
                rows={3}
                className={migrationNoteIsSuggested ? 'is-suggested-value' : undefined}
                value={migrationNoteZh}
                onChange={(event) => {
                  setMigrationNoteZh(event.target.value)
                  setMigrationNoteIsSuggested(false)
                }}
                onFocus={(event) => {
                  if (migrationNoteIsSuggested) event.target.select()
                }}
                placeholder={tcsT(locale, 'sectionVersionMigrationRequired')}
              />
            </label>
          ) : null}
        </div>

        <div className="ac-modal-actions tcs-section-version-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {tcsT(locale, 'formCancel')}
          </button>
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            disabled={!canSubmit}
            onClick={handleConfirm}
          >
            {tcsT(locale, 'sectionVersionConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
