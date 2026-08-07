import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type DragEvent, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'

import { useLocale } from '../../i18n/LocaleContext'
import {
  AGENT_TEMPLATE_CATALOG,
  AgentTemplateDetailModal,
  AgentTemplatesHomeSection,
  AgentTemplatesPage,
} from './agent-templates'
import { APP_MARKET_HOME_PREVIEW_LIMIT } from './constants'
import { filterAppMarketItems } from './shared/filter'
import {
  EMPLOYEE_ONBOARDING_GUIDE_SCENARIO_TEMPLATE_ID,
  SCENARIO_TEMPLATE_CATALOG,
  hasScenarioTemplateDetailModal,
  ScenarioTemplateDetailModal,
  ScenarioTemplatesHomeSection,
  ScenarioTemplatesPage,
} from './scenario-templates'
import {
  SkillTemplateDetailModal,
  SKILLS_CATALOG,
  SkillsHomeSection,
  SkillsPage,
} from './skills'
import { TOOLS_CATALOG, ToolsHomeSection, ToolsPage } from './tools'
import { AppMarketDetailView } from './shared/AppMarketDetailView'
import { AppMarketSearchBar } from './shared/AppMarketSearchBar'
import type {
  AppMarketHomeProductFilter,
  AppMarketItem,
  AppMarketProductLine,
  AppMarketTemplateCategory,
  AppMarketView,
} from './shared/types'
import { appMarketT, type AppMarketStringKey } from './i18n/strings'
import './app-market.css'

type ToolInstallFlowStep = 'connect' | 'credential'
type TemplateImportType = 'agent' | 'scenario' | 'tool' | 'skill'

function getTemplateFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

function isJsonTemplateImportType(importType: TemplateImportType): boolean {
  return importType === 'agent' || importType === 'scenario' || importType === 'tool'
}

function getTemplateImportFileAccept(importType: TemplateImportType | ''): string {
  if (importType === 'skill') return '.zip,.md'
  if (isJsonTemplateImportType(importType as TemplateImportType)) return '.json,application/json'
  return ''
}

function validateTemplateFileExtension(
  file: File,
  importType: TemplateImportType,
): AppMarketStringKey | null {
  const extension = getTemplateFileExtension(file.name)
  if (isJsonTemplateImportType(importType)) {
    return extension === 'json' ? null : 'importFileErrorInvalidJsonExtension'
  }
  if (importType === 'skill') {
    return extension === 'zip' || extension === 'md' ? null : 'importFileErrorInvalidSkillExtension'
  }
  return 'importFileErrorTypeRequired'
}

async function validateTemplateUploadFile(
  file: File,
  importType: TemplateImportType,
): Promise<AppMarketStringKey | null> {
  const extensionError = validateTemplateFileExtension(file, importType)
  if (extensionError) return extensionError

  if (!isJsonTemplateImportType(importType)) return null

  try {
    const text = await file.text()
    JSON.parse(text)
    return null
  } catch {
    return 'importFileErrorInvalidJsonContent'
  }
}

function resolveTemplateUploadDropHint(
  locale: Parameters<typeof appMarketT>[0],
  importType: string,
): string {
  if (importType === 'skill') return appMarketT(locale, 'uploadDropHintSkill')
  if (importType === 'agent' || importType === 'scenario' || importType === 'tool') {
    return appMarketT(locale, 'uploadDropHintJson')
  }
  return appMarketT(locale, 'uploadDropHintSelectType')
}

const IMPORT_SUCCESS_TOAST_KEYS: Record<
  TemplateImportType,
  { title: AppMarketStringKey; sub: AppMarketStringKey }
> = {
  agent: { title: 'importSuccessTitleAgent', sub: 'importSuccessSubAgent' },
  scenario: { title: 'importSuccessTitleScenario', sub: 'importSuccessSubScenario' },
  tool: { title: 'importSuccessTitleTool', sub: 'importSuccessSubTool' },
  skill: { title: 'importSuccessTitleSkill', sub: 'importSuccessSubSkill' },
}

const IMPORT_TYPE_TO_PRODUCT_LINE: Record<TemplateImportType, AppMarketProductLine> = {
  agent: 'agent-templates',
  scenario: 'scenario-templates',
  tool: 'tools',
  skill: 'skills',
}

const DEFAULT_TEMPLATE_CATEGORY_BY_LINE: Record<AppMarketProductLine, AppMarketTemplateCategory> = {
  'agent-templates': 'hr-recruitment',
  'scenario-templates': 'operations',
  tools: 'productivity',
  skills: 'productivity',
}

const TEMPLATE_GRADIENTS = [
  ['#7c3aed', '#2563eb'],
  ['#0f766e', '#14b8a6'],
  ['#ea580c', '#f59e0b'],
  ['#475467', '#98a2b3'],
  ['#db2777', '#8b5cf6'],
] as const

type ImportedScenarioStepBlueprint = {
  idSuffix: string
  titleZh: string
  titleEn: string
  pluginToolsZh: string[]
  pluginToolsEn: string[]
}

type ImportedScenarioBlueprint = {
  category: AppMarketTemplateCategory
  descriptionZh: string
  descriptionEn: string
  modalDescriptionZh: string
  modalDescriptionEn: string
  tagsZh: string[]
  tagsEn: string[]
  steps: ImportedScenarioStepBlueprint[]
}

type ImportedAgentSubAgentBlueprint = {
  idSuffix: string
  nameZh: string
  nameEn: string
  promptZh: string
  promptEn: string
  pluginToolsZh: string[]
  pluginToolsEn: string[]
}

type ImportedAgentBlueprint = {
  category: AppMarketTemplateCategory
  descriptionZh: string
  descriptionEn: string
  modalDescriptionZh: string
  modalDescriptionEn: string
  pluginToolsZh: string[]
  pluginToolsEn: string[]
  subAgents: ImportedAgentSubAgentBlueprint[]
}

type ImportedToolActionBlueprint = {
  id: string
  descriptionZh: string
  descriptionEn: string
}

type ImportedToolBlueprint = {
  category: AppMarketTemplateCategory
  descriptionZh: string
  descriptionEn: string
  modalDescriptionZh: string
  modalDescriptionEn: string
  pluginToolsZh?: string[]
  pluginToolsEn?: string[]
  toolActions: ImportedToolActionBlueprint[]
}

type ImportedSkillBlueprint = {
  category: AppMarketTemplateCategory
  descriptionZh: string
  descriptionEn: string
  modalDescriptionZh: string
  modalDescriptionEn: string
  pluginToolsZh: string[]
  pluginToolsEn: string[]
}

function includesAnyKeyword(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword))
}

function normalizeImportedTemplateName(fileName: string) {
  const rawName = fileName.replace(/\.[^.]+$/, '').trim()
  const collapsed = rawName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return collapsed || 'Imported Template'
}

function createImportedTemplateId(productLine: AppMarketProductLine, fileName: string) {
  const slug = normalizeImportedTemplateName(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${productLine}-${slug || 'imported'}-${Date.now()}`
}

function pickTemplateGradient(seed: string) {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return TEMPLATE_GRADIENTS[hash % TEMPLATE_GRADIENTS.length]
}

function buildImportedScenarioBlueprint(fileName: string, normalizedName: string): ImportedScenarioBlueprint {
  const source = `${fileName} ${normalizedName}`.toLowerCase()

  if (
    includesAnyKeyword(source, [
      '空间',
      'space',
      'workspace',
      'project',
      'role',
      '权限',
      'permission',
      'rbac',
      'governance',
    ])
  ) {
    return {
      category: 'operations',
      descriptionZh: `围绕《${fileName}》沉淀出的空间治理场景模板，覆盖层级规划、角色权限、成员开通与审计复盘。`,
      descriptionEn: `Governance scenario template derived from "${fileName}" covering hierarchy planning, role permissions, member enablement, and audit review.`,
      modalDescriptionZh:
        `将工作空间、项目与角色边界梳理，串联权限矩阵配置、成员开通协同与审计追踪，适合用于验证空间管理方案是否具备可执行的治理闭环。`,
      modalDescriptionEn:
        `Clarify workspace, project, and role boundaries, then connect permission matrix setup, member enablement, and audit tracking into an executable governance loop.`,
      tagsZh: ['空间治理', '权限设计', '角色矩阵', '审计追踪'],
      tagsEn: ['Space Governance', 'Permission Design', 'Role Matrix', 'Audit Tracking'],
      steps: [
        {
          idSuffix: 'governance-boundary',
          titleZh: '梳理空间层级与治理边界',
          titleEn: 'Define space hierarchy and governance boundaries',
          pluginToolsZh: ['Notion', 'Google Drive'],
          pluginToolsEn: ['Notion', 'Google Drive'],
        },
        {
          idSuffix: 'role-matrix',
          titleZh: '配置角色矩阵与访问规则',
          titleEn: 'Configure role matrix and access rules',
          pluginToolsZh: ['Google Sheets', 'Gmail', 'Slack'],
          pluginToolsEn: ['Google Sheets', 'Gmail', 'Slack'],
        },
        {
          idSuffix: 'member-onboarding',
          titleZh: '分配成员并联动审批开通',
          titleEn: 'Assign members and coordinate approval enablement',
          pluginToolsZh: ['Slack', 'Google Workspace', 'Trello'],
          pluginToolsEn: ['Slack', 'Google Workspace', 'Trello'],
        },
        {
          idSuffix: 'audit-health',
          titleZh: '追踪变更审计与健康度',
          titleEn: 'Track change audits and governance health',
          pluginToolsZh: ['Power BI', 'Notion', 'Zapier'],
          pluginToolsEn: ['Power BI', 'Notion', 'Zapier'],
        },
      ],
    }
  }

  if (
    includesAnyKeyword(source, ['入职', 'onboarding', 'hr', '招聘', 'employee', 'offer', '审批'])
  ) {
    return {
      category: 'hr-recruitment',
      descriptionZh: `基于《${fileName}》整理出的 HR 场景模板，覆盖材料准备、流程协同、开通执行与结果回收。`,
      descriptionEn: `HR scenario template derived from "${fileName}" for intake, coordination, enablement, and closure.`,
      modalDescriptionZh:
        `把导入文件中的关键规则整理成可追踪的 HR 执行链路，适合用于验证材料收集、审批协同、账号开通与结果通知是否能够稳定闭环。`,
      modalDescriptionEn:
        `Turn the imported rules into a traceable HR execution flow for validating document intake, approvals, provisioning, and closure notifications.`,
      tagsZh: ['人力资源', '流程协同', '开通执行', '状态跟踪'],
      tagsEn: ['HR', 'Coordination', 'Provisioning', 'Tracking'],
      steps: [
        {
          idSuffix: 'intake',
          titleZh: '收集资料与校验前置条件',
          titleEn: 'Collect materials and verify prerequisites',
          pluginToolsZh: ['Google Drive', 'Gmail'],
          pluginToolsEn: ['Google Drive', 'Gmail'],
        },
        {
          idSuffix: 'routing',
          titleZh: '路由审批与任务协同',
          titleEn: 'Route approvals and coordinate tasks',
          pluginToolsZh: ['Slack', 'Notion', 'Zapier'],
          pluginToolsEn: ['Slack', 'Notion', 'Zapier'],
        },
        {
          idSuffix: 'enablement',
          titleZh: '执行开通与状态回写',
          titleEn: 'Provision access and sync status',
          pluginToolsZh: ['Google Workspace', 'Trello', 'Gmail'],
          pluginToolsEn: ['Google Workspace', 'Trello', 'Gmail'],
        },
        {
          idSuffix: 'closure',
          titleZh: '汇总结果并推动闭环',
          titleEn: 'Summarize outcomes and drive closure',
          pluginToolsZh: ['Notion', 'Power BI', 'Slack'],
          pluginToolsEn: ['Notion', 'Power BI', 'Slack'],
        },
      ],
    }
  }

  if (
    includesAnyKeyword(source, ['知识', 'knowledge', 'doc', '文档', 'notion', 'sync', 'wiki'])
  ) {
    return {
      category: 'productivity',
      descriptionZh: `基于《${fileName}》生成的知识协同场景模板，覆盖内容收集、结构整理、同步发布与健康度回收。`,
      descriptionEn: `Knowledge collaboration scenario template generated from "${fileName}" for intake, structuring, publishing, and health checks.`,
      modalDescriptionZh:
        `围绕知识资料的抓取、归档与同步建立标准流程，帮助团队把导入内容快速沉淀为可维护、可追踪的知识资产。`,
      modalDescriptionEn:
        `Create a standard flow for collecting, organizing, and publishing knowledge so imported content can become maintainable and traceable assets.`,
      tagsZh: ['知识管理', '文档同步', '结构整理', '协作'],
      tagsEn: ['Knowledge', 'Document Sync', 'Structuring', 'Collaboration'],
      steps: [
        {
          idSuffix: 'capture',
          titleZh: '抓取资料与归并来源',
          titleEn: 'Capture source materials and merge inputs',
          pluginToolsZh: ['Google Drive', 'Notion'],
          pluginToolsEn: ['Google Drive', 'Notion'],
        },
        {
          idSuffix: 'structure',
          titleZh: '整理结构与摘要要点',
          titleEn: 'Structure content and summarize highlights',
          pluginToolsZh: ['Notion', 'Google Sheets'],
          pluginToolsEn: ['Notion', 'Google Sheets'],
        },
        {
          idSuffix: 'publish',
          titleZh: '同步发布与权限校验',
          titleEn: 'Publish updates and validate permissions',
          pluginToolsZh: ['Notion', 'Slack', 'Gmail'],
          pluginToolsEn: ['Notion', 'Slack', 'Gmail'],
        },
        {
          idSuffix: 'health',
          titleZh: '跟踪冲突与同步健康度',
          titleEn: 'Track conflicts and sync health',
          pluginToolsZh: ['Power BI', 'Zapier', 'Slack'],
          pluginToolsEn: ['Power BI', 'Zapier', 'Slack'],
        },
      ],
    }
  }

  return {
    category: 'operations',
    descriptionZh: `基于《${fileName}》整理出的场景模板，覆盖输入整理、核心执行、协同跟进与结果复盘。`,
    descriptionEn: `Scenario template derived from "${fileName}" for intake, execution, coordination, and review.`,
    modalDescriptionZh:
      `将导入文件中的关键流程抽象为可追踪的执行链路，适合用于快速验证节点职责、协同分工与结果交付是否清晰可复用。`,
    modalDescriptionEn:
      `Abstract the imported flow into a traceable execution chain so you can quickly validate node responsibilities, coordination, and delivery quality.`,
    tagsZh: ['导入模板', '流程编排', '协同执行', '结果复盘'],
    tagsEn: ['Imported', 'Workflow', 'Coordination', 'Review'],
    steps: [
      {
        idSuffix: 'intake',
        titleZh: '整理场景输入与目标',
        titleEn: 'Organize scenario inputs and goals',
        pluginToolsZh: ['Notion', 'Google Drive'],
        pluginToolsEn: ['Notion', 'Google Drive'],
      },
      {
        idSuffix: 'execution',
        titleZh: '执行核心编排链路',
        titleEn: 'Execute the core orchestration flow',
        pluginToolsZh: ['Slack', 'Gmail', 'Zapier'],
        pluginToolsEn: ['Slack', 'Gmail', 'Zapier'],
      },
      {
        idSuffix: 'followup',
        titleZh: '同步结果与异常跟进',
        titleEn: 'Sync outcomes and follow up on exceptions',
        pluginToolsZh: ['Trello', 'Slack', 'Google Sheets'],
        pluginToolsEn: ['Trello', 'Slack', 'Google Sheets'],
      },
      {
        idSuffix: 'review',
        titleZh: '输出复盘与下一步计划',
        titleEn: 'Produce review and next-step plan',
        pluginToolsZh: ['Power BI', 'Notion'],
        pluginToolsEn: ['Power BI', 'Notion'],
      },
    ],
  }
}

function buildImportedAgentBlueprint(fileName: string, normalizedName: string): ImportedAgentBlueprint {
  const source = `${fileName} ${normalizedName}`.toLowerCase()

  if (includesAnyKeyword(source, ['空间', 'workspace', 'project', 'role', '权限', 'rbac', 'governance'])) {
    return {
      category: 'operations',
      descriptionZh: `围绕《${fileName}》生成的空间治理 Agent 模板，适合拆解层级规划、权限编排与审计闭环。`,
      descriptionEn: `Space governance agent template generated from "${fileName}" for hierarchy planning, permission orchestration, and audit closure.`,
      modalDescriptionZh: `当您需要“${normalizedName}”时，我将负责监督任务并委派给子智能体：

1. 梳理空间层级、工作空间与项目边界，输出治理对象清单。
2. 配置角色矩阵、访问规则与成员分配逻辑，减少权限冲突。
3. 跟踪审批开通、例外处理与审计日志，形成可回溯闭环。
4. 输出可直接使用的治理建议、权限草案、风险提示与复盘摘要。

信息不完整时，我会先生成草案并标注待确认项。`,
      modalDescriptionEn: `Use "${normalizedName}" to supervise governance work and delegate to sub-agents:

1. Define hierarchy boundaries across spaces, workspaces, and projects.
2. Configure role matrices, access rules, and membership assignment logic.
3. Track approvals, exceptions, and audit logs in a traceable loop.
4. Return governance proposals, permission drafts, risk notes, and review summaries.

If information is incomplete, I will generate a draft first and mark pending confirmations.`,
      pluginToolsZh: ['Notion', 'Google Sheets', 'Slack', 'Power BI'],
      pluginToolsEn: ['Notion', 'Google Sheets', 'Slack', 'Power BI'],
      subAgents: [
        {
          idSuffix: 'boundary',
          nameZh: '治理边界子代理',
          nameEn: 'Governance Boundary Sub-agent',
          promptZh: '梳理组织、工作空间、项目之间的层级关系，输出治理对象、负责人和默认规则清单。',
          promptEn: 'Map the hierarchy across org, workspace, and project scopes and return governed objects, owners, and default rules.',
          pluginToolsZh: ['Notion', 'Google Sheets'],
          pluginToolsEn: ['Notion', 'Google Sheets'],
        },
        {
          idSuffix: 'permissions',
          nameZh: '权限编排子代理',
          nameEn: 'Permission Orchestration Sub-agent',
          promptZh: '根据治理边界配置角色矩阵、访问规则和成员分配建议，并标记冲突风险。',
          promptEn: 'Configure role matrices, access rules, and assignment recommendations from governance inputs, then flag conflicts.',
          pluginToolsZh: ['Google Sheets', 'Slack'],
          pluginToolsEn: ['Google Sheets', 'Slack'],
        },
        {
          idSuffix: 'audit',
          nameZh: '审计复盘子代理',
          nameEn: 'Audit Review Sub-agent',
          promptZh: '汇总变更记录、例外授权和审批状态，输出治理健康度与优化建议。',
          promptEn: 'Summarize change logs, exception grants, and approval status, then return governance health and optimizations.',
          pluginToolsZh: ['Power BI', 'Notion'],
          pluginToolsEn: ['Power BI', 'Notion'],
        },
      ],
    }
  }

  if (includesAnyKeyword(source, ['销售', 'crm', '客户', 'lead', 'revenue', 'pipeline'])) {
    return {
      category: 'business-dev',
      descriptionZh: `基于《${fileName}》生成的业务协同 Agent 模板，适合拆解线索流转、销售跟进与跨角色交接。`,
      descriptionEn: `Business coordination agent template derived from "${fileName}" for lead routing, sales follow-up, and cross-role handoffs.`,
      modalDescriptionZh: `当您需要“${normalizedName}”时，我将负责监督任务并委派给子智能体：

1. 整理销售上下文、线索状态与目标信息，形成统一跟进底稿。
2. 协调跨角色交接、提醒关键节点并减少信息断层。
3. 汇总风险、下一步动作与对外沟通材料，支持经理快速推进。
4. 输出可直接使用的交接摘要、跟进清单、提醒文案与复盘建议。

信息不完整时，我会先生成草案并标注待确认项。`,
      modalDescriptionEn: `Use "${normalizedName}" to supervise business coordination and delegate to sub-agents:

1. Consolidate sales context, lead status, and target signals into one working brief.
2. Coordinate handoffs, reminders, and cross-role dependencies.
3. Summarize risks, next actions, and outbound communication materials.
4. Return handoff summaries, follow-up plans, reminders, and review suggestions.

If information is incomplete, I will generate a draft first and mark pending confirmations.`,
      pluginToolsZh: ['CRM MCP', 'Gmail', 'Slack', 'Notion'],
      pluginToolsEn: ['CRM MCP', 'Gmail', 'Slack', 'Notion'],
      subAgents: [
        {
          idSuffix: 'context',
          nameZh: '业务上下文子代理',
          nameEn: 'Business Context Sub-agent',
          promptZh: '整理线索、客户、目标与阶段信息，输出结构化业务上下文摘要。',
          promptEn: 'Consolidate leads, customers, targets, and stage signals into a structured business context summary.',
          pluginToolsZh: ['CRM MCP', 'Notion'],
          pluginToolsEn: ['CRM MCP', 'Notion'],
        },
        {
          idSuffix: 'handoff',
          nameZh: '交接协同子代理',
          nameEn: 'Handoff Coordination Sub-agent',
          promptZh: '协调跨角色交接、待办提醒与时间线同步，减少跟进断层。',
          promptEn: 'Coordinate cross-role handoffs, reminders, and timeline sync to reduce follow-up gaps.',
          pluginToolsZh: ['Slack', 'Gmail'],
          pluginToolsEn: ['Slack', 'Gmail'],
        },
        {
          idSuffix: 'review',
          nameZh: '推进复盘子代理',
          nameEn: 'Progress Review Sub-agent',
          promptZh: '汇总推进风险、关键阻塞与下一步建议，输出可执行的复盘摘要。',
          promptEn: 'Summarize risks, blockers, and next-step recommendations into an actionable review summary.',
          pluginToolsZh: ['Notion', 'CRM MCP'],
          pluginToolsEn: ['Notion', 'CRM MCP'],
        },
      ],
    }
  }

  return {
    category: 'productivity',
    descriptionZh: `基于《${fileName}》生成的 Agent 模板，可直接用于任务拆解、协同执行与结果回传。`,
    descriptionEn: `Agent template generated from "${fileName}" for orchestration, collaboration, and delivery.`,
    modalDescriptionZh: `当您需要“${normalizedName}”时，我将负责监督任务并委派给子智能体：

1. 解析导入文件中的目标、约束与关键交付物，形成执行计划。
2. 组织子代理分工协同，并同步关键节点状态与异常提示。
3. 汇总阶段性产出、风险与下一步建议，减少执行断层。
4. 输出可直接使用的任务清单、提醒文案、交接摘要与结果复盘。

信息不完整时，我会先生成草案并标注待确认项。`,
    modalDescriptionEn: `Use "${normalizedName}" to supervise execution and delegate to sub-agents:

1. Parse goals, constraints, and deliverables from the imported file.
2. Coordinate sub-agents and sync key status updates and exceptions.
3. Consolidate outputs, risks, and next-step recommendations.
4. Return task plans, reminder copy, handoff notes, and review summaries.

If information is incomplete, I will generate a draft first and mark pending confirmations.`,
    pluginToolsZh: ['Notion', 'Slack', 'Gmail'],
    pluginToolsEn: ['Notion', 'Slack', 'Gmail'],
    subAgents: [
      {
        idSuffix: 'planner',
        nameZh: '任务规划子代理',
        nameEn: 'Task Planning Sub-agent',
        promptZh: '解析导入模板目标与约束，输出执行计划、依赖项与优先级。',
        promptEn: 'Analyze the imported template goals and constraints, then produce plans, dependencies, and priorities.',
        pluginToolsZh: ['Notion', 'Gmail'],
        pluginToolsEn: ['Notion', 'Gmail'],
      },
      {
        idSuffix: 'executor',
        nameZh: '执行编排子代理',
        nameEn: 'Execution Orchestration Sub-agent',
        promptZh: '根据规划结果分发任务、跟踪节点状态，并整理每一轮执行产出。',
        promptEn: 'Dispatch work from the plan, track node status, and consolidate outputs from each execution round.',
        pluginToolsZh: ['Slack', 'Notion'],
        pluginToolsEn: ['Slack', 'Notion'],
      },
    ],
  }
}

function buildImportedToolBlueprint(fileName: string, normalizedName: string): ImportedToolBlueprint {
  const source = `${fileName} ${normalizedName}`.toLowerCase()

  if (includesAnyKeyword(source, ['空间', 'workspace', 'project', 'role', '权限', 'rbac', 'governance'])) {
    return {
      category: 'operations',
      descriptionZh: `围绕《${fileName}》生成的治理工具模板，适合承载权限回写、成员分配与审计同步动作。`,
      descriptionEn: `Governance tool template derived from "${fileName}" for permission updates, membership assignment, and audit sync.`,
      modalDescriptionZh: `这个工具模板更偏向空间治理与权限编排场景，适合先在应用市场中占位，再逐步补全角色矩阵、审批回写与审计指标等真实执行能力。`,
      modalDescriptionEn: `This tool template is oriented toward governance and permission orchestration so you can validate the marketplace entry before wiring real role matrices, approvals, and audit telemetry.`,
      pluginToolsZh: ['Google Sheets', 'Slack', 'Power BI'],
      pluginToolsEn: ['Google Sheets', 'Slack', 'Power BI'],
      toolActions: [
        { id: 'GOVERNANCE_SYNC_ROLE_MATRIX', descriptionZh: '同步角色矩阵与访问规则，回写空间层级下的权限配置结果。', descriptionEn: 'Sync role matrices and access rules back into the governance model.' },
        { id: 'GOVERNANCE_ASSIGN_MEMBER_SCOPE', descriptionZh: '按空间、项目与角色批量分配成员，并记录生效范围。', descriptionEn: 'Assign members by space, project, and role while recording effective scope.' },
        { id: 'GOVERNANCE_APPEND_AUDIT_LOG', descriptionZh: '追加变更日志、审批结论与异常授权记录，供后续审计复盘。', descriptionEn: 'Append change logs, approval decisions, and exception grants for audit review.' },
        { id: 'GOVERNANCE_SUMMARIZE_HEALTH', descriptionZh: '汇总权限冲突、超时审批与治理健康度指标。', descriptionEn: 'Summarize permission conflicts, delayed approvals, and governance health metrics.' },
      ],
    }
  }

  if (includesAnyKeyword(source, ['知识', 'knowledge', 'doc', '文档', 'notion', 'sync', 'wiki'])) {
    return {
      category: 'productivity',
      descriptionZh: `基于《${fileName}》生成的知识同步工具模板，适合回写文档结构、状态与发布结果。`,
      descriptionEn: `Knowledge sync tool template generated from "${fileName}" for document structure, status, and publishing updates.`,
      modalDescriptionZh: `这个工具模板面向知识同步与结构化发布场景，适合先验证字段映射、写入动作与冲突处理逻辑，再逐步接上真实文档系统。`,
      modalDescriptionEn: `This tool template targets structured knowledge sync workflows so you can validate field mapping, writeback actions, and conflict handling before connecting real systems.`,
      pluginToolsZh: ['Notion', 'Google Drive', 'Slack'],
      pluginToolsEn: ['Notion', 'Google Drive', 'Slack'],
      toolActions: [
        { id: 'KNOWLEDGE_PARSE_SOURCE', descriptionZh: '解析导入文档的结构化章节、元数据与来源信息。', descriptionEn: 'Parse structured sections, metadata, and source information from the imported document.' },
        { id: 'KNOWLEDGE_UPSERT_CONTENT', descriptionZh: '将内容增量写入知识库页面、数据库或索引记录。', descriptionEn: 'Upsert content into pages, databases, or knowledge indexes.' },
        { id: 'KNOWLEDGE_VALIDATE_CONFLICT', descriptionZh: '识别内容冲突、重复版本与权限异常，并标记处理建议。', descriptionEn: 'Validate conflicts, duplicated versions, and permission anomalies with handling advice.' },
        { id: 'KNOWLEDGE_NOTIFY_PUBLISH', descriptionZh: '同步发布结果、变更摘要与待确认事项到协作频道。', descriptionEn: 'Notify publishing results, change summaries, and pending confirmations to collaboration channels.' },
      ],
    }
  }

  return {
    category: 'productivity',
    descriptionZh: `基于《${fileName}》生成的工具模板，可作为动作节点、连接器封装或自动化能力占位。`,
    descriptionEn: `Tool template generated from "${fileName}" for action nodes, connector wrappers, or automation capabilities.`,
    modalDescriptionZh: `这个工具模板根据导入文件自动补全了基础说明、动作列表与安装入口，适合先在应用市场中占位，再逐步补充真实凭证配置、返回结构与调用参数。`,
    modalDescriptionEn: `This tool template auto-generates baseline copy, actions, and an install flow from the uploaded file so you can validate the marketplace entry before wiring real credentials and parameters.`,
    pluginToolsZh: ['Slack', 'Gmail'],
    pluginToolsEn: ['Slack', 'Gmail'],
    toolActions: [
      { id: 'TOOL_PARSE_INPUT', descriptionZh: '解析导入文件中的核心字段，并映射为可执行输入参数。', descriptionEn: 'Parse the imported file and map core fields into executable inputs.' },
      { id: 'TOOL_RUN_ACTION', descriptionZh: '触发一次标准化动作执行，返回状态、摘要与异常提示。', descriptionEn: 'Run a normalized action and return status, summary, and exceptions.' },
      { id: 'TOOL_SYNC_RESULT', descriptionZh: '将执行结果同步回工作流上下文，供后续节点继续消费。', descriptionEn: 'Sync the result back into workflow context for downstream steps.' },
    ],
  }
}

function buildImportedSkillBlueprint(fileName: string, normalizedName: string): ImportedSkillBlueprint {
  const source = `${fileName} ${normalizedName}`.toLowerCase()

  if (includesAnyKeyword(source, ['空间', 'workspace', 'project', 'role', '权限', 'rbac', 'governance'])) {
    return {
      category: 'operations',
      descriptionZh: `围绕《${fileName}》生成的治理技能模板，适合沉淀角色分配、权限解释与审计提示话术。`,
      descriptionEn: `Governance skill template derived from "${fileName}" for role assignment guidance, permission explanations, and audit messaging.`,
      modalDescriptionZh: `面向空间治理与权限设计场景，提供角色矩阵解释、成员分配提示与审计摘要能力，可与治理 Agent 或权限工具协同使用。`,
      modalDescriptionEn: `Designed for governance and permission design, this skill helps explain role matrices, membership assignment rules, and audit summaries for companion agents or tools.`,
      pluginToolsZh: ['Google Sheets', 'Notion'],
      pluginToolsEn: ['Google Sheets', 'Notion'],
    }
  }

  if (includesAnyKeyword(source, ['知识', 'knowledge', 'doc', '文档', 'notion', 'sync', 'wiki'])) {
    return {
      category: 'productivity',
      descriptionZh: `基于《${fileName}》生成的知识整理技能，适合沉淀文档结构、摘要规范与同步提示。`,
      descriptionEn: `Knowledge organization skill generated from "${fileName}" for document structure, summary rules, and sync guidance.`,
      modalDescriptionZh: `该技能面向知识整理与同步发布场景，可生成结构化摘要、字段解释与同步前检查建议，适合与文档型 Agent、场景和工具配合使用。`,
      modalDescriptionEn: `This skill targets knowledge organization and publishing workflows, producing structured summaries, field explanations, and pre-sync checks for document-oriented agents and tools.`,
      pluginToolsZh: ['Notion', 'Google Drive'],
      pluginToolsEn: ['Notion', 'Google Drive'],
    }
  }

  if (includesAnyKeyword(source, ['销售', 'crm', '客户', 'lead', 'revenue', 'pipeline'])) {
    return {
      category: 'business-dev',
      descriptionZh: `围绕《${fileName}》生成的业务交接技能，适合沉淀上下文摘要、跟进建议与风险提示。`,
      descriptionEn: `Business handoff skill derived from "${fileName}" for context summaries, follow-up suggestions, and risk cues.`,
      modalDescriptionZh: `该技能面向业务交接与销售跟进场景，可统一上下文摘要格式、下一步动作建议与提醒口径，便于经理或协同 Agent 快速接力。`,
      modalDescriptionEn: `This skill is tuned for business handoffs and sales follow-ups, standardizing context summaries, next actions, and reminder phrasing for managers and companion agents.`,
      pluginToolsZh: ['CRM MCP', 'Gmail'],
      pluginToolsEn: ['CRM MCP', 'Gmail'],
    }
  }

  return {
    category: 'productivity',
    descriptionZh: `基于《${fileName}》生成的技能模板，适合沉淀指令规范、参考文档与脚本骨架。`,
    descriptionEn: `Skill template generated from "${fileName}" as a starting point for prompts, docs, and scripts.`,
    modalDescriptionZh: `该技能模板根据导入文件自动生成了结构化说明，可直接在详情面板中查看文件树、说明文档与脚本骨架，适合快速沉淀为可复用的 Skill 资产。`,
    modalDescriptionEn: `This skill template generates structured docs, file tree, and starter scripts from the uploaded file so it can be reused as a Skill asset right away.`,
    pluginToolsZh: ['Notion', 'Slack'],
    pluginToolsEn: ['Notion', 'Slack'],
  }
}

function buildHomeSectionState(
  catalog: AppMarketItem[],
  locale: ReturnType<typeof useLocale>['locale'],
  searchValue: string,
  homeProductLineFilter: AppMarketHomeProductFilter,
  productLine: AppMarketProductLine,
) {
  const isHomeSearchActive = searchValue.trim().length > 0
  const filteredHomeItems = filterAppMarketItems(catalog, searchValue, locale)
  const homeItems = isHomeSearchActive
    ? filteredHomeItems
    : catalog.slice(0, APP_MARKET_HOME_PREVIEW_LIMIT)

  return {
    catalog,
    filteredHomeItems,
    homeItems,
    showSection: homeProductLineFilter === 'all' || homeProductLineFilter === productLine,
    showViewMore: !isHomeSearchActive && catalog.length > APP_MARKET_HOME_PREVIEW_LIMIT,
    total: catalog.length,
  }
}

function buildImportedTemplateItem(
  importType: TemplateImportType,
  fileName: string,
  locale: ReturnType<typeof useLocale>['locale'],
): AppMarketItem {
  const productLine = IMPORT_TYPE_TO_PRODUCT_LINE[importType]
  const normalizedName = normalizeImportedTemplateName(fileName)
  const [iconFrom, iconTo] = pickTemplateGradient(`${productLine}-${fileName}`)
  const id = createImportedTemplateId(productLine, fileName)
  const nameEn = normalizedName

  if (productLine === 'agent-templates') {
    const agentBlueprint = buildImportedAgentBlueprint(fileName, normalizedName)
    return {
      id,
      productLine,
      badge: 'new',
      publisher: locale === 'zh' ? '文件导入' : 'Imported File',
      installs: locale === 'zh' ? '刚刚导入' : 'Just imported',
      rating: 4.8,
      iconFrom,
      iconTo,
      templateCategory: agentBlueprint.category,
      nameZh: normalizedName,
      nameEn,
      descriptionZh: agentBlueprint.descriptionZh,
      descriptionEn: agentBlueprint.descriptionEn,
      modalDescriptionZh: agentBlueprint.modalDescriptionZh,
      modalDescriptionEn: agentBlueprint.modalDescriptionEn,
      pluginToolsZh: agentBlueprint.pluginToolsZh,
      pluginToolsEn: agentBlueprint.pluginToolsEn,
      subAgents: agentBlueprint.subAgents.map((subAgent) => ({
        id: `${id}-${subAgent.idSuffix}`,
        nameZh: subAgent.nameZh,
        nameEn: subAgent.nameEn,
        promptZh: subAgent.promptZh,
        promptEn: subAgent.promptEn,
        pluginToolsZh: subAgent.pluginToolsZh,
        pluginToolsEn: subAgent.pluginToolsEn,
      })),
    }
  }

  if (productLine === 'scenario-templates') {
    const scenarioBlueprint = buildImportedScenarioBlueprint(fileName, normalizedName)
    return {
      id,
      productLine,
      badge: 'new',
      publisher: locale === 'zh' ? '文件导入' : 'Imported File',
      installs: locale === 'zh' ? '刚刚导入' : 'Just imported',
      rating: 4.7,
      iconFrom,
      iconTo,
      templateCategory: scenarioBlueprint.category,
      nameZh: normalizedName,
      nameEn,
      descriptionZh: scenarioBlueprint.descriptionZh,
      descriptionEn: scenarioBlueprint.descriptionEn,
      modalDescriptionZh: scenarioBlueprint.modalDescriptionZh,
      modalDescriptionEn: scenarioBlueprint.modalDescriptionEn,
      tagsZh: scenarioBlueprint.tagsZh,
      tagsEn: scenarioBlueprint.tagsEn,
      workflowSteps: scenarioBlueprint.steps.map((step) => ({
        id: `${id}-${step.idSuffix}`,
        titleZh: step.titleZh,
        titleEn: step.titleEn,
        pluginToolsZh: step.pluginToolsZh,
        pluginToolsEn: step.pluginToolsEn,
      })),
    }
  }

  if (productLine === 'tools') {
    const toolBlueprint = buildImportedToolBlueprint(fileName, normalizedName)
    return {
      id,
      productLine,
      badge: 'new',
      publisher: locale === 'zh' ? '文件导入' : 'Imported File',
      installs: locale === 'zh' ? '刚刚导入' : 'Just imported',
      rating: 4.6,
      iconFrom,
      iconTo,
      templateCategory: toolBlueprint.category,
      nameZh: normalizedName,
      nameEn,
      descriptionZh: toolBlueprint.descriptionZh,
      descriptionEn: toolBlueprint.descriptionEn,
      modalDescriptionZh: toolBlueprint.modalDescriptionZh,
      modalDescriptionEn: toolBlueprint.modalDescriptionEn,
      pluginToolsZh: toolBlueprint.pluginToolsZh,
      pluginToolsEn: toolBlueprint.pluginToolsEn,
      toolActionsZh: toolBlueprint.toolActions.map((action) => ({
        id: action.id,
        description: action.descriptionZh,
      })),
      toolActionsEn: toolBlueprint.toolActions.map((action) => ({
        id: action.id,
        description: action.descriptionEn,
      })),
    }
  }

  const skillBlueprint = buildImportedSkillBlueprint(fileName, normalizedName)
  return {
    id,
    productLine,
    badge: 'new',
    publisher: locale === 'zh' ? '文件导入' : 'Imported File',
    installs: locale === 'zh' ? '刚刚导入' : 'Just imported',
    rating: 4.8,
    iconFrom,
    iconTo,
    templateCategory: skillBlueprint.category,
    nameZh: normalizedName,
    nameEn,
    descriptionZh: skillBlueprint.descriptionZh,
    descriptionEn: skillBlueprint.descriptionEn,
    modalDescriptionZh: skillBlueprint.modalDescriptionZh,
    modalDescriptionEn: skillBlueprint.modalDescriptionEn,
    pluginToolsZh: skillBlueprint.pluginToolsZh,
    pluginToolsEn: skillBlueprint.pluginToolsEn,
  }
}

type AppMarketPageProps = {
  installedIds: Set<string>
  onMarkInstalled: (id: string) => void
  onToolInstallStart?: () => void
  onToolInstallComplete: (item: AppMarketItem) => void
  onTemplateApplied?: (item: AppMarketItem) => void
  importedItems?: AppMarketItem[]
  onImportedItemsChange?: React.Dispatch<React.SetStateAction<AppMarketItem[]>>
  entryRequest?: { kind: 'tools-anchor' | 'skills-anchor'; token: number } | null
  onEntryRequestConsumed?: () => void
  /** 仅「新员工入职引导场景」详情弹窗「使用模板」完成后触发，用于跳转场景配置工作区 */
  onEmployeeOnboardingGuideTemplateApplied?: () => void
}

function AppMarketPageTagline() {
  const { locale } = useLocale()

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={locale === 'zh' ? 'Agent·场景·工具·Skills' : 'Agent · Scenario · Tool · Skills'}
    >
      <span className="agents-subtitle-part">Agent</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '场景' : 'Scenario'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '工具' : 'Tool'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">Skills</span>
    </div>
  )
}

/** 应用市场模块入口：UI 与体验页同系（agents-page / AgentCardsGrid / JoyceAiPanel） */
export function AppMarketPage({
  installedIds,
  onMarkInstalled,
  onToolInstallStart,
  onToolInstallComplete,
  onTemplateApplied,
  importedItems: importedItemsProp,
  onImportedItemsChange,
  entryRequest = null,
  onEntryRequestConsumed,
  onEmployeeOnboardingGuideTemplateApplied,
}: AppMarketPageProps) {
  const { locale } = useLocale()
  const [view, setView] = useState<AppMarketView>('home')
  const [searchValue, setSearchValue] = useState('')
  const [homeProductLineFilter, setHomeProductLineFilter] =
    useState<AppMarketHomeProductFilter>('all')
  const [homeViewMode, setHomeViewMode] = useState<'cards' | 'list'>('cards')
  const [selectedAgentTemplate, setSelectedAgentTemplate] = useState<AppMarketItem | null>(null)
  const [selectedScenarioTemplate, setSelectedScenarioTemplate] = useState<AppMarketItem | null>(null)
  const [selectedToolItem, setSelectedToolItem] = useState<AppMarketItem | null>(null)
  const [selectedSkillItem, setSelectedSkillItem] = useState<AppMarketItem | null>(null)
  const [installingItemId, setInstallingItemId] = useState<string | null>(null)
  const [toolInstallFlowItem, setToolInstallFlowItem] = useState<AppMarketItem | null>(null)
  const [toolInstallFlowStep, setToolInstallFlowStep] = useState<ToolInstallFlowStep>('connect')
  const [toolInstallActionsExpanded, setToolInstallActionsExpanded] = useState(false)
  const [toolCredentialName, setToolCredentialName] = useState('')
  const [toolVerificationCode, setToolVerificationCode] = useState('')
  const [toolVerificationOpen, setToolVerificationOpen] = useState(false)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [templateImportType, setTemplateImportType] = useState('')
  const [templateUploadFile, setTemplateUploadFile] = useState<File | null>(null)
  const [templateUploadErrorKey, setTemplateUploadErrorKey] = useState<AppMarketStringKey | null>(null)
  const [templateDragActive, setTemplateDragActive] = useState(false)
  const [localImportedItems, setLocalImportedItems] = useState<AppMarketItem[]>([])
  const importedItems = importedItemsProp ?? localImportedItems
  const setImportedItems: Dispatch<SetStateAction<AppMarketItem[]>> =
    onImportedItemsChange ?? setLocalImportedItems
  const [importSuccessToast, setImportSuccessToast] = useState<{ title: string; sub: string } | null>(null)
  const installTimerRef = useRef<number | null>(null)
  const templateUploadInputRef = useRef<HTMLInputElement | null>(null)
  const importSuccessToastTimerRef = useRef<number | null>(null)

  const showImportSuccessToast = useCallback(
    (importType: TemplateImportType) => {
      const keys = IMPORT_SUCCESS_TOAST_KEYS[importType]
      setImportSuccessToast({
        title: appMarketT(locale, keys.title),
        sub: appMarketT(locale, keys.sub),
      })
      if (importSuccessToastTimerRef.current != null) {
        window.clearTimeout(importSuccessToastTimerRef.current)
      }
      importSuccessToastTimerRef.current = window.setTimeout(() => {
        setImportSuccessToast(null)
        importSuccessToastTimerRef.current = null
      }, 2000)
    },
    [locale],
  )

  const agentCatalog = useMemo(
    () => [
      ...importedItems.filter((item) => item.productLine === 'agent-templates'),
      ...AGENT_TEMPLATE_CATALOG,
    ],
    [importedItems],
  )
  const scenarioCatalog = useMemo(
    () => [
      ...importedItems.filter((item) => item.productLine === 'scenario-templates'),
      ...SCENARIO_TEMPLATE_CATALOG,
    ],
    [importedItems],
  )
  const toolsCatalog = useMemo(
    () => [...importedItems.filter((item) => item.productLine === 'tools'), ...TOOLS_CATALOG],
    [importedItems],
  )
  const skillsCatalog = useMemo(
    () => [...importedItems.filter((item) => item.productLine === 'skills'), ...SKILLS_CATALOG],
    [importedItems],
  )

  const agentTemplates = useMemo(
    () => buildHomeSectionState(agentCatalog, locale, searchValue, homeProductLineFilter, 'agent-templates'),
    [agentCatalog, homeProductLineFilter, locale, searchValue],
  )
  const scenarioTemplates = useMemo(
    () =>
      buildHomeSectionState(
        scenarioCatalog,
        locale,
        searchValue,
        homeProductLineFilter,
        'scenario-templates',
      ),
    [homeProductLineFilter, locale, scenarioCatalog, searchValue],
  )
  const tools = useMemo(
    () => buildHomeSectionState(toolsCatalog, locale, searchValue, homeProductLineFilter, 'tools'),
    [homeProductLineFilter, locale, searchValue, toolsCatalog],
  )
  const skills = useMemo(
    () => buildHomeSectionState(skillsCatalog, locale, searchValue, homeProductLineFilter, 'skills'),
    [homeProductLineFilter, locale, searchValue, skillsCatalog],
  )

  const homeTabCounts = useMemo(
    () => ({
      all: agentTemplates.total + scenarioTemplates.total + tools.total + skills.total,
      'agent-templates': agentTemplates.total,
      'scenario-templates': scenarioTemplates.total,
      tools: tools.total,
      skills: skills.total,
    }),
    [agentTemplates.total, scenarioTemplates.total, tools.total, skills.total],
  )

  const homeTabs = useMemo(
    () =>
      [
        { key: 'all' as const, label: appMarketT(locale, 'homeFilterAll'), count: homeTabCounts.all },
        {
          key: 'agent-templates' as const,
          label: appMarketT(locale, 'homeFilterAgents'),
          count: homeTabCounts['agent-templates'],
        },
        {
          key: 'scenario-templates' as const,
          label: appMarketT(locale, 'homeFilterScenarios'),
          count: homeTabCounts['scenario-templates'],
        },
        { key: 'tools' as const, label: appMarketT(locale, 'homeFilterTools'), count: homeTabCounts.tools },
        { key: 'skills' as const, label: appMarketT(locale, 'homeFilterSkills'), count: homeTabCounts.skills },
      ] satisfies Array<{ key: AppMarketHomeProductFilter; label: string; count: number }>,
    [homeTabCounts, locale],
  )

  const isHomeSearchActive = searchValue.trim().length > 0
  const isHomeSearchEmpty =
    (isHomeSearchActive || homeProductLineFilter !== 'all') &&
    (!agentTemplates.showSection || agentTemplates.filteredHomeItems.length === 0) &&
    (!scenarioTemplates.showSection || scenarioTemplates.filteredHomeItems.length === 0) &&
    (!tools.showSection || tools.filteredHomeItems.length === 0) &&
    (!skills.showSection || skills.filteredHomeItems.length === 0)

  const openCategory = useCallback((line: AppMarketProductLine) => {
    setView(line)
    setSearchValue('')
    setHomeProductLineFilter('all')
    setSelectedAgentTemplate(null)
    setSelectedScenarioTemplate(null)
    setSelectedToolItem(null)
    setSelectedSkillItem(null)
  }, [])

  const goHome = useCallback(() => {
    setView('home')
    setSearchValue('')
    setHomeProductLineFilter('all')
    setSelectedAgentTemplate(null)
    setSelectedScenarioTemplate(null)
    setSelectedToolItem(null)
    setSelectedSkillItem(null)
  }, [])

  const selectItem = useCallback(
    (id: string) => {
      const item =
        agentCatalog.find((candidate) => candidate.id === id) ??
        scenarioCatalog.find((candidate) => candidate.id === id) ??
        toolsCatalog.find((candidate) => candidate.id === id) ??
        skillsCatalog.find((candidate) => candidate.id === id)

      if (!item) return

      setSelectedAgentTemplate(item.productLine === 'agent-templates' ? item : null)
      setSelectedScenarioTemplate(item.productLine === 'scenario-templates' ? item : null)
      setSelectedToolItem(item.productLine === 'tools' ? item : null)
      setSelectedSkillItem(item.productLine === 'skills' ? item : null)
    },
    [agentCatalog, scenarioCatalog, skillsCatalog, toolsCatalog],
  )

  const closeAgentTemplateModal = useCallback(() => {
    setSelectedAgentTemplate(null)
  }, [])

  const isInstalled = useCallback((id: string) => installedIds.has(id), [installedIds])

  const closeToolInstallFlow = useCallback(() => {
    if (installTimerRef.current != null) {
      window.clearTimeout(installTimerRef.current)
      installTimerRef.current = null
    }
    setInstallingItemId(null)
    setToolInstallFlowItem(null)
    setToolInstallFlowStep('connect')
    setToolInstallActionsExpanded(false)
    setToolCredentialName('')
    setToolVerificationCode('')
    setToolVerificationOpen(false)
  }, [])

  useEffect(() => {
    return () => {
      if (installTimerRef.current != null) {
        window.clearTimeout(installTimerRef.current)
      }
      if (importSuccessToastTimerRef.current != null) {
        window.clearTimeout(importSuccessToastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!entryRequest || (entryRequest.kind !== 'tools-anchor' && entryRequest.kind !== 'skills-anchor')) return

    let scrollFrame: number | null = null
    const resetFrame = window.requestAnimationFrame(() => {
      setView('home')
      setSearchValue('')
      setHomeProductLineFilter('all')
      setSelectedAgentTemplate(null)
      setSelectedScenarioTemplate(null)
      setSelectedToolItem(null)
      setSelectedSkillItem(null)

      scrollFrame = window.requestAnimationFrame(() => {
        const target = document.getElementById(
          entryRequest.kind === 'skills-anchor' ? 'app-market-section-skills' : 'app-market-section-tools',
        )
        const scrollContainer = target?.closest('.agents-page-main')
        if (target && scrollContainer instanceof HTMLElement) {
          scrollContainer.scrollTo({
            top: Math.max(0, target.offsetTop - 12),
            behavior: 'smooth',
          })
        } else {
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        onEntryRequestConsumed?.()
      })
    })

    return () => {
      window.cancelAnimationFrame(resetFrame)
      if (scrollFrame != null) window.cancelAnimationFrame(scrollFrame)
    }
  }, [entryRequest, onEntryRequestConsumed])

  const handleInstall = useCallback(
    (item: AppMarketItem) => {
      if (isInstalled(item.id) || installingItemId === item.id) return

      if (item.productLine === 'skills') {
        onMarkInstalled(item.id)
        onTemplateApplied?.(item)
        return
      }

      if (item.productLine !== 'tools') {
        onMarkInstalled(item.id)
        onTemplateApplied?.(item)
        return
      }

      setInstallingItemId(item.id)
      if (installTimerRef.current != null) {
        window.clearTimeout(installTimerRef.current)
      }
      installTimerRef.current = window.setTimeout(() => {
        setInstallingItemId(null)
        setToolInstallFlowItem(item)
        setToolInstallFlowStep('connect')
        setToolInstallActionsExpanded(false)
        setToolCredentialName('')
        setToolVerificationCode('')
        setToolVerificationOpen(false)
      }, 650)
    },
    [installingItemId, isInstalled, onMarkInstalled, onTemplateApplied],
  )

  const handleAgentTemplateUse = useCallback(
    (item: AppMarketItem) => {
      if (!isInstalled(item.id)) onMarkInstalled(item.id)
      onTemplateApplied?.(item)
    },
    [isInstalled, onMarkInstalled, onTemplateApplied],
  )

  const handleScenarioTemplateUse = useCallback(
    (item: AppMarketItem) => {
      if (!isInstalled(item.id)) onMarkInstalled(item.id)
      onTemplateApplied?.(item)
      if (item.id === EMPLOYEE_ONBOARDING_GUIDE_SCENARIO_TEMPLATE_ID) {
        setSelectedScenarioTemplate(null)
        onEmployeeOnboardingGuideTemplateApplied?.()
      }
    },
    [isInstalled, onMarkInstalled, onEmployeeOnboardingGuideTemplateApplied, onTemplateApplied],
  )

  const currentToolDisplayName = toolInstallFlowItem
    ? locale === 'zh'
      ? toolInstallFlowItem.nameZh
      : toolInstallFlowItem.nameEn
    : ''
  const currentToolDescription = toolInstallFlowItem
    ? locale === 'zh'
      ? toolInstallFlowItem.descriptionZh
      : toolInstallFlowItem.descriptionEn
    : ''
  const currentToolActions = toolInstallFlowItem
    ? locale === 'zh'
      ? (toolInstallFlowItem.toolActionsZh ?? [])
      : (toolInstallFlowItem.toolActionsEn ?? toolInstallFlowItem.toolActionsZh ?? [])
    : []
  const connectToolTitle = appMarketT(locale, 'connectToolTitle').replace('{tool}', currentToolDisplayName)
  const connectToolSubtitle = appMarketT(locale, 'connectToolSubtitle').replace('{tool}', currentToolDisplayName)
  const verificationCodeIsValid = /^\d{6}$/.test(toolVerificationCode)

  const handleToolConnectSubmit = useCallback(() => {
    if (!toolCredentialName.trim()) return
    setToolVerificationCode('')
    setToolVerificationOpen(true)
  }, [toolCredentialName])

  const handleToolVerificationConfirm = useCallback(() => {
    if (!toolInstallFlowItem || !verificationCodeIsValid) return
    onMarkInstalled(toolInstallFlowItem.id)
    onToolInstallComplete(toolInstallFlowItem)
    closeToolInstallFlow()
  }, [closeToolInstallFlow, onMarkInstalled, onToolInstallComplete, toolInstallFlowItem, verificationCodeIsValid])

  const closeCreateTemplateModal = useCallback(() => {
    setCreateTemplateOpen(false)
    setTemplateImportType('')
    setTemplateUploadFile(null)
    setTemplateUploadErrorKey(null)
    setTemplateDragActive(false)
  }, [])

  const openCreateTemplateModal = useCallback(() => {
    setCreateTemplateOpen(true)
  }, [])

  const applyValidatedTemplateFile = useCallback(
    async (file: File | null, importType: string) => {
      setTemplateDragActive(false)
      if (!file) {
        setTemplateUploadFile(null)
        setTemplateUploadErrorKey(null)
        return
      }
      if (!importType) {
        setTemplateUploadFile(null)
        setTemplateUploadErrorKey('importFileErrorTypeRequired')
        return
      }

      const validationError = await validateTemplateUploadFile(file, importType as TemplateImportType)
      if (validationError) {
        setTemplateUploadFile(null)
        setTemplateUploadErrorKey(validationError)
        return
      }

      setTemplateUploadFile(file)
      setTemplateUploadErrorKey(null)
    },
    [],
  )

  const handleTemplateFileSelected = useCallback(
    (file: File | null) => {
      void applyValidatedTemplateFile(file, templateImportType)
    },
    [applyValidatedTemplateFile, templateImportType],
  )

  const handleTemplateFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleTemplateFileSelected(event.target.files?.[0] ?? null)
      event.target.value = ''
    },
    [handleTemplateFileSelected],
  )

  const handleTemplateDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      handleTemplateFileSelected(event.dataTransfer.files?.[0] ?? null)
    },
    [handleTemplateFileSelected],
  )

  const handleTemplateImportSubmit = useCallback(() => {
    if (!templateImportType || !templateUploadFile || templateUploadErrorKey) return

    const importType = templateImportType as TemplateImportType
    const importedItem = buildImportedTemplateItem(importType, templateUploadFile.name, locale)

    setImportedItems((current) => [importedItem, ...current])
    setView('home')
    setSearchValue('')
    setHomeProductLineFilter('all')
    setSelectedAgentTemplate(null)
    setSelectedScenarioTemplate(null)
    setSelectedToolItem(null)
    setSelectedSkillItem(null)
    closeCreateTemplateModal()
    showImportSuccessToast(importType)
  }, [closeCreateTemplateModal, locale, showImportSuccessToast, templateImportType, templateUploadErrorKey, templateUploadFile])

  useEffect(() => {
    if (!createTemplateOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCreateTemplateModal()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeCreateTemplateModal, createTemplateOpen])

  return (
    <section
      className="agents-page experience-entry-page app-market-page"
      aria-label={locale === 'zh' ? '应用市场' : 'App Marketplace'}
    >
      <div className="agents-page-main experience-entry-page-main">
        {view === 'home' ? (
          <>
            <header className="agents-header">
              <div className="agents-header-lead">
                <div className="agents-title">{appMarketT(locale, 'pageTitle')}</div>
                <AppMarketPageTagline />
              </div>
              <div className="agents-header-actions">
                <button
                  type="button"
                  className="agents-btn agents-btn-primary"
                  onClick={openCreateTemplateModal}
                >
                  + {appMarketT(locale, 'createTemplate')}
                </button>
              </div>
            </header>
            <div className="agents-tabs" role="tablist" aria-label={appMarketT(locale, 'homeFilterLabel')}>
              {homeTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={homeProductLineFilter === tab.key ? 'agents-tab is-active' : 'agents-tab'}
                  type="button"
                  role="tab"
                  aria-selected={homeProductLineFilter === tab.key}
                  onClick={() => setHomeProductLineFilter(tab.key)}
                >
                  {tab.label} <span className="agents-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
            <AppMarketSearchBar
              locale={locale}
              value={searchValue}
              onChange={setSearchValue}
              showViewToggle
              viewMode={homeViewMode}
              onViewModeChange={setHomeViewMode}
            />
            {isHomeSearchEmpty ? (
              <div className="app-market-search-empty" role="status">
                <p className="app-market-search-empty-title">{appMarketT(locale, 'emptyTitle')}</p>
                <p className="app-market-search-empty-hint">{appMarketT(locale, 'emptyHint')}</p>
              </div>
            ) : (
              <div className="app-market-home-sections">
                {agentTemplates.showSection && agentTemplates.homeItems.length > 0 ? (
                  <AgentTemplatesHomeSection
                    locale={locale}
                    items={agentTemplates.homeItems}
                    total={agentTemplates.total}
                    showViewMore={agentTemplates.showViewMore}
                    isSearchActive={isHomeSearchActive}
                    viewMode={homeViewMode}
                    isInstalled={isInstalled}
                    onSelectItem={selectItem}
                    onViewMore={() => openCategory('agent-templates')}
                  />
                ) : null}
                {scenarioTemplates.showSection && scenarioTemplates.homeItems.length > 0 ? (
                  <ScenarioTemplatesHomeSection
                    locale={locale}
                    items={scenarioTemplates.homeItems}
                    total={scenarioTemplates.total}
                    showViewMore={scenarioTemplates.showViewMore}
                    isSearchActive={isHomeSearchActive}
                    viewMode={homeViewMode}
                    isInstalled={isInstalled}
                    onSelectItem={selectItem}
                    onViewMore={() => openCategory('scenario-templates')}
                  />
                ) : null}
                {tools.showSection && tools.homeItems.length > 0 ? (
                  <ToolsHomeSection
                    locale={locale}
                    items={tools.homeItems}
                    total={tools.total}
                    showViewMore={tools.showViewMore}
                    isSearchActive={isHomeSearchActive}
                    viewMode={homeViewMode}
                    isInstalled={isInstalled}
                    onSelectItem={selectItem}
                    onViewMore={() => openCategory('tools')}
                  />
                ) : null}
                {skills.showSection && skills.homeItems.length > 0 ? (
                  <SkillsHomeSection
                    locale={locale}
                    items={skills.homeItems}
                    total={skills.total}
                    showViewMore={skills.showViewMore}
                    isSearchActive={isHomeSearchActive}
                    viewMode={homeViewMode}
                    isInstalled={isInstalled}
                    onSelectItem={selectItem}
                    onViewMore={() => openCategory('skills')}
                  />
                ) : null}
              </div>
            )}
          </>
        ) : view === 'agent-templates' ? (
          <AgentTemplatesPage
            locale={locale}
            items={agentCatalog}
            onBack={goHome}
            isInstalled={isInstalled}
            onSelectItem={selectItem}
            onCreateTemplate={openCreateTemplateModal}
          />
        ) : view === 'scenario-templates' ? (
          <ScenarioTemplatesPage
            locale={locale}
            items={scenarioCatalog}
            onBack={goHome}
            isInstalled={isInstalled}
            onSelectItem={selectItem}
            onCreateTemplate={openCreateTemplateModal}
          />
        ) : view === 'tools' ? (
          <ToolsPage
            locale={locale}
            items={toolsCatalog}
            onBack={goHome}
            isInstalled={isInstalled}
            onSelectItem={selectItem}
            onCreateTemplate={openCreateTemplateModal}
          />
        ) : (
          <SkillsPage
            locale={locale}
            items={skillsCatalog}
            onBack={goHome}
            isInstalled={isInstalled}
            onSelectItem={selectItem}
            onCreateTemplate={openCreateTemplateModal}
          />
        )}
      </div>
      {selectedAgentTemplate ? (
        <AgentTemplateDetailModal
          key={selectedAgentTemplate.id}
          locale={locale}
          item={selectedAgentTemplate}
          onClose={closeAgentTemplateModal}
          onUseTemplate={() => handleAgentTemplateUse(selectedAgentTemplate)}
        />
      ) : null}
      {selectedScenarioTemplate ? (
        hasScenarioTemplateDetailModal(selectedScenarioTemplate) ? (
          <ScenarioTemplateDetailModal
            key={selectedScenarioTemplate.id}
            locale={locale}
            item={selectedScenarioTemplate}
            onClose={() => setSelectedScenarioTemplate(null)}
            onUseTemplate={() => handleScenarioTemplateUse(selectedScenarioTemplate)}
          />
        ) : (
          <AppMarketDetailView
            key={selectedScenarioTemplate.id}
            locale={locale}
            item={selectedScenarioTemplate}
            installed={isInstalled(selectedScenarioTemplate.id)}
            onBack={() => setSelectedScenarioTemplate(null)}
            installing={false}
            onInstall={() => handleInstall(selectedScenarioTemplate)}
          />
        )
      ) : null}
      {selectedToolItem ? (
        <AppMarketDetailView
          key={selectedToolItem.id}
          locale={locale}
          item={selectedToolItem}
          installed={isInstalled(selectedToolItem.id)}
          onBack={() => setSelectedToolItem(null)}
          installing={installingItemId === selectedToolItem.id}
          onInstall={() => handleInstall(selectedToolItem)}
        />
      ) : null}
      {selectedSkillItem ? (
        <SkillTemplateDetailModal
          key={selectedSkillItem.id}
          locale={locale}
          items={skillsCatalog}
          initialItem={selectedSkillItem}
          isInstalled={isInstalled}
          onClose={() => setSelectedSkillItem(null)}
          onInstall={handleInstall}
        />
      ) : null}
      {toolInstallFlowItem ? (
        <div className="app-market-tool-connect-root" role="presentation">
          <button
            type="button"
            className="app-market-tool-connect-backdrop"
            aria-label={appMarketT(locale, 'modalClose')}
            onClick={closeToolInstallFlow}
          />
          {toolInstallFlowStep === 'connect' ? (
            <div
              className="app-market-tool-connect-panel"
              role="dialog"
              aria-modal="true"
              aria-label={currentToolDisplayName}
            >
              <div className="app-market-tool-connect-header">
                <div>
                  <div className="app-market-tool-connect-title">{currentToolDisplayName}</div>
                  <div className="app-market-tool-connect-subtitle">{currentToolDescription}</div>
                </div>
                <button
                  type="button"
                  className="app-market-tool-connect-close"
                  aria-label={appMarketT(locale, 'modalClose')}
                  onClick={closeToolInstallFlow}
                >
                  ×
                </button>
              </div>
              <div className="app-market-tool-connect-body">
                <section className="app-market-tool-connect-section">
                  <div className="app-market-tool-connect-section-head">
                    <div className="app-market-tool-connect-section-title">{appMarketT(locale, 'connectAccounts')}</div>
                    <button
                      type="button"
                      className="app-market-tool-connect-link-btn"
                      onClick={() => setToolInstallFlowStep('credential')}
                    >
                      {appMarketT(locale, 'addAccount')}
                    </button>
                  </div>
                  <div className="app-market-tool-connect-empty">{appMarketT(locale, 'noConnectedAccounts')}</div>
                </section>
                <section className="app-market-tool-connect-section">
                  <button
                    type="button"
                    className="app-market-tool-connect-toggle"
                    onClick={() => setToolInstallActionsExpanded((current) => !current)}
                    aria-expanded={toolInstallActionsExpanded}
                  >
                    <span className="app-market-tool-connect-section-title">{appMarketT(locale, 'toolActionsPanel')}</span>
                    <span
                      className={
                        toolInstallActionsExpanded
                          ? 'app-market-tool-connect-chevron is-open'
                          : 'app-market-tool-connect-chevron'
                      }
                      aria-hidden="true"
                    >
                      ⌄
                    </span>
                  </button>
                  {toolInstallActionsExpanded ? (
                    <ul className="app-market-tool-actions-list">
                      {currentToolActions.map((action) => (
                        <li key={action.id} className="app-market-tool-actions-item">
                          <span className="app-market-tool-actions-check" aria-hidden="true">
                            ✓
                          </span>
                          <div className="app-market-tool-actions-copy">
                            <div className="app-market-tool-actions-id">{action.id}</div>
                            <div className="app-market-tool-actions-desc">{action.description}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </div>
            </div>
          ) : (
            <div
              className="app-market-tool-connect-panel app-market-tool-connect-panel--credential"
              role="dialog"
              aria-modal="true"
              aria-label={connectToolTitle}
            >
              <div className="app-market-tool-connect-header">
                <div>
                  <div className="app-market-tool-connect-title">{connectToolTitle}</div>
                  <div className="app-market-tool-connect-subtitle">{connectToolSubtitle}</div>
                </div>
                <button
                  type="button"
                  className="app-market-tool-connect-close"
                  aria-label={appMarketT(locale, 'modalClose')}
                  onClick={closeToolInstallFlow}
                >
                  ×
                </button>
              </div>
              <div className="app-market-tool-connect-body app-market-tool-connect-body--credential">
                <label className="app-market-tool-credential-field">
                  <span className="app-market-tool-credential-label">
                    {appMarketT(locale, 'connectCredentialName')} <span aria-hidden="true">*</span>
                  </span>
                  <input
                    value={toolCredentialName}
                    placeholder={appMarketT(locale, 'connectCredentialPlaceholder')}
                    onChange={(event) => setToolCredentialName(event.target.value)}
                  />
                </label>
                <div className="app-market-tool-credential-actions">
                  <button
                    type="button"
                    className="app-market-tool-connect-submit"
                    disabled={!toolCredentialName.trim()}
                    onClick={handleToolConnectSubmit}
                  >
                    {appMarketT(locale, 'connectAction')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {toolVerificationOpen ? (
            <div className="app-market-tool-verify-root" role="presentation">
              <button
                type="button"
                className="app-market-tool-verify-backdrop"
                aria-label={appMarketT(locale, 'modalClose')}
                onClick={() => setToolVerificationOpen(false)}
              />
              <div className="app-market-tool-verify-panel" role="dialog" aria-modal="true" aria-label={appMarketT(locale, 'verificationTitle')}>
                <div className="app-market-tool-verify-title">{appMarketT(locale, 'verificationTitle')}</div>
                <div className="app-market-tool-verify-subtitle">{appMarketT(locale, 'verificationSubtitle')}</div>
                <input
                  className="app-market-tool-verify-input"
                  inputMode="numeric"
                  maxLength={6}
                  value={toolVerificationCode}
                  placeholder={appMarketT(locale, 'verificationPlaceholder')}
                  onChange={(event) => setToolVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <div className="app-market-tool-verify-actions">
                  <button
                    type="button"
                    className="app-market-tool-verify-btn app-market-tool-verify-btn--ghost"
                    onClick={() => setToolVerificationOpen(false)}
                  >
                    {appMarketT(locale, 'verificationCancel')}
                  </button>
                  <button
                    type="button"
                    className="app-market-tool-verify-btn app-market-tool-verify-btn--primary"
                    disabled={!verificationCodeIsValid}
                    onClick={handleToolVerificationConfirm}
                  >
                    {appMarketT(locale, 'verificationConfirm')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {createTemplateOpen ? (
        <div className="app-market-import-modal-root" role="presentation">
          <button
            type="button"
            className="app-market-import-modal-backdrop"
            aria-label={appMarketT(locale, 'modalClose')}
            onClick={closeCreateTemplateModal}
          />
          <div className="app-market-import-modal" role="dialog" aria-modal="true" aria-labelledby="app-market-import-title">
            <div className="app-market-import-modal-header">
              <div>
                <div id="app-market-import-title" className="app-market-import-modal-title">
                  {appMarketT(locale, 'createTemplateTitle')}
                </div>
                <div className="app-market-import-modal-subtitle">{appMarketT(locale, 'createTemplateSubtitle')}</div>
              </div>
              <button
                type="button"
                className="app-market-import-modal-close"
                aria-label={appMarketT(locale, 'modalClose')}
                onClick={closeCreateTemplateModal}
              >
                ×
              </button>
            </div>
            <div className="app-market-import-modal-body">
              <label className="app-market-import-field">
                <span>{appMarketT(locale, 'importTypeLabel')}</span>
                <select
                  value={templateImportType}
                  onChange={(event) => {
                    const nextImportType = event.target.value
                    setTemplateImportType(nextImportType)
                    if (!nextImportType) {
                      setTemplateUploadFile(null)
                      setTemplateUploadErrorKey(null)
                      return
                    }
                    if (templateUploadFile) {
                      void applyValidatedTemplateFile(templateUploadFile, nextImportType)
                    } else {
                      setTemplateUploadErrorKey(null)
                    }
                  }}
                >
                  <option value="">{appMarketT(locale, 'importTypePlaceholder')}</option>
                  <option value="agent">{appMarketT(locale, 'importTypeAgent')}</option>
                  <option value="scenario">{appMarketT(locale, 'importTypeScenario')}</option>
                  <option value="tool">{appMarketT(locale, 'importTypeTool')}</option>
                  <option value="skill">{appMarketT(locale, 'importTypeSkill')}</option>
                </select>
              </label>

              <div className="app-market-import-field">
                <span>{appMarketT(locale, 'uploadFileLabel')}</span>
                <div
                  className={
                    templateDragActive
                      ? 'app-market-import-dropzone is-drag-active'
                      : templateUploadErrorKey
                        ? 'app-market-import-dropzone has-error'
                        : 'app-market-import-dropzone'
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!templateImportType) {
                      setTemplateUploadErrorKey('importFileErrorTypeRequired')
                      return
                    }
                    templateUploadInputRef.current?.click()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      if (!templateImportType) {
                        setTemplateUploadErrorKey('importFileErrorTypeRequired')
                        return
                      }
                      templateUploadInputRef.current?.click()
                    }
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    if (!templateImportType) return
                    setTemplateDragActive(true)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (!templateImportType) return
                    if (!templateDragActive) setTemplateDragActive(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    const nextTarget = event.relatedTarget as Node | null
                    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                      setTemplateDragActive(false)
                    }
                  }}
                  onDrop={(event) => {
                    if (!templateImportType) {
                      event.preventDefault()
                      setTemplateUploadErrorKey('importFileErrorTypeRequired')
                      return
                    }
                    handleTemplateDrop(event)
                  }}
                >
                  <div className="app-market-import-dropzone-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path
                        d="M12 16V6M8 10l4-4 4 4M6 19h12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="app-market-import-dropzone-title">{appMarketT(locale, 'uploadDropTitle')}</div>
                  <div className="app-market-import-dropzone-hint">
                    {resolveTemplateUploadDropHint(locale, templateImportType)}
                  </div>
                </div>
                <input
                  ref={templateUploadInputRef}
                  type="file"
                  className="app-market-import-file-input"
                  accept={getTemplateImportFileAccept(templateImportType as TemplateImportType | '')}
                  onChange={handleTemplateFileInputChange}
                />
                {templateUploadErrorKey ? (
                  <div className="app-market-import-file-error" role="alert">
                    {appMarketT(locale, templateUploadErrorKey)}
                  </div>
                ) : null}
                {templateUploadFile ? (
                  <div className="app-market-import-selected-file">
                    {appMarketT(locale, 'selectedFileLabel', { name: templateUploadFile.name })}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="app-market-import-modal-actions">
              <button type="button" className="app-market-import-btn app-market-import-btn--ghost" onClick={closeCreateTemplateModal}>
                {appMarketT(locale, 'createTemplateCancel')}
              </button>
              <button
                type="button"
                className="app-market-import-btn app-market-import-btn--primary"
                disabled={!templateImportType || !templateUploadFile || Boolean(templateUploadErrorKey)}
                onClick={handleTemplateImportSubmit}
              >
                {appMarketT(locale, 'createTemplateConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {importSuccessToast
        ? createPortal(
            <div className="agents-publish-success-toast" role="status" aria-live="polite">
              <span className="agents-publish-success-toast__icon" aria-hidden="true">
                ✓
              </span>
              <div className="agents-publish-success-toast__text">
                <strong className="agents-publish-success-toast__title">{importSuccessToast.title}</strong>
                <span className="agents-publish-success-toast__sub">{importSuccessToast.sub}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
