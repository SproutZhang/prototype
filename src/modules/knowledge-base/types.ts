export type KnowledgeBaseCategoryDef = {
  id: string
  nameZh: string
  nameEn: string
}

export type KnowledgeBaseDocStatus = 'ready' | 'indexing' | 'failed'

export type KnowledgeBaseSort = 'updated' | 'name' | 'documents'

export type KnowledgeBaseListViewMode = 'cards' | 'table'

export type KnowledgeBaseView = 'list' | 'folder' | 'detail'

/** 列表页顶层文件夹，用于收纳多个知识库 */
export type KnowledgeBaseWorkspaceFolder = {
  id: string
  nameZh: string
  nameEn: string
  createdAt: string
  updatedAt: string
}

export type KnowledgeBaseFolder = {
  id: string
  parentId: string | null
  depth: 1 | 2
  nameZh: string
  nameEn: string
  createdAt: string
  updatedAt: string
}

export type KnowledgeBaseDocument = {
  id: string
  nameZh: string
  nameEn: string
  format: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xlsx' | 'md' | 'csv' | 'png' | 'jpg' | 'txt' | 'msg' | 'json' | 'url'
  sizeLabel: string
  updatedAt: string
  status: KnowledgeBaseDocStatus
}

export type KnowledgeBaseIntegrationProvider = 'feishu' | 'notion' | 'confluence'

export type KnowledgeBaseIntegrationKind = 'document' | 'video' | 'sheet' | 'wiki'

export type KnowledgeBaseIntegrationItem = {
  id: string
  provider: KnowledgeBaseIntegrationProvider
  kind: KnowledgeBaseIntegrationKind
  nameZh: string
  nameEn: string
  sizeLabel: string
  updatedAt: string
  status: KnowledgeBaseDocStatus
}

export type KnowledgeBaseItem = {
  id: string
  /** null = 列表根目录；有值 = 位于该顶层文件夹内 */
  workspaceFolderId: string | null
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
  categoryId: string
  documentCount: number
  chunkCount: number
  linkedAgents: number
  updatedAt: string
  iconFrom: string
  iconTo: string
  folders: KnowledgeBaseFolder[]
  documents: KnowledgeBaseDocument[]
  integrationItems: KnowledgeBaseIntegrationItem[]
}

export type KnowledgeBaseCreateDraft = {
  name: string
  description: string
}

export type KnowledgeBaseCreateFolderDraft = {
  name: string
}

export type KnowledgeBasePermissionLevel = 'view' | 'edit' | 'manage'

export type KnowledgeBaseDeleteDocumentTarget = {
  kbId: string
  document: KnowledgeBaseDocument
}

export type KnowledgeBaseDeleteIntegrationTarget = {
  kbId: string
  item: KnowledgeBaseIntegrationItem
}
