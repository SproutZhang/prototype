import { useEffect, useState, type FormEvent } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import { buildPaginationItems } from '../utils/buildPaginationItems'

export const DEPARTMENT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

type DepartmentsPaginationProps = {
  locale: AppLocale
  totalCount: number
  currentPage: number
  pageSize: number
  selectedCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onBulkEdit?: () => void
  onBulkDelete?: () => void
}

function PaginationChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M14 7l-5 5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PaginationChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M10 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PaginationSelectChevron() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DepartmentsPagination({
  locale,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedCount,
  onBulkEdit,
  onBulkDelete,
}: DepartmentsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageItems = buildPaginationItems(totalPages, safePage)
  const [gotoValue, setGotoValue] = useState(String(safePage))

  useEffect(() => {
    setGotoValue(String(safePage))
  }, [safePage])

  const submitGoto = (event?: FormEvent) => {
    event?.preventDefault()
    const parsed = Number.parseInt(gotoValue, 10)
    if (!Number.isFinite(parsed)) {
      setGotoValue(String(safePage))
      return
    }
    const nextPage = Math.min(totalPages, Math.max(1, parsed))
    onPageChange(nextPage)
    setGotoValue(String(nextPage))
  }

  const showBulkActions = selectedCount > 0 && onBulkEdit != null && onBulkDelete != null

  return (
    <nav className="ac-departments-pagination" aria-label={acT(locale, 'departmentPaginationLabel')}>
      <div
        className={
          showBulkActions
            ? 'ac-departments-pagination-row'
            : 'ac-departments-pagination-row ac-departments-pagination-row--no-bulk'
        }
      >
        {showBulkActions ? (
          <div className="ac-departments-bulk-actions" role="group" aria-label={acT(locale, 'departmentBulkActionsLabel')}>
            <button type="button" className="ac-departments-bulk-tag" onClick={onBulkEdit}>
              {acT(locale, 'departmentBulkEdit')}
            </button>
            <button
              type="button"
              className="ac-departments-bulk-tag ac-departments-bulk-tag--danger"
              onClick={onBulkDelete}
            >
              {acT(locale, 'removeDepartment')}
            </button>
          </div>
        ) : null}

        <div className="ac-departments-pagination-bar">
        <span className="ac-departments-pagination-total">
          {acT(locale, 'departmentPaginationTotal').replace('{count}', String(totalCount))}
        </span>
        <button
          type="button"
          className="ac-departments-pagination-nav-btn"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label={acT(locale, 'departmentPaginationPrevious')}
        >
          <PaginationChevronLeft />
        </button>

        <div className="ac-departments-pagination-pages">
          {pageItems.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="ac-departments-pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === safePage ? 'page' : undefined}
                className={
                  item === safePage
                    ? 'ac-departments-pagination-page is-active'
                    : 'ac-departments-pagination-page'
                }
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="ac-departments-pagination-nav-btn"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label={acT(locale, 'departmentPaginationNext')}
        >
          <PaginationChevronRight />
        </button>

        <label className="ac-departments-pagination-size">
          <select
            className="ac-departments-pagination-size-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label={acT(locale, 'departmentPageSize')}
          >
            {DEPARTMENT_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {acT(locale, 'departmentPageSizeOption').replace('{size}', String(size))}
              </option>
            ))}
          </select>
          <span className="ac-departments-pagination-size-chevron" aria-hidden="true">
            <PaginationSelectChevron />
          </span>
        </label>

        <form className="ac-departments-pagination-goto" onSubmit={submitGoto}>
          <span className="ac-departments-pagination-goto-label">
            {acT(locale, 'departmentPaginationGoTo')}
          </span>
          <input
            type="text"
            inputMode="numeric"
            className="ac-departments-pagination-goto-input"
            value={gotoValue}
            onChange={(event) => setGotoValue(event.target.value)}
            onBlur={() => submitGoto()}
            aria-label={acT(locale, 'departmentPaginationGoTo')}
          />
        </form>
        </div>
      </div>
    </nav>
  )
}
