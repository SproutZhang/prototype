import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { OnboardingWorkflowPage } from '../components/onboarding/OnboardingWorkflowPage'
import { CreateAgentModal } from '../components/CreateAgentModal'
import { PublishAgentAppModal } from '../components/PublishAgentAppModal'
import { AgentFreezeModal } from '../components/AgentFreezeModal'
import { AgentCardEditModal, type AgentCardEditDraft } from '../components/shared/AgentCardEditModal'
import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'
import { TOOL_DIRECTORY_ITEMS, type ToolDirectoryItem } from '../data/tools-directory'
import { EXPERIENCE_AVATAR_OPTIONS } from '../data/experienceAvatars'
import { useLocale } from '../i18n/LocaleContext'
import {
  agentFreezeT,
  buildInitialPublishedAgentNameSet,
  getAgentFrozenStatusBadge,
  getAgentPublishedStatusBadge,
} from '../i18n/agentLibraryStrings'
import type { AppMarketItem } from '../modules/app-market'
import {
  isManagerialMarketAgentItem,
  resolveMarketTemplateModalDescription,
} from '../modules/app-market/applyAppMarketTemplate'
import { DEFAULT_PUBLISH_PROJECT_GROUP_ID } from '../data/scenarioPublishSpaces'
import { publishContentToSpace } from '../modules/team-collaboration-space/utils/publishSpaceSync'
import {
  resolvePublishGroupIdFromTargetId,
  resolvePublishSpaceIdFromTargetId,
} from '../modules/team-collaboration-space/utils/publishProjectGroupTargets'
import {
  addUserContentPublishedTarget,
  removeUserContentByKey,
  renameUserContentKey,
  syncUserContentFromAgents,
  updateUserContentLifecycle,
} from '../modules/team-collaboration-space/utils/userContentSync'
import {
  getContentLifecycleSnapshot,
  markContentActivated,
  markContentFrozen,
  markContentPublished,
  removeContentLifecycle,
  recordsEqual,
  setsEqual,
  subscribeContentLifecycle,
  syncContentLifecycleFromSnapshot,
} from '../modules/team-collaboration-space/utils/contentLifecycleSync'
import { resolveCurrentMemberId } from '../modules/team-collaboration-space/utils/currentMember'
import { SectionIterationVersionModal } from '../modules/team-collaboration-space/components/SectionIterationVersionModal'
import type { SectionIterationPublishPayload } from '../modules/team-collaboration-space/utils/appendSectionIterationRecord'
import { publishSectionIteration } from '../modules/team-collaboration-space/utils/publishSectionIteration'
import { tcsT } from '../modules/team-collaboration-space/i18n/strings'
import { useRbac } from '../auth/useRbac'
import {
  appMarketTemplateAttribution,
  getAgentCreatorDisplay,
  manualAgentAttribution,
  resolveAgentCreatorName,
} from '../utils/agentCardAttribution'
import { KNOWLEDGE_BASE_CATALOG } from '../modules/knowledge-base/data/catalog'
import { formatAgentCardMeta } from '../utils/formatAgentCardMeta'
import type {
  Agent,
  DropdownOption,
  MemoryLevel,
  MemoryMetadataDataFormat,
  MemoryMetadataMode,
  MemoryMetadataUpdateTiming,
  ManagerialAdvancedConfig,
  ManagerialAgentSettingsDraft,
  ManagerialStructuredOutputProperty,
  SchedulerMode,
  StoredMemoryItem,
  StructuredOutputPropertyType,
  SingleAgentSettingsDraft,
} from '../types/agent'

// ─── Module-level utilities ───────────────────────────────────────────────────

const pickAgentTag = (seed: string): 'Single Agent' | 'Managerial Agent' => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % 4 === 0 ? 'Managerial Agent' : 'Single Agent'
}

const PLAN_LIBRARY_SYNTHETIC_MANAGER_NAME = '入职工作流画布'
const MANAGERIAL_NAME_FORCE = new Set<string>([
  PLAN_LIBRARY_SYNTHETIC_MANAGER_NAME,
  '入职流程编排Agent',
])

function getAgentTag(name: string): 'Single Agent' | 'Managerial Agent' {
  if (MANAGERIAL_NAME_FORCE.has(name)) return 'Managerial Agent'
  return pickAgentTag(name)
}

function getAgentCardTagLabel(tag: string, locale: 'zh' | 'en'): string {
  if (locale === 'zh') return tag === 'Managerial Agent' ? '管理 Agent' : '单 Agent'
  return tag === 'Managerial Agent' ? 'Manager Agent' : 'Agent'
}

function clampTemperatureValue(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 10) / 10
}

function ManagerialAdvancedConfigIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M4.5 6.5h15M7.5 12h9M4.5 17.5h15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="6.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="10" cy="17.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

function getSchedulerDefaultInterval(mode: SchedulerMode): string {
  if (mode === 'hours' || mode === 'months') return '3'
  return '30'
}

function localizeAgentMeta(meta: string, locale: 'zh' | 'en') {
  return formatAgentCardMeta(meta, locale)
}

function getAgentCardDisplayName(agent: Agent, locale: 'zh' | 'en'): string {
  if (agent.label?.trim()) return agent.label.trim()
  if (agent.name === 'onboarding') {
    return locale === 'zh' ? '入职助手' : 'Onboarding Assistant'
  }
  return agent.name
}

type PreviewAttachment = {
  id: string
  name: string
}

type ManagerialPreviewMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachments?: PreviewAttachment[]
}

type PreviewSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: { results: ArrayLike<{ [index: number]: { transcript: string } }> }) => void) | null
}

type ManagerialAdvancedConfigNav =
  | 'reasoning'
  | 'model'
  | 'capabilities'
  | 'memory'
  | 'scheduling'
  | 'output'
  | 'safety'

type DataQueryConfigDraft = {
  modelConfig: string
  maxAttempts: number
  timeLimitSeconds: number
  autoTrainModel: boolean
  knowledgeBaseId: string
}

type ImageOutputProviderId = 'google' | 'openai' | 'xai'

type ImageOutputConfigDraft = {
  providerId: ImageOutputProviderId
  model: string
}

type AgentDetailFieldKey = 'agentRole' | 'agentGoal' | 'agentRules' | 'agentInstructions'

type AgentDetailFieldModalState = {
  agentKind: 'single' | 'managerial'
  fieldKey: AgentDetailFieldKey
  label: string
} | null

type MemoryProviderOption = {
  id: string
  label: string
  badge: string
}

type ShortTermMemoryMetadataDraft = {
  name: string
  mode: MemoryMetadataMode
  instruction: string
  updateTiming: MemoryMetadataUpdateTiming
  targetId: string
  dataFormat: MemoryMetadataDataFormat
  dataFormatOptions: string[]
}

function isMemoryMetadataSelectFormat(format: MemoryMetadataDataFormat): boolean {
  return format === 'single-option' || format === 'multiple-option'
}

function createDefaultMemoryMetadataFormatOptions(): string[] {
  return ['']
}

type MemoryMetadataFormatOptionsFieldLabels = {
  optionsLabel: string
  optionPlaceholder: string
  addOption: string
  removeOption: string
}

function MemoryMetadataFormatOptionsField({
  options,
  onChange,
  labels,
}: {
  options: string[]
  onChange: (next: string[]) => void
  labels: MemoryMetadataFormatOptionsFieldLabels
}) {
  const rows = options.length > 0 ? options : createDefaultMemoryMetadataFormatOptions()

  return (
    <div className="single-agent-field memory-metadata-format-options-field">
      <label className="single-agent-label">{labels.optionsLabel}</label>
      <div className="memory-metadata-format-options-stack">
            {rows.map((value, index) => {
              const isOnlyOption = rows.length === 1
              return (
                <div key={`memory-metadata-option-${index}`} className="memory-metadata-format-options-row">
                  <input
                    className="single-agent-input memory-metadata-format-options-input"
                    type="text"
                    value={value}
                    placeholder={labels.optionPlaceholder}
                    onChange={(event) => {
                      const next = [...rows]
                      next[index] = event.target.value
                      onChange(next)
                    }}
                    aria-label={index === 0 ? labels.optionPlaceholder : `${labels.optionPlaceholder} ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="memory-metadata-format-options-remove"
                    aria-label={`${labels.removeOption} ${index + 1}`}
                    title={labels.removeOption}
                    disabled={isOnlyOption}
                    onClick={() => {
                      if (isOnlyOption) return
                      const next = [...rows]
                      next.splice(index, 1)
                      onChange(next.length > 0 ? next : createDefaultMemoryMetadataFormatOptions())
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              )
            })}
        <button
          type="button"
          className="memory-metadata-format-options-add"
          onClick={() => onChange([...rows, ''])}
        >
          {labels.addOption}
        </button>
      </div>
    </div>
  )
}

type SchedulerConfigDraft = {
  mode: SchedulerMode
  interval: string
  atMinute: string
  weekday: string
  monthDay: string
  timeLabel: string
  timeMinute: string
  cronExpression: string
  maxRetries: number
  retryDelayMinutes: number
  schedulerInput: string
}

const IMAGE_OUTPUT_PROVIDER_OPTIONS: Array<{
  id: ImageOutputProviderId
  label: string
  models: string[]
}> = [
  { id: 'google', label: 'Google', models: ['Nano Banana Pro', 'Nano Banana', 'Nano Banana 2'] },
  { id: 'openai', label: 'OpenAI', models: ['GPT Image 1 Pro', 'GPT Image 1', 'DALL-E 3'] },
  { id: 'xai', label: 'xAI', models: ['Grok Vision Pro', 'Grok Vision', 'Aurora 1.5'] },
]

const MEMORY_PROVIDER_OPTIONS: MemoryProviderOption[] = [
  { id: 'amazon-bedrock-agentcore-memory', label: 'Amazon Bedrock AgentCore Memory', badge: 'BYOM' },
  { id: 'mem0-memory', label: 'Mem0 Memory', badge: 'BYOM' },
  { id: 'supermemory', label: 'SuperMemory', badge: 'BYOM' },
]

const MEMORY_LEVEL_OPTIONS: Array<{ value: MemoryLevel; labelZh: string; labelEn: string }> = [
  { value: 'low', labelZh: '低', labelEn: 'Low' },
  { value: 'medium', labelZh: '中', labelEn: 'Medium' },
  { value: 'high', labelZh: '高', labelEn: 'High' },
]

const MEMORY_METADATA_UPDATE_OPTIONS: Array<{
  value: MemoryMetadataUpdateTiming
  labelZh: string
  labelEn: string
}> = [
  { value: 'after-tool-run', labelZh: '工具运行后', labelEn: 'After tool run' },
  { value: 'after-trigger-received', labelZh: '收到触发器后', labelEn: 'After trigger received' },
]

const MEMORY_METADATA_RULE_DATA_FORMAT_OPTIONS: Array<{
  value: Exclude<MemoryMetadataDataFormat, 'text'>
  labelZh: string
  labelEn: string
}> = [
  { value: 'boolean', labelZh: '是/否', labelEn: 'True/False' },
  { value: 'count', labelZh: '成功工具运行次数', labelEn: 'Count of successful tool runs' },
]

const MEMORY_METADATA_AGENT_DECIDE_DATA_FORMAT_OPTIONS: Array<{
  value: Exclude<MemoryMetadataDataFormat, 'count'>
  labelZh: string
  labelEn: string
}> = [
  { value: 'text', labelZh: '文本', labelEn: 'Text' },
  { value: 'number', labelZh: '数字', labelEn: 'Number' },
  { value: 'boolean', labelZh: '是/否', labelEn: 'True/False' },
  { value: 'single-option', labelZh: '单选枚举', labelEn: 'Single-select Enum' },
  { value: 'multiple-option', labelZh: '多选枚举', labelEn: 'Multi-select Enum' },
]

const MEMORY_METADATA_TRIGGER_OPTIONS = [
  { id: 'webhook', labelZh: 'Webhook 触发', labelEn: 'Webhook Trigger' },
  { id: 'scheduler', labelZh: '定时调度', labelEn: 'Recurring Schedule' },
]

const SCHEDULER_WEEKDAY_OPTIONS = [
  { value: 'weekdays', labelZh: '工作日', labelEn: 'Weekdays' },
  { value: 'monday', labelZh: '周一', labelEn: 'Monday' },
  { value: 'tuesday', labelZh: '周二', labelEn: 'Tuesday' },
  { value: 'wednesday', labelZh: '周三', labelEn: 'Wednesday' },
  { value: 'thursday', labelZh: '周四', labelEn: 'Thursday' },
  { value: 'friday', labelZh: '周五', labelEn: 'Friday' },
  { value: 'saturday', labelZh: '周六', labelEn: 'Saturday' },
  { value: 'sunday', labelZh: '周日', labelEn: 'Sunday' },
] as const

const SCHEDULER_TIME_PRESET_OPTIONS = [
  { value: 'midnight', labelZh: '午夜', labelEn: 'Midnight', hour: '00' },
  { value: 'morning', labelZh: '早上 09 点', labelEn: 'Morning 09:00', hour: '09' },
  { value: 'noon', labelZh: '中午', labelEn: 'Noon', hour: '12' },
  { value: 'evening', labelZh: '晚上 18 点', labelEn: 'Evening 18:00', hour: '18' },
] as const

function getModelConfigOptionLabel(option: DropdownOption, locale: 'zh' | 'en') {
  if (option.id === 'default') return locale === 'zh' ? '默认' : 'Default'
  return option.title
}

function buildSchedulerExpressionFromDraft(draft: SchedulerConfigDraft) {
  switch (draft.mode) {
    case 'minutes':
      return `*/${draft.interval || '30'} * * * *`
    case 'hours':
      return `${draft.atMinute || '00'} */${draft.interval || '1'} * * *`
    case 'days':
      return `0 9 * * ${draft.weekday || '1-5'}`
    case 'months': {
      const preset = SCHEDULER_TIME_PRESET_OPTIONS.find((item) => item.value === draft.timeLabel) ?? SCHEDULER_TIME_PRESET_OPTIONS[0]
      return `${draft.timeMinute || '00'} ${preset.hour} ${draft.monthDay || '1'} */${draft.interval || '1'} *`
    }
    case 'cron':
    default:
      return draft.cronExpression || '0 0 * * *'
  }
}

function createPreviewSpeechRecognition(): PreviewSpeechRecognition | null {
  if (typeof globalThis.window === 'undefined') return null
  const w = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => PreviewSpeechRecognition
    webkitSpeechRecognition?: new () => PreviewSpeechRecognition
  }
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return ctor ? new ctor() : null
}

function formatManagerialResponseFormat(agent: ManagerialAgentSettingsDraft, locale: 'zh' | 'en') {
  const format = agent.advancedConfig.responseFormat
  if (locale === 'zh') {
    if (agent.advancedConfig.imageAsOutputEnabled) return '图片输出'
    if (agent.advancedConfig.structuredOutputEnabled || format === 'structured') return '结构化输出'
    return '文本'
  }
  if (agent.advancedConfig.imageAsOutputEnabled) return 'Image output'
  if (agent.advancedConfig.structuredOutputEnabled || format === 'structured') return 'Structured output'
  return 'Text'
}

function buildManagerialBehaviorSummary(agent: ManagerialAgentSettingsDraft, locale: 'zh' | 'en') {
  const schemaCount = agent.advancedConfig.structuredOutputProperties.filter((item) => item.key.trim()).length
  if (locale === 'zh') {
    const parts = [
      agent.advancedConfig.reasoningEnabled
        ? `已启用推理，最多 ${agent.advancedConfig.maxReasoningAttempts} 轮`
        : '未启用额外推理',
      agent.advancedConfig.allowDelegation ? '允许分发给成员 Agent' : '当前不自动分发成员 Agent',
      `输出模式为「${formatManagerialResponseFormat(agent, locale)}」`,
    ]
    if (schemaCount > 0 && agent.advancedConfig.structuredOutputEnabled) {
      parts.push(`包含 ${schemaCount} 个结构化字段`)
    }
    if (agent.advancedConfig.safeResponsibleAiEnabled || agent.advancedConfig.hallucinationManagerEnabled) {
      parts.push('高风险或不确定结果会触发审慎处理')
    }
    return parts.join('，')
  }

  const parts = [
    agent.advancedConfig.reasoningEnabled
      ? `reasoning enabled with up to ${agent.advancedConfig.maxReasoningAttempts} passes`
      : 'no extra reasoning pass',
    agent.advancedConfig.allowDelegation ? 'delegation enabled' : 'delegation disabled',
    `response mode: ${formatManagerialResponseFormat(agent, locale)}`,
  ]
  if (schemaCount > 0 && agent.advancedConfig.structuredOutputEnabled) {
    parts.push(`${schemaCount} structured fields`)
  }
  if (agent.advancedConfig.safeResponsibleAiEnabled || agent.advancedConfig.hallucinationManagerEnabled) {
    parts.push('guardrails enabled for risky or uncertain outputs')
  }
  return parts.join(', ')
}

function createManagerialPreviewGreeting(agent: ManagerialAgentSettingsDraft, locale: 'zh' | 'en'): ManagerialPreviewMessage {
  return {
    id: `manager-preview-greeting-${Date.now()}`,
    role: 'assistant',
    text:
      locale === 'zh'
        ? `你好！我是${agent.name}，可以帮你协调多个子智能体来完成复杂任务。当前 ${buildManagerialBehaviorSummary(agent, locale)}。`
        : `Hello! I'm ${agent.name} and I can coordinate multiple subagents to complete complex tasks. Right now ${buildManagerialBehaviorSummary(agent, locale)}.`,
  }
}

function createSinglePreviewGreeting(name: string, locale: 'zh' | 'en'): ManagerialPreviewMessage {
  return {
    id: `single-preview-greeting-${Date.now()}`,
    role: 'assistant',
    text:
      locale === 'zh'
        ? `你好！我是${name}，可以根据我的职责描述来回答问题，并帮助你完成当前任务。`
        : `Hello! I'm ${name}. I can answer questions based on my role description and help with the current task.`,
  }
}

function buildManagerialPreviewReply(
  question: string,
  agent: ManagerialAgentSettingsDraft,
  locale: 'zh' | 'en',
  attachments: PreviewAttachment[],
): string {
  const normalized = question.trim().toLowerCase()
  const promptText = (agent.generatedPrompt || agent.instructions || '').trim()
  const memberNames = agent.managerAgents.map((item) => item.agentName).filter(Boolean)
  const skills = agent.skills.filter(Boolean)
  const knowledge = agent.knowledge.filter(Boolean)
  const tools = agent.tools.filter(Boolean)
  const attachmentLine =
    attachments.length > 0
      ? locale === 'zh'
        ? ` 我已看到你附带的文件：${attachments.map((item) => item.name).join('、')}。`
        : ` I can see the attached files: ${attachments.map((item) => item.name).join(', ')}.`
      : ''

  if (/你是谁|介绍一下你自己|who are you|what are you/.test(normalized)) {
    return locale === 'zh'
      ? `我是${agent.name}。${promptText || '我负责统筹多个子智能体、分发任务并汇总结果。'}${attachmentLine}`
      : `I'm ${agent.name}. ${promptText || 'I orchestrate subagents, delegate work, and summarize outcomes.'}${attachmentLine}`
  }

  if (/能做什么|做什么|能力|help|what can you do/.test(normalized)) {
    return locale === 'zh'
      ? `${agent.name} 主要负责管理和编排多个 Agent，当前分发策略是「${agent.delegationStrategy}」，审批模式是「${agent.approvalMode}」，并且 ${buildManagerialBehaviorSummary(agent, locale)}。${memberNames.length > 0 ? `当前已配置的成员包括：${memberNames.join('、')}。` : '当前还没有配置成员 Agent。'}${attachmentLine}`
      : `${agent.name} manages and orchestrates multiple agents. The current delegation strategy is "${agent.delegationStrategy}", the approval mode is "${agent.approvalMode}", and ${buildManagerialBehaviorSummary(agent, locale)}.${memberNames.length > 0 ? ` Configured members: ${memberNames.join(', ')}.` : ' No member agents are configured yet.'}${attachmentLine}`
  }

  if (/成员|agent|子智能体|subagent/.test(normalized)) {
    return locale === 'zh'
      ? memberNames.length > 0
        ? `当前我会协调这些子智能体：${memberNames.join('、')}。如果你希望，我也可以根据任务内容建议更合适的分工方式。${attachmentLine}`
        : `当前还没有配置具体的子智能体，你可以先在左侧添加 Agent 成员。${attachmentLine}`
      : memberNames.length > 0
        ? `I currently coordinate these subagents: ${memberNames.join(', ')}. I can also suggest a better split of responsibilities if needed.${attachmentLine}`
        : `There are no subagents configured yet. You can add member agents from the left panel first.${attachmentLine}`
  }

  if (/技能|skill|工具|tool|知识库|knowledge|model|模型/.test(normalized)) {
    return locale === 'zh'
      ? `${agent.name} 当前挂载的技能有 ${skills.length > 0 ? skills.join('、') : '暂无'}，知识库有 ${knowledge.length > 0 ? knowledge.join('、') : '暂无'}，工具有 ${tools.length > 0 ? tools.join('、') : '暂无'}。${attachmentLine}`
      : `${agent.name} currently has skills: ${skills.length > 0 ? skills.join(', ') : 'none'}, knowledge sources: ${knowledge.length > 0 ? knowledge.join(', ') : 'none'}, and tools: ${tools.length > 0 ? tools.join(', ') : 'none'}.${attachmentLine}`
  }

  return locale === 'zh'
    ? `我已收到你的问题：「${question.trim()}」。基于当前配置，${agent.name}${agent.advancedConfig.allowDelegation ? ' 会先判断是否需要把任务拆分给成员 Agent，并按「' + agent.delegationStrategy + '」进行分发' : ' 会先在管理层完成推理和判断，再以人工可控的方式推进，不主动分发给成员 Agent'}，同时按「${agent.approvalMode}」处理审批；输出会采用「${formatManagerialResponseFormat(agent, locale)}」方式返回${agent.advancedConfig.hallucinationManagerEnabled ? '，对不确定信息会明确标记待确认' : ''}。${attachmentLine}`
    : `I received your question: "${question.trim()}". Based on the current setup, ${agent.name}${agent.advancedConfig.allowDelegation ? ` will decide whether the task should be delegated and route it with "${agent.delegationStrategy}"` : ' will keep the task in manager-controlled mode before any handoff'}, apply "${agent.approvalMode}" when approval is required, and respond in ${formatManagerialResponseFormat(agent, locale)} mode${agent.advancedConfig.hallucinationManagerEnabled ? ' while marking uncertain information for verification' : ''}.${attachmentLine}`
}

function buildSinglePreviewReply(
  question: string,
  agent: SingleAgentSettingsDraft,
  locale: 'zh' | 'en',
  attachments: PreviewAttachment[],
): string {
  const normalized = question.trim().toLowerCase()
  const promptText = (agent.generatedPrompt || agent.instructions || '').trim()
  const skills = agent.skills.filter(Boolean)
  const knowledge = agent.knowledge.filter(Boolean)
  const tools = agent.tools.filter(Boolean)
  const managerMembers = agent.managerAgents.map((item) => item.agentName).filter(Boolean)
  const attachmentLine =
    attachments.length > 0
      ? locale === 'zh'
        ? ` 我已看到你附带的文件：${attachments.map((item) => item.name).join('、')}。`
        : ` I can see the attached files: ${attachments.map((item) => item.name).join(', ')}.`
      : ''

  if (/你是谁|介绍一下你自己|who are you|what are you/.test(normalized)) {
    return locale === 'zh'
      ? `我是${agent.name}。${promptText || '我会围绕当前职责说明来完成任务和答疑。'}${attachmentLine}`
      : `I'm ${agent.name}. ${promptText || 'I work according to my configured role description and can help answer questions.'}${attachmentLine}`
  }

  if (/能做什么|做什么|能力|help|what can you do/.test(normalized)) {
    return locale === 'zh'
      ? `${agent.name} 当前主要依据描述与提示词来处理任务。${skills.length > 0 ? `已启用技能：${skills.join('、')}。` : ''}${tools.length > 0 ? `可用工具：${tools.join('、')}。` : ''}${attachmentLine}`
      : `${agent.name} currently works according to its prompt and description.${skills.length > 0 ? ` Enabled skills: ${skills.join(', ')}.` : ''}${tools.length > 0 ? ` Available tools: ${tools.join(', ')}.` : ''}${attachmentLine}`
  }

  if (/知识库|knowledge|工具|tool|技能|skill/.test(normalized)) {
    return locale === 'zh'
      ? `${agent.name} 当前挂载的技能有 ${skills.length > 0 ? skills.join('、') : '暂无'}，知识库有 ${knowledge.length > 0 ? knowledge.join('、') : '暂无'}，工具有 ${tools.length > 0 ? tools.join('、') : '暂无'}。${attachmentLine}`
      : `${agent.name} currently has skills: ${skills.length > 0 ? skills.join(', ') : 'none'}, knowledge sources: ${knowledge.length > 0 ? knowledge.join(', ') : 'none'}, and tools: ${tools.length > 0 ? tools.join(', ') : 'none'}.${attachmentLine}`
  }

  if (/manager|管理|协同|子智能体|agent member/.test(normalized) && agent.managerEnabled) {
    return locale === 'zh'
      ? managerMembers.length > 0
        ? `当前这个单 Agent 已启用 Manager Agent 协同模式，可联动这些成员：${managerMembers.join('、')}。${attachmentLine}`
        : `当前这个单 Agent 已启用 Manager Agent 模式，但还没有配置成员 Agent。${attachmentLine}`
      : managerMembers.length > 0
        ? `This single agent currently has Manager Agent collaboration enabled and can work with: ${managerMembers.join(', ')}.${attachmentLine}`
        : `This single agent has Manager Agent mode enabled, but no member agents are configured yet.${attachmentLine}`
  }

  return locale === 'zh'
    ? `我已收到你的问题：「${question.trim()}」。根据当前配置，${agent.name} 会结合自身描述、已启用技能与工具来给出回答或执行建议。${attachmentLine}`
    : `I received your question: "${question.trim()}". Based on the current setup, ${agent.name} will respond using its configured description, skills, and available tools.${attachmentLine}`
}

const initialAgents: Agent[] = [
  {
    name: '入职流程编排Agent',
    desc: 'Master coordinator managing the entire employee onboarding workflow by delegating tasks to…',
    meta: 'yesterday',
  },
  {
    name: 'onboarding',
    desc: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',
    meta: '19 days ago',
  },
  {
    name: 'Leave Approval Workflow Agent',
    desc: 'Multi-level PTO approval workflow agent that routes vacation requests through manager and H…',
    meta: '19 days ago',
  },
  {
    name: 'Orientation Scheduler Agent',
    desc: 'Coordinates orientation schedules, team introductions, and first-day logistics',
    meta: '20 days ago',
  },
  {
    name: 'Onboarding Support Agent',
    desc: 'Answers employee questions and provides support throughout the onboarding process',
    meta: '20 days ago',
  },
  {
    name: 'Training Coordinator Agent',
    desc: 'Assigns training courses and tracks employee training progress',
    meta: '20 days ago',
  },
  {
    name: 'Account Setup Agent',
    desc: 'Creates and configures employee accounts and access credentials',
    meta: '20 days ago',
  },
  {
    name: 'Document Collection Agent',
    desc: 'Manages employee document collection and verification during onboarding',
    meta: '20 days ago',
  },
  {
    name: 'HR Onboarding Agent',
    desc: 'Automates new-hire onboarding: generates personalized welcome emails, builds role-specific…',
    meta: '20 days ago',
  },
  {
    name: 'Chief Technology Editor',
    desc: 'A senior editor who ensures article quality and coordinates the research and…',
    meta: '26 days ago',
  },
  {
    name: 'Technology Writer',
    desc: 'A renowned technology writer skilled at making complex technical concepts accessible through…',
    meta: '27 days ago',
  },
  {
    name: 'Technology Researcher',
    desc: 'Skilled in gathering and validating the latest technical information to…',
    meta: '27 days ago',
  },
]

function pickRandomDemoFrozenAgentName(): string {
  const index = Math.floor(Math.random() * initialAgents.length)
  return initialAgents[index]?.name ?? initialAgents[0]!.name
}

const modelConfigOptions: DropdownOption[] = [
  { id: 'default', title: '默认', description: 'chatOpenAICustom' },
  { id: 'qwen-test', title: 'Qwen-test', description: 'chatOpenAICustom' },
]
const instructionTemplates = [
  '总结文档',
  '翻译语言',
  '撰写邮件',
  '代码转换',
  '调研并生成报告',
  '规划旅行',
] as const

function getInstructionTemplateLabel(template: (typeof instructionTemplates)[number], locale: 'zh' | 'en') {
  if (locale === 'zh') return template

  switch (template) {
    case '总结文档':
      return 'Summarize document'
    case '翻译语言':
      return 'Translate language'
    case '撰写邮件':
      return 'Write email'
    case '代码转换':
      return 'Convert code'
    case '调研并生成报告':
      return 'Research and generate report'
    case '规划旅行':
      return 'Plan a trip'
    default:
      return template
  }
}
const defaultSkillOptions: DropdownOption[] = [
  {
    id: 'agent-test-skill',
    title: '智能体测试技能',
    description: '用于智能体测试的技能。',
  },
  {
    id: 'searchable-skill-b',
    title: '可搜索技能 B',
    description: '描述 B',
  },
  {
    id: 'searchable-skill-a',
    title: '可搜索技能 A',
    description: '描述 A',
  },
  {
    id: 'view-toggle-test-skill',
    title: '视图切换测试技能',
    description: '用于测试视图切换。',
  },
  {
    id: 'test-skill-e2e',
    title: '端到端测试技能',
    description: '这是由 Playwright E2E 测试创建的测试技能。',
  },
  {
    id: 'skill-edited',
    title: '已编辑技能',
    description: '原始描述。',
  },
  {
    id: 'python-code-executor',
    title: 'Python 代码执行器',
    description: '用于执行 Python 脚本。',
  },
]
const knowledgeOptions: DropdownOption[] = [
  {
    id: 'employee-onboarding-docs',
    title: '员工入职文档',
    description: '包含制度说明、录用通知、首日检查清单和入职 SOP。',
  },
  {
    id: 'hr-faq',
    title: 'HR 常见问题库',
    description: '包含请假、薪资、福利和报销等高频问题。',
  },
  {
    id: 'security-guidelines',
    title: '安全规范',
    description: '包含安全意识手册、密码策略和设备合规要求。',
  },
]
const defaultToolOptions: DropdownOption[] = [
  { id: '163-email', title: '163 邮箱', description: '发送邮件工具。' },
  {
    id: 'news',
    title: '新闻',
    description: '股票市场搜索查询（例如：股票市场、科技股）。',
  },
  {
    id: 'show-alert',
    title: '显示提醒',
    description:
      '在用户页面上显示一条自定义提醒信息，AI 可以用它向用户展示重要通知。',
  },
  {
    id: 'json-formatter',
    title: 'JSON 格式化',
    description: '将原始 JSON 字符串按 2 空格缩进进行美化输出。',
  },
  {
    id: 'word-count',
    title: '字数统计',
    description: '统计给定文本中的词数。',
  },
  {
    id: 'string-reverse',
    title: '字符串反转',
    description: '将输入的字符串按字符顺序反转。',
  },
  {
    id: 'current-date-time',
    title: '当前日期时间',
    description: '返回当前 UTC 日期时间，格式为 ISO 8601，无需输入参数。',
  },
]

function buildToolDropdownOptions(items: ToolDirectoryItem[]): DropdownOption[] {
  return items.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    meta: item.type,
  }))
}
const managerialDelegationOptions: DropdownOption[] = [
  { id: 'capability-routing', title: '按能力路由', description: '根据任务类型自动分配给最合适的子智能体。' },
  { id: 'sequential', title: '顺序编排', description: '按照预设顺序逐步执行并传递阶段结果。' },
  { id: 'parallel', title: '并行协作', description: '多个子智能体同时执行，再由管理型智能体汇总。' },
  { id: 'conditional', title: '条件分支', description: '基于输入条件、风险等级或置信度走不同分支。' },
]
const managerialApprovalOptions: DropdownOption[] = [
  { id: 'auto', title: '自动通过', description: '满足规则后自动流转，无需人工审批。' },
  { id: 'key-nodes', title: '关键节点审批', description: '仅在关键决策节点需要审批确认。' },
  { id: 'all-manual', title: '全程人工审批', description: '所有阶段输出都需要人工确认。' },
  { id: 'exception-only', title: '异常时升级审批', description: '仅在异常或风险条件触发时升级审批。' },
]
const managerialEscalationOptions: DropdownOption[] = [
  { id: 'sla-risk', title: '时效风险', description: '任务超时、排队过长或响应 SLA 即将超限。' },
  { id: 'quality-risk', title: '质量风险', description: '结果缺失、置信度偏低或多轮纠错失败。' },
  { id: 'compliance-risk', title: '合规风险', description: '涉及权限、隐私、审批或制度冲突。' },
  { id: 'handoff-failure', title: '交接失败', description: '子智能体返回失败、上下文不完整或无法继续。' },
]

const structuredOutputTypeOptions: Array<{ value: StructuredOutputPropertyType; label: string }> = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
]

const createStructuredOutputProperty = (
  id: string,
  key: string,
  type: StructuredOutputPropertyType,
  description: string,
  required = false,
): ManagerialStructuredOutputProperty => ({
  id,
  key,
  type,
  description,
  required,
})

const hashSeed = (seed: string, factor = 31) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * factor + seed.charCodeAt(i)) >>> 0
  return h >>> 0
}

const pickOptionIds = (
  options: DropdownOption[],
  seed: string,
  count: number,
  factor: number,
) => {
  if (options.length === 0 || count <= 0) return []
  const start = hashSeed(seed, factor) % options.length
  const result: string[] = []
  for (let i = 0; i < Math.min(count, options.length); i++) {
    result.push(options[(start + i) % options.length].id)
  }
  return result
}

const pickInstructionTemplateForAgent = (agent: Agent) => {
  const text = `${agent.name} ${agent.desc}`.toLowerCase()
  if (text.includes('writer') || text.includes('editor')) return '撰写邮件'
  if (text.includes('research')) return '调研并生成报告'
  if (text.includes('document')) return '总结文档'
  if (text.includes('support')) return '翻译语言'
  return '调研并生成报告'
}

const buildInstructionContextForAgent = (agent: Agent) => {
  return `${agent.desc.replace(/…/g, '').trim()}。请优先输出实用结果、清晰结构以及贴合该角色的判断。`
}

const buildGeneratedPrompt = (agentName: string, template: string, details: string) => {
  const trimmedDetails = details.trim() || '请结合提供的上下文完成任务。'
  const taskFocus =
    template === '总结文档'
      ? '将文档内容提炼为清晰的重点摘要'
      : template === '翻译语言'
        ? '在保留语气、意图和术语准确性的前提下完成翻译'
        : template === '撰写邮件'
          ? '起草清晰、得体且可直接发送的邮件'
          : template === '代码转换'
            ? '在保持原有逻辑不变的前提下完成代码语言转换'
            : template === '调研并生成报告'
              ? '完成信息调研并输出结构化报告'
              : '规划一个实用、清晰且包含建议的旅行方案'

  return `# 角色
你是 **${agentName}**，一个专门用于${taskFocus}的单智能体。

## 任务背景
${trimmedDetails}

## 目标
- 在回复前先准确理解用户目标。
- 输出直接可用的结果，而不是泛泛而谈的建议。
- 保持结果与当前任务类型一致。

## 输出要求
- 使用清晰的分节标题。
- 在合适的时候使用简洁的项目符号。
- 明确标出假设条件或缺失信息。

## 语气
- 保持专业、冷静、面向执行。
- 避免不必要的铺垫和冗余表述。

## 最终检查
- 确保回复内容完整。
- 确保输出易于阅读并且可以直接使用。`
}

const sanitizeAgentContext = (agent: Agent) => agent.desc.replace(/…/g, '').trim() || '处理当前角色相关任务'

const buildAgentRoleDraft = (agent: Agent, managerial: boolean) =>
  managerial
    ? `${agent.name}，负责统筹多个子智能体协作、任务拆解与结果交付。`
    : `${agent.name}，负责独立处理与当前主题相关的专业任务。`

const buildAgentGoalDraft = (agent: Agent, managerial: boolean) =>
  managerial
    ? `围绕「${sanitizeAgentContext(agent)}」制定执行路径，协调成员 Agent 推进任务，并对最终结果负责。`
    : `围绕「${sanitizeAgentContext(agent)}」快速理解用户意图，输出可直接执行或交付的结果。`

const LEGACY_MANAGERIAL_DESCRIPTION_DRAFT =
  '先明确最终目标与约束，再拆解阶段任务、分配合适成员、跟踪进展并汇总结论。遇到异常时优先升级处理。'

const buildManagerialDescriptionDraft = (agent: Agent) => {
  const context = sanitizeAgentContext(agent)
  return `${agent.name}可以帮助你处理「${context}」相关的复杂任务，自动拆解步骤、协调合适的成员 Agent，并汇总最终结果，让多角色协作更高效。`
}

const buildAgentInstructionsDraft = (agent: Agent, managerial: boolean) =>
  managerial
    ? buildManagerialDescriptionDraft(agent)
    : `先澄清用户需求与上下文，再独立完成分析、生成内容或给出建议；输出保持清晰、完整、可执行。`

const syncManagerialDescriptionDraft = (
  draft: ManagerialAgentSettingsDraft,
  agent: Agent,
): ManagerialAgentSettingsDraft => {
  const nextDescription = buildManagerialDescriptionDraft(agent)
  if (!draft.agentInstructions.trim() || draft.agentInstructions === LEGACY_MANAGERIAL_DESCRIPTION_DRAFT) {
    return {
      ...draft,
      agentInstructions: nextDescription,
    }
  }
  return draft
}

const buildAgentRulesDraft = (agent: Agent, managerial: boolean) =>
  managerial
    ? `保持任务拆解清晰；涉及风险与审批时先确认；信息不足时明确标注待确认；最终输出要可追踪、可交付。`
    : `优先保证准确性与可用性；不要臆测缺失信息；输出尽量结构化；必要时明确假设与限制。`

const buildGeneratedRole = (agentName: string, details: string, managerial: boolean) => {
  const trimmedDetails = details.trim() || '处理关键任务并输出高质量结果'
  return managerial
    ? `${agentName}，负责围绕“${trimmedDetails}”协调成员 Agent、推进关键决策并对最终交付结果负责。`
    : `${agentName}，负责围绕“${trimmedDetails}”独立完成分析、执行与结果输出。`
}

const getPreviewTextareaRows = (value: string) => {
  const rows = value.split(/\r?\n/).filter((line) => line.trim().length > 0).length
  return Math.min(4, Math.max(1, rows || 1))
}

const getAdaptiveTextareaRows = (
  value: string,
  options?: {
    minRows?: number
    maxRows?: number
    charsPerRow?: number
  },
) => {
  const { minRows = 3, maxRows = 12, charsPerRow = 26 } = options ?? {}
  const normalizedValue = value.trim().length > 0 ? value : ''
  const estimatedRows = normalizedValue.split(/\r?\n/).reduce((total, line) => {
    const nextLine = line.trim().length > 0 ? line.length : 1
    return total + Math.max(1, Math.ceil(nextLine / charsPerRow))
  }, 0)

  return Math.min(maxRows, Math.max(minRows, estimatedRows || minRows))
}

const buildDefaultStoredMemories = (agent: Agent): StoredMemoryItem[] => [
  {
    id: `${agent.name}-memory-1`,
    content: `${agent.name} 需要优先保留最近一次任务里的关键背景与交付约束。`,
    source: '系统默认',
    createdAt: '今天 09:00',
    lastUsedAt: '5 分钟前',
  },
  {
    id: `${agent.name}-memory-2`,
    content: '用户偏好使用结构化结论与简洁行动项输出。',
    source: '用户偏好',
    createdAt: '昨天 16:30',
    lastUsedAt: '1 小时前',
  },
]

const createShortTermMemoryMetadataDraft = (toolIds: string[]): ShortTermMemoryMetadataDraft => ({
  name: '',
  mode: 'agent-decide',
  instruction: '',
  updateTiming: 'after-tool-run',
  targetId: toolIds[0] ?? '',
  dataFormat: 'text',
  dataFormatOptions: [],
})

const createSingleAgentDraft = (
  agent: Agent,
  skillOptions: DropdownOption[],
  toolOptions: DropdownOption[],
): SingleAgentSettingsDraft => {
  const template = pickInstructionTemplateForAgent(agent)
  const generatedPrompt = buildGeneratedPrompt(
    agent.name,
    template,
    buildInstructionContextForAgent(agent),
  )

  return {
    name: agent.name,
    avatar: '',
    agentRole: buildAgentRoleDraft(agent, false),
    agentGoal: buildAgentGoalDraft(agent, false),
    agentInstructions: buildAgentInstructionsDraft(agent, false),
    agentRules: buildAgentRulesDraft(agent, false),
    modelConfig: hashSeed(agent.name, 29) % 2 === 0 ? '默认' : 'Qwen-test',
    instructions: generatedPrompt,
    generatedPrompt,
    managerEnabled: false,
    advancedConfig: createDefaultManagerialAdvancedConfig(agent),
    managerAgents: [
      {
        id: `${agent.name}-member-1`,
        agentName: '',
        usage: '',
        source: 'agent',
      },
      {
        id: `${agent.name}-member-2`,
        agentName: '',
        usage: '',
        source: 'agent',
      },
    ],
    skills: pickOptionIds(skillOptions, agent.name, 2, 43),
    knowledge: pickOptionIds(knowledgeOptions, agent.name, 1, 47),
    tools: pickOptionIds(toolOptions, agent.name, 3, 53),
  }
}

const initialSingleAgentMemberOptions: DropdownOption[] = initialAgents
  .filter((agent) => getAgentTag(agent.name) === 'Single Agent')
  .map((agent) => ({
    id: agent.name,
    title: agent.name,
    description: agent.desc.replace(/…/g, '').trim(),
  }))

const ONBOARDING_MANAGER_AGENT_NAME = '入职流程编排Agent'

const isOnboardingManagerAgent = (agentName: string) => agentName === ONBOARDING_MANAGER_AGENT_NAME

const buildOnboardingManagerAgents = (agentName: string): ManagerialAgentSettingsDraft['managerAgents'] => [
  {
    id: `${agentName}-member-1`,
    agentName: 'IT 开通协调Agent',
    usage: '负责开通账号、系统权限与常用应用，并同步必要的使用说明。',
    source: 'agent',
  },
  {
    id: `${agentName}-member-2`,
    agentName: '设备与权限开通Agent',
    usage: '负责安排设备、工牌与访问权限，确保入职前的资源准备到位。',
    source: 'agent',
  },
  {
    id: `${agentName}-member-3`,
    agentName: '企业文化宣讲Agent',
    usage: '负责企业文化介绍、制度讲解与培训引导，帮助新人快速融入团队。',
    source: 'agent',
  },
]

const normalizeManagerialDraft = (
  draft: ManagerialAgentSettingsDraft,
): ManagerialAgentSettingsDraft => {
  if (!isOnboardingManagerAgent(draft.name)) return draft
  return {
    ...draft,
    managerEnabled: true,
    managerAgents: buildOnboardingManagerAgents(draft.name),
  }
}

const hasSameManagerAgentRows = (
  left: ManagerialAgentSettingsDraft['managerAgents'],
  right: ManagerialAgentSettingsDraft['managerAgents'],
) =>
  left.length === right.length &&
  left.every(
    (row, index) =>
      row.agentName === right[index]?.agentName &&
      row.usage === right[index]?.usage &&
      row.source === right[index]?.source,
  )

const createDefaultManagerAgents = (agent: Agent): ManagerialAgentSettingsDraft['managerAgents'] => {
  if (isOnboardingManagerAgent(agent.name)) {
    return buildOnboardingManagerAgents(agent.name)
  }

  return [
    {
      id: `${agent.name}-member-1`,
      agentName:
        initialSingleAgentMemberOptions[
          hashSeed(agent.name, 101) % Math.max(1, initialSingleAgentMemberOptions.length)
        ]?.title ?? '',
      usage: '负责处理首个关键子任务，并将结果回传给管理型智能体。',
      source: 'agent',
    },
    {
      id: `${agent.name}-member-2`,
      agentName: '',
      usage: '',
      source: 'agent',
    },
  ]
}

const createDefaultManagerialAdvancedConfig = (agent: Agent): ManagerialAdvancedConfig => ({
  reasoningEnabled: true,
  thinkingEnabled: false,
  maxReasoningAttempts: 3 + (hashSeed(agent.name, 141) % 3),
  allowDelegation: true,
  maxIterations: 12 + (hashSeed(agent.name, 143) % 5),
  maxRpm: 40 + (hashSeed(agent.name, 149) % 3) * 20,
  maxExecutionTime: 900 + (hashSeed(agent.name, 151) % 3) * 300,
  temperature: 0.2,
  useProviderDefaults: true,
  maxTokens: 4096,
  responseFormat: 'structured',
  structuredOutputEnabled: true,
  structuredOutputProperties: [
    createStructuredOutputProperty(`${agent.name}-summary`, 'summary', 'string', '本次任务的总体结论。', true),
    createStructuredOutputProperty(`${agent.name}-next-actions`, 'next_actions', 'array', '下一步行动建议列表。'),
    createStructuredOutputProperty(`${agent.name}-risks`, 'risks', 'array', '需要重点关注的风险与阻塞项。'),
  ],
  outputExamplesText:
    'Example:\n- summary: 已完成入职任务拆分与执行摘要\n- next_actions: ["通知 IT 完成权限开通", "向 HR 同步培训安排"]\n- risks: ["设备发放存在延迟风险"]',
  dataQueryEnabled: false,
  dataQueryModelConfig: modelConfigOptions[0]?.title ?? '',
  dataQueryMaxAttempts: 3,
  dataQueryTimeLimitSeconds: 60,
  dataQueryAutoTrainModel: false,
  dataQueryKnowledgeBaseId: '',
  schedulerEnabled: false,
  schedulerExpression: '0 9 * * 1-5',
  schedulerMode: 'minutes',
  schedulerInterval: '30',
  schedulerAtMinute: '00',
  schedulerWeekday: 'weekdays',
  schedulerMonthDay: '1',
  schedulerTimeLabel: 'midnight',
  schedulerTimeMinute: '00',
  schedulerCronExpression: '0 0 * * *',
  schedulerMaxRetries: 3,
  schedulerRetryDelayMinutes: 10,
  schedulerInput: '执行任务',
  webhookTriggerEnabled: false,
  webhookPath: '/hooks/manager-agent',
  memoryEnabled: false,
  memoryType: 'short-term',
  memoryProvider: MEMORY_PROVIDER_OPTIONS[0]?.id ?? '',
  memoryMaxShortTermMessages: 50,
  shortTermMemoryMetadata: [],
  longTermMemoryEnabled: false,
  memoryLevel: 'medium',
  storedMemories: buildDefaultStoredMemories(agent),
  memoryWriteRules: '允许写入用户偏好、项目背景、稳定业务规则与长期有效的事实信息；不要写入敏感信息、临时测试数据或无关闲聊。',
  memoryReadRules: '回答前优先读取与当前任务相关的历史偏好、项目约束和流程规则，仅在确有帮助时引用记忆。',
  memoryDeleteDisabled: true,
  memoryNotes: '记录成员 Agent 历史交付质量、升级记录和常见阻塞项，供后续任务复用。',
  voiceAgentEnabled: false,
  contextEnabled: true,
  contextText: '优先读取当前工作区中的任务上下文、绑定知识库与最近运行记录，再决定是否分发给成员 Agent。',
  fileAsOutputEnabled: true,
  imageAsOutputEnabled: false,
  imageOutputProvider: 'google',
  imageOutputModel: '',
  safeResponsibleAiEnabled: true,
  safeResponsibleAiNotes: '涉及权限开通、账号变更或外部通知时，必须先完成校验并保留审计说明。',
  hallucinationManagerEnabled: true,
  hallucinationManagerNotes: '当成员 Agent 提供的信息来源不充分时，返回待确认状态，而不是直接给出确定性结论。',
  versionControlEnabled: true,
  versionControlNotes: '保存配置变更摘要，并支持回溯最近一次字段修改。',
})

const createManagerialAgentDraft = (
  agent: Agent,
  skillOptions: DropdownOption[],
  toolOptions: DropdownOption[],
): ManagerialAgentSettingsDraft => {
  const generatedPrompt = `# 角色
你是 **${agent.name}**，一个负责协调多个子智能体的管理型智能体。

## 管理目标
围绕整体任务目标拆解阶段、分发子任务、跟踪执行状态，并在必要时做审批与升级判断。

## 编排职责
- 理解用户最终目标并拆解出可执行子任务。
- 根据任务类型将工作分派给最合适的子智能体。
- 汇总各子智能体结果并输出统一结论。

## 治理要求
- 重点关注时效、质量、合规与交接完整性。
- 出现异常时触发升级或人工审批。
- 对最终输出负责，保证结果清晰可用。`

  return {
    name: agent.name,
    avatar: '',
    agentRole: buildAgentRoleDraft(agent, true),
    agentGoal: buildAgentGoalDraft(agent, true),
    agentInstructions: buildAgentInstructionsDraft(agent, true),
    agentRules: buildAgentRulesDraft(agent, true),
    modelConfig: hashSeed(agent.name, 29) % 2 === 0 ? '默认' : 'Qwen-test',
    instructions: generatedPrompt,
    generatedPrompt,
    skills: pickOptionIds(skillOptions, agent.name, 2, 67),
    knowledge: pickOptionIds(knowledgeOptions, agent.name, 1, 71),
    tools: pickOptionIds(toolOptions, agent.name, 2, 73),
    managerGoal: `${agent.desc.replace(/…/g, '').trim()}。重点负责跨节点协调、任务汇总和最终结果把关。`,
    memberAgents: pickOptionIds(initialSingleAgentMemberOptions, agent.name, 3, 79),
    delegationStrategy: managerialDelegationOptions[hashSeed(agent.name, 83) % managerialDelegationOptions.length].title,
    approvalMode: managerialApprovalOptions[hashSeed(agent.name, 89) % managerialApprovalOptions.length].title,
    escalationTriggers: pickOptionIds(managerialEscalationOptions, agent.name, 2, 97),
    successCriteria: '所有关键子任务均完成；结果通过质量检查；无阻塞项；最终输出满足业务目标并可直接交付。',
    managerNotes: '适合用于多阶段、多角色协同任务。优先让管理型智能体聚焦调度、汇总与升级判断。',
    managerEnabled: true,
    managerAgents: createDefaultManagerAgents(agent),
    advancedConfig: createDefaultManagerialAdvancedConfig(agent),
  }
}

const createManagerialDraftFromSingle = (
  draft: SingleAgentSettingsDraft,
  skillOptions: DropdownOption[],
  toolOptions: DropdownOption[],
): ManagerialAgentSettingsDraft => ({
  ...createManagerialAgentDraft({ name: draft.name, desc: draft.instructions, meta: 'just now' }, skillOptions, toolOptions),
  name: draft.name,
  avatar: draft.avatar,
  agentRole: draft.agentRole,
  agentGoal: draft.agentGoal,
  agentInstructions: draft.agentInstructions,
  agentRules: draft.agentRules,
  modelConfig: draft.modelConfig,
  instructions: draft.instructions,
  generatedPrompt: draft.generatedPrompt,
  skills: draft.skills,
  knowledge: draft.knowledge,
  tools: draft.tools,
  advancedConfig: draft.advancedConfig,
  managerEnabled: true,
  managerAgents:
    isOnboardingManagerAgent(draft.name)
      ? buildOnboardingManagerAgents(draft.name)
      : draft.managerAgents.length > 0
        ? draft.managerAgents
        : createManagerialAgentDraft({ name: draft.name, desc: draft.instructions, meta: 'just now' }, skillOptions, toolOptions)
            .managerAgents,
})

const createSingleDraftFromManagerial = (
  draft: ManagerialAgentSettingsDraft,
): SingleAgentSettingsDraft => ({
  name: draft.name,
  avatar: draft.avatar,
  agentRole: draft.agentRole,
  agentGoal: draft.agentGoal,
  agentInstructions: draft.agentInstructions,
  agentRules: draft.agentRules,
  modelConfig: draft.modelConfig,
  instructions: draft.instructions,
  generatedPrompt: draft.generatedPrompt,
  managerEnabled: draft.managerEnabled,
  managerAgents: draft.managerAgents,
  advancedConfig: draft.advancedConfig,
  skills: draft.skills,
  knowledge: draft.knowledge,
  tools: draft.tools,
})

const makeDuplicateName = (baseName: string, usedNames: Set<string>) => {
  const root = `${baseName} Copy`
  if (!usedNames.has(root)) return root
  let i = 2
  while (usedNames.has(`${root} ${i}`)) i++
  return `${root} ${i}`
}

const makeUniqueAgentName = (baseName: string, usedNames: Set<string>) => {
  if (!usedNames.has(baseName)) return baseName
  let i = 2
  while (usedNames.has(`${baseName} ${i}`)) i++
  return `${baseName} ${i}`
}

function AgentLibraryPageTagline() {
  const { locale } = useLocale()

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={locale === 'zh' ? '智能体·能力·工具·工具·编排' : 'Agent · Capability · Tool · Tool · Orchestration'}
    >
      <span className="agents-subtitle-part">{locale === 'zh' ? '智能体' : 'Agent'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '能力' : 'Capability'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '工具' : 'Tool'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '工具' : 'Tool'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '编排' : 'Orchestration'}</span>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentLibraryPage({
  agents,
  setAgents,
  skillOptions = defaultSkillOptions,
  toolDirectoryItems = TOOL_DIRECTORY_ITEMS,
  planWorkflowEntryKey = 0,
  onPlanWorkflowEntryConsumed,
  onStartPlanCreationFromWorkflowLibrary,
  onTestRunRecorded,
  agentRunTestResume = null,
  onAgentRunTestResumeConsumed,
  libraryOpenSingleAgentRequest = null,
  onLibraryOpenSingleAgentConsumed,
  agentLibraryCardAction = null,
  onAgentLibraryCardActionConsumed,
  marketAgentTemplateApplyRequest = null,
  onMarketAgentTemplateApplyConsumed,
}: {
  agents: Agent[]
  setAgents: Dispatch<SetStateAction<Agent[]>>
  skillOptions?: DropdownOption[]
  toolDirectoryItems?: ToolDirectoryItem[]
  planWorkflowEntryKey?: number
  onPlanWorkflowEntryConsumed?: () => void
  onStartPlanCreationFromWorkflowLibrary?: (text: string) => void
  /** Agent 侧打开运行测试视图时写入首页侧栏「测试记录」 */
  onTestRunRecorded?: (payload: {
    name: string
    resumeKind: 'agent'
    resumeTargetName: string
  }) => void
  /** 从侧栏测试记录恢复：打开对应管理型 Agent 的运行测试画布 */
  agentRunTestResume?: { token: number; agentName: string } | null
  onAgentRunTestResumeConsumed?: () => void
  /** 从侧栏 Runs「Onboarding 助手」进入：打开指定单智能体设置 */
  libraryOpenSingleAgentRequest?: { token: number; agentName: string } | null
  onLibraryOpenSingleAgentConsumed?: () => void
  /** 从「我的项目」跳转：编辑或复制 Agent 卡片 */
  agentLibraryCardAction?: { token: number; agentName: string; action: 'edit' | 'duplicate' } | null
  onAgentLibraryCardActionConsumed?: () => void
  marketAgentTemplateApplyRequest?: { token: number; agentName: string; item: AppMarketItem } | null
  onMarketAgentTemplateApplyConsumed?: () => void
}) {
  const { locale } = useLocale()
  const { can, roleLabel, email } = useRbac()
  const currentCreatorName = useMemo(() => resolveAgentCreatorName(roleLabel, email), [roleLabel, email])
  const canUseAdvancedConfig = can('agent.advanced_config')
  const canToggleManagerAgent = can('agent.manager_toggle')
  const canDeleteAgent = can('agent.delete')
  const canCreateAgent = can('agent.create')
  const toolOptions = useMemo(() => {
    const dynamicOptions = buildToolDropdownOptions(toolDirectoryItems)
    return dynamicOptions.length > 0 ? dynamicOptions : defaultToolOptions
  }, [toolDirectoryItems])
  const [agentNoticeToast, setAgentNoticeToast] = useState<{ title: string; sub?: string } | null>(null)
  const [publishedAgentNames, setPublishedAgentNames] = useState<Set<string>>(() =>
    buildInitialPublishedAgentNameSet(initialAgents.map((agent) => agent.name)),
  )
  const [agentPublishDirtyNames, setAgentPublishDirtyNames] = useState<Set<string>>(() => new Set())
  const publishedSnapshotsRef = useRef<Record<string, string>>({})
  const workspaceSavedSnapshotsRef = useRef<Record<string, string>>({})
  const [agentWorkspacePublishReadyNames, setAgentWorkspacePublishReadyNames] = useState<Set<string>>(
    () => new Set(),
  )
  const publishSnapshotsInitializedRef = useRef(false)
  const [createAgentModalOpen, setCreateAgentModalOpen] = useState(false)
  const [agentPublishModalTarget, setAgentPublishModalTarget] = useState<{
    name: string
    tag: 'Single Agent' | 'Managerial Agent'
  } | null>(null)
  const [pendingAgentPublish, setPendingAgentPublish] = useState<{
    item: { name: string; tag: 'Single Agent' | 'Managerial Agent' }
    spaceId: string
  } | null>(null)
  const [agentVersionModalOpen, setAgentVersionModalOpen] = useState(false)
  const [agentPublishedSpaceByName, setAgentPublishedSpaceByName] = useState<Record<string, string>>({})
  const [frozenAgentNames, setFrozenAgentNames] = useState<Set<string>>(
    () => new Set([pickRandomDemoFrozenAgentName()]),
  )
  const [agentFreezeModalTarget, setAgentFreezeModalTarget] = useState<{ name: string } | null>(null)
  const [cardEditAgentName, setCardEditAgentName] = useState<string | null>(null)
  const [agentsTab, setAgentsTab] = useState<'all' | 'single' | 'managerial'>('all')
  const [agentsViewMode, setAgentsViewMode] = useState<'grid' | 'list'>('grid')
  const [agentsSearchQuery, setAgentsSearchQuery] = useState('')
  const [singleAgentSettingsByKey, setSingleAgentSettingsByKey] = useState<
    Record<string, SingleAgentSettingsDraft>
  >(() =>
    Object.fromEntries(
      initialAgents
        .filter((agent) => getAgentTag(agent.name) === 'Single Agent')
        .map((agent) => [agent.name, createSingleAgentDraft(agent, skillOptions, toolOptions)]),
    ),
  )
  const [managerialAgentSettingsByKey, setManagerialAgentSettingsByKey] = useState<
    Record<string, ManagerialAgentSettingsDraft>
  >(() =>
    Object.fromEntries(
      initialAgents
        .filter((agent) => getAgentTag(agent.name) === 'Managerial Agent')
        .map((agent) => [agent.name, createManagerialAgentDraft(agent, skillOptions, toolOptions)]),
    ),
  )
  const [selectedSingleAgentKey, setSelectedSingleAgentKey] = useState<string | null>(null)
  const [selectedManagerialAgentKey, setSelectedManagerialAgentKey] = useState<string | null>(null)
  const [singleAgentPreviewTab, setSingleAgentPreviewTab] = useState<'preview' | 'ai-adjust'>('preview')
  const [managerialAgentPreviewTab, setManagerialAgentPreviewTab] = useState<'preview' | 'ai-adjust'>('preview')
  const [openSettingsDropdown, setOpenSettingsDropdown] = useState<
    | null
    | 'modelConfig'
    | 'advancedModelConfig'
    | 'skills'
    | 'knowledge'
    | 'tools'
    | 'managerMemberAgents'
    | 'managerDelegationStrategy'
    | 'managerApprovalMode'
    | 'managerEscalationTriggers'
  >(null)
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false)
  const [instructionGeneratorField, setInstructionGeneratorField] = useState<'instructions' | 'role'>('instructions')
  const [instructionTaskInput, setInstructionTaskInput] = useState('')
  const [instructionSelectedTemplate, setInstructionSelectedTemplate] = useState<string>('')
  const [isInstructionGenerating, setIsInstructionGenerating] = useState(false)
  const [instructionGeneratedDraft, setInstructionGeneratedDraft] = useState('')
  const [agentDetailFieldModal, setAgentDetailFieldModal] = useState<AgentDetailFieldModalState>(null)
  const [agentDetailFieldDraft, setAgentDetailFieldDraft] = useState('')
  const [singlePreviewMessages, setSinglePreviewMessages] = useState<ManagerialPreviewMessage[]>([])
  const [singlePreviewInput, setSinglePreviewInput] = useState('')
  const [singlePreviewAttachments, setSinglePreviewAttachments] = useState<PreviewAttachment[]>([])
  const [singlePreviewVoiceListening, setSinglePreviewVoiceListening] = useState(false)
  const [openManagerAgentPickerRowId, setOpenManagerAgentPickerRowId] = useState<string | null>(null)
  const [isOnboardingWorkflowOpen, setIsOnboardingWorkflowOpen] = useState(false)
  const [onboardingWorkflowInitialView, setOnboardingWorkflowInitialView] = useState<'build' | 'run-test'>('build')
  const [onboardingWorkflowEntrySource, setOnboardingWorkflowEntrySource] = useState<'default' | 'manager-edit'>(
    'default',
  )
  const [isSingleAdvancedConfigOpen, setIsSingleAdvancedConfigOpen] = useState(false)
  const [isSingleSettingsMenuOpen, setIsSingleSettingsMenuOpen] = useState(false)
  const [isManagerSettingsMenuOpen, setIsManagerSettingsMenuOpen] = useState(false)
  const [showPlanWorkflowBootstrapModal, setShowPlanWorkflowBootstrapModal] = useState(false)
  const [planWorkflowBootstrapText, setPlanWorkflowBootstrapText] = useState('')
  const [isSingleAvatarPickerOpen, setIsSingleAvatarPickerOpen] = useState(false)
  const [isManagerAvatarPickerOpen, setIsManagerAvatarPickerOpen] = useState(false)
  const [managerialPreviewMessages, setManagerialPreviewMessages] = useState<ManagerialPreviewMessage[]>([])
  const [managerialPreviewInput, setManagerialPreviewInput] = useState('')
  const [managerialPreviewAttachments, setManagerialPreviewAttachments] = useState<PreviewAttachment[]>([])
  const [managerialPreviewVoiceListening, setManagerialPreviewVoiceListening] = useState(false)
  const [isManagerialAdvancedConfigOpen, setIsManagerialAdvancedConfigOpen] = useState(false)
  const [managerialAdvancedConfigNav, setManagerialAdvancedConfigNav] = useState<ManagerialAdvancedConfigNav | null>('reasoning')
  const [isDataQueryConfigOpen, setIsDataQueryConfigOpen] = useState(false)
  const [dataQueryConfigDraft, setDataQueryConfigDraft] = useState<DataQueryConfigDraft | null>(null)
  const [dataQueryConfigDropdown, setDataQueryConfigDropdown] = useState<'model' | 'knowledgeBase' | null>(null)
  const [imageOutputConfigDraft, setImageOutputConfigDraft] = useState<ImageOutputConfigDraft | null>(null)
  const [isImageOutputProviderMenuOpen, setIsImageOutputProviderMenuOpen] = useState(false)
  const [activeImageOutputProviderId, setActiveImageOutputProviderId] = useState<ImageOutputProviderId>('google')
  const [expandedImageOutputProviderId, setExpandedImageOutputProviderId] = useState<ImageOutputProviderId | null>(null)
  const [isMemoryProviderMenuOpen, setIsMemoryProviderMenuOpen] = useState(false)
  const [isShortTermMemoryMetadataModalOpen, setIsShortTermMemoryMetadataModalOpen] = useState(false)
  const [shortTermMemoryMetadataDraft, setShortTermMemoryMetadataDraft] = useState<ShortTermMemoryMetadataDraft | null>(null)
  const [isSchedulerConfigOpen, setIsSchedulerConfigOpen] = useState(false)
  const [schedulerConfigDraft, setSchedulerConfigDraft] = useState<SchedulerConfigDraft | null>(null)
  const planWorkflowEntryAppliedRef = useRef(0)
  const singleAvatarPickerRef = useRef<HTMLDivElement | null>(null)
  const singleAvatarUploadInputRef = useRef<HTMLInputElement | null>(null)
  const singlePreviewFileInputRef = useRef<HTMLInputElement | null>(null)
  const singlePreviewThreadRef = useRef<HTMLDivElement | null>(null)
  const singlePreviewRecognitionRef = useRef<PreviewSpeechRecognition | null>(null)
  const singleSettingsMenuRef = useRef<HTMLDivElement | null>(null)
  const singleAgentDetailsRef = useRef<HTMLDivElement | null>(null)
  const singleAgentManagerSectionRef = useRef<HTMLDivElement | null>(null)
  const managerAvatarPickerRef = useRef<HTMLDivElement | null>(null)
  const managerAvatarUploadInputRef = useRef<HTMLInputElement | null>(null)
  const managerSettingsMenuRef = useRef<HTMLDivElement | null>(null)
  const managerialPreviewFileInputRef = useRef<HTMLInputElement | null>(null)
  const managerialPreviewThreadRef = useRef<HTMLDivElement | null>(null)
  const managerialPreviewRecognitionRef = useRef<PreviewSpeechRecognition | null>(null)
  const agentRunTestResumeHandledTokenRef = useRef<number | null>(null)
  const libraryOpenSingleAgentHandledTokenRef = useRef<number | null>(null)
  const agentLibraryCardActionHandledTokenRef = useRef<number | null>(null)
  const marketAgentTemplateApplyHandledTokenRef = useRef<number | null>(null)
  const agentNoticeTimerRef = useRef<number | null>(null)
  /** 侧栏恢复运行测试时递增，强制 OnboardingWorkflow 运行画面重挂载以重放演示 */
  const [onboardingRunTestRemountKey, setOnboardingRunTestRemountKey] = useState(0)
  const prevSelectedManagerialKeyRef = useRef<string | null | undefined>(undefined)

  const isManagerEnabledForAgent = (agentName: string) => {
    const managerial = managerialAgentSettingsByKey[agentName]
    if (managerial) return managerial.managerEnabled
    const single = singleAgentSettingsByKey[agentName]
    if (single) return single.managerEnabled
    return pickAgentTag(agentName) === 'Managerial Agent'
  }

  const agentsWithDerived = agents.map((a) => ({
    ...a,
    tag: isManagerEnabledForAgent(a.name) ? 'Managerial Agent' : 'Single Agent',
    managerial: isManagerEnabledForAgent(a.name),
  }))
  const singleAgents = agentsWithDerived.filter((a) => a.tag === 'Single Agent')
  const managerialAgents = agentsWithDerived.filter((a) => a.tag === 'Managerial Agent')
  const filteredAgents =
    agentsTab === 'single'
      ? singleAgents
      : agentsTab === 'managerial'
        ? managerialAgents
        : agentsWithDerived
  const searchFilteredAgents = useMemo(() => {
    const keyword = agentsSearchQuery.trim().toLowerCase()
    if (!keyword) return filteredAgents
    return filteredAgents.filter((agent) => {
      const displayName = getAgentCardDisplayName(agent, locale)
      return [displayName, agent.name, agent.desc, agent.label ?? '']
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [agentsSearchQuery, filteredAgents, locale])
  const displayFilteredAgents = searchFilteredAgents.map((agent) => {
    const creator = getAgentCreatorDisplay(agent, locale)
    return {
      ...agent,
      meta: localizeAgentMeta(agent.meta, locale),
      label: getAgentCardDisplayName(agent, locale),
      creatorLabel: creator.label,
      creatorVariant: creator.variant,
    }
  })
  const noticeText = useMemo(
    () => ({
      agentDeleted: locale === 'zh' ? '已删除 Agent' : 'Agent deleted',
      agentDeletedSub: locale === 'zh' ? 'Agent 已从列表中移除。' : 'The agent has been removed from your list.',
      agentEdited: locale === 'zh' ? '保存成功' : 'Saved',
      agentEditedSub: locale === 'zh' ? 'Agent 信息已更新。' : 'Agent details have been updated.',
      agentWorkspaceSavedSub:
        locale === 'zh' ? 'Agent 配置已保存。' : 'Agent configuration has been saved.',
      agentDuplicated: locale === 'zh' ? '已复制 Agent' : 'Agent duplicated',
      agentDuplicatedSub: locale === 'zh' ? 'Agent 已复制到列表。' : 'A copy has been added to your list.',
      agentPublished: locale === 'zh' ? '该 Agent 保存并发布成功' : 'Agent saved and published',
      agentPublishedSub: locale === 'zh' ? 'Agent 已保存并发布。' : 'The agent has been saved and published.',
      agentCreated: locale === 'zh' ? '已创建 Agent' : 'Agent created',
      agentCreatedSub: locale === 'zh' ? 'Agent 已添加到列表。' : 'The agent has been added to your list.',
      subAgentDeleted: locale === 'zh' ? '已删除子 Agent' : 'Sub-agent removed',
      subAgentDeletedSub:
        locale === 'zh' ? '子 Agent 已从配置中移除。' : 'The sub-agent has been removed from this configuration.',
      subAgentEdited: locale === 'zh' ? '已更新子 Agent' : 'Sub-agent updated',
      subAgentEditedSub:
        locale === 'zh' ? '子 Agent 配置已保存。' : 'Sub-agent configuration has been saved.',
    }),
    [locale],
  )
  const showAgentNotice = useCallback((title: string, sub?: string) => {
    setAgentNoticeToast({ title, sub: sub?.trim() || undefined })
    if (agentNoticeTimerRef.current != null) {
      window.clearTimeout(agentNoticeTimerRef.current)
    }
    agentNoticeTimerRef.current = window.setTimeout(() => {
      setAgentNoticeToast(null)
      agentNoticeTimerRef.current = null
    }, 2000)
  }, [])
  const showAgentPublishedBadge = useCallback(
    (agentName: string) =>
      publishedAgentNames.has(agentName) &&
      !agentPublishDirtyNames.has(agentName) &&
      !frozenAgentNames.has(agentName),
    [publishedAgentNames, agentPublishDirtyNames, frozenAgentNames],
  )
  const isAgentFrozen = useCallback(
    (agentName: string) => frozenAgentNames.has(agentName),
    [frozenAgentNames],
  )
  const canPublishAgent = useCallback(
    (agentName: string) => !publishedAgentNames.has(agentName) || agentPublishDirtyNames.has(agentName),
    [publishedAgentNames, agentPublishDirtyNames],
  )
  const transferAgentPublishState = useCallback((fromName: string, toName: string) => {
    setPublishedAgentNames((prev) => {
      if (!prev.has(fromName)) return prev
      const next = new Set(prev)
      next.delete(fromName)
      next.add(toName)
      return next
    })
    setAgentPublishDirtyNames((prev) => {
      if (!prev.has(fromName)) return prev
      const next = new Set(prev)
      next.delete(fromName)
      next.add(toName)
      return next
    })
    if (publishedSnapshotsRef.current[fromName]) {
      publishedSnapshotsRef.current[toName] = publishedSnapshotsRef.current[fromName]
      delete publishedSnapshotsRef.current[fromName]
    }
    setAgentPublishedSpaceByName((prev) => {
      if (!(fromName in prev)) return prev
      const next = { ...prev }
      next[toName] = prev[fromName]
      delete next[fromName]
      return next
    })
    setFrozenAgentNames((prev) => {
      if (!prev.has(fromName)) return prev
      const next = new Set(prev)
      next.delete(fromName)
      next.add(toName)
      return next
    })
  }, [])
  const clearAgentPublishState = useCallback((agentName: string) => {
    setPublishedAgentNames((prev) => {
      if (!prev.has(agentName)) return prev
      const next = new Set(prev)
      next.delete(agentName)
      return next
    })
    setAgentPublishDirtyNames((prev) => {
      if (!prev.has(agentName)) return prev
      const next = new Set(prev)
      next.delete(agentName)
      return next
    })
    delete publishedSnapshotsRef.current[agentName]
    setAgentPublishedSpaceByName((prev) => {
      if (!(agentName in prev)) return prev
      const next = { ...prev }
      delete next[agentName]
      return next
    })
    setFrozenAgentNames((prev) => {
      if (!prev.has(agentName)) return prev
      const next = new Set(prev)
      next.delete(agentName)
      return next
    })
    removeContentLifecycle(agentName)
  }, [])
  const handlePublishAgent = useCallback(
    (item: { name: string; tag: string }, targetId: string, versionPayload?: SectionIterationPublishPayload) => {
      if (!canPublishAgent(item.name)) return
      const spaceId = resolvePublishSpaceIdFromTargetId(targetId)
      if (!spaceId) return
      const groupId = resolvePublishGroupIdFromTargetId(targetId)
      const draft =
        item.tag === 'Single Agent'
          ? singleAgentSettingsByKey[item.name]
          : managerialAgentSettingsByKey[item.name]
      if (draft) {
        publishedSnapshotsRef.current[item.name] = JSON.stringify(draft)
      }
      setPublishedAgentNames((prev) => new Set([...prev, item.name]))
      setAgentPublishDirtyNames((prev) => {
        if (!prev.has(item.name)) return prev
        const next = new Set(prev)
        next.delete(item.name)
        return next
      })
      setAgentPublishedSpaceByName((prev) => ({ ...prev, [item.name]: groupId }))
      markContentPublished(item.name, spaceId)
      const agentRecord = agents.find((agent) => agent.name === item.name)
      publishContentToSpace(spaceId, {
        id: item.name,
        kind: 'agent',
        sourceModule: 'agent-library',
        desc: agentRecord?.desc,
        meta: agentRecord?.meta ?? 'just now',
      })
      addUserContentPublishedTarget(item.name, {
        spaceId,
        publishedAt: new Date().toISOString(),
        publisherMemberId: resolveCurrentMemberId(),
      })
      if (versionPayload && can('team.view_changelog')) {
        publishSectionIteration({
          sectionType: 'agent',
          sectionId: item.name,
          sectionNameZh: item.name,
          sectionNameEn: item.name,
          ...versionPayload,
        })
      }
    },
    [
      agents,
      can,
      canPublishAgent,
      managerialAgentSettingsByKey,
      singleAgentSettingsByKey,
    ],
  )
  const openAgentPublishModal = useCallback(
    (item: { name: string; tag: string }) => {
      if (!canPublishAgent(item.name)) return
      const tag: 'Single Agent' | 'Managerial Agent' =
        item.tag === 'Managerial Agent' ? 'Managerial Agent' : 'Single Agent'
      setAgentPublishModalTarget({ name: item.name, tag })
    },
    [canPublishAgent],
  )
  const confirmAgentPublish = useCallback(
    (spaceId: string) => {
      if (!agentPublishModalTarget) return
      if (can('team.view_changelog')) {
        setPendingAgentPublish({ item: agentPublishModalTarget, spaceId })
        setAgentPublishModalTarget(null)
        setAgentVersionModalOpen(true)
        return false
      }
      handlePublishAgent(agentPublishModalTarget, spaceId)
    },
    [agentPublishModalTarget, can, handlePublishAgent],
  )
  const completeAgentPublishWithVersion = useCallback(
    (payload: SectionIterationPublishPayload) => {
      if (!pendingAgentPublish) return
      handlePublishAgent(pendingAgentPublish.item, pendingAgentPublish.spaceId, payload)
      setAgentVersionModalOpen(false)
      setPendingAgentPublish(null)
    },
    [handlePublishAgent, pendingAgentPublish],
  )
  const openAgentFreezeModal = useCallback((item: { name: string }) => {
    setAgentFreezeModalTarget({ name: item.name })
  }, [])
  const confirmAgentFreeze = useCallback(() => {
    if (!agentFreezeModalTarget) return
    const freezeText = agentFreezeT(locale)
    setFrozenAgentNames((prev) => new Set([...prev, agentFreezeModalTarget.name]))
    markContentFrozen(agentFreezeModalTarget.name)
    updateUserContentLifecycle(agentFreezeModalTarget.name, 'frozen', { hasUnpublishedChanges: false })
    showAgentNotice(freezeText.successTitle, freezeText.successSub)
    setAgentFreezeModalTarget(null)
  }, [agentFreezeModalTarget, locale, showAgentNotice])
  const handleActivateAgent = useCallback(
    (item: { name: string }) => {
      const freezeText = agentFreezeT(locale)
      setFrozenAgentNames((prev) => {
        if (!prev.has(item.name)) return prev
        const next = new Set(prev)
        next.delete(item.name)
        return next
      })
      markContentActivated(item.name)
      updateUserContentLifecycle(
        item.name,
        publishedAgentNames.has(item.name) ? 'published' : 'draft',
        { hasUnpublishedChanges: agentPublishDirtyNames.has(item.name) },
      )
      showAgentNotice(freezeText.activateSuccessTitle, freezeText.activateSuccessSub)
    },
    [locale, showAgentNotice, publishedAgentNames, agentPublishDirtyNames],
  )

  useEffect(() => {
    syncUserContentFromAgents(agents, {
      memberId: resolveCurrentMemberId(),
      locale,
    })
  }, [agents, locale])

  useEffect(() => {
    syncContentLifecycleFromSnapshot({
      publishedKeys: publishedAgentNames,
      frozenKeys: frozenAgentNames,
      dirtyKeys: agentPublishDirtyNames,
      spaceByKey: agentPublishedSpaceByName,
    })
  }, [publishedAgentNames, frozenAgentNames, agentPublishDirtyNames, agentPublishedSpaceByName])

  useEffect(() => {
    return subscribeContentLifecycle(() => {
      const snap = getContentLifecycleSnapshot()
      setPublishedAgentNames((prev) =>
        setsEqual(prev, snap.publishedAgentNames) ? prev : snap.publishedAgentNames,
      )
      setFrozenAgentNames((prev) => (setsEqual(prev, snap.frozenAgentNames) ? prev : snap.frozenAgentNames))
      setAgentPublishDirtyNames((prev) =>
        setsEqual(prev, snap.agentPublishDirtyNames) ? prev : snap.agentPublishDirtyNames,
      )
      setAgentPublishedSpaceByName((prev) =>
        recordsEqual(prev, snap.agentPublishedSpaceByName) ? prev : snap.agentPublishedSpaceByName,
      )
    })
  }, [])

  const saveAgentWorkspace = useCallback(
    (originalName: string) => {
      if (frozenAgentNames.has(originalName)) return

      const draft = singleAgentSettingsByKey[originalName] ?? managerialAgentSettingsByKey[originalName]
      if (!draft) return

      const nextName = draft.name.trim() || originalName
      const descSource = draft.agentRole?.trim() || draft.instructions?.trim()
      const nextDesc =
        descSource && descSource.length > 80 ? `${descSource.slice(0, 77)}…` : descSource

      setAgents((prev) =>
        prev.map((agent) =>
          agent.name === originalName
            ? {
                ...agent,
                name: nextName,
                ...(nextDesc ? { desc: nextDesc } : {}),
              }
            : agent,
        ),
      )

      if (nextName !== originalName) {
        transferAgentPublishState(originalName, nextName)
        renameUserContentKey(originalName, nextName)
        if (workspaceSavedSnapshotsRef.current[originalName]) {
          workspaceSavedSnapshotsRef.current[nextName] = workspaceSavedSnapshotsRef.current[originalName]
          delete workspaceSavedSnapshotsRef.current[originalName]
        }
        setAgentWorkspacePublishReadyNames((prev) => {
          if (!prev.has(originalName)) return prev
          const next = new Set(prev)
          next.delete(originalName)
          next.add(nextName)
          return next
        })
        setSingleAgentSettingsByKey((prev) => {
          if (!(originalName in prev)) return prev
          const next = { ...prev }
          next[nextName] = { ...next[originalName], name: nextName }
          delete next[originalName]
          return next
        })
        setManagerialAgentSettingsByKey((prev) => {
          if (!(originalName in prev)) return prev
          const next = { ...prev }
          next[nextName] = { ...next[originalName], name: nextName }
          delete next[originalName]
          return next
        })
        setSelectedSingleAgentKey((prev) => (prev === originalName ? nextName : prev))
        setSelectedManagerialAgentKey((prev) => (prev === originalName ? nextName : prev))
      }

      workspaceSavedSnapshotsRef.current[nextName] = JSON.stringify(draft)
      setAgentWorkspacePublishReadyNames((prev) => new Set([...prev, nextName]))

      showAgentNotice(noticeText.agentEdited, noticeText.agentWorkspaceSavedSub)
    },
    [
      frozenAgentNames,
      managerialAgentSettingsByKey,
      noticeText.agentEdited,
      noticeText.agentWorkspaceSavedSub,
      showAgentNotice,
      singleAgentSettingsByKey,
      transferAgentPublishState,
    ],
  )

  const renderTopbarSaveButton = useCallback(
    (agentName: string) => {
      const frozen = isAgentFrozen(agentName)
      const saveLabel = locale === 'zh' ? '保存' : 'Save'
      const frozenTitle =
        locale === 'zh' ? '已冻结，需先激活后再保存' : 'Frozen — activate before saving'

      return (
        <button
          type="button"
          className={`single-agent-topbar-save-btn${frozen ? ' is-disabled' : ''}`}
          disabled={frozen}
          title={frozen ? frozenTitle : undefined}
          onClick={() => saveAgentWorkspace(agentName)}
        >
          {saveLabel}
        </button>
      )
    },
    [isAgentFrozen, locale, saveAgentWorkspace],
  )

  const renderTopbarPublishButton = useCallback(
    (agentName: string, tag: 'Single Agent' | 'Managerial Agent') => {
      const workspaceSaved = agentWorkspacePublishReadyNames.has(agentName)
      const publishDisabled = !canPublishAgent(agentName) || !workspaceSaved
      const publishLabel = locale === 'zh' ? '发布' : 'Publish'
      const publishDisabledTitle = !workspaceSaved
        ? locale === 'zh'
          ? '请先保存后再发布'
          : 'Save before publishing'
        : !canPublishAgent(agentName)
          ? locale === 'zh'
            ? '已发布，修改配置后可再次发布'
            : 'Published — edit configuration to publish again'
          : undefined

      return (
        <button
          type="button"
          className={`single-agent-topbar-publish-btn${publishDisabled ? ' is-disabled' : ''}`}
          disabled={publishDisabled}
          title={publishDisabled ? publishDisabledTitle : undefined}
          onClick={() => openAgentPublishModal({ name: agentName, tag })}
        >
          {publishLabel}
        </button>
      )
    },
    [agentWorkspacePublishReadyNames, canPublishAgent, locale, openAgentPublishModal],
  )
  useEffect(() => {
    const activeName = selectedSingleAgentKey ?? selectedManagerialAgentKey
    if (!activeName) return
    setAgentWorkspacePublishReadyNames((prev) => {
      if (!prev.has(activeName)) return prev
      const next = new Set(prev)
      next.delete(activeName)
      return next
    })
  }, [selectedSingleAgentKey, selectedManagerialAgentKey])
  useEffect(() => {
    setAgentWorkspacePublishReadyNames((prev) => {
      if (prev.size === 0) return prev
      const next = new Set<string>()
      for (const name of prev) {
        const draft = singleAgentSettingsByKey[name] ?? managerialAgentSettingsByKey[name]
        const saved = workspaceSavedSnapshotsRef.current[name]
        if (draft && saved && JSON.stringify(draft) === saved) {
          next.add(name)
        }
      }
      if (next.size === prev.size && [...next].every((name) => prev.has(name))) {
        return prev
      }
      return next
    })
  }, [singleAgentSettingsByKey, managerialAgentSettingsByKey])
  useEffect(() => {
    if (publishSnapshotsInitializedRef.current) return
    publishSnapshotsInitializedRef.current = true
    for (const name of publishedAgentNames) {
      const draft = singleAgentSettingsByKey[name] ?? managerialAgentSettingsByKey[name]
      if (draft) {
        publishedSnapshotsRef.current[name] = JSON.stringify(draft)
      }
    }
  }, [publishedAgentNames, singleAgentSettingsByKey, managerialAgentSettingsByKey])
  useEffect(() => {
    setAgentPublishDirtyNames((prev) => {
      const next = new Set<string>()
      for (const name of publishedAgentNames) {
        const snapshot = publishedSnapshotsRef.current[name]
        if (!snapshot) continue
        const draft = singleAgentSettingsByKey[name] ?? managerialAgentSettingsByKey[name]
        if (!draft) continue
        if (JSON.stringify(draft) !== snapshot) {
          next.add(name)
        }
      }
      if (next.size === prev.size && [...next].every((name) => prev.has(name))) {
        return prev
      }
      return next
    })
  }, [singleAgentSettingsByKey, managerialAgentSettingsByKey, publishedAgentNames])
  const renderAgentPublishModal = () => (
    <>
      <PublishAgentAppModal
        open={agentPublishModalTarget != null}
        locale={locale}
        defaultSpaceId={
          agentPublishModalTarget
            ? agentPublishedSpaceByName[agentPublishModalTarget.name]
            : undefined
        }
        onClose={() => setAgentPublishModalTarget(null)}
        onConfirm={confirmAgentPublish}
      />
      {agentVersionModalOpen && pendingAgentPublish ? (
        <SectionIterationVersionModal
          open
          locale={locale}
          sectionType="agent"
          sectionId={pendingAgentPublish.item.name}
          sectionName={pendingAgentPublish.item.name}
          onClose={() => {
            setAgentVersionModalOpen(false)
            setPendingAgentPublish(null)
          }}
          onConfirm={completeAgentPublishWithVersion}
        />
      ) : null}
    </>
  )
  const renderAgentFreezeModal = () => (
    <AgentFreezeModal
      open={agentFreezeModalTarget != null}
      locale={locale}
      agentName={agentFreezeModalTarget?.name ?? ''}
      onClose={() => setAgentFreezeModalTarget(null)}
      onConfirm={confirmAgentFreeze}
    />
  )
  const renderAgentNoticeToast = () =>
    agentNoticeToast
      ? createPortal(
          <div className="agents-publish-success-toast" role="status" aria-live="polite">
            <span className="agents-publish-success-toast__icon" aria-hidden="true">
              ✓
            </span>
            <div className="agents-publish-success-toast__text">
              <strong className="agents-publish-success-toast__title">{agentNoticeToast.title}</strong>
              {agentNoticeToast.sub ? (
                <span className="agents-publish-success-toast__sub">{agentNoticeToast.sub}</span>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null
  const cardEditAgent =
    cardEditAgentName == null
      ? null
      : (agentsWithDerived.find((agent) => agent.name === cardEditAgentName) ?? null)

  const handleAgentCardEditSave = useCallback(
    (originalName: string, draft: AgentCardEditDraft) => {
      const nextName = draft.name.trim()
      const nextDesc = draft.description.trim()
      if (!nextName) return

      setAgents((prev) =>
        prev.map((agent) =>
          agent.name === originalName
            ? { ...agent, name: nextName, desc: nextDesc || agent.desc }
            : agent,
        ),
      )

      if (nextName !== originalName) {
        transferAgentPublishState(originalName, nextName)
        renameUserContentKey(originalName, nextName)
        setSingleAgentSettingsByKey((prev) => {
          if (!(originalName in prev)) return prev
          const next = { ...prev }
          next[nextName] = { ...next[originalName], name: nextName }
          delete next[originalName]
          return next
        })
        setManagerialAgentSettingsByKey((prev) => {
          if (!(originalName in prev)) return prev
          const next = { ...prev }
          next[nextName] = { ...next[originalName], name: nextName }
          delete next[originalName]
          return next
        })
        setSelectedSingleAgentKey((prev) => (prev === originalName ? nextName : prev))
        setSelectedManagerialAgentKey((prev) => (prev === originalName ? nextName : prev))
      }

      setCardEditAgentName(null)
      showAgentNotice(noticeText.agentEdited, noticeText.agentEditedSub)
    },
    [noticeText.agentEdited, noticeText.agentEditedSub, showAgentNotice, transferAgentPublishState],
  )

  const duplicateAgentByName = useCallback(
    (agentName: string) => {
      const item = agentsWithDerived.find((agent) => agent.name === agentName)
      if (!item || !canCreateAgent) return
      setAgents((prev) => {
        const used = new Set(prev.map((x) => x.name))
        const name = makeDuplicateName(item.name, used)
        const copy: Agent = {
          name,
          desc: item.desc,
          meta: 'just now',
          ...manualAgentAttribution(currentCreatorName),
        }
        if (item.tag === 'Single Agent') {
          setSingleAgentSettingsByKey((p) => {
            const src = p[item.name] ?? createSingleAgentDraft(item as unknown as Agent, skillOptions, toolOptions)
            return { ...p, [name]: { ...src, name } }
          })
        }
        if (item.tag === 'Managerial Agent') {
          setManagerialAgentSettingsByKey((p) => {
            const src = p[item.name] ?? createManagerialAgentDraft(item as unknown as Agent, skillOptions, toolOptions)
            return { ...p, [name]: { ...src, name } }
          })
        }
        const idx = prev.findIndex((x) => x.name === item.name)
        return idx === -1 ? [copy, ...prev] : [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
      })
      showAgentNotice(noticeText.agentDuplicated, noticeText.agentDuplicatedSub)
    },
    [
      agentsWithDerived,
      canCreateAgent,
      currentCreatorName,
      noticeText.agentDuplicated,
      noticeText.agentDuplicatedSub,
      showAgentNotice,
      skillOptions,
      toolOptions,
    ],
  )

  const handleCreateAgentSubmit = useCallback(
    (payload: { description: string; templateTitle: string | null }) => {
      setCreateAgentModalOpen(false)
      const fallbackName = locale === 'zh' ? '未命名 Agent' : 'Untitled Agent'
      setAgents((prev) => {
        const used = new Set(prev.map((agent) => agent.name))
        const fromTemplate = payload.templateTitle?.trim()
        let base =
          fromTemplate ||
          payload.description
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 48) ||
          fallbackName
        base =
          base
            .replace(/^使用模板：「?[^」]+」?\s*/u, '')
            .replace(/^Using template:\s*"[^"]+"\s*/u, '')
            .trim() || base
        const name = makeUniqueAgentName(base, used)
        const newAgent: Agent = {
          name,
          desc: payload.description,
          meta: 'just now',
          ...(fromTemplate
            ? appMarketTemplateAttribution()
            : manualAgentAttribution(currentCreatorName)),
        }
        setSingleAgentSettingsByKey((current) => ({
          ...current,
          [name]: createSingleAgentDraft(newAgent, skillOptions, toolOptions),
        }))
        return [newAgent, ...prev]
      })
      showAgentNotice(noticeText.agentCreated, noticeText.agentCreatedSub)
    },
    [
      currentCreatorName,
      locale,
      noticeText.agentCreated,
      noticeText.agentCreatedSub,
      showAgentNotice,
      skillOptions,
      toolOptions,
    ],
  )

  const handleCreateAgent = useCallback(() => {
    setCreateAgentModalOpen(true)
  }, [])

  const selectedSingleAgent =
    selectedSingleAgentKey ? singleAgentSettingsByKey[selectedSingleAgentKey] ?? null : null
  const selectedManagerialAgent =
    selectedManagerialAgentKey ? managerialAgentSettingsByKey[selectedManagerialAgentKey] ?? null : null

  useEffect(() => {
    if (!selectedSingleAgentKey) {
      setSinglePreviewMessages([])
      setSinglePreviewInput('')
      setSinglePreviewAttachments([])
      setSinglePreviewVoiceListening(false)
      singlePreviewRecognitionRef.current?.abort()
      singlePreviewRecognitionRef.current = null
      return
    }
    setSinglePreviewMessages([
      createSinglePreviewGreeting(selectedSingleAgent?.name ?? (locale === 'zh' ? '单智能体' : 'Single agent'), locale),
    ])
    setSinglePreviewInput('')
    setSinglePreviewAttachments([])
    setSinglePreviewVoiceListening(false)
    singlePreviewRecognitionRef.current?.abort()
    singlePreviewRecognitionRef.current = null
  }, [locale, selectedSingleAgentKey])

  useEffect(() => {
    if (!singlePreviewThreadRef.current) return
    singlePreviewThreadRef.current.scrollTop = singlePreviewThreadRef.current.scrollHeight
  }, [singlePreviewMessages])

  useEffect(() => {
    return () => {
      singlePreviewRecognitionRef.current?.abort()
      singlePreviewRecognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (agentNoticeTimerRef.current != null) {
        window.clearTimeout(agentNoticeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedManagerialAgentKey) {
      setManagerialPreviewMessages([])
      setManagerialPreviewInput('')
      setManagerialPreviewAttachments([])
      setManagerialPreviewVoiceListening(false)
      setIsManagerialAdvancedConfigOpen(false)
      setIsDataQueryConfigOpen(false)
      setDataQueryConfigDraft(null)
      setDataQueryConfigDropdown(null)
      setImageOutputConfigDraft(null)
      setIsImageOutputProviderMenuOpen(false)
      setActiveImageOutputProviderId('google')
      setExpandedImageOutputProviderId(null)
      setIsMemoryProviderMenuOpen(false)
      setIsShortTermMemoryMetadataModalOpen(false)
      setShortTermMemoryMetadataDraft(null)
      setIsSchedulerConfigOpen(false)
      setSchedulerConfigDraft(null)
      managerialPreviewRecognitionRef.current?.abort()
      managerialPreviewRecognitionRef.current = null
      return
    }
    setManagerialPreviewMessages([
      createManagerialPreviewGreeting(
        selectedManagerialAgent ??
          createManagerialAgentDraft(
            { name: locale === 'zh' ? '管理型智能体' : 'Manager agent', desc: '', meta: 'just now' },
            skillOptions,
            toolOptions,
          ),
        locale,
      ),
    ])
    setManagerialPreviewInput('')
    setManagerialPreviewAttachments([])
    setManagerialPreviewVoiceListening(false)
    managerialPreviewRecognitionRef.current?.abort()
    managerialPreviewRecognitionRef.current = null
  }, [locale, selectedManagerialAgent, selectedManagerialAgentKey, skillOptions, toolOptions])

  useEffect(() => {
    if (!managerialPreviewThreadRef.current) return
    managerialPreviewThreadRef.current.scrollTop = managerialPreviewThreadRef.current.scrollHeight
  }, [managerialPreviewMessages])

  useEffect(() => {
    return () => {
      managerialPreviewRecognitionRef.current?.abort()
      managerialPreviewRecognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isManagerialAdvancedConfigOpen) {
      setIsDataQueryConfigOpen(false)
      setDataQueryConfigDraft(null)
      setDataQueryConfigDropdown(null)
      setImageOutputConfigDraft(null)
      setIsImageOutputProviderMenuOpen(false)
      setActiveImageOutputProviderId('google')
      setExpandedImageOutputProviderId(null)
      setIsMemoryProviderMenuOpen(false)
      setIsShortTermMemoryMetadataModalOpen(false)
      setShortTermMemoryMetadataDraft(null)
      setIsSchedulerConfigOpen(false)
      setSchedulerConfigDraft(null)
    }
  }, [isManagerialAdvancedConfigOpen])

  useEffect(() => {
    if (!selectedManagerialAgentKey) return
    setManagerialAgentSettingsByKey((prev) => {
      const current = prev[selectedManagerialAgentKey]
      if (!current || !isOnboardingManagerAgent(current.name)) return prev
      const normalized = normalizeManagerialDraft(current)
      if (
        current.managerEnabled === normalized.managerEnabled &&
        hasSameManagerAgentRows(current.managerAgents, normalized.managerAgents)
      ) {
        return prev
      }
      return { ...prev, [selectedManagerialAgentKey]: normalized }
    })
  }, [selectedManagerialAgentKey])

  useEffect(() => {
    if (!isSingleAvatarPickerOpen && !isManagerAvatarPickerOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        isSingleAvatarPickerOpen &&
        singleAvatarPickerRef.current &&
        !singleAvatarPickerRef.current.contains(target)
      ) {
        setIsSingleAvatarPickerOpen(false)
      }

      if (
        isManagerAvatarPickerOpen &&
        managerAvatarPickerRef.current &&
        !managerAvatarPickerRef.current.contains(target)
      ) {
        setIsManagerAvatarPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isSingleAvatarPickerOpen, isManagerAvatarPickerOpen])

  useEffect(() => {
    if (!selectedManagerialAgentKey) setIsOnboardingWorkflowOpen(false)
  }, [selectedManagerialAgentKey])

  /** 侧栏「测试记录」点击恢复：打开对应管理型 Agent 的运行测试视图（可继续对话） */
  useEffect(() => {
    if (!agentRunTestResume?.token) return
    if (agentRunTestResumeHandledTokenRef.current === agentRunTestResume.token) return
    const name = agentRunTestResume.agentName.trim()
    if (!name || !managerialAgentSettingsByKey[name]) {
      agentRunTestResumeHandledTokenRef.current = agentRunTestResume.token
      onAgentRunTestResumeConsumed?.()
      return
    }
    agentRunTestResumeHandledTokenRef.current = agentRunTestResume.token
    setCardEditAgentName(null)
    setSelectedSingleAgentKey(null)
    setAgentsTab('managerial')
    setSelectedManagerialAgentKey(name)
    setOnboardingWorkflowInitialView('run-test')
    setOnboardingWorkflowEntrySource('default')
    setIsManagerSettingsMenuOpen(false)
    setShowPlanWorkflowBootstrapModal(false)
    setOnboardingRunTestRemountKey((k) => k + 1)
    setIsOnboardingWorkflowOpen(true)
    queueMicrotask(() => onAgentRunTestResumeConsumed?.())
  }, [agentRunTestResume, managerialAgentSettingsByKey, onAgentRunTestResumeConsumed])

  useEffect(() => {
    if (!planWorkflowEntryKey) {
      planWorkflowEntryAppliedRef.current = 0
      return
    }
    if (planWorkflowEntryAppliedRef.current === planWorkflowEntryKey) return
    planWorkflowEntryAppliedRef.current = planWorkflowEntryKey
    const name = PLAN_LIBRARY_SYNTHETIC_MANAGER_NAME
    const syntheticAgent: Agent = {
      name,
      desc: '用于在画布上编排入职相关多代理步骤（由首页 Plan 进入）。',
      meta: 'Plan',
      ...manualAgentAttribution(currentCreatorName),
    }
    setAgents((prev) => (prev.some((a) => a.name === name) ? prev : [syntheticAgent, ...prev]))
    setManagerialAgentSettingsByKey((prev) =>
      prev[name] ? prev : { ...prev, [name]: createManagerialAgentDraft(syntheticAgent, skillOptions, toolOptions) },
    )
    setSelectedManagerialAgentKey(name)
    setSelectedSingleAgentKey(null)
    setOnboardingWorkflowEntrySource('default')
    setIsOnboardingWorkflowOpen(true)
    setShowPlanWorkflowBootstrapModal(true)
    setPlanWorkflowBootstrapText('')
    onPlanWorkflowEntryConsumed?.()
  }, [currentCreatorName, onPlanWorkflowEntryConsumed, planWorkflowEntryKey, skillOptions, toolOptions])

  // Global Escape / click-outside handler for this page
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.single-agent-select-wrap')) return
      if (target.closest('.single-agent-modal')) return
      if (target.closest('.manager-agent-select-wrap')) return
      if (target.closest('.managerial-agent-top-settings')) return
      setOpenSettingsDropdown(null)
      setOpenManagerAgentPickerRowId(null)
      setIsSingleSettingsMenuOpen(false)
      setIsManagerSettingsMenuOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showPlanWorkflowBootstrapModal) {
        setShowPlanWorkflowBootstrapModal(false)
        return
      }
      setOpenSettingsDropdown(null)
      setOpenManagerAgentPickerRowId(null)
      setIsSingleSettingsMenuOpen(false)
      setIsManagerSettingsMenuOpen(false)
      if (!isInstructionGenerating) setIsInstructionModalOpen(false)
      if (cardEditAgentName != null) {
        setCardEditAgentName(null)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [cardEditAgentName, isInstructionGenerating, showPlanWorkflowBootstrapModal])

  useEffect(() => {
    if (selectedSingleAgentKey) return
    setIsSingleAdvancedConfigOpen(false)
    setIsSingleSettingsMenuOpen(false)
  }, [selectedSingleAgentKey])

  useEffect(() => {
    const prev = prevSelectedManagerialKeyRef.current
    prevSelectedManagerialKeyRef.current = selectedManagerialAgentKey
    if (selectedManagerialAgentKey) return
    setIsManagerSettingsMenuOpen(false)
    if (prev !== undefined && prev !== null) {
      setOnboardingWorkflowInitialView('build')
    }
  }, [selectedManagerialAgentKey])

  const updateSelectedSingleAgent = (
    updater: (prev: SingleAgentSettingsDraft) => SingleAgentSettingsDraft,
  ) => {
    if (!selectedSingleAgentKey) return
    setSingleAgentSettingsByKey((prev) => {
      const current = prev[selectedSingleAgentKey]
      if (!current) return prev
      return { ...prev, [selectedSingleAgentKey]: updater(current) }
    })
  }

  const updateSelectedManagerialAgent = (
    updater: (prev: ManagerialAgentSettingsDraft) => ManagerialAgentSettingsDraft,
  ) => {
    if (!selectedManagerialAgentKey) return
    setManagerialAgentSettingsByKey((prev) => {
      const current = prev[selectedManagerialAgentKey]
      if (!current) return prev
      return { ...prev, [selectedManagerialAgentKey]: updater(current) }
    })
  }

  const openInstructionGenerator = (field: 'instructions' | 'role' = 'instructions', seedText = '') => {
    setInstructionGeneratorField(field)
    setIsInstructionModalOpen(true)
    setInstructionGeneratedDraft('')
    setInstructionSelectedTemplate('')
    setInstructionTaskInput(seedText)
  }

  const openAgentDetailFieldModal = (
    agentKind: 'single' | 'managerial',
    fieldKey: AgentDetailFieldKey,
    label: string,
    value: string,
  ) => {
    setAgentDetailFieldModal({ agentKind, fieldKey, label })
    setAgentDetailFieldDraft(value)
  }

  const closeSingleAgentAdvancedConfig = () => {
    setIsSingleAdvancedConfigOpen(false)
    setManagerialAdvancedConfigNav('reasoning')
    if (selectedManagerialAgentKey === selectedSingleAgentKey) {
      setSelectedManagerialAgentKey(null)
    }
  }

  const openSingleAgentAdvancedConfig = (nav: ManagerialAdvancedConfigNav = 'reasoning') => {
    if (!selectedSingleAgentKey || !selectedSingleAgent) return
    setManagerialAgentSettingsByKey((prev) => ({
      ...prev,
      [selectedSingleAgentKey]:
        prev[selectedSingleAgentKey] ??
        createManagerialDraftFromSingle(
          {
            ...selectedSingleAgent,
            managerEnabled: true,
          },
          skillOptions,
          toolOptions,
        ),
    }))
    setIsSingleSettingsMenuOpen(false)
    setSelectedManagerialAgentKey(selectedSingleAgentKey)
    setManagerialAdvancedConfigNav(nav)
    setIsManagerialAdvancedConfigOpen(true)
    setIsSingleAdvancedConfigOpen(true)
  }

  const openSingleAgentEditView = () => {
    setIsSingleSettingsMenuOpen(false)
    setSingleAgentPreviewTab('ai-adjust')
  }

  const showSingleAgentMessages = () => {
    setIsSingleSettingsMenuOpen(false)
    setSingleAgentPreviewTab('preview')
  }

  const showSingleAgentLeads = () => {
    setIsSingleSettingsMenuOpen(false)
    singleAgentManagerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showSingleAgentDetails = () => {
    setIsSingleSettingsMenuOpen(false)
    singleAgentDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSingleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      updateSelectedSingleAgent((prev) => ({
        ...prev,
        avatar: result,
      }))
      setIsSingleAvatarPickerOpen(false)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleManagerAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      updateSelectedManagerialAgent((prev) => ({
        ...prev,
        avatar: result,
      }))
      setIsManagerAvatarPickerOpen(false)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const updateManagerAgentRow = (
    rowId: string,
    updater: (row: ManagerialAgentSettingsDraft['managerAgents'][number]) => ManagerialAgentSettingsDraft['managerAgents'][number],
  ) => {
    updateSelectedManagerialAgent((prev) => ({
      ...prev,
      managerAgents: prev.managerAgents.map((row) => (row.id === rowId ? updater(row) : row)),
    }))
  }

  const appendManagerAgentRow = (source: 'agent' | 'a2a') => {
    updateSelectedManagerialAgent((prev) => ({
      ...prev,
      managerAgents: [
        ...prev.managerAgents,
        {
          id: `${prev.name}-${source}-${Date.now()}`,
          agentName: '',
          usage: '',
          source,
        },
      ],
    }))
  }

  const updateSelectedManagerialAdvancedConfig = (
    updater: (prev: ManagerialAdvancedConfig) => ManagerialAdvancedConfig,
  ) => {
    if (!selectedManagerialAgentKey) return
    setManagerialAgentSettingsByKey((prev) => {
      const current = prev[selectedManagerialAgentKey]
      if (!current) return prev
      const nextAdvancedConfig = updater(current.advancedConfig)

      setSingleAgentSettingsByKey((singlePrev) => {
        const linkedSingle = singlePrev[selectedManagerialAgentKey]
        if (!linkedSingle) return singlePrev
        return {
          ...singlePrev,
          [selectedManagerialAgentKey]: {
            ...linkedSingle,
            advancedConfig: nextAdvancedConfig,
          },
        }
      })

      return {
        ...prev,
        [selectedManagerialAgentKey]: {
          ...current,
          advancedConfig: nextAdvancedConfig,
        },
      }
    })
  }

  const stepManagerialTemperature = (delta: number) => {
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      useProviderDefaults: false,
      temperature: clampTemperatureValue(prev.temperature + delta),
    }))
  }

  const setManagerialManagerEnabled = (nextEnabled: boolean) => {
    if (!selectedManagerialAgent) return

    if (!nextEnabled) {
      setIsManagerialAdvancedConfigOpen(false)
      setIsManagerSettingsMenuOpen(false)
    }

    updateSelectedManagerialAgent((prev) => ({
      ...prev,
      managerEnabled: nextEnabled,
      advancedConfig: {
        ...prev.advancedConfig,
        allowDelegation: nextEnabled,
      },
    }))

    setSingleAgentSettingsByKey((prev) => ({
      ...prev,
      [selectedManagerialAgent.name]:
        prev[selectedManagerialAgent.name]
          ? {
              ...prev[selectedManagerialAgent.name],
              managerEnabled: nextEnabled,
            }
          : createSingleDraftFromManagerial({
              ...selectedManagerialAgent,
              managerEnabled: nextEnabled,
              advancedConfig: {
                ...selectedManagerialAgent.advancedConfig,
                allowDelegation: nextEnabled,
              },
            }),
    }))
  }

  const openDataQueryConfigPanel = () => {
    if (!selectedManagerialAgent) return
    const config = selectedManagerialAgent.advancedConfig
    setDataQueryConfigDraft({
      modelConfig: config.dataQueryModelConfig || selectedManagerialAgent.modelConfig || modelConfigOptions[0]?.title || '',
      maxAttempts: config.dataQueryMaxAttempts,
      timeLimitSeconds: config.dataQueryTimeLimitSeconds,
      autoTrainModel: config.dataQueryAutoTrainModel,
      knowledgeBaseId: config.dataQueryKnowledgeBaseId,
    })
    setDataQueryConfigDropdown(null)
    setIsDataQueryConfigOpen(true)
  }

  const closeDataQueryConfigPanel = () => {
    setIsDataQueryConfigOpen(false)
    setDataQueryConfigDraft(null)
    setDataQueryConfigDropdown(null)
  }

  const saveDataQueryConfig = () => {
    if (!dataQueryConfigDraft) return
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      dataQueryEnabled: true,
      dataQueryModelConfig: dataQueryConfigDraft.modelConfig,
      dataQueryMaxAttempts: Math.max(1, dataQueryConfigDraft.maxAttempts || 1),
      dataQueryTimeLimitSeconds: Math.max(10, dataQueryConfigDraft.timeLimitSeconds || 10),
      dataQueryAutoTrainModel: dataQueryConfigDraft.autoTrainModel,
      dataQueryKnowledgeBaseId: dataQueryConfigDraft.autoTrainModel ? dataQueryConfigDraft.knowledgeBaseId : '',
    }))
    closeDataQueryConfigPanel()
  }

  const initializeImageOutputConfigDraft = () => {
    if (!selectedManagerialAgent) return
    const config = selectedManagerialAgent.advancedConfig
    const initialProviderId = (config.imageOutputProvider || 'google') as ImageOutputProviderId
    setImageOutputConfigDraft({
      providerId: initialProviderId,
      model: config.imageOutputModel || '',
    })
    setActiveImageOutputProviderId(initialProviderId)
    setIsImageOutputProviderMenuOpen(false)
    setExpandedImageOutputProviderId(null)
  }

  const saveImageOutputConfig = () => {
    if (!imageOutputConfigDraft || !imageOutputConfigDraft.model) return
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      imageAsOutputEnabled: true,
      imageOutputProvider: imageOutputConfigDraft.providerId,
      imageOutputModel: imageOutputConfigDraft.model,
    }))
  }

  useEffect(() => {
    if (!selectedManagerialAgent?.advancedConfig.imageAsOutputEnabled) return
    if (imageOutputConfigDraft) return
    initializeImageOutputConfigDraft()
  }, [imageOutputConfigDraft, selectedManagerialAgent])

  const activeShortTermMemoryToolIds =
    selectedSingleAgent && selectedSingleAgentKey && selectedSingleAgentKey === selectedManagerialAgentKey
      ? selectedSingleAgent.tools
      : selectedManagerialAgent?.tools ?? []
  const activeShortTermMemoryToolOptions = toolOptions.filter((option) => activeShortTermMemoryToolIds.includes(option.id))

  const openShortTermMemoryMetadataModal = () => {
    setShortTermMemoryMetadataDraft(createShortTermMemoryMetadataDraft(activeShortTermMemoryToolIds))
    setIsShortTermMemoryMetadataModalOpen(true)
  }

  const closeShortTermMemoryMetadataModal = () => {
    setIsShortTermMemoryMetadataModalOpen(false)
    setShortTermMemoryMetadataDraft(null)
  }

  const updateShortTermMemoryMetadataDraft = (
    updater: (prev: ShortTermMemoryMetadataDraft) => ShortTermMemoryMetadataDraft,
  ) => {
    setShortTermMemoryMetadataDraft((prev) => (prev ? updater(prev) : prev))
  }

  const saveShortTermMemoryMetadata = () => {
    if (!shortTermMemoryMetadataDraft) return
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      shortTermMemoryMetadata: [
        ...prev.shortTermMemoryMetadata,
        {
          id: `memory-metadata-${Date.now()}`,
          name: shortTermMemoryMetadataDraft.name.trim(),
          mode: shortTermMemoryMetadataDraft.mode,
          instruction: shortTermMemoryMetadataDraft.instruction.trim(),
          updateTiming: shortTermMemoryMetadataDraft.mode === 'rule-based' ? shortTermMemoryMetadataDraft.updateTiming : '',
          targetId: shortTermMemoryMetadataDraft.mode === 'rule-based' ? shortTermMemoryMetadataDraft.targetId : '',
          dataFormat: shortTermMemoryMetadataDraft.dataFormat,
          ...(isMemoryMetadataSelectFormat(shortTermMemoryMetadataDraft.dataFormat)
            ? {
                dataFormatOptions: shortTermMemoryMetadataDraft.dataFormatOptions
                  .map((option) => option.trim())
                  .filter(Boolean),
              }
            : {}),
        },
      ],
    }))
    closeShortTermMemoryMetadataModal()
  }

  const toggleMemoryEnabled = () => {
    if (!selectedManagerialAgent) return
    setIsMemoryProviderMenuOpen(false)
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      memoryEnabled: !prev.memoryEnabled,
      memoryType: prev.memoryEnabled ? 'short-term' : prev.memoryType,
    }))
  }

  const openSchedulerConfigPanel = () => {
    if (!selectedManagerialAgent) return
    const config = selectedManagerialAgent.advancedConfig
    setSchedulerConfigDraft({
      mode: config.schedulerMode || 'minutes',
      interval: config.schedulerInterval || '30',
      atMinute: config.schedulerAtMinute || '00',
      weekday: config.schedulerWeekday || 'weekdays',
      monthDay: config.schedulerMonthDay || '1',
      timeLabel: config.schedulerTimeLabel || 'midnight',
      timeMinute: config.schedulerTimeMinute || '00',
      cronExpression: config.schedulerCronExpression || '0 0 * * *',
      maxRetries: config.schedulerMaxRetries || 3,
      retryDelayMinutes: config.schedulerRetryDelayMinutes || 10,
      schedulerInput: config.schedulerInput || (locale === 'zh' ? '执行任务' : 'Execute it'),
    })
    setIsSchedulerConfigOpen(true)
  }

  const closeSchedulerConfigPanel = () => {
    setIsSchedulerConfigOpen(false)
    setSchedulerConfigDraft(null)
  }

  const switchSchedulerMode = (mode: SchedulerMode) => {
    setSchedulerConfigDraft((prev) => {
      if (!prev || prev.mode === mode) return prev

      const currentModeDefault = getSchedulerDefaultInterval(prev.mode)
      const nextModeDefault = getSchedulerDefaultInterval(mode)
      const nextInterval = prev.interval.trim() === '' || prev.interval === currentModeDefault ? nextModeDefault : prev.interval

      return {
        ...prev,
        mode,
        interval: nextInterval,
      }
    })
  }

  const saveSchedulerConfig = () => {
    if (!schedulerConfigDraft) return
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      schedulerEnabled: true,
      schedulerMode: schedulerConfigDraft.mode,
      schedulerInterval: schedulerConfigDraft.interval,
      schedulerAtMinute: schedulerConfigDraft.atMinute,
      schedulerWeekday: schedulerConfigDraft.weekday,
      schedulerMonthDay: schedulerConfigDraft.monthDay,
      schedulerTimeLabel: schedulerConfigDraft.timeLabel,
      schedulerTimeMinute: schedulerConfigDraft.timeMinute,
      schedulerCronExpression: schedulerConfigDraft.cronExpression,
      schedulerMaxRetries: Math.max(0, Math.min(10, schedulerConfigDraft.maxRetries || 0)),
      schedulerRetryDelayMinutes: Math.max(0, Math.min(60, schedulerConfigDraft.retryDelayMinutes || 0)),
      schedulerInput: schedulerConfigDraft.schedulerInput,
      schedulerExpression: buildSchedulerExpressionFromDraft(schedulerConfigDraft),
    }))
    closeSchedulerConfigPanel()
  }

  const updateStructuredOutputProperty = (
    propertyId: string,
    updater: (prev: ManagerialStructuredOutputProperty) => ManagerialStructuredOutputProperty,
  ) => {
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      structuredOutputProperties: prev.structuredOutputProperties.map((property) =>
        property.id === propertyId ? updater(property) : property,
      ),
    }))
  }

  const appendStructuredOutputProperty = () => {
    if (!selectedManagerialAgentKey) return
    updateSelectedManagerialAdvancedConfig((prev) => ({
      ...prev,
      structuredOutputProperties: [
        ...prev.structuredOutputProperties,
        createStructuredOutputProperty(
          `${selectedManagerialAgentKey}-schema-${Date.now()}`,
          '',
          'string',
          '',
        ),
      ],
    }))
  }

  const updateSingleManagerAgentRow = (
    rowId: string,
    updater: (row: SingleAgentSettingsDraft['managerAgents'][number]) => SingleAgentSettingsDraft['managerAgents'][number],
  ) => {
    updateSelectedSingleAgent((prev) => ({
      ...prev,
      managerAgents: prev.managerAgents.map((row) => (row.id === rowId ? updater(row) : row)),
    }))
  }

  const toggleSingleAgentListField = (
    field: 'skills' | 'knowledge' | 'tools',
    id: string,
  ) => {
    updateSelectedSingleAgent((prev) => {
      if (!prev) return prev
      const current = prev[field]
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { ...prev, [field]: next }
    })
  }

  const getSelectedLabels = (options: DropdownOption[], selectedIds: string[]) => {
    const names = options.filter((option) => selectedIds.includes(option.id)).map((option) => option.title)
    return names.length > 0 ? names.join(', ') : ''
  }

  const getSelectedOptions = (options: DropdownOption[], selectedIds: string[]) =>
    options.filter((option) => selectedIds.includes(option.id))

  const renderMultiSelectTriggerValue = (
    options: DropdownOption[],
    selectedIds: string[],
    placeholder: string,
    onRemove: (id: string) => void,
  ) => {
    const selected = getSelectedOptions(options, selectedIds)
    if (selected.length === 0) {
      return <span className="single-agent-select-placeholder">{placeholder}</span>
    }
    return (
      <span className="single-agent-select-tags" aria-label={getSelectedLabels(options, selectedIds)}>
        {selected.map((option) => (
          <span key={option.id} className="single-agent-select-tag">
            <span className="single-agent-select-tag-text">{option.title}</span>
            <button
              type="button"
              className="single-agent-select-tag-remove"
              aria-label={`移除 ${option.title}`}
              onClick={(event) => {
                event.stopPropagation()
                onRemove(option.id)
              }}
            >
              ×
            </button>
          </span>
        ))}
      </span>
    )
  }

  const openSingleAgentSettings = (agent: Agent) => {
    setSingleAgentSettingsByKey((prev) => ({
      ...prev,
      [agent.name]: prev[agent.name] ?? createSingleAgentDraft(agent, skillOptions, toolOptions),
    }))
    setIsSingleAdvancedConfigOpen(false)
    setSelectedSingleAgentKey(agent.name)
    setSelectedManagerialAgentKey(null)
    setOpenSettingsDropdown(null)
    setOpenManagerAgentPickerRowId(null)
    setIsSingleAvatarPickerOpen(false)
    setIsManagerAvatarPickerOpen(false)
    setIsOnboardingWorkflowOpen(false)
    setSingleAgentPreviewTab('preview')
  }

  /** 应用市场 Agent 模板「使用这个模板」完成后：初始化配置草稿，使卡片具备完整交互 */
  useEffect(() => {
    if (!marketAgentTemplateApplyRequest?.token) return
    if (marketAgentTemplateApplyHandledTokenRef.current === marketAgentTemplateApplyRequest.token) return

    const { agentName, item } = marketAgentTemplateApplyRequest
    const agent = agents.find((entry) => entry.name === agentName)
    if (!agent) {
      marketAgentTemplateApplyHandledTokenRef.current = marketAgentTemplateApplyRequest.token
      onMarketAgentTemplateApplyConsumed?.()
      return
    }

    marketAgentTemplateApplyHandledTokenRef.current = marketAgentTemplateApplyRequest.token
    const modalDescription = resolveMarketTemplateModalDescription(item, locale)

    if (isManagerialMarketAgentItem(item)) {
      const subAgents = item.subAgents ?? []
      setManagerialAgentSettingsByKey((prev) => {
        const base = normalizeManagerialDraft(
          prev[agentName] ?? createManagerialAgentDraft(agent, skillOptions, toolOptions),
        )
        return {
          ...prev,
          [agentName]: normalizeManagerialDraft({
            ...base,
            managerEnabled: true,
            agentInstructions: modalDescription,
            instructions: modalDescription,
            generatedPrompt: modalDescription,
            managerAgents:
              subAgents.length > 0
                ? subAgents.map((subAgent, index) => ({
                    id: `${agentName}-market-${subAgent.id}-${index}`,
                    agentName: locale === 'zh' ? subAgent.nameZh : subAgent.nameEn,
                    usage:
                      locale === 'zh'
                        ? subAgent.promptZh.split('\n')[0] ?? subAgent.promptZh
                        : subAgent.promptEn.split('\n')[0] ?? subAgent.promptEn,
                    source: 'agent' as const,
                  }))
                : base.managerAgents,
          }),
        }
      })
      setAgentsTab('managerial')
    } else {
      setSingleAgentSettingsByKey((prev) => {
        const base = prev[agentName] ?? createSingleAgentDraft(agent, skillOptions, toolOptions)
        return {
          ...prev,
          [agentName]: {
            ...base,
            agentInstructions: modalDescription,
            instructions: modalDescription,
            generatedPrompt: modalDescription,
          },
        }
      })
    }

    queueMicrotask(() => onMarketAgentTemplateApplyConsumed?.())
  }, [
    agents,
    locale,
    marketAgentTemplateApplyRequest,
    onMarketAgentTemplateApplyConsumed,
    skillOptions,
    toolOptions,
  ])

  const openManagerialAgentSettings = (agent: Agent) => {
    setManagerialAgentSettingsByKey((prev) => ({
      ...prev,
      [agent.name]: syncManagerialDescriptionDraft(
        normalizeManagerialDraft(prev[agent.name] ?? createManagerialAgentDraft(agent, skillOptions, toolOptions)),
        agent,
      ),
    }))
    setIsSingleAdvancedConfigOpen(false)
    setSelectedManagerialAgentKey(agent.name)
    setSelectedSingleAgentKey(null)
    setOpenSettingsDropdown(null)
    setOpenManagerAgentPickerRowId(null)
    setIsSingleAvatarPickerOpen(false)
    setIsManagerAvatarPickerOpen(false)
    setIsOnboardingWorkflowOpen(false)
    setManagerialAgentPreviewTab('preview')
  }

  const openAgentWorkspaceSettings = (agent: Agent) => {
    setCardEditAgentName(null)
    if (getAgentTag(agent.name) === 'Managerial Agent' || isOnboardingManagerAgent(agent.name)) {
      setAgentsTab('managerial')
      openManagerialAgentSettings(agent)
      return
    }
    setAgentsTab('single')
    openSingleAgentSettings(agent)
  }

  /** 侧栏 Runs「Onboarding 助手」等：进入 Agent 库并打开对应智能体设置（单 Agent / 管理型 Agent） */
  useEffect(() => {
    if (!libraryOpenSingleAgentRequest?.token) return
    if (libraryOpenSingleAgentHandledTokenRef.current === libraryOpenSingleAgentRequest.token) return
    const name = libraryOpenSingleAgentRequest.agentName.trim()
    const agent = agents.find((a) => a.name === name)
    if (!agent) {
      libraryOpenSingleAgentHandledTokenRef.current = libraryOpenSingleAgentRequest.token
      onLibraryOpenSingleAgentConsumed?.()
      return
    }
    libraryOpenSingleAgentHandledTokenRef.current = libraryOpenSingleAgentRequest.token
    openAgentWorkspaceSettings(agent)
    queueMicrotask(() => onLibraryOpenSingleAgentConsumed?.())
  }, [agents, libraryOpenSingleAgentRequest, onLibraryOpenSingleAgentConsumed])

  useEffect(() => {
    if (!agentLibraryCardAction?.token) return
    if (agentLibraryCardActionHandledTokenRef.current === agentLibraryCardAction.token) return
    const name = agentLibraryCardAction.agentName.trim()
    const agent = agents.find((item) => item.name === name)
    if (!agent) {
      agentLibraryCardActionHandledTokenRef.current = agentLibraryCardAction.token
      onAgentLibraryCardActionConsumed?.()
      return
    }
    if (agentLibraryCardAction.action === 'edit') {
      openAgentWorkspaceSettings(agent)
    } else {
      duplicateAgentByName(name)
    }
    agentLibraryCardActionHandledTokenRef.current = agentLibraryCardAction.token
    queueMicrotask(() => onAgentLibraryCardActionConsumed?.())
  }, [agentLibraryCardAction, agents, duplicateAgentByName, onAgentLibraryCardActionConsumed])

  useEffect(() => {
    if (!selectedManagerialAgentKey) return
    const agent = agents.find((item) => item.name === selectedManagerialAgentKey)
    if (!agent) return
    setManagerialAgentSettingsByKey((prev) => {
      const current = prev[selectedManagerialAgentKey]
      if (!current) return prev
      const next = syncManagerialDescriptionDraft(current, agent)
      return next === current ? prev : { ...prev, [selectedManagerialAgentKey]: next }
    })
  }, [agents, selectedManagerialAgentKey])

  let sharedAdvancedConfigNavItems: Array<{ id: ManagerialAdvancedConfigNav; label: string; hint: string }> = []
  let sharedRenderAdvancedConfigContent: ((nav: ManagerialAdvancedConfigNav) => ReactNode) | null = null
  let renderManagerialAgentSettingsPage: (() => ReactNode) | null = null

  const renderInstructionGeneratorModal = (
    agentName: string,
    managerial: boolean,
    onApply: (generatedText: string) => void,
  ) => {
    if (!isInstructionModalOpen) return null
    const isRoleMode = instructionGeneratorField === 'role'
    const modalTitle = isRoleMode
      ? locale === 'zh'
        ? '生成角色'
        : 'Generate role'
      : locale === 'zh'
        ? '生成描述'
        : 'Generate description'
    const modalSubtitle = isRoleMode
      ? locale === 'zh'
        ? '通过补充职责、目标或使用场景，你可以快速生成一段更清晰的角色描述。'
        : 'Add responsibilities, goals, or usage context to quickly generate a clearer role description.'
      : locale === 'zh'
        ? '通过补充任务的基本信息，你可以快速生成一份提示词模板。'
        : 'Add basic task details to quickly generate a prompt template.'
    const textareaPlaceholder = isRoleMode
      ? locale === 'zh'
        ? '在这里描述该角色负责什么、面向谁、要解决什么问题'
        : 'Describe what this role owns, who it serves, and what it should solve'
      : locale === 'zh'
        ? '在这里描述你的任务'
        : 'Describe your task here'

    return (
      <div className="single-agent-modal-layer" role="presentation">
        <div
          className="single-agent-modal-backdrop"
          onClick={() => {
            if (isInstructionGenerating) return
            setIsInstructionModalOpen(false)
          }}
        />
        <div className="single-agent-modal" role="dialog" aria-modal="true" aria-label={modalTitle}>
          <button
            type="button"
            className="single-agent-modal-close"
            aria-label={locale === 'zh' ? '关闭' : 'Close'}
            disabled={isInstructionGenerating}
            onClick={() => setIsInstructionModalOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
          <div className="single-agent-modal-title">{modalTitle}</div>
          <div className="single-agent-modal-subtitle">{modalSubtitle}</div>
          {!isRoleMode ? (
            <div className="single-agent-template-list">
              {instructionTemplates.map((template) => (
                <button
                  key={template}
                  className={
                    instructionSelectedTemplate === template
                      ? 'single-agent-template-chip is-active'
                      : 'single-agent-template-chip'
                  }
                  type="button"
                  onClick={() => {
                    setInstructionSelectedTemplate(template)
                    setInstructionTaskInput(getInstructionTemplateLabel(template, locale))
                  }}
                >
                  {getInstructionTemplateLabel(template, locale)}
                </button>
              ))}
            </div>
          ) : null}
          <textarea
            className="single-agent-modal-textarea"
            placeholder={textareaPlaceholder}
            value={instructionTaskInput}
            onChange={(event) => setInstructionTaskInput(event.target.value)}
            rows={3}
          />
          {instructionGeneratedDraft ? (
            <pre className="single-agent-modal-preview">{instructionGeneratedDraft}</pre>
          ) : null}
          <div className="single-agent-modal-actions">
            <button
              className="single-agent-modal-cancel"
              type="button"
              disabled={isInstructionGenerating}
              onClick={() => setIsInstructionModalOpen(false)}
            >
              {locale === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              className={
                isInstructionGenerating
                  ? 'single-agent-modal-submit is-loading'
                  : 'single-agent-modal-submit'
              }
              type="button"
              disabled={isInstructionGenerating}
              onClick={() => {
                if (instructionGeneratedDraft) {
                  onApply(instructionGeneratedDraft)
                  setIsInstructionModalOpen(false)
                  return
                }

                setIsInstructionGenerating(true)
                window.setTimeout(() => {
                  setInstructionGeneratedDraft(
                    isRoleMode
                      ? buildGeneratedRole(agentName, instructionTaskInput, managerial)
                      : buildGeneratedPrompt(
                          agentName,
                          instructionSelectedTemplate || '调研并生成报告',
                          instructionTaskInput,
                        ),
                  )
                  setIsInstructionGenerating(false)
                }, 1000)
              }}
            >
              {isInstructionGenerating ? (
                <>
                  <span className="single-agent-spinner" aria-hidden="true" />
                  {locale === 'zh' ? '生成中...' : 'Generating...'}
                </>
              ) : instructionGeneratedDraft ? (
                locale === 'zh' ? '保存' : 'Save'
              ) : (
                locale === 'zh' ? '生成' : 'Generate'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAgentDetailFieldModal = () => {
    if (!agentDetailFieldModal) return null

    return (
      <div className="single-agent-modal-layer" role="presentation">
        <div
          className="single-agent-modal-backdrop"
          onClick={() => setAgentDetailFieldModal(null)}
        />
        <div
          className="single-agent-modal"
          role="dialog"
          aria-modal="true"
          aria-label={agentDetailFieldModal.label}
        >
          <button
            type="button"
            className="single-agent-modal-close"
            aria-label={locale === 'zh' ? '关闭' : 'Close'}
            onClick={() => setAgentDetailFieldModal(null)}
          >
            <span aria-hidden="true">×</span>
          </button>
          <div className="single-agent-modal-title">{agentDetailFieldModal.label}</div>
          <div className="single-agent-modal-subtitle">
            {locale === 'zh'
              ? '这里显示并编辑该字段的完整内容。'
              : 'View and edit the full content of this field here.'}
          </div>
          <textarea
            className="single-agent-modal-textarea single-agent-modal-textarea--detail"
            value={agentDetailFieldDraft}
            onChange={(event) => setAgentDetailFieldDraft(event.target.value)}
            rows={8}
          />
          <div className="single-agent-modal-actions">
            <button
              className="single-agent-modal-cancel"
              type="button"
              onClick={() => setAgentDetailFieldModal(null)}
            >
              {locale === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              className="single-agent-modal-submit"
              type="button"
              onClick={() => {
                if (agentDetailFieldModal.agentKind === 'single') {
                  updateSelectedSingleAgent((prev) => ({
                    ...prev,
                    [agentDetailFieldModal.fieldKey]: agentDetailFieldDraft,
                  }))
                } else {
                  updateSelectedManagerialAgent((prev) => ({
                    ...prev,
                    [agentDetailFieldModal.fieldKey]: agentDetailFieldDraft,
                  }))
                }
                setAgentDetailFieldModal(null)
              }}
            >
              {locale === 'zh' ? '保存' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSingleAgentSettingsPage = () => {
    if (!selectedSingleAgent) return null

    const singleManagerAgentPickerOptions: DropdownOption[] = agentsWithDerived
      .filter((agent) => agent.name !== selectedSingleAgent.name)
      .map((agent) => ({
        id: agent.name,
        title: agent.name,
        description: agent.desc.replace(/…/g, '').trim(),
      }))

    if (isSingleAdvancedConfigOpen && renderManagerialAgentSettingsPage) {
      sharedAdvancedConfigNavItems = []
      sharedRenderAdvancedConfigContent = null
      return (
        <>
          {renderManagerialAgentSettingsPage()}
          {renderAgentPublishModal()}
          {renderAgentFreezeModal()}
          {renderAgentNoticeToast()}
        </>
      )
    }

    const renderMultiSelectField = (
      dropdownKey: 'skills' | 'knowledge' | 'tools',
      label: string,
      helper: string,
      placeholder: string,
      options: DropdownOption[],
      selectedIds: string[],
      dropdownPlacement: 'above' | 'below' = 'below',
    ) => (
      <div className="single-agent-field">
        <div className="single-agent-label-with-info">
          <label className="single-agent-label">{label}</label>
          <span className="single-agent-label-info-wrap">
            <button
              type="button"
              className="single-agent-label-info"
              aria-label={locale === 'zh' ? `${label}说明` : `${label} help`}
              aria-describedby={`single-agent-${dropdownKey}-hint`}
            >
              <span aria-hidden="true">i</span>
            </button>
            <span
              id={`single-agent-${dropdownKey}-hint`}
              role="tooltip"
              className="single-agent-label-info-popover"
            >
              {helper}
            </span>
          </span>
        </div>
        <div className="single-agent-select-wrap">
          <div
            className={[
              'single-agent-select',
              selectedIds.length > 0 ? 'has-selected-tags' : '',
              openSettingsDropdown === dropdownKey ? 'is-open' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="combobox"
            aria-expanded={openSettingsDropdown === dropdownKey}
            aria-label={label}
            tabIndex={0}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('.single-agent-select-tag-remove')) return
              setOpenSettingsDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              setOpenSettingsDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }}
          >
            {renderMultiSelectTriggerValue(options, selectedIds, placeholder, (id) =>
              toggleSingleAgentListField(dropdownKey, id),
            )}
            <span className="single-agent-select-caret" aria-hidden="true">
              ▾
            </span>
          </div>
          {openSettingsDropdown === dropdownKey ? (
            <div
              className={
                dropdownPlacement === 'above'
                  ? 'single-agent-dropdown single-agent-dropdown--above'
                  : 'single-agent-dropdown'
              }
              role="listbox"
              aria-label={label}
            >
              {options.map((option) => {
                const selected = selectedIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    className={selected ? 'single-agent-dropdown-item is-selected' : 'single-agent-dropdown-item'}
                    type="button"
                    onClick={() => toggleSingleAgentListField(dropdownKey, option.id)}
                  >
                    <div className="single-agent-dropdown-title-row">
                      <div className="single-agent-dropdown-title">{option.title}</div>
                      {selected ? (
                        <span className="single-agent-dropdown-check" aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    {option.description ? (
                      <div className="single-agent-dropdown-desc">{option.description}</div>
                    ) : null}
                    {option.meta ? <div className="single-agent-dropdown-meta">{option.meta}</div> : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    )

    const clearSinglePreview = () => {
      setSinglePreviewMessages([])
      setSinglePreviewInput('')
      setSinglePreviewAttachments([])
      setSinglePreviewVoiceListening(false)
      singlePreviewRecognitionRef.current?.abort()
      singlePreviewRecognitionRef.current = null
      if (singlePreviewFileInputRef.current) singlePreviewFileInputRef.current.value = ''
    }

    const handleSinglePreviewFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length === 0) return
      setSinglePreviewAttachments((current) => [
        ...current,
        ...files.map((file) => ({
          id: `single-attachment-${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
        })),
      ])
      event.target.value = ''
    }

    const removeSinglePreviewAttachment = (attachmentId: string) => {
      setSinglePreviewAttachments((current) => current.filter((item) => item.id !== attachmentId))
    }

    const canSendSinglePreview = singlePreviewInput.trim().length > 0 || singlePreviewAttachments.length > 0

    const sendSinglePreviewMessage = () => {
      const nextText = singlePreviewInput.trim()
      if (!nextText && singlePreviewAttachments.length === 0) return

      const attachments = singlePreviewAttachments
      const userMessage: ManagerialPreviewMessage = {
        id: `single-preview-user-${Date.now()}`,
        role: 'user',
        text: nextText || (locale === 'zh' ? '已上传附件。' : 'Uploaded attachments.'),
        attachments,
      }
      const assistantMessage: ManagerialPreviewMessage = {
        id: `single-preview-assistant-${Date.now() + 1}`,
        role: 'assistant',
        text: buildSinglePreviewReply(nextText || userMessage.text, selectedSingleAgent, locale, attachments),
      }

      setSinglePreviewMessages((current) => [...current, userMessage, assistantMessage])
      setSinglePreviewInput('')
      setSinglePreviewAttachments([])
    }

    const handleSinglePreviewVoiceClick = () => {
      if (singlePreviewVoiceListening) {
        singlePreviewRecognitionRef.current?.stop()
        return
      }
      const recognition = createPreviewSpeechRecognition()
      if (!recognition) return

      recognition.lang = locale === 'zh' ? 'zh-CN' : 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onstart = () => setSinglePreviewVoiceListening(true)
      recognition.onend = () => {
        setSinglePreviewVoiceListening(false)
        singlePreviewRecognitionRef.current = null
      }
      recognition.onerror = () => {
        setSinglePreviewVoiceListening(false)
        singlePreviewRecognitionRef.current = null
      }
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join('')
          .trim()
        if (!transcript) return
        setSinglePreviewInput((current) => `${current}${current ? ' ' : ''}${transcript}`.trim())
      }
      singlePreviewRecognitionRef.current = recognition
      recognition.start()
    }

    return (
      <section
        className={
          isSingleAdvancedConfigOpen
            ? 'single-agent-page managerial-agent-page'
            : 'single-agent-page'
        }
        aria-label={locale === 'zh' ? '单Agent 设置' : 'Single agent settings'}
      >
        <div className="single-agent-shell">
          <div className="single-agent-main">
            <div
              className={
                isSingleAdvancedConfigOpen
                  ? 'single-agent-topbar managerial-agent-topbar--advanced-open'
                  : 'single-agent-topbar'
              }
            >
              <div className="single-agent-topbar-left">
                <div className="single-agent-topbar-left-main">
                  <button
                    className="agents-back-btn"
                    type="button"
                    aria-label={locale === 'zh' ? '返回单智能体列表' : 'Back to single agent list'}
                    onClick={() => {
                      closeSingleAgentAdvancedConfig()
                      setSelectedSingleAgentKey(null)
                      setOpenSettingsDropdown(null)
                    }}
                  >
                    ←
                  </button>
                  <div className="single-agent-topmeta">
                    <div className="single-agent-title-row">
                      <div className="single-agent-title">{selectedSingleAgent.name}</div>
                      {isAgentFrozen(selectedSingleAgent.name) ? (
                        <span className="agent-card-status-badge agent-card-status-badge--frozen">
                          {getAgentFrozenStatusBadge(locale).label}
                        </span>
                      ) : showAgentPublishedBadge(selectedSingleAgent.name) ? (
                        <span className="agent-card-status-badge agent-card-status-badge--published">
                          {getAgentPublishedStatusBadge(locale).label}
                        </span>
                      ) : null}
                    </div>
                    <div className="single-agent-subtitle">{locale === 'zh' ? '单智能体设置' : 'Single agent settings'}</div>
                  </div>
                </div>
                <div className="single-agent-left-actions">
                  {canUseAdvancedConfig ? (
                    <button
                      className={
                        isSingleAdvancedConfigOpen
                          ? 'single-agent-preview-icon managerial-agent-advanced-btn is-active'
                          : 'single-agent-preview-icon managerial-agent-advanced-btn'
                      }
                      type="button"
                      aria-label={locale === 'zh' ? '高级配置' : 'Advanced configuration'}
                      aria-pressed={isSingleAdvancedConfigOpen}
                      disabled={!selectedSingleAgent.managerEnabled}
                      onClick={() => {
                        if (isSingleAdvancedConfigOpen) {
                          closeSingleAgentAdvancedConfig()
                          return
                        }
                        openSingleAgentAdvancedConfig('reasoning')
                      }}
                    >
                      <ManagerialAdvancedConfigIcon />
                    </button>
                  ) : null}
                  <button
                    className="single-agent-preview-icon managerial-agent-edit-btn"
                    type="button"
                    aria-label={locale === 'zh' ? '编辑' : 'Edit'}
                    onClick={() => {
                      closeSingleAgentAdvancedConfig()
                      openSingleAgentEditView()
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="m6.75 17.25 8.92-8.92 2 2-8.92 8.92-2.75.75z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m14.92 8.42 2 2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6.75 17.25 6 20l2.75-.75"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label={locale === 'zh' ? '代码' : 'Code'}>
                    {'</>'}
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label={locale === 'zh' ? '保存' : 'Save'}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M6 4.75h9.2l2.8 2.8V19.25H6z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 4.75v5.5h5.5v-5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 19.25v-5.25h6v5.25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="managerial-agent-top-settings" ref={singleSettingsMenuRef}>
                    <button
                      className="single-agent-preview-icon"
                      type="button"
                      aria-label={locale === 'zh' ? '设置' : 'Settings'}
                      aria-haspopup="menu"
                      aria-expanded={isSingleSettingsMenuOpen}
                      onClick={() => setIsSingleSettingsMenuOpen((prev) => !prev)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M12 9.25a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M19 12a7 7 0 0 0-.08-1l2.03-1.58-1.92-3.32-2.45.78a7.27 7.27 0 0 0-1.74-1L14.5 3h-5l-.34 2.88a7.27 7.27 0 0 0-1.74 1l-2.45-.78-1.92 3.32L5.08 11A7 7 0 0 0 5 12c0 .34.03.67.08 1l-2.03 1.58 1.92 3.32 2.45-.78c.53.42 1.12.76 1.74 1L9.5 21h5l.34-2.88c.62-.24 1.21-.58 1.74-1l2.45.78 1.92-3.32L18.92 13c.05-.33.08-.66.08-1Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    {isSingleSettingsMenuOpen ? (
                      <div
                        className="managerial-agent-settings-menu"
                        role="menu"
                        aria-label={locale === 'zh' ? '设置选项' : 'Settings options'}
                      >
                        <button
                          type="button"
                          className="managerial-agent-settings-menu-item"
                          role="menuitem"
                          onClick={showSingleAgentMessages}
                        >
                          <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M5 6.5h14v11H8.5L5 20V6.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                              <path d="M8.5 10h7M8.5 13.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>{locale === 'zh' ? '查看消息' : 'View Messages'}</span>
                        </button>
                        <button
                          type="button"
                          className="managerial-agent-settings-menu-item"
                          role="menuitem"
                          onClick={showSingleAgentLeads}
                        >
                          <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M7 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm8 10.5v-.75A4.75 4.75 0 0 0 10.25 13H9.5A4.5 4.5 0 0 0 5 17.5v1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              <path d="M16.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm2.5 8v-.25a3.75 3.75 0 0 0-3.75-3.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>{locale === 'zh' ? '查看负责人' : 'View Leads'}</span>
                        </button>
                        {canUseAdvancedConfig ? (
                          <button
                            type="button"
                            className="managerial-agent-settings-menu-item"
                            role="menuitem"
                            disabled={!selectedSingleAgent.managerEnabled}
                            onClick={() => openSingleAgentAdvancedConfig()}
                          >
                            <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                              <ManagerialAdvancedConfigIcon />
                            </span>
                            <span>{locale === 'zh' ? '配置' : 'Configuration'}</span>
                          </button>
                        ) : null}
                        {canDeleteAgent ? (
                          <button
                            type="button"
                            className="managerial-agent-settings-menu-item managerial-agent-settings-menu-item--danger"
                            role="menuitem"
                            onClick={() => setIsSingleSettingsMenuOpen(false)}
                          >
                            <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M6.5 7.5h11M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5m-7 0V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span>{locale === 'zh' ? '删除助手' : 'Delete Assistant'}</span>
                          </button>
                        ) : null}
                        <div className="managerial-agent-settings-menu-divider" />
                        <button
                          type="button"
                          className="managerial-agent-settings-menu-item"
                          role="menuitem"
                          onClick={showSingleAgentDetails}
                        >
                          <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M4.75 6.75h14.5v10.5H4.75z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M8.5 12h7M12 8.5v7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>{locale === 'zh' ? '查看详情' : 'Show Details'}</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="single-agent-topbar-right">
                <div className="single-agent-preview-tabs" role="tablist" aria-label={locale === 'zh' ? '预览标签' : 'Preview tabs'}>
                  <button
                    className={
                      singleAgentPreviewTab === 'preview'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setSingleAgentPreviewTab('preview')}
                  >
                    {locale === 'zh' ? '预览' : 'Preview'}
                  </button>
                  <button
                    className={
                      singleAgentPreviewTab === 'ai-adjust'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setSingleAgentPreviewTab('ai-adjust')}
                  >
                    {locale === 'zh' ? 'AI修改' : 'AI edit'}
                  </button>
                </div>
                <div className="single-agent-topbar-actions">
                  {renderTopbarSaveButton(selectedSingleAgent.name)}
                  {renderTopbarPublishButton(selectedSingleAgent.name, 'Single Agent')}
                </div>
              </div>
            </div>

            <div
              className={
                isSingleAdvancedConfigOpen
                  ? 'single-agent-layout managerial-agent-layout managerial-agent-layout--advanced-open'
                  : 'single-agent-layout'
              }
            >
              <div className="single-agent-left">
                <div ref={singleAgentDetailsRef} className="single-agent-card">
                  <div className="single-agent-field">
                    <div className="managerial-agent-name-row">
                      <div className="managerial-agent-avatar-picker" ref={singleAvatarPickerRef}>
                        <button
                          className={
                            selectedSingleAgent.avatar
                              ? 'managerial-agent-avatar-button'
                              : 'managerial-agent-avatar-button is-empty'
                          }
                          type="button"
                          title={locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}
                          aria-label={locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}
                          onClick={() => setIsSingleAvatarPickerOpen((prev) => !prev)}
                        >
                          {selectedSingleAgent.avatar ? (
                            <img
                              className="managerial-agent-avatar-image"
                              src={selectedSingleAgent.avatar}
                              alt={`${selectedSingleAgent.name} 头像`}
                            />
                          ) : (
                            <span className="managerial-agent-avatar-placeholder" aria-hidden="true">
                              👤
                            </span>
                          )}
                          <span className="managerial-agent-avatar-overlay">
                            <span className="managerial-agent-avatar-tooltip">{locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}</span>
                            <span className="managerial-agent-avatar-edit" aria-hidden="true">
                              ✎
                            </span>
                          </span>
                        </button>

                        {isSingleAvatarPickerOpen ? (
                          <div className="managerial-agent-avatar-panel">
                            <div className="managerial-agent-avatar-panel-title">{locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}</div>
                            <div className="managerial-agent-avatar-grid">
                              {EXPERIENCE_AVATAR_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  className={
                                    selectedSingleAgent.avatar === option.src
                                      ? 'managerial-agent-avatar-option is-selected'
                                      : 'managerial-agent-avatar-option'
                                  }
                                  type="button"
                                  title={option.label}
                                  aria-label={locale === 'zh' ? `选择头像：${option.label}` : `Choose avatar: ${option.label}`}
                                  onClick={() => {
                                    updateSelectedSingleAgent((prev) => ({
                                      ...prev,
                                      avatar: option.src,
                                    }))
                                    setIsSingleAvatarPickerOpen(false)
                                  }}
                                >
                                  <img src={option.src} alt={option.label} />
                                </button>
                              ))}
                            </div>
                            <div className="managerial-agent-avatar-panel-footer">
                              <button
                                className="managerial-agent-avatar-upload"
                                type="button"
                                onClick={() => singleAvatarUploadInputRef.current?.click()}
                              >
                                {locale === 'zh' ? '上传头像' : 'Upload avatar'}
                              </button>
                              <input
                                ref={singleAvatarUploadInputRef}
                                className="managerial-agent-avatar-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleSingleAvatarUpload}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="managerial-agent-name-main">
                        <label className="single-agent-label managerial-agent-name-label" htmlFor="single-agent-name">
                          {locale === 'zh' ? '智能体名称' : 'Agent name'} <span className="single-agent-required">*</span>
                        </label>
                        <input
                          id="single-agent-name"
                          className="single-agent-input managerial-agent-name-input"
                          value={selectedSingleAgent.name}
                          onChange={(event) =>
                            updateSelectedSingleAgent((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-row">
                      <label className="single-agent-label" htmlFor="single-agent-role">角色</label>
                      <button
                        className="single-agent-generate-link"
                        type="button"
                        onClick={() =>
                          openInstructionGenerator(
                            'role',
                            selectedSingleAgent.agentRole || selectedSingleAgent.agentGoal || selectedSingleAgent.name,
                          )
                        }
                      >
                        {locale === 'zh' ? '✦ AI生成' : '✦ Generate with AI'}
                      </button>
                    </div>
                    <input
                      id="single-agent-role"
                      className="single-agent-input single-agent-input--preview"
                      value={selectedSingleAgent.agentRole}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal('single', 'agentRole', '角色', selectedSingleAgent.agentRole)
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="single-agent-goal">目标</label>
                    <input
                      id="single-agent-goal"
                      className="single-agent-input single-agent-input--preview"
                      value={selectedSingleAgent.agentGoal}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal('single', 'agentGoal', '目标', selectedSingleAgent.agentGoal)
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="single-agent-rules">原则</label>
                    <input
                      id="single-agent-rules"
                      className="single-agent-input single-agent-input--preview"
                      value={selectedSingleAgent.agentRules}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal('single', 'agentRules', '原则', selectedSingleAgent.agentRules)
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="single-agent-agent-instructions">指令</label>
                    <textarea
                      id="single-agent-agent-instructions"
                      className="single-agent-textarea single-agent-textarea--preview"
                      value={selectedSingleAgent.agentInstructions}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal(
                          'single',
                          'agentInstructions',
                          '指令',
                          selectedSingleAgent.agentInstructions,
                        )
                      }
                      rows={getPreviewTextareaRows(selectedSingleAgent.agentInstructions)}
                    />
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-with-info">
                      <label className="single-agent-label" htmlFor="single-agent-model">
                        {locale === 'zh' ? '模型配置' : 'Model config'} <span className="single-agent-required">*</span>
                      </label>
                      <span className="single-agent-label-info-wrap">
                        <button
                          type="button"
                          className="single-agent-label-info"
                          aria-label={locale === 'zh' ? '模型配置说明' : 'Model config help'}
                          aria-describedby="single-agent-model-hint"
                        >
                          <span aria-hidden="true">i</span>
                        </button>
                        <span id="single-agent-model-hint" role="tooltip" className="single-agent-label-info-popover">
                          {locale === 'zh' ? '选择一个模型配置模板。' : 'Choose a model configuration template.'}
                        </span>
                      </span>
                    </div>
                    <div className="single-agent-select-wrap">
                      <div
                        id="single-agent-model"
                        className={
                          openSettingsDropdown === 'modelConfig'
                            ? 'single-agent-select single-agent-select--model is-open'
                            : 'single-agent-select single-agent-select--model'
                        }
                      >
                        <button
                          className="single-agent-select-trigger"
                          type="button"
                          aria-expanded={openSettingsDropdown === 'modelConfig'}
                          onClick={() => {
                            setOpenSettingsDropdown((prev) =>
                              prev === 'modelConfig' ? null : 'modelConfig',
                            )
                          }}
                        >
                          <span
                            className={
                              selectedSingleAgent.modelConfig
                                ? 'single-agent-select-value'
                                : 'single-agent-select-placeholder'
                            }
                          >
                            {selectedSingleAgent.modelConfig || (locale === 'zh' ? '请选择模型配置' : 'Select model config')}
                          </span>
                        </button>
                        {selectedSingleAgent.modelConfig ? (
                          <button
                            className="single-agent-select-clear"
                            type="button"
                            aria-label={locale === 'zh' ? '清空模型配置' : 'Clear model config'}
                            onClick={() => {
                              updateSelectedSingleAgent((prev) => ({
                                ...prev,
                                modelConfig: '',
                              }))
                              setOpenSettingsDropdown(null)
                            }}
                          >
                            ×
                          </button>
                        ) : null}
                        <button
                          className="single-agent-select-icon-button"
                          type="button"
                          aria-label={locale === 'zh' ? '展开模型配置列表' : 'Open model config list'}
                          aria-expanded={openSettingsDropdown === 'modelConfig'}
                          onClick={() => {
                            setOpenSettingsDropdown((prev) =>
                              prev === 'modelConfig' ? null : 'modelConfig',
                            )
                          }}
                        >
                          <span className="single-agent-select-caret" aria-hidden="true">
                            ▾
                          </span>
                        </button>
                      </div>
                      {openSettingsDropdown === 'modelConfig' ? (
                        <div className="single-agent-dropdown" role="listbox">
                          <div className="single-agent-dropdown-scroll">
                            {modelConfigOptions.map((option) => (
                              <button
                                key={option.id}
                                className={
                                  selectedSingleAgent.modelConfig === option.title
                                    ? 'single-agent-dropdown-item is-selected'
                                    : 'single-agent-dropdown-item'
                                }
                                type="button"
                                onClick={() => {
                                  updateSelectedSingleAgent((prev) => ({
                                    ...prev,
                                    modelConfig: option.title,
                                  }))
                                  setOpenSettingsDropdown(null)
                                }}
                              >
                                <div className="single-agent-dropdown-title">{option.title}</div>
                                {option.description ? (
                                  <div className="single-agent-dropdown-desc">{option.description}</div>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-row">
                      <label className="single-agent-label" htmlFor="single-agent-instructions">
                        {locale === 'zh' ? '描述' : 'Description'} <span className="single-agent-required">*</span>
                      </label>
                      <button
                        className="single-agent-generate-link"
                        type="button"
                        onClick={() =>
                          openInstructionGenerator(
                            'instructions',
                            selectedSingleAgent.agentInstructions || selectedSingleAgent.instructions,
                          )
                        }
                      >
                        {locale === 'zh' ? '✦ AI生成' : '✦ Generate with AI'}
                      </button>
                    </div>
                    {selectedSingleAgent.generatedPrompt ? (
                      <div className="single-agent-markdown-block">
                        <div className="single-agent-markdown-title">{locale === 'zh' ? '生成的提示词' : 'Generated prompt'}</div>
                        <pre className="single-agent-markdown-preview">
                          {selectedSingleAgent.generatedPrompt}
                        </pre>
                      </div>
                    ) : (
                      <textarea
                        id="single-agent-instructions"
                        className="single-agent-textarea"
                        value={selectedSingleAgent.instructions}
                        onChange={(event) =>
                          updateSelectedSingleAgent((prev) => ({
                            ...prev,
                            instructions: event.target.value,
                          }))
                        }
                        rows={8}
                      />
                    )}
                  </div>

                  {canToggleManagerAgent ? (
                    <div ref={singleAgentManagerSectionRef} className="single-agent-field manager-agent-field">
                      <div className="manager-agent-toggle-row">
                        <label className="single-agent-label manager-agent-label">{locale === 'zh' ? 'Manager Agent' : 'Manager Agent'}</label>
                        <button
                          className={
                            selectedSingleAgent.managerEnabled
                              ? 'manager-agent-switch is-on'
                              : 'manager-agent-switch'
                          }
                          type="button"
                          role="switch"
                          aria-checked={selectedSingleAgent.managerEnabled}
                          onClick={() => {
                            const nextEnabled = !selectedSingleAgent.managerEnabled
                            if (!nextEnabled) {
                              closeSingleAgentAdvancedConfig()
                            }
                            updateSelectedSingleAgent((prev) => ({
                              ...prev,
                              managerEnabled: nextEnabled,
                            }))
                            setManagerialAgentSettingsByKey((prev) => {
                              const current = prev[selectedSingleAgent.name]
                              if (nextEnabled) {
                                return {
                                  ...prev,
                                  [selectedSingleAgent.name]:
                                    current
                                      ? { ...current, managerEnabled: true }
                                      : createManagerialDraftFromSingle({
                                          ...selectedSingleAgent,
                                          managerEnabled: true,
                                        }, skillOptions, toolOptions),
                                }
                              }
                              return current
                                ? {
                                    ...prev,
                                    [selectedSingleAgent.name]: { ...current, managerEnabled: false },
                                  }
                                : prev
                            })
                          }}
                        >
                          <span className="manager-agent-switch-thumb" aria-hidden="true" />
                        </button>
                      </div>
                      {selectedSingleAgent.managerEnabled ? (
                      <div className="manager-agent-panel">
                        <div className="manager-agent-warning">
                          <span className="manager-agent-warning-icon" aria-hidden="true">
                            △
                          </span>
                          <span>
                            {locale === 'zh'
                              ? '开启后该卡片会显示为 Managerial Agent，并在 Agent 库中按管理型智能体入口打开。'
                              : 'When enabled, this card will appear as a Managerial Agent and open from the manager-agent entry in the library.'}
                          </span>
                        </div>

                        <div className="manager-agent-list-title">{locale === 'zh' ? 'Agents' : 'Agents'}</div>
                        <div className="manager-agent-list">
                          {selectedSingleAgent.managerAgents.map((row) => (
                            <div key={row.id} className="manager-agent-row">
                              <button className="manager-agent-icon-btn" type="button" aria-label={locale === 'zh' ? '刷新' : 'Refresh'}>
                                ↻
                              </button>

                              <div className="manager-agent-select-wrap">
                                <button
                                  className={
                                    openManagerAgentPickerRowId === row.id
                                      ? 'manager-agent-select is-open'
                                      : 'manager-agent-select'
                                  }
                                  type="button"
                                  onClick={() =>
                                    setOpenManagerAgentPickerRowId((prev) =>
                                      prev === row.id ? null : row.id,
                                    )
                                  }
                                >
                                  <span
                                    className={
                                      row.agentName
                                        ? 'manager-agent-select-value'
                                        : 'manager-agent-select-placeholder'
                                    }
                                  >
                                    {row.agentName || (locale === 'zh' ? '选择一个 Agent' : 'Select an agent')}
                                  </span>
                                  <span className="manager-agent-select-caret" aria-hidden="true">
                                    ▾
                                  </span>
                                </button>
                                {openManagerAgentPickerRowId === row.id ? (
                                  <div className="manager-agent-picker" role="listbox" aria-label={locale === 'zh' ? 'Agent列表' : 'Agent list'}>
                                    {singleManagerAgentPickerOptions.map((option) => (
                                      <button
                                        key={option.id}
                                        className="manager-agent-picker-item"
                                        type="button"
                                        onClick={() => {
                                          updateSingleManagerAgentRow(row.id, (current) => ({
                                            ...current,
                                            agentName: option.title,
                                          }))
                                          setManagerialAgentSettingsByKey((prev) => {
                                            const current = prev[selectedSingleAgent.name]
                                            if (!current) return prev
                                            return {
                                              ...prev,
                                              [selectedSingleAgent.name]: {
                                                ...current,
                                                managerAgents: current.managerAgents.map((item) =>
                                                  item.id === row.id ? { ...item, agentName: option.title } : item,
                                                ),
                                              },
                                            }
                                          })
                                          setOpenManagerAgentPickerRowId(null)
                                        }}
                                      >
                                        <div className="manager-agent-picker-title">{option.title}</div>
                                        {option.description ? (
                                          <div className="manager-agent-picker-desc">{option.description}</div>
                                        ) : null}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              <input
                                className="manager-agent-usage-input"
                                placeholder={locale === 'zh' ? '你会如何使用这个 Agent？' : 'How will you use this agent?'}
                                value={row.usage}
                                onChange={(event) => {
                                  const usage = event.target.value
                                  updateSingleManagerAgentRow(row.id, (current) => ({
                                    ...current,
                                    usage,
                                  }))
                                  setManagerialAgentSettingsByKey((prev) => {
                                    const current = prev[selectedSingleAgent.name]
                                    if (!current) return prev
                                    return {
                                      ...prev,
                                      [selectedSingleAgent.name]: {
                                        ...current,
                                        managerAgents: current.managerAgents.map((item) =>
                                          item.id === row.id ? { ...item, usage } : item,
                                        ),
                                      },
                                    }
                                  })
                                }}
                              />

                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label={locale === 'zh' ? '编辑Agent' : 'Edit agent'}
                                onClick={() => showAgentNotice(noticeText.subAgentEdited, noticeText.subAgentEditedSub)}
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                  <path
                                    d="M14 5h5v5M10 14 19 5M18 14v4a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>

                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label={locale === 'zh' ? '删除Agent' : 'Delete agent'}
                                onClick={() => {
                                  if (selectedSingleAgent.managerAgents.length <= 1) return
                                  updateSelectedSingleAgent((prev) => ({
                                    ...prev,
                                    managerAgents: prev.managerAgents.filter((item) => item.id !== row.id),
                                  }))
                                  setManagerialAgentSettingsByKey((prev) => {
                                    const current = prev[selectedSingleAgent.name]
                                    if (!current) return prev
                                    return {
                                      ...prev,
                                      [selectedSingleAgent.name]: {
                                        ...current,
                                        managerAgents: current.managerAgents.filter((item) => item.id !== row.id),
                                      },
                                    }
                                  })
                                  showAgentNotice(noticeText.subAgentDeleted, noticeText.subAgentDeletedSub)
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="manager-agent-action-row">
                          <button
                            className="manager-agent-action-btn is-primary"
                            type="button"
                            onClick={() => {
                              const newRow = {
                                id: `${selectedSingleAgent.name}-agent-${Date.now()}`,
                                agentName: '',
                                usage: '',
                                source: 'agent' as const,
                              }
                              updateSelectedSingleAgent((prev) => ({
                                ...prev,
                                managerAgents: [...prev.managerAgents, newRow],
                              }))
                              setManagerialAgentSettingsByKey((prev) => {
                                const current = prev[selectedSingleAgent.name]
                                if (!current) return prev
                                return {
                                  ...prev,
                                  [selectedSingleAgent.name]: {
                                    ...current,
                                    managerAgents: [...current.managerAgents, newRow],
                                  },
                                }
                              })
                            }}
                          >
                            <span aria-hidden="true">＋</span>
                            {locale === 'zh' ? '添加 Agent' : 'Add agent'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  ) : null}

                  {renderMultiSelectField(
                    'skills',
                    locale === 'zh' ? '技能' : 'Skills',
                    locale === 'zh'
                      ? '从列表中选择技能。保存后，启用的技能会按顺序追加在描述之后。'
                      : 'Choose skills from the list. After saving, enabled skills will be appended after the description.',
                    locale === 'zh' ? '选择技能' : 'Select skills',
                    skillOptions,
                    selectedSingleAgent.skills,
                  )}

                  {renderMultiSelectField(
                    'knowledge',
                    locale === 'zh' ? '知识库（文档库）' : 'Knowledge base',
                    locale === 'zh'
                      ? '绑定内部文档数据源，让该智能体可以结合更多上下文进行回答。'
                      : 'Connect internal document sources so this agent can answer with richer context.',
                    locale === 'zh' ? '选择知识库' : 'Select knowledge',
                    knowledgeOptions,
                    selectedSingleAgent.knowledge,
                  )}

                  {renderMultiSelectField(
                    'tools',
                    locale === 'zh' ? '工具' : 'Tools',
                    locale === 'zh'
                      ? '选择该单智能体在执行过程中可以调用的工具。'
                      : 'Select the tools this single agent can call while executing.',
                    locale === 'zh' ? '选择工具' : 'Select tools',
                    toolOptions,
                    selectedSingleAgent.tools,
                    'above',
                  )}
                </div>
              </div>

              {isSingleAdvancedConfigOpen && sharedRenderAdvancedConfigContent ? (
                <aside className="single-agent-middle managerial-advanced-column">
                  <section
                    className="single-agent-card managerial-advanced-inline-panel"
                    aria-label={locale === 'zh' ? '高级配置' : 'Advanced configuration'}
                  >
                    <div className="managerial-advanced-config-header">
                      <div>
                        <div className="managerial-advanced-config-title">
                          {locale === 'zh' ? '高级配置' : 'Advanced configuration'}
                        </div>
                      </div>
                    </div>
                    <div className="managerial-advanced-config-content managerial-advanced-config-content--stacked">
                      <div className="managerial-advanced-config-sections">
                        {sharedAdvancedConfigNavItems.map((item) => (
                          <section
                            key={item.id}
                            className={
                              managerialAdvancedConfigNav === item.id
                                ? 'managerial-advanced-config-section is-active'
                                : 'managerial-advanced-config-section'
                            }
                          >
                            <button
                              type="button"
                              className="managerial-advanced-config-section-head"
                              onClick={() =>
                                setManagerialAdvancedConfigNav((current) => (current === item.id ? null : item.id))
                              }
                            >
                              <div className="managerial-advanced-config-section-copy">
                                <div className="managerial-advanced-config-section-title">{item.label}</div>
                                <div className="managerial-advanced-config-section-hint">{item.hint}</div>
                              </div>
                              <span
                                className={
                                  managerialAdvancedConfigNav === item.id
                                    ? 'managerial-advanced-config-section-chevron is-open'
                                    : 'managerial-advanced-config-section-chevron'
                                }
                                aria-hidden="true"
                              >
                                <svg viewBox="0 0 16 16" focusable="false">
                                  <path
                                    d="M4 6.5 8 10l4-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </button>
                            {managerialAdvancedConfigNav === item.id ? (
                              <div className="managerial-advanced-config-section-body">
                                {sharedRenderAdvancedConfigContent(item.id)}
                              </div>
                            ) : null}
                          </section>
                        ))}
                      </div>
                    </div>
                  </section>
                </aside>
              ) : null}

              <aside className="single-agent-right">
                <div
                  className={
                    isSingleAdvancedConfigOpen
                      ? 'single-agent-preview-card single-agent-chat-preview-card managerial-agent-preview-card'
                      : 'single-agent-preview-card single-agent-chat-preview-card'
                  }
                >
                  <div className="single-agent-preview-card-head">
                    <span>{locale === 'zh' ? '预览' : 'Preview'}</span>
                    <button
                      className="single-agent-refresh"
                      type="button"
                      aria-label={locale === 'zh' ? '新建会话' : 'New chat'}
                      onClick={clearSinglePreview}
                    >
                      ↻
                    </button>
                  </div>
                  <div className="single-agent-preview-body managerial-agent-preview-body">
                    {singleAgentPreviewTab === 'preview' ? (
                      <div ref={singlePreviewThreadRef} className="managerial-agent-preview-thread">
                        {singlePreviewMessages.map((message) => (
                          <div
                            key={message.id}
                            className={
                              message.role === 'user'
                                ? 'managerial-agent-preview-turn is-user'
                                : 'managerial-agent-preview-turn'
                            }
                          >
                            {message.role === 'assistant' ? (
                              <div className="managerial-agent-preview-sender">{selectedSingleAgent.name}</div>
                            ) : null}
                            <div
                              className={
                                message.role === 'user'
                                  ? 'managerial-agent-preview-bubble is-user'
                                  : 'managerial-agent-preview-bubble'
                              }
                            >
                              <div>{message.text}</div>
                              {message.attachments && message.attachments.length > 0 ? (
                                <div className="managerial-agent-preview-files">
                                  {message.attachments.map((attachment) => (
                                    <span key={attachment.id} className="managerial-agent-preview-file-chip">
                                      {attachment.name}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                        {singlePreviewMessages.length === 0 ? (
                          <div className="single-agent-preview-placeholder">
                            {locale === 'zh' ? '已清空当前会话，你可以重新开始。' : 'The current chat has been cleared.'}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="single-agent-preview-placeholder">
                        {locale === 'zh'
                          ? 'AI 辅助优化后的提示词内容会显示在这里。'
                          : 'The AI-improved prompt content will appear here.'}
                      </div>
                    )}
                  </div>
                  <div className="single-agent-preview-input-row managerial-agent-preview-input-row">
                    <input
                      ref={singlePreviewFileInputRef}
                      className="sr-only"
                      type="file"
                      multiple
                      onChange={handleSinglePreviewFileChange}
                    />
                    <div className="managerial-agent-preview-composer">
                      {singlePreviewAttachments.length > 0 ? (
                        <div className="managerial-agent-preview-attachments">
                          {singlePreviewAttachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              className="managerial-agent-preview-attachment-chip"
                              onClick={() => removeSinglePreviewAttachment(attachment.id)}
                              title={locale === 'zh' ? `移除 ${attachment.name}` : `Remove ${attachment.name}`}
                            >
                              <span>{attachment.name}</span>
                              <span aria-hidden="true">×</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <button
                        className="managerial-agent-preview-attach-btn"
                        type="button"
                        aria-label={locale === 'zh' ? '上传文件' : 'Upload file'}
                        onClick={() => singlePreviewFileInputRef.current?.click()}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path
                            d="M8.5 12.5 14 7a3 3 0 1 1 4.24 4.24l-7.78 7.78a5 5 0 0 1-7.07-7.07l8.13-8.13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <textarea
                        className="single-agent-preview-input managerial-agent-preview-input"
                        placeholder={locale === 'zh' ? '输入消息...' : 'Write a message...'}
                        value={singlePreviewInput}
                        onChange={(event) => setSinglePreviewInput(event.target.value)}
                        rows={3}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' || event.shiftKey) return
                          event.preventDefault()
                          sendSinglePreviewMessage()
                        }}
                      />
                      <div className="managerial-agent-preview-actions">
                        <button
                          className={
                            singlePreviewVoiceListening
                              ? 'managerial-agent-preview-voice is-listening'
                              : 'managerial-agent-preview-voice'
                          }
                          type="button"
                          aria-label={locale === 'zh' ? '语音输入' : 'Voice input'}
                          aria-pressed={singlePreviewVoiceListening}
                          onClick={handleSinglePreviewVoiceClick}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M19 11a7 7 0 0 1-14 0M12 18v3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="single-agent-preview-send"
                          type="button"
                          aria-label={locale === 'zh' ? '发送' : 'Send'}
                          disabled={!canSendSinglePreview}
                          onClick={sendSinglePreviewMessage}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M12 6v12M12 6l-4.5 4.5M12 6l4.5 4.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {renderInstructionGeneratorModal(selectedSingleAgent.name, false, (generatedText) => {
          if (instructionGeneratorField === 'role') {
            updateSelectedSingleAgent((prev) => ({
              ...prev,
              agentRole: generatedText,
            }))
            return
          }
          updateSelectedSingleAgent((prev) => ({
            ...prev,
            agentInstructions: generatedText,
            instructions: generatedText,
            generatedPrompt: generatedText,
          }))
        })}
        {renderAgentDetailFieldModal()}
        {renderAgentPublishModal()}
        {renderAgentFreezeModal()}
        {renderAgentNoticeToast()}
      </section>
    )
  }


  renderManagerialAgentSettingsPage = () => {
    if (!selectedManagerialAgent) return null

    const managerAgentPickerOptions: DropdownOption[] = [
      ...(isOnboardingManagerAgent(selectedManagerialAgent.name)
        ? buildOnboardingManagerAgents(selectedManagerialAgent.name).map((row) => ({
            id: row.agentName,
            title: row.agentName,
            description: row.usage,
          }))
        : []),
      ...agentsWithDerived
      .filter((agent) => agent.name !== selectedManagerialAgent.name)
      .map((agent) => ({
        id: agent.name,
        title: agent.name,
        description: agent.desc.replace(/…/g, '').trim(),
      })),
    ]
      .filter((option, index, options) => options.findIndex((item) => item.id === option.id) === index)

    const renderManagerialMultiSelectField = (
      dropdownKey: 'skills' | 'knowledge' | 'tools' | 'managerMemberAgents' | 'managerEscalationTriggers',
      label: string,
      helper: string,
      placeholder: string,
      options: DropdownOption[],
      selectedIds: string[],
      updater: (id: string) => void,
      dropdownPlacement: 'above' | 'below' = 'below',
    ) => (
      <div className="single-agent-field">
        <div className="single-agent-label-with-info">
          <label className="single-agent-label">{label}</label>
          <span className="single-agent-label-info-wrap">
            <button
              type="button"
              className="single-agent-label-info"
              aria-label={locale === 'zh' ? `${label}说明` : `${label} help`}
              aria-describedby={`managerial-agent-${dropdownKey}-hint`}
            >
              <span aria-hidden="true">i</span>
            </button>
            <span
              id={`managerial-agent-${dropdownKey}-hint`}
              role="tooltip"
              className="single-agent-label-info-popover"
            >
              {helper}
            </span>
          </span>
        </div>
        <div className="single-agent-select-wrap">
          <div
            className={[
              'single-agent-select',
              selectedIds.length > 0 ? 'has-selected-tags' : '',
              openSettingsDropdown === dropdownKey ? 'is-open' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="combobox"
            aria-expanded={openSettingsDropdown === dropdownKey}
            aria-label={label}
            tabIndex={0}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('.single-agent-select-tag-remove')) return
              setOpenSettingsDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              setOpenSettingsDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }}
          >
            {renderMultiSelectTriggerValue(options, selectedIds, placeholder, updater)}
            <span className="single-agent-select-caret" aria-hidden="true">
              ▾
            </span>
          </div>
          {openSettingsDropdown === dropdownKey ? (
            <div
              className={
                dropdownPlacement === 'above'
                  ? 'single-agent-dropdown single-agent-dropdown--above'
                  : 'single-agent-dropdown'
              }
              role="listbox"
              aria-label={label}
            >
              {options.map((option) => {
                const selected = selectedIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    className={selected ? 'single-agent-dropdown-item is-selected' : 'single-agent-dropdown-item'}
                    type="button"
                    onClick={() => updater(option.id)}
                  >
                    <div className="single-agent-dropdown-title-row">
                      <div className="single-agent-dropdown-title">{option.title}</div>
                      {selected ? (
                        <span className="single-agent-dropdown-check" aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    {option.description ? (
                      <div className="single-agent-dropdown-desc">{option.description}</div>
                    ) : null}
                    {option.meta ? <div className="single-agent-dropdown-meta">{option.meta}</div> : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    )

    const clearManagerialPreview = () => {
      setManagerialPreviewMessages([])
      setManagerialPreviewInput('')
      setManagerialPreviewAttachments([])
      setManagerialPreviewVoiceListening(false)
      managerialPreviewRecognitionRef.current?.abort()
      managerialPreviewRecognitionRef.current = null
      if (managerialPreviewFileInputRef.current) managerialPreviewFileInputRef.current.value = ''
    }

    const handleManagerialPreviewFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length === 0) return
      setManagerialPreviewAttachments((current) => [
        ...current,
        ...files.map((file) => ({
          id: `attachment-${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
        })),
      ])
      event.target.value = ''
    }

    const removeManagerialPreviewAttachment = (attachmentId: string) => {
      setManagerialPreviewAttachments((current) => current.filter((item) => item.id !== attachmentId))
    }

    const canSendManagerialPreview = managerialPreviewInput.trim().length > 0 || managerialPreviewAttachments.length > 0

    const sendManagerialPreviewMessage = () => {
      const nextText = managerialPreviewInput.trim()
      if (!nextText && managerialPreviewAttachments.length === 0) return

      const attachments = managerialPreviewAttachments
      const userMessage: ManagerialPreviewMessage = {
        id: `manager-preview-user-${Date.now()}`,
        role: 'user',
        text: nextText || (locale === 'zh' ? '已上传附件。' : 'Uploaded attachments.'),
        attachments,
      }
      const assistantMessage: ManagerialPreviewMessage = {
        id: `manager-preview-assistant-${Date.now() + 1}`,
        role: 'assistant',
        text: buildManagerialPreviewReply(nextText || userMessage.text, selectedManagerialAgent, locale, attachments),
      }

      setManagerialPreviewMessages((current) => [...current, userMessage, assistantMessage])
      setManagerialPreviewInput('')
      setManagerialPreviewAttachments([])
    }

    const handleManagerialPreviewVoiceClick = () => {
      if (managerialPreviewVoiceListening) {
        managerialPreviewRecognitionRef.current?.stop()
        return
      }
      const recognition = createPreviewSpeechRecognition()
      if (!recognition) return

      recognition.lang = locale === 'zh' ? 'zh-CN' : 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onstart = () => setManagerialPreviewVoiceListening(true)
      recognition.onend = () => {
        setManagerialPreviewVoiceListening(false)
        managerialPreviewRecognitionRef.current = null
      }
      recognition.onerror = () => {
        setManagerialPreviewVoiceListening(false)
        managerialPreviewRecognitionRef.current = null
      }
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join('')
          .trim()
        if (!transcript) return
        setManagerialPreviewInput((current) => `${current}${current ? ' ' : ''}${transcript}`.trim())
      }
      managerialPreviewRecognitionRef.current = recognition
      recognition.start()
    }

    const managerialAdvancedConfig = selectedManagerialAgent.advancedConfig
    const advancedText =
      locale === 'zh'
        ? {
            navReasoning: '推理与执行',
            navReasoningHint: '推理边界',
            navModel: '模型参数',
            navModelHint: '采样与上限',
            navCapabilities: '数据与输出',
            navCapabilitiesHint: '数据 / 返回',
            navMemory: '记忆与上下文',
            navMemoryHint: '长期上下文',
            navScheduling: '调度与触发',
            navSchedulingHint: '主动 / 被动',
            navOutput: '输出格式',
            navOutputHint: '结构化返回',
            responseText: '文本',
            responseMarkdown: 'Markdown',
            responseJson: 'JSON',
            responseStructured: '结构化',
            overviewMode: '执行模式',
            overviewModeDelegated: '委派执行',
            overviewModeManaged: '管理主导',
            overviewReasoning: '推理',
            overviewDirect: '直接执行',
            overviewOutput: '输出模式',
            overviewFields: '个字段',
            overviewFlexible: '灵活输出',
            overviewBudget: '执行预算',
            overviewIterations: '轮',
            overviewGovernance: '治理强度',
            overviewGuarded: '已保护',
            overviewBasic: '基础',
            overviewVersioned: '已版本化',
            overviewNoHistory: '无历史',
            titleReasoning: '推理',
            descReasoning: '控制管理型 Agent 是否先进行多步推理，再决定任务是否需要拆分。',
            titleThinking: '思考（Thinking）',
            descThinking: '选择是否需要 Thinking 能力模型。',
            labelAllowDelegation: '管理型智能体',
            descAllowDelegation: '允许管理型 Agent 在判断需要时，把任务分发给成员 Agent 协同执行。',
            delegationPanelTitle: 'Delegation Setup',
            delegationStrategyLabel: '分发策略',
            approvalModeLabel: '审批模式',
            labelMaxReasoningAttempts: '最大推理轮次',
            labelMaxIterations: '最大迭代次数',
            titleExecutionLimits: '执行边界',
            descExecutionLimits: '限制执行频率和最长执行窗口，避免长任务失控。',
            labelMaxRpm: '最大 RPM',
            labelMaxExecutionTime: '最大执行时长（秒）',
            titleCurrentModel: '模型配置',
            noModelSelected: '未选择模型配置',
            titleUseProviderDefaults: '使用模型默认参数',
            descUseProviderDefaults: '开启后使用模型提供方默认采样参数，并弱化手动控制。',
            labelTemperature: '温度',
            labelMaxTokens: '最大 Tokens',
            titleDataQuery: '数据查询',
            descDataQuery: '允许管理型 Agent 主动查询数据与运行记录，再决定是否继续分发。',
            titleOutputCapabilities: '结果产出',
            labelFileAsOutput: '文件输出',
            labelImageAsOutput: '图片输出',
            titleMemory: '记忆',
            descMemory: '开启后允许当前 Agent 记录和调用记忆信息，用于在多轮任务中保留关键上下文。',
            memoryTypeLabel: '记忆',
            memoryTypeHint: '用于保留当前会话或近期任务中的关键信息，帮助 Agent 在后续执行中延续上下文。',
            memoryTypeShortTerm: '记忆',
            memoryTypeLongTerm: '长期记忆',
            shortTermMemoryMetadataTitle: '记忆元数据',
            addMemoryMetadata: '添加记忆',
            memoryMetadataModalTitle: '创建新的记忆元数据',
            memoryMetadataNameLabel: '记忆名称',
            memoryMetadataNamePlaceholder: '请输入名称...',
            memoryMetadataAgentDecide: '由智能体决定',
            memoryMetadataRuleBased: '规则定义',
            memoryMetadataAgentDecideDesc: '用自然语言描述何时更新该记忆元数据，由 Agent 根据你的提示决定更新方式。',
            memoryMetadataRuleBasedDesc: '通过工具和触发器定义明确条件，提升记忆提取的准确性。',
            memoryMetadataInstructionLabel: '告诉 Agent 如何以及何时提取这条记忆',
            memoryMetadataInstructionPlaceholder: "例如：收到邮件回复后，将 '客户已回复' 标记为 True",
            memoryMetadataUpdateLabel: '何时更新记忆',
            memoryMetadataTargetPlaceholder: '选择选项...',
            memoryMetadataNoToolsPlaceholder: '请先在工具字段中添加工具',
            memoryMetadataDataFormatLabel: '数据格式',
            memoryMetadataOptionsLabel: '选项',
            memoryMetadataOptionPlaceholder: '选项',
            memoryMetadataAddOption: '添加选项',
            memoryMetadataRemoveOption: '删除选项',
            memoryMetadataFormatText: '文本',
            memoryMetadataFormatNumber: '数字',
            memoryMetadataFormatBoolean: '是/否',
            memoryMetadataFormatSingleOption: '单选枚举',
            memoryMetadataFormatMultipleOption: '多选枚举',
            memoryMetadataEmpty: '还没有短期记忆元数据，点击“添加记忆”开始创建。',
            memoryMetadataSummaryRuleTool: '工具运行后',
            memoryMetadataSummaryRuleTrigger: '收到触发器后',
            memoryLongTermToggleLabel: '长期记忆开关',
            memoryLongTermToggleDesc: '开启后允许 Agent 将重要信息保存为长期记忆。',
            memoryLevelLabel: '记忆等级',
            memoryWriteRulesLabel: '记忆写入规则',
            memoryWriteRulesDesc: '用于定义哪些内容允许被写入记忆，例如用户偏好、业务规则、项目背景；敏感信息、临时数据和无关闲聊不应写入。',
            memoryReadRulesLabel: '记忆读取规则',
            memoryReadRulesDesc: '用于定义 Agent 在回答前如何调用记忆，例如优先读取与当前任务相关的历史偏好、项目规则或用户约束。',
            memoryDeleteToolLabel: '禁用删除记忆工具',
            memoryDeleteToolDesc: '开启后，Agent 不允许主动删除已保存的记忆，仅管理员可手动删除。',
            titleContext: '上下文',
            descContext: '定义该管理型 Agent 在推理前优先加载的上下文范围。',
            titleScheduler: '定时调度',
            descScheduler: '让管理型 Agent 定时检查任务、主动发起运行或巡检状态。',
            labelScheduler: '调度表达式',
            schedulerConfigTitle: '定时调度配置',
            schedulerConfigSubtitle: '为当前 Agent 配置定时任务名称与执行计划。',
            schedulerExecutions: '执行记录',
            schedulerEmpty: '暂无调度任务',
            schedulerCreateTitle: '创建新调度',
            schedulerMinutes: '分钟',
            schedulerHours: '小时',
            schedulerDays: '天',
            schedulerMonths: '月',
            schedulerCron: 'Cron',
            schedulerIntervalMinutes: '间隔（分钟）',
            schedulerIntervalHours: '间隔（小时）',
            schedulerIntervalMonths: '间隔（月）',
            schedulerAtMinute: '在第几分钟',
            schedulerSelectWeekdays: '选择星期',
            schedulerOnDayOfMonth: '每月第几天',
            schedulerAtTime: '执行时间',
            schedulerCronExpression: 'Cron 表达式',
            schedulerMaxRetries: '最大重试次数',
            schedulerRetryDelay: '重试延迟（分钟）',
            schedulerInputLabel: '调度输入',
            schedulerCreateButton: '创建',
            schedulerSummaryLabel: '当前调度',
            schedulerMinutesPlaceholder: '例如：30、60',
            schedulerHoursPlaceholder: '例如：1、24',
            schedulerMonthsPlaceholder: '例如：1、12',
            schedulerCronPlaceholder: '例如：0 0 * * *',
            titleWebhookTrigger: 'Webhook 触发',
            descWebhookTrigger: '接收外部系统事件后触发管理型 Agent 进入执行流程。',
            labelWebhookPath: 'Webhook 路径',
            titleResponseFormat: '响应格式',
            titleStructuredOutput: 'Schema / 结构化输出',
            descStructuredOutput: '约束管理型 Agent 以固定字段返回结果。',
            placeholderProperty: '字段名',
            placeholderDescription: '字段描述',
            required: '必填',
            remove: '删除',
            addProperty: '新增字段',
            titleExamples: '示例文本',
            typeString: '字符串',
            typeNumber: '数字',
            typeBoolean: '布尔',
            typeArray: '数组',
            typeObject: '对象',
            dataQueryConfigTitle: '配置数据检索',
            dataQueryConfigSubtitle: '通过查询和读取数据源内容，让管理型 Agent 即时回答问题。',
            dataQueryModelLabel: '模型',
            dataQueryModelPlaceholder: '选择模型配置',
            dataQueryMaxAttemptsLabel: '最大尝试次数',
            dataQueryTimeLimitLabel: '生成时间限制（秒）',
            dataQueryAutoTrainLabel: '自动训练模型',
            dataQueryKnowledgeBaseLabel: '自动训练知识库',
            dataQueryKnowledgeBasePlaceholder: '选择知识库',
            cancel: '取消',
            save: '保存',
            configureDataQuery: '配置数据检索',
            dataQuerySummaryPrefix: '当前已连接',
            dataQuerySummaryFallback: '尚未选择知识库',
            imageOutputConfigTitle: '图片输出配置',
            imageOutputConfigSubtitle: '为当前 Agent 选择一个图片生成 provider 和模型，作为图片输出的默认能力。',
            imageOutputProviderLabel: '选择图片 Provider',
            imageOutputProviderPlaceholder: '选择图片 provider 与模型',
            configureImageOutput: '配置图片输出',
            imageOutputSummaryFallback: '尚未选择图片模型',
            memoryConfigTitle: '配置记忆',
            memoryConfigSubtitle: '为当前 Agent 选择记忆 provider，并设置短期记忆可存储的消息数量。',
            memoryProviderLabel: 'Memory Provider',
            memoryProviderPlaceholder: '选择记忆 provider',
            memoryShortTermLabel: '记忆最多存储消息数',
            memoryMessagesUnit: 'messages',
            configureMemory: '配置记忆',
            close: '关闭',
          }
        : {
            navReasoning: 'Reasoning',
            navReasoningHint: 'Execution',
            navModel: 'Parameters',
            navModelHint: 'Sampling',
            navCapabilities: 'Data & Output',
            navCapabilitiesHint: 'Data / Return',
            navMemory: 'Memory',
            navMemoryHint: 'Context',
            navScheduling: 'Scheduling',
            navSchedulingHint: 'Triggers',
            navOutput: 'Output',
            navOutputHint: 'Format',
            responseText: 'Text',
            responseMarkdown: 'Markdown',
            responseJson: 'JSON',
            responseStructured: 'Structured',
            overviewMode: 'Execution mode',
            overviewModeDelegated: 'Delegated',
            overviewModeManaged: 'Manager-led',
            overviewReasoning: 'Reasoning',
            overviewDirect: 'Direct',
            overviewOutput: 'Output mode',
            overviewFields: 'fields',
            overviewFlexible: 'Flexible',
            overviewBudget: 'Run budget',
            overviewIterations: 'iters',
            overviewGovernance: 'Governance',
            overviewGuarded: 'Guarded',
            overviewBasic: 'Basic',
            overviewVersioned: 'Versioned',
            overviewNoHistory: 'No history',
            titleReasoning: 'Reasoning',
            descReasoning: 'Control whether the manager agent reasons in multiple steps before acting.',
            titleThinking: 'Thinking',
            descThinking: 'Choose whether this agent should use a model with Thinking capability.',
            labelAllowDelegation: 'Manager Agent',
            descAllowDelegation: 'Allow the manager agent to delegate work to member agents when needed.',
            delegationPanelTitle: 'Delegation Setup',
            delegationStrategyLabel: 'Delegation strategy',
            approvalModeLabel: 'Approval mode',
            labelMaxReasoningAttempts: 'Max Reasoning Attempts',
            labelMaxIterations: 'Max Iterations',
            titleExecutionLimits: 'Execution Limits',
            descExecutionLimits: 'Constrain throughput and total execution window to keep runs predictable.',
            labelMaxRpm: 'Max RPM',
            labelMaxExecutionTime: 'Max Execution Time (sec)',
            titleCurrentModel: 'Current model template',
            noModelSelected: 'No model config selected',
            titleUseProviderDefaults: 'Use Provider Defaults',
            descUseProviderDefaults: 'Use provider-level defaults and reduce manual tuning.',
            labelTemperature: 'Temperature',
            labelMaxTokens: 'Max Tokens',
            titleDataQuery: 'Data Query',
            descDataQuery: 'Allow the manager to query data and runtime context before delegating.',
            titleOutputCapabilities: 'Output Capabilities',
            labelFileAsOutput: 'File as Output',
            labelImageAsOutput: 'Image as Output',
            titleMemory: 'Memory',
            descMemory: 'Enable the agent to store and recall memory so key context can be retained across multi-step work.',
            memoryTypeLabel: 'Memory',
            memoryTypeHint: 'Keep key information from the current conversation or recent tasks so the agent can continue with useful context.',
            memoryTypeShortTerm: 'Memory',
            memoryTypeLongTerm: 'Long-term Memory',
            shortTermMemoryMetadataTitle: 'Memory Metadata',
            addMemoryMetadata: 'Add memory',
            memoryMetadataModalTitle: 'Create a new memory metadata',
            memoryMetadataNameLabel: 'Name of memory',
            memoryMetadataNamePlaceholder: 'Type name...',
            memoryMetadataAgentDecide: 'Let agent decide',
            memoryMetadataRuleBased: 'Rule based',
            memoryMetadataAgentDecideDesc: 'Describe when to update this memory metadata using natural language, and the agent will update it based on your prompt.',
            memoryMetadataRuleBasedDesc: 'Improve memory accuracy by defining specific conditions based on tools and triggers.',
            memoryMetadataInstructionLabel: 'Tell agent how & when to extract this memory',
            memoryMetadataInstructionPlaceholder: "e.g. After receiving an email reply, mark 'Prospect replied' as True",
            memoryMetadataUpdateLabel: 'When to update memory',
            memoryMetadataTargetPlaceholder: 'Select option...',
            memoryMetadataNoToolsPlaceholder: 'Add tools in the Tools field first',
            memoryMetadataDataFormatLabel: 'Data format',
            memoryMetadataOptionsLabel: 'Options',
            memoryMetadataOptionPlaceholder: 'Option',
            memoryMetadataAddOption: 'Add option',
            memoryMetadataRemoveOption: 'Remove option',
            memoryMetadataFormatText: 'Text',
            memoryMetadataFormatNumber: 'Number',
            memoryMetadataFormatBoolean: 'True/False',
            memoryMetadataFormatSingleOption: 'Single-select Enum',
            memoryMetadataFormatMultipleOption: 'Multi-select Enum',
            memoryMetadataEmpty: 'No short-term memory metadata yet. Click “Add memory” to create one.',
            memoryMetadataSummaryRuleTool: 'After tool run',
            memoryMetadataSummaryRuleTrigger: 'After trigger received',
            memoryLongTermToggleLabel: 'Long-term Memory',
            memoryLongTermToggleDesc: 'Allow the agent to save important information as long-term memory.',
            memoryLevelLabel: 'Memory Level',
            memoryWriteRulesLabel: 'Memory Write Rules',
            memoryWriteRulesDesc: 'Define what is allowed to be written into memory, such as preferences, business rules, and project background.',
            memoryReadRulesLabel: 'Memory Read Rules',
            memoryReadRulesDesc: 'Define how the agent should retrieve memory before answering, such as checking relevant preferences and constraints first.',
            memoryDeleteToolLabel: 'Disable Memory Delete Tool',
            memoryDeleteToolDesc: 'When enabled, the agent cannot proactively delete saved memory. Only admins can remove it manually.',
            titleContext: 'Context',
            descContext: 'Define which context should be loaded before the manager starts reasoning.',
            titleScheduler: 'Scheduler',
            descScheduler: 'Schedule proactive runs for recurring checks and orchestration tasks.',
            labelScheduler: 'Scheduler',
            schedulerConfigTitle: 'Scheduler Configuration',
            schedulerConfigSubtitle: 'Configure the scheduler name for your agent.',
            schedulerExecutions: 'Executions',
            schedulerEmpty: 'No schedules found',
            schedulerCreateTitle: 'Create a New Schedule',
            schedulerMinutes: 'Minutes',
            schedulerHours: 'Hours',
            schedulerDays: 'Days',
            schedulerMonths: 'Months',
            schedulerCron: 'Cron',
            schedulerIntervalMinutes: 'Interval (minutes)',
            schedulerIntervalHours: 'Interval (hours)',
            schedulerIntervalMonths: 'Interval (months)',
            schedulerAtMinute: 'At Minute',
            schedulerSelectWeekdays: 'Select Days of Week',
            schedulerOnDayOfMonth: 'On Day of Month',
            schedulerAtTime: 'At Time',
            schedulerCronExpression: 'Cron Expression',
            schedulerMaxRetries: 'Max Retries',
            schedulerRetryDelay: 'Retry Delay (minutes)',
            schedulerInputLabel: 'Scheduler Input',
            schedulerCreateButton: 'Create',
            schedulerSummaryLabel: 'Current schedule',
            schedulerMinutesPlaceholder: 'e.g., 30, 60',
            schedulerHoursPlaceholder: 'e.g., 1, 24',
            schedulerMonthsPlaceholder: 'e.g., 1, 12',
            schedulerCronPlaceholder: 'e.g., 0 0 * * *',
            titleWebhookTrigger: 'Webhook Trigger',
            descWebhookTrigger: 'Trigger the manager agent when external systems call into a webhook.',
            labelWebhookPath: 'Webhook Path',
            titleResponseFormat: 'Response Format',
            titleStructuredOutput: 'Schema / Structured Output',
            descStructuredOutput: 'Constrain responses to a predictable structured schema.',
            placeholderProperty: 'Property',
            placeholderDescription: 'Description',
            required: 'Required',
            remove: 'Remove',
            addProperty: 'Add Property',
            titleExamples: 'Examples (Text)',
            typeString: 'String',
            typeNumber: 'Number',
            typeBoolean: 'Boolean',
            typeArray: 'Array',
            typeObject: 'Object',
            dataQueryConfigTitle: 'Configure Data Query',
            dataQueryConfigSubtitle: 'Answer questions instantly by querying and reading data from your data source.',
            dataQueryModelLabel: 'Model',
            dataQueryModelPlaceholder: 'Select model config',
            dataQueryMaxAttemptsLabel: 'Maximum number of tries',
            dataQueryTimeLimitLabel: 'Generation time limit (seconds)',
            dataQueryAutoTrainLabel: 'Automatically train the model',
            dataQueryKnowledgeBaseLabel: 'Auto training Knowledge Base',
            dataQueryKnowledgeBasePlaceholder: 'Select knowledge base',
            cancel: 'Cancel',
            save: 'Save',
            configureDataQuery: 'Configure data query',
            dataQuerySummaryPrefix: 'Currently linked to',
            dataQuerySummaryFallback: 'No knowledge base selected',
            imageOutputConfigTitle: 'Image as Output Configuration',
            imageOutputConfigSubtitle: 'Select a default image provider and model to use when your agent returns image output.',
            imageOutputProviderLabel: 'Select Image Provider',
            imageOutputProviderPlaceholder: 'Select image provider & model',
            configureImageOutput: 'Configure image output',
            imageOutputSummaryFallback: 'No image model selected',
            memoryConfigTitle: 'Configure Memory',
            memoryConfigSubtitle: 'Select a memory provider and define how many messages the agent keeps in short-term memory.',
            memoryProviderLabel: 'Memory Provider',
            memoryProviderPlaceholder: 'Select memory provider',
            memoryShortTermLabel: 'Max. messages stored as Memory',
            memoryMessagesUnit: 'messages',
            configureMemory: 'Configure memory',
            close: 'Close',
          }
    const managerialAdvancedConfigNavItems: Array<{ id: ManagerialAdvancedConfigNav; label: string; hint: string }> = [
      { id: 'reasoning', label: advancedText.navReasoning, hint: advancedText.navReasoningHint },
      { id: 'model', label: advancedText.navModel, hint: advancedText.navModelHint },
      { id: 'capabilities', label: advancedText.navCapabilities, hint: advancedText.navCapabilitiesHint },
      { id: 'memory', label: advancedText.navMemory, hint: advancedText.navMemoryHint },
    ]
    const effectiveResponseFormat: 'text' | 'structured' | 'image' = managerialAdvancedConfig.imageAsOutputEnabled
      ? 'image'
      : managerialAdvancedConfig.responseFormat === 'structured'
        ? 'structured'
        : 'text'
    const responseFormatOptions: Array<{ value: 'text' | 'structured' | 'image'; label: string }> = [
      { value: 'text', label: advancedText.responseText },
      { value: 'structured', label: advancedText.responseStructured },
      { value: 'image', label: advancedText.labelImageAsOutput },
    ]
    const structuredOutputTypeLabels: Record<StructuredOutputPropertyType, string> = {
      string: advancedText.typeString,
      number: advancedText.typeNumber,
      boolean: advancedText.typeBoolean,
      array: advancedText.typeArray,
      object: advancedText.typeObject,
    }
    const dataQueryKnowledgeBaseOptions = KNOWLEDGE_BASE_CATALOG.map((item) => ({
      id: item.id,
      title: locale === 'zh' ? item.nameZh : item.nameEn,
      description: locale === 'zh' ? item.descriptionZh : item.descriptionEn,
    }))
    const imageOutputActiveProvider =
      IMAGE_OUTPUT_PROVIDER_OPTIONS.find((item) => item.id === activeImageOutputProviderId) ?? IMAGE_OUTPUT_PROVIDER_OPTIONS[0]
    const imageOutputExpandedProvider =
      IMAGE_OUTPUT_PROVIDER_OPTIONS.find((item) => item.id === expandedImageOutputProviderId) ?? null
    const selectedMemoryProvider =
      MEMORY_PROVIDER_OPTIONS.find((item) => item.id === managerialAdvancedConfig.memoryProvider) ?? null
    const selectedMemoryLevelLabel =
      MEMORY_LEVEL_OPTIONS.find((item) => item.value === managerialAdvancedConfig.memoryLevel)?.[
        locale === 'zh' ? 'labelZh' : 'labelEn'
      ] ?? managerialAdvancedConfig.memoryLevel
    const shortTermMemoryMetadataTargetOptions =
      shortTermMemoryMetadataDraft?.updateTiming === 'after-trigger-received'
        ? MEMORY_METADATA_TRIGGER_OPTIONS.map((item) => ({
            id: item.id,
            title: locale === 'zh' ? item.labelZh : item.labelEn,
          }))
        : activeShortTermMemoryToolOptions.map((item) => ({
            id: item.id,
            title: item.title,
          }))
    const isShortTermMemoryMetadataSaveDisabled =
      !shortTermMemoryMetadataDraft ||
      (
        shortTermMemoryMetadataDraft.mode === 'agent-decide' &&
        (!shortTermMemoryMetadataDraft.name.trim() || !shortTermMemoryMetadataDraft.instruction.trim())
      )
    const schedulerModeLabels: Record<SchedulerMode, string> = {
      minutes: advancedText.schedulerMinutes,
      hours: advancedText.schedulerHours,
      days: advancedText.schedulerDays,
      months: advancedText.schedulerMonths,
      cron: advancedText.schedulerCron,
    }
    const selectedSchedulerWeekdayLabel =
      SCHEDULER_WEEKDAY_OPTIONS.find((item) => item.value === managerialAdvancedConfig.schedulerWeekday)?.[
        locale === 'zh' ? 'labelZh' : 'labelEn'
      ] ?? managerialAdvancedConfig.schedulerWeekday
    const selectedSchedulerDraftWeekdayLabel =
      SCHEDULER_WEEKDAY_OPTIONS.find((item) => item.value === schedulerConfigDraft?.weekday)?.[
        locale === 'zh' ? 'labelZh' : 'labelEn'
      ] ?? ''
    const selectedSchedulerDraftTimeLabel =
      SCHEDULER_TIME_PRESET_OPTIONS.find((item) => item.value === schedulerConfigDraft?.timeLabel)?.[
        locale === 'zh' ? 'labelZh' : 'labelEn'
      ] ?? ''
    const selectedImageOutputProvider =
      IMAGE_OUTPUT_PROVIDER_OPTIONS.find((item) => item.id === managerialAdvancedConfig.imageOutputProvider) ?? null
    const selectedImageOutputDraftProvider =
      imageOutputConfigDraft
        ? IMAGE_OUTPUT_PROVIDER_OPTIONS.find((item) => item.id === imageOutputConfigDraft.providerId) ?? IMAGE_OUTPUT_PROVIDER_OPTIONS[0]
        : IMAGE_OUTPUT_PROVIDER_OPTIONS[0]
    const hasPendingImageOutputChanges =
      !!imageOutputConfigDraft &&
      !!imageOutputConfigDraft.model &&
      (
        !managerialAdvancedConfig.imageAsOutputEnabled ||
        imageOutputConfigDraft.providerId !== managerialAdvancedConfig.imageOutputProvider ||
        imageOutputConfigDraft.model !== managerialAdvancedConfig.imageOutputModel
      )
    const linkedDataQueryKnowledgeBase =
      dataQueryKnowledgeBaseOptions.find((item) => item.id === managerialAdvancedConfig.dataQueryKnowledgeBaseId) ?? null
    const selectedDataQueryDraftKnowledgeBase =
      dataQueryConfigDraft
        ? dataQueryKnowledgeBaseOptions.find((item) => item.id === dataQueryConfigDraft.knowledgeBaseId) ?? null
        : null
    const selectedDataQueryDraftModelOption =
      dataQueryConfigDraft ? modelConfigOptions.find((option) => option.title === dataQueryConfigDraft.modelConfig) ?? null : null
    const isDataQuerySaveDisabled =
      !dataQueryConfigDraft ||
      !dataQueryConfigDraft.modelConfig ||
      (dataQueryConfigDraft.autoTrainModel && !dataQueryConfigDraft.knowledgeBaseId)
    const openManagerialAdvancedConfig = (nav: ManagerialAdvancedConfigNav = 'reasoning') => {
      setIsManagerSettingsMenuOpen(false)
      setManagerialAdvancedConfigNav(nav)
      setIsManagerialAdvancedConfigOpen(true)
    }
    const toggleManagerialAdvancedConfig = (nav: ManagerialAdvancedConfigNav = 'reasoning') => {
      setIsManagerSettingsMenuOpen(false)
      if (isManagerialAdvancedConfigOpen) {
        setIsManagerialAdvancedConfigOpen(false)
        return
      }
      setManagerialAdvancedConfigNav(nav)
      setIsManagerialAdvancedConfigOpen(true)
    }
    const renderAdvancedConfigContent = (nav: ManagerialAdvancedConfigNav = managerialAdvancedConfigNav ?? 'reasoning') => {
      switch (nav) {
        case 'reasoning':
          return (
            <>
              <section className="managerial-advanced-card managerial-advanced-card--flat">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleReasoning}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descReasoning}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.reasoningEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.reasoningEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        reasoningEnabled: !prev.reasoningEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                <div className="managerial-advanced-toggle-line managerial-advanced-toggle-line--nested">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleThinking}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descThinking}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.thinkingEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.thinkingEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        thinkingEnabled: !prev.thinkingEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.reasoningEnabled ? (
                  <div className="managerial-advanced-grid managerial-advanced-grid--compact">
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.labelMaxReasoningAttempts}</label>
                      <input
                        className="single-agent-input"
                        type="number"
                        min={1}
                        value={managerialAdvancedConfig.maxReasoningAttempts}
                        onChange={(event) =>
                          updateSelectedManagerialAdvancedConfig((prev) => ({
                            ...prev,
                            maxReasoningAttempts: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                      />
                    </div>
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.labelMaxIterations}</label>
                      <input
                        className="single-agent-input"
                        type="number"
                        min={1}
                        value={managerialAdvancedConfig.maxIterations}
                        onChange={(event) =>
                          updateSelectedManagerialAdvancedConfig((prev) => ({
                            ...prev,
                            maxIterations: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="managerial-advanced-card">
                <div className="managerial-advanced-card-title">{advancedText.titleExecutionLimits}</div>
                <div className="managerial-advanced-card-desc">{advancedText.descExecutionLimits}</div>
                <div className="managerial-advanced-grid managerial-advanced-grid--compact">
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.labelMaxRpm}</label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={1}
                      value={managerialAdvancedConfig.maxRpm}
                      onChange={(event) =>
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          maxRpm: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                    />
                  </div>
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.labelMaxExecutionTime}</label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={60}
                      step={60}
                      value={managerialAdvancedConfig.maxExecutionTime}
                      onChange={(event) =>
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          maxExecutionTime: Math.max(60, Number(event.target.value) || 60),
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            </>
          )
        case 'model':
          return (
            <>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleUseProviderDefaults}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descUseProviderDefaults}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.useProviderDefaults ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.useProviderDefaults}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        useProviderDefaults: !prev.useProviderDefaults,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                <div className="managerial-advanced-grid managerial-advanced-grid--compact">
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.labelTemperature}</label>
                    <div className="managerial-temperature-input-wrap">
                      <input
                        className="single-agent-input managerial-temperature-input"
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        inputMode="decimal"
                        value={managerialAdvancedConfig.temperature}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value)

                          updateSelectedManagerialAdvancedConfig((prev) => ({
                            ...prev,
                            useProviderDefaults: false,
                            temperature: Number.isFinite(nextValue) ? clampTemperatureValue(nextValue) : 0,
                          }))
                        }}
                      />
                      <div className="managerial-temperature-stepper">
                        <button
                          className="managerial-temperature-stepper-btn"
                          type="button"
                          aria-label={locale === 'zh' ? '增加温度' : 'Increase temperature'}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => stepManagerialTemperature(0.1)}
                        >
                          <span className="managerial-temperature-stepper-icon managerial-temperature-stepper-icon--up" />
                        </button>
                        <button
                          className="managerial-temperature-stepper-btn"
                          type="button"
                          aria-label={locale === 'zh' ? '减少温度' : 'Decrease temperature'}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => stepManagerialTemperature(-0.1)}
                        >
                          <span className="managerial-temperature-stepper-icon managerial-temperature-stepper-icon--down" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.labelMaxTokens}</label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={256}
                      step={256}
                      disabled={managerialAdvancedConfig.useProviderDefaults}
                      value={managerialAdvancedConfig.maxTokens}
                      onChange={(event) =>
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          maxTokens: Math.max(256, Number(event.target.value) || 256),
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            </>
          )
        case 'capabilities':
        case 'output':
          return (
            <>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleDataQuery}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descDataQuery}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.dataQueryEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.dataQueryEnabled}
                    onClick={() => {
                      if (managerialAdvancedConfig.dataQueryEnabled) {
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          dataQueryEnabled: false,
                          dataQueryAutoTrainModel: false,
                          dataQueryKnowledgeBaseId: '',
                        }))
                        return
                      }
                      openDataQueryConfigPanel()
                    }}
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.dataQueryEnabled ? (
                  <div className="managerial-advanced-inline-note managerial-data-query-summary">
                    <div>
                      <strong>{managerialAdvancedConfig.dataQueryModelConfig || advancedText.dataQueryModelPlaceholder}</strong>
                      <span>
                        {` · ${managerialAdvancedConfig.dataQueryMaxAttempts} · ${managerialAdvancedConfig.dataQueryTimeLimitSeconds}s`}
                      </span>
                    </div>
                    <div>
                      {managerialAdvancedConfig.dataQueryAutoTrainModel
                        ? `${advancedText.dataQuerySummaryPrefix} ${linkedDataQueryKnowledgeBase?.title ?? advancedText.dataQuerySummaryFallback}`
                        : advancedText.descDataQuery}
                    </div>
                    <button
                      type="button"
                      className="managerial-data-query-config-btn"
                      onClick={openDataQueryConfigPanel}
                    >
                      {advancedText.configureDataQuery}
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="managerial-advanced-card managerial-advanced-card--flat">
                <div className="managerial-advanced-card-title">{advancedText.titleResponseFormat}</div>
                <div className="single-agent-field managerial-advanced-response-format-field">
                  <select
                    className="single-agent-input"
                    value={effectiveResponseFormat}
                    onChange={(event) => {
                      const nextFormat = event.target.value as 'text' | 'structured' | 'image'
                      if (nextFormat === 'image') {
                        initializeImageOutputConfigDraft()
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          imageAsOutputEnabled: true,
                          responseFormat: 'text',
                          structuredOutputEnabled: false,
                        }))
                        return
                      }

                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        imageAsOutputEnabled: false,
                        responseFormat: nextFormat,
                        structuredOutputEnabled: nextFormat === 'structured',
                      }))
                    }}
                  >
                    {responseFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {effectiveResponseFormat === 'structured' ? (
                <section className="managerial-advanced-card">
                  <div className="managerial-advanced-card-title">{advancedText.titleStructuredOutput}</div>
                  <div className="managerial-advanced-card-desc">{advancedText.descStructuredOutput}</div>
                  <div className="managerial-advanced-schema-list">
                    {managerialAdvancedConfig.structuredOutputProperties.map((property) => (
                      <div key={property.id} className="managerial-advanced-schema-row">
                        <div className="managerial-advanced-schema-fields">
                          <div className="managerial-advanced-schema-topline">
                            <input
                              className="single-agent-input"
                              placeholder={advancedText.placeholderProperty}
                              value={property.key}
                              onChange={(event) =>
                                updateStructuredOutputProperty(property.id, (prev) => ({
                                  ...prev,
                                  key: event.target.value,
                                }))
                              }
                            />
                            <select
                              className="single-agent-input managerial-advanced-schema-type"
                              value={property.type}
                              onChange={(event) =>
                                updateStructuredOutputProperty(property.id, (prev) => ({
                                  ...prev,
                                  type: event.target.value as StructuredOutputPropertyType,
                                }))
                              }
                            >
                              {structuredOutputTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {structuredOutputTypeLabels[option.value]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            className="single-agent-input"
                            placeholder={advancedText.placeholderDescription}
                            value={property.description}
                            onChange={(event) =>
                              updateStructuredOutputProperty(property.id, (prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="managerial-advanced-schema-actions">
                          <button
                            type="button"
                            className={property.required ? 'managerial-advanced-chip is-active' : 'managerial-advanced-chip'}
                            onClick={() =>
                              updateStructuredOutputProperty(property.id, (prev) => ({
                                ...prev,
                                required: !prev.required,
                              }))
                            }
                          >
                            {advancedText.required}
                          </button>
                          <button
                            type="button"
                            className="managerial-advanced-remove-btn"
                            onClick={() =>
                              updateSelectedManagerialAdvancedConfig((prev) => ({
                                ...prev,
                                structuredOutputProperties:
                                  prev.structuredOutputProperties.length > 1
                                    ? prev.structuredOutputProperties.filter((item) => item.id !== property.id)
                                    : prev.structuredOutputProperties,
                              }))
                            }
                          >
                            {advancedText.remove}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="manager-agent-action-btn is-primary" onClick={appendStructuredOutputProperty}>
                      <span aria-hidden="true">＋</span>
                      {advancedText.addProperty}
                    </button>
                  </div>
                </section>
              ) : null}

              {effectiveResponseFormat === 'text' ? (
                <section className="managerial-advanced-card">
                  <div className="managerial-advanced-card-title">{advancedText.titleExamples}</div>
                  <textarea
                    className="single-agent-textarea managerial-advanced-textarea"
                    value={managerialAdvancedConfig.outputExamplesText}
                    onChange={(event) =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        outputExamplesText: event.target.value,
                      }))
                    }
                    rows={getAdaptiveTextareaRows(managerialAdvancedConfig.outputExamplesText, {
                      minRows: 4,
                      maxRows: 12,
                      charsPerRow: 28,
                    })}
                  />
                </section>
              ) : null}

              {effectiveResponseFormat === 'image' && imageOutputConfigDraft ? (
                <section className="managerial-advanced-card">
                  <div className="managerial-advanced-card-title">{advancedText.imageOutputConfigTitle}</div>
                  <div className="managerial-advanced-card-desc">{advancedText.imageOutputConfigSubtitle}</div>

                  <div className="single-agent-field managerial-advanced-image-output-field">
                    <label className="single-agent-label managerial-image-output-label">
                      {advancedText.imageOutputProviderLabel}
                    </label>
                    <div className="managerial-image-output-select-wrap">
                      <div
                        className={
                          isImageOutputProviderMenuOpen
                            ? 'single-agent-select single-agent-select--model is-open'
                            : 'single-agent-select single-agent-select--model'
                        }
                      >
                        <button
                          className="single-agent-select-trigger"
                          type="button"
                          aria-expanded={isImageOutputProviderMenuOpen}
                          onClick={() => setIsImageOutputProviderMenuOpen((prev) => !prev)}
                        >
                          <span
                            className={
                              imageOutputConfigDraft.model ? 'single-agent-select-value' : 'single-agent-select-placeholder'
                            }
                          >
                            {imageOutputConfigDraft.model
                              ? `${selectedImageOutputDraftProvider.label} / ${imageOutputConfigDraft.model}`
                              : advancedText.imageOutputProviderPlaceholder}
                          </span>
                        </button>
                        <button
                          className="single-agent-select-icon-button"
                          type="button"
                          aria-label={advancedText.imageOutputProviderPlaceholder}
                          aria-expanded={isImageOutputProviderMenuOpen}
                          onClick={() => setIsImageOutputProviderMenuOpen((prev) => !prev)}
                        >
                          <span className="single-agent-select-caret" aria-hidden="true">
                            ▾
                          </span>
                        </button>
                      </div>

                      {isImageOutputProviderMenuOpen ? (
                        <div
                          className={
                            imageOutputExpandedProvider
                              ? 'managerial-image-output-picker managerial-image-output-picker--above is-model-open'
                              : 'managerial-image-output-picker managerial-image-output-picker--above'
                          }
                          role="listbox"
                        >
                          <div className="managerial-image-output-provider-list">
                            {IMAGE_OUTPUT_PROVIDER_OPTIONS.map((provider) => (
                              <div
                                key={provider.id}
                                className={
                                  activeImageOutputProviderId === provider.id
                                    ? 'managerial-image-output-provider-item is-active'
                                    : 'managerial-image-output-provider-item'
                                }
                              >
                                <button
                                  type="button"
                                  className="managerial-image-output-provider-label"
                                  onClick={() => {
                                    setActiveImageOutputProviderId(provider.id)
                                    setExpandedImageOutputProviderId(provider.id)
                                  }}
                                >
                                  <span>{provider.label}</span>
                                </button>
                                <button
                                  type="button"
                                  className="managerial-image-output-provider-chevron"
                                  aria-label={`${provider.label} models`}
                                  onClick={() => {
                                    setActiveImageOutputProviderId(provider.id)
                                    setExpandedImageOutputProviderId((prev) => (prev === provider.id ? null : provider.id))
                                  }}
                                >
                                  ›
                                </button>
                              </div>
                            ))}
                          </div>
                          {imageOutputExpandedProvider ? (
                            <div className="managerial-image-output-model-list">
                              {imageOutputExpandedProvider.models.map((model) => (
                                <button
                                  key={model}
                                  type="button"
                                  className={
                                    imageOutputConfigDraft.providerId === imageOutputExpandedProvider.id &&
                                    imageOutputConfigDraft.model === model
                                      ? 'managerial-image-output-model-item is-selected'
                                      : 'managerial-image-output-model-item'
                                  }
                                  onClick={() => {
                                    setImageOutputConfigDraft((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            providerId: imageOutputExpandedProvider.id,
                                            model,
                                          }
                                        : prev,
                                    )
                                    setActiveImageOutputProviderId(imageOutputExpandedProvider.id)
                                    setIsImageOutputProviderMenuOpen(false)
                                    setExpandedImageOutputProviderId(null)
                                  }}
                                >
                                  {model}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {hasPendingImageOutputChanges ? (
                    <div className="managerial-advanced-inline-note managerial-data-query-summary">
                      <div>
                        <strong>{selectedImageOutputDraftProvider.label}</strong>
                        <span>{` · ${imageOutputConfigDraft.model || managerialAdvancedConfig.imageOutputModel || advancedText.imageOutputSummaryFallback}`}</span>
                      </div>
                      <button
                        type="button"
                        className="managerial-image-output-primary-btn"
                        disabled={!imageOutputConfigDraft.model}
                        onClick={saveImageOutputConfig}
                      >
                        {advancedText.save}
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </>
          )
        case 'memory':
          return (
            <>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleMemory}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descMemory}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.memoryEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.memoryEnabled}
                    onClick={toggleMemoryEnabled}
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.memoryEnabled ? (
                  <div className="managerial-memory-inline-panel">
                    <div className="managerial-memory-metadata-panel">
                      <div className="managerial-memory-metadata-head">
                        <button
                          type="button"
                          className="manager-agent-action-btn is-primary managerial-memory-metadata-add-btn"
                          onClick={openShortTermMemoryMetadataModal}
                        >
                          {advancedText.addMemoryMetadata}
                        </button>
                      </div>

                      {managerialAdvancedConfig.shortTermMemoryMetadata.length > 0 ? (
                        <div className="managerial-memory-metadata-list">
                          {managerialAdvancedConfig.shortTermMemoryMetadata.map((item) => {
                            const targetLabel =
                              item.updateTiming === 'after-trigger-received'
                                ? (
                                    MEMORY_METADATA_TRIGGER_OPTIONS.find((option) => option.id === item.targetId)?.[
                                      locale === 'zh' ? 'labelZh' : 'labelEn'
                                    ] ?? item.targetId
                                  )
                                : activeShortTermMemoryToolOptions.find((option) => option.id === item.targetId)?.title ?? item.targetId

                            return (
                              <div key={item.id} className="managerial-memory-metadata-card">
                                <div className="managerial-memory-metadata-card-topline">
                                  <strong>{item.name}</strong>
                                  <span className="managerial-memory-metadata-badge">
                                    {item.mode === 'agent-decide'
                                      ? advancedText.memoryMetadataAgentDecide
                                      : advancedText.memoryMetadataRuleBased}
                                  </span>
                                </div>
                                <div className="managerial-memory-metadata-card-meta">
                                  {item.mode === 'rule-based'
                                    ? `${item.updateTiming === 'after-trigger-received'
                                        ? advancedText.memoryMetadataSummaryRuleTrigger
                                        : advancedText.memoryMetadataSummaryRuleTool} · ${targetLabel || advancedText.memoryMetadataTargetPlaceholder}`
                                    : advancedText.memoryMetadataFormatText}
                                </div>
                                <div className="managerial-memory-metadata-card-content">{item.instruction}</div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="managerial-memory-metadata-empty">{advancedText.memoryMetadataEmpty}</div>
                      )}
                    </div>

                    <div className="single-agent-field">
                      <label className="single-agent-label managerial-image-output-label">
                        {advancedText.memoryProviderLabel}
                      </label>
                      <div className="managerial-memory-select-wrap">
                        <div
                          className={
                            isMemoryProviderMenuOpen
                              ? 'single-agent-select single-agent-select--model is-open'
                              : 'single-agent-select single-agent-select--model'
                          }
                        >
                          <button
                            className="single-agent-select-trigger"
                            type="button"
                            aria-expanded={isMemoryProviderMenuOpen}
                            onClick={() => setIsMemoryProviderMenuOpen((prev) => !prev)}
                          >
                            <span
                              className={
                                selectedMemoryProvider ? 'single-agent-select-value' : 'single-agent-select-placeholder'
                              }
                            >
                              {selectedMemoryProvider?.label ?? advancedText.memoryProviderPlaceholder}
                            </span>
                          </button>
                          <button
                            className="single-agent-select-icon-button"
                            type="button"
                            aria-label={advancedText.memoryProviderPlaceholder}
                            aria-expanded={isMemoryProviderMenuOpen}
                            onClick={() => setIsMemoryProviderMenuOpen((prev) => !prev)}
                          >
                            <span className="single-agent-select-caret" aria-hidden="true">
                              ▾
                            </span>
                          </button>
                        </div>
                        {isMemoryProviderMenuOpen ? (
                          <div className="managerial-memory-dropdown" role="listbox">
                            {MEMORY_PROVIDER_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                className={
                                  managerialAdvancedConfig.memoryProvider === option.id
                                    ? 'managerial-memory-option is-selected'
                                    : 'managerial-memory-option'
                                }
                                onClick={() => {
                                  updateSelectedManagerialAdvancedConfig((prev) => ({
                                    ...prev,
                                    memoryProvider: option.id,
                                    memoryType: 'short-term',
                                  }))
                                  setIsMemoryProviderMenuOpen(false)
                                }}
                              >
                                <span className="managerial-memory-option-label">{option.label}</span>
                                <span className="managerial-memory-option-badge">{option.badge}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="single-agent-field managerial-memory-range-field">
                      <label className="single-agent-label managerial-image-output-label">
                        {advancedText.memoryShortTermLabel}
                      </label>
                      <div className="managerial-memory-range-axis">
                        <span>2</span>
                        <span>{managerialAdvancedConfig.memoryMaxShortTermMessages}</span>
                      </div>
                      <div className="managerial-memory-slider-row">
                        <input
                          className="managerial-memory-range"
                          type="range"
                          min={2}
                          max={50}
                          value={managerialAdvancedConfig.memoryMaxShortTermMessages}
                          style={
                            {
                              '--slider-progress': `${((managerialAdvancedConfig.memoryMaxShortTermMessages - 2) / 48) * 100}%`,
                            } as CSSProperties
                          }
                          onChange={(event) =>
                            updateSelectedManagerialAdvancedConfig((prev) => ({
                              ...prev,
                              memoryMaxShortTermMessages: Number(event.target.value),
                              memoryType: 'short-term',
                            }))
                          }
                        />
                        <input
                          className="single-agent-input managerial-memory-number-input"
                          type="number"
                          min={2}
                          max={50}
                          value={managerialAdvancedConfig.memoryMaxShortTermMessages}
                          onChange={(event) =>
                            updateSelectedManagerialAdvancedConfig((prev) => ({
                              ...prev,
                              memoryMaxShortTermMessages: Math.max(2, Math.min(50, Number(event.target.value) || 2)),
                              memoryType: 'short-term',
                            }))
                          }
                        />
                      </div>
                      <div className="managerial-memory-range-value">
                        {`${managerialAdvancedConfig.memoryMaxShortTermMessages} ${advancedText.memoryMessagesUnit}`}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleContext}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descContext}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.contextEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.contextEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        contextEnabled: !prev.contextEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.contextEnabled ? (
                  <textarea
                    className="single-agent-textarea managerial-advanced-textarea"
                    value={managerialAdvancedConfig.contextText}
                    onChange={(event) =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        contextText: event.target.value,
                      }))
                    }
                    rows={getAdaptiveTextareaRows(managerialAdvancedConfig.contextText, {
                      minRows: 3,
                      maxRows: 10,
                      charsPerRow: 24,
                    })}
                  />
                ) : null}
              </section>
            </>
          )
        case 'scheduling':
          return (
            <>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleScheduler}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descScheduler}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.schedulerEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.schedulerEnabled}
                    onClick={() => {
                      if (managerialAdvancedConfig.schedulerEnabled) {
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          schedulerEnabled: false,
                        }))
                        return
                      }
                      openSchedulerConfigPanel()
                    }}
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.schedulerEnabled ? (
                  <div className="managerial-advanced-inline-note managerial-data-query-summary">
                    <div>
                      <strong>{schedulerModeLabels[managerialAdvancedConfig.schedulerMode]}</strong>
                      <span>
                        {` · ${
                          managerialAdvancedConfig.schedulerMode === 'days'
                            ? selectedSchedulerWeekdayLabel
                            : managerialAdvancedConfig.schedulerMode === 'cron'
                              ? managerialAdvancedConfig.schedulerCronExpression
                              : managerialAdvancedConfig.schedulerInterval
                        }`}
                      </span>
                    </div>
                    <div>{`${advancedText.schedulerSummaryLabel} · ${managerialAdvancedConfig.schedulerExpression}`}</div>
                    <button
                      type="button"
                      className="managerial-data-query-config-btn"
                      onClick={openSchedulerConfigPanel}
                    >
                      {advancedText.titleScheduler}
                    </button>
                  </div>
                ) : null}
              </section>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">{advancedText.titleWebhookTrigger}</div>
                    <div className="managerial-advanced-card-desc">{advancedText.descWebhookTrigger}</div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.webhookTriggerEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.webhookTriggerEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        webhookTriggerEnabled: !prev.webhookTriggerEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.webhookTriggerEnabled ? (
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.labelWebhookPath}</label>
                    <input
                      className="single-agent-input"
                      value={managerialAdvancedConfig.webhookPath}
                      onChange={(event) =>
                        updateSelectedManagerialAdvancedConfig((prev) => ({
                          ...prev,
                          webhookPath: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
              </section>
            </>
          )
        case 'safety':
          return (
            <>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">Safe &amp; Responsible AI</div>
                    <div className="managerial-advanced-card-desc">
                      {locale === 'zh'
                        ? '为高风险执行设定保护策略和人工确认规则。'
                        : 'Add guardrails and approval rules for high-risk actions.'}
                    </div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.safeResponsibleAiEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.safeResponsibleAiEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        safeResponsibleAiEnabled: !prev.safeResponsibleAiEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.safeResponsibleAiEnabled ? (
                  <textarea
                    className="single-agent-textarea managerial-advanced-textarea"
                    value={managerialAdvancedConfig.safeResponsibleAiNotes}
                    onChange={(event) =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        safeResponsibleAiNotes: event.target.value,
                      }))
                    }
                    rows={getAdaptiveTextareaRows(managerialAdvancedConfig.safeResponsibleAiNotes, {
                      minRows: 3,
                      maxRows: 10,
                      charsPerRow: 26,
                    })}
                  />
                ) : null}
              </section>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">Hallucination Manager</div>
                    <div className="managerial-advanced-card-desc">
                      {locale === 'zh'
                        ? '当结果不确定时，要求返回待确认或补充来源，而不是直接输出确定结论。'
                        : 'Return “needs verification” when evidence is insufficient instead of overconfident answers.'}
                    </div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.hallucinationManagerEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.hallucinationManagerEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        hallucinationManagerEnabled: !prev.hallucinationManagerEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.hallucinationManagerEnabled ? (
                  <textarea
                    className="single-agent-textarea managerial-advanced-textarea"
                    value={managerialAdvancedConfig.hallucinationManagerNotes}
                    onChange={(event) =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        hallucinationManagerNotes: event.target.value,
                      }))
                    }
                    rows={getAdaptiveTextareaRows(managerialAdvancedConfig.hallucinationManagerNotes, {
                      minRows: 3,
                      maxRows: 10,
                      charsPerRow: 26,
                    })}
                  />
                ) : null}
              </section>
              <section className="managerial-advanced-card">
                <div className="managerial-advanced-toggle-line">
                  <div>
                    <div className="managerial-advanced-card-title">Version Control</div>
                    <div className="managerial-advanced-card-desc">
                      {locale === 'zh'
                        ? '保留配置历史与变更说明，方便回溯面板设置。'
                        : 'Track configuration changes and keep an audit trail for future review.'}
                    </div>
                  </div>
                  <button
                    className={managerialAdvancedConfig.versionControlEnabled ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={managerialAdvancedConfig.versionControlEnabled}
                    onClick={() =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        versionControlEnabled: !prev.versionControlEnabled,
                      }))
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {managerialAdvancedConfig.versionControlEnabled ? (
                  <textarea
                    className="single-agent-textarea managerial-advanced-textarea"
                    value={managerialAdvancedConfig.versionControlNotes}
                    onChange={(event) =>
                      updateSelectedManagerialAdvancedConfig((prev) => ({
                        ...prev,
                        versionControlNotes: event.target.value,
                      }))
                    }
                    rows={getAdaptiveTextareaRows(managerialAdvancedConfig.versionControlNotes, {
                      minRows: 3,
                      maxRows: 10,
                      charsPerRow: 26,
                    })}
                  />
                ) : null}
              </section>
            </>
          )
      }
    }

    sharedAdvancedConfigNavItems = managerialAdvancedConfigNavItems
    sharedRenderAdvancedConfigContent = renderAdvancedConfigContent

    return (
      <section
        className="single-agent-page managerial-agent-page"
        aria-label={locale === 'zh' ? '管理型Agent 设置' : 'Manager agent settings'}
      >
        <div className="single-agent-shell">
          <div className="single-agent-main">
            <div
              className={
                isManagerialAdvancedConfigOpen
                  ? 'single-agent-topbar managerial-agent-topbar--advanced-open'
                  : 'single-agent-topbar'
              }
            >
              <div className="single-agent-topbar-left">
                <div className="single-agent-topbar-left-main">
                  <button
                    className="agents-back-btn"
                    type="button"
                    aria-label={locale === 'zh' ? '返回管理型智能体列表' : 'Back to manager agent list'}
                    onClick={() => {
                      setSelectedManagerialAgentKey(null)
                      setIsManagerialAdvancedConfigOpen(false)
                      setOpenSettingsDropdown(null)
                      setIsOnboardingWorkflowOpen(false)
                    }}
                  >
                    ←
                  </button>
                  <div className="single-agent-topmeta">
                    <div className="single-agent-title-row">
                      <div className="single-agent-title">{selectedManagerialAgent.name}</div>
                      {isAgentFrozen(selectedManagerialAgent.name) ? (
                        <span className="agent-card-status-badge agent-card-status-badge--frozen">
                          {getAgentFrozenStatusBadge(locale).label}
                        </span>
                      ) : showAgentPublishedBadge(selectedManagerialAgent.name) ? (
                        <span className="agent-card-status-badge agent-card-status-badge--published">
                          {getAgentPublishedStatusBadge(locale).label}
                        </span>
                      ) : null}
                    </div>
                    <div className="single-agent-subtitle">{locale === 'zh' ? '管理型智能体设置' : 'Manager agent settings'}</div>
                  </div>
                </div>
                <div className="single-agent-left-actions">
                  {canUseAdvancedConfig ? (
                    <button
                      className={
                        isManagerialAdvancedConfigOpen
                          ? 'single-agent-preview-icon managerial-agent-advanced-btn is-active'
                          : 'single-agent-preview-icon managerial-agent-advanced-btn'
                      }
                      type="button"
                      aria-label={locale === 'zh' ? '高级配置' : 'Advanced configuration'}
                      aria-pressed={isManagerialAdvancedConfigOpen}
                      disabled={!selectedManagerialAgent.managerEnabled}
                      onClick={() => toggleManagerialAdvancedConfig('reasoning')}
                    >
                      <ManagerialAdvancedConfigIcon />
                    </button>
                  ) : null}
                  <button
                    className="single-agent-preview-icon managerial-agent-edit-btn"
                    type="button"
                    aria-label={locale === 'zh' ? '编辑' : 'Edit'}
                    onClick={() => {
                      setIsManagerialAdvancedConfigOpen(false)
                      setOpenSettingsDropdown(null)
                      setOpenManagerAgentPickerRowId(null)
                      setIsManagerSettingsMenuOpen(false)
                      setOnboardingWorkflowInitialView('build')
                      setOnboardingWorkflowEntrySource('manager-edit')
                      setIsOnboardingWorkflowOpen(true)
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="m6.75 17.25 8.92-8.92 2 2-8.92 8.92-2.75.75z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m14.92 8.42 2 2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6.75 17.25 6 20l2.75-.75"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label={locale === 'zh' ? '代码' : 'Code'}>
                    {'</>'}
                  </button>
                  <button className="single-agent-preview-icon" type="button" aria-label={locale === 'zh' ? '保存' : 'Save'}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M6 4.75h9.2l2.8 2.8V19.25H6z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 4.75v5.5h5.5v-5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 19.25v-5.25h6v5.25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="managerial-agent-top-settings" ref={managerSettingsMenuRef}>
                    <button
                      className="single-agent-preview-icon"
                      type="button"
                      aria-label={locale === 'zh' ? '设置' : 'Settings'}
                      aria-haspopup="menu"
                      aria-expanded={isManagerSettingsMenuOpen}
                      onClick={() => setIsManagerSettingsMenuOpen((prev) => !prev)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M12 9.25a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M19 12a7 7 0 0 0-.08-1l2.03-1.58-1.92-3.32-2.45.78a7.27 7.27 0 0 0-1.74-1L14.5 3h-5l-.34 2.88a7.27 7.27 0 0 0-1.74 1l-2.45-.78-1.92 3.32L5.08 11A7 7 0 0 0 5 12c0 .34.03.67.08 1l-2.03 1.58 1.92 3.32 2.45-.78c.53.42 1.12.76 1.74 1L9.5 21h5l.34-2.88c.62-.24 1.21-.58 1.74-1l2.45.78 1.92-3.32L18.92 13c.05-.33.08-.66.08-1Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    {isManagerSettingsMenuOpen ? (
                      <div
                        className="managerial-agent-settings-menu"
                        role="menu"
                        aria-label={locale === 'zh' ? '设置选项' : 'Settings options'}
                      >
                        <button
                          type="button"
                          className="managerial-agent-settings-menu-item"
                          role="menuitem"
                          onClick={() => {
                            setIsManagerSettingsMenuOpen(false)
                            setManagerialAgentPreviewTab('preview')
                          }}
                        >
                          <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M5 6.5h14v11H8.5L5 20V6.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                              <path d="M8.5 10h7M8.5 13.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>{locale === 'zh' ? '查看消息' : 'View Messages'}</span>
                        </button>
                        <button
                          type="button"
                          className="managerial-agent-settings-menu-item"
                          role="menuitem"
                          onClick={() => setIsManagerSettingsMenuOpen(false)}
                        >
                          <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M7 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm8 10.5v-.75A4.75 4.75 0 0 0 10.25 13H9.5A4.5 4.5 0 0 0 5 17.5v1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              <path d="M16.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm2.5 8v-.25a3.75 3.75 0 0 0-3.75-3.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>{locale === 'zh' ? '查看负责人' : 'View Leads'}</span>
                        </button>
                        {canUseAdvancedConfig ? (
                          <button
                            type="button"
                            className="managerial-agent-settings-menu-item"
                            role="menuitem"
                            disabled={!selectedManagerialAgent.managerEnabled}
                            onClick={() => {
                              openManagerialAdvancedConfig('reasoning')
                            }}
                          >
                            <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                              <ManagerialAdvancedConfigIcon />
                            </span>
                            <span>{locale === 'zh' ? '配置' : 'Configuration'}</span>
                          </button>
                        ) : null}
                        {canDeleteAgent ? (
                          <button
                            type="button"
                            className="managerial-agent-settings-menu-item managerial-agent-settings-menu-item--danger"
                            role="menuitem"
                            onClick={() => setIsManagerSettingsMenuOpen(false)}
                          >
                            <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M6.5 7.5h11M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5m-7 0V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span>{locale === 'zh' ? '删除助手' : 'Delete Assistant'}</span>
                          </button>
                        ) : null}
                        <div className="managerial-agent-settings-menu-divider" />
                        <button
                          type="button"
                          className="managerial-agent-settings-menu-item"
                          role="menuitem"
                          onClick={() => {
                            setIsManagerSettingsMenuOpen(false)
                            setOpenSettingsDropdown(null)
                            setOpenManagerAgentPickerRowId(null)
                            setShowPlanWorkflowBootstrapModal(false)
                            setOnboardingWorkflowInitialView('run-test')
                            setOnboardingWorkflowEntrySource('default')
                            setIsOnboardingWorkflowOpen(true)
                            onTestRunRecorded?.({
                              name: `${selectedManagerialAgent.name} · 测试运行`,
                              resumeKind: 'agent',
                              resumeTargetName: selectedManagerialAgent.name,
                            })
                          }}
                        >
                          <span className="managerial-agent-settings-menu-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M4.75 6.75h14.5v10.5H4.75z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M8.5 12h7M12 8.5v7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>{locale === 'zh' ? '查看详情' : 'Show Details'}</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="single-agent-topbar-right">
                <div className="single-agent-preview-tabs" role="tablist" aria-label={locale === 'zh' ? '预览标签' : 'Preview tabs'}>
                  <button
                    className={
                      managerialAgentPreviewTab === 'preview'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setManagerialAgentPreviewTab('preview')}
                  >
                    {locale === 'zh' ? '预览' : 'Preview'}
                  </button>
                  <button
                    className={
                      managerialAgentPreviewTab === 'ai-adjust'
                        ? 'single-agent-preview-tab is-active'
                        : 'single-agent-preview-tab'
                    }
                    type="button"
                    onClick={() => setManagerialAgentPreviewTab('ai-adjust')}
                  >
                    {locale === 'zh' ? 'AI修改' : 'AI edit'}
                  </button>
                </div>
                <div className="single-agent-topbar-actions">
                  {renderTopbarSaveButton(selectedManagerialAgent.name)}
                  {renderTopbarPublishButton(selectedManagerialAgent.name, 'Managerial Agent')}
                </div>
              </div>
            </div>

            <div
              className={
                isManagerialAdvancedConfigOpen
                  ? 'single-agent-layout managerial-agent-layout managerial-agent-layout--advanced-open'
                  : 'single-agent-layout managerial-agent-layout'
              }
            >
              <div className="single-agent-left">
                <div className="single-agent-card">
                  <div className="single-agent-field">
                    <div className="managerial-agent-name-row">
                      <div className="managerial-agent-avatar-picker" ref={managerAvatarPickerRef}>
                        <button
                          className={
                            selectedManagerialAgent.avatar
                              ? 'managerial-agent-avatar-button'
                              : 'managerial-agent-avatar-button is-empty'
                          }
                          type="button"
                          title={locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}
                          aria-label={locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}
                          onClick={() => setIsManagerAvatarPickerOpen((prev) => !prev)}
                        >
                          {selectedManagerialAgent.avatar ? (
                            <img
                              className="managerial-agent-avatar-image"
                              src={selectedManagerialAgent.avatar}
                              alt={`${selectedManagerialAgent.name} 头像`}
                            />
                          ) : (
                            <span className="managerial-agent-avatar-placeholder" aria-hidden="true">
                              👤
                            </span>
                          )}
                          <span className="managerial-agent-avatar-overlay">
                            <span className="managerial-agent-avatar-tooltip">{locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}</span>
                            <span className="managerial-agent-avatar-edit" aria-hidden="true">
                              ✎
                            </span>
                          </span>
                        </button>

                        {isManagerAvatarPickerOpen ? (
                          <div className="managerial-agent-avatar-panel">
                            <div className="managerial-agent-avatar-panel-title">{locale === 'zh' ? '更换智能体头像' : 'Change agent avatar'}</div>
                            <div className="managerial-agent-avatar-grid">
                              {EXPERIENCE_AVATAR_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  className={
                                    selectedManagerialAgent.avatar === option.src
                                      ? 'managerial-agent-avatar-option is-selected'
                                      : 'managerial-agent-avatar-option'
                                  }
                                  type="button"
                                  title={option.label}
                                  aria-label={locale === 'zh' ? `选择头像：${option.label}` : `Choose avatar: ${option.label}`}
                                  onClick={() => {
                                    updateSelectedManagerialAgent((prev) => ({
                                      ...prev,
                                      avatar: option.src,
                                    }))
                                    setIsManagerAvatarPickerOpen(false)
                                  }}
                                >
                                  <img src={option.src} alt={option.label} />
                                </button>
                              ))}
                            </div>
                            <div className="managerial-agent-avatar-panel-footer">
                              <button
                                className="managerial-agent-avatar-upload"
                                type="button"
                                onClick={() => managerAvatarUploadInputRef.current?.click()}
                              >
                                {locale === 'zh' ? '上传头像' : 'Upload avatar'}
                              </button>
                              <input
                                ref={managerAvatarUploadInputRef}
                                className="managerial-agent-avatar-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleManagerAvatarUpload}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="managerial-agent-name-main">
                        <label className="single-agent-label managerial-agent-name-label" htmlFor="managerial-agent-name">
                          {locale === 'zh' ? '智能体名称' : 'Agent name'} <span className="single-agent-required">*</span>
                        </label>
                        <input
                          id="managerial-agent-name"
                          className="single-agent-input managerial-agent-name-input"
                          value={selectedManagerialAgent.name}
                          onChange={(event) =>
                            updateSelectedManagerialAgent((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-with-info">
                      <label className="single-agent-label" htmlFor="managerial-agent-model">
                        {locale === 'zh' ? '模型配置' : 'Model config'} <span className="single-agent-required">*</span>
                      </label>
                      <span className="single-agent-label-info-wrap">
                        <button
                          type="button"
                          className="single-agent-label-info"
                          aria-label={locale === 'zh' ? '模型配置说明' : 'Model config help'}
                          aria-describedby="managerial-agent-model-hint"
                        >
                          <span aria-hidden="true">i</span>
                        </button>
                        <span id="managerial-agent-model-hint" role="tooltip" className="single-agent-label-info-popover">
                          {locale === 'zh' ? '选择一个模型配置模板。' : 'Choose a model configuration template.'}
                        </span>
                      </span>
                    </div>
                    <div className="single-agent-select-wrap">
                      <div
                        id="managerial-agent-model"
                        className={
                          openSettingsDropdown === 'modelConfig'
                            ? 'single-agent-select single-agent-select--model is-open'
                            : 'single-agent-select single-agent-select--model'
                        }
                      >
                        <button
                          className="single-agent-select-trigger"
                          type="button"
                          aria-expanded={openSettingsDropdown === 'modelConfig'}
                          onClick={() => {
                            setOpenSettingsDropdown((prev) =>
                              prev === 'modelConfig' ? null : 'modelConfig',
                            )
                          }}
                        >
                          <span
                            className={
                              selectedManagerialAgent.modelConfig
                                ? 'single-agent-select-value'
                                : 'single-agent-select-placeholder'
                            }
                          >
                            {selectedManagerialAgent.modelConfig || (locale === 'zh' ? '请选择模型配置' : 'Select model config')}
                          </span>
                        </button>
                        {selectedManagerialAgent.modelConfig ? (
                          <button
                            className="single-agent-select-clear"
                            type="button"
                            aria-label={locale === 'zh' ? '清空模型配置' : 'Clear model config'}
                            onClick={() => {
                              updateSelectedManagerialAgent((prev) => ({
                                ...prev,
                                modelConfig: '',
                              }))
                              setOpenSettingsDropdown(null)
                            }}
                          >
                            ×
                          </button>
                        ) : null}
                        <button
                          className="single-agent-select-icon-button"
                          type="button"
                          aria-label={locale === 'zh' ? '展开模型配置列表' : 'Open model config list'}
                          aria-expanded={openSettingsDropdown === 'modelConfig'}
                          onClick={() => {
                            setOpenSettingsDropdown((prev) =>
                              prev === 'modelConfig' ? null : 'modelConfig',
                            )
                          }}
                        >
                          <span className="single-agent-select-caret" aria-hidden="true">
                            ▾
                          </span>
                        </button>
                      </div>
                      {openSettingsDropdown === 'modelConfig' ? (
                        <div className="single-agent-dropdown" role="listbox">
                          <div className="single-agent-dropdown-scroll">
                            {modelConfigOptions.map((option) => (
                              <button
                                key={option.id}
                                className={
                                  selectedManagerialAgent.modelConfig === option.title
                                    ? 'single-agent-dropdown-item is-selected'
                                    : 'single-agent-dropdown-item'
                                }
                                type="button"
                                onClick={() => {
                                  updateSelectedManagerialAgent((prev) => ({
                                    ...prev,
                                    modelConfig: option.title,
                                  }))
                                  setOpenSettingsDropdown(null)
                                }}
                              >
                                <div className="single-agent-dropdown-title">{option.title}</div>
                                {option.description ? (
                                  <div className="single-agent-dropdown-desc">{option.description}</div>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="managerial-agent-agent-instructions">描述</label>
                    <textarea
                      id="managerial-agent-agent-instructions"
                      className="single-agent-textarea single-agent-textarea--preview"
                      value={selectedManagerialAgent.agentInstructions}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal(
                          'managerial',
                          'agentInstructions',
                          '描述',
                          selectedManagerialAgent.agentInstructions,
                        )
                      }
                      rows={getPreviewTextareaRows(selectedManagerialAgent.agentInstructions)}
                    />
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-row">
                      <label className="single-agent-label" htmlFor="managerial-agent-role">角色</label>
                      <button
                        className="single-agent-generate-link"
                        type="button"
                        onClick={() =>
                          openInstructionGenerator(
                            'role',
                            selectedManagerialAgent.agentRole || selectedManagerialAgent.agentGoal || selectedManagerialAgent.name,
                          )
                        }
                      >
                        {locale === 'zh' ? '✦ AI生成' : '✦ Generate with AI'}
                      </button>
                    </div>
                    <input
                      id="managerial-agent-role"
                      className="single-agent-input single-agent-input--preview"
                      value={selectedManagerialAgent.agentRole}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal(
                          'managerial',
                          'agentRole',
                          '角色',
                          selectedManagerialAgent.agentRole,
                        )
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="managerial-agent-goal">目标</label>
                    <input
                      id="managerial-agent-goal"
                      className="single-agent-input single-agent-input--preview"
                      value={selectedManagerialAgent.agentGoal}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal(
                          'managerial',
                          'agentGoal',
                          '目标',
                          selectedManagerialAgent.agentGoal,
                        )
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <label className="single-agent-label" htmlFor="managerial-agent-rules">原则</label>
                    <input
                      id="managerial-agent-rules"
                      className="single-agent-input single-agent-input--preview"
                      value={selectedManagerialAgent.agentRules}
                      readOnly
                      aria-haspopup="dialog"
                      onClick={() =>
                        openAgentDetailFieldModal(
                          'managerial',
                          'agentRules',
                          '原则',
                          selectedManagerialAgent.agentRules,
                        )
                      }
                    />
                  </div>

                  <div className="single-agent-field">
                    <div className="single-agent-label-row">
                      <label className="single-agent-label" htmlFor="managerial-agent-instructions">
                        {locale === 'zh' ? '指令' : 'Instructions'} <span className="single-agent-required">*</span>
                      </label>
                      <button
                        className="single-agent-generate-link"
                        type="button"
                        onClick={() =>
                          openInstructionGenerator(
                            'instructions',
                            selectedManagerialAgent.agentInstructions || selectedManagerialAgent.instructions,
                          )
                        }
                      >
                        {locale === 'zh' ? '✦ AI生成' : '✦ Generate with AI'}
                      </button>
                    </div>
                    {selectedManagerialAgent.generatedPrompt ? (
                      <div className="single-agent-markdown-block">
                        <div className="single-agent-markdown-title">{locale === 'zh' ? '生成的提示词' : 'Generated prompt'}</div>
                        <pre className="single-agent-markdown-preview">
                          {selectedManagerialAgent.generatedPrompt}
                        </pre>
                      </div>
                    ) : (
                      <textarea
                        id="managerial-agent-instructions"
                        className="single-agent-textarea"
                        value={selectedManagerialAgent.instructions}
                        onChange={(event) =>
                          updateSelectedManagerialAgent((prev) => ({
                            ...prev,
                            instructions: event.target.value,
                          }))
                        }
                        rows={8}
                      />
                    )}
                  </div>


                  <div className="single-agent-field manager-agent-field">
                    <div className="manager-agent-toggle-row">
                      <label className="single-agent-label manager-agent-label">
                        {locale === 'zh' ? 'Manager Agent' : 'Manager Agent'}
                      </label>
                      <button
                        className={
                          selectedManagerialAgent.managerEnabled
                            ? 'manager-agent-switch is-on'
                            : 'manager-agent-switch'
                        }
                        type="button"
                        role="switch"
                        aria-checked={selectedManagerialAgent.managerEnabled}
                        onClick={() => setManagerialManagerEnabled(!selectedManagerialAgent.managerEnabled)}
                      >
                        <span className="manager-agent-switch-thumb" aria-hidden="true" />
                      </button>
                    </div>

                    {selectedManagerialAgent.managerEnabled ? (
                      <div className="manager-agent-panel">
                        <div className="manager-agent-list-title">Agents</div>
                        <div className="manager-agent-list">
                          {selectedManagerialAgent.managerAgents.map((row) => (
                            <div key={row.id} className="manager-agent-row">
                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label={locale === 'zh' ? '刷新' : 'Refresh'}
                              >
                                ↻
                              </button>

                              <div className="manager-agent-select-wrap">
                                <button
                                  className={
                                    openManagerAgentPickerRowId === row.id
                                      ? 'manager-agent-select is-open'
                                      : 'manager-agent-select'
                                  }
                                  type="button"
                                  onClick={() =>
                                    setOpenManagerAgentPickerRowId((prev) =>
                                      prev === row.id ? null : row.id,
                                    )
                                  }
                                >
                                  <span
                                    className={
                                      row.agentName
                                        ? 'manager-agent-select-value'
                                        : 'manager-agent-select-placeholder'
                                    }
                                  >
                                    {row.agentName || (locale === 'zh' ? '选择一个 Agent' : 'Select an agent')}
                                  </span>
                                  <span className="manager-agent-select-caret" aria-hidden="true">
                                    ▾
                                  </span>
                                </button>
                                {openManagerAgentPickerRowId === row.id ? (
                                  <div className="manager-agent-picker" role="listbox" aria-label={locale === 'zh' ? 'Agent列表' : 'Agent list'}>
                                    {managerAgentPickerOptions.map((option) => (
                                      <button
                                        key={option.id}
                                        className="manager-agent-picker-item"
                                        type="button"
                                        onClick={() => {
                                          updateManagerAgentRow(row.id, (current) => ({
                                            ...current,
                                            agentName: option.title,
                                          }))
                                          setOpenManagerAgentPickerRowId(null)
                                        }}
                                      >
                                        <div className="manager-agent-picker-title">{option.title}</div>
                                        {option.description ? (
                                          <div className="manager-agent-picker-desc">
                                            {option.description}
                                          </div>
                                        ) : null}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              <input
                                className="manager-agent-usage-input"
                                placeholder={locale === 'zh' ? '你会如何使用这个 Agent？' : 'How will you use this agent?'}
                                value={row.usage}
                                onChange={(event) =>
                                  updateManagerAgentRow(row.id, (current) => ({
                                    ...current,
                                    usage: event.target.value,
                                  }))
                                }
                              />

                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label={locale === 'zh' ? '编辑Agent' : 'Edit agent'}
                                onClick={() => showAgentNotice(noticeText.subAgentEdited, noticeText.subAgentEditedSub)}
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                  <path
                                    d="M14 5h5v5M10 14 19 5M18 14v4a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>

                              <button
                                className="manager-agent-icon-btn"
                                type="button"
                                aria-label={locale === 'zh' ? '删除Agent' : 'Delete agent'}
                                onClick={() => {
                                  if (selectedManagerialAgent.managerAgents.length <= 1) return
                                  updateSelectedManagerialAgent((prev) => ({
                                    ...prev,
                                    managerAgents: prev.managerAgents.filter((item) => item.id !== row.id),
                                  }))
                                  showAgentNotice(noticeText.subAgentDeleted, noticeText.subAgentDeletedSub)
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="manager-agent-action-row">
                          <button
                            className="manager-agent-action-btn is-primary"
                            type="button"
                            onClick={() => appendManagerAgentRow('agent')}
                          >
                            <span aria-hidden="true">＋</span>
                            {locale === 'zh' ? '添加 Agent' : 'Add agent'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {renderManagerialMultiSelectField(
                    'skills',
                    locale === 'zh' ? '技能' : 'Skills',
                    locale === 'zh'
                      ? '从列表中选择技能。保存后，启用的技能会按顺序追加在描述之后。'
                      : 'Choose skills from the list. After saving, enabled skills will be appended after the description.',
                    locale === 'zh' ? '选择技能' : 'Select skills',
                    skillOptions,
                    selectedManagerialAgent.skills,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        skills: prev.skills.includes(id)
                          ? prev.skills.filter((x) => x !== id)
                          : [...prev.skills, id],
                      })),
                  )}

                  {renderManagerialMultiSelectField(
                    'knowledge',
                    locale === 'zh' ? '知识库（文档库）' : 'Knowledge base',
                    locale === 'zh'
                      ? '绑定内部文档数据源，让该智能体可以结合更多上下文进行回答。'
                      : 'Connect internal document sources so this agent can answer with richer context.',
                    locale === 'zh' ? '选择知识库' : 'Select knowledge',
                    knowledgeOptions,
                    selectedManagerialAgent.knowledge,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        knowledge: prev.knowledge.includes(id)
                          ? prev.knowledge.filter((x) => x !== id)
                          : [...prev.knowledge, id],
                      })),
                  )}

                  {renderManagerialMultiSelectField(
                    'tools',
                    locale === 'zh' ? '工具' : 'Tools',
                    locale === 'zh'
                      ? '选择该管理型智能体在执行过程中可以调用的工具。'
                      : 'Select the tools this manager agent can call while executing.',
                    locale === 'zh' ? '选择工具' : 'Select tools',
                    toolOptions,
                    selectedManagerialAgent.tools,
                    (id) =>
                      updateSelectedManagerialAgent((prev) => ({
                        ...prev,
                        tools: prev.tools.includes(id)
                          ? prev.tools.filter((x) => x !== id)
                          : [...prev.tools, id],
                      })),
                    'above',
                  )}
                </div>
              </div>
              {isManagerialAdvancedConfigOpen ? (
                <aside className="single-agent-middle managerial-advanced-column">
                  <section
                    className="single-agent-card managerial-advanced-inline-panel"
                    aria-label={locale === 'zh' ? '高级配置' : 'Advanced configuration'}
                  >
                    <div className="managerial-advanced-config-header">
                      <div>
                        <div className="managerial-advanced-config-title">
                          {locale === 'zh' ? '高级配置' : 'Advanced configuration'}
                        </div>
                      </div>
                    </div>
                    <div className="managerial-advanced-config-content managerial-advanced-config-content--stacked">
                      <div className="managerial-advanced-config-sections">
                        {managerialAdvancedConfigNavItems.map((item) => (
                          <section
                            key={item.id}
                            className={
                              managerialAdvancedConfigNav === item.id
                                ? 'managerial-advanced-config-section is-active'
                                : 'managerial-advanced-config-section'
                            }
                          >
                            <button
                              type="button"
                              className="managerial-advanced-config-section-head"
                              onClick={() =>
                                setManagerialAdvancedConfigNav((current) => (current === item.id ? null : item.id))
                              }
                            >
                              <div className="managerial-advanced-config-section-copy">
                                <div className="managerial-advanced-config-section-title">{item.label}</div>
                                <div className="managerial-advanced-config-section-hint">{item.hint}</div>
                              </div>
                              <span
                                className={
                                  managerialAdvancedConfigNav === item.id
                                    ? 'managerial-advanced-config-section-chevron is-open'
                                    : 'managerial-advanced-config-section-chevron'
                                }
                                aria-hidden="true"
                              >
                                <svg viewBox="0 0 16 16" focusable="false">
                                  <path
                                    d="M4 6.5 8 10l4-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </button>
                            {managerialAdvancedConfigNav === item.id ? (
                              <div className="managerial-advanced-config-section-body">
                                {renderAdvancedConfigContent(item.id)}
                              </div>
                            ) : null}
                          </section>
                        ))}
                      </div>
                    </div>
                  </section>
                </aside>
              ) : null}

              <aside className="single-agent-right">
                <div className="single-agent-preview-card managerial-agent-preview-card">
                  <div className="single-agent-preview-card-head">
                    <span>{locale === 'zh' ? '预览' : 'Preview'}</span>
                    <button
                      className="single-agent-refresh"
                      type="button"
                      aria-label={locale === 'zh' ? '刷新' : 'Refresh'}
                      onClick={clearManagerialPreview}
                    >
                      ↻
                    </button>
                  </div>
                  <div className="single-agent-preview-body managerial-agent-preview-body">
                    {managerialAgentPreviewTab === 'preview' ? (
                      <div ref={managerialPreviewThreadRef} className="managerial-agent-preview-thread">
                        {managerialPreviewMessages.map((message) => (
                          <div
                            key={message.id}
                            className={
                              message.role === 'user'
                                ? 'managerial-agent-preview-turn is-user'
                                : 'managerial-agent-preview-turn'
                            }
                          >
                            {message.role === 'assistant' ? (
                              <div className="managerial-agent-preview-sender">{selectedManagerialAgent.name}</div>
                            ) : null}
                            <div
                              className={
                                message.role === 'user'
                                  ? 'managerial-agent-preview-bubble is-user'
                                  : 'managerial-agent-preview-bubble'
                              }
                            >
                              <div>{message.text}</div>
                              {message.attachments && message.attachments.length > 0 ? (
                                <div className="managerial-agent-preview-files">
                                  {message.attachments.map((attachment) => (
                                    <span key={attachment.id} className="managerial-agent-preview-file-chip">
                                      {attachment.name}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                        {managerialPreviewMessages.length === 0 ? (
                          <div className="single-agent-preview-placeholder">
                            {locale === 'zh' ? '点击右上角刷新后，聊天消息已清空。' : 'The preview chat has been cleared.'}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="single-agent-preview-placeholder">
                        {locale === 'zh'
                          ? 'AI 辅助优化后的管理编排建议会显示在这里。'
                          : 'AI-improved orchestration suggestions will appear here.'}
                      </div>
                    )}
                  </div>
                  <div className="single-agent-preview-input-row managerial-agent-preview-input-row">
                    <input
                      ref={managerialPreviewFileInputRef}
                      className="sr-only"
                      type="file"
                      multiple
                      onChange={handleManagerialPreviewFileChange}
                    />
                    <div className="managerial-agent-preview-composer">
                      {managerialPreviewAttachments.length > 0 ? (
                        <div className="managerial-agent-preview-attachments">
                          {managerialPreviewAttachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              className="managerial-agent-preview-attachment-chip"
                              onClick={() => removeManagerialPreviewAttachment(attachment.id)}
                              title={locale === 'zh' ? `移除 ${attachment.name}` : `Remove ${attachment.name}`}
                            >
                              <span>{attachment.name}</span>
                              <span aria-hidden="true">×</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <button
                        className="managerial-agent-preview-attach-btn"
                        type="button"
                        aria-label={locale === 'zh' ? '上传文件' : 'Upload file'}
                        onClick={() => managerialPreviewFileInputRef.current?.click()}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path
                            d="M8.5 12.5 14 7a3 3 0 1 1 4.24 4.24l-7.78 7.78a5 5 0 0 1-7.07-7.07l8.13-8.13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <textarea
                        className="single-agent-preview-input managerial-agent-preview-input"
                        placeholder={locale === 'zh' ? '输入消息...' : 'Write a message...'}
                        value={managerialPreviewInput}
                        onChange={(event) => setManagerialPreviewInput(event.target.value)}
                        rows={3}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' || event.shiftKey) return
                          event.preventDefault()
                          sendManagerialPreviewMessage()
                        }}
                      />
                      <div className="managerial-agent-preview-actions">
                        <button
                          className={
                            managerialPreviewVoiceListening
                              ? 'managerial-agent-preview-voice is-listening'
                              : 'managerial-agent-preview-voice'
                          }
                          type="button"
                          aria-label={locale === 'zh' ? '语音输入' : 'Voice input'}
                          aria-pressed={managerialPreviewVoiceListening}
                          onClick={handleManagerialPreviewVoiceClick}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M19 11a7 7 0 0 1-14 0M12 18v3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="single-agent-preview-send"
                          type="button"
                          aria-label={locale === 'zh' ? '发送' : 'Send'}
                          disabled={!canSendManagerialPreview}
                          onClick={sendManagerialPreviewMessage}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M12 6v12M12 6l-4.5 4.5M12 6l4.5 4.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {isDataQueryConfigOpen && dataQueryConfigDraft ? (
          <div className="managerial-data-query-modal-layer" role="presentation">
            <button
              type="button"
              className="managerial-data-query-modal-backdrop"
              aria-label={locale === 'zh' ? '关闭数据检索配置' : 'Close data query configuration'}
              onClick={closeDataQueryConfigPanel}
            />
            <section
              className="managerial-data-query-modal"
              role="dialog"
              aria-modal="true"
              aria-label={advancedText.dataQueryConfigTitle}
            >
              <button
                type="button"
                className="managerial-data-query-modal-close"
                aria-label={locale === 'zh' ? '关闭' : 'Close'}
                onClick={closeDataQueryConfigPanel}
              >
                ×
              </button>
              <div className="managerial-data-query-modal-title">{advancedText.dataQueryConfigTitle}</div>
              <div className="managerial-data-query-modal-subtitle">{advancedText.dataQueryConfigSubtitle}</div>

              <div className="managerial-data-query-modal-body">
                <div className="single-agent-field">
                  <label className="single-agent-label">
                    {advancedText.dataQueryModelLabel}
                    <span className="single-agent-required">*</span>
                  </label>
                  <div className="managerial-data-query-select-wrap">
                    <div
                      className={
                        dataQueryConfigDropdown === 'model'
                          ? 'single-agent-select single-agent-select--model is-open'
                          : 'single-agent-select single-agent-select--model'
                      }
                    >
                      <button
                        className="single-agent-select-trigger"
                        type="button"
                        aria-expanded={dataQueryConfigDropdown === 'model'}
                        onClick={() =>
                          setDataQueryConfigDropdown((prev) => (prev === 'model' ? null : 'model'))
                        }
                      >
                        <span
                          className={
                            dataQueryConfigDraft.modelConfig ? 'single-agent-select-value' : 'single-agent-select-placeholder'
                          }
                        >
                          {dataQueryConfigDraft.modelConfig
                            ? selectedDataQueryDraftModelOption
                              ? getModelConfigOptionLabel(selectedDataQueryDraftModelOption, locale)
                              : dataQueryConfigDraft.modelConfig
                            : advancedText.dataQueryModelPlaceholder}
                        </span>
                      </button>
                      <button
                        className="single-agent-select-icon-button"
                        type="button"
                        aria-label={advancedText.dataQueryModelPlaceholder}
                        aria-expanded={dataQueryConfigDropdown === 'model'}
                        onClick={() =>
                          setDataQueryConfigDropdown((prev) => (prev === 'model' ? null : 'model'))
                        }
                      >
                        <span className="single-agent-select-caret" aria-hidden="true">
                          ▾
                        </span>
                      </button>
                    </div>
                    {dataQueryConfigDropdown === 'model' ? (
                      <div className="single-agent-dropdown managerial-data-query-dropdown" role="listbox">
                        <div className="single-agent-dropdown-scroll">
                          {modelConfigOptions.map((option) => (
                            <button
                              key={option.id}
                              className={
                                dataQueryConfigDraft.modelConfig === option.title
                                  ? 'single-agent-dropdown-item is-selected'
                                  : 'single-agent-dropdown-item'
                              }
                              type="button"
                              onClick={() => {
                                setDataQueryConfigDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        modelConfig: option.title,
                                      }
                                    : prev,
                                )
                                setDataQueryConfigDropdown(null)
                              }}
                            >
                              <div className="single-agent-dropdown-title">{getModelConfigOptionLabel(option, locale)}</div>
                              {option.description ? <div className="single-agent-dropdown-desc">{option.description}</div> : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="managerial-data-query-grid">
                  <div className="single-agent-field">
                    <label className="single-agent-label">
                      {advancedText.dataQueryMaxAttemptsLabel}
                      <span className="single-agent-required">*</span>
                    </label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={1}
                      value={dataQueryConfigDraft.maxAttempts}
                      onChange={(event) =>
                        setDataQueryConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                maxAttempts: Math.max(1, Number(event.target.value) || 1),
                              }
                            : prev,
                        )
                      }
                    />
                  </div>
                  <div className="single-agent-field">
                    <label className="single-agent-label">
                      {advancedText.dataQueryTimeLimitLabel}
                      <span className="single-agent-required">*</span>
                    </label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={10}
                      value={dataQueryConfigDraft.timeLimitSeconds}
                      onChange={(event) =>
                        setDataQueryConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                timeLimitSeconds: Math.max(10, Number(event.target.value) || 10),
                              }
                            : prev,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="managerial-data-query-toggle-row">
                  <div className="managerial-data-query-toggle-label">
                    {advancedText.dataQueryAutoTrainLabel}
                  </div>
                  <button
                    className={dataQueryConfigDraft.autoTrainModel ? 'manager-agent-switch is-on' : 'manager-agent-switch'}
                    type="button"
                    role="switch"
                    aria-checked={dataQueryConfigDraft.autoTrainModel}
                    onClick={() =>
                      setDataQueryConfigDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              autoTrainModel: !prev.autoTrainModel,
                              knowledgeBaseId: !prev.autoTrainModel ? prev.knowledgeBaseId : '',
                            }
                          : prev,
                      )
                    }
                  >
                    <span className="manager-agent-switch-thumb" aria-hidden="true" />
                  </button>
                </div>

                {dataQueryConfigDraft.autoTrainModel ? (
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.dataQueryKnowledgeBaseLabel}</label>
                    <div className="managerial-data-query-select-wrap">
                      <div
                        className={
                          dataQueryConfigDropdown === 'knowledgeBase'
                            ? 'single-agent-select single-agent-select--model is-open'
                            : 'single-agent-select single-agent-select--model'
                        }
                      >
                        <button
                          className="single-agent-select-trigger"
                          type="button"
                          aria-expanded={dataQueryConfigDropdown === 'knowledgeBase'}
                          onClick={() =>
                            setDataQueryConfigDropdown((prev) => (prev === 'knowledgeBase' ? null : 'knowledgeBase'))
                          }
                        >
                          <span
                            className={
                              selectedDataQueryDraftKnowledgeBase
                                ? 'single-agent-select-value'
                                : 'single-agent-select-placeholder'
                            }
                          >
                            {selectedDataQueryDraftKnowledgeBase?.title ?? advancedText.dataQueryKnowledgeBasePlaceholder}
                          </span>
                        </button>
                        <button
                          className="single-agent-select-icon-button"
                          type="button"
                          aria-label={advancedText.dataQueryKnowledgeBasePlaceholder}
                          aria-expanded={dataQueryConfigDropdown === 'knowledgeBase'}
                          onClick={() =>
                            setDataQueryConfigDropdown((prev) => (prev === 'knowledgeBase' ? null : 'knowledgeBase'))
                          }
                        >
                          <span className="single-agent-select-caret" aria-hidden="true">
                            ▾
                          </span>
                        </button>
                      </div>
                      {dataQueryConfigDropdown === 'knowledgeBase' ? (
                        <div
                          className="single-agent-dropdown single-agent-dropdown--above managerial-data-query-dropdown"
                          role="listbox"
                        >
                          <div className="single-agent-dropdown-scroll">
                            {dataQueryKnowledgeBaseOptions.map((option) => (
                              <button
                                key={option.id}
                                className={
                                  dataQueryConfigDraft.knowledgeBaseId === option.id
                                    ? 'single-agent-dropdown-item is-selected'
                                    : 'single-agent-dropdown-item'
                                }
                                type="button"
                                onClick={() => {
                                  setDataQueryConfigDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          knowledgeBaseId: option.id,
                                        }
                                      : prev,
                                  )
                                  setDataQueryConfigDropdown(null)
                                }}
                              >
                                <div className="single-agent-dropdown-title">{option.title}</div>
                                {option.description ? <div className="single-agent-dropdown-desc">{option.description}</div> : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="managerial-data-query-modal-footer">
                <button type="button" className="managerial-data-query-secondary-btn" onClick={closeDataQueryConfigPanel}>
                  {advancedText.cancel}
                </button>
                <button
                  type="button"
                  className="managerial-data-query-primary-btn"
                  disabled={isDataQuerySaveDisabled}
                  onClick={saveDataQueryConfig}
                >
                  {advancedText.save}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {isShortTermMemoryMetadataModalOpen && shortTermMemoryMetadataDraft ? (
          <div className="managerial-memory-modal-layer" role="presentation">
            <button
              type="button"
              className="managerial-memory-modal-backdrop"
              aria-label={locale === 'zh' ? '关闭记忆元数据面板' : 'Close memory metadata panel'}
              onClick={closeShortTermMemoryMetadataModal}
            />
            <section
              className="managerial-memory-modal managerial-memory-metadata-modal"
              role="dialog"
              aria-modal="true"
              aria-label={advancedText.memoryMetadataModalTitle}
            >
              <button
                type="button"
                className="managerial-memory-modal-close"
                aria-label={locale === 'zh' ? '关闭' : 'Close'}
                onClick={closeShortTermMemoryMetadataModal}
              >
                ×
              </button>
              <div className="managerial-memory-modal-title">{advancedText.memoryMetadataModalTitle}</div>

              <div className="managerial-memory-modal-body">
                <div className="single-agent-field">
                  <label className="single-agent-label">{advancedText.memoryMetadataNameLabel}</label>
                  <input
                    className="single-agent-input"
                    placeholder={advancedText.memoryMetadataNamePlaceholder}
                    value={shortTermMemoryMetadataDraft.name}
                    onChange={(event) =>
                      updateShortTermMemoryMetadataDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="managerial-memory-metadata-tab-group">
                  <button
                    type="button"
                    className={
                      shortTermMemoryMetadataDraft.mode === 'agent-decide'
                        ? 'managerial-memory-metadata-tab is-active'
                        : 'managerial-memory-metadata-tab'
                    }
                    onClick={() =>
                      updateShortTermMemoryMetadataDraft((prev) => ({
                        ...prev,
                        mode: 'agent-decide',
                        dataFormat: 'text',
                        dataFormatOptions: [],
                      }))
                    }
                  >
                    {advancedText.memoryMetadataAgentDecide}
                  </button>
                  <button
                    type="button"
                    className={
                      shortTermMemoryMetadataDraft.mode === 'rule-based'
                        ? 'managerial-memory-metadata-tab is-active'
                        : 'managerial-memory-metadata-tab'
                    }
                    onClick={() =>
                      updateShortTermMemoryMetadataDraft((prev) => ({
                        ...prev,
                        mode: 'rule-based',
                        updateTiming: prev.updateTiming || 'after-tool-run',
                        targetId:
                          prev.updateTiming === 'after-trigger-received'
                            ? prev.targetId || MEMORY_METADATA_TRIGGER_OPTIONS[0]?.id || ''
                            : prev.targetId || activeShortTermMemoryToolOptions[0]?.id || '',
                        dataFormat: prev.dataFormat === 'text' ? 'boolean' : prev.dataFormat,
                        dataFormatOptions: [],
                      }))
                    }
                  >
                    {advancedText.memoryMetadataRuleBased}
                  </button>
                </div>

                <div className="managerial-memory-modal-subtitle managerial-memory-metadata-subtitle">
                  {shortTermMemoryMetadataDraft.mode === 'agent-decide'
                    ? advancedText.memoryMetadataAgentDecideDesc
                    : advancedText.memoryMetadataRuleBasedDesc}
                </div>

                {shortTermMemoryMetadataDraft.mode === 'agent-decide' ? (
                  <>
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.memoryMetadataInstructionLabel}</label>
                      <textarea
                        className="single-agent-textarea managerial-advanced-textarea"
                        placeholder={advancedText.memoryMetadataInstructionPlaceholder}
                        value={shortTermMemoryMetadataDraft.instruction}
                        onChange={(event) =>
                          updateShortTermMemoryMetadataDraft((prev) => ({
                            ...prev,
                            instruction: event.target.value,
                          }))
                        }
                        rows={getAdaptiveTextareaRows(shortTermMemoryMetadataDraft.instruction, {
                          minRows: 2,
                          maxRows: 6,
                          charsPerRow: 34,
                        })}
                      />
                    </div>

                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.memoryMetadataDataFormatLabel}</label>
                      <select
                        className="single-agent-input"
                        value={shortTermMemoryMetadataDraft.dataFormat}
                        onChange={(event) => {
                          const nextFormat = event.target.value as MemoryMetadataDataFormat
                          updateShortTermMemoryMetadataDraft((prev) => {
                            const needsOptions = isMemoryMetadataSelectFormat(nextFormat)
                            const hadOptions = isMemoryMetadataSelectFormat(prev.dataFormat)
                            return {
                              ...prev,
                              dataFormat: nextFormat,
                              dataFormatOptions: needsOptions
                                ? hadOptions && prev.dataFormatOptions.length > 0
                                  ? prev.dataFormatOptions
                                  : createDefaultMemoryMetadataFormatOptions()
                                : [],
                            }
                          })
                        }}
                      >
                        {MEMORY_METADATA_AGENT_DECIDE_DATA_FORMAT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {locale === 'zh' ? option.labelZh : option.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isMemoryMetadataSelectFormat(shortTermMemoryMetadataDraft.dataFormat) ? (
                      <MemoryMetadataFormatOptionsField
                        options={shortTermMemoryMetadataDraft.dataFormatOptions}
                        onChange={(next) =>
                          updateShortTermMemoryMetadataDraft((prev) => ({
                            ...prev,
                            dataFormatOptions: next,
                          }))
                        }
                        labels={{
                          optionsLabel: advancedText.memoryMetadataOptionsLabel,
                          optionPlaceholder: advancedText.memoryMetadataOptionPlaceholder,
                          addOption: advancedText.memoryMetadataAddOption,
                          removeOption: advancedText.memoryMetadataRemoveOption,
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.memoryMetadataUpdateLabel}</label>
                      <select
                        className="single-agent-input"
                        value={shortTermMemoryMetadataDraft.updateTiming}
                        onChange={(event) => {
                          const nextTiming = event.target.value as MemoryMetadataUpdateTiming
                          updateShortTermMemoryMetadataDraft((prev) => ({
                            ...prev,
                            updateTiming: nextTiming,
                            targetId:
                              nextTiming === 'after-trigger-received'
                                ? MEMORY_METADATA_TRIGGER_OPTIONS[0]?.id || ''
                                : activeShortTermMemoryToolOptions[0]?.id || '',
                          }))
                        }}
                      >
                        {MEMORY_METADATA_UPDATE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {locale === 'zh' ? option.labelZh : option.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="single-agent-field">
                      <select
                        className="single-agent-input"
                        disabled={shortTermMemoryMetadataTargetOptions.length === 0}
                        value={shortTermMemoryMetadataDraft.targetId}
                        onChange={(event) =>
                          updateShortTermMemoryMetadataDraft((prev) => ({
                            ...prev,
                            targetId: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {shortTermMemoryMetadataTargetOptions.length === 0
                            ? advancedText.memoryMetadataNoToolsPlaceholder
                            : advancedText.memoryMetadataTargetPlaceholder}
                        </option>
                        {shortTermMemoryMetadataTargetOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.memoryMetadataDataFormatLabel}</label>
                      <select
                        className="single-agent-input"
                        value={shortTermMemoryMetadataDraft.dataFormat}
                        onChange={(event) =>
                          updateShortTermMemoryMetadataDraft((prev) => ({
                            ...prev,
                            dataFormat: event.target.value as MemoryMetadataDataFormat,
                          }))
                        }
                      >
                        {MEMORY_METADATA_RULE_DATA_FORMAT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {locale === 'zh' ? option.labelZh : option.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="managerial-memory-modal-footer">
                <button
                  type="button"
                  className="managerial-memory-secondary-btn"
                  onClick={closeShortTermMemoryMetadataModal}
                >
                  {advancedText.cancel}
                </button>
                <button
                  type="button"
                  className="managerial-memory-primary-btn"
                  disabled={isShortTermMemoryMetadataSaveDisabled}
                  onClick={saveShortTermMemoryMetadata}
                >
                  {advancedText.save}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {isSchedulerConfigOpen && schedulerConfigDraft ? (
          <div className="managerial-scheduler-modal-layer" role="presentation">
            <button
              type="button"
              className="managerial-scheduler-modal-backdrop"
              aria-label={locale === 'zh' ? '关闭定时调度配置' : 'Close scheduler configuration'}
              onClick={closeSchedulerConfigPanel}
            />
            <section
              className="managerial-scheduler-modal"
              role="dialog"
              aria-modal="true"
              aria-label={advancedText.schedulerConfigTitle}
            >
              <button
                type="button"
                className="managerial-scheduler-modal-close"
                aria-label={locale === 'zh' ? '关闭' : 'Close'}
                onClick={closeSchedulerConfigPanel}
              >×</button>
              <div className="managerial-scheduler-modal-head">
                <div>
                  <div className="managerial-scheduler-modal-title">{advancedText.schedulerConfigTitle}</div>
                  <div className="managerial-scheduler-modal-subtitle">{advancedText.schedulerConfigSubtitle}</div>
                </div>
              </div>

              <div className="managerial-scheduler-modal-empty">{advancedText.schedulerEmpty}</div>

              <div className="managerial-scheduler-modal-body">
                <div className="managerial-scheduler-section-title">{advancedText.schedulerCreateTitle}</div>

                <div className="managerial-scheduler-tabs">
                  {(['minutes', 'hours', 'days', 'months', 'cron'] as SchedulerMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={
                        schedulerConfigDraft.mode === mode
                          ? 'managerial-scheduler-tab is-active'
                          : 'managerial-scheduler-tab'
                      }
                      onClick={() => switchSchedulerMode(mode)}
                    >
                      {schedulerModeLabels[mode]}
                    </button>
                  ))}
                </div>

                {schedulerConfigDraft.mode === 'minutes' ? (
                  <div className="single-agent-field">
                    <label className="single-agent-label">
                      {advancedText.schedulerIntervalMinutes} <span className="scheduler-field-hint">(30-60)</span>
                    </label>
                    <input
                      className="single-agent-input"
                      value={schedulerConfigDraft.interval}
                      placeholder={advancedText.schedulerMinutesPlaceholder}
                      onChange={(event) =>
                        setSchedulerConfigDraft((prev) => (prev ? { ...prev, interval: event.target.value } : prev))
                      }
                    />
                  </div>
                ) : null}

                {schedulerConfigDraft.mode === 'hours' ? (
                  <>
                    <div className="single-agent-field">
                      <label className="single-agent-label">
                        {advancedText.schedulerIntervalHours} <span className="scheduler-field-hint">(1-24)</span>
                      </label>
                      <input
                        className="single-agent-input"
                        value={schedulerConfigDraft.interval}
                        placeholder={advancedText.schedulerHoursPlaceholder}
                        onChange={(event) =>
                          setSchedulerConfigDraft((prev) => (prev ? { ...prev, interval: event.target.value } : prev))
                        }
                      />
                    </div>
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.schedulerAtMinute}</label>
                      <select
                        className="single-agent-input"
                        value={schedulerConfigDraft.atMinute}
                        onChange={(event) =>
                          setSchedulerConfigDraft((prev) => (prev ? { ...prev, atMinute: event.target.value } : prev))
                        }
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}

                {schedulerConfigDraft.mode === 'days' ? (
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.schedulerSelectWeekdays}</label>
                    <select
                      className="single-agent-input"
                      value={schedulerConfigDraft.weekday}
                      onChange={(event) =>
                        setSchedulerConfigDraft((prev) => (prev ? { ...prev, weekday: event.target.value } : prev))
                      }
                    >
                      {SCHEDULER_WEEKDAY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {locale === 'zh' ? option.labelZh : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {schedulerConfigDraft.mode === 'months' ? (
                  <>
                    <div className="single-agent-field">
                      <label className="single-agent-label">
                        {advancedText.schedulerIntervalMonths} <span className="scheduler-field-hint">(1-12)</span>
                      </label>
                      <input
                        className="single-agent-input"
                        value={schedulerConfigDraft.interval}
                        placeholder={advancedText.schedulerMonthsPlaceholder}
                        onChange={(event) =>
                          setSchedulerConfigDraft((prev) => (prev ? { ...prev, interval: event.target.value } : prev))
                        }
                      />
                    </div>
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.schedulerOnDayOfMonth}</label>
                      <select
                        className="single-agent-input"
                        value={schedulerConfigDraft.monthDay}
                        onChange={(event) =>
                          setSchedulerConfigDraft((prev) => (prev ? { ...prev, monthDay: event.target.value } : prev))
                        }
                      >
                        {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="single-agent-field">
                      <label className="single-agent-label">{advancedText.schedulerAtTime}</label>
                      <div className="managerial-scheduler-time-row">
                        <select
                          className="single-agent-input"
                          value={schedulerConfigDraft.timeLabel}
                          onChange={(event) =>
                            setSchedulerConfigDraft((prev) => (prev ? { ...prev, timeLabel: event.target.value } : prev))
                          }
                        >
                          {SCHEDULER_TIME_PRESET_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {locale === 'zh' ? option.labelZh : option.labelEn}
                            </option>
                          ))}
                        </select>
                        <select
                          className="single-agent-input managerial-scheduler-time-minute"
                          value={schedulerConfigDraft.timeMinute}
                          onChange={(event) =>
                            setSchedulerConfigDraft((prev) => (prev ? { ...prev, timeMinute: event.target.value } : prev))
                          }
                        >
                          {['00', '15', '30', '45'].map((minute) => (
                            <option key={minute} value={minute}>
                              {minute}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : null}

                {schedulerConfigDraft.mode === 'cron' ? (
                  <div className="single-agent-field">
                    <label className="single-agent-label">{advancedText.schedulerCronExpression}</label>
                    <input
                      className="single-agent-input"
                      value={schedulerConfigDraft.cronExpression}
                      placeholder={advancedText.schedulerCronPlaceholder}
                      onChange={(event) =>
                        setSchedulerConfigDraft((prev) =>
                          prev ? { ...prev, cronExpression: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                ) : null}

                <div className="managerial-scheduler-grid">
                  <div className="single-agent-field">
                    <label className="single-agent-label">
                      {advancedText.schedulerMaxRetries} <span className="scheduler-field-hint">(max: 10)</span>
                    </label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={0}
                      max={10}
                      value={schedulerConfigDraft.maxRetries}
                      onChange={(event) =>
                        setSchedulerConfigDraft((prev) =>
                          prev ? { ...prev, maxRetries: Number(event.target.value) || 0 } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="single-agent-field">
                    <label className="single-agent-label">
                      {advancedText.schedulerRetryDelay} <span className="scheduler-field-hint">(max: 60)</span>
                    </label>
                    <input
                      className="single-agent-input"
                      type="number"
                      min={0}
                      max={60}
                      value={schedulerConfigDraft.retryDelayMinutes}
                      onChange={(event) =>
                        setSchedulerConfigDraft((prev) =>
                          prev ? { ...prev, retryDelayMinutes: Number(event.target.value) || 0 } : prev,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="single-agent-field">
                  <label className="single-agent-label">{advancedText.schedulerInputLabel}</label>
                  <input
                    className="single-agent-input"
                    value={schedulerConfigDraft.schedulerInput}
                    onChange={(event) =>
                      setSchedulerConfigDraft((prev) =>
                        prev ? { ...prev, schedulerInput: event.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="managerial-scheduler-modal-footer">
                <button type="button" className="managerial-scheduler-secondary-btn" onClick={closeSchedulerConfigPanel}>
                  {advancedText.cancel}
                </button>
                <button type="button" className="managerial-scheduler-primary-btn" onClick={saveSchedulerConfig}>
                  {advancedText.schedulerCreateButton}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {renderInstructionGeneratorModal(selectedManagerialAgent.name, true, (generatedText) => {
          if (instructionGeneratorField === 'role') {
            updateSelectedManagerialAgent((prev) => ({
              ...prev,
              agentRole: generatedText,
            }))
            return
          }
          updateSelectedManagerialAgent((prev) => ({
            ...prev,
            agentInstructions: generatedText,
            instructions: generatedText,
            generatedPrompt: generatedText,
          }))
        })}
        {renderAgentDetailFieldModal()}
        {renderAgentPublishModal()}
        {renderAgentFreezeModal()}
        {renderAgentNoticeToast()}
      </section>
    )
  }

  // ─── Page routing ──────────────────────────────────────────────────────────
  if (selectedSingleAgent) return renderSingleAgentSettingsPage()
  if (selectedManagerialAgent) {
    return (
      <>
        {isOnboardingWorkflowOpen ? (
          <OnboardingWorkflowPage
            key={`onboarding-wf-run-${onboardingRunTestRemountKey}`}
            managerName={selectedManagerialAgent.name}
            modelConfig={selectedManagerialAgent.modelConfig}
            instructions={selectedManagerialAgent.instructions}
            generatedPrompt={selectedManagerialAgent.generatedPrompt}
            managerAgents={selectedManagerialAgent.managerAgents}
            advancedConfig={selectedManagerialAgent.advancedConfig}
            hiddenAgentNames={
              onboardingWorkflowEntrySource === 'manager-edit'
                ? ['HR 文档处理Agent', '通知与跟进Agent']
                : undefined
            }
            initialView={onboardingWorkflowInitialView}
            workflowPreset={
              /入职|onboarding/i.test(selectedManagerialAgent.name) ? 'plan-onboarding' : 'default'
            }
            onBack={() => {
              setShowPlanWorkflowBootstrapModal(false)
              setOnboardingWorkflowInitialView('build')
              setOnboardingWorkflowEntrySource('default')
              setIsOnboardingWorkflowOpen(false)
            }}
          />
        ) : (
          renderManagerialAgentSettingsPage ? renderManagerialAgentSettingsPage() : null
        )}
        {showPlanWorkflowBootstrapModal && isOnboardingWorkflowOpen ? (
          <div className="single-agent-modal-layer plan-workflow-entry-modal" role="presentation">
            <div
              className="single-agent-modal-backdrop"
              aria-hidden="true"
              onClick={() => setShowPlanWorkflowBootstrapModal(false)}
            />
            <div
              className="single-agent-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="plan-workflow-entry-title"
            >
              <div id="plan-workflow-entry-title" className="single-agent-modal-title">
                继续创建入职工作流
              </div>
              <div className="single-agent-modal-subtitle">
                已打开与 Plan 采集链对齐的画布预设。返回首页后将默认使用 Plan Mode 继续与 Joyce 对话；Build
                仍可在画布内编辑节点（演示）。
              </div>
              <div className="plan-workflow-entry-mode-pill" role="status">
                <span className="plan-workflow-entry-mode-pill-dot" aria-hidden="true" />
                Plan Mode 已选中
              </div>
              <label className="sr-only" htmlFor="plan-workflow-entry-textarea">
                入职工作流相关说明
              </label>
              <textarea
                id="plan-workflow-entry-textarea"
                className="single-agent-modal-textarea"
                rows={4}
                placeholder="例如：覆盖范围、协作角色、希望接入的系统（Notion / Slack）、办公物品派发等"
                value={planWorkflowBootstrapText}
                onChange={(e) => setPlanWorkflowBootstrapText(e.target.value)}
              />
              <div className="single-agent-modal-actions plan-workflow-entry-actions">
                <button
                  type="button"
                  className="onboarding-workflow-ghost-btn"
                  onClick={() => setShowPlanWorkflowBootstrapModal(false)}
                >
                  稍后再说
                </button>
                <button
                  type="button"
                  className="single-agent-modal-submit"
                  onClick={() => {
                    onStartPlanCreationFromWorkflowLibrary?.(planWorkflowBootstrapText)
                    setShowPlanWorkflowBootstrapModal(false)
                  }}
                >
                  开始创建
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {renderAgentPublishModal()}
        {renderAgentFreezeModal()}
        {renderAgentNoticeToast()}
      </>
    )
  }
  return (
    <>
      <AgentCardsGrid
        title={locale === 'zh' ? 'Agent库' : 'Agents'}
        subtitle={<AgentLibraryPageTagline />}
        primaryActionLabel={locale === 'zh' ? '+ 新建 Agent' : '+ Create Agent'}
        showPrimaryAction={canCreateAgent}
        onPrimaryActionClick={handleCreateAgent}
        tabs={[
          { key: 'all', label: locale === 'zh' ? '全部' : 'All', count: agentsWithDerived.length },
          { key: 'single', label: locale === 'zh' ? '单 Agent' : 'Agent', count: singleAgents.length },
          { key: 'managerial', label: locale === 'zh' ? '管理 Agent' : 'Manager Agent', count: managerialAgents.length },
        ]}
        activeTab={agentsTab}
        onTabChange={(k) => setAgentsTab(k as typeof agentsTab)}
        showViewToggle
        viewMode={agentsViewMode}
        onViewModeChange={setAgentsViewMode}
        searchValue={agentsSearchQuery}
        onSearchChange={setAgentsSearchQuery}
        searchPlaceholder={
          locale === 'zh' ? '搜索 Agent 或描述…' : 'Search agents or descriptions…'
        }
        items={displayFilteredAgents}
        tagLabel={(a) => getAgentCardTagLabel(agentsTab === 'managerial' ? 'Managerial Agent' : a.tag, locale)}
        getCardStatusBadges={(item) => {
          if (isAgentFrozen(item.name)) {
            return [getAgentFrozenStatusBadge(locale)]
          }
          if (showAgentPublishedBadge(item.name)) {
            return [getAgentPublishedStatusBadge(locale)]
          }
          return []
        }}
        onEditItem={(item) => setCardEditAgentName(item.name)}
        onOpenSingleAgent={(item) => openSingleAgentSettings(item as unknown as Agent)}
        onOpenManagerialAgent={(item) => openManagerialAgentSettings(item as unknown as Agent)}
        onDuplicateItem={
          canCreateAgent
            ? (item) => {
                duplicateAgentByName(item.name)
              }
            : undefined
        }
        onPublishItem={openAgentPublishModal}
        isPublishItemDisabled={(item) => !canPublishAgent(item.name)}
        isItemFrozen={(item) => isAgentFrozen(item.name)}
        onActivateItem={handleActivateAgent}
        onFreezeItem={openAgentFreezeModal}
        onDeleteItem={
          canDeleteAgent
            ? (item) => {
          clearAgentPublishState(item.name)
          removeUserContentByKey(item.name)
          setAgents((prev) => prev.filter((x) => x.name !== item.name))
          setSingleAgentSettingsByKey((prev) => {
            if (!(item.name in prev)) return prev
            const next = { ...prev }; delete next[item.name]; return next
          })
          setManagerialAgentSettingsByKey((prev) => {
            if (!(item.name in prev)) return prev
            const next = { ...prev }; delete next[item.name]; return next
          })
          setSelectedSingleAgentKey((prev) => (prev === item.name ? null : prev))
          setSelectedManagerialAgentKey((prev) => (prev === item.name ? null : prev))
          showAgentNotice(noticeText.agentDeleted, noticeText.agentDeletedSub)
            }
            : undefined
        }
      />
      {cardEditAgent ? (
        <AgentCardEditModal
          locale={locale}
          open
          modalTitle={locale === 'zh' ? '编辑 Agent' : 'Edit Agent'}
          nameLabel={locale === 'zh' ? '名称' : 'Name'}
          descriptionLabel={locale === 'zh' ? '描述' : 'Description'}
          cancelLabel={locale === 'zh' ? '取消' : 'Cancel'}
          saveLabel={locale === 'zh' ? '保存' : 'Save'}
          initialName={cardEditAgent.name}
          initialDescription={cardEditAgent.desc}
          onClose={() => setCardEditAgentName(null)}
          onSave={(draft) => handleAgentCardEditSave(cardEditAgent.name, draft)}
        />
      ) : null}
      {createAgentModalOpen ? (
        <CreateAgentModal
          open={createAgentModalOpen}
          onClose={() => setCreateAgentModalOpen(false)}
          onCreate={handleCreateAgentSubmit}
        />
      ) : null}
      {renderAgentPublishModal()}
      {renderAgentFreezeModal()}
      {renderAgentNoticeToast()}
    </>
  )
}
