export type ApiKeyStatus = 'active' | 'disabled'

export type ApiKeyRow = {
  id: string
  name: string
  description: string
  /** 完整密钥（演示态本地存储，列表仅展示掩码） */
  secretToken: string
  status: ApiKeyStatus
  createdAt: string
  lastUsedAt: string | null
  createdBy: string
}

export function maskApiKeyToken(token: string): string {
  if (token.length <= 16) return token
  return `${token.slice(0, 12)}${'•'.repeat(12)}${token.slice(-4)}`
}

export function generateApiKeyToken(): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `sk-studiox-${random}${Date.now().toString(36).slice(-4)}`
}

export const API_KEYS_SEED: ApiKeyRow[] = [
  {
    id: 'api-key-1',
    name: '生产环境 Agent 调用',
    description: '供线上 Agent 编排与工作流回调使用',
    secretToken: 'sk-studiox-prod8k2m9x4a1',
    status: 'active',
    createdAt: '2026-03-12T08:30:00+08:00',
    lastUsedAt: '2026-06-20T14:22:00+08:00',
    createdBy: 'admin@studiox.com',
  },
  {
    id: 'api-key-2',
    name: '数据分析导出',
    description: 'BI 报表定时拉取成员与权限快照',
    secretToken: 'sk-studiox-analytics7f3b2',
    status: 'active',
    createdAt: '2026-04-05T11:15:00+08:00',
    lastUsedAt: '2026-06-18T09:40:00+08:00',
    createdBy: 'admin@studiox.com',
  },
  {
    id: 'api-key-3',
    name: '旧版集成（已停用）',
    description: 'Legacy webhook，计划下月移除',
    secretToken: 'sk-studiox-legacy5c8d1',
    status: 'disabled',
    createdAt: '2025-11-20T16:00:00+08:00',
    lastUsedAt: '2026-02-10T18:05:00+08:00',
    createdBy: 'admin@studiox.com',
  },
]
