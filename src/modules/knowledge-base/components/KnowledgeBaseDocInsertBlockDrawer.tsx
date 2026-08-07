import { useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import type { EmbeddingProviderId } from '../data/embeddingProviderOptions'
import type { RecordManagerProviderId } from '../data/recordManagerProviderOptions'
import type { VectorStoreProviderId } from '../data/vectorStoreProviderOptions'
import { kbT } from '../i18n/strings'
import type { KnowledgeBaseDocument } from '../types'
import { KnowledgeBaseEmbeddingProviderConfigForm } from './KnowledgeBaseEmbeddingProviderConfigForm'
import { KnowledgeBaseSelectEmbeddingsProviderModal } from './KnowledgeBaseSelectEmbeddingsProviderModal'
import { KnowledgeBaseRecordManagerProviderConfigForm } from './KnowledgeBaseRecordManagerProviderConfigForm'
import { KnowledgeBaseSelectRecordManagerProviderModal } from './KnowledgeBaseSelectRecordManagerProviderModal'
import { KnowledgeBaseSelectVectorStoreProviderModal } from './KnowledgeBaseSelectVectorStoreProviderModal'
import { KnowledgeBaseVectorStoreProviderConfigForm } from './KnowledgeBaseVectorStoreProviderConfigForm'
type KnowledgeBaseDocInsertBlockDrawerProps = {
  locale: AppLocale
  doc: KnowledgeBaseDocument
  label: string
  onClose: () => void
}

type InsertBlockStep = 'embeddings' | 'vectorStore' | 'recordManager'

const INSERT_BLOCK_STEPS: Array<{
  id: InsertBlockStep
  stepLabelKey:
    | 'docInsertBlockStepEmbeddings'
    | 'docInsertBlockStepVectorStore'
    | 'docInsertBlockStepRecordManager'
  cardLabelKey:
    | 'docInsertBlockSelectEmbeddings'
    | 'docInsertBlockSelectVectorStore'
    | 'docInsertBlockSelectRecordManager'
  cardClass: string
}> = [
  {
    id: 'embeddings',
    stepLabelKey: 'docInsertBlockStepEmbeddings',
    cardLabelKey: 'docInsertBlockSelectEmbeddings',
    cardClass: 'kb-doc-insert-block-card--embeddings',
  },
  {
    id: 'vectorStore',
    stepLabelKey: 'docInsertBlockStepVectorStore',
    cardLabelKey: 'docInsertBlockSelectVectorStore',
    cardClass: 'kb-doc-insert-block-card--vector-store',
  },
  {
    id: 'recordManager',
    stepLabelKey: 'docInsertBlockStepRecordManager',
    cardLabelKey: 'docInsertBlockSelectRecordManager',
    cardClass: 'kb-doc-insert-block-card--record-manager',
  },
]

function EmbeddingsStepIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 4L4 8.5v7L12 20l8-4.5v-7L12 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 8.5L12 13l8-4.5M12 13v7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VectorStoreStepIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function RecordManagerStepIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M8 4h8a2 2 0 012 2v14l-6-3-6 3V6a2 2 0 012-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 7v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function InsertBlockStepIcon({ step }: { step: InsertBlockStep }) {
  if (step === 'embeddings') return <EmbeddingsStepIcon />
  if (step === 'vectorStore') return <VectorStoreStepIcon />
  return <RecordManagerStepIcon />
}

export function KnowledgeBaseDocInsertBlockDrawer({
  locale,
  label,
  onClose,
}: KnowledgeBaseDocInsertBlockDrawerProps) {
  const [activeStep, setActiveStep] = useState<InsertBlockStep>('embeddings')
  const [embeddingsProviderOpen, setEmbeddingsProviderOpen] = useState(false)
  const [vectorStoreProviderOpen, setVectorStoreProviderOpen] = useState(false)
  const [recordManagerProviderOpen, setRecordManagerProviderOpen] = useState(false)
  const [selectedEmbeddingsProviderId, setSelectedEmbeddingsProviderId] = useState<EmbeddingProviderId | null>(
    null,
  )
  const [selectedVectorStoreProviderId, setSelectedVectorStoreProviderId] = useState<VectorStoreProviderId | null>(
    null,
  )
  const [selectedRecordManagerProviderId, setSelectedRecordManagerProviderId] =
    useState<RecordManagerProviderId | null>(null)
  const activeStepIndex = INSERT_BLOCK_STEPS.findIndex((step) => step.id === activeStep)

  const handleCardClick = (step: InsertBlockStep) => {
    setActiveStep(step)
    if (step === 'embeddings' && !selectedEmbeddingsProviderId) {
      setEmbeddingsProviderOpen(true)
    }
    if (step === 'vectorStore' && !selectedVectorStoreProviderId) {
      setVectorStoreProviderOpen(true)
    }
    if (step === 'recordManager' && !selectedRecordManagerProviderId) {
      setRecordManagerProviderOpen(true)
    }
  }

  const handleEmbeddingsProviderSelect = (providerId: EmbeddingProviderId) => {
    setSelectedEmbeddingsProviderId(providerId)
    setEmbeddingsProviderOpen(false)
  }

  const handleVectorStoreProviderSelect = (providerId: VectorStoreProviderId) => {
    setSelectedVectorStoreProviderId(providerId)
    setVectorStoreProviderOpen(false)
  }

  const handleRecordManagerProviderSelect = (providerId: RecordManagerProviderId) => {
    setSelectedRecordManagerProviderId(providerId)
    setRecordManagerProviderOpen(false)
  }

  const handleReset = () => {
    setActiveStep('embeddings')
    setSelectedEmbeddingsProviderId(null)
    setSelectedVectorStoreProviderId(null)
    setSelectedRecordManagerProviderId(null)
    setEmbeddingsProviderOpen(false)
    setVectorStoreProviderOpen(false)
    setRecordManagerProviderOpen(false)
  }

  return (
    <div className="kb-doc-insert-block-page" aria-label={kbT(locale, 'docInsertBlock')}>
      <button type="button" className="kb-back-btn" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {kbT(locale, 'docPreviewProcessBack')}
      </button>

      <div className="kb-doc-insert-block-page-head">
        <div className="kb-doc-insert-block-page-head-main">
          <h2 className="kb-doc-insert-block-page-title">{kbT(locale, 'docInsertBlock')}</h2>
          <p className="kb-doc-process-drawer-doc" title={label}>
            {label}
          </p>
        </div>
        <div className="kb-doc-insert-block-page-head-actions">
          <button
            type="button"
            className="kb-doc-insert-block-action-btn kb-doc-insert-block-action-btn--reset"
            onClick={handleReset}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0019 7l1-1M5 5l1 1a9 9 0 0014 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {kbT(locale, 'docInsertBlockReset')}
          </button>
          <button type="button" className="kb-doc-insert-block-action-btn kb-doc-insert-block-action-btn--save">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M17 21v-8H7v8M7 3v5h8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {kbT(locale, 'docInsertBlockSaveConfig')}
          </button>
          <button
            type="button"
            className="kb-doc-insert-block-action-btn kb-doc-insert-block-action-btn--insert"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M5 19h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {kbT(locale, 'docInsertBlockInsert')}
          </button>
          <button
            type="button"
            className="kb-doc-insert-block-history-btn"
            aria-label={kbT(locale, 'docInsertBlockHistory')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 8v4l3 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="kb-doc-insert-block-page-body">
        <div className="kb-doc-insert-block-wizard">
          <div className="kb-doc-insert-block-steps" role="list" aria-label={kbT(locale, 'docInsertBlock')}>
            {INSERT_BLOCK_STEPS.map((step, index) => {
              const isActive = step.id === activeStep
              const isComplete =
                index < activeStepIndex ||
                (step.id === 'embeddings' && Boolean(selectedEmbeddingsProviderId)) ||
                (step.id === 'vectorStore' && Boolean(selectedVectorStoreProviderId)) ||
                (step.id === 'recordManager' && Boolean(selectedRecordManagerProviderId))

              return (
                <div
                  key={step.id}
                  className={`kb-doc-insert-block-step${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
                  role="listitem"
                >
                  <span className="kb-doc-insert-block-step-marker" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="kb-doc-insert-block-step-label">{kbT(locale, step.stepLabelKey)}</span>
                </div>
              )
            })}
          </div>

          <div className="kb-doc-insert-block-cards">
            {selectedEmbeddingsProviderId ? (
              <KnowledgeBaseEmbeddingProviderConfigForm
                locale={locale}
                providerId={selectedEmbeddingsProviderId}
                onEdit={() => {
                  setSelectedEmbeddingsProviderId(null)
                  setEmbeddingsProviderOpen(true)
                }}
              />
            ) : (
              <button
                type="button"
                className={`kb-doc-insert-block-card kb-doc-insert-block-card--embeddings${activeStep === 'embeddings' ? ' is-active' : ''}`}
                aria-current={activeStep === 'embeddings' ? 'step' : undefined}
                onClick={() => handleCardClick('embeddings')}
              >
                <span className="kb-doc-insert-block-card-inner">
                  <EmbeddingsStepIcon />
                  {kbT(locale, 'docInsertBlockSelectEmbeddings')}
                </span>
              </button>
            )}
            {selectedVectorStoreProviderId ? (
              <KnowledgeBaseVectorStoreProviderConfigForm
                locale={locale}
                providerId={selectedVectorStoreProviderId}
                onEdit={() => {
                  setSelectedVectorStoreProviderId(null)
                  setVectorStoreProviderOpen(true)
                }}
              />
            ) : (
              <button
                type="button"
                className={`kb-doc-insert-block-card kb-doc-insert-block-card--vector-store${activeStep === 'vectorStore' ? ' is-active' : ''}`}
                aria-current={activeStep === 'vectorStore' ? 'step' : undefined}
                onClick={() => handleCardClick('vectorStore')}
              >
                <span className="kb-doc-insert-block-card-inner">
                  <VectorStoreStepIcon />
                  {kbT(locale, 'docInsertBlockSelectVectorStore')}
                </span>
              </button>
            )}
            {selectedRecordManagerProviderId ? (
              <KnowledgeBaseRecordManagerProviderConfigForm
                locale={locale}
                providerId={selectedRecordManagerProviderId}
                onEdit={() => {
                  setSelectedRecordManagerProviderId(null)
                  setRecordManagerProviderOpen(true)
                }}
              />
            ) : (
              <button
                type="button"
                className={`kb-doc-insert-block-card kb-doc-insert-block-card--record-manager${activeStep === 'recordManager' ? ' is-active' : ''}`}
                aria-current={activeStep === 'recordManager' ? 'step' : undefined}
                onClick={() => handleCardClick('recordManager')}
              >
                <span className="kb-doc-insert-block-card-inner">
                  <RecordManagerStepIcon />
                  {kbT(locale, 'docInsertBlockSelectRecordManager')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <KnowledgeBaseSelectEmbeddingsProviderModal
        locale={locale}
        open={embeddingsProviderOpen}
        selectedProviderId={selectedEmbeddingsProviderId}
        onClose={() => setEmbeddingsProviderOpen(false)}
        onSelect={handleEmbeddingsProviderSelect}
      />
      <KnowledgeBaseSelectVectorStoreProviderModal
        locale={locale}
        open={vectorStoreProviderOpen}
        selectedProviderId={selectedVectorStoreProviderId}
        onClose={() => setVectorStoreProviderOpen(false)}
        onSelect={handleVectorStoreProviderSelect}
      />
      <KnowledgeBaseSelectRecordManagerProviderModal
        locale={locale}
        open={recordManagerProviderOpen}
        selectedProviderId={selectedRecordManagerProviderId}
        onClose={() => setRecordManagerProviderOpen(false)}
        onSelect={handleRecordManagerProviderSelect}
      />
    </div>
  )
}
