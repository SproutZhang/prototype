import { useCallback, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { AppLocale } from '../../../i18n/homeStrings'
import { formatAgentCardMeta } from '../../../utils/formatAgentCardMeta'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { usePublicSpaceSharedContent, filterPublicSpaceSharedItems } from '../hooks/usePublicSpaceSharedContent'
import { tcsT, resourceKindLabel } from '../i18n/strings'
import { requestMineContentEdit } from '../utils/mineContentNavigation'
import {
  canManagePublicSharedItem,
  canRemovePublicSharedItem,
  listPublicSharedMoveTargets,
  movePublicSharedItem,
  removePublicSharedItem,
  type PublicSpaceSharedItem,
  type PublicSpaceSharedScope,
} from '../utils/publicSpaceSharedSync'
import { TcsMoveResourceModal } from './TcsResourceManageModals'

type PublicSpaceSharedPanelProps = {
  locale: AppLocale
  memberId: string
  searchQuery: string
  scope: PublicSpaceSharedScope
  showHeader?: boolean
  embedded?: boolean
  hideWhenEmpty?: boolean
  showPublisher?: boolean
  sharedItems?: PublicSpaceSharedItem[]
  /** 与协作项目卡片同一 grid 内联渲染，不再单独成块 */
  inlineInGrid?: boolean
}

export function PublicSpaceSharedPanel(props: PublicSpaceSharedPanelProps) {
  if (props.sharedItems) {
    return <PublicSpaceSharedPanelView {...props} items={props.sharedItems} />
  }
  return <PublicSpaceSharedPanelConnected {...props} />
}

function PublicSpaceSharedPanelConnected(props: Omit<PublicSpaceSharedPanelProps, 'sharedItems'>) {
  const items = usePublicSpaceSharedContent(props.locale, props.memberId, props.scope)
  return <PublicSpaceSharedPanelView {...props} items={items} />
}

function PublicSpaceSharedPanelView({
  locale,
  memberId,
  searchQuery,
  scope,
  showHeader = true,
  embedded = false,
  hideWhenEmpty = false,
  showPublisher,
  items,
  inlineInGrid = false,
}: Omit<PublicSpaceSharedPanelProps, 'sharedItems'> & { items: PublicSpaceSharedItem[] }) {
  const { isAdmin } = useTeamCollaborationCapabilities()
  const [confirmTarget, setConfirmTarget] = useState<PublicSpaceSharedItem | null>(null)
  const [moveTarget, setMoveTarget] = useState<PublicSpaceSharedItem | null>(null)
  const [noticeToast, setNoticeToast] = useState<{ title: string; sub?: string } | null>(null)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const filteredItems = filterPublicSpaceSharedItems(items, searchQuery)
  const shouldShowPublisher = showPublisher ?? scope === 'all'

  const showNotice = useCallback((title: string, sub?: string) => {
    setNoticeToast({ title, sub: sub?.trim() || undefined })
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => {
      noticeTimerRef.current = undefined
      setNoticeToast(null)
    }, 3200)
  }, [])

  const handleConfirm = () => {
    if (!confirmTarget) return
    const result = removePublicSharedItem(confirmTarget, memberId, isAdmin, locale)
    if (result.ok && result.title) {
      showNotice(result.title, result.sub)
    }
    setConfirmTarget(null)
  }

  const sectionTitle =
    scope === 'mine'
      ? tcsT(locale, 'projectSpaceMySharedTitle')
      : tcsT(locale, 'projectSpacePublicSharedAllTitle')
  const sectionHint =
    scope === 'mine'
      ? tcsT(locale, 'projectSpaceMySharedHint')
      : tcsT(locale, 'projectSpacePublicSharedAllHint')
  const emptyMessageKey =
    scope === 'mine' ? 'projectSpaceMySharedEmpty' : 'projectSpacePublicSharedAllEmpty'

  if (hideWhenEmpty && filteredItems.length === 0) {
    return null
  }

  const cardNodes = filteredItems.map((item) => {
    const canManage = canManagePublicSharedItem(item, memberId, isAdmin)
    return (
      <PublicSpaceSharedCard
        key={`${item.contentKey}:${item.spaceId}`}
        locale={locale}
        item={item}
        showPublisher={shouldShowPublisher}
        canManage={canManage}
        canRemove={canRemovePublicSharedItem(item, memberId, isAdmin)}
        onEdit={() => requestMineContentEdit(item.contentKey, item.sourceModule)}
        onMove={() => setMoveTarget(item)}
        onRemove={() => setConfirmTarget(item)}
      />
    )
  })

  const modalsAndToast = (
    <>
      <PublicSpaceSharedConfirmModal
        open={confirmTarget != null}
        locale={locale}
        displayName={confirmTarget?.displayName ?? ''}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
      />

      <TcsMoveResourceModal
        locale={locale}
        open={moveTarget != null}
        resourceName={moveTarget?.displayName ?? ''}
        targets={moveTarget ? listPublicSharedMoveTargets(locale, moveTarget.spaceId) : []}
        onClose={() => setMoveTarget(null)}
        onConfirm={(targetSpaceId) => {
          if (!moveTarget) return
          const result = movePublicSharedItem(moveTarget, targetSpaceId, memberId, isAdmin, locale)
          if (result.ok && result.title) {
            showNotice(result.title, result.sub)
          }
        }}
      />

      {noticeToast ? (
        <div className="agents-publish-success-toast" role="status" aria-live="polite">
          <div className="agents-publish-success-toast__inner">
            <strong className="agents-publish-success-toast__title">{noticeToast.title}</strong>
            {noticeToast.sub ? (
              <span className="agents-publish-success-toast__sub">{noticeToast.sub}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )

  if (inlineInGrid) {
    if (filteredItems.length === 0) return null
    return (
      <>
        {cardNodes}
        {modalsAndToast}
      </>
    )
  }

  return (
    <div className={`tcs-public-shared-panel${embedded ? ' tcs-public-shared-panel--embedded' : ''}`}>
      {showHeader ? (
        <div className="tcs-section-head tcs-public-shared-head">
          <div className="tcs-section-title-row">
            <h3 className="tcs-section-title tcs-public-shared-title">{sectionTitle}</h3>
          </div>
          <p className="tcs-public-shared-hint">{sectionHint}</p>
        </div>
      ) : null}

      {filteredItems.length === 0 ? (
        <div className="skills-empty tcs-project-space-empty">{tcsT(locale, emptyMessageKey)}</div>
      ) : (
        <section className="agents-grid skills-cards-grid tcs-grid tcs-public-shared-grid" aria-label={sectionTitle}>
          {cardNodes}
        </section>
      )}

      {modalsAndToast}
    </div>
  )
}

function PublicSpaceSharedCard({
  locale,
  item,
  showPublisher,
  canManage,
  canRemove,
  onEdit,
  onMove,
  onRemove,
}: {
  locale: AppLocale
  item: PublicSpaceSharedItem
  showPublisher: boolean
  canManage: boolean
  canRemove: boolean
  onEdit: () => void
  onMove: () => void
  onRemove: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showMenu = canManage || canRemove

  return (
    <article
      className={[
        'agent-card',
        'tcs-resource-card',
        'tcs-public-shared-card',
        showMenu ? 'tcs-resource-card--manageable' : '',
        menuOpen ? 'tcs-resource-card--menu-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showMenu ? (
        <div className="agent-card-more-wrap">
          <button
            type="button"
            className="agent-card-more"
            aria-label={tcsT(locale, 'resourceCardMenuAria')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation()
              setMenuOpen((open) => !open)
            }}
          >
            ⋮
          </button>
          <div
            className={menuOpen ? 'agent-card-menu is-open' : 'agent-card-menu'}
            role="menu"
            aria-label={tcsT(locale, 'resourceCardMenuAria')}
            onClick={(event) => event.stopPropagation()}
          >
            {canManage ? (
              <button type="button" className="agent-card-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onEdit() }}>
                {tcsT(locale, 'cardMenuEdit')}
              </button>
            ) : null}
            {canManage ? (
              <button type="button" className="agent-card-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); onMove() }}>
                {tcsT(locale, 'resourceMoveToSpace')}
              </button>
            ) : null}
            {canRemove ? (
              <button
                type="button"
                className="agent-card-menu-item is-danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onRemove()
                }}
              >
                {tcsT(locale, 'projectSpaceSharedRemove')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="agent-card-icon agent-card-icon-grad" aria-hidden="true" />
      <div className="agent-card-name-row">
        <div className="agent-card-name">{item.displayName}</div>
        {showPublisher ? (
          <span className="tcs-public-shared-publisher">
            {tcsT(locale, 'projectSpaceSharedBy').replace('{name}', item.publisherLabel)}
          </span>
        ) : null}
      </div>
      <div className="agent-card-desc">{item.desc}</div>
      <div className="agent-card-footer">
        <p className="agent-card-meta">
          {formatAgentCardMeta(item.meta, locale)} · {item.spaceLabel}
        </p>
        <div className="agent-card-tag">{resourceKindLabel(locale, item.kind)}</div>
      </div>
    </article>
  )
}

function PublicSpaceSharedConfirmModal({
  open,
  locale,
  displayName,
  onClose,
  onConfirm,
}: {
  open: boolean
  locale: AppLocale
  displayName: string
  onClose: () => void
  onConfirm: () => void
}) {
  const headingId = useId()
  const descId = useId()

  if (!open) return null

  return createPortal(
    <div className="scenario-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby={headingId} aria-describedby={descId}>
      <button type="button" className="scenario-delete-modal__backdrop" aria-label={tcsT(locale, 'formCancel')} onClick={onClose} />
      <div className="scenario-delete-modal__panel">
        <header className="scenario-delete-modal__header">
          <h2 id={headingId} className="scenario-delete-modal__title">
            {tcsT(locale, 'projectSpaceSharedRemoveTitle')}
          </h2>
        </header>
        <p id={descId} className="scenario-delete-modal__message">
          {tcsT(locale, 'projectSpaceSharedRemoveMessage').replace('{name}', displayName)}
        </p>
        <div className="scenario-delete-modal__footer">
          <button type="button" className="scenario-delete-modal__cancel" onClick={onClose}>
            {tcsT(locale, 'formCancel')}
          </button>
          <button type="button" className="scenario-delete-modal__confirm" onClick={onConfirm}>
            {tcsT(locale, 'projectSpaceSharedRemove')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
