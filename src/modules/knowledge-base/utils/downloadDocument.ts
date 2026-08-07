import type { AppLocale } from '../../../i18n/homeStrings'
import type { KnowledgeBaseDocument } from '../types'

export function downloadKnowledgeBaseDocument(
  doc: KnowledgeBaseDocument,
  kbName: string,
  locale: AppLocale,
): void {
  const fileName = locale === 'zh' ? doc.nameZh : doc.nameEn
  const content =
    locale === 'zh'
      ? [
          '知识库文档导出（演示）',
          `知识库：${kbName}`,
          `文档：${fileName}`,
          `格式：${doc.format.toUpperCase()}`,
          `大小：${doc.sizeLabel}`,
          `更新于：${doc.updatedAt}`,
          '',
          '实际环境中此处为原始文件内容。',
        ].join('\n')
      : [
          'Knowledge base document export (demo)',
          `Knowledge base: ${kbName}`,
          `Document: ${fileName}`,
          `Format: ${doc.format.toUpperCase()}`,
          `Size: ${doc.sizeLabel}`,
          `Updated: ${doc.updatedAt}`,
          '',
          'In production this would be the original file content.',
        ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
