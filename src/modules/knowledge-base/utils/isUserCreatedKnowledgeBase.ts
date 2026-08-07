import type { KnowledgeBaseItem } from '../types'

/** 用户在本会话中新建的知识库（与种子数据中的「原有」知识库区分） */
export function isUserCreatedKnowledgeBase(item: KnowledgeBaseItem): boolean {
  return item.id.startsWith('kb-custom-')
}
