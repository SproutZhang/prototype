import { useCallback, useMemo, useState } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import {
  API_KEYS_SEED,
  generateApiKeyToken,
  type ApiKeyRow,
  type ApiKeyStatus,
} from '../data/apiKeysSeed'

export type CreateApiKeyPayload = {
  name: string
  description: string
}

export type EditApiKeyPayload = {
  name: string
  description: string
  status: ApiKeyStatus
}

export type CreateApiKeyResult = {
  row: ApiKeyRow
  secretToken: string
}

/** API 密钥子模块控制器 */
export function useApiKeysSectionController() {
  const { locale } = useLocale()
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>(() => [...API_KEYS_SEED])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApiKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return apiKeys
    return apiKeys.filter((item) => {
      const haystack = [item.name, item.description, item.createdBy, item.status].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [apiKeys, searchQuery])

  const handleCreateApiKey = useCallback((payload: CreateApiKeyPayload): CreateApiKeyResult => {
    const secretToken = generateApiKeyToken()
    const row: ApiKeyRow = {
      id: `api-key-${Date.now()}`,
      name: payload.name.trim(),
      description: payload.description.trim(),
      secretToken,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      createdBy: 'admin@studiox.com',
    }
    setApiKeys((prev) => [row, ...prev])
    return { row, secretToken }
  }, [])

  const handleUpdateApiKey = useCallback((id: string, payload: EditApiKeyPayload) => {
    setApiKeys((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: payload.name.trim(),
              description: payload.description.trim(),
              status: payload.status,
            }
          : item,
      ),
    )
  }, [])

  const handleToggleApiKeyStatus = useCallback((id: string) => {
    setApiKeys((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'disabled' : 'active' }
          : item,
      ),
    )
  }, [])

  const handleDeleteApiKey = useCallback((id: string) => {
    setApiKeys((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return {
    locale,
    apiKeys,
    filteredApiKeys,
    searchQuery,
    setSearchQuery,
    handleCreateApiKey,
    handleUpdateApiKey,
    handleToggleApiKeyStatus,
    handleDeleteApiKey,
  }
}
