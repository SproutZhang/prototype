import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { EditIcon } from '../../components/RowActionIcons'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../../departments-management/data/departmentsSeed'
import { mockDepartmentPublicId } from '../utils/departmentPublicId'

type BatchManageMenuKey =
  | 'memberBatchAdjustDepartment'
  | 'memberBatchImport'
  | 'memberBatchExport'
  | 'memberBatchEnable'
  | 'memberBatchDisable'
  | 'memberBatchDeleteDirect'

const BATCH_MANAGE_MENU_ITEMS: { key: BatchManageMenuKey; danger?: boolean }[] = [
  { key: 'memberBatchAdjustDepartment' },
  { key: 'memberBatchImport' },
  { key: 'memberBatchExport' },
  { key: 'memberBatchEnable' },
  { key: 'memberBatchDisable' },
  { key: 'memberBatchDeleteDirect', danger: true },
]

const BATCH_ACTIONS_REQUIRING_SELECTION: BatchManageMenuKey[] = [
  'memberBatchAdjustDepartment',
  'memberBatchEnable',
  'memberBatchDisable',
  'memberBatchDeleteDirect',
]

type DepartmentMembersPanelHeaderProps = {
  locale: AppLocale
  /** 部门视图：传入 department；公司视图：传入 orgRootLabel + 统计字段 */
  department?: OrgDepartmentRow
  orgRootLabel?: string
  totalMemberCount?: number
  departmentCount?: number
  onEditDepartment?: (department: OrgDepartmentRow) => void
  onAddMember?: () => void
  onThirdPartyImport?: () => void
  onViewAddApplyRecords?: () => void
  onBatchImport?: () => void
  onBatchExport?: () => void
  onBatchEnable?: () => number
  onBatchAdjustDepartment?: () => void
  onBatchDisable?: () => void
  onBatchDeleteDirect?: () => void
  externalBatchHint?: { message: string; variant: 'warning' | 'success' } | null
  selectedMemberCount?: number
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AddMemberIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="6.5" cy="5.5" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.5 13.5v-1a3.5 3.5 0 0 1 3.5-3.5H8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M11.5 8.5v4M9.5 10.5h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function DepartmentMembersPanelHeader({
  locale,
  department,
  orgRootLabel,
  totalMemberCount = 0,
  departmentCount = 0,
  onEditDepartment,
  onAddMember,
  onThirdPartyImport,
  onViewAddApplyRecords,
  onBatchImport,
  onBatchExport,
  onBatchEnable,
  onBatchAdjustDepartment,
  onBatchDisable,
  onBatchDeleteDirect,
  externalBatchHint = null,
  selectedMemberCount = 0,
}: DepartmentMembersPanelHeaderProps) {
  const addMenuId = useId()
  const addMenuRef = useRef<HTMLDivElement>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const batchMenuId = useId()
  const batchMenuRef = useRef<HTMLDivElement>(null)
  const [batchMenuOpen, setBatchMenuOpen] = useState(false)
  const [batchHintMessage, setBatchHintMessage] = useState<string | null>(null)
  const [batchHintVariant, setBatchHintVariant] = useState<'warning' | 'success'>('warning')

  const showBatchHint = (message: string, variant: 'warning' | 'success' = 'warning') => {
    setBatchHintVariant(variant)
    setBatchHintMessage(message)
  }

  const handleBatchMenuAction = (key: BatchManageMenuKey) => {
    setBatchMenuOpen(false)
    if (BATCH_ACTIONS_REQUIRING_SELECTION.includes(key) && selectedMemberCount === 0) {
      showBatchHint(acT(locale, 'memberBatchSelectRequired'))
      return
    }
    if (key === 'memberBatchImport') {
      onBatchImport?.()
      return
    }
    if (key === 'memberBatchExport') {
      onBatchExport?.()
      return
    }
    if (key === 'memberBatchAdjustDepartment') {
      onBatchAdjustDepartment?.()
      return
    }
    if (key === 'memberBatchEnable') {
      const activatedCount = onBatchEnable?.() ?? 0
      if (activatedCount > 0) {
        showBatchHint(
          acT(locale, 'memberBatchEnableSuccess').replace('{count}', String(activatedCount)),
          'success',
        )
      } else {
        showBatchHint(acT(locale, 'memberBatchEnableNone'))
      }
      return
    }
    if (key === 'memberBatchDisable') {
      onBatchDisable?.()
      return
    }
    if (key === 'memberBatchDeleteDirect') {
      onBatchDeleteDirect?.()
      return
    }
  }

  useEffect(() => {
    if (!batchHintMessage) return
    const timer = window.setTimeout(() => setBatchHintMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [batchHintMessage])

  useEffect(() => {
    if (selectedMemberCount > 0 && batchHintVariant === 'warning' && !externalBatchHint) {
      setBatchHintMessage(null)
    }
  }, [selectedMemberCount, batchHintVariant, externalBatchHint])

  const activeBatchHint = externalBatchHint ?? (
    batchHintMessage ? { message: batchHintMessage, variant: batchHintVariant } : null
  )

  const batchManageMenuItems = useMemo(
    () =>
      BATCH_MANAGE_MENU_ITEMS.filter(
        (item) => item.key !== 'memberBatchDeleteDirect' || onBatchDeleteDirect != null,
      ),
    [onBatchDeleteDirect],
  )

  useEffect(() => {
    if (!addMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) {
        setAddMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [addMenuOpen])

  useEffect(() => {
    if (!batchMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!batchMenuRef.current?.contains(event.target as Node)) {
        setBatchMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBatchMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [batchMenuOpen])

  const isCompanyScope = orgRootLabel != null
  const title = isCompanyScope
    ? orgRootLabel
    : localizeDepartmentName(department!, locale)
  const metaLabel = isCompanyScope
    ? acT(locale, 'orgCompanyMembersMeta')
        .replace(
          '{memberCount}',
          acT(locale, 'workspaceMemberCount').replace('{count}', String(totalMemberCount)),
        )
        .replace('{departmentCount}', String(departmentCount))
    : acT(locale, 'departmentMembersIdLabel').replace(
        '{id}',
        department!.departmentCode || mockDepartmentPublicId(department!.id),
      )
  const descKey = isCompanyScope ? 'orgCompanyMembersHint' : 'departmentMembersAdminHint'

  return (
    <div className="ac-dept-members-header">
      <div className="ac-dept-members-header-top">
        <div className="ac-dept-members-header-lead">
          <div className="ac-dept-members-title-row">
            <h2 className="ac-dept-members-title">{title}</h2>
            <span className="ac-dept-members-id">({metaLabel})</span>
            {!isCompanyScope && onEditDepartment && department ? (
              <button
                type="button"
                className="ac-row-icon-btn ac-dept-members-edit-btn"
                aria-label={acT(locale, 'editDepartment')}
                onClick={() => onEditDepartment(department)}
              >
                <EditIcon />
              </button>
            ) : null}
          </div>
          <p className="ac-dept-members-desc">{acT(locale, descKey)}</p>
        </div>
      </div>

      <div className="ac-dept-members-toolbar">
        {onAddMember ? (
          <div className="ac-dept-members-add-group" ref={addMenuRef}>
            <button
              type="button"
              className="agents-btn agents-btn-primary ac-dept-members-add-main"
              onClick={onAddMember}
            >
              <AddMemberIcon />
              <span>{acT(locale, 'addMember')}</span>
            </button>
            {onThirdPartyImport ? (
              <>
                <button
                  type="button"
                  className="agents-btn agents-btn-primary ac-dept-members-add-toggle"
                  aria-expanded={addMenuOpen}
                  aria-haspopup="menu"
                  aria-controls={addMenuId}
                  aria-label={acT(locale, 'memberAddMoreActions')}
                  onClick={() => setAddMenuOpen((open) => !open)}
                >
                  <ChevronDownIcon />
                </button>
                {addMenuOpen ? (
                  <div id={addMenuId} className="ac-dept-members-add-menu" role="menu">
                    <button
                      type="button"
                      className="ac-dept-members-add-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setAddMenuOpen(false)
                        onThirdPartyImport()
                      }}
                    >
                      {acT(locale, 'departmentThirdPartyImport')}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          className="agents-btn ac-dept-members-toolbar-btn"
          onClick={onViewAddApplyRecords}
        >
          {acT(locale, 'departmentMembersAddRecord')}
        </button>
        <span className="ac-dept-members-toolbar-divider" aria-hidden="true" />
        <div className="ac-dept-members-batch-group" ref={batchMenuRef}>
          <button
            type="button"
            className="agents-btn ac-dept-members-toolbar-btn ac-dept-members-batch-trigger"
            aria-expanded={batchMenuOpen}
            aria-haspopup="menu"
            aria-controls={batchMenuId}
            onClick={() => setBatchMenuOpen((open) => !open)}
          >
            <span>{acT(locale, 'departmentMembersBatchManage')}</span>
            <ChevronDownIcon />
          </button>
          {batchMenuOpen ? (
            <div id={batchMenuId} className="ac-dept-members-batch-menu" role="menu">
              {batchManageMenuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`ac-dept-members-batch-menu-item${item.danger ? ' ac-dept-members-batch-menu-item--danger' : ''}`}
                  role="menuitem"
                  onClick={() => handleBatchMenuAction(item.key)}
                >
                  {acT(locale, item.key)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {activeBatchHint ? (
        <p
          className={`ac-dept-members-batch-hint${activeBatchHint.variant === 'success' ? ' ac-dept-members-batch-hint--success' : ''}`}
          role="alert"
        >
          {activeBatchHint.message}
        </p>
      ) : null}
    </div>
  )
}
