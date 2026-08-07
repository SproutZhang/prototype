import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { ActivateIcon, DeactivateIcon, DeleteIcon, EditIcon } from '../../components/RowActionIcons'
import { acT } from '../../i18n/strings'
import { maskApiKeyToken, type ApiKeyRow } from '../data/apiKeysSeed'
import type { useApiKeysSectionController } from '../hooks/useApiKeysSectionController'
import { ApiKeyCreatedModal } from './ApiKeyCreatedModal'
import { CreateApiKeyModal } from './CreateApiKeyModal'
import { EditApiKeyModal } from './EditApiKeyModal'

type ApiKeysViewProps = {
  locale: AppLocale
  searchQuery: string
  apiKeys: ApiKeyRow[]
  onCreateApiKey: ReturnType<typeof useApiKeysSectionController>['handleCreateApiKey']
  onUpdateApiKey: ReturnType<typeof useApiKeysSectionController>['handleUpdateApiKey']
  onToggleApiKeyStatus: ReturnType<typeof useApiKeysSectionController>['handleToggleApiKeyStatus']
  onDeleteApiKey: ReturnType<typeof useApiKeysSectionController>['handleDeleteApiKey']
  createOpen: boolean
  onCloseCreate: () => void
}

function formatDateTime(locale: AppLocale, iso: string | null): string {
  if (!iso) return acT(locale, 'apiKeyNeverUsed')
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

function statusLabel(locale: AppLocale, status: ApiKeyRow['status']): string {
  return status === 'active' ? acT(locale, 'apiKeyStatusActive') : acT(locale, 'apiKeyStatusDisabled')
}

export function ApiKeysView({
  locale,
  searchQuery,
  apiKeys,
  onCreateApiKey,
  onUpdateApiKey,
  onToggleApiKeyStatus,
  onDeleteApiKey,
  createOpen,
  onCloseCreate,
}: ApiKeysViewProps) {
  const [editTarget, setEditTarget] = useState<ApiKeyRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyRow | null>(null)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  const filteredApiKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return apiKeys
    return apiKeys.filter((item) => {
      const haystack = [item.name, item.description, maskApiKeyToken(item.secretToken), item.createdBy]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [apiKeys, searchQuery])

  const handleCreate = (payload: { name: string; description: string }) => {
    const result = onCreateApiKey(payload)
    onCloseCreate()
    setCreatedSecret(result.secretToken)
  }

  return (
    <>
      <section className="ac-section ac-api-keys-section">
        <div className="ac-api-keys-panel">
          {filteredApiKeys.length === 0 ? (
            <div className="ac-api-keys-empty">
              <p>{acT(locale, 'apiKeyEmpty')}</p>
            </div>
          ) : (
            <div className="ac-members-table ac-members-table--api-keys" role="table">
              <div className="ac-members-table-head" role="row">
                <span role="columnheader">{acT(locale, 'apiKeyColumnName')}</span>
                <span role="columnheader">{acT(locale, 'apiKeyColumnKey')}</span>
                <span role="columnheader">{acT(locale, 'apiKeyColumnStatus')}</span>
                <span role="columnheader">{acT(locale, 'apiKeyColumnCreatedAt')}</span>
                <span role="columnheader">{acT(locale, 'apiKeyColumnLastUsed')}</span>
                <span role="columnheader" className="ac-members-table-actions-col">
                  {acT(locale, 'roleColumnActions')}
                </span>
              </div>
              <ul className="ac-members-table-body" role="rowgroup">
                {filteredApiKeys.map((item) => (
                  <li key={item.id} className="ac-members-row" role="row">
                    <span role="cell" className="ac-api-key-name-cell">
                      <span className="ac-api-key-name">{item.name}</span>
                      {item.description ? (
                        <span className="ac-api-key-desc" title={item.description}>
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    <span role="cell" className="ac-api-key-token-cell">
                      <code className="ac-api-key-token">{maskApiKeyToken(item.secretToken)}</code>
                    </span>
                    <span role="cell">
                      <span
                        className={`ac-api-key-status ac-api-key-status--${item.status}`}
                      >
                        {statusLabel(locale, item.status)}
                      </span>
                    </span>
                    <span role="cell" className="ac-api-key-date-cell">
                      {formatDateTime(locale, item.createdAt)}
                    </span>
                    <span role="cell" className="ac-api-key-date-cell">
                      {formatDateTime(locale, item.lastUsedAt)}
                    </span>
                    <span role="cell" className="ac-members-row-actions">
                      <button
                        type="button"
                        className="ac-row-icon-btn"
                        aria-label={acT(locale, 'apiKeyEditTitle')}
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
                            ? acT(locale, 'apiKeyDisable')
                            : acT(locale, 'apiKeyEnable')
                        }
                        title={
                          item.status === 'active'
                            ? acT(locale, 'apiKeyDisable')
                            : acT(locale, 'apiKeyEnable')
                        }
                        onClick={() => onToggleApiKeyStatus(item.id)}
                      >
                        {item.status === 'active' ? <DeactivateIcon /> : <ActivateIcon />}
                      </button>
                      <button
                        type="button"
                        className="ac-row-icon-btn"
                        aria-label={acT(locale, 'apiKeyDelete')}
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

      <CreateApiKeyModal
        locale={locale}
        open={createOpen}
        onClose={onCloseCreate}
        onCreate={handleCreate}
      />

      <EditApiKeyModal
        locale={locale}
        open={editTarget != null}
        apiKey={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={onUpdateApiKey}
      />

      <ApiKeyCreatedModal
        locale={locale}
        open={createdSecret != null}
        secretToken={createdSecret ?? ''}
        onClose={() => setCreatedSecret(null)}
      />

      {deleteTarget ? (
        <div className="ac-modal-overlay" role="presentation" onClick={() => setDeleteTarget(null)}>
          <div
            className="ac-modal ac-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ac-api-key-delete-title"
            aria-describedby="ac-api-key-delete-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="ac-api-key-delete-title" className="ac-modal-title">
              {acT(locale, 'apiKeyDeleteTitle')}
            </h2>
            <p id="ac-api-key-delete-desc" className="ac-modal-hint">
              {acT(locale, 'apiKeyDeleteMessage').replace('{name}', deleteTarget.name)}
            </p>
            <div className="ac-modal-actions">
              <button type="button" className="ac-btn ac-btn--secondary" onClick={() => setDeleteTarget(null)}>
                {acT(locale, 'formCancel')}
              </button>
              <button
                type="button"
                className="agents-btn ac-btn--danger"
                onClick={() => {
                  onDeleteApiKey(deleteTarget.id)
                  setDeleteTarget(null)
                }}
              >
                {acT(locale, 'apiKeyDelete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
