import type { AppLocale } from '../../../i18n/homeStrings'

export type ConnectorOAuthScopeDef = {
  id: string
  labelZh: string
  labelEn: string
  /** Demo default: switch on when the configure modal opens */
  defaultEnabled?: boolean
  /** Demo: scope row cannot be toggled */
  switchDisabled?: boolean
}

export type ConnectorOAuthActionDef = {
  id: string
  labelZh: string
  labelEn: string
}

const JIRA_OAUTH_SCOPES: ConnectorOAuthScopeDef[] = [
  { id: 'manage-jira-config', labelZh: '管理: jira 配置', labelEn: 'Manage: jira configuration', defaultEnabled: true },
  { id: 'manage-jira-data-provider', labelZh: '管理: jira 数据提供程序', labelEn: 'Manage: jira data provider', defaultEnabled: false },
  { id: 'manage-jira-project', labelZh: '管理: jira 项目', labelEn: 'Manage: jira project', defaultEnabled: true },
  {
    id: 'manage-jira-webhook',
    labelZh: '管理: jira-webhook',
    labelEn: 'Manage: jira-webhook',
    defaultEnabled: false,
    switchDisabled: true,
  },
  { id: 'offline-access', labelZh: '离线访问', labelEn: 'Offline access', defaultEnabled: true },
  { id: 'read-jira-user', labelZh: '读取: jira-user', labelEn: 'Read: jira-user', defaultEnabled: false },
  { id: 'read-jira-work', labelZh: '阅读: jira-work', labelEn: 'Read: jira-work', defaultEnabled: true },
  {
    id: 'write-jira-work',
    labelZh: '写: jira-work',
    labelEn: 'Write: jira-work',
    defaultEnabled: true,
    switchDisabled: true,
  },
]

const JIRA_OAUTH_ACTIONS: ConnectorOAuthActionDef[] = [
  { id: 'add-attachment', labelZh: '添加问题附件', labelEn: 'Add issue attachments' },
  { id: 'add-comment', labelZh: '添加问题评论', labelEn: 'Add issue comments' },
  { id: 'create-issue', labelZh: '创建问题', labelEn: 'Create issues' },
  { id: 'create-user', labelZh: '创建用户', labelEn: 'Create users' },
  { id: 'get-issue', labelZh: '获取问题', labelEn: 'Get issues' },
  { id: 'get-comment', labelZh: '获取问题评论', labelEn: 'Get issue comments' },
  { id: 'get-subtask', labelZh: '获取问题子任务', labelEn: 'Get issue subtasks' },
  { id: 'get-project', labelZh: '获取项目', labelEn: 'Get projects' },
  { id: 'link-issue', labelZh: '链接 Jira 问题', labelEn: 'Link Jira issues' },
  { id: 'list-issue-types', labelZh: '列出问题类型', labelEn: 'List issue types' },
  { id: 'project-list', labelZh: '项目列表', labelEn: 'Project list' },
  { id: 'search-jql', labelZh: '使用 JQL 搜索工单', labelEn: 'Search tickets using JQL' },
  { id: 'search-users', labelZh: '搜索用户', labelEn: 'Search users' },
  { id: 'update-issue', labelZh: '更新问题', labelEn: 'Update issues' },
]

const DEFAULT_OAUTH_SCOPES: ConnectorOAuthScopeDef[] = [
  { id: 'read', labelZh: '读取数据', labelEn: 'Read data', defaultEnabled: true },
  { id: 'write', labelZh: '写入数据', labelEn: 'Write data', defaultEnabled: false },
  { id: 'offline-access', labelZh: '离线访问', labelEn: 'Offline access', defaultEnabled: true, switchDisabled: true },
  { id: 'manage-config', labelZh: '管理配置', labelEn: 'Manage configuration', defaultEnabled: false },
]

const DEFAULT_OAUTH_ACTIONS: ConnectorOAuthActionDef[] = [
  { id: 'list-resources', labelZh: '列出资源', labelEn: 'List resources' },
  { id: 'read-resource', labelZh: '读取资源', labelEn: 'Read resources' },
  { id: 'create-resource', labelZh: '创建资源', labelEn: 'Create resources' },
  { id: 'update-resource', labelZh: '更新资源', labelEn: 'Update resources' },
  { id: 'delete-resource', labelZh: '删除资源', labelEn: 'Delete resources' },
]

export function getConnectorOAuthScopes(connectionId: string): ConnectorOAuthScopeDef[] {
  return connectionId === 'jira' ? JIRA_OAUTH_SCOPES : DEFAULT_OAUTH_SCOPES
}

export function getConnectorOAuthActions(connectionId: string): ConnectorOAuthActionDef[] {
  return connectionId === 'jira' ? JIRA_OAUTH_ACTIONS : DEFAULT_OAUTH_ACTIONS
}

export function oauthScopeLabel(scope: ConnectorOAuthScopeDef, locale: AppLocale): string {
  return locale === 'zh' ? scope.labelZh : scope.labelEn
}

export function oauthActionLabel(action: ConnectorOAuthActionDef, locale: AppLocale): string {
  return locale === 'zh' ? action.labelZh : action.labelEn
}

export const CONNECTOR_REDIRECT_URI = 'https://www.stackai.com/auth'
