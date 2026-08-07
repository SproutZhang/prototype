import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { ActivateIcon, DeactivateIcon, DeleteIcon, EditIcon } from '../../components/RowActionIcons'
import { acT } from '../../i18n/strings'
import type { ModelRow } from '../data/modelsSeed'
import type { useModelsSectionController } from '../hooks/useModelsSectionController'
import { modelTypeLabel } from '../utils/modelLabels'
import { CreateModelModal } from './CreateModelModal'
import { EditModelModal } from './EditModelModal'

type ModelsViewProps = {
  locale: AppLocale
  searchQuery: string
  models: ModelRow[]
  onCreateModel: ReturnType<typeof useModelsSectionController>['handleCreateModel']
  onUpdateModel: ReturnType<typeof useModelsSectionController>['handleUpdateModel']
  onToggleModelStatus: ReturnType<typeof useModelsSectionController>['handleToggleModelStatus']
  onDeleteModel: ReturnType<typeof useModelsSectionController>['handleDeleteModel']
  createOpen: boolean
  onCloseCreate: () => void
}

function formatDateTime(locale: AppLocale, iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(locale: AppLocale, status: ModelRow['status']): string {
  return status === 'active' ? acT(locale, 'modelStatusActive') : acT(locale, 'modelStatusDisabled')
}

export function ModelsView({
  locale,
  searchQuery,
  models,
  onCreateModel,
  onUpdateModel,
  onToggleModelStatus,
  onDeleteModel,
  createOpen,
  onCloseCreate,
}: ModelsViewProps) {
  const [editTarget, setEditTarget] = useState<ModelRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ModelRow | null>(null)

  const filteredModels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return models
    return models.filter((item) => {
      const haystack = [item.name, item.provider, item.type, item.modelId, modelTypeLabel(locale, item.type)]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [models, searchQuery, locale])

  const handleCreate = (payload: Parameters<typeof onCreateModel>[0]) => {
    onCreateModel(payload)
    onCloseCreate()
  }

  return (
    <>
      <section className="ac-section ac-models-section">
        <div className="ac-models-panel">
          {filteredModels.length === 0 ? (
            <div className="ac-models-empty">
              <p>{acT(locale, 'modelEmpty')}</p>
            </div>
          ) : (
            <div className="ac-members-table ac-members-table--models" role="table">
              <div className="ac-members-table-head" role="row">
                <span role="columnheader">{acT(locale, 'modelColumnName')}</span>
                <span role="columnheader">{acT(locale, 'modelColumnProvider')}</span>
                <span role="columnheader">{acT(locale, 'modelColumnType')}</span>
                <span role="columnheader">{acT(locale, 'modelColumnModelId')}</span>
                <span role="columnheader">{acT(locale, 'modelColumnStatus')}</span>
                <span role="columnheader">{acT(locale, 'modelColumnUpdatedAt')}</span>
                <span role="columnheader" className="ac-members-table-actions-col">
                  {acT(locale, 'roleColumnActions')}
                </span>
              </div>
              <ul className="ac-members-table-body" role="rowgroup">
                {filteredModels.map((item) => (
                  <li key={item.id} className="ac-members-row" role="row">
                    <span role="cell" className="ac-model-name-cell">
                      <span className="ac-model-name">{item.name}</span>
                    </span>
                    <span role="cell">{item.provider}</span>
                    <span role="cell">{modelTypeLabel(locale, item.type)}</span>
                    <span role="cell" className="ac-model-id-cell">
                      <code className="ac-model-id">{item.modelId}</code>
                    </span>
                    <span role="cell">
                      <span className={`ac-api-key-status ac-api-key-status--${item.status}`}>
                        {statusLabel(locale, item.status)}
                      </span>
                    </span>
                    <span role="cell" className="ac-api-key-date-cell">
                      {formatDateTime(locale, item.updatedAt)}
                    </span>
                    <span role="cell" className="ac-members-row-actions">
                      <button
                        type="button"
                        className="ac-row-icon-btn"
                        aria-label={acT(locale, 'modelEditTitle')}
                        onClick={() => setEditTarget(item)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className={
                          item.status === 'active'
                            ? 'ac-row-icon-btn ac-row-icon-btn--warn'
                            : 'ac-row-icon-btn ac-row-icon-btn--success'
                        }
                        aria-label={
                          item.status === 'active'
                            ? acT(locale, 'modelDisable')
                            : acT(locale, 'modelEnable')
                        }
                        title={
                          item.status === 'active'
                            ? acT(locale, 'modelDisable')
                            : acT(locale, 'modelEnable')
                        }
                        onClick={() => onToggleModelStatus(item.id)}
                      >
                        {item.status === 'active' ? <DeactivateIcon /> : <ActivateIcon />}
                      </button>
                      <button
                        type="button"
                        className="ac-row-icon-btn"
                        aria-label={acT(locale, 'modelDelete')}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <DeleteIcon />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <CreateModelModal
        locale={locale}
        open={createOpen}
        onClose={onCloseCreate}
        onCreate={handleCreate}
      />

      <EditModelModal
        locale={locale}
        open={editTarget != null}
        model={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={onUpdateModel}
      />

      {deleteTarget ? (
        <div className="ac-modal-overlay" role="presentation" onClick={() => setDeleteTarget(null)}>
          <div
            className="ac-modal ac-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ac-model-delete-title"
            aria-describedby="ac-model-delete-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="ac-model-delete-title" className="ac-modal-title">
              {acT(locale, 'modelDeleteTitle')}
            </h2>
            <p id="ac-model-delete-desc" className="ac-modal-hint">
              {acT(locale, 'modelDeleteMessage').replace('{name}', deleteTarget.name)}
            </p>
            <div className="ac-modal-actions">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={() => setDeleteTarget(null)}>
                {acT(locale, 'formCancel')}
              </button>
              <button
                type="button"
                className="agents-btn ac-btn--danger"
                onClick={() => {
                  onDeleteModel(deleteTarget.id)
                  setDeleteTarget(null)
                }}
              >
                {acT(locale, 'modelDelete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
