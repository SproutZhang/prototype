import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { DEFAULT_KNOWLEDGE_BASE_CATEGORIES } from '../data/categories'
import { buildKnowledgeBaseSeed } from '../data/catalogWorkspaceSeed'
import type { KnowledgeBasePermissionRow } from '../components/KnowledgeBasePermissionsDrawer'
import type {
  KnowledgeBaseCreateDraft,
  KnowledgeBaseCreateFolderDraft,
  KnowledgeBaseDeleteDocumentTarget,
  KnowledgeBaseDeleteIntegrationTarget,
  KnowledgeBaseDocument,
  KnowledgeBaseIntegrationProvider,
  KnowledgeBaseItem,
  KnowledgeBaseSort,
  KnowledgeBaseView,
  KnowledgeBaseWorkspaceFolder,
} from '../types'
import {
  buildIntegrationItemsFromSelection,
  simulateIntegrationIndexDelayMs,
  simulateIntegrationIndexOutcome,
} from '../utils/buildIntegrationItemsFromSelection'
import { downloadKnowledgeBaseDocument } from '../utils/downloadDocument'
import { downloadKnowledgeBaseIntegrationItem } from '../utils/downloadIntegrationItem'
import type { KnowledgeBaseStringKey } from '../i18n/strings'
import { pickKnowledgeBaseIconColorsForNewItem } from '../utils/kbIconColors'

function localizeName(item: KnowledgeBaseItem, locale: AppLocale): string {
  return locale === 'zh' ? item.nameZh : item.nameEn
}

function localizeDescription(item: KnowledgeBaseItem, locale: AppLocale): string {
  return locale === 'zh' ? item.descriptionZh : item.descriptionEn
}

function matchesFolderSearch(folder: KnowledgeBaseWorkspaceFolder, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [folder.nameZh, folder.nameEn].join(' ').toLowerCase().includes(q)
}

function matchesSearch(item: KnowledgeBaseItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    item.nameZh,
    item.nameEn,
    item.descriptionZh,
    item.descriptionEn,
    ...item.documents.flatMap((d) => [d.nameZh, d.nameEn]),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

function sortItems(items: KnowledgeBaseItem[], sort: KnowledgeBaseSort, locale: AppLocale): KnowledgeBaseItem[] {
  const copy = [...items]
  if (sort === 'name') {
    copy.sort((a, b) => localizeName(a, locale).localeCompare(localizeName(b, locale), locale))
  } else if (sort === 'documents') {
    copy.sort((a, b) => b.documentCount - a.documentCount)
  } else {
    copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  return copy
}

export function useKnowledgeBase(locale: AppLocale) {
  const seed = useMemo(() => buildKnowledgeBaseSeed(), [])
  const [items, setItems] = useState<KnowledgeBaseItem[]>(() => seed.items)
  const [workspaceFolders, setWorkspaceFolders] = useState<KnowledgeBaseWorkspaceFolder[]>(
    () => seed.workspaceFolders,
  )
  const [view, setView] = useState<KnowledgeBaseView>('list')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<KnowledgeBaseSort>('updated')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSuccessToastOpen, setCreateSuccessToastOpen] = useState(false)
  const [successToastTitleKey, setSuccessToastTitleKey] =
    useState<KnowledgeBaseStringKey>('createSuccessTitle')
  const [successToastSubKey, setSuccessToastSubKey] =
    useState<KnowledgeBaseStringKey>('createSuccessSub')
  const createSuccessToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [editingWorkspaceFolder, setEditingWorkspaceFolder] =
    useState<KnowledgeBaseWorkspaceFolder | null>(null)
  const [deletingWorkspaceFolder, setDeletingWorkspaceFolder] =
    useState<KnowledgeBaseWorkspaceFolder | null>(null)
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<KnowledgeBaseItem | null>(null)
  const [permissionsItem, setPermissionsItem] = useState<KnowledgeBaseItem | null>(null)
  const [permissionsFolder, setPermissionsFolder] = useState<KnowledgeBaseWorkspaceFolder | null>(null)
  const [movingItem, setMovingItem] = useState<KnowledgeBaseItem | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<KnowledgeBaseDeleteDocumentTarget | null>(null)
  const [deletingIntegration, setDeletingIntegration] = useState<KnowledgeBaseDeleteIntegrationTarget | null>(null)
  const indexTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timers = indexTimersRef.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const defaultCategoryId = DEFAULT_KNOWLEDGE_BASE_CATEGORIES[0]?.id ?? 'hr'

  const filteredRootItems = useMemo(() => {
    const list = items.filter(
      (item) => item.workspaceFolderId === null && matchesSearch(item, search),
    )
    return sortItems(list, sort, locale)
  }, [items, search, sort, locale])

  const filteredWorkspaceFolders = useMemo(() => {
    const list = workspaceFolders.filter((folder) => matchesFolderSearch(folder, search))
    return [...list].sort((a, b) =>
      (locale === 'zh' ? a.nameZh : a.nameEn).localeCompare(locale === 'zh' ? b.nameZh : b.nameEn, locale),
    )
  }, [workspaceFolders, search, locale])

  const filteredFolderItems = useMemo(() => {
    if (!selectedFolderId) return []
    const list = items.filter(
      (item) => item.workspaceFolderId === selectedFolderId && matchesSearch(item, search),
    )
    return sortItems(list, sort, locale)
  }, [items, selectedFolderId, search, sort, locale])

  const selectedItem = useMemo(
    () => (selectedId ? items.find((item) => item.id === selectedId) ?? null : null),
    [items, selectedId],
  )

  const selectedFolder = useMemo(
    () =>
      selectedFolderId
        ? workspaceFolders.find((folder) => folder.id === selectedFolderId) ?? null
        : null,
    [workspaceFolders, selectedFolderId],
  )

  const openDetail = useCallback((id: string) => {
    setSelectedId(id)
    setView('detail')
  }, [])

  const closeDetail = useCallback(() => {
    const item = selectedId ? items.find((entry) => entry.id === selectedId) : null
    if (item?.workspaceFolderId) {
      setSelectedFolderId(item.workspaceFolderId)
      setView('folder')
    } else {
      setSelectedFolderId(null)
      setView('list')
    }
    setSelectedId(null)
  }, [items, selectedId])

  const openFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
    setView('folder')
  }, [])

  const closeFolder = useCallback(() => {
    setSelectedFolderId(null)
    setView('list')
  }, [])

  const openCreate = useCallback(() => setCreateOpen(true), [])
  const closeCreate = useCallback(() => setCreateOpen(false), [])

  const showSuccessToast = useCallback((titleKey: KnowledgeBaseStringKey, subKey: KnowledgeBaseStringKey) => {
    setSuccessToastTitleKey(titleKey)
    setSuccessToastSubKey(subKey)
    setCreateSuccessToastOpen(true)
    if (createSuccessToastTimerRef.current) {
      clearTimeout(createSuccessToastTimerRef.current)
    }
    createSuccessToastTimerRef.current = setTimeout(() => {
      createSuccessToastTimerRef.current = undefined
      setCreateSuccessToastOpen(false)
    }, 3200)
  }, [])

  useEffect(() => {
    return () => {
      if (createSuccessToastTimerRef.current) {
        clearTimeout(createSuccessToastTimerRef.current)
      }
    }
  }, [])

  const openCreateFolder = useCallback(() => setCreateFolderOpen(true), [])
  const closeCreateFolder = useCallback(() => setCreateFolderOpen(false), [])

  const openEditItem = useCallback((item: KnowledgeBaseItem) => setEditingItem(item), [])
  const closeEditItem = useCallback(() => setEditingItem(null), [])

  const openPermissionsItem = useCallback((item: KnowledgeBaseItem) => {
    setPermissionsFolder(null)
    setPermissionsItem(item)
  }, [])
  const openPermissionsFolder = useCallback((folder: KnowledgeBaseWorkspaceFolder) => {
    setPermissionsItem(null)
    setPermissionsFolder(folder)
  }, [])
  const closePermissionsItem = useCallback(() => {
    setPermissionsItem(null)
    setPermissionsFolder(null)
  }, [])

  const openMoveItem = useCallback((item: KnowledgeBaseItem) => setMovingItem(item), [])
  const closeMoveItem = useCallback(() => setMovingItem(null), [])

  const moveItemToFolder = useCallback((itemId: string, targetFolderId: string | null) => {
    const today = new Date().toISOString().slice(0, 10)
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, workspaceFolderId: targetFolderId, updatedAt: today } : item,
      ),
    )
    setMovingItem(null)
  }, [])

  const savePermissionsItem = useCallback(
    (_targetId: string, _rows: KnowledgeBasePermissionRow[], _targetType: 'item' | 'folder') => {
      setPermissionsItem(null)
      setPermissionsFolder(null)
    },
    [],
  )

  const downloadDocument = useCallback(
    (kbId: string, documentId: string) => {
      const item = items.find((entry) => entry.id === kbId)
      const doc = item?.documents.find((entry) => entry.id === documentId)
      if (!item || !doc) return
      downloadKnowledgeBaseDocument(doc, localizeName(item, locale), locale)
    },
    [items, locale],
  )

  const requestDeleteDocument = useCallback((kbId: string, documentId: string) => {
    const item = items.find((entry) => entry.id === kbId)
    const doc = item?.documents.find((entry) => entry.id === documentId)
    if (!item || !doc) return
    setDeletingDocument({ kbId, document: doc })
  }, [items])

  const closeDeleteDocument = useCallback(() => setDeletingDocument(null), [])

  const scheduleDocumentIndexComplete = useCallback((kbId: string, documentId: string, delayMs = 3000) => {
    const timerKey = `${kbId}:${documentId}`
    const existing = indexTimersRef.current.get(timerKey)
    if (existing) {
      clearTimeout(existing)
      indexTimersRef.current.delete(timerKey)
    }

    const timer = setTimeout(() => {
      indexTimersRef.current.delete(timerKey)
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== kbId) return item
          return {
            ...item,
            documents: item.documents.map((doc) =>
              doc.id === documentId ? { ...doc, status: 'ready' as const } : doc,
            ),
          }
        }),
      )
    }, delayMs)
    indexTimersRef.current.set(timerKey, timer)
  }, [])

  const uploadLocalDocuments = useCallback(
    (kbId: string, documents: KnowledgeBaseDocument[]) => {
      if (documents.length === 0) return

      const today = new Date().toISOString().slice(0, 10)
      const pending = documents.map((doc) => ({
        ...doc,
        status: 'indexing' as const,
        updatedAt: today,
      }))

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== kbId) return item
          const chunkPerDoc =
            item.documentCount > 0
              ? Math.max(24, Math.round(item.chunkCount / item.documentCount))
              : 48
          return {
            ...item,
            documents: [...item.documents, ...pending],
            documentCount: item.documents.length + pending.length,
            chunkCount: item.chunkCount + chunkPerDoc * pending.length,
            updatedAt: today,
          }
        }),
      )

      for (const doc of pending) {
        scheduleDocumentIndexComplete(kbId, doc.id)
      }
    },
    [scheduleDocumentIndexComplete],
  )

  const retryDocumentIndex = useCallback((kbId: string, documentId: string) => {
    const timerKey = `${kbId}:${documentId}`
    const existing = indexTimersRef.current.get(timerKey)
    if (existing) {
      clearTimeout(existing)
      indexTimersRef.current.delete(timerKey)
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== kbId) return item
        return {
          ...item,
          documents: item.documents.map((doc) =>
            doc.id === documentId ? { ...doc, status: 'indexing' as const } : doc,
          ),
        }
      }),
    )

    scheduleDocumentIndexComplete(kbId, documentId)
  }, [scheduleDocumentIndexComplete])

  const confirmDeleteDocument = useCallback(() => {
    if (!deletingDocument) return
    const { kbId, document } = deletingDocument
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== kbId) return item
        const nextDocs = item.documents.filter((doc) => doc.id !== document.id)
        const removedChunks =
          item.documentCount > 0 ? Math.round(item.chunkCount / item.documentCount) : 0
        return {
          ...item,
          documents: nextDocs,
          documentCount: nextDocs.length,
          chunkCount: Math.max(0, item.chunkCount - removedChunks),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      }),
    )
    setDeletingDocument(null)
  }, [deletingDocument])

  const confirmIntegrationFolderPick = useCallback(
    (kbId: string, provider: KnowledgeBaseIntegrationProvider, selectedIds: string[]) => {
      const picked = buildIntegrationItemsFromSelection(provider, selectedIds)
      if (picked.length === 0) return

      let itemsToIndex: typeof picked = []

      setItems((prev) => {
        const kbItem = prev.find((item) => item.id === kbId)
        if (!kbItem) return prev

        const existingIds = new Set(kbItem.integrationItems.map((entry) => entry.id))
        const newItems = picked.filter((entry) => !existingIds.has(entry.id))
        if (newItems.length === 0) return prev

        itemsToIndex = newItems
        return prev.map((item) => {
          if (item.id !== kbId) return item
          return {
            ...item,
            integrationItems: [...item.integrationItems, ...newItems],
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        })
      })

      for (const newItem of itemsToIndex) {
        const timerKey = `${kbId}:int:${newItem.id}`
        const existing = indexTimersRef.current.get(timerKey)
        if (existing) {
          clearTimeout(existing)
          indexTimersRef.current.delete(timerKey)
        }

        const delay = simulateIntegrationIndexDelayMs(newItem.id)
        const finalStatus = simulateIntegrationIndexOutcome(newItem.id)

        const timer = setTimeout(() => {
          indexTimersRef.current.delete(timerKey)
          setItems((prev) =>
            prev.map((item) => {
              if (item.id !== kbId) return item
              return {
                ...item,
                integrationItems: item.integrationItems.map((entry) =>
                  entry.id === newItem.id ? { ...entry, status: finalStatus } : entry,
                ),
              }
            }),
          )
        }, delay)
        indexTimersRef.current.set(timerKey, timer)
      }
    },
    [],
  )

  const downloadIntegrationItem = useCallback(
    (kbId: string, integrationItemId: string) => {
      const item = items.find((entry) => entry.id === kbId)
      const integrationItem = item?.integrationItems.find((entry) => entry.id === integrationItemId)
      if (!item || !integrationItem) return
      downloadKnowledgeBaseIntegrationItem(integrationItem, localizeName(item, locale), locale)
    },
    [items, locale],
  )

  const retryIntegrationItemIndex = useCallback((kbId: string, integrationItemId: string) => {
    const timerKey = `${kbId}:int:${integrationItemId}`
    const existing = indexTimersRef.current.get(timerKey)
    if (existing) {
      clearTimeout(existing)
      indexTimersRef.current.delete(timerKey)
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== kbId) return item
        return {
          ...item,
          integrationItems: item.integrationItems.map((entry) =>
            entry.id === integrationItemId ? { ...entry, status: 'indexing' as const } : entry,
          ),
        }
      }),
    )

    const delay = simulateIntegrationIndexDelayMs(integrationItemId)
    const finalStatus = simulateIntegrationIndexOutcome(integrationItemId)

    const timer = setTimeout(() => {
      indexTimersRef.current.delete(timerKey)
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== kbId) return item
          return {
            ...item,
            integrationItems: item.integrationItems.map((entry) =>
              entry.id === integrationItemId ? { ...entry, status: finalStatus } : entry,
            ),
          }
        }),
      )
    }, delay)
    indexTimersRef.current.set(timerKey, timer)
  }, [])

  const requestDeleteIntegrationItem = useCallback((kbId: string, integrationItemId: string) => {
    const item = items.find((entry) => entry.id === kbId)
    const integrationItem = item?.integrationItems.find((entry) => entry.id === integrationItemId)
    if (!item || !integrationItem) return
    setDeletingIntegration({ kbId, item: integrationItem })
  }, [items])

  const closeDeleteIntegration = useCallback(() => setDeletingIntegration(null), [])

  const confirmDeleteIntegrationItem = useCallback(() => {
    if (!deletingIntegration) return
    const { kbId, item } = deletingIntegration
    setItems((prev) =>
      prev.map((entry) => {
        if (entry.id !== kbId) return entry
        return {
          ...entry,
          integrationItems: entry.integrationItems.filter((integrationItem) => integrationItem.id !== item.id),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      }),
    )
    setDeletingIntegration(null)
  }, [deletingIntegration])

  const deleteIntegrationItems = useCallback((kbId: string, integrationItemIds: string[]) => {
    if (integrationItemIds.length === 0) return
    const idSet = new Set(integrationItemIds)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== kbId) return item
        return {
          ...item,
          integrationItems: item.integrationItems.filter((entry) => !idSet.has(entry.id)),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      }),
    )
  }, [])

  const deleteDocuments = useCallback((kbId: string, documentIds: string[]) => {
    if (documentIds.length === 0) return
    const idSet = new Set(documentIds)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== kbId) return item
        const nextDocs = item.documents.filter((doc) => !idSet.has(doc.id))
        const removedCount = item.documents.length - nextDocs.length
        const removedChunks =
          item.documentCount > 0
            ? Math.round((item.chunkCount / item.documentCount) * removedCount)
            : 0
        return {
          ...item,
          documents: nextDocs,
          documentCount: nextDocs.length,
          chunkCount: Math.max(0, item.chunkCount - removedChunks),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      }),
    )
  }, [])

  const requestDeleteItem = useCallback((item: KnowledgeBaseItem) => setDeletingItem(item), [])
  const closeDeleteItem = useCallback(() => setDeletingItem(null), [])

  const confirmDeleteItem = useCallback(() => {
    if (!deletingItem) return
    const id = deletingItem.id
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
      setView('list')
    }
    setDeletingItem(null)
  }, [deletingItem, selectedId])

  const updateKnowledgeBase = useCallback((itemId: string, draft: KnowledgeBaseCreateDraft) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              nameZh: draft.name,
              nameEn: draft.name,
              descriptionZh: draft.description,
              descriptionEn: draft.description,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : item,
      ),
    )
    setEditingItem(null)
  }, [])

  const openEditWorkspaceFolder = useCallback(
    (folder: KnowledgeBaseWorkspaceFolder) => setEditingWorkspaceFolder(folder),
    [],
  )
  const closeEditWorkspaceFolder = useCallback(() => setEditingWorkspaceFolder(null), [])

  const updateWorkspaceFolder = useCallback(
    (folderId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return false

      const normalized = trimmed.toLowerCase()
      const duplicate = workspaceFolders.some(
        (folder) =>
          folder.id !== folderId &&
          (folder.nameZh.trim().toLowerCase() === normalized ||
            folder.nameEn.trim().toLowerCase() === normalized),
      )
      if (duplicate) return false

      const today = new Date().toISOString().slice(0, 10)
      setWorkspaceFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? { ...folder, nameZh: trimmed, nameEn: trimmed, updatedAt: today }
            : folder,
        ),
      )
      setEditingWorkspaceFolder(null)
      return true
    },
    [workspaceFolders],
  )

  const requestDeleteWorkspaceFolder = useCallback(
    (folder: KnowledgeBaseWorkspaceFolder) => setDeletingWorkspaceFolder(folder),
    [],
  )
  const closeDeleteWorkspaceFolder = useCallback(() => setDeletingWorkspaceFolder(null), [])

  const confirmDeleteWorkspaceFolder = useCallback(() => {
    if (!deletingWorkspaceFolder) return
    const folderId = deletingWorkspaceFolder.id
    setWorkspaceFolders((prev) => prev.filter((folder) => folder.id !== folderId))
    setItems((prev) =>
      prev.map((item) =>
        item.workspaceFolderId === folderId ? { ...item, workspaceFolderId: null } : item,
      ),
    )
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null)
      setView('list')
    }
    setDeletingWorkspaceFolder(null)
  }, [deletingWorkspaceFolder, selectedFolderId])

  const bulkDeleteListSelection = useCallback(
    ({ folderIds, itemIds }: { folderIds: string[]; itemIds: string[] }) => {
      const folderIdSet = new Set(folderIds)
      const itemIdSet = new Set(itemIds)
      if (folderIdSet.size === 0 && itemIdSet.size === 0) return

      setWorkspaceFolders((prev) => prev.filter((folder) => !folderIdSet.has(folder.id)))
      setItems((prev) => {
        const next = prev
          .map((item) =>
            item.workspaceFolderId && folderIdSet.has(item.workspaceFolderId)
              ? { ...item, workspaceFolderId: null }
              : item,
          )
          .filter((item) => !itemIdSet.has(item.id))
        return next
      })

      if (selectedId && itemIdSet.has(selectedId)) {
        setSelectedId(null)
        setView('list')
      }
      if (selectedFolderId && folderIdSet.has(selectedFolderId)) {
        setSelectedFolderId(null)
        setView('list')
      }
    },
    [selectedFolderId, selectedId],
  )

  const createFolder = useCallback((draft: KnowledgeBaseCreateFolderDraft) => {
    const trimmed = draft.name.trim()
    if (!trimmed) return false

    const normalized = trimmed.toLowerCase()
    const duplicate = workspaceFolders.some(
      (folder) =>
        folder.nameZh.trim().toLowerCase() === normalized ||
        folder.nameEn.trim().toLowerCase() === normalized,
    )
    if (duplicate) return false

    const today = new Date().toISOString().slice(0, 10)
    const folder: KnowledgeBaseWorkspaceFolder = {
      id: `ws-folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nameZh: trimmed,
      nameEn: trimmed,
      createdAt: today,
      updatedAt: today,
    }

    setWorkspaceFolders((prev) => [folder, ...prev])
    setCreateFolderOpen(false)
    showSuccessToast('createFolderSuccessTitle', 'createFolderSuccessSub')
    return true
  }, [showSuccessToast, workspaceFolders])

  const createKnowledgeBase = useCallback(
    (draft: KnowledgeBaseCreateDraft) => {
      const id = `kb-custom-${Date.now()}`
      const workspaceFolderId = view === 'folder' ? selectedFolderId : null
      const iconColors = pickKnowledgeBaseIconColorsForNewItem(id, items)
      const item: KnowledgeBaseItem = {
        id,
        workspaceFolderId,
        nameZh: draft.name,
        nameEn: draft.name,
        descriptionZh: draft.description,
        descriptionEn: draft.description,
        categoryId: defaultCategoryId,
        documentCount: 0,
        chunkCount: 0,
        linkedAgents: 0,
        updatedAt: new Date().toISOString().slice(0, 10),
        iconFrom: iconColors.iconFrom,
        iconTo: iconColors.iconTo,
        folders: [],
        documents: [],
        integrationItems: [],
      }
      setItems((prev) => [item, ...prev])
      setCreateOpen(false)
      showSuccessToast('createSuccessTitle', 'createSuccessSub')
      openDetail(id)
    },
    [defaultCategoryId, items, openDetail, selectedFolderId, showSuccessToast, view],
  )

  return {
    items,
    view,
    search,
    setSearch,
    sort,
    setSort,
    filteredRootItems,
    filteredWorkspaceFolders,
    filteredFolderItems,
    workspaceFolders,
    selectedItem,
    selectedFolder,
    selectedFolderId,
    createOpen,
    createSuccessToastOpen,
    successToastTitleKey,
    successToastSubKey,
    createFolderOpen,
    openDetail,
    closeDetail,
    openFolder,
    closeFolder,
    openCreate,
    closeCreate,
    openCreateFolder,
    closeCreateFolder,
    createFolder,
    editingWorkspaceFolder,
    deletingWorkspaceFolder,
    openEditWorkspaceFolder,
    closeEditWorkspaceFolder,
    updateWorkspaceFolder,
    requestDeleteWorkspaceFolder,
    closeDeleteWorkspaceFolder,
    confirmDeleteWorkspaceFolder,
    editingItem,
    deletingItem,
    openEditItem,
    closeEditItem,
    permissionsItem,
    permissionsFolder,
    openPermissionsItem,
    openPermissionsFolder,
    closePermissionsItem,
    movingItem,
    openMoveItem,
    closeMoveItem,
    moveItemToFolder,
    savePermissionsItem,
    deletingDocument,
    downloadDocument,
    uploadLocalDocuments,
    retryDocumentIndex,
    requestDeleteDocument,
    closeDeleteDocument,
    confirmDeleteDocument,
    deleteDocuments,
    confirmIntegrationFolderPick,
    downloadIntegrationItem,
    retryIntegrationItemIndex,
    deletingIntegration,
    requestDeleteIntegrationItem,
    closeDeleteIntegration,
    confirmDeleteIntegrationItem,
    deleteIntegrationItems,
    requestDeleteItem,
    closeDeleteItem,
    confirmDeleteItem,
    bulkDeleteListSelection,
    updateKnowledgeBase,
    createKnowledgeBase,
    localizeName,
    localizeDescription,
  }
}
