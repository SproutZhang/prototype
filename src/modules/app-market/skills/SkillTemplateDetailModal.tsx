import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketProductLineLabel, appMarketT } from '../i18n/strings'
import type { AppMarketItem } from '../shared/types'

type SkillTemplateFileNode = {
  id: string
  name: string
  kind: 'file' | 'folder'
  content?: string
  children?: SkillTemplateFileNode[]
}

type SkillTemplateDetailModalProps = {
  locale: AppLocale
  items: AppMarketItem[]
  initialItem: AppMarketItem
  isInstalled: (id: string) => boolean
  onClose: () => void
  onInstall: (item: AppMarketItem) => void
}

const MODAL_TEXT = {
  zh: {
    searchSkills: '搜索技能模板',
    filterSkills: '筛选技能模板',
    skillsNav: 'Skills 模板库',
    filesPaneLabel: '该技能模板文件列表',
    previewFile: '预览',
    editFile: '编辑',
    downloadFile: '下载文件',
    latestVersion: '最新版本',
    latestMeta: '基于应用市场模板生成的演示文件结构',
    latestVersionMeta: '可直接作为 SKILL.md、引用文档与脚本起点',
    marketBack: '返回应用市场',
    pluginToolsEmpty: '暂无关联插件工具',
  },
  en: {
    searchSkills: 'Search skill templates',
    filterSkills: 'Filter skill templates',
    skillsNav: 'Skills Templates',
    filesPaneLabel: 'Skill template files',
    previewFile: 'Preview',
    editFile: 'Edit',
    downloadFile: 'Download file',
    latestVersion: 'Latest version',
    latestMeta: 'Demo file structure generated from marketplace template',
    latestVersionMeta: 'Ready to use as a starting point for SKILL.md, references, and scripts',
    marketBack: 'Back to marketplace',
    pluginToolsEmpty: 'No plugin tools linked',
  },
} as const

function collectFolderIds(nodes: SkillTemplateFileNode[]): string[] {
  return nodes.flatMap((node) =>
    node.kind === 'folder' ? [node.id, ...(node.children ? collectFolderIds(node.children) : [])] : [],
  )
}

function findFirstFileId(nodes: SkillTemplateFileNode[]): string | null {
  for (const node of nodes) {
    if (node.kind === 'file') return node.id
    if (node.children?.length) {
      const nested = findFirstFileId(node.children)
      if (nested) return nested
    }
  }
  return null
}

function findFileById(
  nodes: SkillTemplateFileNode[],
  targetId: string,
  ancestors: string[] = [],
): { node: SkillTemplateFileNode; path: string[] } | null {
  for (const node of nodes) {
    const nextPath = [...ancestors, node.name]
    if (node.id === targetId) return { node, path: nextPath }
    if (node.children?.length) {
      const nested = findFileById(node.children, targetId, nextPath)
      if (nested) return nested
    }
  }
  return null
}

function parseYamlFrontmatter(source: string): { metadata: Array<{ key: string; value: string }>; body: string } {
  const normalized = source.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return { metadata: [], body: normalized }
  const endIndex = normalized.indexOf('\n---\n', 4)
  if (endIndex === -1) return { metadata: [], body: normalized }
  const rawFrontmatter = normalized.slice(4, endIndex)
  const metadata = rawFrontmatter
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) return { key: line, value: '' }
      return {
        key: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      }
    })
  return { metadata, body: normalized.slice(endIndex + 5) }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`strong-${index}`}>{part.slice(2, -2)}</strong>
    }
    if (/^`[^`]+`$/.test(part)) {
      return <code key={`code-${index}`}>{part.slice(1, -1)}</code>
    }
    return <span key={`text-${index}`}>{part}</span>
  })
}

function isTableSeparator(line: string) {
  const normalized = line.replace(/\|/g, '').trim()
  return /^:?-{3,}:?$/.test(normalized) || /^(:?-{3,}:?\s+)+:?-{3,}:?$/.test(line.trim())
}

function renderMarkdownDocument(source: string): ReactNode[] {
  const { metadata, body } = parseYamlFrontmatter(source)
  const lines = body.split('\n')
  const nodes: ReactNode[] = []
  let index = 0

  if (metadata.length > 0) {
    nodes.push(
      <div key="meta" className="skills-md-meta-table-wrap">
        <table className="skills-md-meta-table">
          <tbody>
            {metadata.map((item) => (
              <tr key={item.key}>
                <th>{item.key}</th>
                <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )
  }

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      nodes.push(
        <div key={`code-${index}`} className="skills-md-code-block">
          {lang ? (
            <div className="skills-md-code-bar">
              <div className="skills-md-code-lang">{lang}</div>
              <span />
            </div>
          ) : null}
          <pre>{codeLines.join('\n')}</pre>
        </div>,
      )
      continue
    }

    if (/^---+$/.test(trimmed)) {
      nodes.push(<hr key={`hr-${index}`} className="skills-md-divider" />)
      index += 1
      continue
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      nodes.push(
        <blockquote key={`quote-${index}`} className="skills-md-quote">
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`${index}-quote-${quoteIndex}`}>{renderInlineMarkdown(quoteLine)}</p>
          ))}
        </blockquote>,
      )
      continue
    }

    if (trimmed.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      const headerCells = trimmed
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
      const rowLines: string[] = []
      index += 2
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rowLines.push(lines[index])
        index += 1
      }
      nodes.push(
        <div key={`table-${index}`} className="skills-md-table-wrap">
          <table className="skills-md-table">
            <thead>
              <tr>
                {headerCells.map((cell, headerIndex) => (
                  <th key={`${cell}-${headerIndex}`}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowLines.map((row, rowIndex) => {
                const cells = row
                  .split('|')
                  .map((cell) => cell.trim())
                  .filter(Boolean)
                return (
                  <tr key={`row-${rowIndex}`}>
                    {cells.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const children = renderInlineMarkdown(headingMatch[2])
      if (level === 1) {
        nodes.push(
          <h1 key={`heading-${index}`} className="skills-md-heading skills-md-heading--h1">
            {children}
          </h1>,
        )
      } else if (level === 2) {
        nodes.push(
          <h2 key={`heading-${index}`} className="skills-md-heading skills-md-heading--h2">
            {children}
          </h2>,
        )
      } else {
        nodes.push(
          <h3 key={`heading-${index}`} className="skills-md-heading skills-md-heading--h3">
            {children}
          </h3>,
        )
      }
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      nodes.push(
        <ul key={`list-${index}`} className="skills-md-list">
          {items.map((item, itemIndex) => (
            <li key={`item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    const paragraphLines: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^---+$/.test(lines[index].trim()) &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !(lines[index].includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim()))
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    nodes.push(
      <p key={`p-${index}`} className="skills-md-paragraph">
        {renderInlineMarkdown(paragraphLines.join(' '))}
      </p>,
    )
  }

  return nodes
}

function skillTemplateSlug(item: AppMarketItem) {
  return item.nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || item.id
}

function buildSkillSpecificFileTree(
  item: AppMarketItem,
  locale: AppLocale,
  args: {
    name: string
    description: string
    slug: string
    skillMd: string
    pluginMd: string
    overviewMd: string
  },
): SkillTemplateFileNode[] {
  const { name, description, slug, skillMd, pluginMd, overviewMd } = args
  const zh = locale === 'zh'

  const file = (idSuffix: string, name: string, content: string): SkillTemplateFileNode => ({
    id: `${item.id}-${idSuffix}`,
    name,
    kind: 'file',
    content,
  })

  const folder = (idSuffix: string, name: string, children: SkillTemplateFileNode[]): SkillTemplateFileNode => ({
    id: `${item.id}-${idSuffix}`,
    name,
    kind: 'folder',
    children,
  })

  switch (item.id) {
    case 'onboarding-guide-skill':
      return [
        file(
          'skill-md',
          'SKILL.md',
          `---
name: ${slug}
scenario: onboarding
---

# ${name}

## Purpose
${description}

## Workflow
- ${zh ? '引导员工逐步完成材料提交与确认' : 'Guide employees through submission and checkpoints'}
- ${zh ? '识别缺件并提供补交流程' : 'Detect missing items and provide recovery guidance'}
- ${zh ? '输出统一话术与下一步提醒' : 'Return standardized prompts and next-step reminders'}
`,
        ),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'missing-item-playbook-md',
            'missing-item-playbook.md',
            `# ${zh ? '缺件补交流程' : 'Missing Item Playbook'}\n\n- ${zh ? '识别缺件类型' : 'Identify missing item types'}\n- ${zh ? '给出补交链接与截止时间' : 'Provide upload links and deadlines'}\n- ${zh ? '必要时升级提醒 HR' : 'Escalate to HR when needed'}`,
          ),
          file('plugin-tools-md', 'plugin-tools.md', pluginMd),
        ]),
        folder('prompts', 'prompts', [
          file(
            'employee-followup-md',
            'employee-followup.md',
            `# ${zh ? '员工跟进话术' : 'Employee Follow-up Prompt'}\n\n${zh ? '请确认以下材料是否已经补交，并说明预计完成时间。' : 'Confirm whether the missing items have been submitted and share the expected completion time.'}`,
          ),
        ]),
        folder('scripts', 'scripts', [
          file(
            'submission-followup-py',
            'submission_followup.py',
            `def build_followup(payload: dict) -> dict:\n    return {"skill": "${slug}", "mode": "followup", "payload": payload}\n`,
          ),
        ]),
      ]

    case 'notification-tracking-skill':
      return [
        file(
          'skill-md',
          'SKILL.md',
          `---
name: ${slug}
scenario: notification-tracking
---

# ${name}

## Purpose
${description}

## Workflow
- ${zh ? '收集节点状态与 SLA' : 'Collect workflow states and SLA'}
- ${zh ? '生成提醒消息与升级判断' : 'Generate reminders and escalation decisions'}
- ${zh ? '同步责任人与时间线摘要' : 'Sync owners and timeline summaries'}
`,
        ),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'sla-matrix-md',
            'sla-matrix.md',
            `# SLA Matrix\n\n| ${zh ? '节点' : 'Step'} | ${zh ? '提醒时间' : 'Reminder'} |\n| --- | --- |\n| ${zh ? '首次提醒' : 'First reminder'} | T+1 |\n| ${zh ? '升级提醒' : 'Escalation'} | T+3 |`,
          ),
        ]),
        folder('automation', 'automation', [
          file(
            'reminder-scheduler-py',
            'reminder_scheduler.py',
            `def schedule_reminders(records: list[dict]) -> list[dict]:\n    return [{"skill": "${slug}", "record_count": len(records)}]\n`,
          ),
          file(
            'escalation-router-py',
            'escalation_router.py',
            `def route_escalation(record: dict) -> dict:\n    return {"skill": "${slug}", "record": record, "route": "manager"}\n`,
          ),
        ]),
      ]

    case 'hr-provisioning-skill':
      return [
        file('SKILL-md', 'SKILL.md', `# ${name}\n\n${description}\n\n## ${zh ? '能力边界' : 'Boundaries'}\n- ${zh ? '协调 IT 与 HR 开通事项' : 'Coordinate IT and HR provisioning'}\n- ${zh ? '生成员工可读摘要' : 'Generate employee-friendly summaries'}\n`),
        folder('configs', 'configs', [
          file(
            'access-matrix-md',
            'access-matrix.md',
            `# ${zh ? '权限矩阵' : 'Access Matrix'}\n\n${zh ? '用于映射岗位、系统与默认权限。' : 'Maps roles, systems, and default access.'}`,
          ),
          file(
            'approval-handbook-md',
            'approval-handbook.md',
            `# ${zh ? '审批手册' : 'Approval Handbook'}\n\n${zh ? '整理审批顺序、阻塞条件与升级路径。' : 'Documents approval order, blockers, and escalation paths.'}`,
          ),
        ]),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file('plugin-tools-md', 'plugin-tools.md', pluginMd),
        ]),
        folder('scripts', 'scripts', [
          file(
            'provision-summary-py',
            'provision_summary.py',
            `def build_provision_summary(payload: dict) -> dict:\n    return {"skill": "${slug}", "summary": payload}\n`,
          ),
        ]),
      ]

    case 'document-checklist-skill':
      return [
        file('skill-md', 'SKILL.md', `# ${name}\n\n${description}\n\n## ${zh ? '适用场景' : 'Use cases'}\n- ${zh ? '岗位材料核对' : 'Role-based document checks'}\n- ${zh ? '地区合规补件' : 'Region-specific compliance follow-up'}\n`),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'region-rules-md',
            'region-rules.md',
            `# ${zh ? '地区规则' : 'Region Rules'}\n\n${zh ? '按地区维护不同的材料必填项。' : 'Maintain required documents by region.'}`,
          ),
          file(
            'missing-doc-templates-md',
            'missing-doc-templates.md',
            `# ${zh ? '缺件通知模板' : 'Missing Document Templates'}\n\n${zh ? '包含标准催办与补交通知。' : 'Standard nudges and upload reminders.'}`,
          ),
        ]),
        folder('scripts', 'scripts', [
          file(
            'checklist-parser-py',
            'checklist_parser.py',
            `def parse_document_checklist(payload: dict) -> dict:\n    return {"skill": "${slug}", "checked": True, "payload": payload}\n`,
          ),
        ]),
      ]

    case 'approval-routing-skill':
      return [
        file('skill-md', 'SKILL.md', `# ${name}\n\n${description}\n\n## ${zh ? '输出物' : 'Outputs'}\n- ${zh ? '审批摘要' : 'Approval summary'}\n- ${zh ? '路由建议' : 'Routing suggestion'}\n- ${zh ? '升级路径' : 'Escalation path'}\n`),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'approval-matrix-md',
            'approval-matrix.md',
            `# ${zh ? '审批矩阵' : 'Approval Matrix'}\n\n${zh ? '定义不同风险等级对应的审批角色。' : 'Maps risk levels to approvers.'}`,
          ),
        ]),
        folder('prompts', 'prompts', [
          file(
            'approver-brief-md',
            'approver-brief.md',
            `# ${zh ? '审批人摘要模板' : 'Approver Brief Template'}\n\n${zh ? '输出背景、风险、建议路由与决策点。' : 'Provide context, risks, route suggestions, and decision points.'}`,
          ),
        ]),
        folder('scripts', 'scripts', [
          file(
            'route-builder-py',
            'route_builder.py',
            `def build_route(payload: dict) -> dict:\n    return {"skill": "${slug}", "route": "approval-chain", "payload": payload}\n`,
          ),
        ]),
      ]

    case 'training-checkin-skill':
      return [
        file('skill-md', 'SKILL.md', `# ${name}\n\n${description}\n\n## Workflow\n- ${zh ? '安排培训节奏' : 'Coordinate the training schedule'}\n- ${zh ? '提醒签到与未完成节点' : 'Nudge check-ins and pending items'}\n- ${zh ? '汇总缺席原因' : 'Summarize absence reasons'}\n`),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'attendance-policy-md',
            'attendance-policy.md',
            `# ${zh ? '签到策略' : 'Attendance Policy'}\n\n${zh ? '定义签到窗口、催办节奏和缺席处理。' : 'Defines check-in windows, reminder cadence, and absence handling.'}`,
          ),
        ]),
        folder('calendar', 'calendar', [
          file(
            'training-schedule-md',
            'training-schedule.md',
            `# ${zh ? '培训排期' : 'Training Schedule'}\n\n${zh ? '用于维护培训日历与签到时间。' : 'Maintains training calendar and attendance checkpoints.'}`,
          ),
        ]),
        folder('scripts', 'scripts', [
          file(
            'attendance-nudge-py',
            'attendance_nudge.py',
            `def send_training_nudge(payload: dict) -> dict:\n    return {"skill": "${slug}", "nudge_sent": True, "payload": payload}\n`,
          ),
        ]),
      ]

    case 'crm-handoff-skill':
      return [
        file('skill-md', 'SKILL.md', `# ${name}\n\n${description}\n\n## Workflow\n- ${zh ? '整理线索背景与交接原因' : 'Package lead context and handoff rationale'}\n- ${zh ? '输出下一步动作与风险提醒' : 'Return next actions and risk flags'}\n`),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'handoff-template-md',
            'handoff-template.md',
            `# ${zh ? '交接模板' : 'Handoff Template'}\n\n${zh ? '包含客户背景、当前状态、下一步动作。' : 'Includes account context, current state, and next actions.'}`,
          ),
          file('plugin-tools-md', 'plugin-tools.md', pluginMd),
        ]),
        folder('crm', 'crm', [
          file(
            'risk-signals-md',
            'risk-signals.md',
            `# ${zh ? '风险信号' : 'Risk Signals'}\n\n${zh ? '追踪成交风险、沉默时长与高优先级客户。' : 'Tracks churn risks, silence windows, and priority accounts.'}`,
          ),
        ]),
        folder('scripts', 'scripts', [
          file(
            'crm-brief-builder-py',
            'crm_brief_builder.py',
            `def build_crm_handoff(payload: dict) -> dict:\n    return {"skill": "${slug}", "brief": payload}\n`,
          ),
        ]),
      ]

    case 'web-research-skill':
      return [
        file('skill-md', 'SKILL.md', `# ${name}\n\n${description}\n\n## Workflow\n- ${zh ? '抓取公开网页与来源信息' : 'Collect public web pages and source data'}\n- ${zh ? '归纳要点并标注引用来源' : 'Summarize key points with citations'}\n`),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file(
            'source-evaluation-md',
            'source-evaluation.md',
            `# ${zh ? '来源评估准则' : 'Source Evaluation'}\n\n${zh ? '定义可信度、时效性与引用要求。' : 'Defines trust, freshness, and citation requirements.'}`,
          ),
          file(
            'summary-format-md',
            'summary-format.md',
            `# ${zh ? '摘要格式' : 'Summary Format'}\n\n${zh ? '说明结构化摘要的段落与引用格式。' : 'Describes structured summary sections and citation format.'}`,
          ),
        ]),
        folder('scripts', 'scripts', [
          file(
            'web-digest-py',
            'web_digest.py',
            `def build_web_digest(payload: dict) -> dict:\n    return {"skill": "${slug}", "digest": payload}\n`,
          ),
        ]),
      ]

    default:
      return [
        file('skill-md', 'SKILL.md', skillMd),
        folder('references', 'references', [
          file('overview-md', 'overview.md', overviewMd),
          file('plugin-tools-md', 'plugin-tools.md', pluginMd),
        ]),
        folder('scripts', 'scripts', [
          file(
            'run-skill-py',
            'run_skill.py',
            `def run_skill(payload: dict) -> dict:\n    return {"skill": "${slug}", "payload": payload}\n`,
          ),
        ]),
      ]
  }
}

function buildSkillTemplateFiles(item: AppMarketItem, locale: AppLocale): SkillTemplateFileNode[] {
  const name = locale === 'zh' ? item.nameZh : item.nameEn
  const description = locale === 'zh' ? (item.modalDescriptionZh ?? item.descriptionZh) : (item.modalDescriptionEn ?? item.descriptionEn)
  const pluginTools = locale === 'zh' ? (item.pluginToolsZh ?? []) : (item.pluginToolsEn ?? item.pluginToolsZh ?? [])
  const productLine = appMarketProductLineLabel(locale, item.productLine)
  const slug = skillTemplateSlug(item)
  const pluginSummary =
    pluginTools.length > 0
      ? pluginTools.map((tool) => `- ${tool}`).join('\n')
      : locale === 'zh'
        ? '- 暂无关联插件工具'
        : '- No linked plugin tools'

  const skillMd = `---
name: ${slug}
publisher: ${item.publisher}
product_line: ${productLine}
rating: ${item.rating.toFixed(1)}
installs: ${item.installs}
---

# ${name}

## Purpose
${description}

## When to use
- ${locale === 'zh' ? `当你需要复用「${name}」的领域能力与话术时使用。` : `Use when you need reusable domain know-how from "${name}".`}
- ${locale === 'zh' ? '适合子代理执行、工作流节点处理与模板化输出。' : 'Useful for sub-agents, workflow steps, and templated outputs.'}

## Plugin tools
${pluginSummary}

## Workflow
- ${locale === 'zh' ? '识别用户意图与当前任务上下文' : 'Clarify the user intent and workflow context'}
- ${locale === 'zh' ? '调用相关插件工具收集信息或执行动作' : 'Use linked plugin tools to gather information or take action'}
- ${locale === 'zh' ? '按照模板结构输出结果与下一步建议' : 'Return structured output with clear next-step guidance'}
`

  const overviewMd = `# ${name}

## Summary
${description}

## Marketplace metadata
| Field | Value |
| --- | --- |
| Publisher | ${item.publisher} |
| Rating | ${item.rating.toFixed(1)} |
| Installs | ${item.installs} |
| Category | ${productLine} |
`

  const pluginMd = `# Plugin Tools

${pluginTools.length > 0 ? pluginSummary : locale === 'zh' ? '当前模板未绑定插件工具。' : 'This template has no linked plugin tools.'}
`

  const customizedTree = buildSkillSpecificFileTree(item, locale, {
    name,
    description,
    slug,
    skillMd,
    pluginMd,
    overviewMd,
  })

  return customizedTree
}

export function SkillTemplateDetailModal({
  locale,
  items,
  initialItem,
  isInstalled,
  onClose,
  onInstall,
}: SkillTemplateDetailModalProps) {
  const text = MODAL_TEXT[locale]
  const [selectedSkillId, setSelectedSkillId] = useState(initialItem.id)
  const [search, setSearch] = useState('')
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [fileViewMode, setFileViewMode] = useState<'preview' | 'edit'>('preview')
  const [editorActiveLine, setEditorActiveLine] = useState(1)
  const [editorScrollTop, setEditorScrollTop] = useState(0)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set())
  const [draftFileContents, setDraftFileContents] = useState<Record<string, string>>({})

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) =>
      [item.nameZh, item.nameEn, item.descriptionZh, item.descriptionEn, item.publisher].join(' ').toLowerCase().includes(query),
    )
  }, [items, search])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedSkillId) ?? initialItem,
    [initialItem, items, selectedSkillId],
  )
  const files = useMemo(() => buildSkillTemplateFiles(selectedItem, locale), [locale, selectedItem])
  const selectedFile = useMemo(() => (selectedFileId ? findFileById(files, selectedFileId) : null), [files, selectedFileId])
  const selectedFileContent = selectedFile ? (draftFileContents[selectedFile.node.id] ?? selectedFile.node.content ?? '') : ''
  const editorLineCount = Math.max(1, selectedFileContent.split('\n').length)
  const selectedFileIsMarkdown = selectedFile ? /\.md$/i.test(selectedFile.path[selectedFile.path.length - 1] ?? '') : true
  const selectedPluginTools = locale === 'zh' ? (selectedItem.pluginToolsZh ?? []) : (selectedItem.pluginToolsEn ?? selectedItem.pluginToolsZh ?? [])
  const iconStyle = {
    '--agent-icon-from': selectedItem.iconFrom,
    '--agent-icon-via': selectedItem.iconFrom,
    '--agent-icon-to': selectedItem.iconTo,
    '--agent-icon-shadow': 'rgba(91, 124, 255, 0.24)',
  } as CSSProperties

  useEffect(() => {
    setExpandedFolderIds(new Set(collectFolderIds(files)))
    setSelectedFileId(findFirstFileId(files))
    setFileViewMode('preview')
    setEditorActiveLine(1)
    setEditorScrollTop(0)
  }, [files, selectedItem.id])

  const handleDownloadSelectedFile = () => {
    if (!selectedFile) return
    const fileName = selectedFile.path[selectedFile.path.length - 1] ?? 'skill-template.txt'
    const blob = new Blob([selectedFileContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderSkillFiles = (nodes: SkillTemplateFileNode[], depth = 0): ReactNode[] =>
    nodes.flatMap((node) => {
      const isFolder = node.kind === 'folder'
      const isExpanded = isFolder ? expandedFolderIds.has(node.id) : false
      const isActive = !isFolder && selectedFileId === node.id

      const row = isFolder ? (
        <button
          key={node.id}
          type="button"
          className="skills-config-file-row is-folder"
          style={{ paddingLeft: `${12 + depth * 18}px` }}
          onClick={() => {
            setExpandedFolderIds((current) => {
              const next = new Set(current)
              if (next.has(node.id)) next.delete(node.id)
              else next.add(node.id)
              return next
            })
          }}
        >
          <span className={isExpanded ? 'skills-config-file-caret is-expanded' : 'skills-config-file-caret'} aria-hidden="true">
            <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
              <path d="M5 3.5 10 8 5 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="skills-config-file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l1.6 1.8H18A2.5 2.5 0 0 1 20.5 9.3v7.2A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="skills-config-file-name">{node.name}</span>
        </button>
      ) : (
        <button
          key={node.id}
          type="button"
          className={isActive ? 'skills-config-file-row is-file-active' : 'skills-config-file-row'}
          style={{ paddingLeft: `${12 + depth * 18}px` }}
          onClick={() => {
            setSelectedFileId(node.id)
            setFileViewMode('preview')
          }}
        >
          <span className="skills-config-file-caret" aria-hidden="true" />
          <span className="skills-config-file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path
                d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M14 3.5V8h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="skills-config-file-name">{node.name}</span>
        </button>
      )

      if (isFolder && node.children?.length && isExpanded) {
        return [row, ...renderSkillFiles(node.children, depth + 1)]
      }
      return [row]
    })

  return (
    <div className="app-market-skill-detail-modal-root" role="presentation">
      <button type="button" className="app-market-skill-detail-modal-backdrop" aria-label={appMarketT(locale, 'detailClose')} onClick={onClose} />
      <div className="app-market-skill-detail-modal-panel" role="dialog" aria-modal="true" aria-label={locale === 'zh' ? selectedItem.nameZh : selectedItem.nameEn}>
        <div className="app-market-skill-detail-modal-header">
          <div className="app-market-skill-detail-modal-title-wrap">
            <div className="app-market-skill-detail-modal-title">{locale === 'zh' ? selectedItem.nameZh : selectedItem.nameEn}</div>
            <div className="app-market-skill-detail-modal-subtitle">{appMarketProductLineLabel(locale, selectedItem.productLine)}</div>
          </div>
          <button type="button" className="app-market-tool-detail-modal-close" aria-label={appMarketT(locale, 'detailClose')} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="app-market-skill-detail-modal-body">
          <div className="skills-config-shell app-market-skill-detail-shell">
            <aside className="skills-config-sidebar">
              <button type="button" className="skills-config-back-link" aria-label={text.marketBack} title={text.marketBack} onClick={onClose}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{appMarketT(locale, 'backToMarket')}</span>
              </button>
              <div className="skills-config-search-row">
                <label className="sr-only" htmlFor="app-market-skill-search-input">
                  {text.searchSkills}
                </label>
                <div className="skills-config-search">
                  <span className="skills-config-search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M16.8 16.8 21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="app-market-skill-search-input"
                    type="text"
                    placeholder={text.searchSkills}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <button type="button" className="skills-config-filter-btn" aria-label={text.filterSkills} title={text.filterSkills}>
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M4 7h16l-6 7v4l-4 2v-6L4 7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="skills-config-sidebar-label">{text.skillsNav}</div>
              <div className="skills-config-sidebar-list">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === selectedItem.id ? 'skills-config-sidebar-item is-active' : 'skills-config-sidebar-item'}
                    onClick={() => setSelectedSkillId(item.id)}
                  >
                    <span className="skills-config-sidebar-item-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path d="M8 4h7l5 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor" opacity="0.18" />
                        <path d="M8 4h7l5 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{locale === 'zh' ? item.nameZh : item.nameEn}</span>
                  </button>
                ))}
              </div>
            </aside>

            <aside className="skills-config-files-pane" aria-label={text.filesPaneLabel}>
              <div className="skills-config-files-head">
                <div className="skills-config-files-avatar app-market-skill-detail-avatar agent-card-icon-grad" style={iconStyle} aria-hidden="true" />
                <div className="skills-config-files-head-main">
                  <div className="skills-config-files-title">{locale === 'zh' ? selectedItem.nameZh : selectedItem.nameEn}</div>
                  <div className="skills-config-files-meta">{text.latestMeta}</div>
                </div>
              </div>
              <div className="skills-config-files-version">
                <div className="skills-config-files-version-title">{text.latestVersion}</div>
                <div className="skills-config-files-version-meta">
                  {selectedPluginTools.length > 0 ? selectedPluginTools.join(' / ') : text.pluginToolsEmpty}
                </div>
              </div>
              <div className="skills-config-files-tree">{renderSkillFiles(files)}</div>
            </aside>

            <main className="skills-config-detail">
              <div className="skills-config-detail-filebar app-market-skill-detail-filebar">
                <div className="skills-config-detail-filepath">
                  {selectedFile ? selectedFile.path.join('/') : files[0]?.name ?? 'SKILL.md'}
                </div>
                <div className="skills-config-detail-filebar-actions is-right app-market-skill-detail-filebar-actions">
                  <button
                    type="button"
                    className="skills-config-download-btn"
                    aria-label={text.downloadFile}
                    title={text.downloadFile}
                    onClick={handleDownloadSelectedFile}
                    disabled={!selectedFile}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M12 4v10M8 10l4 4 4-4M5 18h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={isInstalled(selectedItem.id) ? 'agents-btn' : 'agents-btn agents-btn-primary'}
                    disabled={isInstalled(selectedItem.id)}
                    onClick={() => onInstall(selectedItem)}
                  >
                    {isInstalled(selectedItem.id) ? appMarketT(locale, 'installed') : appMarketT(locale, 'install')}
                  </button>
                </div>
              </div>

              <div className="skills-config-preview-section">
                <div className="skills-config-preview-card app-market-skill-detail-preview-card">
                  {selectedFile ? (
                    fileViewMode === 'preview' ? (
                      selectedFileIsMarkdown ? (
                        <div className="skills-config-markdown-doc is-readonly">{renderMarkdownDocument(selectedFileContent)}</div>
                      ) : (
                        <pre className="skills-config-preview-content is-readonly">{selectedFileContent}</pre>
                      )
                    ) : (
                      <div className="skills-config-editor-shell">
                        <div className="skills-config-editor-gutter" style={{ transform: `translateY(-${editorScrollTop}px)` }} aria-hidden="true">
                          {Array.from({ length: editorLineCount }, (_, index) => (
                            <div
                              key={`line-${index + 1}`}
                              className={index + 1 === editorActiveLine ? 'skills-config-editor-line-number is-active' : 'skills-config-editor-line-number'}
                            >
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        <div className="skills-config-editor-main">
                          <div
                            className="skills-config-editor-active-line"
                            style={{ transform: `translateY(${(editorActiveLine - 1) * 26 - editorScrollTop}px)` }}
                            aria-hidden="true"
                          />
                          <textarea
                            className="skills-config-editor"
                            value={selectedFileContent}
                            onChange={(event) => setDraftFileContents((current) => ({ ...current, [selectedFile.node.id]: event.target.value }))}
                            onClick={(event) => {
                              const value = event.currentTarget.value
                              const cursor = event.currentTarget.selectionStart ?? 0
                              setEditorActiveLine(value.slice(0, cursor).split('\n').length)
                            }}
                            onKeyUp={(event) => {
                              const value = event.currentTarget.value
                              const cursor = event.currentTarget.selectionStart ?? 0
                              setEditorActiveLine(value.slice(0, cursor).split('\n').length)
                            }}
                            onSelect={(event) => {
                              const value = event.currentTarget.value
                              const cursor = event.currentTarget.selectionStart ?? 0
                              setEditorActiveLine(value.slice(0, cursor).split('\n').length)
                            }}
                            onScroll={(event) => setEditorScrollTop(event.currentTarget.scrollTop)}
                            spellCheck={false}
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="skills-config-markdown-doc is-readonly">{renderMarkdownDocument(selectedFileContent)}</div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
