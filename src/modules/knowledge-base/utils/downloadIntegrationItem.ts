import type { AppLocale } from '../../../i18n/homeStrings'
import { kbIntegrationProviderLabel } from '../i18n/strings'
import type { KnowledgeBaseIntegrationItem } from '../types'

export function downloadKnowledgeBaseIntegrationItem(
  item: KnowledgeBaseIntegrationItem,
  kbName: string,
  locale: AppLocale,
): void {
  const fileName = locale === 'zh' ? item.nameZh : item.nameEn
  const provider = kbIntegrationProviderLabel(locale, item.provider)
  const content =
    locale === 'zh'
      ? [
          '集成内容导出（演示）',
          `知识库：${kbName}`,
          `来源：${provider}`,
          `内容：${fileName}`,
          `大小：${item.sizeLabel}`,
          `更新于：${item.updatedAt}`,
          '',
          '实际环境中此处为源系统中的原始内容。',
        ].join('\n')
      : [
          'Integration content export (demo)',
          `Knowledge base: ${kbName}`,
          `Source: ${provider}`,
          `Item: ${fileName}`,
          `Size: ${item.sizeLabel}`,
          `Updated: ${item.updatedAt}`,
          '',
          'In production this would be the original content from the source system.',
        ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
