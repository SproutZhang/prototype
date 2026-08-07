import type { AccessControlSection } from '../utils/routing'

/** 用户版块：暂未开放，先隐藏侧栏入口 */
export const ENABLE_USERS_NAV_SECTION = false

/** 部门管理版块：暂未开放，先隐藏侧栏入口 */
export const ENABLE_DEPARTMENTS_NAV_SECTION = false

export type AccessControlNavSectionConfig = {
  section: AccessControlSection
  labelKey:
    | 'sectionTitleWorkspace'
    | 'sectionTitleUsers'
    | 'sectionTitleRoles'
    | 'sectionTitleDepartments'
    | 'sectionTitleMembers'
    | 'sectionTitleAuditLog'
    | 'sectionTitleApiKeys'
    | 'sectionTitleModelManagement'
  adminOnly?: boolean
}

export const ACCESS_CONTROL_NAV_SECTIONS: readonly AccessControlNavSectionConfig[] = [
  { section: 'workspace', labelKey: 'sectionTitleWorkspace' },
  { section: 'users', labelKey: 'sectionTitleUsers', adminOnly: true },
  { section: 'roles', labelKey: 'sectionTitleRoles' },
  { section: 'departments', labelKey: 'sectionTitleDepartments', adminOnly: true },
  { section: 'members', labelKey: 'sectionTitleMembers' },
  { section: 'audit-log', labelKey: 'sectionTitleAuditLog' },
  { section: 'api-keys', labelKey: 'sectionTitleApiKeys' },
  { section: 'model-management', labelKey: 'sectionTitleModelManagement' },
] as const
