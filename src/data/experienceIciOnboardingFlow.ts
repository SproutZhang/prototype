import type { JoyceExperienceSnapshot } from '../components/shared/JoyceExperienceTab'

/** ICI 入职流程 — 文档 StudioX_操作手册_入职流程_ICI */
export type IciEmploymentType = 'fulltime' | 'parttime' | 'intern' | 'contract' | 'postee'

export type IciAgentKey =
  | 'info'
  | 'case'
  | 'task'
  | 'comm'
  | 'schedule'
  | 'progress'
  | 'taskowner'
  | 'sla'

export type IciFlowContext = {
  employeeName: string
  employeeEmail: string
  employmentType: IciEmploymentType
  startDate: string
  isRemote: boolean
  department: string
  directManager: string
  recruiter: string
}

export type IciAgentPhase = 'before' | 'during' | 'after'

export type IciAgentUtterance = {
  agent: IciAgentKey
  phase: IciAgentPhase
  textZh: string
  textEn: string
}

export type IciEmailPreview = {
  subjectZh: string
  subjectEn: string
  recipient: string
  bodyZh: string
  bodyEn: string
}

export type IciFlowStepDef = {
  id: string
  progressLabelZh: string
  progressLabelEn: string
  agentNameZh: string
  agentNameEn: string
  kind?: 'default' | 'branch' | 'approval'
  branchMeta?: {
    paths: Array<{ id: string; labelZh: string; labelEn: string }>
    selectedPathId: string | null
  }
  skipWhen?: (ctx: IciFlowContext) => boolean
  utterances: IciAgentUtterance[]
  emailPreview?: IciEmailPreview
  handoffTitleZh?: string
  handoffTitleEn?: string
  handoffHintZh?: string
  handoffHintEn?: string
}

export const ICI_ROLE_CONTACTS = {
  hr: { name: '俞旻莎', email: 'minsha.yu@elites.ai' },
  it: { name: '王长伟', email: 'changwei.wang@elites.ai' },
  manager: { name: '张梦雅', email: 'mengya.zhang@elites.ai' },
  office: { name: '张淦萍', email: 'ganping.zhang@elites.ai' },
  payroll: { name: '郝怀明', email: 'huaiming.hao@elites.ai' },
} as const

export const ICI_AGENT_LABELS: Record<IciAgentKey, { zh: string; en: string }> = {
  info: { zh: '信息收集', en: 'Information Collection' },
  case: { zh: '案件登记', en: 'Case Registration' },
  task: { zh: '任务创建', en: 'Task Creation' },
  comm: { zh: '沟通智能体', en: 'Communication Agent' },
  schedule: { zh: '日程创建', en: 'Schedule Creation' },
  progress: { zh: '进度跟踪', en: 'Progress Tracking' },
  taskowner: { zh: '任务责任', en: 'Task Ownership' },
  sla: { zh: 'SLA 监控', en: 'SLA Monitoring' },
}

export const ICI_SIDEBAR_AGENT_KEYS: IciAgentKey[] = ['info', 'case', 'task', 'comm', 'schedule']

const ICI_BACKEND_AGENT_KEYS = new Set<IciAgentKey>(['taskowner', 'sla', 'progress'])

/** 后台 Agent（任务责任 / SLA / 进度跟踪）在 handoff 与聊天展示上归并到沟通智能体 */
export function resolveHandoffAgent(agent: IciAgentKey): IciAgentKey {
  return ICI_BACKEND_AGENT_KEYS.has(agent) ? 'comm' : agent
}

export function createDefaultIciFlowContext(
  overrides: Partial<IciFlowContext> = {},
): IciFlowContext {
  return {
    employeeName: '陈晓明',
    employeeEmail: 'tech.workapp@infosysaai.com',
    employmentType: 'fulltime',
    startDate: '2026-07-20',
    isRemote: false,
    department: '产品研发部',
    directManager: '张梦雅',
    recruiter: '俞旻莎',
    ...overrides,
  }
}

export function isContractWorker(ctx: IciFlowContext) {
  return ctx.employmentType === 'contract'
}

export function shouldAttachTaxForms(ctx: IciFlowContext) {
  return !isContractWorker(ctx)
}

function n(ctx: IciFlowContext) {
  return ctx.employeeName
}

const EMPLOYMENT_TYPE_BRANCH_PATHS = [
  { id: 'non-contract', labelZh: '非合同工（执行背景调查）', labelEn: 'Non-contract (run background check)' },
  { id: 'contract', labelZh: '合同工（跳过背景调查）', labelEn: 'Contract worker (skip background check)' },
] as const

const WORK_ARRANGEMENT_BRANCH_PATHS = [
  { id: 'onsite', labelZh: '现场 / 混合办公', labelEn: 'Onsite / Hybrid' },
  { id: 'remote', labelZh: '远程办公（跳过工位准备）', labelEn: 'Remote (skip workstation prep)' },
] as const

export function resolveIciBranchPath(branchId: string, ctx: IciFlowContext): string | null {
  switch (branchId) {
    case 'employment-type-branch':
      return isContractWorker(ctx) ? 'contract' : 'non-contract'
    case 'work-arrangement-branch':
      return ctx.isRemote ? 'remote' : 'onsite'
    default:
      return null
  }
}

function getProgressCurrentIndex(allSteps: IciFlowStepDef[], currentStepId: string) {
  if (currentStepId === 'completed') return allSteps.length
  const index = allSteps.findIndex((step) => step.id === currentStepId)
  return index >= 0 ? index : 0
}

function getPassedBranchIds(allSteps: IciFlowStepDef[], currentIndex: number) {
  const passed = new Set<string>()
  for (let index = 0; index < currentIndex; index += 1) {
    if (allSteps[index]?.kind === 'branch') passed.add(allSteps[index].id)
  }
  return passed
}

function getProgressVisibleEndIndex(allSteps: IciFlowStepDef[], currentIndex: number, currentStepId: string) {
  if (currentStepId === 'completed') return allSteps.length - 1

  for (let index = 0; index < allSteps.length; index += 1) {
    if (allSteps[index]?.kind !== 'branch') continue
    if (index > currentIndex) return index
    if (index === currentIndex) return index
  }

  return allSteps.length - 1
}

function getProgressVisibleStepDefs(ctx: IciFlowContext, currentStepId: string) {
  const allSteps = buildIciFlowStepDefs(ctx)
  const currentIndex = getProgressCurrentIndex(allSteps, currentStepId)
  const passedBranchIds = getPassedBranchIds(allSteps, currentIndex)
  const endIndex = getProgressVisibleEndIndex(allSteps, currentIndex, currentStepId)
  const slice = allSteps.slice(0, endIndex + 1)

  if (passedBranchIds.size === 0) return slice

  return slice.filter((step) => !step.skipWhen?.(ctx))
}

export function buildIciFlowStepDefs(ctx: IciFlowContext): IciFlowStepDef[] {
  const remote = ctx.isRemote

  return [
    {
      id: 'info-collect',
      progressLabelZh: '信息收集',
      progressLabelEn: 'Information collection',
      agentNameZh: '信息收集',
      agentNameEn: 'Information Collection',
      utterances: [
        {
          agent: 'info',
          phase: 'before',
          textZh:
            '你好，我是信息收集智能体，接下来需要你提供以下新员工的入职信息：新员工姓名、新员工邮箱、入职类型（全职/兼职/实习/合同工/Postee）、入职日期、是否远程办公、部门、直属经理、招聘负责人。',
          textEn:
            'Hi, I am the information collection agent. Please provide the following onboarding details for the new hire: employee name, email, employment type (full-time/part-time/intern/contract/Postee), start date, remote work arrangement, department, direct manager, and recruiter.',
        },
        {
          agent: 'info',
          phase: 'during',
          textZh: '我已经收到你提供的信息，正在核对并整理中，请稍等。如果有缺失，我会继续向你询问缺失项。',
          textEn:
            'I have received the information you provided and am reviewing it now. Please wait a moment. If anything is missing, I will ask you for the remaining items.',
        },
        {
          agent: 'info',
          phase: 'after',
          textZh: '信息已收集完整，我会将这些内容交接给案件登记智能体，正式启动入职流程。',
          textEn:
            'The information has been collected completely. I will hand this off to the case registration agent to officially start the onboarding process.',
        },
      ],
    },
    {
      id: 'case-register',
      progressLabelZh: '案件登记',
      progressLabelEn: 'Case registration',
      agentNameZh: '案件登记',
      agentNameEn: 'Case Registration',
      handoffTitleZh: '信息收集 -> 案件登记',
      handoffTitleEn: 'Information collection -> Case registration',
      handoffHintZh: '基础信息已收集完成，开始创建入职案件档案。',
      handoffHintEn: 'Baseline information has been collected. Case registration can begin.',
      utterances: [
        {
          agent: 'case',
          phase: 'before',
          textZh: '你好，我是案件登记智能体，接下来由我为你创建入职案件档案。',
          textEn: 'Hi, I am the case registration agent. I will create the onboarding case file for you.',
        },
        {
          agent: 'case',
          phase: 'during',
          textZh: '我正在为你生成专属的 Case ID，方便后续所有环节统一跟踪。',
          textEn: 'I am generating a dedicated Case ID so every subsequent step can be tracked consistently.',
        },
        {
          agent: 'case',
          phase: 'after',
          textZh: '案件已创建完成，专属 Case ID 已生成，后续每一步进展都会被记录下来。',
          textEn: 'The case has been created and the Case ID is ready. Every subsequent step will be recorded.',
        },
      ],
    },
    {
      id: 'employment-type-branch',
      progressLabelZh: '入职类型判断',
      progressLabelEn: 'Employment type check',
      agentNameZh: '条件分支',
      agentNameEn: 'Conditional branch',
      kind: 'branch',
      branchMeta: {
        paths: [...EMPLOYMENT_TYPE_BRANCH_PATHS],
        selectedPathId: null,
      },
      utterances: [],
    },
    {
      id: 'bg-check-task',
      progressLabelZh: '背景调查任务',
      progressLabelEn: 'Background check task',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      skipWhen: isContractWorker,
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: '你好，我是任务创建智能体，我将为 HR 创建一条“跟进背景调查”的待办任务。',
          textEn: 'Hi, I am the task creation agent. I will create a background check follow-up task for HR.',
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 HR ${ICI_ROLE_CONTACTS.hr.name} 创建“跟进背景调查”的待办任务，并设置好提醒。`,
          textEn: `I am creating the background check follow-up task for HR ${ICI_ROLE_CONTACTS.hr.name} and configuring reminders.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，HR ${ICI_ROLE_CONTACTS.hr.name} 可以在 "My Tasks" 中查看并跟进这项待办。`,
          textEn: `The task has been created. HR ${ICI_ROLE_CONTACTS.hr.name} can view and follow up in "My Tasks".`,
        },
      ],
    },
    {
      id: 'bg-check-email',
      progressLabelZh: '背景调查邮件',
      progressLabelEn: 'Background check email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      skipWhen: isContractWorker,
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把跟进背景调查的通知发送给 HR ${ICI_ROLE_CONTACTS.hr.name}，请她协助确认调查进展。`,
          textEn: `Hi, I am the communication agent. I will send the background check notification to HR ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在向 ${ICI_ROLE_CONTACTS.hr.name} 发送背景调查通知邮件。`,
          textEn: `I am sending the background check notification email to ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: `背景调查通知已发送至 ${ICI_ROLE_CONTACTS.hr.name}，等待她跟进反馈后进入下一步。`,
          textEn: `The background check notification has been sent to ${ICI_ROLE_CONTACTS.hr.name}. Waiting for follow-up before the next step.`,
        },
      ],
      emailPreview: {
        recipient: ICI_ROLE_CONTACTS.hr.email,
        subjectZh: `【待跟进】新员工背景调查任务 —— ${n(ctx)}`,
        subjectEn: `[Action Required] Background Check Follow-Up — ${n(ctx)}`,
        bodyZh: `Hi ${ICI_ROLE_CONTACTS.hr.name}，系统已为您创建一条新的待办任务，需要您跟进 ${n(ctx)} 的背景调查进展。请在 My Tasks 中完成后勾选 Done。`,
        bodyEn: `Hi ${ICI_ROLE_CONTACTS.hr.name}, a new task has been created for you to follow up on the background check for ${n(ctx)}. Mark it Done in My Tasks when complete.`,
      },
    },
    {
      id: 'welcome-email',
      progressLabelZh: '欢迎邮件',
      progressLabelEn: 'Welcome email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      kind: 'default',
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把欢迎邮件发送给新员工 ${n(ctx)}，向他介绍入职后的下一步安排。`,
          textEn: `Hi, I am the communication agent. I will send the welcome email to ${n(ctx)} with next-step guidance.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在为 ${n(ctx)} 准备欢迎邮件，并确认是否需要附加 I-9、W-4 表格。`,
          textEn: `I am preparing the welcome email for ${n(ctx)} and confirming whether I-9 and W-4 attachments are required.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: `欢迎邮件已发送至 ${n(ctx)} 的邮箱，相关材料已同步送达。`,
          textEn: `The welcome email has been sent to ${n(ctx)} with the related materials.`,
        },
      ],
      emailPreview: {
        recipient: ctx.employeeEmail,
        subjectZh: `欢迎加入 CORP —— ${n(ctx)}`,
        subjectEn: `Welcome to CORP — ${n(ctx)}`,
        bodyZh: shouldAttachTaxForms(ctx)
          ? `祝贺你 ${n(ctx)} 获得在 CORP 的新职位！附件包含 Form I-9、I-9 合格文件清单与 W-4 表格。`
          : `祝贺你 ${n(ctx)} 获得在 CORP 的新职位！本邮件不包含 I-9 / W-4 附件。`,
        bodyEn: shouldAttachTaxForms(ctx)
          ? `Congratulations ${n(ctx)} on your new position at CORP! Attachments include Form I-9, acceptable documents list, and W-4.`
          : `Congratulations ${n(ctx)} on your new position at CORP! This email does not include I-9 / W-4 attachments.`,
      },
    },
    {
      id: 'manager-confirm-task',
      progressLabelZh: '经理确认任务',
      progressLabelEn: 'Manager confirmation task',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: `你好，我是任务创建智能体，接下来我会为直属经理 ${ctx.directManager} 创建一条“确认新员工信息”的待办任务。`,
          textEn: `Hi, I am the task creation agent. I will create an information confirmation task for manager ${ctx.directManager}.`,
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 ${ctx.directManager} 创建信息确认任务，并设置好 3 天的 SLA 提醒。`,
          textEn: `I am creating the confirmation task for ${ctx.directManager} with a 3-day SLA reminder.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，${ctx.directManager} 可以在 "My Tasks" 中查看并完成信息确认。`,
          textEn: `The task has been created. ${ctx.directManager} can complete the confirmation in "My Tasks".`,
        },
      ],
    },
    {
      id: 'manager-confirm-email',
      progressLabelZh: '经理确认邮件',
      progressLabelEn: 'Manager confirmation email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把入职信息确认邮件发送给直属经理 ${ctx.directManager}，请他补充新员工的到岗安排。`,
          textEn: `Hi, I am the communication agent. I will send the onboarding confirmation email to manager ${ctx.directManager}.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在向 ${ctx.directManager} 发送确认邮件。`,
          textEn: `I am sending the confirmation email to ${ctx.directManager}.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: `确认邮件已发送至 ${ctx.directManager}，请他留意邮箱查收并回复。`,
          textEn: `The confirmation email has been sent to ${ctx.directManager}.`,
        },
      ],
      emailPreview: {
        recipient: ICI_ROLE_CONTACTS.manager.email,
        subjectZh: `【待确认】新员工入职信息确认 —— ${n(ctx)}`,
        subjectEn: `[Action Required] New Hire Information Confirmation — ${n(ctx)}`,
        bodyZh: `Hi ${ctx.directManager}，作为 ${n(ctx)} 入职流程的一部分，请确认并补充到岗时间、Day 1 是否现场见面、除笔记本外是否需其他设备、是否需要搬迁协助。系统已创建待办任务，请在 3 天内回复邮件并在 My Tasks 勾选 Done。如未在时限内回复，系统将自动升级提醒。`,
        bodyEn: `Hi ${ctx.directManager}, as part of onboarding for ${n(ctx)}, please confirm start time, Day 1 onsite meeting plan, additional equipment needs, and relocation assistance. Complete the My Tasks item within 3 days. The system will escalate if the SLA window is missed.`,
      },
    },
    {
      id: 'prep-it-task',
      progressLabelZh: 'IT 配置任务',
      progressLabelEn: 'IT setup task',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: `你好，我是任务创建智能体，接下来我会为 IT ${ICI_ROLE_CONTACTS.it.name} 创建一条“设备与权限配置”的待办任务。`,
          textEn: `Hi, I am the task creation agent. I will create an IT setup task for ${ICI_ROLE_CONTACTS.it.name}.`,
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 ${ICI_ROLE_CONTACTS.it.name} 创建 IT 配置任务，并设置好 1-2 天的 SLA 提醒。`,
          textEn: `I am creating the IT setup task for ${ICI_ROLE_CONTACTS.it.name} with a 1-2 day SLA.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，${ICI_ROLE_CONTACTS.it.name} 可以在 "My Tasks" 中查看并完成配置。`,
          textEn: `The task has been created. ${ICI_ROLE_CONTACTS.it.name} can complete the setup in "My Tasks".`,
        },
      ],
    },
    {
      id: 'prep-it-email',
      progressLabelZh: 'IT 配置邮件',
      progressLabelEn: 'IT setup email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把设备与权限配置通知发送给 IT ${ICI_ROLE_CONTACTS.it.name}，请他提前安排账号开通。`,
          textEn: `Hi, I am the communication agent. I will notify IT ${ICI_ROLE_CONTACTS.it.name} to prepare account access.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在向 ${ICI_ROLE_CONTACTS.it.name} 发送 IT 配置邮件。`,
          textEn: `I am sending the IT setup email to ${ICI_ROLE_CONTACTS.it.name}.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: `IT 配置通知已发送至 ${ICI_ROLE_CONTACTS.it.name}，请他留意邮箱查收。`,
          textEn: `The IT setup notification has been sent to ${ICI_ROLE_CONTACTS.it.name}.`,
        },
      ],
      emailPreview: {
        recipient: ICI_ROLE_CONTACTS.it.email,
        subjectZh: `【待处理】新员工 IT 配置任务 —— ${n(ctx)}`,
        subjectEn: `[Action Required] New Hire IT Setup — ${n(ctx)}`,
        bodyZh: remote
          ? `Hi ${ICI_ROLE_CONTACTS.it.name}，请为远程办公员工 ${n(ctx)} 分配设备并寄送至员工地址，并在入职日前完成账号激活。`
          : `Hi ${ICI_ROLE_CONTACTS.it.name}，请为 ${n(ctx)} 分配笔记本与系统权限，并在入职日前完成账号激活。`,
        bodyEn: remote
          ? `Hi ${ICI_ROLE_CONTACTS.it.name}, please assign equipment for remote hire ${n(ctx)} and complete account activation before the start date.`
          : `Hi ${ICI_ROLE_CONTACTS.it.name}, please assign a laptop and access for ${n(ctx)} before the start date.`,
      },
    },
    {
      id: 'work-arrangement-branch',
      progressLabelZh: '办公方式判断',
      progressLabelEn: 'Work arrangement check',
      agentNameZh: '条件分支',
      agentNameEn: 'Conditional branch',
      kind: 'branch',
      branchMeta: {
        paths: [...WORK_ARRANGEMENT_BRANCH_PATHS],
        selectedPathId: null,
      },
      utterances: [],
    },
    {
      id: 'prep-office-task',
      progressLabelZh: '工位工牌任务',
      progressLabelEn: 'Workstation task',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      skipWhen: (c) => c.isRemote,
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: `你好，我是任务创建智能体，接下来我会为办公室主管 ${ICI_ROLE_CONTACTS.office.name} 创建一条“工位与工牌准备”的待办任务。`,
          textEn: `Hi, I am the task creation agent. I will create a workstation and badge task for ${ICI_ROLE_CONTACTS.office.name}.`,
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 ${ICI_ROLE_CONTACTS.office.name} 创建工位准备任务，并设置好任务提醒。`,
          textEn: `I am creating the workstation preparation task for ${ICI_ROLE_CONTACTS.office.name}.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，${ICI_ROLE_CONTACTS.office.name} 可以在 "My Tasks" 中查看并完成准备工作。`,
          textEn: `The task has been created. ${ICI_ROLE_CONTACTS.office.name} can complete the preparation in "My Tasks".`,
        },
      ],
    },
    {
      id: 'prep-office-email',
      progressLabelZh: '工位工牌邮件',
      progressLabelEn: 'Workstation email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      skipWhen: (c) => c.isRemote,
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把工位与工牌准备通知发送给办公室主管 ${ICI_ROLE_CONTACTS.office.name}。`,
          textEn: `Hi, I am the communication agent. I will notify office lead ${ICI_ROLE_CONTACTS.office.name} to prepare workstation and badge.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在向 ${ICI_ROLE_CONTACTS.office.name} 发送工位准备邮件。`,
          textEn: `I am sending the workstation preparation email to ${ICI_ROLE_CONTACTS.office.name}.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: `工位准备通知已发送至 ${ICI_ROLE_CONTACTS.office.name}，请她留意邮箱查收。`,
          textEn: `The workstation preparation notification has been sent to ${ICI_ROLE_CONTACTS.office.name}.`,
        },
      ],
      emailPreview: {
        recipient: ICI_ROLE_CONTACTS.office.email,
        subjectZh: `【待处理】新员工工位与工牌准备 —— ${n(ctx)}`,
        subjectEn: `[Action Required] Workstation & Badge Preparation — ${n(ctx)}`,
        bodyZh: `Hi ${ICI_ROLE_CONTACTS.office.name}，请为 ${n(ctx)} 准备工位与工牌，并建议在入职前一周周四前完成。`,
        bodyEn: `Hi ${ICI_ROLE_CONTACTS.office.name}, please prepare workstation and badge for ${n(ctx)} before the recommended deadline.`,
      },
    },
    {
      id: 'prep-hr-benefits-task',
      progressLabelZh: '福利会议任务',
      progressLabelEn: 'Benefits meeting task',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: `你好，我是任务创建智能体，接下来我会为 HR ${ICI_ROLE_CONTACTS.hr.name} 创建一条“安排福利会议”的待办任务。`,
          textEn: `Hi, I am the task creation agent. I will create a benefits meeting task for HR ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 ${ICI_ROLE_CONTACTS.hr.name} 创建福利会议安排任务，并设置好任务提醒。`,
          textEn: `I am creating the benefits meeting task for ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，${ICI_ROLE_CONTACTS.hr.name} 可以在 "My Tasks" 中查看并完成会议安排。`,
          textEn: `The task has been created. ${ICI_ROLE_CONTACTS.hr.name} can schedule the meeting in "My Tasks".`,
        },
      ],
    },
    {
      id: 'prep-hr-benefits-email',
      progressLabelZh: '福利会议邮件',
      progressLabelEn: 'Benefits meeting email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把安排福利会议的通知发送给 HR ${ICI_ROLE_CONTACTS.hr.name}。`,
          textEn: `Hi, I am the communication agent. I will notify HR ${ICI_ROLE_CONTACTS.hr.name} to schedule the benefits meeting.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在向 ${ICI_ROLE_CONTACTS.hr.name} 发送福利会议安排邮件。`,
          textEn: `I am sending the benefits meeting email to ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: `福利会议通知已发送至 ${ICI_ROLE_CONTACTS.hr.name}，请她留意邮箱查收。`,
          textEn: `The benefits meeting notification has been sent to ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
      ],
      emailPreview: {
        recipient: ICI_ROLE_CONTACTS.hr.email,
        subjectZh: `【待处理】安排新员工福利会议 —— ${n(ctx)}`,
        subjectEn: `[Action Required] Schedule Benefits Meeting — ${n(ctx)}`,
        bodyZh: `Hi ${ICI_ROLE_CONTACTS.hr.name}，请为 ${n(ctx)} 安排 Day 2 福利会议（约 1 小时），通过 Teams 发送邀请，涵盖医疗、牙科、视力保险及 401(k) 登记。请在 My Tasks 完成安排后勾选 Done。`,
        bodyEn: `Hi ${ICI_ROLE_CONTACTS.hr.name}, please schedule the Day 2 benefits meeting for ${n(ctx)} via Teams (about 1 hour), covering medical, dental, vision, and 401(k) enrollment. Mark Done in My Tasks when scheduled.`,
      },
    },
    {
      id: 'day1-schedule-email',
      progressLabelZh: 'Day 1 日程邮件',
      progressLabelEn: 'Day 1 schedule email',
      agentNameZh: '沟通智能体',
      agentNameEn: 'Communication Agent',
      utterances: [
        {
          agent: 'comm',
          phase: 'before',
          textZh: `你好，我是沟通智能体，接下来我会把 Day 1 入职日程发送给新员工 ${n(ctx)} 和直属经理 ${ctx.directManager}。`,
          textEn: `Hi, I am the communication agent. I will send the Day 1 onboarding schedule to ${n(ctx)} and manager ${ctx.directManager}.`,
        },
        {
          agent: 'comm',
          phase: 'during',
          textZh: `我正在为 ${n(ctx)} 和 ${ctx.directManager} 准备 Day 1 日程邮件。`,
          textEn: `I am preparing the Day 1 schedule email for ${n(ctx)} and ${ctx.directManager}.`,
        },
        {
          agent: 'comm',
          phase: 'after',
          textZh: 'Day 1 日程邮件已发送完成，请他们留意邮箱查收。',
          textEn: 'The Day 1 schedule email has been sent. Please ask them to check their inbox.',
        },
      ],
      emailPreview: {
        recipient: `${ctx.employeeEmail}, ${ICI_ROLE_CONTACTS.manager.email}`,
        subjectZh: `${n(ctx)} Day 1 入职日程安排`,
        subjectEn: `${n(ctx)} — Day 1 Onboarding Schedule`,
        bodyZh: `Hi ${n(ctx)}、${ctx.directManager}，以下是 ${n(ctx)} Day 1 详细日程，含 HR 培训、IT 培训、办公室参观与经理交接。`,
        bodyEn: `Hi ${n(ctx)} and ${ctx.directManager}, below is the Day 1 schedule including HR session, IT session, office tour, and manager handoff.`,
      },
    },
    {
      id: 'day1-teams-schedule',
      progressLabelZh: 'Teams 日程创建',
      progressLabelEn: 'Teams schedule creation',
      agentNameZh: '日程创建',
      agentNameEn: 'Schedule Creation',
      utterances: [
        {
          agent: 'schedule',
          phase: 'before',
          textZh: `你好，我是日程创建智能体，接下来我会为直属经理 ${ctx.directManager} 在 Teams 中创建 ${n(ctx)} 的 Day 1 入职日程。`,
          textEn: `Hi, I am the schedule creation agent. I will create ${n(ctx)}'s Day 1 schedule in Teams for manager ${ctx.directManager}.`,
        },
        {
          agent: 'schedule',
          phase: 'during',
          textZh: '我正在 Teams 中创建 Day 1 的日程安排，并同步至经理的日历。',
          textEn: 'I am creating the Day 1 schedule in Teams and syncing it to the manager calendar.',
        },
        {
          agent: 'schedule',
          phase: 'after',
          textZh: `Teams 日程已创建完成，${ctx.directManager} 可以在 Outlook 日历中查看 ${n(ctx)} Day 1 的具体安排。`,
          textEn: `The Teams schedule has been created. ${ctx.directManager} can view ${n(ctx)}'s Day 1 plan in Outlook.`,
        },
      ],
    },
    {
      id: 'day1-hr-confirm-task',
      progressLabelZh: 'Day 1 入职确认',
      progressLabelEn: 'Day 1 completion check',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: `你好，我是任务创建智能体，接下来我会为 HR ${ICI_ROLE_CONTACTS.hr.name} 创建一条“确认新员工 Day 1 入职完成情况”的待办任务。`,
          textEn: `Hi, I am the task creation agent. I will create a Day 1 completion check task for HR ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 ${ICI_ROLE_CONTACTS.hr.name} 创建 Day 1 确认任务，等待她核实入职当天各环节是否完成。`,
          textEn: `I am creating the Day 1 confirmation task for ${ICI_ROLE_CONTACTS.hr.name}.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，${ICI_ROLE_CONTACTS.hr.name} 可以在 "My Tasks" 中查看并标记完成状态。`,
          textEn: `The task has been created. ${ICI_ROLE_CONTACTS.hr.name} can mark completion in "My Tasks".`,
        },
      ],
    },
    {
      id: 'day2-payroll-confirm-task',
      progressLabelZh: 'Day 2 福利登记',
      progressLabelEn: 'Day 2 benefits enrollment',
      agentNameZh: '任务创建',
      agentNameEn: 'Task Creation',
      utterances: [
        {
          agent: 'task',
          phase: 'before',
          textZh: `你好，我是任务创建智能体，接下来我会为 Payroll ${ICI_ROLE_CONTACTS.payroll.name} 创建一条“确认新员工福利登记是否完成”的待办任务。`,
          textEn: `Hi, I am the task creation agent. I will create a benefits enrollment confirmation task for Payroll ${ICI_ROLE_CONTACTS.payroll.name}.`,
        },
        {
          agent: 'task',
          phase: 'during',
          textZh: `我正在为 ${ICI_ROLE_CONTACTS.payroll.name} 创建福利登记确认任务，等待他核实 ${n(ctx)} 的福利登记状态。`,
          textEn: `I am creating the benefits enrollment confirmation task for ${ICI_ROLE_CONTACTS.payroll.name}.`,
        },
        {
          agent: 'task',
          phase: 'after',
          textZh: `任务已创建完成，${ICI_ROLE_CONTACTS.payroll.name} 可以在 "My Tasks" 中查看并标记福利登记的完成状态。`,
          textEn: `The task has been created. ${ICI_ROLE_CONTACTS.payroll.name} can mark benefits enrollment completion in "My Tasks".`,
        },
      ],
    },
  ]
}

export function getApplicableIciFlowSteps(ctx: IciFlowContext) {
  return buildIciFlowStepDefs(ctx).filter((step) => !step.skipWhen?.(ctx))
}

export function mapIciAgentToRuntimeAgent(agent: IciAgentKey): JoyceExperienceSnapshot['currentAgentId'] {
  switch (agent) {
    case 'info':
      return 'hr'
    case 'case':
      return 'it'
    case 'task':
      return 'device'
    case 'taskowner':
    case 'comm':
    case 'sla':
    case 'progress':
      return 'followup'
    case 'schedule':
      return 'schedule'
    default:
      return 'followup'
  }
}

export function mapRuntimeAgentToIciAgent(agentId: string): IciAgentKey {
  switch (agentId) {
    case 'hr':
      return 'info'
    case 'it':
      return 'case'
    case 'device':
      return 'task'
    case 'schedule':
      return 'schedule'
    case 'followup':
      return 'comm'
    default:
      return 'info'
  }
}

export type IciProgressStepView = {
  id: string
  label: string
  status: 'completed' | 'active' | 'pending'
  agentName?: string
  kind?: 'default' | 'branch' | 'approval'
  branchMeta?: {
    paths: Array<{ id: string; label: string }>
    selectedPathId: string | null
  }
}

/** 进度条上仅作 Agent 节点展示，不在 UI 中展开条件分支 */
const AGENT_ONLY_PROGRESS_STEP_IDS = new Set(['welcome-email'])

function mapIciProgressStepView(
  step: IciFlowStepDef,
  status: IciProgressStepView['status'],
  locale: 'zh' | 'en',
  ctx: IciFlowContext,
): IciProgressStepView {
  const forceAgentNode = AGENT_ONLY_PROGRESS_STEP_IDS.has(step.id)
  const kind = forceAgentNode ? 'default' : step.kind
  const branchMeta =
    forceAgentNode || !step.branchMeta
      ? undefined
      : {
          paths: step.branchMeta.paths.map((path) => ({
            id: path.id,
            label: locale === 'zh' ? path.labelZh : path.labelEn,
          })),
          selectedPathId:
            status === 'completed' ? resolveIciBranchPath(step.id, ctx) : null,
        }

  return {
    id: step.id,
    label: locale === 'zh' ? step.progressLabelZh : step.progressLabelEn,
    status,
    agentName: locale === 'zh' ? step.agentNameZh : step.agentNameEn,
    kind,
    branchMeta,
  }
}

export function buildIciProgressSteps(
  ctx: IciFlowContext,
  currentStepId: string,
  locale: 'zh' | 'en',
): IciProgressStepView[] {
  const steps = getProgressVisibleStepDefs(ctx, currentStepId)
  if (currentStepId === 'completed') {
    return steps.map((step) => mapIciProgressStepView(step, 'completed', locale, ctx))
  }

  const allSteps = buildIciFlowStepDefs(ctx)
  const currentIndex = getProgressCurrentIndex(allSteps, currentStepId)

  return steps.map((step) => {
    const index = allSteps.findIndex((candidate) => candidate.id === step.id)
    let status: 'completed' | 'active' | 'pending' = 'pending'
    if (index >= 0 && index < currentIndex) status = 'completed'
    if (index === currentIndex) status = 'active'

    return mapIciProgressStepView(step, status, locale, ctx)
  })
}

export function buildIciHandoffCopy(
  step: IciFlowStepDef,
  previousAgent: IciAgentKey,
  nextAgent: IciAgentKey,
  locale: 'zh' | 'en',
) {
  return {
    title:
      locale === 'zh'
        ? step.handoffTitleZh ?? `${ICI_AGENT_LABELS[previousAgent].zh} -> ${ICI_AGENT_LABELS[nextAgent].zh}`
        : step.handoffTitleEn ??
          step.handoffTitleZh ??
          `${ICI_AGENT_LABELS[previousAgent].en} -> ${ICI_AGENT_LABELS[nextAgent].en}`,
    hint:
      locale === 'zh'
        ? `${ICI_AGENT_LABELS[previousAgent].zh}Agent 转交给 ${ICI_AGENT_LABELS[nextAgent].zh}Agent`
        : `${ICI_AGENT_LABELS[previousAgent].en} Agent hands off to ${ICI_AGENT_LABELS[nextAgent].en} Agent`,
  }
}

export function getIciStepLastAgent(step: IciFlowStepDef): IciAgentKey | null {
  return step.utterances[step.utterances.length - 1]?.agent ?? null
}

export function getIciStepFirstAgent(step: IciFlowStepDef): IciAgentKey | null {
  return step.utterances[0]?.agent ?? null
}

export function getIciStepUtterance(
  ctx: IciFlowContext,
  stepId: string,
  phase: IciAgentPhase,
  locale: 'zh' | 'en',
) {
  const step = buildIciFlowStepDefs(ctx).find((item) => item.id === stepId)
  const utterance = step?.utterances.find((item) => item.phase === phase)
  if (!utterance) return null
  return locale === 'zh' ? utterance.textZh : utterance.textEn
}

export function getNextIciStepId(ctx: IciFlowContext, currentStepId: string) {
  const steps = getApplicableIciFlowSteps(ctx)
  const index = steps.findIndex((step) => step.id === currentStepId)
  if (index < 0) return steps[0]?.id ?? 'info-collect'
  return steps[index + 1]?.id ?? 'completed'
}
