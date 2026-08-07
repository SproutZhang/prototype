import { useSyncExternalStore } from 'react'

import { JoyceAiPanel } from '../../components/shared/JoyceAiPanel'
import { useLocale } from '../../i18n/LocaleContext'
import { AccessControlDemoProvider } from './context/AccessControlDemoProvider'
import { AccessControlDepartmentsPage } from './sections/departments'
import { AccessControlMembersPage } from './sections/members'
import { AccessControlRolesPage } from './sections/roles'
import { AccessControlUsersPage } from './sections/users'
import { AccessControlWorkspacePage } from './sections/workspace'
import { AccessControlAuditLogPage } from './sections/audit-log'
import { AccessControlWorkLogPage } from './sections/work-log'
import { AccessControlApiKeysPage } from './sections/api-keys'
import { AccessControlModelManagementPage } from './sections/model-management'
import './access-control.css'
import { accessControlSectionTitle } from './i18n/strings'
import { accessControlSectionFromPath } from './utils/routing'

function subscribeAccessControlPath(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getAccessControlPathSnapshot() {
  return typeof window !== 'undefined' ? window.location.pathname : '/access-control'
}

/** 访问控制模块入口：按 URL 渲染独立子模块（工作区 / 用户 / 角色 / 部门 / 成员管理 / 审计日志） */
export function AccessControlPage() {
  const { locale } = useLocale()
  const pathname = useSyncExternalStore(
    subscribeAccessControlPath,
    getAccessControlPathSnapshot,
    () => '/access-control',
  )
  const section = accessControlSectionFromPath(pathname)

  return (
    <AccessControlDemoProvider>
      <JoyceAiPanel sectionAriaLabel={accessControlSectionTitle(locale, section)}>
        {section === 'workspace' ? <AccessControlWorkspacePage /> : null}
        {section === 'users' ? <AccessControlUsersPage /> : null}
        {section === 'roles' ? <AccessControlRolesPage /> : null}
        {section === 'departments' ? <AccessControlDepartmentsPage /> : null}
        {section === 'members' ? <AccessControlMembersPage /> : null}
        {section === 'audit-log' ? <AccessControlAuditLogPage /> : null}
        {section === 'work-log' ? <AccessControlWorkLogPage /> : null}
        {section === 'api-keys' ? <AccessControlApiKeysPage /> : null}
        {section === 'model-management' ? <AccessControlModelManagementPage /> : null}
      </JoyceAiPanel>
    </AccessControlDemoProvider>
  )
}
