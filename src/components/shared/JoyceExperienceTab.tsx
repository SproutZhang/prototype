import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EXPERIENCE_AVATAR_MAP } from '../../data/experienceAvatars'
import {
  buildIciHandoffCopy,
  createDefaultIciFlowContext,
  getApplicableIciFlowSteps,
  getIciStepFirstAgent,
  getIciStepLastAgent,
  getIciStepUtterance,
  mapIciAgentToRuntimeAgent,
  resolveHandoffAgent,
  type IciAgentKey,
  type IciEmploymentType,
  type IciFlowContext,
  type IciFlowStepDef,
} from '../../data/experienceIciOnboardingFlow'
import { useLocale } from '../../i18n/LocaleContext'
import type { SharedOnboardingTriggerKind } from '../../types/onboardingTrigger'

export type ExperienceStage = 'welcome' | 'hr' | 'it' | 'device' | 'culture' | 'followup' | 'schedule'
export type AgentId = 'joyce' | 'hr' | 'it' | 'device' | 'culture' | 'followup' | 'schedule'
export type ProgressId = 'personal' | 'account' | 'device' | 'culture' | 'followup'
export type ProgressStatus = 'completed' | 'active' | 'pending'

export type PendingSystemAction = null | { type: 'finish-followup-recap' }

export type JoyceExperienceSnapshot = {
  version: 1
  sessionId: string
  onboardingTrigger: SharedOnboardingTriggerKind
  currentAgentId: AgentId
  stage: ExperienceStage
  progress: Record<ProgressId, ProgressStatus>
  bootstrapped: boolean
  messages: ExperienceMessage[]
  employeeDraft: EmployeeInfoDraft
  itExtraDraft: ItExtraDraft
  deviceDraft: DeviceAddressDraft
  triggerFormDraft: TriggerFormDraft
  viewedCultureModuleIds: string[]
  activeCultureModuleId: string
  pendingResume: { stage: ExperienceStage; agentId: AgentId } | null
  executionVisibility: ExecutionVisibilityState
  scheduledKickoffAt: string
  nextMessageSeq: number
  pendingSystemAction: PendingSystemAction
  progressPercentOverride?: number
  iciFlowStepId: string
  iciFlowContext: IciFlowContext
  iciFlowCompleted: boolean
}

export type ExecutionDetailStep = {
  id: string
  title: string
  summary: string
  detailLines: string[]
  output: string
}

export type ExecutionAgentStage = {
  id: AgentId
  stageLabel: string
  agentName: string
  role: string
  avatar: string
  status: ProgressStatus
  handoverLabel?: string
  summary: string
  steps: ExecutionDetailStep[]
}

export type ExecutionVisibilityState = Record<
  AgentId,
  {
    revealed: boolean
    revealedStepCount: number
    showHandover: boolean
  }
>

type ExecutionStageBlueprint = Omit<ExecutionAgentStage, 'status' | 'steps' | 'handoverLabel'> & {
  steps: ExecutionDetailStep[]
  handoverLabel?: string
}

export type EmployeeInfoDraft = {
  fullName: string
  email: string
  employmentType: IciEmploymentType | ''
  startDate: string
  isRemote: string
  department: string
  directManager: string
  recruiter: string
}

type InfoCollectPhase = 'intro' | 'reviewing' | 'done'

export type ItExtraDraft = {
  extraSystem: string
  reason: string
}

export type DeviceAddressDraft = {
  receiver: string
  mobile: string
  address: string
}

export type TriggerFormDraft = {
  fullName: string
  department: string
  startDate: string
}

export type ExperienceMessage =
  | { id: string; kind: 'agent'; agentId: AgentId; text: string; isStreaming?: boolean }
  | { id: string; kind: 'thinking'; agentId: AgentId }
  | { id: string; kind: 'user'; text: string }
  | {
      id: string
      kind: 'task'
      agentId: AgentId
      taskKey: 'hr' | 'it' | 'device' | 'culture'
      title: string
      description: string
      statusLabel?: string
      note?: string
      actions: { id: string; label: string; primary?: boolean }[]
    }
  | { id: string; kind: 'codegen'; agentId: AgentId; lines: string[] }
  | { id: string; kind: 'form'; agentId: AgentId; formType: 'employee' | 'it-extra' | 'device-address' }
  | { id: string; kind: 'summary'; agentId: AgentId; title: string; items: { label: string; value: string }[] }
  | { id: string; kind: 'handoff'; from: AgentId; to: AgentId; title: string; hint: string }
  | { id: string; kind: 'culture-browser'; agentId: AgentId }

const EXECUTION_STAGE_ORDER: AgentId[] = ['hr', 'it', 'device', 'followup', 'schedule']

const CULTURE_MODULES = [
  {
    id: 'mission',
    label: '公司使命与价值观',
    description: '了解团队默认的价值判断方式，帮助新人更快进入统一的工作语境。',
    checklist: ['理解用户价值优先', '明确 owner 与结果', '先对齐 why 再进入执行'],
  },
  {
    id: 'collaboration',
    label: '团队协作方式',
    description: '熟悉跨职能小队的协作节奏，知道什么事情该异步、什么事情该同步。',
    checklist: ['默认异步推进事项', '复杂问题发起同步讨论', '所有跨职能事项都要记录 owner 和 deadline'],
  },
  {
    id: 'communication',
    label: '日常沟通规范',
    description: '掌握团队内部的沟通习惯，减少信息来回和上下文丢失。',
    checklist: ['先给结论再补背景', '同步阻塞点和影响范围', '升级问题时提供建议的 next action'],
  },
  {
    id: 'week-one',
    label: '新人第一周建议',
    description: '第一周建议按固定节奏熟悉团队、工具和文档，尽快建立反馈闭环。',
    checklist: ['先熟悉常用工具', '主动预约 1:1', '把不确定的问题尽快提出来'],
  },
] as const

const CONTINUE_ALIASES = ['继续', '继续吧', '继续流程', '好', '好的', '可以', 'ok']
const OFF_TOPIC_PATTERN = /产品团队|组织架构|团队规模|leader|汇报关系/
const HANDOFF_DELAY_MS = 3000

function estimateExperienceMessageDuration(message: ExperienceMessage) {
  if (message.kind === 'agent') {
    const leadingDelay = 260
    const streamDuration = Math.min(1600, Math.max(780, Math.ceil(message.text.length * 16)))
    return leadingDelay + 920 + streamDuration
  }
  if (message.kind === 'form') return 260 + 1580
  if (message.kind === 'handoff') return 180
  return 120
}

const INITIAL_EMPLOYEE_DRAFT: EmployeeInfoDraft = {
  fullName: '',
  email: '',
  employmentType: '',
  startDate: '',
  isRemote: '',
  department: '',
  directManager: '',
  recruiter: '',
}

const EMPLOYEE_FIELD_LABELS_ZH: Record<keyof EmployeeInfoDraft, string> = {
  fullName: '新员工姓名',
  email: '新员工邮箱',
  employmentType: '入职类型',
  startDate: '入职日期',
  isRemote: '是否远程办公',
  department: '部门',
  directManager: '直属经理',
  recruiter: '招聘负责人',
}

const EMPLOYEE_FIELD_LABELS_EN: Record<keyof EmployeeInfoDraft, string> = {
  fullName: 'Employee name',
  email: 'Employee email',
  employmentType: 'Employment type',
  startDate: 'Start date',
  isRemote: 'Remote work',
  department: 'Department',
  directManager: 'Direct manager',
  recruiter: 'Recruiter',
}

function deriveInfoCollectPhase(snapshot: JoyceExperienceSnapshot): InfoCollectPhase {
  if (snapshot.iciFlowStepId !== 'info-collect' || snapshot.stage !== 'hr') {
    return 'done'
  }
  const duringMarkerZh = '我已经收到你提供的信息'
  const duringMarkerEn = 'I have received the information you provided'
  const hasDuring = (snapshot.messages ?? []).some(
    (message) =>
      message.kind === 'agent' &&
      message.agentId === 'hr' &&
      typeof message.text === 'string' &&
      (message.text.includes(duringMarkerZh) || message.text.includes(duringMarkerEn)),
  )
  return hasDuring ? 'reviewing' : 'intro'
}

function getMissingEmployeeFields(draft: EmployeeInfoDraft) {
  return (Object.keys(EMPLOYEE_FIELD_LABELS_ZH) as Array<keyof EmployeeInfoDraft>).filter((key) => {
    const value = String(draft[key]).trim()
    return !value || value === '待补充'
  })
}

function normalizeEmployeeStartDate(raw: string) {
  const match = raw.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
  if (!match) return raw.trim()
  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseEmployeeInfoFromText(text: string, prev: EmployeeInfoDraft): EmployeeInfoDraft {
  const next = { ...prev }
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/)
  if (emailMatch) next.email = emailMatch[0]

  const labeledPatterns: Array<{ key: keyof EmployeeInfoDraft; pattern: RegExp }> = [
    { key: 'fullName', pattern: /(?:新员工姓名|姓名|name)[:：\s]+([^\n,，；;]+)/i },
    { key: 'email', pattern: /(?:新员工邮箱|邮箱|email)[:：\s]+([^\s,，；;]+)/i },
    { key: 'startDate', pattern: /(?:入职日期|到岗日期|start date)[:：\s]+([^\n,，；;]+)/i },
    { key: 'department', pattern: /(?:部门|department)[:：\s]+([^\n,，；;]+)/i },
    { key: 'directManager', pattern: /(?:直属经理|direct manager)[:：\s]+([^\n,，；;]+)/i },
    { key: 'recruiter', pattern: /(?:招聘负责人|招聘|recruiter)[:：\s]+([^\n,，；;]+)/i },
    { key: 'isRemote', pattern: /(?:是否远程办公|远程办公|remote)[:：\s]*(是|否|yes|no)/i },
  ]
  for (const { key, pattern } of labeledPatterns) {
    const match = text.match(pattern)
    if (!match) continue
    const value = match[1].trim()
    next[key] = key === 'startDate' ? normalizeEmployeeStartDate(value) : value
  }

  if (/全职|full[- ]?time/i.test(text)) next.employmentType = 'fulltime'
  else if (/兼职|part[- ]?time/i.test(text)) next.employmentType = 'parttime'
  else if (/实习|intern/i.test(text)) next.employmentType = 'intern'
  else if (/合同工|contract/i.test(text)) next.employmentType = 'contract'
  else if (/postee/i.test(text)) next.employmentType = 'postee'

  if (!next.isRemote) {
    if (/(?:远程办公|远程工作|remote work)/i.test(text)) next.isRemote = /否|no/i.test(text) ? '否' : '是'
  }
  if (next.isRemote) {
    next.isRemote = /^(是|yes|true|远程)/i.test(next.isRemote) ? '是' : '否'
  }

  const inlineDate = text.match(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?/)
  if (inlineDate && !next.startDate) {
    next.startDate = normalizeEmployeeStartDate(inlineDate[0])
  }

  return next
}

const INITIAL_IT_EXTRA_DRAFT: ItExtraDraft = {
  extraSystem: 'Figma Enterprise',
  reason: '需要参与设计评审与组件库维护。',
}

const INITIAL_DEVICE_DRAFT: DeviceAddressDraft = {
  receiver: 'Juhoon',
  mobile: '13251521452',
  address: '上海市浦东新区张江路 88 号',
}

function getExperienceAgents(locale: 'zh' | 'en') {
  return {
    joyce: {
      name: locale === 'zh' ? '流程编排Agent' : 'Orchestration Agent',
      role: locale === 'zh' ? '主控协调' : 'Main',
      status: locale === 'zh' ? '正在监控协作流程预览' : 'Monitoring the collaboration preview',
      currentTask: locale === 'zh' ? '引导用户进入下一步' : 'Guide the user into the next step',
      avatar: EXPERIENCE_AVATAR_MAP.joyce,
    },
    hr: {
      name: locale === 'zh' ? '信息收集' : 'Information Collection',
      role: locale === 'zh' ? '基础信息收集' : 'Baseline information collection',
      status: locale === 'zh' ? '正在收集基础资料' : 'Collecting baseline information',
      currentTask: locale === 'zh' ? '确认基础信息' : 'Confirm baseline information',
      avatar: EXPERIENCE_AVATAR_MAP.hr,
    },
    it: {
      name: locale === 'zh' ? '案件登记' : 'Case Registration',
      role: locale === 'zh' ? '案件档案' : 'Case filing',
      status: locale === 'zh' ? '正在创建 Case ID' : 'Creating the Case ID',
      currentTask: locale === 'zh' ? '登记入职案件' : 'Register onboarding case',
      avatar: EXPERIENCE_AVATAR_MAP.it,
    },
    device: {
      name: locale === 'zh' ? '创建任务' : 'Task Creation',
      role: locale === 'zh' ? '任务拆解' : 'Task breakdown',
      status: locale === 'zh' ? '正在生成跟进任务' : 'Generating follow-up tasks',
      currentTask: locale === 'zh' ? '确认任务清单' : 'Confirm the task list',
      avatar: EXPERIENCE_AVATAR_MAP.device,
    },
    culture: {
      name: locale === 'zh' ? '创建任务' : 'Task Creation',
      role: locale === 'zh' ? '任务拆解' : 'Task breakdown',
      status: locale === 'zh' ? '正在生成跟进任务' : 'Generating follow-up tasks',
      currentTask: locale === 'zh' ? '确认任务清单' : 'Confirm the task list',
      avatar: EXPERIENCE_AVATAR_MAP.culture,
    },
    followup: {
      name: locale === 'zh' ? '沟通智能体' : 'Communication Agent',
      role: locale === 'zh' ? '邮件通知' : 'Email notification',
      status: locale === 'zh' ? '正在生成并发送通知邮件' : 'Generating and sending notification emails',
      currentTask: locale === 'zh' ? '发送流程通知邮件' : 'Send workflow notification emails',
      avatar: EXPERIENCE_AVATAR_MAP.followup,
    },
    schedule: {
      name: locale === 'zh' ? '日程创建' : 'Schedule Creation',
      role: locale === 'zh' ? 'Teams 日程' : 'Teams scheduling',
      status: locale === 'zh' ? '正在创建 Day 1 日程' : 'Creating the Day 1 schedule',
      currentTask: locale === 'zh' ? '同步 Outlook 日历' : 'Sync to Outlook calendar',
      avatar: EXPERIENCE_AVATAR_MAP.schedule,
    },
  } satisfies Record<AgentId, { name: string; role: string; status: string; currentTask: string; avatar: string }>
}

function getExecutionStageBlueprints(
  locale: 'zh' | 'en',
  agents: Record<AgentId, { name: string; role: string; status: string; currentTask: string; avatar: string }>,
): Record<AgentId, ExecutionStageBlueprint> {
  return {
    joyce: {
      id: 'joyce',
      stageLabel: 'Joyce',
      agentName: 'Joyce AI',
      role: locale === 'zh' ? '引导与兜底' : 'Guide and fallback',
      avatar: agents.joyce.avatar,
      summary:
        locale === 'zh'
          ? '负责启动 onboarding 体验流，并在末尾收回总结结果。'
          : 'Starts the onboarding experience and receives the final summary at the end.',
      handoverLabel: locale === 'zh' ? '已交接给 HR 文档处理Agent' : 'Handed off to the HR document agent',
      steps: [
        {
          id: 'joyce-01',
          title: locale === 'zh' ? '启动 onboarding 预览' : 'Bootstrap onboarding preview',
          summary:
            locale === 'zh'
              ? '创建体验上下文，并把流程正式交接给第一位业务 Agent。'
              : 'Creates the experience context and formally hands the flow to the first business agent.',
          detailLines:
            locale === 'zh'
              ? ['初始化 onboarding 对话与左侧流程状态。', '展示 welcome 消息，并提示用户输入“开始”。', '流程启动后立即交接给 HR 文档处理Agent。']
              : [
                  'Initialize the onboarding conversation and the workflow status on the left side.',
                  'Show the welcome message and prompt the user to type "Start".',
                  'Hand the flow to the HR document agent immediately after kickoff.',
                ],
          output: locale === 'zh' ? '输出：welcome 消息 + HR handoff。' : 'Output: welcome message + HR handoff.',
        },
        {
          id: 'joyce-02',
          title: locale === 'zh' ? '输出 Joyce 最终总结' : 'Deliver Joyce final recap',
          summary:
            locale === 'zh'
              ? '接收 follow-up 总结，并向用户输出最终 recap。'
              : 'Receives the follow-up summary and delivers the final recap to the user.',
          detailLines:
            locale === 'zh'
              ? ['接收通知与跟进Agent回传的流程总结。', '汇总 5 个阶段的关键结果与后续动作。', '保留继续追问的入口，作为流程收口节点。']
              : [
                  'Receive the workflow summary sent back by the follow-up agent.',
                  'Combine the key results and next actions from all five stages.',
                  'Keep an entry point for follow-up questions as the closing step.',
                ],
          output: locale === 'zh' ? '输出：Joyce Final Recap。' : 'Output: Joyce final recap.',
        },
      ],
    },
    hr: {
      id: 'hr',
      stageLabel: 'HR',
      agentName: agents.hr.name,
      role: agents.hr.role,
      avatar: agents.hr.avatar,
      summary:
        locale === 'zh'
          ? '发起个人信息确认，并在完成后把结果交接给 IT。'
          : 'Starts personal information confirmation and hands the result to IT after completion.',
      handoverLabel: locale === 'zh' ? '已交接给 IT 开通协调Agent' : 'Handed off to the IT provisioning agent',
      steps: [
        {
          id: 'hr-01',
          title: locale === 'zh' ? '发起个人信息任务' : 'Issue employee profile task',
          summary:
            locale === 'zh'
              ? '向用户发送个人信息任务卡，并准备进入表单确认。'
              : 'Sends a personal information task card and prepares the user for form confirmation.',
          detailLines:
            locale === 'zh'
              ? ['展示个人信息任务卡与预计耗时。', '引导用户进入单列表单完成确认。', '保持流程在消息流中完成，不额外跳转页面。']
              : [
                  'Show the personal information task card and estimated time.',
                  'Guide the user into a single-column form for confirmation.',
                  'Keep the flow inside the message stream without navigating away.',
                ],
          output: locale === 'zh' ? '输出：个人信息任务卡。' : 'Output: employee profile task card.',
        },
        {
          id: 'hr-02',
          title: locale === 'zh' ? '确认信息并交接' : 'Confirm profile and handoff',
          summary:
            locale === 'zh'
              ? '确认个人信息摘要，并将账号权限阶段置为 active。'
              : 'Confirms the profile summary and marks the account access stage as active.',
          detailLines:
            locale === 'zh'
              ? ['生成个人信息摘要卡。', '插入 HR -> IT handoff 卡片。', '同步更新左侧 workflow 节点状态。']
              : [
                  'Generate the personal information summary card.',
                  'Insert the HR -> IT handoff card.',
                  'Sync the workflow node status shown on the left.',
                ],
          output: locale === 'zh' ? '输出：个人信息摘要 + IT 阶段 task card。' : 'Output: profile summary + IT stage task card.',
        },
      ],
    },
    it: {
      id: 'it',
      stageLabel: 'IT',
      agentName: agents.it.name,
      role: agents.it.role,
      avatar: agents.it.avatar,
      summary:
        locale === 'zh'
          ? '展示默认权限包，并支持额外系统需求分支。'
          : 'Shows the default access package and supports an extra system request branch.',
      handoverLabel: locale === 'zh' ? '已交接给 设备与权限开通Agent' : 'Handed off to the device logistics agent',
      steps: [
        {
          id: 'it-01',
          title: locale === 'zh' ? '发起开通任务' : 'Issue provisioning task',
          summary:
            locale === 'zh'
              ? '向用户展示默认开通方案，并保留补充需求入口。'
              : 'Shows the default provisioning plan and keeps an entry for extra requirements.',
          detailLines:
            locale === 'zh'
              ? ['展示默认系统列表与说明。', '保留“确认默认开通”和“提交额外需求”两个动作。', '让用户在单栏消息流内完成权限确认。']
              : [
                  'Show the default systems list and explanation.',
                  'Keep both "Confirm default setup" and "Add extra requirements" actions.',
                  'Let the user confirm access within the single-column message stream.',
                ],
          output: locale === 'zh' ? '输出：账号与权限任务卡。' : 'Output: account and access task card.',
        },
        {
          id: 'it-02',
          title: locale === 'zh' ? '确认方案并交接' : 'Resolve access plan and handoff',
          summary:
            locale === 'zh'
              ? '确认默认方案或额外需求后，生成摘要并交接到设备阶段。'
              : 'After confirming the default plan or extra needs, generates a summary and hands off to the device stage.',
          detailLines:
            locale === 'zh'
              ? ['记录默认开通或额外需求结果。', '生成账号权限摘要卡。', '插入 IT -> Device handoff 并激活下一阶段。']
              : [
                  'Record the result of the default setup or extra request.',
                  'Generate the account access summary card.',
                  'Insert the IT -> Device handoff and activate the next stage.',
                ],
          output: locale === 'zh' ? '输出：权限摘要 + Device 阶段 task card。' : 'Output: access summary + device stage task card.',
        },
      ],
    },
    device: {
      id: 'device',
      stageLabel: 'Device',
      agentName: agents.device.name,
      role: agents.device.role,
      avatar: agents.device.avatar,
      summary:
        locale === 'zh'
          ? '确认寄送信息，并在地址确认后进入企业文化阶段。'
          : 'Confirms shipping information and enters the culture stage after the address is confirmed.',
      handoverLabel: locale === 'zh' ? '已交接给 企业文化宣讲Agent' : 'Handed off to the culture onboarding agent',
      steps: [
        {
          id: 'device-01',
          title: locale === 'zh' ? '发起设备寄送任务' : 'Issue device shipping task',
          summary:
            locale === 'zh'
              ? '展示默认设备包和地址确认入口。'
              : 'Shows the default device package and the address confirmation entry.',
          detailLines:
            locale === 'zh'
              ? ['展示默认设备清单与寄送说明。', '保留确认地址和修改地址两种分支。', '让用户直接在消息流中完成物流确认。']
              : [
                  'Show the default device list and shipping notes.',
                  'Keep both confirm-address and edit-address branches.',
                  'Let the user complete logistics confirmation directly in the message stream.',
                ],
          output: locale === 'zh' ? '输出：设备寄送任务卡。' : 'Output: device shipping task card.',
        },
        {
          id: 'device-02',
          title: locale === 'zh' ? '确认寄送信息并交接' : 'Confirm shipping details and handoff',
          summary:
            locale === 'zh'
              ? '确认默认地址或保存新地址后，生成摘要并交接到文化阶段。'
              : 'After confirming the default address or saving a new address, generates a summary and hands off to the culture stage.',
          detailLines:
            locale === 'zh'
              ? ['生成寄送确认或地址更新摘要卡。', '插入 Device -> Culture handoff。', '把企业文化阶段切换为 active。']
              : [
                  'Generate either the shipping confirmation summary or the updated-address summary.',
                  'Insert the Device -> Culture handoff.',
                  'Switch the culture stage to active.',
                ],
          output: locale === 'zh' ? '输出：物流摘要 + Culture 阶段 task card。' : 'Output: logistics summary + culture stage task card.',
        },
      ],
    },
    culture: {
      id: 'culture',
      stageLabel: 'Culture',
      agentName: agents.culture.name,
      role: agents.culture.role,
      avatar: agents.culture.avatar,
      summary:
        locale === 'zh'
          ? '引导浏览文化模块，并在全部完成后触发最终跟进。'
          : 'Guides the user through culture modules and triggers final follow-up after all are complete.',
      handoverLabel: locale === 'zh' ? '已交接给 通知与跟进Agent' : 'Handed off to the follow-up agent',
      steps: [
        {
          id: 'culture-01',
          title: locale === 'zh' ? '打开文化模块浏览器' : 'Open culture browser',
          summary:
            locale === 'zh'
              ? '向用户开放文化模块浏览器，并跟踪已读进度。'
              : 'Opens the culture module browser to the user and tracks reading progress.',
          detailLines:
            locale === 'zh'
              ? ['展示 4 个文化模块的 pills 导航。', '在单栏区域内展示模块内容与操作按钮。', '持续记录已读模块数量，准备最终收口。']
              : [
                  'Show pill navigation for four culture modules.',
                  'Display module content and actions inside the single-column area.',
                  'Keep recording the number of viewed modules in preparation for the final wrap-up.',
                ],
          output: locale === 'zh' ? '输出：文化浏览器 + 已读状态。' : 'Output: culture browser + read status.',
        },
        {
          id: 'culture-02',
          title: locale === 'zh' ? '完成模块并触发跟进' : 'Complete modules and trigger follow-up',
          summary:
            locale === 'zh'
              ? '全部模块完成后生成摘要，并把流程交给通知与跟进Agent。'
              : 'After all modules are complete, generates a summary and hands the flow to the follow-up agent.',
          detailLines:
            locale === 'zh'
              ? ['生成文化模块完成摘要。', '插入 Culture -> Follow-up handoff。', '等待最终 recap 汇总。']
              : [
                  'Generate the culture completion summary.',
                  'Insert the Culture -> Follow-up handoff.',
                  'Wait for the final recap.',
                ],
          output: locale === 'zh' ? '输出：文化总结 + Follow-up 阶段 summary。' : 'Output: culture summary + follow-up stage summary.',
        },
      ],
    },
    followup: {
      id: 'followup',
      stageLabel: 'Follow-up',
      agentName: agents.followup.name,
      role: agents.followup.role,
      avatar: agents.followup.avatar,
      summary:
        locale === 'zh'
          ? '汇总全部关键输出，并把完成结果回交 Joyce AI。'
          : 'Collects all key outputs and returns the completed result to Joyce AI.',
      handoverLabel: locale === 'zh' ? '已回交 Joyce AI' : 'Returned to Joyce AI',
      steps: [
        {
          id: 'followup-01',
          title: locale === 'zh' ? '组装 onboarding 总结' : 'Assemble onboarding recap',
          summary:
            locale === 'zh'
              ? '收集各阶段输出，生成最终单列总结卡。'
              : 'Collects outputs from each stage and generates the final single-column summary card.',
          detailLines:
            locale === 'zh'
              ? ['收集 HR / IT / Device / Culture 的关键信息。', '生成统一的状态与 next action。', '把结果回交 Joyce AI 做最终收口。']
              : [
                  'Collect key information from HR / IT / Device / Culture.',
                  'Generate a unified status and next action.',
                  'Return the result to Joyce AI for the final wrap-up.',
                ],
          output: locale === 'zh' ? '输出：Final onboarding summary。' : 'Output: final onboarding summary.',
        },
      ],
    },
    schedule: {
      id: 'schedule',
      stageLabel: 'Schedule',
      agentName: agents.schedule.name,
      role: agents.schedule.role,
      avatar: agents.schedule.avatar,
      summary:
        locale === 'zh'
          ? '在 Teams / Outlook 中创建 Day 1 入职日程。'
          : 'Creates the Day 1 onboarding schedule in Teams and Outlook.',
      handoverLabel: locale === 'zh' ? '已同步 Day 1 日程' : 'Day 1 schedule synced',
      steps: [
        {
          id: 'schedule-01',
          title: locale === 'zh' ? '创建 Teams 日程' : 'Create Teams schedule',
          summary:
            locale === 'zh'
              ? '根据 Day 1 邮件内容创建日历事件。'
              : 'Creates calendar events based on the Day 1 email content.',
          detailLines:
            locale === 'zh'
              ? ['写入 Day 1 各时段安排。', '同步至直属经理 Outlook 日历。', '等待 Day 1 确认任务创建。']
              : ['Write Day 1 time blocks.', 'Sync to the manager Outlook calendar.', 'Wait for Day 1 confirmation task creation.'],
          output: locale === 'zh' ? '输出：Teams / Outlook 日程。' : 'Output: Teams / Outlook schedule.',
        },
      ],
    },
  }
}

function getCultureModules(locale: 'zh' | 'en') {
  return [
    {
      id: 'mission',
      label: locale === 'zh' ? '公司使命与价值观' : 'Mission and values',
      description:
        locale === 'zh'
          ? '了解团队默认的价值判断方式，帮助新人更快进入统一的工作语境。'
          : 'Learn the team’s default value system so new joiners can enter a shared working context faster.',
      checklist:
        locale === 'zh'
          ? ['理解用户价值优先', '明确 owner 与结果', '先对齐 why 再进入执行']
          : ['Prioritize user value', 'Clarify the owner and outcome', 'Align on the why before execution'],
    },
    {
      id: 'collaboration',
      label: locale === 'zh' ? '团队协作方式' : 'Team collaboration style',
      description:
        locale === 'zh'
          ? '熟悉跨职能小队的协作节奏，知道什么事情该异步、什么事情该同步。'
          : 'Understand the cadence of cross-functional teamwork and know what should be async versus synced live.',
      checklist:
        locale === 'zh'
          ? ['默认异步推进事项', '复杂问题发起同步讨论', '所有跨职能事项都要记录 owner 和 deadline']
          : ['Move standard work forward asynchronously', 'Start synchronous discussions for complex issues', 'Record owner and deadline for all cross-functional work'],
    },
    {
      id: 'communication',
      label: locale === 'zh' ? '日常沟通规范' : 'Daily communication norms',
      description:
        locale === 'zh'
          ? '掌握团队内部的沟通习惯，减少信息来回和上下文丢失。'
          : 'Understand internal communication habits to reduce back-and-forth and avoid context loss.',
      checklist:
        locale === 'zh'
          ? ['先给结论再补背景', '同步阻塞点和影响范围', '升级问题时提供建议的 next action']
          : ['Lead with the conclusion, then add context', 'Share blockers and their impact', 'Include a suggested next action when escalating'],
    },
    {
      id: 'week-one',
      label: locale === 'zh' ? '新人第一周建议' : 'Week-one suggestions',
      description:
        locale === 'zh'
          ? '第一周建议按固定节奏熟悉团队、工具和文档，尽快建立反馈闭环。'
          : 'During the first week, get familiar with the team, tools, and docs in a steady rhythm so feedback loops form quickly.',
      checklist:
        locale === 'zh'
          ? ['先熟悉常用工具', '主动预约 1:1', '把不确定的问题尽快提出来']
          : ['Learn the commonly used tools first', 'Proactively schedule 1:1s', 'Raise uncertain questions as early as possible'],
    },
  ] as const
}

// eslint-disable-next-line react-refresh/only-export-components
export function createInitialExecutionVisibility(): ExecutionVisibilityState {
  return {
    joyce: { revealed: false, revealedStepCount: 0, showHandover: false },
    hr: { revealed: false, revealedStepCount: 0, showHandover: false },
    it: { revealed: false, revealedStepCount: 0, showHandover: false },
    device: { revealed: false, revealedStepCount: 0, showHandover: false },
    culture: { revealed: false, revealedStepCount: 0, showHandover: false },
    followup: { revealed: false, revealedStepCount: 0, showHandover: false },
    schedule: { revealed: false, revealedStepCount: 0, showHandover: false },
  }
}

function stabilizeSnapshotMessages(messages: ExperienceMessage[]) {
  return messages.map((message) =>
    message.kind === 'agent' ? { ...message, isStreaming: false } : message,
  )
}

function resolveExecutionStageStatus(
  agentId: AgentId,
  progress: Record<ProgressId, ProgressStatus>,
  currentAgentId: AgentId,
  hasExecutionRecords: boolean,
): ProgressStatus {
  if (!hasExecutionRecords) return 'pending'

  const progressByAgent: Partial<Record<AgentId, ProgressId>> = {
    hr: 'personal',
    it: 'account',
    device: 'device',
    followup: 'followup',
    schedule: 'followup',
  }

  if (agentId === 'joyce' || agentId === 'culture') {
    return progress.followup === 'completed' ? 'completed' : 'pending'
  }

  const mapped = progressByAgent[agentId]
  if (!mapped) return progress.followup === 'completed' ? 'completed' : 'pending'
  if (mapped === 'completed') return 'completed'
  if (currentAgentId === agentId) return 'active'
  return mapped
}

function buildExecutionStages(
  progress: Record<ProgressId, ProgressStatus>,
  currentAgentId: AgentId,
  executionVisibility: ExecutionVisibilityState,
  executionStageBlueprints: Record<AgentId, ExecutionStageBlueprint>,
): ExecutionAgentStage[] {
  const hasExecutionRecords = EXECUTION_STAGE_ORDER.some((agentId) => executionVisibility[agentId].revealed)

  return EXECUTION_STAGE_ORDER.flatMap((agentId) => {
    const visibility = executionVisibility[agentId]
    if (!visibility.revealed) return []

    const blueprint = executionStageBlueprints[agentId]
    return [
      {
        ...blueprint,
        status: resolveExecutionStageStatus(agentId, progress, currentAgentId, hasExecutionRecords),
        handoverLabel: visibility.showHandover ? blueprint.handoverLabel : undefined,
        steps: blueprint.steps.slice(0, visibility.revealedStepCount),
      },
    ]
  })
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matchesAlias(value: string, aliases: string[]) {
  const current = normalize(value)
  return aliases.some((alias) => normalize(alias) === current)
}

function buildOffTopicReply(text: string, locale: 'zh' | 'en') {
  const normalized = normalize(text)

  if (normalized.includes('产品团队多少人') && normalized.includes('组织架构')) {
    return locale === 'zh'
      ? '当前这个原型里，产品团队按一个约 12 人的跨职能小队来模拟：1 位产品负责人、2 位产品经理、2 位设计师、6 位研发同学和 1 位运营负责人。组织上更偏项目制协作，日常会由产品负责人统一排优先级，再由 PM 按主题拆分需求推进。'
      : 'In this prototype, the product team is modeled as a cross-functional squad of about 12 people: 1 product lead, 2 product managers, 2 designers, 6 engineers, and 1 operations lead. The structure is closer to project-based collaboration, where the product lead sets priorities and PMs break work down by theme.'
  }

  if (normalized.includes('产品团队多少人')) {
    return locale === 'zh'
      ? '当前这个 onboarding 原型里，产品团队按约 12 人规模来模拟，采用精简跨职能小队配置，方便表现需求拆解、设计协作和研发落地之间的衔接关系。'
      : 'In this onboarding prototype, the product team is modeled at roughly 12 people with a lean cross-functional setup so the handoff between requirements, design collaboration, and engineering delivery is easy to demonstrate.'
  }

  if (normalized.includes('组织架构')) {
    return locale === 'zh'
      ? '这个原型里的组织架构采用轻量跨职能协作模式：产品负责人负责方向与优先级，产品经理负责需求拆解，设计师负责交互与视觉，研发负责实现，运营负责上线后的沟通与反馈闭环。'
      : 'The organization in this prototype uses a lightweight cross-functional model: the product lead owns direction and priority, product managers break requirements down, designers own interaction and visuals, engineers implement, and operations closes the loop after launch.'
  }

  if (normalized.includes('团队规模')) {
    return locale === 'zh'
      ? '当前原型默认按一个中小型跨职能团队来演示，规模大约在 10 到 15 人之间，重点是呈现协作关系，而不是精确的人数配置。'
      : 'This prototype defaults to a small-to-mid-sized cross-functional team of around 10 to 15 people. The focus is on showing collaboration patterns rather than an exact headcount.'
  }

  if (normalized.includes('leader') || normalized.includes('汇报关系')) {
    return locale === 'zh'
      ? '在这个原型设定里，业务上由产品负责人作为 owner，对外统一协调；各角色在执行上按项目协作，必要时再向对应职能负责人汇报。'
      : 'In this prototype setup, the product lead acts as the business owner and coordinates externally. Team members collaborate by project during execution and escalate to their functional leads when needed.'
  }

  return locale === 'zh'
    ? '当前原型中的产品团队采用跨职能小队协作模式，由产品、设计、研发和运营共同推进。'
    : 'The product team in this prototype uses a cross-functional squad model where product, design, engineering, and operations move the work forward together.'
}

type JoyceExperienceTabProps = {
  runtimeSessionId?: string
  onboardingTrigger?: SharedOnboardingTriggerKind
  initialSnapshot?: JoyceExperienceSnapshot | null
  showExecutionRecords?: boolean
  onStateChange?: (payload: {
    runtimeSessionId: string
    snapshot: JoyceExperienceSnapshot
    interactionCommitted: boolean
  }) => void
}

function getExperienceTriggerMeta(locale: 'zh' | 'en'): Record<SharedOnboardingTriggerKind, { title: string; subtitle: string; prompt: string }> {
  return {
    chat: {
      title: locale === 'zh' ? '聊天触发' : 'Chat trigger',
      subtitle:
        locale === 'zh'
          ? '发送一条消息后，系统将确认触发并启动入职流程。'
          : 'Send a message to confirm the trigger and start the onboarding flow.',
      prompt:
        locale === 'zh'
          ? '请先在下方输入任意内容，模拟员工通过聊天触发入职流程。'
          : 'Type any message below to simulate an employee triggering the onboarding flow via chat.',
    },
    scheduled: {
      title: locale === 'zh' ? '定时触发' : 'Scheduled trigger',
      subtitle:
        locale === 'zh'
          ? '到达预定时间后自动拉起本次 onboarding，会先展示一张定时启动确认卡。'
          : 'When the scheduled time arrives, onboarding starts automatically and first shows a scheduled kickoff confirmation card.',
      prompt:
        locale === 'zh'
          ? '请先确认触发时间，然后模拟系统按计划自动启动 onboarding。'
          : 'Confirm the kickoff time first, then simulate the system starting onboarding on schedule.',
    },
    form: {
      title: locale === 'zh' ? '表单触发' : 'Form trigger',
      subtitle:
        locale === 'zh'
          ? '员工先提交表单，系统收到表单后再进入正式 onboarding 对话流。'
          : 'The employee submits a form first, and the system enters the formal onboarding conversation after receiving it.',
      prompt:
        locale === 'zh'
          ? '请先完成下方表单提交，模拟表单触发进入 onboarding。'
          : 'Complete the form below first to simulate entering onboarding through a form trigger.',
    },
  }
}

function getDefaultScheduledKickoffAt() {
  const next = new Date()
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, '0')
  const date = String(next.getDate()).padStart(2, '0')
  const hours = String(next.getHours()).padStart(2, '0')
  const minutes = String(next.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${date}T${hours}:${minutes}`
}

// eslint-disable-next-line react-refresh/only-export-components
export function createJoyceExperienceInitialSnapshot(
  onboardingTrigger: SharedOnboardingTriggerKind = 'chat',
  sessionId = `joyce-session-${Date.now()}`,
): JoyceExperienceSnapshot {
  return {
    version: 1,
    sessionId,
    onboardingTrigger,
    currentAgentId: 'joyce',
    stage: 'welcome',
    progress: {
      personal: 'pending',
      account: 'pending',
      device: 'pending',
      culture: 'pending',
      followup: 'pending',
    },
    bootstrapped: false,
    messages: [],
    employeeDraft: INITIAL_EMPLOYEE_DRAFT,
    itExtraDraft: INITIAL_IT_EXTRA_DRAFT,
    deviceDraft: INITIAL_DEVICE_DRAFT,
    triggerFormDraft: {
      fullName: '王晓宁',
      department: 'Product',
      startDate: '2026-05-12',
    },
    viewedCultureModuleIds: [],
    activeCultureModuleId: CULTURE_MODULES[0].id,
    pendingResume: null,
    executionVisibility: createInitialExecutionVisibility(),
    scheduledKickoffAt: getDefaultScheduledKickoffAt(),
    nextMessageSeq: 0,
    pendingSystemAction: null,
    progressPercentOverride: undefined,
    iciFlowStepId: 'info-collect',
    iciFlowContext: createDefaultIciFlowContext(),
    iciFlowCompleted: false,
  }
}

function normalizeInitialSnapshot(
  initialSnapshot: JoyceExperienceSnapshot | null | undefined,
  onboardingTrigger: SharedOnboardingTriggerKind,
) {
  const fallback = createJoyceExperienceInitialSnapshot(onboardingTrigger)
  if (!initialSnapshot) {
    return fallback
  }

  return {
    ...fallback,
    ...initialSnapshot,
    onboardingTrigger: initialSnapshot.onboardingTrigger ?? onboardingTrigger,
    messages: stabilizeSnapshotMessages(initialSnapshot.messages ?? []),
    triggerFormDraft: initialSnapshot.triggerFormDraft ?? fallback.triggerFormDraft,
    employeeDraft: initialSnapshot.employeeDraft ?? fallback.employeeDraft,
    itExtraDraft: initialSnapshot.itExtraDraft ?? fallback.itExtraDraft,
    deviceDraft: initialSnapshot.deviceDraft ?? fallback.deviceDraft,
    viewedCultureModuleIds: initialSnapshot.viewedCultureModuleIds ?? [],
    activeCultureModuleId: initialSnapshot.activeCultureModuleId ?? fallback.activeCultureModuleId,
    pendingResume: initialSnapshot.pendingResume ?? null,
    executionVisibility: initialSnapshot.executionVisibility ?? createInitialExecutionVisibility(),
    scheduledKickoffAt: initialSnapshot.scheduledKickoffAt ?? fallback.scheduledKickoffAt,
    nextMessageSeq: initialSnapshot.nextMessageSeq ?? 0,
    pendingSystemAction: initialSnapshot.pendingSystemAction ?? null,
    progressPercentOverride: initialSnapshot.progressPercentOverride,
    iciFlowStepId: initialSnapshot.iciFlowStepId ?? fallback.iciFlowStepId,
    iciFlowContext: initialSnapshot.iciFlowContext ?? fallback.iciFlowContext,
    iciFlowCompleted: initialSnapshot.iciFlowCompleted ?? fallback.iciFlowCompleted,
  }
}

export function JoyceExperienceTab({
  runtimeSessionId = 'runtime-default',
  onboardingTrigger = 'chat',
  initialSnapshot,
  showExecutionRecords = false,
  onStateChange,
}: JoyceExperienceTabProps) {
  const { locale } = useLocale()
  const startingSnapshot = normalizeInitialSnapshot(initialSnapshot, onboardingTrigger)
  const agents = useMemo(() => getExperienceAgents(locale), [locale])
  const executionStageBlueprints = useMemo(() => getExecutionStageBlueprints(locale, agents), [agents, locale])
  const cultureModules = useMemo(() => getCultureModules(locale), [locale])
  const [bootstrapped, setBootstrapped] = useState(startingSnapshot.bootstrapped)
  const [stage, setStage] = useState<ExperienceStage>(startingSnapshot.stage)
  const [currentAgentId, setCurrentAgentId] = useState<AgentId>(startingSnapshot.currentAgentId)
  const [messages, setMessages] = useState<ExperienceMessage[]>(startingSnapshot.messages)
  const [progress, setProgress] = useState<Record<ProgressId, ProgressStatus>>(startingSnapshot.progress)
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeInfoDraft>(startingSnapshot.employeeDraft)
  const [infoCollectPhase, setInfoCollectPhase] = useState<InfoCollectPhase>(() =>
    deriveInfoCollectPhase(startingSnapshot),
  )
  const [itExtraDraft, setItExtraDraft] = useState<ItExtraDraft>(startingSnapshot.itExtraDraft)
  const [deviceDraft, setDeviceDraft] = useState<DeviceAddressDraft>(startingSnapshot.deviceDraft)
  const [pendingResume, setPendingResume] = useState<{ stage: ExperienceStage; agentId: AgentId } | null>(
    startingSnapshot.pendingResume,
  )
  const [viewedCultureModules, setViewedCultureModules] = useState<string[]>(startingSnapshot.viewedCultureModuleIds)
  const [activeCultureModuleId, setActiveCultureModuleId] = useState<string>(startingSnapshot.activeCultureModuleId)
  const [experienceInput, setExperienceInput] = useState('')
  const [scheduledKickoffAt, setScheduledKickoffAt] = useState(startingSnapshot.scheduledKickoffAt)
  const [triggerFormDraft, setTriggerFormDraft] = useState<TriggerFormDraft>(startingSnapshot.triggerFormDraft)
  const [progressPercentOverride, setProgressPercentOverride] = useState<number | undefined>(
    startingSnapshot.progressPercentOverride,
  )
  const [currentTimeLabel, setCurrentTimeLabel] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
  )
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamingLength, setStreamingLength] = useState(0)
  const [codegenLineProgressById, setCodegenLineProgressById] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      startingSnapshot.messages
        .filter((message): message is Extract<ExperienceMessage, { kind: 'codegen' }> => message.kind === 'codegen')
        .map((message) => [message.id, message.lines.length]),
    ),
  )
  const [expandedInlineExecutionStageIds, setExpandedInlineExecutionStageIds] = useState<AgentId[]>([])
  const [expandedExecutionStepIds, setExpandedExecutionStepIds] = useState<string[]>([])
  const [executionVisibility, setExecutionVisibility] = useState<ExecutionVisibilityState>(startingSnapshot.executionVisibility)
  const [iciFlowStepId, setIciFlowStepId] = useState(startingSnapshot.iciFlowStepId)
  const [iciFlowContext, setIciFlowContext] = useState<IciFlowContext>(startingSnapshot.iciFlowContext)
  const [iciFlowCompleted, setIciFlowCompleted] = useState(startingSnapshot.iciFlowCompleted)
  const [pendingSystemAction, setPendingSystemAction] = useState<PendingSystemAction>(
    startingSnapshot.pendingSystemAction,
  )

  const messageSeqRef = useRef(startingSnapshot.nextMessageSeq)
  const previewThreadRef = useRef<HTMLDivElement | null>(null)
  const followupTimerRef = useRef<number | null>(null)
  const queuedMessageTimersRef = useRef<number[]>([])
  const interactionCommittedRef = useRef(false)
  const flowQueueRef = useRef<Array<() => Promise<void>>>([])
  const flowDrainRef = useRef(false)

  const activeCultureModule = cultureModules.find((item) => item.id === activeCultureModuleId) ?? cultureModules[0]
  const executionStages = useMemo(
    () => buildExecutionStages(progress, currentAgentId, executionVisibility, executionStageBlueprints),
    [currentAgentId, executionStageBlueprints, executionVisibility, progress],
  )
  const hasExecutionRecords = executionStages.length > 0
  const triggerMeta = getExperienceTriggerMeta(locale)[onboardingTrigger]
  const isComposerLocked = !bootstrapped && onboardingTrigger !== 'chat'
  const executionStreamStatus: 'idle' | 'live' | 'complete' =
    !hasExecutionRecords ? 'idle' : progress.followup === 'completed' ? 'complete' : 'live'

  useEffect(() => {
    if (!previewThreadRef.current) return
    previewThreadRef.current.scrollTop = previewThreadRef.current.scrollHeight
  }, [messages])

  useEffect(
    () => () => {
      queuedMessageTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      queuedMessageTimersRef.current = []
      if (followupTimerRef.current) {
        window.clearTimeout(followupTimerRef.current)
      }
      flowQueueRef.current = []
    },
    [],
  )

  useEffect(() => {
    const updateTimeLabel = () => {
      setCurrentTimeLabel(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      )
    }

    updateTimeLabel()
    const timer = window.setInterval(updateTimeLabel, 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    onStateChange?.({
      runtimeSessionId,
      interactionCommitted: interactionCommittedRef.current,
      snapshot: {
        version: 1,
        sessionId: startingSnapshot.sessionId,
        onboardingTrigger,
        currentAgentId,
        stage,
        progress,
        bootstrapped,
        messages: stabilizeSnapshotMessages(messages),
        employeeDraft,
        itExtraDraft,
        deviceDraft,
        triggerFormDraft,
        viewedCultureModuleIds: viewedCultureModules,
        activeCultureModuleId,
        pendingResume,
        executionVisibility,
        scheduledKickoffAt,
        nextMessageSeq: messageSeqRef.current,
        pendingSystemAction,
        progressPercentOverride,
        iciFlowStepId,
        iciFlowContext,
        iciFlowCompleted,
      },
    })
  }, [
    activeCultureModuleId,
    bootstrapped,
    currentAgentId,
    deviceDraft,
    employeeDraft,
    executionVisibility,
    iciFlowCompleted,
    iciFlowContext,
    iciFlowStepId,
    itExtraDraft,
    messages,
    onStateChange,
    onboardingTrigger,
    pendingResume,
    pendingSystemAction,
    progress,
    progressPercentOverride,
    runtimeSessionId,
    scheduledKickoffAt,
    stage,
    startingSnapshot.sessionId,
    triggerFormDraft,
    viewedCultureModules,
  ])

  useEffect(() => {
    if (!streamingMessageId) return

    const targetMessage = messages.find(
      (message): message is Extract<ExperienceMessage, { kind: 'agent' }> =>
        message.kind === 'agent' && message.id === streamingMessageId,
    )

    if (!targetMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStreamingMessageId(null)
      setStreamingLength(0)
      return
    }

    if (streamingLength >= targetMessage.text.length) {
      setMessages((prev) =>
        prev.map((message) =>
          message.kind === 'agent' && message.id === streamingMessageId
            ? { ...message, isStreaming: false }
            : message,
        ),
      )
      setStreamingMessageId(null)
      setStreamingLength(0)
      return
    }

    const timer = window.setTimeout(() => {
      setStreamingLength((prev) => Math.min(prev + 4, targetMessage.text.length))
    }, 18)

    return () => window.clearTimeout(timer)
  }, [messages, streamingLength, streamingMessageId])

  useEffect(() => {
    const timers: number[] = []
    messages.forEach((message) => {
      if (message.kind !== 'codegen') return
      const visibleCount = codegenLineProgressById[message.id] ?? 0
      if (visibleCount >= message.lines.length) return
      const timer = window.setTimeout(() => {
        setCodegenLineProgressById((prev) => ({
          ...prev,
          [message.id]: Math.min((prev[message.id] ?? 0) + 1, message.lines.length),
        }))
      }, visibleCount === 0 ? 180 : 260)
      timers.push(timer)
    })
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [codegenLineProgressById, messages])

  const nextId = () => {
    messageSeqRef.current += 1
    return `joyce-exp-${messageSeqRef.current}`
  }

  const markInteractionCommitted = () => {
    interactionCommittedRef.current = true
  }

  const pushMessages = (...nextMessages: ExperienceMessage[]) => {
    setMessages((prev) => [...prev, ...nextMessages])
  }

  const flowDelay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

  const drainFlowQueue = async () => {
    if (flowDrainRef.current) return
    flowDrainRef.current = true
    while (flowQueueRef.current.length > 0) {
      const action = flowQueueRef.current.shift()
      if (!action) continue
      await action()
    }
    flowDrainRef.current = false
    if (flowQueueRef.current.length > 0) {
      void drainFlowQueue()
    }
  }

  const enqueueFlowAction = (action: () => Promise<void>) => {
    flowQueueRef.current.push(action)
    void drainFlowQueue()
  }

  const awaitQueuedMessage = async (message: ExperienceMessage) => {
    queueMessages(message)
    await flowDelay(estimateExperienceMessageDuration(message))
  }

  const queueMessages = (...nextMessages: ExperienceMessage[]) => {
    let elapsed = 0

    nextMessages.forEach((message, index) => {
      const leadingDelay =
        index === 0
          ? message.kind === 'agent' || message.kind === 'form'
            ? 260
            : message.kind === 'handoff'
              ? 180
              : 120
          : message.kind === 'agent' || message.kind === 'form'
            ? 420
            : message.kind === 'handoff'
              ? 360
              : 260
      elapsed += leadingDelay

      if (message.kind === 'agent') {
        const thinkingId = message.id
        const streamDuration = Math.min(1600, Math.max(780, Math.ceil(message.text.length * 16)))
        const timerA = window.setTimeout(() => {
          setMessages((prev) => [...prev, thinkingMessage(message.agentId, thinkingId)])
          queuedMessageTimersRef.current = queuedMessageTimersRef.current.filter((id) => id !== timerA)
        }, elapsed)
        queuedMessageTimersRef.current.push(timerA)

        elapsed += 920
        const timerB = window.setTimeout(() => {
          const streamedMessage = { ...message, isStreaming: true }
          setMessages((prev) => prev.map((item) => (item.id === thinkingId ? streamedMessage : item)))
          setStreamingMessageId(streamedMessage.id)
          setStreamingLength(0)
          queuedMessageTimersRef.current = queuedMessageTimersRef.current.filter((id) => id !== timerB)
        }, elapsed)
        queuedMessageTimersRef.current.push(timerB)
        elapsed += streamDuration
        return
      }

      if (message.kind === 'form') {
        const loadingId = message.id
        const timerA = window.setTimeout(() => {
          setCodegenLineProgressById((prev) => ({ ...prev, [loadingId]: 0 }))
          setMessages((prev) => [...prev, codegenMessage(message.agentId, message.formType, loadingId)])
          queuedMessageTimersRef.current = queuedMessageTimersRef.current.filter((id) => id !== timerA)
        }, elapsed)
        queuedMessageTimersRef.current.push(timerA)

        elapsed += 1580
        const timerB = window.setTimeout(() => {
          setMessages((prev) => prev.map((item) => (item.id === loadingId ? message : item)))
          setCodegenLineProgressById((prev) => {
            const next = { ...prev }
            delete next[loadingId]
            return next
          })
          queuedMessageTimersRef.current = queuedMessageTimersRef.current.filter((id) => id !== timerB)
        }, elapsed)
        queuedMessageTimersRef.current.push(timerB)
        return
      }

      const timer = window.setTimeout(() => {
        setMessages((prev) => [...prev, message])
        queuedMessageTimersRef.current = queuedMessageTimersRef.current.filter((id) => id !== timer)
      }, elapsed)

      queuedMessageTimersRef.current.push(timer)
    })
  }

  const updateLatestTaskCardStatus = (
    taskKey: 'hr' | 'it' | 'device' | 'culture',
    statusLabel: string,
  ) => {
    setMessages((prev) => {
      const next = [...prev]
      for (let index = next.length - 1; index >= 0; index -= 1) {
        const message = next[index]
        if (message.kind === 'task' && message.taskKey === taskKey) {
          next[index] = { ...message, statusLabel }
          break
        }
      }
      return next
    })
  }

  const agentMessage = (agentId: AgentId, text: string): ExperienceMessage => ({
    id: nextId(),
    kind: 'agent',
    agentId,
    text,
  })

  const userMessage = (text: string): ExperienceMessage => ({
    id: nextId(),
    kind: 'user',
    text,
  })

  const thinkingMessage = (agentId: AgentId, id = nextId()): ExperienceMessage => ({
    id,
    kind: 'thinking',
    agentId,
  })

  const codegenMessage = (
    agentId: AgentId,
    formType: 'employee' | 'it-extra' | 'device-address',
    id = nextId(),
  ): ExperienceMessage => ({
    id,
    kind: 'codegen',
    agentId,
    lines:
      formType === 'employee'
        ? [
            'Generating employee_profile_form.tsx',
            'Binding personal info fields...',
            'Attaching validation rules and placeholders...',
          ]
        : formType === 'it-extra'
          ? [
              'Generating it_access_request_form.tsx',
              'Compiling extra system request schema...',
              'Binding textarea and submit actions...',
            ]
          : [
              'Generating device_delivery_update_form.tsx',
              'Syncing shipping address fields...',
              'Preparing logistics confirmation actions...',
            ],
  })

  const handoffMessage = (from: AgentId, to: AgentId, title: string, hint: string): ExperienceMessage => ({
    id: nextId(),
    kind: 'handoff',
    from,
    to,
    title,
    hint,
  })


  const bootstrapExperience = (seedMessages: ExperienceMessage[] = []) => {
    if (bootstrapped) return
    setBootstrapped(true)
    setProgressPercentOverride(undefined)
    if (seedMessages.length > 0) {
      setMessages(seedMessages)
    }
    openHrStage()
  }

  const queueGeneratedForm = (agentId: AgentId, formType: 'employee' | 'it-extra' | 'device-address') => {
    const loadingId = nextId()
    const finalForm: ExperienceMessage = {
      id: loadingId,
      kind: 'form',
      agentId,
      formType,
    }
    setCodegenLineProgressById((prev) => ({ ...prev, [loadingId]: 0 }))
    pushMessages(codegenMessage(agentId, formType, loadingId))
    const timer = window.setTimeout(() => {
      setMessages((prev) => prev.map((message) => (message.id === loadingId ? finalForm : message)))
      setCodegenLineProgressById((prev) => {
        const next = { ...prev }
        delete next[loadingId]
        return next
      })
      queuedMessageTimersRef.current = queuedMessageTimersRef.current.filter((id) => id !== timer)
    }, 1580)
    queuedMessageTimersRef.current.push(timer)
  }

  const startTriggeredExperience = (kickoffLine: string) => {
    bootstrapExperience([userMessage(kickoffLine)])
  }

  const submitScheduledKickoff = () => {
    markInteractionCommitted()
    const kickoffLabel = scheduledKickoffAt
      ? `定时触发已生效，计划在 ${scheduledKickoffAt.replace('T', ' ')} 自动启动本次协作流程。`
      : '定时触发已生效，系统将按预定时间自动启动本次协作流程。'
    startTriggeredExperience(kickoffLabel)
  }

  const submitTriggerFormKickoff = () => {
    markInteractionCommitted()
    const kickoffLabel = `表单触发已提交：${triggerFormDraft.fullName} / ${triggerFormDraft.department} / 启动日期 ${triggerFormDraft.startDate}。`
    startTriggeredExperience(kickoffLabel)
  }

  const openHrStage = () => {
    setStage('hr')
    setCurrentAgentId('hr')
    setProgressPercentOverride(undefined)
    setProgress({
      personal: 'active',
      account: 'pending',
      device: 'pending',
      culture: 'pending',
      followup: 'pending',
    })
    setExecutionVisibility((prev) => ({
      ...prev,
      hr: { revealed: true, revealedStepCount: 1, showHandover: false },
    }))
    setIciFlowStepId('info-collect')
    setIciFlowCompleted(false)
    setInfoCollectPhase('intro')
    const intro =
      getIciStepUtterance(iciFlowContext, 'info-collect', 'before', locale) ??
      (locale === 'zh'
        ? '你好，我是信息收集智能体，请提供新员工入职信息。'
        : 'Hi, I am the information collection agent. Please provide the new hire onboarding details.')
    queueMessages(agentMessage('hr', intro))
  }

  const openItStage = () => {
    setStage('it')
    setCurrentAgentId('it')
    setProgressPercentOverride(undefined)
    setProgress({
      personal: 'completed',
      account: 'active',
      device: 'pending',
      culture: 'pending',
      followup: 'pending',
    })
    setExecutionVisibility((prev) => ({
      ...prev,
      hr: { ...prev.hr, revealed: true, revealedStepCount: 2, showHandover: true },
      it: { revealed: true, revealedStepCount: 1, showHandover: false },
    }))
    queueMessages(
      handoffMessage(
        'hr',
        'it',
        locale === 'zh' ? '信息收集 -> 创建案件并追踪进度' : 'Information collection -> Case creation and tracking',
        locale === 'zh'
          ? '基础信息已收集完成，可以进入案件创建与进度追踪阶段。'
          : 'Baseline information has been collected, so the flow can move into case creation and tracking.',
      ),
      agentMessage(
        'it',
        locale === 'zh'
          ? '您好，我是创建案件并追踪进度 Agent。我会基于已收集的信息创建案件，并生成可追踪的进度视图。'
          : 'Hi, I am the case creation and tracking agent. I will create a case from the collected information and prepare a trackable progress view.',
      ),
      {
        id: nextId(),
        kind: 'task',
        agentId: 'it',
        taskKey: 'it',
        title: locale === 'zh' ? '创建案件并确认追踪方案' : 'Create case and confirm tracking plan',
        description:
          locale === 'zh'
            ? '默认案件模板已准备好。你可以直接确认创建，或者补充案件说明与优先级。'
            : 'The default case template is ready. You can confirm creation directly or add case notes and priority.',
        statusLabel: locale === 'zh' ? '进行中' : 'In progress',
        note:
          locale === 'zh'
            ? '确认后系统会自动把任务交接给创建任务 Agent。'
            : 'After confirmation, the system will automatically hand the task to the task creation agent.',
        actions: [
          { id: 'it-confirm-default', label: locale === 'zh' ? '确认创建案件' : 'Confirm case creation', primary: true },
          { id: 'it-open-extra', label: locale === 'zh' ? '补充案件说明' : 'Add case notes' },
        ],
      },
    )
  }

  const openDeviceStage = () => {
    setStage('device')
    setCurrentAgentId('device')
    setProgressPercentOverride(undefined)
    setProgress({
      personal: 'completed',
      account: 'completed',
      device: 'active',
      culture: 'pending',
      followup: 'pending',
    })
    setExecutionVisibility((prev) => ({
      ...prev,
      it: { ...prev.it, revealed: true, revealedStepCount: 2, showHandover: true },
      device: { revealed: true, revealedStepCount: 1, showHandover: false },
    }))
    queueMessages(
      handoffMessage(
        'it',
        'device',
        locale === 'zh' ? '创建案件并追踪进度 -> 创建任务' : 'Case creation and tracking -> Task creation',
        locale === 'zh'
          ? '案件已创建并进入追踪，可以开始拆解后续执行任务。'
          : 'The case has been created and is now trackable, so follow-up tasks can be created next.',
      ),
      agentMessage(
        'device',
        locale === 'zh'
          ? '您好，我是创建任务 Agent。我会根据案件拆解后续执行任务，并安排负责人、截止时间和执行说明。'
          : 'Hi, I am the task creation agent. I will break the case into follow-up tasks and assign owners, deadlines, and execution notes.',
      ),
      {
        id: nextId(),
        kind: 'task',
        agentId: 'device',
        taskKey: 'device',
        title: locale === 'zh' ? '创建跟进任务' : 'Create follow-up tasks',
        description:
          locale === 'zh'
            ? '请确认任务清单与负责人安排；如需调整，可以直接修改后再继续。'
            : 'Please confirm the task list and owner assignments. Edit them before continuing if needed.',
        statusLabel: locale === 'zh' ? '进行中' : 'In progress',
        note:
          locale === 'zh'
            ? '确认后系统会继续推进到发送邮件阶段。'
            : 'After confirmation, the system will move to the email sending stage.',
        actions: [
          { id: 'device-confirm-address', label: locale === 'zh' ? '确认任务清单' : 'Confirm task list', primary: true },
          { id: 'device-edit-address', label: locale === 'zh' ? '调整任务' : 'Edit tasks' },
        ],
      },
    )
  }

  const finishFollowup = () => {
    setStage('followup')
    setCurrentAgentId('followup')
    setProgressPercentOverride(undefined)
    setProgress({
      personal: 'completed',
      account: 'completed',
      device: 'completed',
      culture: 'completed',
      followup: 'completed',
    })
    setExecutionVisibility((prev) => ({
      ...prev,
      device: { ...prev.device, revealed: true, revealedStepCount: 2, showHandover: true },
      followup: { revealed: true, revealedStepCount: 1, showHandover: false },
    }))
    setPendingSystemAction(null)
    queueMessages(
      handoffMessage(
        'device',
        'followup',
        locale === 'zh' ? '创建任务 -> 发送邮件' : 'Task creation -> Send email',
        locale === 'zh'
          ? '任务清单已确认，流程可以进入邮件通知阶段。'
          : 'The task list has been confirmed, so the flow can move into email notification.',
      ),
      agentMessage(
        'followup',
        locale === 'zh'
          ? '您好，我是发送邮件 Agent。我会汇总前序结果，生成通知邮件并发送给相关干系人。'
          : 'Hi, I am the send email agent. I will summarize the previous steps, generate the notification email, and send it to the relevant stakeholders.',
      ),
      {
        id: nextId(),
        kind: 'summary',
        agentId: 'followup',
        title: locale === 'zh' ? '邮件发送预览' : 'Email send preview',
        items: [
          {
            label: locale === 'zh' ? '收件人' : 'Recipients',
            value: locale === 'zh' ? '业务负责人 / 执行同学 / 相关协作方' : 'Business owner / Executors / Collaborators',
          },
          {
            label: locale === 'zh' ? '邮件主题' : 'Subject',
            value: locale === 'zh' ? '【流程通知】信息收集、案件与任务已全部完成' : '[Workflow Notice] Information, case, and tasks are complete',
          },
          {
            label: locale === 'zh' ? '发送状态' : 'Send status',
            value: locale === 'zh' ? '已发送' : 'Sent',
          },
        ],
      },
      agentMessage(
        'followup',
        locale === 'zh'
          ? `🎉 全流程已经顺利完成。
📝 信息收集结果已归档
📂 案件已创建并进入追踪
✅ 跟进任务已生成并分配
📧 通知邮件已发送给相关干系人
如需查看案件进度或任务详情，可以继续在这里提问。`
          : `🎉 The full workflow has been completed successfully.
📝 Collected information has been archived
📂 The case has been created and is now trackable
✅ Follow-up tasks have been generated and assigned
📧 Notification emails have been sent to the relevant stakeholders
You can keep asking here if you want to review case progress or task details.`,
      ),
    )
  }

  const handleResume = () => {
    if (!pendingResume) return
    setStage(pendingResume.stage)
    setCurrentAgentId(pendingResume.agentId)
    setPendingResume(null)
    queueMessages(
      agentMessage(
        pendingResume.agentId,
        locale === 'zh'
          ? '我们已经回到主流程，可以继续刚才的任务。你也可以直接点击下方卡片继续推进。'
          : 'We are back in the main flow now. You can continue the previous task or click the card below to move on.',
      ),
    )
  }

  const handleOffTopic = (question: string) => {
    const reply = buildOffTopicReply(question, locale)
    queueMessages(
      agentMessage(
        currentAgentId,
        locale === 'zh'
          ? `${reply} 若你准备好了，请回复“继续”，我会带你回到当前流程步骤。`
          : `${reply} When you're ready, reply "Continue" and I will bring you back to the current workflow step.`,
      ),
    )
  }

  const handleExperienceSend = () => {
    const text = experienceInput.trim()
    if (!text) return
    markInteractionCommitted()

    if (!bootstrapped) {
      if (onboardingTrigger === 'chat') {
        setExperienceInput('')
        startTriggeredExperience(text)
      }
      return
    }

    pushMessages(userMessage(text))
    setExperienceInput('')

    if (pendingResume && matchesAlias(text, CONTINUE_ALIASES)) {
      handleResume()
      return
    }

    if (OFF_TOPIC_PATTERN.test(text)) {
      setPendingResume({ stage, agentId: currentAgentId })
      handleOffTopic(text)
      return
    }

    if (stage === 'welcome') {
      openHrStage()
      return
    }

    if (stage === 'hr' && currentAgentId === 'hr' && infoCollectPhase !== 'done') {
      const mergedDraft = parseEmployeeInfoFromText(text, employeeDraft)
      setEmployeeDraft(mergedDraft)

      if (infoCollectPhase === 'intro') {
        const duringText =
          getIciStepUtterance(iciFlowContext, 'info-collect', 'during', locale) ??
          (locale === 'zh'
            ? '我已经收到你提供的信息，正在核对并整理中，请稍等。如果有缺失，我会继续向你询问缺失项。'
            : 'I have received the information you provided and am reviewing it now. Please wait a moment. If anything is missing, I will ask you for the remaining items.')
        const duringMessage = agentMessage('hr', duringText)
        setInfoCollectPhase('reviewing')
        enqueueFlowAction(async () => {
          await awaitQueuedMessage(duringMessage)
          await reviewEmployeeInfoAsync(mergedDraft)
        })
        return
      }

      if (infoCollectPhase === 'reviewing') {
        enqueueFlowAction(async () => {
          await reviewEmployeeInfoAsync(mergedDraft)
        })
        return
      }
    }

    queueMessages(
      agentMessage(
        currentAgentId,
        locale === 'zh'
          ? '当前阶段更适合通过卡片按钮继续推进；你也可以继续提问，我会在不打断主流程的前提下给出提示。'
          : 'This stage is better advanced through the card actions, but you can still ask questions and I will help without interrupting the main flow.',
      ),
    )
  }

  const handleTaskAction = (actionId: string) => {
    markInteractionCommitted()
    switch (actionId) {
      case 'hr-start':
        updateLatestTaskCardStatus('hr', locale === 'zh' ? '已确认' : 'Confirmed')
        queueMessages(
          agentMessage(
            'hr',
            getIciStepUtterance(iciFlowContext, 'info-collect', 'during', locale) ??
              (locale === 'zh'
                ? '我已经收到你提供的信息，正在核对并整理中，请稍等。如果有缺失，我会继续向你询问缺失项。'
                : 'I have received the information you provided and am reviewing it now. Please wait a moment. If anything is missing, I will ask you for the remaining items.'),
          ),
        )
        setInfoCollectPhase('reviewing')
        return
      case 'hr-later':
        queueMessages(
          agentMessage(
            'hr',
            locale === 'zh'
              ? '好的，我会保留这张任务卡。准备好后，你可以点击“开始填写”继续。'
              : 'Okay, I will keep this task card here. When you are ready, click "Start now" to continue.',
          ),
        )
        return
      case 'it-confirm-default':
        updateLatestTaskCardStatus('it', locale === 'zh' ? '已完成' : 'Completed')
        pushMessages(
          userMessage(locale === 'zh' ? '确认创建案件' : 'Confirm case creation'),
          {
            id: nextId(),
            kind: 'summary',
            agentId: 'it',
            title: locale === 'zh' ? '案件已创建' : 'Case created',
            items: [
              {
                label: locale === 'zh' ? '案件编号' : 'Case ID',
                value: locale === 'zh' ? 'CASE-2026-0512-001' : 'CASE-2026-0512-001',
              },
              {
                label: locale === 'zh' ? '当前状态' : 'Current status',
                value: locale === 'zh' ? '已进入进度追踪' : 'Now in progress tracking',
              },
              { label: locale === 'zh' ? '下一步' : 'Next step', value: locale === 'zh' ? '进入任务创建' : 'Move to task creation' },
            ],
          },
        )
        openDeviceStage()
        return
      case 'it-open-extra':
        updateLatestTaskCardStatus('it', locale === 'zh' ? '已确认' : 'Confirmed')
        queueGeneratedForm('it', 'it-extra')
        return
      case 'it-back-default':
        queueMessages(
          agentMessage(
            'it',
            locale === 'zh'
              ? '已返回默认案件模板，你也可以直接点击“确认创建案件”继续。'
              : 'You are back to the default case template. You can also click "Confirm case creation" to continue.',
          ),
        )
        return
      case 'device-confirm-address':
        updateLatestTaskCardStatus('device', locale === 'zh' ? '已完成' : 'Completed')
        pushMessages(
          userMessage(locale === 'zh' ? '确认任务清单' : 'Confirm task list'),
          {
            id: nextId(),
            kind: 'summary',
            agentId: 'device',
            title: locale === 'zh' ? '任务已创建' : 'Tasks created',
            items: [
              {
                label: locale === 'zh' ? '任务数量' : 'Task count',
                value: locale === 'zh' ? '3 项跟进任务' : '3 follow-up tasks',
              },
              {
                label: locale === 'zh' ? '负责人' : 'Owners',
                value: locale === 'zh' ? '业务负责人 / 执行同学 / 协作支持' : 'Business owner / Executor / Support',
              },
              { label: locale === 'zh' ? '下一步' : 'Next step', value: locale === 'zh' ? '进入邮件发送' : 'Move to email sending' },
            ],
          },
        )
        finishFollowup()
        return
      case 'device-edit-address':
        updateLatestTaskCardStatus('device', locale === 'zh' ? '已确认' : 'Confirmed')
        queueGeneratedForm('device', 'device-address')
        return
      case 'device-cancel-edit':
        queueMessages(
          agentMessage(
            'device',
            locale === 'zh'
              ? '已取消任务调整，仍可继续使用当前任务清单进入邮件发送。'
              : 'Task editing has been cancelled. You can still continue with the current task list and move to email sending.',
          ),
        )
        return
      case 'culture-open-browser':
        updateLatestTaskCardStatus('culture', locale === 'zh' ? '已确认' : 'Confirmed')
        pushMessages({ id: nextId(), kind: 'culture-browser', agentId: 'culture' })
        return
      case 'culture-question':
        queueMessages(
          agentMessage(
            'culture',
            locale === 'zh'
              ? '你可以先浏览模块内容；如果是与组织或团队相关的题外话，也可以直接输入问题，我会由 Joyce 接管并再恢复流程。'
              : 'You can browse the modules first. If you have off-topic questions about the organization or team, type them directly and Joyce will take over before restoring the flow.',
          ),
        )
        return
    }
  }

  const applyIciStepProgress = (step: IciFlowStepDef) => {
    setIciFlowStepId(step.id)
    const lastUtterance = step.utterances[step.utterances.length - 1]
    if (!lastUtterance) return
    const lastRuntimeAgent = mapIciAgentToRuntimeAgent(lastUtterance.agent)
    setCurrentAgentId(lastRuntimeAgent)
    if (lastRuntimeAgent === 'schedule') setStage('schedule')
    else if (lastRuntimeAgent === 'followup') setStage('followup')
    else setStage(lastRuntimeAgent as ExperienceStage)
  }

  const runIciFlowFromStep = (
    startStepId: string,
    ctx: IciFlowContext,
    initialPreviousAgent: IciAgentKey | null = 'info',
  ) => {
    const steps = getApplicableIciFlowSteps(ctx)
    const startIndex = Math.max(0, steps.findIndex((step) => step.id === startStepId))
    const flowSteps = steps.slice(startIndex)
    let previousAgent = initialPreviousAgent

    for (const step of flowSteps) {
      const firstAgent = getIciStepFirstAgent(step)
      const capturedPreviousAgent = previousAgent ? resolveHandoffAgent(previousAgent) : null
      const capturedFirstAgent = firstAgent ? resolveHandoffAgent(firstAgent) : null

      if (capturedPreviousAgent && capturedFirstAgent && step.utterances.length > 0) {
        const handoffCopy = buildIciHandoffCopy(step, capturedPreviousAgent, capturedFirstAgent, locale)
        const shouldShowHandoff = capturedPreviousAgent !== capturedFirstAgent
        enqueueFlowAction(async () => {
          await flowDelay(HANDOFF_DELAY_MS)
          if (!shouldShowHandoff) return
          await awaitQueuedMessage(
            handoffMessage(
              mapIciAgentToRuntimeAgent(capturedPreviousAgent),
              mapIciAgentToRuntimeAgent(capturedFirstAgent),
              handoffCopy.title,
              handoffCopy.hint,
            ),
          )
        })
      }

      for (const utterance of step.utterances) {
        enqueueFlowAction(async () => {
          await awaitQueuedMessage(
            agentMessage(
              mapIciAgentToRuntimeAgent(utterance.agent),
              locale === 'zh' ? utterance.textZh : utterance.textEn,
            ),
          )
        })
      }

      if (step.emailPreview) {
        enqueueFlowAction(async () => {
          await awaitQueuedMessage({
            id: nextId(),
            kind: 'summary',
            agentId: mapIciAgentToRuntimeAgent('comm'),
            title: locale === 'zh' ? '邮件发送预览' : 'Email preview',
            items: [
              { label: locale === 'zh' ? '收件人' : 'Recipient', value: step.emailPreview!.recipient },
              {
                label: locale === 'zh' ? '主题' : 'Subject',
                value: locale === 'zh' ? step.emailPreview!.subjectZh : step.emailPreview!.subjectEn,
              },
              {
                label: locale === 'zh' ? '正文摘要' : 'Body preview',
                value: locale === 'zh' ? step.emailPreview!.bodyZh : step.emailPreview!.bodyEn,
              },
            ],
          })
        })
      }

      enqueueFlowAction(async () => {
        applyIciStepProgress(step)
      })

      const lastAgent = getIciStepLastAgent(step)
      if (lastAgent) previousAgent = resolveHandoffAgent(lastAgent)
    }
  }

  const completeInfoCollection = (draft: EmployeeInfoDraft) => {
    const isRemote = /^(是|yes|true|远程)/i.test(draft.isRemote.trim())
    const ctx = createDefaultIciFlowContext({
      employeeName: draft.fullName,
      employeeEmail: draft.email,
      employmentType: (draft.employmentType || 'fulltime') as IciEmploymentType,
      startDate: draft.startDate,
      isRemote,
      department: draft.department,
      directManager: draft.directManager,
      recruiter: draft.recruiter,
    })
    setIciFlowContext(ctx)
    setInfoCollectPhase('done')
    const afterText =
      getIciStepUtterance(ctx, 'info-collect', 'after', locale) ??
      (locale === 'zh'
        ? '信息已收集完整，我会将这些内容交接给案件登记智能体，正式启动入职流程。'
        : 'The information has been collected completely. I will hand this off to the case registration agent.')
    const afterMessage = agentMessage('hr', afterText)
    enqueueFlowAction(async () => {
      await awaitQueuedMessage(afterMessage)
    })
    runIciFlowFromStep('case-register', ctx, 'info')
  }

  const reviewEmployeeInfoAsync = async (draft: EmployeeInfoDraft) => {
    const labels = locale === 'zh' ? EMPLOYEE_FIELD_LABELS_ZH : EMPLOYEE_FIELD_LABELS_EN
    const missing = getMissingEmployeeFields(draft)
    if (missing.length > 0) {
      const missingLabels = missing.map((key) => labels[key])
      await awaitQueuedMessage(
        agentMessage(
          'hr',
          locale === 'zh'
            ? `仍缺少以下信息：${missingLabels.join('、')}，请补充。`
            : `Still missing: ${missingLabels.join(', ')}. Please provide them.`,
        ),
      )
      return
    }
    completeInfoCollection(draft)
  }

  const submitItExtra = () => {
    markInteractionCommitted()
    updateLatestTaskCardStatus('it', locale === 'zh' ? '已完成' : 'Completed')
    pushMessages(
      userMessage(locale === 'zh' ? '提交额外需求' : 'Add extra requirements'),
      {
        id: nextId(),
        kind: 'summary',
        agentId: 'it',
        title: locale === 'zh' ? '案件说明已提交' : 'Case notes submitted',
        items: [
          { label: locale === 'zh' ? '补充说明' : 'Additional notes', value: itExtraDraft.reason },
          { label: locale === 'zh' ? '关联事项' : 'Related item', value: itExtraDraft.extraSystem },
          { label: locale === 'zh' ? '当前状态' : 'Current status', value: locale === 'zh' ? '已写入案件并进入追踪' : 'Added to the case and now trackable' },
        ],
      },
    )
    openDeviceStage()
  }

  const saveDeviceAddress = () => {
    markInteractionCommitted()
    updateLatestTaskCardStatus('device', locale === 'zh' ? '已完成' : 'Completed')
    pushMessages(
      userMessage(locale === 'zh' ? '保存新地址' : 'Save new address'),
      {
        id: nextId(),
        kind: 'summary',
        agentId: 'device',
        title: locale === 'zh' ? '任务已更新' : 'Tasks updated',
        items: [
          { label: locale === 'zh' ? '收件人' : 'Receiver', value: deviceDraft.receiver },
          { label: locale === 'zh' ? '手机号' : 'Mobile', value: deviceDraft.mobile },
          { label: locale === 'zh' ? '详细地址' : 'Detailed address', value: deviceDraft.address },
        ],
      },
    )
    finishFollowup()
  }

  const activateCultureModule = (moduleId: string) => {
    markInteractionCommitted()
    setActiveCultureModuleId(moduleId)
  }

  const viewCount = viewedCultureModules.length
  const hasViewedAllCultureModules = viewedCultureModules.length === cultureModules.length
  const nextUnreadCultureModule = cultureModules.find((module) => !viewedCultureModules.includes(module.id))

  const handleCultureMarkViewed = () => {
    markInteractionCommitted()
    const currentModuleId = activeCultureModule.id
    const nextViewedIds = viewedCultureModules.includes(currentModuleId)
      ? viewedCultureModules
      : [...viewedCultureModules, currentModuleId]

    setViewedCultureModules(nextViewedIds)

    const nextModule = cultureModules.find((module) => !nextViewedIds.includes(module.id))
    if (nextModule) {
      setActiveCultureModuleId(nextModule.id)
    }
  }

  const renderInlineCardWithAvatar = (messageId: string, agentId: AgentId, content: ReactNode) => {
    const agent = agents[agentId]
    return (
      <div key={messageId} className="joyce-experience-message-row">
        <img className="joyce-experience-message-avatar" src={agent.avatar} alt={agent.name} />
        <div className="joyce-experience-message-stack">{content}</div>
      </div>
    )
  }

  const getChatAgentBadge = (_agentId: AgentId) => 'Agent'

  const toggleInlineExecutionStage = (agentId: AgentId) => {
    setExpandedInlineExecutionStageIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    )
  }

  const toggleExecutionStep = (stepId: string) => {
    setExpandedExecutionStepIds((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId],
    )
  }

  const getMessageAgentId = (message: ExperienceMessage): AgentId | null => {
    if ('agentId' in message) return message.agentId
    return null
  }

  const shouldRenderInlineExecution = (messageIndex: number, agentId: AgentId) => {
    if (!showExecutionRecords) return false
    if (!executionStages.some((stageItem) => stageItem.id === agentId)) return false

    for (let index = messageIndex + 1; index < messages.length; index += 1) {
      if (getMessageAgentId(messages[index]) === agentId) {
        return false
      }
    }

    return true
  }

  const renderInlineExecutionStage = (agentId: AgentId) => {
    const stageItem = executionStages.find((item) => item.id === agentId)
    if (!stageItem) return null

    const isExpanded = expandedInlineExecutionStageIds.includes(agentId)

    return (
      <div className="joyce-experience-inline-execution">
        <button
          type="button"
          className={isExpanded ? 'joyce-experience-inline-execution-trigger is-expanded' : 'joyce-experience-inline-execution-trigger'}
          onClick={() => toggleInlineExecutionStage(agentId)}
          aria-expanded={isExpanded}
        >
          <span className="joyce-experience-inline-execution-trigger-copy">
            <span className="joyce-experience-inline-execution-trigger-title">
              {locale === 'zh' ? `${stageItem.agentName} 执行记录` : `${stageItem.agentName} execution log`}
            </span>
            <span className="joyce-experience-inline-execution-trigger-meta">
              {locale === 'zh'
                ? `${stageItem.steps.length} 步${stageItem.handoverLabel ? ' · 含交接' : ''}`
                : `${stageItem.steps.length} steps${stageItem.handoverLabel ? ' · includes handoff' : ''}`}
            </span>
          </span>
          <span className="joyce-experience-inline-execution-trigger-action">
            {isExpanded ? (locale === 'zh' ? '收起执行记录' : 'Hide execution log') : locale === 'zh' ? '展开执行记录' : 'Show execution log'}
          </span>
        </button>

        {isExpanded ? (
          <div className="experience-execution-stage-card joyce-experience-inline-execution-card">
            <div className="experience-execution-stage-head">
              <div className="experience-execution-stage-head-main">
                <img className="experience-execution-stage-avatar" src={stageItem.avatar} alt={stageItem.agentName} />
                <div className="experience-execution-stage-meta">
                  <div className="experience-execution-stage-meta-top">
                    <span className="experience-execution-stage-agent">{stageItem.agentName}</span>
                    <span className="experience-execution-stage-role">{stageItem.role}</span>
                    <span
                      className={
                        stageItem.status === 'completed'
                          ? 'experience-execution-stage-status is-completed'
                          : stageItem.status === 'active'
                            ? 'experience-execution-stage-status is-active'
                            : 'experience-execution-stage-status'
                      }
                    >
                      {stageItem.status === 'completed'
                        ? locale === 'zh'
                          ? '已完成'
                          : 'Completed'
                        : stageItem.status === 'active'
                          ? locale === 'zh'
                            ? '处理中'
                            : 'In progress'
                          : locale === 'zh'
                            ? '待处理'
                            : 'Pending'}
                    </span>
                  </div>
                  <div className="experience-execution-stage-title">{stageItem.stageLabel}</div>
                  <div className="experience-execution-stage-summary">{stageItem.summary}</div>
                </div>
              </div>
            </div>

            <div className="experience-execution-stage-steps">
              {stageItem.steps.map((step, stepIndex) => {
                const isOpen = expandedExecutionStepIds.includes(step.id)
                return (
                  <div key={step.id} className={isOpen ? 'experience-execution-step is-open' : 'experience-execution-step'}>
                    <button
                      type="button"
                      className="experience-execution-step-toggle"
                      onClick={() => toggleExecutionStep(step.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="experience-execution-step-index">{String(stepIndex + 1).padStart(2, '0')}</span>
                      <span className="experience-execution-step-toggle-copy">
                        <span className="experience-execution-step-title">{step.title}</span>
                        <span className="experience-execution-step-summary">{step.summary}</span>
                      </span>
                      <span className="experience-execution-step-toggle-label">
                        {isOpen ? (locale === 'zh' ? '收起详情' : 'Hide details') : locale === 'zh' ? '展开详情' : 'Show details'}
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="experience-execution-step-detail">
                        <div className="experience-execution-step-detail-block">
                          <div className="experience-execution-step-detail-title">{locale === 'zh' ? '处理说明' : 'Processing notes'}</div>
                          <ul className="experience-execution-step-detail-list">
                            {step.detailLines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="experience-execution-step-output">
                          <span>{locale === 'zh' ? '阶段输出' : 'Stage output'}</span>
                          <p>{step.output}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {stageItem.handoverLabel ? (
              <div className="experience-execution-stage-handover">{stageItem.handoverLabel}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  const renderMessageWithExecution = (
    messageId: string,
    messageIndex: number,
    agentId: AgentId | null,
    content: ReactNode,
  ) => {
    if (!agentId || !shouldRenderInlineExecution(messageIndex, agentId)) {
      return content
    }

    return [content, <div key={`${messageId}-execution`}>{renderInlineExecutionStage(agentId)}</div>]
  }

  const renderTriggerKickoffCard = () => {
    if (bootstrapped) return null

    if (onboardingTrigger === 'chat') {
      return null
    }

    if (onboardingTrigger === 'scheduled') {
      return (
        <div className="joyce-experience-trigger-kickoff-card">
          <div className="joyce-experience-trigger-kickoff-title">{locale === 'zh' ? '定时启动设置' : 'Scheduled kickoff setup'}</div>
          <div className="joyce-experience-trigger-kickoff-text">
            {locale === 'zh'
              ? '当前体验会先模拟系统按计划自动触发，再进入四 Agent 协作流程。'
              : 'This experience first simulates a scheduled system kickoff, then enters the four-agent collaboration flow.'}
          </div>
          <div className="joyce-experience-trigger-kickoff-fields">
            <label className="joyce-experience-field">
              <span>{locale === 'zh' ? '计划启动时间' : 'Scheduled kickoff time'}</span>
              <input
                type="datetime-local"
                value={scheduledKickoffAt}
                onChange={(event) => {
                  markInteractionCommitted()
                  setScheduledKickoffAt(event.target.value)
                }}
              />
            </label>
          </div>
          <div className="joyce-experience-inline-card-actions">
            <button
              type="button"
              className="joyce-experience-inline-button is-primary"
              onClick={submitScheduledKickoff}
            >
              {locale === 'zh' ? '模拟按计划启动' : 'Simulate scheduled kickoff'}
            </button>
          </div>
        </div>
      )
    }

    const formDisabled =
      !triggerFormDraft.fullName.trim() ||
      !triggerFormDraft.department.trim() ||
      !triggerFormDraft.startDate.trim()

    return (
      <div className="joyce-experience-trigger-kickoff-card">
        <div className="joyce-experience-trigger-kickoff-title">{locale === 'zh' ? '入职表单提交' : 'Onboarding form submission'}</div>
        <div className="joyce-experience-trigger-kickoff-text">
          {locale === 'zh'
            ? '当前体验会先模拟员工提交表单，系统收到表单后，再接入四 Agent 协作流程。'
            : 'This experience first simulates an employee submitting a form, and then enters the four-agent collaboration flow once the system receives it.'}
        </div>
        <div className="joyce-experience-trigger-kickoff-fields">
          <label className="joyce-experience-field">
            <span>{locale === 'zh' ? '员工姓名' : 'Employee name'}</span>
            <input
              value={triggerFormDraft.fullName}
                onChange={(event) => {
                  markInteractionCommitted()
                  setTriggerFormDraft((prev) => ({ ...prev, fullName: event.target.value }))
                }}
            />
          </label>
          <label className="joyce-experience-field">
            <span>{locale === 'zh' ? '所属部门' : 'Department'}</span>
            <input
              value={triggerFormDraft.department}
                onChange={(event) => {
                  markInteractionCommitted()
                  setTriggerFormDraft((prev) => ({ ...prev, department: event.target.value }))
                }}
            />
          </label>
          <label className="joyce-experience-field">
            <span>{locale === 'zh' ? '入职日期' : 'Start date'}</span>
            <input
              type="date"
              value={triggerFormDraft.startDate}
                onChange={(event) => {
                  markInteractionCommitted()
                  setTriggerFormDraft((prev) => ({ ...prev, startDate: event.target.value }))
                }}
            />
          </label>
        </div>
        <div className="joyce-experience-inline-card-actions">
          <button
            type="button"
            className="joyce-experience-inline-button is-primary"
            disabled={formDisabled}
            onClick={submitTriggerFormKickoff}
          >
            {locale === 'zh' ? '提交表单并启动' : 'Submit form and start'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="joyce-experience-root">
      <div className="joyce-experience-panel">
        <div ref={previewThreadRef} className="joyce-experience-preview-thread">
            <div className="joyce-experience-date-pill">{currentTimeLabel}</div>
            <div className="joyce-experience-trigger-summary">
              <span className="joyce-experience-trigger-summary-label">当前触发</span>
              <div className="joyce-experience-trigger-summary-card">
                <strong>{triggerMeta.title}</strong>
                <span>{triggerMeta.subtitle}</span>
              </div>
            </div>
            {renderTriggerKickoffCard()}
            {showExecutionRecords && executionStages.length > 0 && executionStreamStatus === 'live' ? (
              <div className="joyce-experience-inline-execution-banner">
                {locale === 'zh'
                  ? '执行记录已展开，后续会随会话继续增量更新。'
                  : 'Execution logs are expanded and will continue updating incrementally with the conversation.'}
              </div>
            ) : null}
            {messages.map((message, messageIndex) => {
              if (message.kind === 'agent') {
                const agent = agents[message.agentId]
                return renderMessageWithExecution(
                  message.id,
                  messageIndex,
                  message.agentId,
                  <div key={message.id} className="joyce-experience-message-row">
                    <img className="joyce-experience-message-avatar" src={agent.avatar} alt={agent.name} />
                    <div className="joyce-experience-message-stack">
                      <div className="joyce-experience-message-head">
                        <span className="joyce-experience-message-name">{agent.name}</span>
                        <span className="joyce-experience-message-badge">{getChatAgentBadge(message.agentId)}</span>
                      </div>
                      <div className="joyce-experience-message-card">
                        {message.isStreaming && message.id === streamingMessageId
                          ? `${message.text.slice(0, streamingLength)}▍`
                          : message.text}
                      </div>
                    </div>
                  </div>,
                )
              }

              if (message.kind === 'user') {
                return (
                  <div key={message.id} className="joyce-experience-message-row is-user">
                    <div className="joyce-experience-user-bubble">{message.text}</div>
                  </div>
                )
              }

              if (message.kind === 'thinking') {
                const agent = agents[message.agentId]
                return (
                  <div key={message.id} className="joyce-experience-message-row">
                    <img className="joyce-experience-message-avatar" src={agent.avatar} alt={agent.name} />
                    <div className="joyce-experience-message-stack">
                      <div className="joyce-experience-message-head">
                        <span className="joyce-experience-message-name">{agent.name}</span>
                        <span className="joyce-experience-message-badge">{getChatAgentBadge(message.agentId)}</span>
                      </div>
                      <div className="joyce-experience-message-card joyce-experience-thinking-card">
                        <span className="joyce-experience-thinking-label">思考中</span>
                        <span className="joyce-experience-thinking-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              if (message.kind === 'codegen') {
                const visibleCount = codegenLineProgressById[message.id] ?? 0
                return renderMessageWithExecution(
                  message.id,
                  messageIndex,
                  message.agentId,
                  renderInlineCardWithAvatar(
                    message.id,
                    message.agentId,
                    <div className="joyce-experience-inline-card joyce-experience-codegen-card">
                      <div className="joyce-experience-codegen-title">自动化代码撰写中...</div>
                      <div className="joyce-experience-codegen-lines">
                        {message.lines.slice(0, visibleCount).map((line) => (
                          <div key={line} className="joyce-experience-codegen-line is-visible">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>,
                  ),
                )
              }

              if (message.kind === 'task') {
                return renderMessageWithExecution(
                  message.id,
                  messageIndex,
                  message.agentId,
                  renderInlineCardWithAvatar(
                    message.id,
                    message.agentId,
                    <div className="joyce-experience-inline-card joyce-experience-task-card">
                      <div className="joyce-experience-task-card-head">
                        <div className="joyce-experience-inline-card-title">{message.title}</div>
                      </div>
                      <div className="joyce-experience-inline-card-text">{message.description}</div>
                      {message.note ? (
                        <div className="joyce-experience-task-note">{message.note}</div>
                      ) : null}
                      <div className="joyce-experience-task-actions">
                        {message.actions.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            className={
                              action.primary
                                ? 'joyce-experience-task-button is-primary'
                                : 'joyce-experience-task-button'
                            }
                            onClick={() => handleTaskAction(action.id)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>,
                  ),
                )
              }

              if (message.kind === 'summary') {
                return renderMessageWithExecution(
                  message.id,
                  messageIndex,
                  message.agentId,
                  renderInlineCardWithAvatar(
                    message.id,
                    message.agentId,
                    <div className="joyce-experience-inline-card is-summary">
                      <div className="joyce-experience-inline-card-title">{message.title}</div>
                      <div className="joyce-experience-summary-list">
                        {message.items.map((item) => (
                          <div key={item.label} className="joyce-experience-summary-item">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>,
                  ),
                )
              }

              if (message.kind === 'handoff') {
                const from = agents[message.from]
                const to = agents[message.to]
                return (
                  <div key={message.id} className="joyce-experience-handoff-card">
                    <div className="joyce-experience-handoff-avatars">
                      <img
                        className="joyce-experience-handoff-avatar is-from"
                        src={from.avatar}
                        alt={from.name}
                      />
                      <img
                        className="joyce-experience-handoff-avatar is-to"
                        src={to.avatar}
                        alt={to.name}
                      />
                    </div>
                    <div className="joyce-experience-handoff-copy">
                      <div className="joyce-experience-handoff-title">{message.title}</div>
                      <div className="joyce-experience-handoff-hint">{message.hint}</div>
                    </div>
                    <span className="joyce-experience-handoff-time">{locale === 'zh' ? '刚刚' : 'Just now'}</span>
                  </div>
                )
              }

              if (message.kind === 'form' && message.formType === 'employee') {
                return null
              }

              if (message.kind === 'form' && message.formType === 'it-extra') {
                return renderMessageWithExecution(
                  message.id,
                  messageIndex,
                  message.agentId,
                  renderInlineCardWithAvatar(
                    message.id,
                    message.agentId,
                    <div className="joyce-experience-inline-card is-form joyce-experience-compact-form-card joyce-experience-it-extra-form-card">
                      <div className="joyce-experience-inline-card-title">{locale === 'zh' ? '额外需求表单' : 'Extra request form'}</div>
                      <div className="joyce-experience-form-grid">
                        <label className="joyce-experience-field">
                          <span>{locale === 'zh' ? '额外系统' : 'Extra system'}</span>
                          <input
                            value={itExtraDraft.extraSystem}
                            onChange={(event) => {
                              markInteractionCommitted()
                              setItExtraDraft((prev) => ({ ...prev, extraSystem: event.target.value }))
                            }}
                          />
                        </label>
                        <label className="joyce-experience-field">
                          <span>{locale === 'zh' ? '使用原因' : 'Reason'}</span>
                          <textarea
                            value={itExtraDraft.reason}
                            rows={3}
                            onChange={(event) => {
                              markInteractionCommitted()
                              setItExtraDraft((prev) => ({ ...prev, reason: event.target.value }))
                            }}
                          />
                        </label>
                      </div>
                      <div className="joyce-experience-inline-card-actions">
                        <button type="button" className="joyce-experience-inline-button is-primary" onClick={submitItExtra}>
                          {locale === 'zh' ? '提交需求' : 'Submit request'}
                        </button>
                        <button type="button" className="joyce-experience-inline-button" onClick={() => handleTaskAction('it-back-default')}>
                          {locale === 'zh' ? '返回默认方案' : 'Back to default setup'}
                        </button>
                      </div>
                    </div>,
                  ),
                )
              }

              if (message.kind === 'form' && message.formType === 'device-address') {
                return renderMessageWithExecution(
                  message.id,
                  messageIndex,
                  message.agentId,
                  renderInlineCardWithAvatar(
                    message.id,
                    message.agentId,
                    <div className="joyce-experience-inline-card is-form joyce-experience-compact-form-card joyce-experience-device-address-form-card">
                      <div className="joyce-experience-inline-card-title">{locale === 'zh' ? '地址修改表单' : 'Address edit form'}</div>
                      <div className="joyce-experience-form-grid">
                        <label className="joyce-experience-field">
                          <span>{locale === 'zh' ? '收件人' : 'Receiver'}</span>
                          <input
                            value={deviceDraft.receiver}
                            onChange={(event) => {
                              markInteractionCommitted()
                              setDeviceDraft((prev) => ({ ...prev, receiver: event.target.value }))
                            }}
                          />
                        </label>
                        <label className="joyce-experience-field">
                          <span>{locale === 'zh' ? '手机号' : 'Mobile'}</span>
                          <input
                            value={deviceDraft.mobile}
                            onChange={(event) => {
                              markInteractionCommitted()
                              setDeviceDraft((prev) => ({ ...prev, mobile: event.target.value }))
                            }}
                          />
                        </label>
                        <label className="joyce-experience-field">
                          <span>{locale === 'zh' ? '详细地址' : 'Detailed address'}</span>
                          <textarea
                            value={deviceDraft.address}
                            rows={3}
                            onChange={(event) => {
                              markInteractionCommitted()
                              setDeviceDraft((prev) => ({ ...prev, address: event.target.value }))
                            }}
                          />
                        </label>
                      </div>
                      <div className="joyce-experience-inline-card-actions">
                        <button type="button" className="joyce-experience-inline-button is-primary" onClick={saveDeviceAddress}>
                          {locale === 'zh' ? '保存新地址' : 'Save new address'}
                        </button>
                        <button type="button" className="joyce-experience-inline-button" onClick={() => handleTaskAction('device-cancel-edit')}>
                          {locale === 'zh' ? '取消' : 'Cancel'}
                        </button>
                      </div>
                    </div>,
                  ),
                )
              }

              return renderMessageWithExecution(
                message.id,
                messageIndex,
                message.agentId,
                renderInlineCardWithAvatar(
                  message.id,
                  message.agentId,
                  <div className="joyce-experience-inline-card is-form joyce-experience-culture-browser-card">
                    <div className="joyce-experience-culture-header">
                      <div>
                        <div className="joyce-experience-inline-card-title">{locale === 'zh' ? '企业文化模块浏览' : 'Culture module browser'}</div>
                        <div className="joyce-experience-inline-card-text">
                          {locale === 'zh'
                            ? '按模块逐页查看核心内容。全部浏览后即可完成文化介绍阶段。'
                            : 'Review the core content module by module. Once all modules are viewed, the culture introduction stage can be completed.'}
                        </div>
                      </div>
                      <span className="joyce-experience-culture-progress-pill">
                        {locale === 'zh' ? `${viewCount}/${cultureModules.length} 已浏览` : `${viewCount}/${cultureModules.length} viewed`}
                      </span>
                    </div>

                    <div className="joyce-experience-culture-layout">
                      <div className="joyce-experience-culture-nav" role="tablist" aria-label={locale === 'zh' ? '企业文化模块列表' : 'Culture module list'}>
                        {cultureModules.map((module) => {
                          const viewed = viewedCultureModules.includes(module.id)
                          const isActive = module.id === activeCultureModuleId
                          return (
                            <button
                              key={module.id}
                              type="button"
                              className={
                                isActive
                                  ? 'joyce-experience-culture-nav-item is-active'
                                  : viewed
                                    ? 'joyce-experience-culture-nav-item is-viewed'
                                    : 'joyce-experience-culture-nav-item'
                              }
                              onClick={() => activateCultureModule(module.id)}
                              role="tab"
                              aria-selected={isActive}
                            >
                              <span className="joyce-experience-culture-nav-label">{module.label}</span>
                              <span
                                className={
                                  viewed
                                    ? 'joyce-experience-culture-nav-status is-viewed'
                                    : isActive
                                      ? 'joyce-experience-culture-nav-status is-active'
                                      : 'joyce-experience-culture-nav-status'
                                }
                              >
                                {viewed ? (locale === 'zh' ? '已读' : 'Viewed') : isActive ? (locale === 'zh' ? '阅读中' : 'Reading') : locale === 'zh' ? '未读' : 'Unread'}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="joyce-experience-culture-content">
                        <div className="joyce-experience-culture-content-head">
                          <div className="joyce-experience-culture-content-title">{activeCultureModule.label}</div>
                        </div>
                        <div className="joyce-experience-culture-body">{activeCultureModule.description}</div>
                        <div className="joyce-experience-culture-checklist">
                          {activeCultureModule.checklist.map((item) => (
                            <div key={item} className="joyce-experience-culture-checklist-item">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="joyce-experience-inline-card-actions joyce-experience-culture-actions">
                      <button
                        type="button"
                        className="joyce-experience-inline-button joyce-experience-culture-action"
                        onClick={handleCultureMarkViewed}
                      >
                        {viewedCultureModules.includes(activeCultureModule.id)
                          ? nextUnreadCultureModule
                            ? locale === 'zh'
                              ? '查看下一个模块'
                              : 'View next module'
                            : locale === 'zh'
                              ? '当前模块已了解'
                              : 'Current module reviewed'
                          : locale === 'zh'
                            ? '标记为已了解'
                            : 'Mark as reviewed'}
                      </button>
                      <button
                        type="button"
                        className="joyce-experience-inline-button is-primary joyce-experience-culture-action"
                        disabled={!hasViewedAllCultureModules}
                        onClick={finishFollowup}
                      >
                        {locale === 'zh' ? '完成文化介绍' : 'Complete culture introduction'}
                      </button>
                    </div>
                  </div>,
                ),
              )
            })}
        </div>

        <div className="joyce-experience-composer">
          <div className="joyce-experience-composer-shell">
            <div className="joyce-experience-composer-input-wrap">
            <textarea
              className="joyce-experience-composer-input"
              rows={3}
              placeholder={
                !bootstrapped
                  ? onboardingTrigger === 'chat'
                    ? locale === 'zh'
                      ? '请输入任意内容，先模拟聊天触发入职流程…'
                      : 'Type anything first to simulate triggering onboarding from chat...'
                    : triggerMeta.prompt
                  : locale === 'zh'
                    ? '请输入您的回复，例如：开始'
                    : 'Type your reply, for example: Start'
              }
              value={experienceInput}
              disabled={isComposerLocked}
              onChange={(event) => setExperienceInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleExperienceSend()
                }
              }}
            />
            <button
              type="button"
              className="joyce-experience-send"
              onClick={handleExperienceSend}
              disabled={isComposerLocked || !experienceInput.trim()}
            >
              发送
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
