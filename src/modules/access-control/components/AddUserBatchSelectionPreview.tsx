import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { OrgMember } from '../types'

const MAX_ROWS = 2

export type BatchSelectionPreviewItem = {
  member: OrgMember
  roleLabel?: string
}

function localizeMemberName(member: OrgMember, locale: AppLocale): string {
  return locale === 'zh' ? member.nameZh : member.nameEn
}

function memberSelectionLabel(member: OrgMember, locale: AppLocale, roleLabel?: string): string {
  const name = localizeMemberName(member, locale)
  if (roleLabel) return `${roleLabel} ${name}`
  return `${name} · ${member.email}`
}

function countVisibleTags(container: HTMLElement, maxRows: number, reserveMoreSlot: boolean): number {
  const tagEls = [
    ...container.querySelectorAll('.ac-add-user-batch-preview-measure [data-batch-tag="true"]'),
  ] as HTMLElement[]
  if (tagEls.length === 0) return 0

  const rowTops = [...new Set(tagEls.map((tag) => tag.offsetTop))].sort((a, b) => a - b)
  if (rowTops.length <= maxRows) {
    return tagEls.length
  }

  const maxTop = rowTops[maxRows - 1]!
  let fit = 0
  for (const tag of tagEls) {
    if (tag.offsetTop <= maxTop) fit += 1
    else break
  }

  if (reserveMoreSlot) {
    fit = Math.max(1, fit - 1)
  }

  return fit
}

type AddUserBatchSelectionPreviewProps = {
  locale: AppLocale
  members?: OrgMember[]
  /** 批量引入时展示在成员姓名前的角色标签（全部成员统一） */
  roleLabel?: string
  /** 按成员展示角色标签（优先于 members + roleLabel） */
  previewItems?: BatchSelectionPreviewItem[]
}

export function AddUserBatchSelectionPreview({
  locale,
  members = [],
  roleLabel,
  previewItems,
}: AddUserBatchSelectionPreviewProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const items = useMemo<BatchSelectionPreviewItem[]>(() => {
    if (previewItems?.length) return previewItems
    return members.map((member) => ({ member, roleLabel }))
  }, [members, previewItems, roleLabel])

  const [visibleCount, setVisibleCount] = useState(items.length)

  const labels = useMemo(
    () => items.map((item) => memberSelectionLabel(item.member, locale, item.roleLabel)),
    [items, locale],
  )

  const allLabelsTitle = labels.join('\n')

  useLayoutEffect(() => {
    const container = measureRef.current
    if (!container || items.length === 0) {
      setVisibleCount(0)
      return
    }

    const updateVisibleCount = () => {
      const withoutMore = countVisibleTags(container, MAX_ROWS, items.length > 1)
      if (withoutMore >= items.length) {
        setVisibleCount(items.length)
        return
      }
      setVisibleCount(countVisibleTags(container, MAX_ROWS, true))
    }

    updateVisibleCount()

    const observer = new ResizeObserver(updateVisibleCount)
    observer.observe(container)
    return () => observer.disconnect()
  }, [items, locale, labels])

  if (items.length === 0) return null

  const overflow = Math.max(0, items.length - visibleCount)
  const visibleItems = overflow > 0 ? items.slice(0, visibleCount) : items
  const overflowTitle = labels.slice(visibleCount).join(locale === 'zh' ? '、' : ', ')

  return (
    <div className="ac-add-user-batch-preview" title={allLabelsTitle}>
      <div ref={measureRef} className="ac-add-user-batch-preview-tags">
        <div className="ac-add-user-batch-preview-measure" aria-hidden="true">
          {items.map((item) => (
            <span
              key={`measure-${item.member.id}`}
              className="ac-add-user-batch-preview-tag"
              data-batch-tag="true"
            >
              {memberSelectionLabel(item.member, locale, item.roleLabel)}
            </span>
          ))}
        </div>
        {visibleItems.map((item) => (
          <span key={item.member.id} className="ac-add-user-batch-preview-tag">
            {memberSelectionLabel(item.member, locale, item.roleLabel)}
          </span>
        ))}
        {overflow > 0 ? (
          <span className="ac-add-user-batch-preview-tag ac-add-user-batch-preview-tag--more" title={overflowTitle}>
            +{overflow}
          </span>
        ) : null}
      </div>
    </div>
  )
}
