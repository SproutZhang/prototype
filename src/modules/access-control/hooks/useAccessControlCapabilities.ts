import { isLoginRoleTier } from '../../../auth/types'
import { useRbac } from '../../../auth/useRbac'

/** 访问控制模块能力门控（登录角色：admin / manager / user） */
export function useAccessControlCapabilities() {
  const { role, can } = useRbac()
  const isAdmin = role === 'admin'
  const isManager = isLoginRoleTier(role, 'manager')

  /** 成员管理：Admin / Manager（与 RBAC ac.users_manage 对齐） */
  const canManageMembers = can('ac.users_manage')

  /** 成员管理 · 创建子部门 */
  const canCreateChildDepartment = canManageMembers

  /** 成员管理 · 删除（部门 / 批量删除） */
  const canDeleteInMembersManagement = canManageMembers

  /** 成员管理 · 右侧成员列表 · 行内操作（删除 / 激活 / 失效） */
  const canManageMemberRowActionsInMembers = canManageMembers

  /** 成员管理 · 编辑部门（完整） */
  const canEditDepartmentInMembers = canManageMembers

  /** 成员管理 · 左侧部门树 · 编辑部门 */
  const canEditDepartmentInMembersSidebar = canManageMembers

  /** 部门管理 · 创建部门 / 添加子部门 / 批量创建 / 第三方导入：仅 Admin */
  const canManageDepartmentStructure = isAdmin

  /** 部门管理 · 删除部门（含批量）：仅 Admin */
  const canDeleteDepartmentInManagement = isAdmin

  /** 部门管理 · 编辑部门：Admin / Manager（Manager 受限编辑，同成员管理） */
  const canEditDepartmentInManagement = isAdmin || isManager

  /** 部门管理 · 批量编辑部门：仅 Admin */
  const canBulkEditDepartmentInManagement = isAdmin

  /** 部门管理 · 列表多选（全选 / 批量操作）：仅 Admin */
  const canSelectDepartmentsInManagement = isAdmin

  /** 部门管理 · 添加成员：Admin / Manager */
  const canAddMemberInDepartmentManagement = isAdmin || isManager

  /** 角色版块：Admin / Manager 可进入；User 若具备 ac.roles_manage 同理；内置角色与更高层级行仅 Admin 可改 */
  const canManageRoles = can('ac.roles_manage')

  const canCreateRole = canManageRoles
  const canEditRole = canManageRoles
  const canDeleteRole = canManageRoles
  const canEditBuiltinRole = isAdmin
  const canAddMemberInRoleManagement = canManageRoles
  const canRemoveMemberInRoleManagement = canManageRoles

  /** 工作日志：仅 Admin，查看全组织操作记录 */
  const canViewWorkLog = isAdmin

  /** 审计日志：Admin / Manager 可查看；仅 Admin 可撤回/恢复记录 */
  const canViewAuditLog = can('ac.audit_log_view')
  const canManageAuditLog = isAdmin

  /** API 密钥：Admin / Manager */
  const canViewApiKeys = isAdmin || isManager
  const canManageApiKeys = isAdmin || isManager

  /** 模型管理：Admin / Manager */
  const canViewModelManagement = isAdmin || isManager
  const canManageModelManagement = isAdmin || isManager

  /** 用户版块：仅 Admin */
  const canViewUsersManagement = isAdmin

  /** 部门管理版块：仅 Admin */
  const canViewDepartmentsManagement = isAdmin

  /** 成员管理版块：Admin / Manager */
  const canViewMembersManagement = canManageMembers

  return {
    role,
    isAdmin,
    isManager,
    canCreateChildDepartment,
    canDeleteInMembersManagement,
    canManageMemberRowActionsInMembers,
    canEditDepartmentInMembers,
    canEditDepartmentInMembersSidebar,
    canManageDepartmentStructure,
    canDeleteDepartmentInManagement,
    canEditDepartmentInManagement,
    canBulkEditDepartmentInManagement,
    canSelectDepartmentsInManagement,
    canAddMemberInDepartmentManagement,
    canCreateRole,
    canEditRole,
    canDeleteRole,
    canEditBuiltinRole,
    canAddMemberInRoleManagement,
    canRemoveMemberInRoleManagement,
    canViewWorkLog,
    canViewAuditLog,
    canManageAuditLog,
    canViewApiKeys,
    canManageApiKeys,
    canViewModelManagement,
    canManageModelManagement,
    canViewUsersManagement,
    canViewDepartmentsManagement,
    canViewMembersManagement,
  }
}
