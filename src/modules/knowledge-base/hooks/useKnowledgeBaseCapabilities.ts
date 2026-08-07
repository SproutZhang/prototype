import { useRbac } from '../../../auth/useRbac'
import { isLoginRoleTier } from '../../../auth/types'
import type { KnowledgeBaseItem, KnowledgeBaseView } from '../types'
import { isUserCreatedKnowledgeBase } from '../utils/isUserCreatedKnowledgeBase'

/**
 * 知识库能力门控（结合 RBAC 与当前视图上下文）
 *
 * - 根列表：User 仅可新建顶层文件夹
 * - 文件夹内（子级）：User 具备除「权限分配」外的内容管理能力
 * - 原有（种子）知识库：User 可查看第三方集成版块
 * - 用户自建知识库：无第三方集成版块
 * - 本地上传：User 在可访问的知识库详情中均可上传
 */
export function useKnowledgeBaseCapabilities(
  view: KnowledgeBaseView,
  selectedItem: KnowledgeBaseItem | null,
) {
  const { role, can } = useRbac()
  /** Manager / Admin：知识库完整管理能力（二者 RBAC 一致）；User 按颗粒度门控 */
  const isElevated = isLoginRoleTier(role, 'manager') || role === 'admin' || can('kb.edit')

  const inFolderView = view === 'folder'
  const inFolderKbDetail =
    view === 'detail' &&
    selectedItem != null &&
    selectedItem.workspaceFolderId != null
  const inUserFolderScope = inFolderView || inFolderKbDetail

  const isCatalogKb =
    view === 'detail' && selectedItem != null && !isUserCreatedKnowledgeBase(selectedItem)

  const canManagePermissions = can('kb.manage_permissions')
  const canManageIntegrations = can('kb.integrations') || isElevated
  const canViewIntegrations =
    canManageIntegrations || (isLoginRoleTier(role, 'user') && isCatalogKb)
  const canUploadDocuments = can('kb.upload_documents') || isElevated
  const canCreateFolder = can('kb.create_folder') || isElevated

  const canEditKb = isElevated || (isLoginRoleTier(role, 'user') && inUserFolderScope)

  const canCreateKb =
    isElevated || (isLoginRoleTier(role, 'user') && inFolderView && (can('kb.create') || can('kb.create_folder')))

  /** 根列表页头部：User 仅展示「创建文件夹」 */
  const canCreateKbAtRoot = isElevated

  /** 文档区「上传文档」：可管理集成时可选本地 / 集成来源 */
  const canOpenUploadSourcePicker = canManageIntegrations

  /** 本地上传弹窗「高级设置」：Manager / Admin 一致 */
  const canUseUploadAdvancedSettings = isElevated

  /** 文档行内完整操作（预览/代码块/API 等）：Manager / Admin 一致 */
  const canUseFullDocActions = isElevated

  /** 连接/配置第三方集成：Manager / Admin 一致 */
  const canConnectIntegrations = canManageIntegrations

  return {
    canManagePermissions,
    canViewIntegrations,
    canManageIntegrations,
    canUploadDocuments,
    canCreateFolder,
    canEditKb,
    canCreateKb,
    canCreateKbAtRoot,
    canOpenUploadSourcePicker,
    canUseUploadAdvancedSettings,
    canUseFullDocActions,
    canConnectIntegrations,
  }
}
