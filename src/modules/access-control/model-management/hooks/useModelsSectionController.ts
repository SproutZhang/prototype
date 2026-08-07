import { useCallback, useMemo, useState } from 'react'

import { useLocale } from '../../../../i18n/LocaleContext'
import {
  MODELS_SEED,
  type ModelRow,
  type ModelStatus,
  type ModelType,
} from '../data/modelsSeed'

export type CreateModelPayload = {
  name: string
  provider: string
  type: ModelType
  modelId: string
}

export type EditModelPayload = {
  name: string
  provider: string
  type: ModelType
  modelId: string
  status: ModelStatus
}

/** 模型管理子模块控制器 */
export function useModelsSectionController() {
  const { locale } = useLocale()
  const [models, setModels] = useState<ModelRow[]>(() => [...MODELS_SEED])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredModels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return models
    return models.filter((item) => {
      const haystack = [item.name, item.provider, item.type, item.modelId, item.status]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [models, searchQuery])

  const handleCreateModel = useCallback((payload: CreateModelPayload) => {
    const row: ModelRow = {
      id: `model-${Date.now()}`,
      name: payload.name.trim(),
      provider: payload.provider.trim(),
      type: payload.type,
      modelId: payload.modelId.trim(),
      status: 'active',
      updatedAt: new Date().toISOString(),
    }
    setModels((prev) => [row, ...prev])
    return row
  }, [])

  const handleUpdateModel = useCallback((id: string, payload: EditModelPayload) => {
    setModels((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: payload.name.trim(),
              provider: payload.provider.trim(),
              type: payload.type,
              modelId: payload.modelId.trim(),
              status: payload.status,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }, [])

  const handleToggleModelStatus = useCallback((id: string) => {
    setModels((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'active' ? 'disabled' : 'active',
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }, [])

  const handleDeleteModel = useCallback((id: string) => {
    setModels((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return {
    locale,
    models,
    filteredModels,
    searchQuery,
    setSearchQuery,
    handleCreateModel,
    handleUpdateModel,
    handleToggleModelStatus,
    handleDeleteModel,
  }
}
