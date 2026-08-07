export { AccessControlPage } from './AccessControlPage'
export { AccessControlWorkspacePage } from './sections/workspace'
export { AccessControlDepartmentsPage } from './sections/departments'
export { AccessControlUsersPage } from './sections/users'
export { AccessControlMembersPage } from './sections/members'
export { AccessControlRolesPage } from './sections/roles'
export { AccessControlAuditLogPage } from './sections/audit-log'
export { AccessControlWorkLogPage } from './sections/work-log'
export { AccessControlApiKeysPage } from './sections/api-keys'
export { AccessControlModelManagementPage } from './sections/model-management'
export { AuditLogView, AUDIT_LOG_EVENTS } from './audit-log'
export { WorkLogView, WORK_LOG_ENTRIES, useWorkLogSectionController } from './work-log'
export { ApiKeysView, API_KEYS_SEED, useApiKeysSectionController } from './api-keys'
export { ModelsView, MODELS_SEED, useModelsSectionController } from './model-management'
export {
  DepartmentsManagementView,
  useDepartmentsSectionController,
  ORG_DEPARTMENT_ROWS,
} from './departments-management'
export { MembersManagementView, useMembersSectionController } from './members-management'
export { AccessControlSidebarNav, ACCESS_CONTROL_NAV_SECTIONS } from './nav'
export { useAccessControlNavigation } from './hooks/useAccessControlNavigation'
export { AccessBadge } from './components/AccessBadge'
export { AccessModeBadgeSelect } from './components/AccessModeBadgeSelect'
export { AccessModeFieldset } from './components/AccessModeFieldset'
export { AccessModeSelect } from './components/AccessModeSelect'
export {
  AddMemberModal,
  EditMemberPermissionsModal,
  MembersPanel,
  type SpaceCustomRoleOption,
} from './components/MembersPanel'
export { MembersManageModal } from './components/MembersManageModal'
export { SearchableSelect } from './components/SearchableSelect'
export type { SearchableSelectOption } from './components/SearchableSelect'
export { ORG_MEMBERS_SEED } from './data/orgMembersSeed'
export {
  PERMISSIONS,
  ROLE_PRESET_PERMISSIONS,
  SHARED_SPACE_PERMISSIONS,
  assignmentFromPreset,
  clampToParentPermissions,
  clampToSpacePermissions,
  detectRolePreset,
  hasPermission,
  permissionsForPreset,
} from './data/permissions'
export { acT, accessModeBadgeLabel, accessModeHint, accessModeLabel, permissionLabel, rolePresetLabel } from './i18n/strings'
export type {
  AccessBadgeMode,
  AccessMode,
  MemberAssignment,
  OrgMember,
  Permission,
  RolePreset,
} from './types'
export { resolveAccessBadgeMode } from './utils/accessBadge'
export {
  accessControlSectionPath,
  accessControlSectionFromPath,
  isAccessControlPath,
  navigateAccessControlSection,
  type AccessControlSection,
} from './utils/routing'
export {
  buildInitialChildMembersForAccessMode,
  buildInitialMembersForAccessMode,
  buildInitialZoneMembersForAccessMode,
  buildSharedSpaceMembers,
} from './utils/memberInit'
