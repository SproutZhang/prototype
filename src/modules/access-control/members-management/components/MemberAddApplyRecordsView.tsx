import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { accountTypeLabel } from '../../utils/memberDirectoryDisplay'
import { memberAvatarColors, memberAvatarInitials } from '../../utils/memberAvatar'
import { navigateAccessControlSection } from '../../utils/routing'
import { memberAddRecordsSeed, type MemberAddRecord, type MemberAddRecordStatus } from '../data/memberAddRecordsSeed'
import {
  memberApplicationRecordsSeed,
  type MemberApplicationRecord,
  type MemberApplicationStatus,
} from '../data/memberApplicationRecordsSeed'

type MemberRecordsTab = 'add' | 'apply'

type MemberAddApplyRecordsViewProps = {
  locale: AppLocale
}

function ColumnFilterIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M2.5 3.5h11L9.5 9v3.5l-2.5-1.5V9L2.5 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RecordsEmptyIcon() {
  return (
    <svg viewBox="0 0 120 88" width="120" height="88" aria-hidden="true" focusable="false">
      <path d="M18 28h84v48H18V28Z" fill="#f5f8ff" stroke="#b7d4ff" strokeWidth="2" />
      <path
        d="M30 28 60 12l30 16"
        fill="none"
        stroke="#b7d4ff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M42 48h36M42 58h24" stroke="#d4e4ff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function RecordsPersonCell({ name, personId }: { name: string; personId: string }) {
  const avatar = memberAvatarColors(personId)
  const initials = memberAvatarInitials(name)

  return (
    <span className="ac-member-records-person" title={name}>
      <span
        className="ac-member-records-avatar"
        style={{ background: avatar.background, color: avatar.color }}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className="ac-member-records-person-name">{name}</span>
    </span>
  )
}

function filterApplicationRecords(
  records: MemberApplicationRecord[],
  query: string,
): MemberApplicationRecord[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return records

  return records.filter((record) => {
    const haystack = [
      record.applicantName,
      record.phone,
      record.departmentName,
      record.sharerName,
      record.customQuestionAnswer,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

function filterAddRecords(records: MemberAddRecord[], query: string): MemberAddRecord[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return records

  return records.filter((record) => {
    const haystack = [
      record.inviteeName,
      record.phone,
      record.departmentName,
      record.inviterName,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

function applicationStatusLabel(locale: AppLocale, status: MemberApplicationStatus): string {
  if (status === 'approved') return acT(locale, 'memberRecordsStatusApproved')
  if (status === 'pending') return acT(locale, 'memberRecordsStatusPending')
  return acT(locale, 'memberRecordsStatusRejected')
}

function addRecordStatusLabel(locale: AppLocale, status: MemberAddRecordStatus): string {
  if (status === 'pending') return acT(locale, 'memberRecordsAddStatusPending')
  if (status === 'accepted') return acT(locale, 'memberRecordsAddStatusAccepted')
  if (status === 'expired') return acT(locale, 'memberRecordsAddStatusExpired')
  return acT(locale, 'memberRecordsAddStatusRevoked')
}

export function MemberAddApplyRecordsView({ locale }: MemberAddApplyRecordsViewProps) {
  const [activeTab, setActiveTab] = useState<MemberRecordsTab>('add')
  const [searchQuery, setSearchQuery] = useState('')

  const hintKey = activeTab === 'add' ? 'memberRecordsAddHint' : 'memberRecordsApplyHint'
  const searchPlaceholderKey =
    activeTab === 'apply' ? 'memberRecordsApplySearchPlaceholder' : 'memberRecordsSearchPlaceholder'

  const filteredApplyRecords = useMemo(
    () => filterApplicationRecords(memberApplicationRecordsSeed, searchQuery),
    [searchQuery],
  )

  const filteredAddRecords = useMemo(
    () => filterAddRecords(memberAddRecordsSeed, searchQuery),
    [searchQuery],
  )

  return (
    <section className="ac-section ac-member-records-section">
      <div className="ac-member-records-panel">
        <button
          type="button"
          className="agents-back-btn ac-member-records-back-btn"
          onClick={() => navigateAccessControlSection('members')}
        >
          ← {acT(locale, 'memberRecordsBack')}
        </button>

        <div className="ac-member-records-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`ac-member-records-tab${activeTab === 'add' ? ' is-active' : ''}`}
            aria-selected={activeTab === 'add'}
            onClick={() => setActiveTab('add')}
          >
            {acT(locale, 'memberRecordsAddTab')}
          </button>
          <button
            type="button"
            role="tab"
            className={`ac-member-records-tab${activeTab === 'apply' ? ' is-active' : ''}`}
            aria-selected={activeTab === 'apply'}
            onClick={() => setActiveTab('apply')}
          >
            {acT(locale, 'memberRecordsApplyTab')}
          </button>
        </div>

        <p className="ac-member-records-hint">{acT(locale, hintKey)}</p>

        <div className="ac-member-records-search">
          <span className="ac-member-records-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.8 16.8 21 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            className="ac-member-records-search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={acT(locale, searchPlaceholderKey)}
            aria-label={acT(locale, searchPlaceholderKey)}
          />
        </div>

        {activeTab === 'add' ? (
          <div className="ac-member-records-table ac-member-records-table--add" role="table">
            <div className="ac-member-records-table-head" role="rowgroup">
              <div
                className="ac-member-records-table-row ac-member-records-table-row--head ac-member-records-table-row--add"
                role="row"
              >
                <span role="columnheader">{acT(locale, 'memberRecordsColumnInvitee')}</span>
                <span role="columnheader">{acT(locale, 'memberPhone')}</span>
                <span role="columnheader">{acT(locale, 'memberDept')}</span>
                <span role="columnheader" className="ac-member-records-col-with-filter">
                  <span>{acT(locale, 'memberAccountType')}</span>
                  <button
                    type="button"
                    className="ac-member-records-col-filter"
                    aria-label={acT(locale, 'memberColumnFilter')}
                  >
                    <ColumnFilterIcon />
                  </button>
                </span>
                <span role="columnheader">{acT(locale, 'memberRecordsColumnInviter')}</span>
                <span role="columnheader" className="ac-member-records-col-with-filter">
                  <span>{acT(locale, 'roleColumnActions')}</span>
                  <button
                    type="button"
                    className="ac-member-records-col-filter"
                    aria-label={acT(locale, 'memberColumnFilter')}
                  >
                    <ColumnFilterIcon />
                  </button>
                </span>
              </div>
            </div>
            <div className="ac-member-records-table-body ac-member-records-table-body--rows" role="rowgroup">
              {filteredAddRecords.length === 0 ? (
                <div className="ac-member-records-empty" role="row">
                  <RecordsEmptyIcon />
                  <p>{acT(locale, 'memberRecordsEmpty')}</p>
                </div>
              ) : (
                filteredAddRecords.map((record) => (
                  <div
                    key={record.id}
                    className="ac-member-records-table-row ac-member-records-table-row--add ac-member-records-table-row--body"
                    role="row"
                  >
                    <span role="cell">
                      <RecordsPersonCell name={record.inviteeName} personId={record.id} />
                    </span>
                    <span role="cell" className="ac-member-records-cell-text" title={record.phone}>
                      {record.phone}
                    </span>
                    <span
                      role="cell"
                      className="ac-member-records-cell-text"
                      title={record.departmentName}
                    >
                      {record.departmentName}
                    </span>
                    <span role="cell" className="ac-member-records-cell-text">
                      {accountTypeLabel(locale, record.accountType)}
                    </span>
                    <span role="cell">
                      <RecordsPersonCell name={record.inviterName} personId={record.inviterId} />
                    </span>
                    <span
                      role="cell"
                      className={`ac-member-records-status ac-member-records-status--${record.status}`}
                    >
                      {addRecordStatusLabel(locale, record.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="ac-member-records-table ac-member-records-table--apply" role="table">
            <div className="ac-member-records-table-head" role="rowgroup">
              <div
                className="ac-member-records-table-row ac-member-records-table-row--head ac-member-records-table-row--apply"
                role="row"
              >
                <span role="columnheader">{acT(locale, 'memberRecordsColumnApplicant')}</span>
                <span role="columnheader">{acT(locale, 'memberPhone')}</span>
                <span role="columnheader">{acT(locale, 'memberRecordsColumnCustomQuestion')}</span>
                <span role="columnheader">{acT(locale, 'memberRecordsColumnApplyDepartment')}</span>
                <span role="columnheader">{acT(locale, 'memberRecordsColumnSharer')}</span>
                <span role="columnheader">{acT(locale, 'memberRecordsColumnAttachment')}</span>
                <span role="columnheader">{acT(locale, 'roleColumnActions')}</span>
              </div>
            </div>
            <div className="ac-member-records-table-body ac-member-records-table-body--rows" role="rowgroup">
              {filteredApplyRecords.length === 0 ? (
                <div className="ac-member-records-empty" role="row">
                  <RecordsEmptyIcon />
                  <p>{acT(locale, 'memberRecordsEmpty')}</p>
                </div>
              ) : (
                filteredApplyRecords.map((record) => (
                  <div
                    key={record.id}
                    className="ac-member-records-table-row ac-member-records-table-row--apply ac-member-records-table-row--body"
                    role="row"
                  >
                    <span role="cell">
                      <RecordsPersonCell name={record.applicantName} personId={record.id} />
                    </span>
                    <span role="cell" className="ac-member-records-cell-text" title={record.phone}>
                      {record.phone}
                    </span>
                    <span role="cell">
                      <span className="ac-member-records-custom-question">
                        <span className="ac-member-records-custom-question-label">
                          {record.customQuestionLabel}
                        </span>
                        <span className="ac-member-records-custom-question-value">
                          {record.customQuestionAnswer}
                        </span>
                      </span>
                    </span>
                    <span
                      role="cell"
                      className="ac-member-records-cell-text"
                      title={record.departmentName}
                    >
                      {record.departmentName}
                    </span>
                    <span role="cell">
                      <RecordsPersonCell name={record.sharerName} personId={record.sharerId} />
                    </span>
                    <span
                      role="cell"
                      className="ac-member-records-cell-text ac-member-records-cell-attachment"
                      title={record.attachmentName ?? ''}
                    >
                      {record.attachmentName ?? ''}
                    </span>
                    <span
                      role="cell"
                      className={`ac-member-records-status ac-member-records-status--${record.status}`}
                    >
                      {applicationStatusLabel(locale, record.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
