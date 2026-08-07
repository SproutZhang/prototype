import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { PublishSpaceSelectField } from './PublishSpaceSelectField'
import type { AppLocale } from '../i18n/homeStrings'
import { agentPublishT } from '../i18n/agentLibraryStrings'
import { scenarioT } from '../i18n/scenarioStrings'
import { DEFAULT_PUBLISH_PROJECT_GROUP_ID } from '../data/scenarioPublishSpaces'
import { navigateToPublishTarget } from '../modules/team-collaboration-space/utils/publishProjectGroupTargets'
import { navigateToHome } from '../modules/team-collaboration-space/utils/routing'

type PublishAgentAppModalProps = {
  open: boolean
  locale: AppLocale
  defaultSpaceId?: string
  preferredCreateGroupId?: string
  variant?: 'agent' | 'scenario'
  onClose: () => void
  onConfirm: (targetId: string) => void | boolean
  onViewSpace?: (targetId: string) => void
  onContinueCreate?: () => void
}

export function PublishAgentAppModal({
  open,
  locale,
  defaultSpaceId,
  preferredCreateGroupId,
  variant = 'agent',
  onClose,
  onConfirm,
  onViewSpace,
  onContinueCreate,
}: PublishAgentAppModalProps) {
  const titleId = useId()
  const selectId = useId()
  const text = agentPublishT(locale)
  const wasOpenRef = useRef(false)
  const [selectedTargetId, setSelectedTargetId] = useState(DEFAULT_PUBLISH_PROJECT_GROUP_ID)
  const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
  const [phase, setPhase] = useState<'form' | 'success'>('form')
  const publishedTargetIdRef = useRef(DEFAULT_PUBLISH_PROJECT_GROUP_ID)

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      setPhase('form')
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true
    setSelectedTargetId(
      defaultSpaceId ?? preferredCreateGroupId ?? DEFAULT_PUBLISH_PROJECT_GROUP_ID,
    )
    setCreateSpaceModalOpen(false)
    setPhase('form')
  }, [defaultSpaceId, open, preferredCreateGroupId])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !createSpaceModalOpen) onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [createSpaceModalOpen, open, onClose])

  if (!open) return null

  const handleBackdropClose = () => {
    if (createSpaceModalOpen) return
    onClose()
  }

  const modalTitle =
    phase === 'success'
      ? variant === 'scenario'
        ? scenarioT(locale, 'publishSuccessTitle')
        : text.publishSuccessTitle
      : variant === 'scenario'
        ? scenarioT(locale, 'publishAppTitle')
        : text.modalTitle
  const modalQuestion =
    variant === 'scenario' ? scenarioT(locale, 'publishReadyQuestion') : text.question
  const modalLead =
    variant === 'scenario' ? scenarioT(locale, 'publishReadyLead') : text.lead
  const closeLabel = variant === 'scenario' ? scenarioT(locale, 'close') : text.close
  const successSub =
    variant === 'scenario' ? scenarioT(locale, 'publishSuccessSub') : text.publishSuccessSub
  const successFollowUp = scenarioT(locale, 'publishSuccessFollowUp')
  const viewSpaceLabel =
    variant === 'scenario' ? scenarioT(locale, 'publishSuccessViewSpace') : text.publishSuccessViewSpace
  const continueCreateLabel =
    variant === 'scenario'
      ? scenarioT(locale, 'publishSuccessContinueCreate')
      : text.publishSuccessContinueCreate

  const handleConfirm = () => {
    publishedTargetIdRef.current = selectedTargetId
    const shouldContinue = onConfirm(selectedTargetId)
    if (shouldContinue === false) return
    setPhase('success')
  }

  const handleViewSpace = () => {
    const targetId = publishedTargetIdRef.current
    if (onViewSpace) {
      onViewSpace(targetId)
    } else {
      navigateToPublishTarget(targetId)
    }
    onClose()
  }

  const handleContinueCreate = () => {
    if (onContinueCreate) {
      onContinueCreate()
    } else {
      navigateToHome()
    }
    onClose()
  }

  return createPortal(
    <div
      className="agents-publish-app-modal"
      role="dialog"
      aria-modal="true"
      aria-hidden={createSpaceModalOpen}
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="agents-publish-app-modal__backdrop"
        aria-label={closeLabel}
        onClick={handleBackdropClose}
      />
      <div
        className={`agents-publish-app-modal__panel${phase === 'success' ? ' agents-publish-app-modal__panel--success' : ''}`}
      >
        <header className="agents-publish-app-modal__header">
          <h2 id={titleId} className="agents-publish-app-modal__title">
            {modalTitle}
          </h2>
          <button
            type="button"
            className="agents-publish-app-modal__close"
            aria-label={closeLabel}
            onClick={handleBackdropClose}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        {phase === 'form' ? (
          <>
            <div className="agents-publish-app-modal__body">
              <h3 className="agents-publish-app-modal__question">{modalQuestion}</h3>
              <p className="agents-publish-app-modal__lead">{modalLead}</p>
              <div className="agents-publish-app-modal__field">
                <label className="agents-publish-app-modal__field-label" htmlFor={selectId}>
                  {scenarioT(locale, 'publishSelectSpace')}
                </label>
                <div className="agents-publish-app-modal__select-wrap">
                  <PublishSpaceSelectField
                    locale={locale}
                    selectId={selectId}
                    value={selectedTargetId}
                    ariaLabel={scenarioT(locale, 'publishSelectSpace')}
                    onChange={setSelectedTargetId}
                    preferredCreateGroupId={preferredCreateGroupId}
                    onNestedModalOpenChange={setCreateSpaceModalOpen}
                  />
                  <span className="agents-publish-app-modal__select-suffix" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path fill="none" stroke="currentColor" strokeWidth="2" d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            <footer className="agents-publish-app-modal__footer">
              <button
                type="button"
                className="agents-publish-app-modal__confirm"
                onClick={handleConfirm}
              >
                {scenarioT(locale, 'publishConfirm')}
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="agents-publish-app-modal__body agents-publish-app-modal__body--success">
              <span className="agents-publish-app-modal__success-icon" aria-hidden="true">
                ✓
              </span>
              <p className="agents-publish-app-modal__success-sub">{successSub}</p>
              <p className="agents-publish-app-modal__success-followup">{successFollowUp}</p>
            </div>
            <footer className="agents-publish-app-modal__footer agents-publish-app-modal__footer--success">
              <div className="agents-publish-app-modal__actions">
                <button
                  type="button"
                  className="agents-publish-app-modal__btn agents-publish-app-modal__btn--ghost"
                  onClick={handleContinueCreate}
                >
                  {continueCreateLabel}
                </button>
                <button
                  type="button"
                  className="agents-publish-app-modal__btn agents-publish-app-modal__btn--primary"
                  onClick={handleViewSpace}
                >
                  {viewSpaceLabel}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
