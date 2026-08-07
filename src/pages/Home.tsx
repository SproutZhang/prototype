import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AgentLibraryPage } from './AgentLibraryPage'
import { ExperienceHubPage } from './ExperienceHubPage'
import { ScenarioConfigPage, type WorkspaceRunsTestSnapshot } from './ScenarioConfigPage'
import { AnalyticsPage } from './AnalyticsPage'
import { ToolsDirectoryPage } from './ToolsDirectoryPage'
import { createInstalledMarketSkillItem, INITIAL_SKILLS, SkillsPage, type SkillItem } from './SkillsPage'
import { JoyceAiPanel, type JoyceChatMessage } from '../components/shared/JoyceAiPanel'
import {
  HomeOnboardingShortcuts,
} from '../components/HomeOnboardingShortcuts'
import { HomePendingApprovalPopover } from '../components/HomePendingApprovalPopover'
import {
  getOnboardShortcutAgentTitle,
  getOnboardShortcutWorkflowTitle,
  getPlanWorkflowEntryTrigger,
  matchesOnboardShortcutAgent,
  matchesPlanWorkflowEntry,
} from '../i18n/homeStrings'
import {
  buildHrTicketId,
  buildRecruitFollowUpQuestion,
  buildRecruitHrSubmitReply,
  buildRecruitJdDocument,
  buildRecruitJdReadyReply,
  createRecruitRequirements,
  getMissingRecruitFields,
  isRecruitJdConfirmIntent,
  isRecruitJdContinueEditIntent,
  isRecruitJdEntry,
  parseRecruitRequirements,
  recruitJdAskWhatToEdit,
  recruitJdConfirmChoices,
  recruitJdDoneHint,
  recruitJdEntryHint,
  type RecruitRequirements,
  type UserRecruitJdTurn,
} from '../features/recruit-jd/userRecruitJdChat'
import { PlanAgentCreateModal } from '../components/PlanAgentCreateModal'
import { HomeSessionView, type PlanWorkflowBlueprint } from './HomeSessionView'
import type { Agent, DropdownOption } from '../types/agent'
import { buildInitialPublishedAgentNameSet } from '../i18n/agentLibraryStrings'
import { buildInitialPublishedScenarioSourceSet } from '../i18n/scenarioStrings'
import { resolveCurrentMemberId } from '../modules/team-collaboration-space/utils/currentMember'
import { listHomePendingApprovalTasks } from '../modules/team-collaboration-space/utils/homePendingApprovalTasks'
import { appendUserRecruitJdRequest, subscribeUserInitiatedRequestsSync } from '../modules/team-collaboration-space/utils/userInitiatedRequestsSync'
import {
  confirmOnboardingCandidate,
  listRecruitPassedCandidatesForHm,
  subscribeOnboardingCandidatesSync,
} from '../modules/team-collaboration-space/utils/recruitPassedCandidatesSync'
import { buildTeamPath } from '../modules/team-collaboration-space/utils/routing'
import { syncUserContentFromAgents, syncUserContentFromSkills, syncUserContentFromTools } from '../modules/team-collaboration-space/utils/userContentSync'
import {
  USER_CONTENT_DELETED_EVENT,
  type UserContentDeletedDetail,
} from '../modules/team-collaboration-space/utils/contentLifecycleSync'
import {
  MINE_CONTENT_NAV_EVENT,
  type MineContentNavDetail,
} from '../modules/team-collaboration-space/utils/mineContentNavigation'
import type { SharedOnboardingTriggerKind } from '../types/onboardingTrigger'
import {
  PLAN_WORKFLOW_COLLAB_CHOICE_LINES,
  PLAN_WORKFLOW_SCOPE_CHOICE_LINES,
} from '../data/plan-workflow-quiz-options'
import { getRunHistoryChatSnapshot, hasRunHistoryChatSnapshot } from '../data/home-run-history-chats'
import { useLocale } from '../i18n/LocaleContext'
import {
  HISTORY_IDS,
  getRunHistoryRowAriaLabel,
  getRunHistoryStatusAria,
  historyItemMatchesQuery,
  localizeRunHistoryItems,
  type RunHistoryItem,
  type RunHistoryKind,
} from '../i18n/historyStrings'
import { AppMarketPage, type AppMarketItem } from '../modules/app-market'
import { buildWorkspaceAgentFromTemplate } from '../modules/app-market/applyAppMarketTemplate'
import type { AppMarketScenarioWorkflowStep } from '../modules/app-market/shared/types'
import { KnowledgeBasePage } from '../modules/knowledge-base'
import {
  AccessControlPage,
  AccessControlSidebarNav,
  isAccessControlPath,
  useAccessControlNavigation,
  type AccessControlSection,
} from '../modules/access-control'
import {
  TeamCollaborationSpacePage,
  TeamCollaborationSidebarNav,
  isTeamPath,
  useTeamCollaborationNavigation,
  type TeamCollaborationNavSection,
} from '../modules/team-collaboration-space'
import { consumePendingRoute } from '../auth/session'
import { isLoginRoleTier } from '../auth/types'
import { resolveAuthorizedPage, type AppPage } from '../auth/rbac'
import { useRbac } from '../auth/useRbac'
import { createToolDirectoryItemFromAppMarket, TOOL_DIRECTORY_ITEMS, type ToolDirectoryItem } from '../data/tools-directory'
import { SKILLS_CATALOG } from '../modules/app-market/skills'

/** 首页落地页是否展示 Plan Mode 切换 chip（false = 仅隐藏 UI，Plan 会话逻辑保留） */
const HOME_LANDING_PLAN_MODE_VISIBLE = true

function homeLandingDefaultMode(): 'plan' | 'build' {
  return HOME_LANDING_PLAN_MODE_VISIBLE ? 'plan' : 'build'
}

/** 部分环境未暴露 DOM SpeechRecognition 类型，此处用最小结构满足首页语音输入 */
type ComposerSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: ComposerSpeechRecognitionResultEvent) => void) | null
}

type ComposerSpeechRecognitionResultEvent = {
  results: ArrayLike<{ [index: number]: { transcript: string } }>
}

function createBrowserSpeechRecognition(): ComposerSpeechRecognition | null {
  if (typeof globalThis.window === 'undefined') return null
  const w = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => ComposerSpeechRecognition
    webkitSpeechRecognition?: new () => ComposerSpeechRecognition
  }
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return ctor ? new ctor() : null
}

/** Plan 澄清与生成完成后，下方结构化草案（与对话为同一 Joyce 会话） */
type PlanAgentBlueprint = {
  name: string
  role: string
  rolePrompt: string
  /** 编排内专业子 Agent（侧栏展示） */
  subAgents?: readonly { name: string; description: string }[]
  /** 对话主模型（与 HomeSessionView 侧栏一致） */
  chatModel: string
  chatModelOptions?: string[]
  tools: string[]
}

type PlanFlowTurn = null | 'awaitR1' | 'awaitR1Type' | 'awaitR2' | 'awaitR2Type' | 'awaitR3' | 'awaitR3Type' | 'done'

const PLAN_CHOICES_R1: string[] = [
  '材料与证件 + 账号与权限',
  '培训与考核 + 工位与设备',
  '全流程（从 Offer 到首周跟进）',
]

const PLAN_CHOICES_R2: string[] = [
  'HR 主导，协调经理与 IT',
  '多角色协作（HR / 经理 / IT / 员工）',
  '员工自助为主，关键节点人工确认',
]

const PLAN_R3_SUPPLEMENT = '尚不完整，我要补充说明'

/** 首轮多选问卷提交/跳过后写入用户气泡，供 awaitR1 识别并进入第二轮（与旧 chip 文案分支并列） */
const PLAN_DETAIL_QUIZ_ACK_PREFIX = '【入职方案采集】'

const PLAN_WORKFLOW_JOYCE_Q1 =
  '我是 Joyce，将与您一起梳理「新员工入职工作流」要覆盖的阶段与参与方。请直接点击下方选项，选择最接近的流程范围。'

const PLAN_WORKFLOW_JOYCE_Q2 =
  '已收到。接下来请确认：流程里**谁发起、谁执行、哪些步骤必须人工确认**。请直接点击下方选项，选择最接近的协作方式。'

/** 工作流 Plan：未匹配预设选项时再次引导（仅选项，不再进入自由输入补充态） */
const PLAN_WORKFLOW_CHIP_NUDGE_R1 = '请直接点击下方选项之一，以便继续梳理流程范围。'

const PLAN_WORKFLOW_CHIP_NUDGE_R2 = '请直接点击下方选项之一，以便继续确认协作方式。'

const PLAN_WORKFLOW_JOYCE_Q3 =
  '好的。我已经理解你的流程边界，即将在左侧生成「工作流草案」版块（仅结构与说明，不直接生成可执行引擎）。'

const PLAN_WORKFLOW_R1_TYPE_HINT =
  '请用一两句话描述流程要覆盖的阶段或特殊场景（例如跨国、外包、多法人），发送后继续。'

const PLAN_WORKFLOW_R2_TYPE_HINT =
  '请说明谁发起、谁审批、哪些环节并行或必须串行，发送后继续。'

const PLAN_WORKFLOW_R3_TYPE_HINT =
  '请补充仍缺的合规或系统约束，发送后我会再请你确认是否生成左侧草案版块。'

const PLAN_JOYCE_Q1 =
  '我是 Joyce，将与您协作完成「新员工入职」智能体的设计。为帮您对齐方案，我会分两步收集偏好：第一步先选择系统主要服务的角色；第二步再选择入职与培训流程中的关键环节。请先完成下方第一步。'

/** Plan Mode 落地输入为该文案时：先展示思考态，再出现首条 Joyce 回复 */
const PLAN_MODE_ENTRY_THINK_TRIGGER = '入职智能体'
/** Build Mode：与该口令等价时可触发入职演示（见 isBuildModeOnboardAgentEntry，含首页快捷「辅助新员工入职智能体」） */
const BUILD_MODE_ENTRY_ONBOARD_AGENT = '新员工入职智能体'
/** Build 入职演示：首段思考与末段思考时长 */
const BUILD_ONBOARD_INTRO_THINK_MS = 1000
/** 英文 plan_creator 轨迹：逐字出现总时长，结束后立刻移除该气泡 */
const BUILD_ONBOARD_TRACE_TYPE_MS = 1000

const BUILD_ONBOARD_AGENT_INTRO_EN =
  'The user wants to create an intelligent agent to assist with new employee onboarding, helping HR collect information, IT account configuration, onboarding training, and other processes. Let me create a plan for this flow. This is a new flow request, so I\'ll start with the plan_creator tool.'

const BUILD_ONBOARD_AGENT_INTRO_ZH =
  '太棒了！这是个很实用的自动化场景！我来为您规划一个新员工入职智能助手的流程，涵盖 HR 信息收集、IT 账户配置和入职培训等环节。让我先制定计划 😊'

/** 流程规划表逐条显现约 9×420ms，再开始后续助理句（与 HomeSessionView 中 BUILD_FLOW_PLAN_* 对齐） */
const BUILD_ONBOARD_FLOW_PLAN_REVEAL_PAD_MS = 9 * 420 + 300
/** 每条「工具步骤」助理气泡独占展示时长 ms；到期后与上一条同一天 replace，下一条立即接上（不向列表累积多条） */
const BUILD_ONBOARD_FOLLOW_LINE_GAP_MS = 600

const BUILD_ONBOARD_FOLLOW_UP_LINES = [
  '规划新员工入职智能体流程',
  '搜索 Google Forms 触发节点',
  '配置员工信息输入字段',
  '添加数据验证规范化节点',
  '配置数据验证规范化参数',
  '配置 IT 账户申请邮件内容',
  '添加 AI 生成欢迎邮件节点',
] as const

/** Build 入职工作流演示：与智能体序列结构一致，文案改为工作流语义 */
const BUILD_WORKFLOW_ONBOARD_INTRO_EN = `The user wants to create a workflow to assist new employee onboarding, helping HR collect information, IT account configuration, onboarding training, etc. Let me think about what tools and integrations are available, and design a comprehensive onboarding workflow. Let me first check what skills and tools are available, and then think about what kind of automation I can create for this. The user wants: 1. HR information collection 2. IT account configuration 3. Onboarding training processes Let me think about what I can build with the available integrations: - Gmail: Send emails - Slack: Send messages - Google Sheets: Store/track data - Notion: Create documentation/pages - Google Forms (via triggers): Collect information I should create a comprehensive onboarding workflow. Let me think about what makes sense: 1. HR Information Collection: Use Google Forms (trigger) or create a Notion page with a form, or collect via email 2. IT Account Setup: Send notifications/checklists to IT team via Slack/Email 3. Onboarding Training: Create Notion pages with training materials Let me design this as an automation: - Trigger: When a new employee form is submitted (Google Forms / Google Sheets) - Actions: 1. Send welcome email to new employee 2. Send IT setup Now I'm mapping out the full workflow: when a new employee submits their information through Google Forms, I'll trigger a series of actions—sending a welcome email, notifying the IT team via Slack with setup instructions, storing their data in Google Sheets for tracking, and creating a Notion page with their personalized onboarding training materials. Let me explore what integrations are available to understand the full scope of what I can build, then I'll design the complete automation workflow.`

const BUILD_WORKFLOW_ONBOARD_INTRO_ZH =
  '太棒了！这是个很实用的自动化场景！我来为您规划一个新员工入职工作流的编排方案，涵盖 HR 信息收集、IT 账户配置和入职培训等环节。让我先制定计划 😊'

const BUILD_WORKFLOW_FOLLOW_UP_LINES = [
  '规划新员工入职工作流',
  '搜索 Google Forms 触发节点',
  '配置员工信息输入字段',
  '添加数据验证规范化节点',
  '配置数据验证规范化参数',
  '配置 IT 账户申请邮件内容',
  '添加 AI 生成欢迎邮件节点',
] as const

/** Build 工作流草案已落地后：会话内追问增改时引导至构建器（与 Joyce 侧栏一致口径） */
const BUILD_MODE_WORKFLOW_BUILDER_EDIT_HINT =
  '当前工作流已创建完成。若需增加或修改节点与编排，请在构建器中调整：可点击左侧草案区「创建」进入后续流程，或前往「场景配置」打开该工作流在可视化编辑器中继续编辑。'

/** Build 智能体草案已落地后：与会话内工作流引导同文案（说明与创建入口一致） */
const BUILD_MODE_AGENT_BUILDER_EDIT_HINT = BUILD_MODE_WORKFLOW_BUILDER_EDIT_HINT

/** Plan 会话内：每次助理正式回复前展示思考态的时长（与落地首条一致） */
const PLAN_ASSISTANT_THINK_MS = 2000
const USER_RECRUIT_JD_THINK_MS = 1200

function isPlanEntryThinkingTrigger(trimmedUserLine: string): boolean {
  return (
    trimmedUserLine === PLAN_MODE_ENTRY_THINK_TRIGGER ||
    matchesOnboardShortcutAgent(trimmedUserLine)
  )
}

/** 落地或会话首条：输入「入职工作流」等进入工作流 Plan 采集（须晚于智能体触发判断） */
function isPlanWorkflowEntryThinkingTrigger(trimmedUserLine: string): boolean {
  const s = trimmedUserLine.trim()
  if (!s) return false
  if (isPlanEntryThinkingTrigger(s)) return false
  return matchesPlanWorkflowEntry(s)
}

function isBuildModeOnboardAgentEntry(trimmedUserLine: string): boolean {
  const s = (trimmedUserLine || '').trim()
  return s === BUILD_MODE_ENTRY_ONBOARD_AGENT || matchesOnboardShortcutAgent(s)
}

/** Build Mode：与 Plan 相同语义的工作流入口（如「入职工作流」），不与 Build 智能体口令重叠 */
function isBuildModeOnboardWorkflowEntry(trimmedUserLine: string): boolean {
  const s = (trimmedUserLine || '').trim()
  if (!s) return false
  if (isBuildModeOnboardAgentEntry(s)) return false
  return isPlanWorkflowEntryThinkingTrigger(s)
}

/** Build 入职演示：两条富气泡均已写入会话则视为已完成，避免再次触发整段动画 */
function sessionMessagesIncludeBuildOnboardingRichPair(messages: JoyceChatMessage[]): boolean {
  let hasPlan = false
  let hasComplete = false
  for (const m of messages) {
    if (m.richBubble === 'build-onboarding-flow-plan') hasPlan = true
    else if (m.richBubble === 'build-onboarding-build-complete') hasComplete = true
    if (hasPlan && hasComplete) return true
  }
  return false
}

type PlanConversationKind = 'agent' | 'workflow'

/** 入职工作流首轮：思考结束后短时展示的英文规划轨迹（2s 内播满，随后接中文 Q1） */
const WORKFLOW_PLANNER_TRACE_TYPING_MS = 2000
const WORKFLOW_PLANNER_TRACE_TEXT = `The user wants to create a workflow to assist new employee onboarding, helping HR collect information, IT account configuration, onboarding training, etc. Let me think about what tools and integrations are available, and design a comprehensive onboarding workflow. Let me first check what skills and tools are available, and then think about what kind of automation I can create for this. The user wants: 1. HR information collection 2. IT account configuration 3. Onboarding training processes Let me think about what I can build with the available integrations: - Gmail: Send emails - Slack: Send messages - Google Sheets: Store/track data - Notion: Create documentation/pages - Google Forms (via triggers): Collect information I should create a comprehensive onboarding workflow. Let me think about what makes sense: 1. HR Information Collection: Use Google Forms (trigger) or create a Notion page with a form, or collect via email 2. IT Account Setup: Send notifications/checklists to IT team via Slack/Email 3. Onboarding Training: Create Notion pages with training materials Let me design this as an automation: - Trigger: When a new employee form is submitted (Google Forms / Google Sheets) - Actions: 1. Send welcome email to new employee 2. Send IT setup Now I'm mapping out the full workflow: when a new employee submits their information through Google Forms, I'll trigger a series of actions—sending a welcome email, notifying the IT team via Slack with setup instructions, storing their data in Google Sheets for tracking, and creating a Notion page with their personalized onboarding training materials. Let me explore what integrations are available to understand the full scope of what I can build, then I'll design the complete automation workflow.`

function planJoyceFor(kind: PlanConversationKind) {
  if (kind === 'workflow') {
    return {
      q1: PLAN_WORKFLOW_JOYCE_Q1,
      c1: [...PLAN_WORKFLOW_SCOPE_CHOICE_LINES],
      q2: PLAN_WORKFLOW_JOYCE_Q2,
      c2: [...PLAN_WORKFLOW_COLLAB_CHOICE_LINES],
      q3: PLAN_WORKFLOW_JOYCE_Q3,
      r1Hint: PLAN_WORKFLOW_R1_TYPE_HINT,
      r2Hint: PLAN_WORKFLOW_R2_TYPE_HINT,
      r3Hint: PLAN_WORKFLOW_R3_TYPE_HINT,
      /** 工作流完成条使用 richBubble 卡片展示，此处仅占位 */
      result: '',
    }
  }
  return {
    q1: PLAN_JOYCE_Q1,
    c1: PLAN_CHOICES_R1,
    q2: PLAN_JOYCE_Q2,
    c2: PLAN_CHOICES_R2,
    q3: PLAN_JOYCE_Q3,
    r1Hint: PLAN_R1_TYPE_HINT,
    r2Hint: PLAN_R2_TYPE_HINT,
    r3Hint: PLAN_R3_TYPE_HINT,
    /** 智能体 Plan 完成条：正文见 `plan-multi-agent-system-created` 富气泡，此处保留可访问性摘要 */
    result: PLAN_MULTI_AGENT_RESULT_ARIA,
  }
}

const PLAN_JOYCE_Q2 =
  '已收到。接下来请确认：主要使用对象及协作方式。请选择一种协作模式；若无完全匹配，请在下方输入框说明后再发送。'

const PLAN_JOYCE_Q3 = '好的。我已经理解你的需求，即将为您生成智能体'

const PLAN_R1_TYPE_HINT =
  '请在下框用一两句话描述你希望覆盖的范围或特殊场景，发送后继续。'

const PLAN_R2_TYPE_HINT =
  '请在下框说明主要使用者与协作方式（例如谁发起、谁审批、谁自助查看），发送后继续。'

const PLAN_R3_TYPE_HINT =
  '请在下框补充仍欠缺或需要调整的部分，发送后我会再请你确认是否生成草案。'

const PLAN_AFTER_FREE_ACK = `已了解。若可以生成方案，请输入「确认」或「开始」等；若仍不对请继续说明，或输入「${PLAN_R3_SUPPLEMENT}」以补充说明。`

/** Plan 智能体生成完成富卡片：供屏幕阅读器 / 无样式回退的纯文本摘要 */
const PLAN_MULTI_AGENT_RESULT_ARIA = '太棒了！我已经创建好了完整的员工入职培训多代理系统。'

/** Plan 已完成对话内：用户提出增加「办公物品派发」能力后的首段确认（思考结束后先出） */
const PLAN_OFFICE_SUPPLIES_ACK = `明白了！我们可以为「新员工入职管家」增加一个办公物品配置模块，让智能体在入职流程中引导新员工填写所需办公设备和物品，例如电脑型号、显示器、办公桌椅、钥匙卡等。填写完成后，这些信息可以同步到 Notion 或相关系统，便于行政部门统一准备和分发；`

/** 用户通过「办公物品派发」增补流程后，同步更新侧栏草案「角色」文案（默认草案不变，仅此时写入） */
const PLAN_OFFICE_SUPPLIES_BLUEPRINT_ROLE =
  '面向新员工的入职全程陪同助手，负责资料收集、办公物品配置、IT 工具说明与入企文化培训引导。'

/** 同上：侧栏「角色提示词」全文替换 */
const PLAN_OFFICE_SUPPLIES_BLUEPRINT_ROLE_PROMPT = `你是新员工入职助手，负责全程引导和协助新员工完成入职流程，包括信息收集、IT账号创建、办公物品分发、培训安排，以及入职后的跟踪与支持。

**总流程：**

1. **信息收集判断**
   - 收集员工基本信息：姓名、联系方式、岗位、部门、工作模式（居家办公或公司办公）。
   - 判断信息是否完整：
       - 如果信息完整 → 进入 IT账号创建和培训安排节点。
       - 如果信息不完整 → 进入信息补充节点，提示员工补充缺失信息，收集完成后回到信息完整判断。

2. **信息补充节点（循环）**
   - 列出缺失信息项。
   - 提示员工补充缺失信息。
   - 收到补充信息后重新判断信息完整性：
       - 信息仍不完整 → 继续循环。
       - 信息完整 → 进入 IT账号创建和培训安排节点。

3. **IT账号创建节点**
   - 根据员工岗位和工作模式创建所需账号：
       - 居家办公：VPN、远程桌面、Slack、Zoom 等远程工具账号。
       - 公司办公：公司邮箱、CRM、考勤系统等内部账号。
   - 确保权限正确，并向员工提供账号使用说明。

4. **办公物品分发节点**
   - 根据员工工作模式分发办公设备：
       - 居家办公：笔记本电脑、耳机、显示器、办公桌等。
       - 公司办公：桌面电脑、显示器、电话、办公桌、门禁卡等。
   - 提供物品领取或配送指引。

5. **培训安排节点**
   - 分配岗位相关培训：
       - 居家办公：远程办公工具使用、远程沟通与协作、安全与数据保护培训。
       - 公司办公：公司文化、办公室安全、岗位技能培训。
   - 确保培训信息发送给员工，并记录培训完成状态。

6. **入职后跟踪与支持节点**
   - 定期检查员工培训完成情况，如果未完成，提醒继续完成。
   - 检查IT账号是否能正常使用，并提供操作指导或解决问题。
   - 确认办公设备是否完整，如有缺失或故障，提供补充或维修方案。
   - 收集员工入职体验反馈，包括岗位适应情况、问题和建议。
   - 设置时间节点提醒（如第1周、第2周、第1个月）进行重复检查和跟进，确保新员工顺利适应岗位。
   - 将所有信息汇总生成报告，供 HR 或主管参考。

7. **汇总与完成**
   - 汇总整个入职流程状态，包括信息收集、账号创建、办公物品分发、培训安排和入职后跟踪。
   - 生成完整入职报告，并标记入职流程结束。

**规则说明**
- 任意环节发现信息不完整 → 自动跳转到信息补充节点循环。
- 所有任务必须根据工作模式和岗位自动调整。
- 保持沟通简洁，确保员工理解每一步操作。
- 节点间逻辑清晰，形成完整的入职生命周期管理：信息收集 → IT账号创建/办公物品分发/培训安排 → 入职后跟踪 → 完成汇总。`

function isPlanOfficeSuppliesFeatureRequest(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/办公物品|物品派发|办公用品派发|办公设备|钥匙卡|显示器|办公桌椅/i.test(t)) return true
  if (/派发/.test(t) && /办公|用品|物品|设备/.test(t)) return true
  if (/增加|新增|补充|加上|扩展/.test(t) && /办公|物品|用品|设备|行政/.test(t)) return true
  return false
}

function focusTextareaAtEnd(ref: RefObject<HTMLTextAreaElement | null>) {
  queueMicrotask(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    const len = el.value.length
    el.setSelectionRange(len, len)
  })
}

function createPlanAgentBlueprintDemo(): PlanAgentBlueprint {
  return {
    name: '新员工入职管家 (Onboarding Concierge)',
    role: '面向新员工的入职全程陪同助手，负责资料收集、IT 工具说明与入企文化培训引导。',
    rolePrompt: `你是新员工入职助手，负责指导和辅助新员工完成入职流程。你的任务包括：信息收集、IT账号创建、办公设备和物品分配，以及员工培训安排。

**任务流程：**

1. **信息收集**
   - 收集新员工的基本信息，包括姓名、联系方式、岗位、部门、工作模式（居家办公或公司办公）。
   - 判断信息是否完整：
       - 如果信息完整 → 进入 IT 账号创建和培训安排环节。
       - 如果信息不完整 → 提示员工补充缺失信息，并循环判断直到信息完整。

2. **IT 账号创建**
   - 根据员工工作模式和岗位创建必要的账号：
       - 居家办公：创建远程办公工具账号（VPN、远程桌面、Slack、Zoom 等）。
       - 公司办公：创建公司内部系统账号（公司邮箱、CRM、考勤系统等）。
   - 确保账号权限正确，并向员工提供使用指南。

3. **办公设备与物品分配**
   - 根据工作模式分配办公设备：
       - 居家办公：笔记本电脑、耳机、显示器、办公桌等。
       - 公司办公：桌面电脑、显示器、电话、办公桌、门禁卡等。
   - 提供物品领取或配送的指引。

4. **员工培训安排**
   - 分配岗位相关培训课程：
       - 居家办公：远程办公工具使用、远程沟通与协作、安全与数据保护培训。
       - 公司办公：公司文化培训、办公室安全培训、岗位技能培训。
   - 确保培训信息被员工接收，并记录培训进度。

**行为规则：**
- 所有任务必须根据员工工作模式和岗位自动调整。
- 在任何环节发现信息不完整时，立即提示员工补充信息。
- 任务完成后，生成一份汇总报告，包含信息收集结果、账号创建状态、物品分配和培训安排。
- 保持沟通简洁明了，确保员工理解每一步需要做什么。`,
    chatModel: 'OpenAI / gpt-4.1',
    chatModelOptions: ['OpenAI / gpt-4.1', 'OpenAI / gpt-4o', 'Anthropic / Claude 3.5 Sonnet'],
    tools: ['Notion', 'Slack', 'Google Drive', 'Google Workspace', '知识来源（演示）'],
    subAgents: [
      {
        name: '信息收集子 Agent',
        description: '收集入职材料、字段校验与缺失提醒，可与表单/HRIS 对接并回写完成度。',
      },
      {
        name: 'IT 开通子 Agent',
        description: '按岗位模板开通邮箱、VPN、协作套件与业务权限，跟踪工单状态并输出使用指引。',
      },
      {
        name: '培训与文化子 Agent',
        description: '映射必修/选修课程、融入节奏与导师/经理待办，避免培训与报到日程冲突。',
      },
      {
        name: '行政与资产子 Agent',
        description: '协调工位、设备、门禁与办公物品申领签收，汇总异常并提醒行政闭环。',
      },
    ],
  }
}

function createPlanWorkflowBlueprintDemo(): PlanWorkflowBlueprint {
  return {
    name: '新员工入职自动化工作流',
    goal: '从 Offer 或录用确认触发，串联材料、账号、工位与培训，在首周/首月完成可追踪闭环。',
    stages: `1. 启动与资料：触发条件、候选人信息、合同与证件清单。
2. 账号与权限：IT 开通邮箱/协作工具/VPN，权限模板按岗位套用。
3. 行政与资产：工位、门禁、设备领用与签收。
4. 培训与融入：必修课程、导师见面、首日议程。
5. 收尾与审计：完成度检查、异常工单、归档与通知。`,
    handoffs: `• HR：发起流程、校验材料齐备、通知业务经理。
• IT：按工单创建账号与权限，回写状态。
• 行政：资产与门禁，同步后勤排期。
• 直线经理：培训与目标对齐，确认到岗准备。`,
    integrations: 'Slack · Notion · 企业邮箱 · HRIS / ATS（演示占位，可按组织替换）',
    steps: [
      {
        id: 'wf-step-1',
        title: '创建入职项目与计划',
      },
      {
        id: 'wf-step-send-welcome',
        title: '准备并发送欢迎邮件',
      },
      {
        id: 'wf-step-2',
        title: '配置IT设备和账户',
      },
      {
        id: 'wf-step-3',
        title: '制定个性化培训计划',
      },
      {
        id: 'wf-step-4',
        title: '监督验证整个流程',
      },
    ],
  }
}

type HomeProps = {
  onLogout?: () => void
}

type RunHistoryKindFilter = 'all' | RunHistoryItem['kind']

function RunHistoryRowKindIcon({ kind }: { kind: RunHistoryKind }) {
  const svgProps = {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    'aria-hidden': true as const,
    focusable: false as const,
  }
  if (kind === 'chat') {
    return (
      <svg {...svgProps}>
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (kind === 'agent') {
    return (
      <svg {...svgProps}>
        <path
          d="M12 3v2M9 5h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="5"
          y="7"
          width="14"
          height="12"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="9.5" cy="12" r="1.25" fill="currentColor" />
        <circle cx="14.5" cy="12" r="1.25" fill="currentColor" />
        <path
          d="M10 16h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg {...svgProps}>
      <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="16" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8.4 10.6 15.3 8.5M8.4 13.4 15.3 15.5M18 10.6v2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 父行 s2「新员工入职工作流」仅在点击「按类型筛选」展开分组后显示；收起时为扁平列表且不包含该行 */
const ONBOARDING_SCENARIO_GROUP_PARENT_ID = HISTORY_IDS.onboardingWorkflowGroup
const ONBOARDING_SCENARIO_GROUP_CHILD_IDS = new Set([
  HISTORY_IDS.onboardingScenario,
  HISTORY_IDS.salesManagerOnboarding,
  HISTORY_IDS.seniorRdOnboarding,
  HISTORY_IDS.identityVerification,
  HISTORY_IDS.opsManagerOnboarding,
  HISTORY_IDS.juniorOpsOnboarding,
])

type SidebarHistoryRenderRow = {
  type: 'run'
  run: RunHistoryItem
  nestedUnderOnboarding?: boolean
  /** 展开类型筛选：与上方同 id 的对话行，挂在本行 Agent 下 */
  nestedUnderAgentChat?: boolean
  rowKey?: string
  parentAgentLabel?: string
}

function pushMenuOpenRunWithLinkedAgentChats(
  out: SidebarHistoryRenderRow[],
  item: { type: 'run'; run: RunHistoryItem; nestedUnderOnboarding?: boolean },
  allRows: RunHistoryItem[],
) {
  out.push(item)
  if (item.nestedUnderOnboarding) return
  if (item.run.kind !== 'agent') return
  const agent = item.run
  for (const chat of allRows) {
    if (chat.kind !== 'chat' || chat.linkedAgentId !== agent.id) continue
    out.push({
      type: 'run',
      run: chat,
      nestedUnderAgentChat: true,
      rowKey: `${chat.id}-under-${agent.id}`,
      parentAgentLabel: agent.name,
    })
  }
}

function buildSidebarHistoryRenderRows(
  rows: RunHistoryItem[],
  kindFilterMenuOpen: boolean,
): SidebarHistoryRenderRow[] {
  if (!kindFilterMenuOpen) {
    return rows
      .filter((run) => run.id !== ONBOARDING_SCENARIO_GROUP_PARENT_ID)
      .map((run) => ({ type: 'run', run }))
  }

  const out: SidebarHistoryRenderRow[] = []
  let i = 0
  while (i < rows.length) {
    const run = rows[i]
    if (run.id === ONBOARDING_SCENARIO_GROUP_PARENT_ID) {
      const children: RunHistoryItem[] = []
      let j = i + 1
      while (j < rows.length) {
        const next = rows[j]
        if (!ONBOARDING_SCENARIO_GROUP_CHILD_IDS.has(next.id)) break
        children.push(next)
        j += 1
      }
      pushMenuOpenRunWithLinkedAgentChats(out, { type: 'run', run }, rows)
      for (const c of children) {
        out.push({ type: 'run', run: c, nestedUnderOnboarding: true })
      }
      i = j
      continue
    }
    if (ONBOARDING_SCENARIO_GROUP_CHILD_IDS.has(run.id)) {
      pushMenuOpenRunWithLinkedAgentChats(out, { type: 'run', run }, rows)
      i += 1
      continue
    }
    pushMenuOpenRunWithLinkedAgentChats(out, { type: 'run', run }, rows)
    i += 1
  }
  return out
}

export function Home({ onLogout }: HomeProps) {
  const { locale, setLocale, t } = useLocale()
  const { role, email, roleLabel, canAccessPage } = useRbac()
  const tabListId = useId()
  const runSearchInputId = `${tabListId}-run-search`
  const runKindFilterPanelId = `${tabListId}-run-kind-filter`
  const userAccountMenuId = `${tabListId}-user-account-menu`
  const manusUserBtnRef = useRef<HTMLButtonElement>(null)
  const manusUserMenuRef = useRef<HTMLDivElement>(null)
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null)
  const sessionComposerInputRef = useRef<HTMLTextAreaElement | null>(null)
  const hadHomeAiSessionRef = useRef(false)
  const composerVoiceRecognitionRef = useRef<ComposerSpeechRecognition | null>(null)
  const userRecruitRequirementsRef = useRef<RecruitRequirements>(createRecruitRequirements())
  const userRecruitJdThinkTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const userRecruitJdTurnRef = useRef<UserRecruitJdTurn>('idle')
  const [userRecruitJdTurn, setUserRecruitJdTurn] = useState<UserRecruitJdTurn>('idle')
  const setUserRecruitJdTurnBoth = useCallback((turn: UserRecruitJdTurn) => {
    userRecruitJdTurnRef.current = turn
    setUserRecruitJdTurn(turn)
  }, [])
  const planAssistantThinkTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  /** 办公物品增补：思考后两段回复之间的衔接定时器 */
  const planChainedReplyTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  /** Build「新员工入职智能体」多段演示回复链 */
  const buildOnboardingSeqTimerIdsRef = useRef<ReturnType<typeof window.setTimeout>[]>([])
  const buildIntroTraceEnMessageIdRef = useRef<string | null>(null)
  const buildOnboardPendingTailRef = useRef<{
    base: JoyceChatMessage[]
    zh: JoyceChatMessage
    think2Id: string
    planId: string
    blueprintKind: PlanConversationKind
  } | null>(null)
  /** 工作流首轮英文轨迹结束后替换为中文 Q1 */
  const workflowPlannerTracePendingRef = useRef<{
    baseMsgs: JoyceChatMessage[]
    finalAssistant: JoyceChatMessage
    snapTurn: PlanFlowTurn
    snapBlueprint: PlanAgentBlueprint | undefined
    traceId: string
  } | null>(null)
  const [userAccountMenuOpen, setUserAccountMenuOpen] = useState(false)
  const [userAccountMenuLayout, setUserAccountMenuLayout] = useState({
    left: 0,
    top: 0,
    width: 240,
  })
  const {
    section: accessControlSection,
    navExpanded: accessControlNavExpanded,
    setNavExpanded: setAccessControlNavExpanded,
    syncFromPath: syncAccessControlFromPath,
    navigateToSection,
  } = useAccessControlNavigation()

  const {
    section: teamCollaborationSection,
    navExpanded: teamCollaborationNavExpanded,
    setNavExpanded: setTeamCollaborationNavExpanded,
    syncFromPath: syncTeamCollaborationFromPath,
    navigateToSection: navigateToTeamSection,
  } = useTeamCollaborationNavigation()

  const [runHistoryItems] = useState<RunHistoryItem[]>([
    { id: 'h1', kind: 'chat', name: '全自动化新员工入职助手' },
    { id: 'h2', kind: 'chat', name: '帮我总结本周待办', linkedAgentId: 'a1' },
    { id: 'h3', kind: 'chat', name: '会议室预订规则是什么？', linkedAgentId: 'a2' },
    { id: 'h4', kind: 'chat', name: '把这段政策要点改成邮件草稿' },
    { id: 'a1', kind: 'agent', name: 'Onboarding 助手', status: 'success' },
    { id: 'a2', kind: 'agent', name: '绩效反馈 Bot', status: 'warning' },
  ])
  const [runSearchOpen, setRunSearchOpen] = useState(false)
  const [runSearchQuery, setRunSearchQuery] = useState('')
  const [runKindFilterMenuOpen, setRunKindFilterMenuOpen] = useState(false)
  const [runKindFilterHoverOpen, setRunKindFilterHoverOpen] = useState(false)
  const [runHistoryKindFilter, setRunHistoryKindFilter] = useState<RunHistoryKindFilter>('all')
  /** 侧栏当前选中的历史条目（用于高亮）；从落地页发起新会话时会清空 */
  const [selectedRunHistoryId, setSelectedRunHistoryId] = useState<string | null>(null)
  const [testRunSnapshots, setTestRunSnapshots] = useState<Record<string, WorkspaceRunsTestSnapshot>>(() => ({}))
  const [activeRunsTestPersistEntryId, setActiveRunsTestPersistEntryId] = useState<string | null>(null)
  const [runsTestRestoreRequest, setRunsTestRestoreRequest] = useState<{
    token: number
    entryId: string
  } | null>(null)
  const [agentRunTestResume, setAgentRunTestResume] = useState<{ token: number; agentName: string } | null>(null)
  const [libraryOpenSingleAgentRequest, setLibraryOpenSingleAgentRequest] = useState<{
    token: number
    agentName: string
  } | null>(null)
  const [agentLibraryCardAction, setAgentLibraryCardAction] = useState<{
    token: number
    agentName: string
    action: 'edit' | 'duplicate'
  } | null>(null)
  const [scenarioCardAction, setScenarioCardAction] = useState<{
    token: number
    sourceName: string
    action: 'edit' | 'duplicate'
  } | null>(null)
  const runKindFilterBtnRef = useRef<HTMLButtonElement>(null)
  const runKindFilterPanelRef = useRef<HTMLDivElement>(null)
  const runKindFilterHoverCloseTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const runKindLabelByKind = useMemo(
    (): Record<RunHistoryKind, string> => ({
      chat: t('runKindChat'),
      agent: t('runKindAgent'),
      scenario: t('runKindScenario'),
    }),
    [t],
  )

  const isUserRole = isLoginRoleTier(role, 'user')
  const showUserRecruitContextTag = role === 'user'
  const showHomePendingIcon = role === 'user' || role === 'manager' || role === 'admin'
  const homePendingIconRef = useRef<HTMLButtonElement>(null)
  const [homePendingPopoverOpen, setHomePendingPopoverOpen] = useState(false)
  const [onboardingCandidatesRevision, setOnboardingCandidatesRevision] = useState(0)
  const [userInitiatedRequestsRevision, setUserInitiatedRequestsRevision] = useState(0)
  const userPendingOnboarding = useMemo(() => {
    if (!isUserRole) return []
    void onboardingCandidatesRevision
    return listRecruitPassedCandidatesForHm(resolveCurrentMemberId()).filter(
      (item) => item.status === 'awaiting_confirm',
    )
  }, [isUserRole, onboardingCandidatesRevision])

  const managerPendingApprovalTasks = useMemo(() => {
    if (isUserRole) return []
    if (role !== 'admin' && role !== 'manager') return []
    if (!canAccessPage('team-collaboration-space')) return []
    void userInitiatedRequestsRevision
    return listHomePendingApprovalTasks(locale, role, resolveCurrentMemberId())
  }, [canAccessPage, isUserRole, locale, role, userInitiatedRequestsRevision])

  const homePendingBadgeCount = isUserRole
    ? userPendingOnboarding.length
    : managerPendingApprovalTasks.length

  useEffect(() => {
    if (!isUserRole) return
    return subscribeOnboardingCandidatesSync(() => {
      setOnboardingCandidatesRevision((value) => value + 1)
    })
  }, [isUserRole])

  useEffect(() => {
    if (isUserRole) return
    if (role !== 'admin' && role !== 'manager') return
    return subscribeUserInitiatedRequestsSync(() => {
      setUserInitiatedRequestsRevision((value) => value + 1)
    })
  }, [isUserRole, role])

  const navigateToProjectSpaceInbox = useCallback(() => {
    if (!canAccessPage('team-collaboration-space')) return
    const path = buildTeamPath({ view: 'project-space-tasks', tasksScope: 'inbox' })
    window.history.pushState({ page: 'team-collaboration-space' }, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
    setActivePageRaw('team-collaboration-space')
    syncTeamCollaborationFromPath(path)
    setTeamCollaborationNavExpanded(true)
    setHomePendingPopoverOpen(false)
    window.scrollTo(0, 0)
  }, [canAccessPage, setTeamCollaborationNavExpanded, syncTeamCollaborationFromPath])

  const navigateToProjectSpaceTask = useCallback(
    (instanceId: string) => {
      if (!canAccessPage('team-collaboration-space')) return
      const path = buildTeamPath({
        view: 'project-space-tasks',
        tasksScope: 'inbox',
        instanceId,
      })
      window.history.pushState({ page: 'team-collaboration-space' }, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
      setActivePageRaw('team-collaboration-space')
      syncTeamCollaborationFromPath(path)
      setTeamCollaborationNavExpanded(true)
      setHomePendingPopoverOpen(false)
      window.scrollTo(0, 0)
    },
    [canAccessPage, setTeamCollaborationNavExpanded, syncTeamCollaborationFromPath],
  )

  const navigateToProjectSpaceRecruitJdReview = useCallback(
    (requestId: string) => {
      if (!canAccessPage('team-collaboration-space')) return
      const path = buildTeamPath({
        view: 'project-space-tasks',
        tasksScope: 'inbox',
        recruitJdRequestId: requestId,
      })
      window.history.pushState({ page: 'team-collaboration-space' }, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
      setActivePageRaw('team-collaboration-space')
      syncTeamCollaborationFromPath(path)
      setTeamCollaborationNavExpanded(true)
      setHomePendingPopoverOpen(false)
      window.scrollTo(0, 0)
    },
    [canAccessPage, setTeamCollaborationNavExpanded, syncTeamCollaborationFromPath],
  )

  const handleHomeConfirmOnboardingCandidate = useCallback((candidateId: string) => {
    confirmOnboardingCandidate(candidateId)
  }, [])

  const runHistoryKindFilterOptions = useMemo(
    (): { value: RunHistoryKindFilter; label: string }[] => {
      const options: { value: RunHistoryKindFilter; label: string }[] = [
        { value: 'all', label: t('filterAll') },
        { value: 'chat', label: t('filterChatRecords') },
      ]
      if (!isUserRole) {
        options.push({ value: 'agent', label: t('filterAgent') })
      }
      return options
    },
    [isUserRole, t],
  )

  const roleScopedRunHistoryItems = useMemo(() => {
    if (!isUserRole) return runHistoryItems
    return runHistoryItems.filter((item) => item.kind !== 'agent')
  }, [isUserRole, runHistoryItems])

  useEffect(() => {
    if (isUserRole && runHistoryKindFilter === 'agent') {
      setRunHistoryKindFilter('all')
    }
    if (runHistoryKindFilter === 'scenario') {
      setRunHistoryKindFilter('all')
    }
    if (isUserRole) {
      setRunKindFilterMenuOpen(false)
      setRunKindFilterHoverOpen(false)
    }
  }, [isUserRole, runHistoryKindFilter])

  const filteredRunHistory = useMemo(() => {
    let rows =
      runHistoryKindFilter === 'all'
        ? roleScopedRunHistoryItems
        : roleScopedRunHistoryItems.filter((r) => r.kind === runHistoryKindFilter)
    const q = runSearchQuery.trim()
    if (!q) return rows
    return rows.filter((r) => historyItemMatchesQuery(r, q, locale, runKindLabelByKind[r.kind]))
  }, [roleScopedRunHistoryItems, runHistoryKindFilter, runSearchQuery, runKindLabelByKind, locale])

  const displayRunHistory = useMemo(
    () => localizeRunHistoryItems(filteredRunHistory, locale),
    [filteredRunHistory, locale],
  )

  const sidebarHistoryRows = useMemo((): RunHistoryItem[] => {
    if (runHistoryKindFilter !== 'all') return displayRunHistory
    return displayRunHistory.slice(0, 14)
  }, [displayRunHistory, runHistoryKindFilter])

  const sidebarHistoryRenderRows = useMemo(
    () => buildSidebarHistoryRenderRows(sidebarHistoryRows, isUserRole ? false : runKindFilterMenuOpen),
    [sidebarHistoryRows, runKindFilterMenuOpen, isUserRole],
  )

  const handleRunsTestSnapshotChange = useCallback((entryId: string, snapshot: WorkspaceRunsTestSnapshot) => {
    setTestRunSnapshots((prev) => ({ ...prev, [entryId]: snapshot }))
  }, [])

  const clearRunsTestRestoreRequest = useCallback(() => {
    setRunsTestRestoreRequest(null)
  }, [])

  const clearAgentRunTestResume = useCallback(() => {
    setAgentRunTestResume(null)
  }, [])

  const getRunsTestSnapshot = useCallback(
    (entryId: string) => testRunSnapshots[entryId],
    [testRunSnapshots],
  )

  const handleTestRunHistoryRecord = useCallback(
    (payload: { name: string; resumeKind: 'scenario' | 'agent'; resumeTargetName: string }) => {
      const trimmed = payload.name.trim()
      if (!trimmed) return
      const id = `test-${Date.now()}`
      if (payload.resumeKind === 'scenario') {
        setActiveRunsTestPersistEntryId(id)
        setTestRunSnapshots((prev) => ({
          ...prev,
          [id]: prev[id] ?? { trigger: 'chat', kickoffLine: '', composerByRun: {} },
        }))
      } else {
        setActiveRunsTestPersistEntryId(null)
      }
    },
    [],
  )


  useEffect(() => {
    if (!runKindFilterHoverOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRunKindFilterHoverOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [runKindFilterHoverOpen])

  useEffect(() => {
    return () => {
      if (runKindFilterHoverCloseTimerRef.current != null) {
        window.clearTimeout(runKindFilterHoverCloseTimerRef.current)
      }
    }
  }, [])

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [activePage, setActivePageRaw] = useState<
    | 'home'
    | 'agent-library'
    | 'scenarios'
    | 'experience'
    | 'app-market'
    | 'knowledge-base'
    | 'team-collaboration-space'
    | 'analytics'
    | 'tools'
    | 'skills'
    | 'access-control'
  >('home')

  /** 每个 activePage 对应的 URL path。供侧栏菜单与浏览器后退/前进使用。 */
  const PAGE_PATH: Record<typeof activePage, string> = {
    home: '/',
    'agent-library': '/agents',
    scenarios: '/scenarios',
    experience: '/experience',
    'app-market': '/app-market',
    'knowledge-base': '/knowledge-base',
    'team-collaboration-space': '/team',
    analytics: '/analytics',
    tools: '/tools',
    skills: '/skills',
    'access-control': '/access-control',
  }
  const PATH_TO_PAGE: Record<string, typeof activePage> = Object.fromEntries(
    Object.entries(PAGE_PATH).map(([page, path]) => [path, page as typeof activePage]),
  )
  const pageFromPath = (path: string): typeof activePage => {
    if (path === '/team' || path.startsWith('/team/')) return 'team-collaboration-space'
    if (isAccessControlPath(path)) return 'access-control'
    return PATH_TO_PAGE[path] ?? 'home'
  }

  const authorizePage = useCallback(
    (page: AppPage): AppPage => resolveAuthorizedPage(role, page),
    [role],
  )

  /** 更新 URL 与 activePage。setActivePage 的统一入口。 */
  const setActivePage = useCallback(
    (page: typeof activePage) => {
      const authorized = authorizePage(page)
      const target = PAGE_PATH[authorized] ?? '/'
      const current =
        typeof window !== 'undefined' ? window.location.pathname : '/'
      if (current !== target) {
        window.history.pushState({ page: authorized }, '', target)
      }
      setActivePageRaw(authorized)
    },
    [PAGE_PATH, authorizePage],
  )

  /** 角色导航权限变更后，若当前页不可访问则回到首页 */
  useEffect(() => {
    if (!canAccessPage(activePage)) {
      setActivePage('home')
    }
  }, [activePage, canAccessPage, setActivePage])

  const openAccessControlSection = useCallback(
    (section: AccessControlSection) => {
      if (!canAccessPage('access-control')) return
      navigateToSection(section)
      setActivePageRaw('access-control')
    },
    [canAccessPage, navigateToSection],
  )

  const openTeamCollaborationSection = useCallback(
    (section: TeamCollaborationNavSection) => {
      if (!canAccessPage('team-collaboration-space')) return
      navigateToTeamSection(section)
      setActivePageRaw('team-collaboration-space')
    },
    [canAccessPage, navigateToTeamSection],
  )

  /** 浏览器后退/前进：根据 URL 还原 activePage。 */
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      const next = authorizePage(pageFromPath(path))
      setActivePageRaw(next)
      if (isAccessControlPath(path) && canAccessPage('access-control')) {
        syncAccessControlFromPath(path)
        setAccessControlNavExpanded(true)
      }
      if (isTeamPath(path) && canAccessPage('team-collaboration-space')) {
        syncTeamCollaborationFromPath(path)
        setTeamCollaborationNavExpanded(true)
      }
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [
    authorizePage,
    canAccessPage,
    syncAccessControlFromPath,
    setAccessControlNavExpanded,
    syncTeamCollaborationFromPath,
    setTeamCollaborationNavExpanded,
  ])

  /** 首次挂载：登录后按角色落地路由；刷新时按 URL 同步 activePage。 */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const pendingRoute = consumePendingRoute()
    const path = pendingRoute ?? window.location.pathname
    const initial = authorizePage(pageFromPath(path))
    setActivePageRaw(initial)
    if (isAccessControlPath(path) && canAccessPage('access-control')) {
      syncAccessControlFromPath(path)
      setAccessControlNavExpanded(true)
    }
    if (isTeamPath(path) && canAccessPage('team-collaboration-space')) {
      syncTeamCollaborationFromPath(path)
      setTeamCollaborationNavExpanded(true)
    }
    const preserveSubPath =
      (initial === 'team-collaboration-space' && path.startsWith('/team')) ||
      (initial === 'access-control' && isAccessControlPath(path))
    window.history.replaceState(
      { page: initial },
      '',
      preserveSubPath ? path : PAGE_PATH[initial] ?? '/',
    )
  }, [
    authorizePage,
    canAccessPage,
    PAGE_PATH,
    syncAccessControlFromPath,
    setAccessControlNavExpanded,
    syncTeamCollaborationFromPath,
    setTeamCollaborationNavExpanded,
  ])
  const [installedMarketItemIds, setInstalledMarketItemIds] = useState<Set<string>>(() => new Set())
  const [importedMarketItems, setImportedMarketItems] = useState<AppMarketItem[]>([])
  const [marketScenarioBlueprints, setMarketScenarioBlueprints] = useState<
    Record<string, AppMarketScenarioWorkflowStep[]>
  >({})
  const [marketAgentTemplateApplyRequest, setMarketAgentTemplateApplyRequest] = useState<{
    token: number
    agentName: string
    item: AppMarketItem
  } | null>(null)
  const [workspaceSkills, setWorkspaceSkills] = useState<SkillItem[]>(() => INITIAL_SKILLS)
  const [isToolInstallTransitioning, setIsToolInstallTransitioning] = useState(false)
  const [toolDirectoryItems, setToolDirectoryItems] = useState<ToolDirectoryItem[]>(() => TOOL_DIRECTORY_ITEMS)
  const [appMarketEntryRequest, setAppMarketEntryRequest] = useState<{ kind: 'tools-anchor' | 'skills-anchor'; token: number } | null>(null)
  const installedSkillTemplates = useMemo(
    () => [
      ...importedMarketItems.filter(
        (item) => item.productLine === 'skills' && installedMarketItemIds.has(item.id),
      ),
      ...SKILLS_CATALOG.filter((item) => installedMarketItemIds.has(item.id)),
    ],
    [importedMarketItems, installedMarketItemIds],
  )
  const skillDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      workspaceSkills.map((skill) => ({
        id: skill.id,
        title: skill.name,
        description: skill.description,
      })),
    [workspaceSkills],
  )
  useEffect(() => {
    const installedSkillItems = installedSkillTemplates.map((item) => createInstalledMarketSkillItem(item, locale))
    setWorkspaceSkills((current) => {
      const nonMarketplaceSkills = current.filter((skill) => !skill.id.startsWith('market-skill-'))
      const existingMarketplaceSkills = new Map(
        current.filter((skill) => skill.id.startsWith('market-skill-')).map((skill) => [skill.id, skill]),
      )
      const mergedMarketplaceSkills = installedSkillItems.map((skill) => ({
        ...(existingMarketplaceSkills.get(skill.id) ?? skill),
        ...skill,
      }))
      return [...mergedMarketplaceSkills, ...nonMarketplaceSkills]
    })
  }, [installedSkillTemplates, locale])
  useEffect(() => {
    if (activePage !== 'agent-library') setLibraryOpenSingleAgentRequest(null)
  }, [activePage])
  const [experiencePageEntryKey, setExperiencePageEntryKey] = useState(0)
  const [experienceOnboardingTrigger, setExperienceOnboardingTrigger] =
    useState<SharedOnboardingTriggerKind>('chat')
  const [isRunsExpanded, setIsRunsExpanded] = useState(true)

  const openRunKindFilterHover = useCallback(() => {
    if (runKindFilterHoverCloseTimerRef.current != null) {
      window.clearTimeout(runKindFilterHoverCloseTimerRef.current)
      runKindFilterHoverCloseTimerRef.current = null
    }
    setIsRunsExpanded(true)
    setRunKindFilterHoverOpen(true)
  }, [])

  const scheduleRunKindFilterHoverClose = useCallback(() => {
    if (runKindFilterHoverCloseTimerRef.current != null) {
      window.clearTimeout(runKindFilterHoverCloseTimerRef.current)
    }
    runKindFilterHoverCloseTimerRef.current = window.setTimeout(() => {
      runKindFilterHoverCloseTimerRef.current = null
      setRunKindFilterHoverOpen(false)
    }, 120)
  }, [])

  const [mode, setMode] = useState<'plan' | 'build'>(homeLandingDefaultMode)
  const [prompt, setPrompt] = useState('')
  const [buildSession, setBuildSession] = useState<{ messages: JoyceChatMessage[] } | null>(null)
  const [buildAiInput, setBuildAiInput] = useState('')
  const [planFlowTurn, setPlanFlowTurn] = useState<PlanFlowTurn>(null)
  const [planAgentBlueprint, setPlanAgentBlueprint] = useState<PlanAgentBlueprint | null>(null)
  const [planWorkflowBlueprint, setPlanWorkflowBlueprint] = useState<PlanWorkflowBlueprint | null>(null)
  /** 当前 Plan 会话是智能体采集还是工作流采集（决定 Joyce 文案与左侧版块类型） */
  const [planConversationKind, setPlanConversationKind] = useState<PlanConversationKind>('agent')
  const planConversationKindRef = useRef<PlanConversationKind>('agent')
  const [planAgentCreationVisible, setPlanAgentCreationVisible] = useState(false)
  /** 草案底部「创建」：全屏创建进度弹窗 */
  const [planAgentCreateModalOpen, setPlanAgentCreateModalOpen] = useState(false)
  const [planAgentCreateModalTitle, setPlanAgentCreateModalTitle] = useState('新员工入职管家')
  /** 本次创建弹窗是否由「入职工作流」侧栏草案打开（工作流路径跳转场景配置页，智能体路径跳转 Agent 库） */
  const [planAgentCreateModalFromWorkflow, setPlanAgentCreateModalFromWorkflow] = useState(false)
  /** 创建弹窗「立即前往查看」（工作流弹窗）→ 场景页打开指定场景（token 保证重复点击仍触发 effect） */
  const [scenarioOpenDeepLink, setScenarioOpenDeepLink] = useState<{
    token: number
    name: string
    editorTab?: 'build' | 'runs'
  } | null>(null)
  const [composerVoiceListening, setComposerVoiceListening] = useState(false)
  const planCreationDismissTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  /** 实时输出全部播完后再展示左侧「智能体草案」 */
  const planBlueprintRevealTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  /** 避免 Q3 出现后自动「确认」在 StrictMode / 重渲染下重复触发 */
  const planQ3AutoTriggeredForMsgIdRef = useRef<string | null>(null)
  /** 从草案进入 Agent 库时保留侧栏草案；从落地页 Plan 进入工作流时不保留 */
  const preservePlanBlueprintForWorkflowRef = useRef(false)
  /** >0 触发 AgentLibrary 打开 Plan 入职工作流预设与引导弹窗，消费后归零 */
  const [planWorkflowEntryKey, setPlanWorkflowEntryKey] = useState(0)
  const isComposerActive = prompt.trim().length > 0

  useEffect(() => {
    planConversationKindRef.current = planConversationKind
  }, [planConversationKind])

  const fillLandingComposerOnboardAgent = useCallback(() => {
    setPrompt(getOnboardShortcutAgentTitle(locale))
    focusTextareaAtEnd(composerInputRef)
  }, [locale])

  const fillLandingComposerOnboardWorkflow = useCallback(() => {
    setPrompt(getOnboardShortcutWorkflowTitle(locale))
    focusTextareaAtEnd(composerInputRef)
  }, [locale])

  const fillLandingComposerRecruitContext = useCallback(() => {
    setPrompt(t('userRecruitContextPrompt'))
    focusTextareaAtEnd(composerInputRef)
  }, [t])

  const fillSessionComposerRecruitContext = useCallback(() => {
    setBuildAiInput(t('userRecruitContextPrompt'))
    focusTextareaAtEnd(sessionComposerInputRef)
  }, [t])

  /** 落地页：Plan 下写入「入职工作流」便于发送后进入工作流 Plan 采集；Build 仍填完整快捷标题 */
  const handleLandingOnboardWorkflowShortcut = useCallback(() => {
    if (mode === 'plan') {
      setPrompt(getPlanWorkflowEntryTrigger(locale))
      focusTextareaAtEnd(composerInputRef)
    } else {
      fillLandingComposerOnboardWorkflow()
    }
  }, [mode, locale, fillLandingComposerOnboardWorkflow])

  const clearPlanAssistantThinkTimer = useCallback(() => {
    if (planAssistantThinkTimerRef.current != null) {
      window.clearTimeout(planAssistantThinkTimerRef.current)
      planAssistantThinkTimerRef.current = null
    }
    if (planChainedReplyTimerRef.current != null) {
      window.clearTimeout(planChainedReplyTimerRef.current)
      planChainedReplyTimerRef.current = null
    }
    buildOnboardingSeqTimerIdsRef.current.forEach((id) => window.clearTimeout(id))
    buildOnboardingSeqTimerIdsRef.current = []
    buildIntroTraceEnMessageIdRef.current = null
    buildOnboardPendingTailRef.current = null
    workflowPlannerTracePendingRef.current = null
  }, [])

  /** Plan 已完成：用户提出办公物品派发等 — 思考 → 首段确认 → 再输出完整能力说明（两段助理消息） */
  const scheduleOfficeSuppliesPlanReply = useCallback(
    (messagesWithUser: JoyceChatMessage[]) => {
      clearPlanAssistantThinkTimer()
      const thinkId = `ba-think-${Date.now()}`
      const baseT = Date.now()
      const msg1Id = `ba-${baseT}-os1`
      const msg2Id = `ba-${baseT}-os2`
      const snap = [...messagesWithUser]
      const msg1: JoyceChatMessage = { id: msg1Id, role: 'assistant', text: PLAN_OFFICE_SUPPLIES_ACK }
      const msg2: JoyceChatMessage = {
        id: msg2Id,
        role: 'assistant',
        text: PLAN_MULTI_AGENT_RESULT_ARIA,
        richBubble: 'plan-multi-agent-system-created',
      }
      setPlanFlowTurn(null)
      setBuildSession({
        messages: [...snap, { id: thinkId, role: 'assistant', text: '', isThinking: true }],
      })
      planAssistantThinkTimerRef.current = window.setTimeout(() => {
        planAssistantThinkTimerRef.current = null
        setBuildSession({ messages: [...snap, msg1] })
        planChainedReplyTimerRef.current = window.setTimeout(() => {
          planChainedReplyTimerRef.current = null
          setBuildSession({ messages: [...snap, msg1, msg2] })
          setPlanFlowTurn('done')
          /** 两段助理回复均已展示后，再更新侧栏草案（未走增补流程的用户仍保留 createPlanAgentBlueprintDemo 默认文案） */
          queueMicrotask(() => {
            setPlanAgentBlueprint((prev) => {
              const base = prev ?? createPlanAgentBlueprintDemo()
              return {
                ...base,
                role: PLAN_OFFICE_SUPPLIES_BLUEPRINT_ROLE,
                rolePrompt: PLAN_OFFICE_SUPPLIES_BLUEPRINT_ROLE_PROMPT,
              }
            })
          })
        }, 880)
      }, PLAN_ASSISTANT_THINK_MS)
    },
    [clearPlanAssistantThinkTimer],
  )

  /** Plan：先插入思考气泡，再在 PLAN_ASSISTANT_THINK_MS 后展示助理正文；工作流首轮可先插入英文轨迹再替换为 Q1 */
  const schedulePlanAssistantAfterThink = useCallback(
    (
      messagesWithUser: JoyceChatMessage[],
      finalAssistant: JoyceChatMessage,
      nextTurn: PlanFlowTurn,
      blueprint?: PlanAgentBlueprint,
      opts?: { workflowPlannerTraceLead?: boolean },
    ) => {
      clearPlanAssistantThinkTimer()
      const thinkId = `ba-think-${Date.now()}`
      setPlanFlowTurn(null)
      setBuildSession({
        messages: [
          ...messagesWithUser,
          { id: thinkId, role: 'assistant', text: '', isThinking: true },
        ],
      })
      const snapMsgs = [...messagesWithUser]
      const snapAssistant: JoyceChatMessage = { ...finalAssistant }
      const snapTurn = nextTurn
      const snapBlueprint = blueprint
      planAssistantThinkTimerRef.current = window.setTimeout(() => {
        planAssistantThinkTimerRef.current = null
        const useTrace =
          Boolean(opts?.workflowPlannerTraceLead) && WORKFLOW_PLANNER_TRACE_TEXT.trim().length > 0
        if (useTrace) {
          const traceId = `ba-wf-trace-${Date.now()}`
          workflowPlannerTracePendingRef.current = {
            baseMsgs: snapMsgs,
            finalAssistant: snapAssistant,
            snapTurn,
            snapBlueprint,
            traceId,
          }
          setBuildSession({
            messages: [
              ...snapMsgs,
              {
                id: traceId,
                role: 'assistant',
                text: WORKFLOW_PLANNER_TRACE_TEXT,
                workflowPlannerTrace: true,
              },
            ],
          })
          setPlanFlowTurn(null)
        } else {
          setBuildSession({ messages: [...snapMsgs, snapAssistant] })
          setPlanFlowTurn(snapTurn)
          if (snapBlueprint != null) {
            setPlanAgentBlueprint(snapBlueprint)
          }
        }
      }, PLAN_ASSISTANT_THINK_MS)
    },
    [clearPlanAssistantThinkTimer],
  )

  const clearUserRecruitJdThinkTimer = useCallback(() => {
    if (userRecruitJdThinkTimerRef.current != null) {
      window.clearTimeout(userRecruitJdThinkTimerRef.current)
      userRecruitJdThinkTimerRef.current = null
    }
  }, [])

  const scheduleUserRecruitJdAssistant = useCallback(
    (messagesWithUser: JoyceChatMessage[], finalAssistant: JoyceChatMessage, nextTurn: UserRecruitJdTurn) => {
      clearUserRecruitJdThinkTimer()
      const thinkId = `ba-think-${Date.now()}`
      setUserRecruitJdTurnBoth(nextTurn)
      setBuildSession({
        messages: [
          ...messagesWithUser,
          { id: thinkId, role: 'assistant', text: '', isThinking: true },
        ],
      })
      const snapMsgs = [...messagesWithUser]
      const snapAssistant: JoyceChatMessage = { ...finalAssistant }
      const snapTurn = nextTurn
      userRecruitJdThinkTimerRef.current = window.setTimeout(() => {
        userRecruitJdThinkTimerRef.current = null
        setUserRecruitJdTurnBoth(snapTurn)
        setBuildSession({ messages: [...snapMsgs, snapAssistant] })
      }, USER_RECRUIT_JD_THINK_MS)
    },
    [clearUserRecruitJdThinkTimer, setUserRecruitJdTurnBoth],
  )

  const handleUserRecruitJdLine = useCallback(
    (trimmed: string, existingMessages: JoyceChatMessage[]) => {
      const ts = Date.now()
      const userMsg: JoyceChatMessage = { id: `bu-${ts}`, role: 'user', text: trimmed }
      const withUser = [...existingMessages, userMsg]
      const turn = userRecruitJdTurnRef.current

      const reply = (text: string, nextTurn: UserRecruitJdTurn, choices?: string[]) => {
        const assist: JoyceChatMessage = {
          id: `ba-${ts + 1}`,
          role: 'assistant',
          text,
          ...(choices?.length ? { choices } : {}),
        }
        scheduleUserRecruitJdAssistant(withUser, assist, nextTurn)
      }

      if (turn === 'done') {
        if (!isRecruitJdEntry(trimmed)) {
          reply(recruitJdDoneHint(locale), 'done')
          return
        }
        userRecruitRequirementsRef.current = createRecruitRequirements()
        setUserRecruitJdTurnBoth('idle')
      }

      const activeTurn = userRecruitJdTurnRef.current

      if (activeTurn === 'awaitConfirm') {
        if (isRecruitJdConfirmIntent(trimmed, locale)) {
          const ticketId = buildHrTicketId()
          appendUserRecruitJdRequest(
            resolveCurrentMemberId(),
            locale,
            userRecruitRequirementsRef.current,
            ticketId,
          )
          reply(
            buildRecruitHrSubmitReply(locale, userRecruitRequirementsRef.current, ticketId),
            'done',
          )
          return
        }
        if (isRecruitJdContinueEditIntent(trimmed, locale)) {
          reply(recruitJdAskWhatToEdit(locale), 'awaitConfirm')
          return
        }
        userRecruitRequirementsRef.current = parseRecruitRequirements(
          trimmed,
          userRecruitRequirementsRef.current,
          locale,
        )
        const jd = buildRecruitJdDocument(locale, userRecruitRequirementsRef.current)
        reply(
          buildRecruitJdReadyReply(locale, jd),
          'awaitConfirm',
          recruitJdConfirmChoices(locale),
        )
        return
      }

      if (!isRecruitJdEntry(trimmed)) {
        const hasOngoingRecruit =
          userRecruitRequirementsRef.current.rawNotes.length > 0 ||
          Boolean(userRecruitRequirementsRef.current.title.trim())
        if (!hasOngoingRecruit) {
          reply(recruitJdEntryHint(locale), 'idle')
          return
        }
      }

      userRecruitRequirementsRef.current = parseRecruitRequirements(
        trimmed,
        userRecruitRequirementsRef.current,
        locale,
      )
      const missing = getMissingRecruitFields(userRecruitRequirementsRef.current)
      if (missing.length > 0) {
        reply(buildRecruitFollowUpQuestion(locale, missing), 'idle')
        return
      }

      const jd = buildRecruitJdDocument(locale, userRecruitRequirementsRef.current)
      reply(buildRecruitJdReadyReply(locale, jd), 'awaitConfirm', recruitJdConfirmChoices(locale))
    },
    [locale, scheduleUserRecruitJdAssistant, setUserRecruitJdTurnBoth],
  )

  const handleWorkflowPlannerTraceVanish = useCallback((messageId: string) => {
    const pending = workflowPlannerTracePendingRef.current
    if (!pending || pending.traceId !== messageId) return
    workflowPlannerTracePendingRef.current = null
    setBuildSession({ messages: [...pending.baseMsgs, pending.finalAssistant] })
    setPlanFlowTurn(pending.snapTurn)
    if (pending.snapBlueprint != null) {
      setPlanAgentBlueprint(pending.snapBlueprint)
    }
  }, [])

  const handleBuildIntroTraceVanish = useCallback((messageId: string) => {
    if (messageId !== buildIntroTraceEnMessageIdRef.current) return
    const tail = buildOnboardPendingTailRef.current
    if (!tail) return
    buildIntroTraceEnMessageIdRef.current = null
    buildOnboardPendingTailRef.current = null

    const { base, zh, think2Id, planId, blueprintKind } = tail
    const followLines =
      blueprintKind === 'workflow' ? BUILD_WORKFLOW_FOLLOW_UP_LINES : BUILD_ONBOARD_FOLLOW_UP_LINES
    setBuildSession({
      messages: [...base, zh],
    })

    const q = (fn: () => void, delay: number) => {
      const id = window.setTimeout(fn, delay)
      buildOnboardingSeqTimerIdsRef.current.push(id)
    }
    q(() => {
      setBuildSession({
        messages: [...base, zh, { id: think2Id, role: 'assistant', text: '', isThinking: true }],
      })
    }, 80)
    const planShownAt = 80 + BUILD_ONBOARD_INTRO_THINK_MS
    q(() => {
      setBuildSession({
        messages: [
          ...base,
          zh,
          { id: planId, role: 'assistant', text: '', richBubble: 'build-onboarding-flow-plan' },
        ],
      })
    }, planShownAt)

    const followStartAt = planShownAt + BUILD_ONBOARD_FLOW_PLAN_REVEAL_PAD_MS
    const fupPrefix = `ba-fup-${planId}-`
    followLines.forEach((line, i) => {
      q(() => {
        setBuildSession((prev) => {
          if (!prev) return prev
          const withoutFup = prev.messages.filter((m) => !m.id.startsWith(fupPrefix))
          return {
            messages: [...withoutFup, { id: `${fupPrefix}${i}`, role: 'assistant', text: line }],
          }
        })
      }, followStartAt + i * BUILD_ONBOARD_FOLLOW_LINE_GAP_MS)
    })
    const followCompleteAt = followStartAt + followLines.length * BUILD_ONBOARD_FOLLOW_LINE_GAP_MS
    q(() => {
      const flowPlanMessage: JoyceChatMessage = {
        id: planId,
        role: 'assistant',
        text: '',
        richBubble: 'build-onboarding-flow-plan',
      }
      const completeMessage: JoyceChatMessage = {
        id: `ba-complete-${planId}`,
        role: 'assistant',
        text: '',
        richBubble: 'build-onboarding-build-complete',
      }
      /** 显式保留两条富气泡，避免依赖 prev 竞态导致流程规划丢失；不再插入后续临时步骤句 */
      setBuildSession({
        messages: [...base, zh, flowPlanMessage, completeMessage],
      })
      queueMicrotask(() => {
        if (blueprintKind === 'workflow') {
          setPlanWorkflowBlueprint(createPlanWorkflowBlueprintDemo())
        } else {
          setPlanAgentBlueprint(createPlanAgentBlueprintDemo())
        }
      })
    }, followCompleteAt)
  }, [])

  /** Build：输入「新员工入职智能体」后的分段演示（与产品参考稿一致） */
  const scheduleBuildOnboardingAgentIntroSequence = useCallback(
    (baseMessages: JoyceChatMessage[]) => {
      if (sessionMessagesIncludeBuildOnboardingRichPair(baseMessages)) {
        setBuildSession({ messages: baseMessages })
        return
      }

      clearPlanAssistantThinkTimer()
      setPlanFlowTurn(null)
      setPlanAgentCreationVisible(false)
      setPlanConversationKind('agent')
      setPlanWorkflowBlueprint(null)
      setPlanAgentBlueprint(null)

      const ts = Date.now()
      const think1Id = `ba-think1-${ts}`
      const enId = `ba-en-${ts}`
      const zhId = `ba-zh-${ts}`
      const think2Id = `ba-think2-${ts}`
      const planId = `ba-plan-${ts}`

      const queue = (fn: () => void, delay: number) => {
        const id = window.setTimeout(fn, delay)
        buildOnboardingSeqTimerIdsRef.current.push(id)
      }

      buildIntroTraceEnMessageIdRef.current = enId
      buildOnboardPendingTailRef.current = {
        base: baseMessages,
        zh: { id: zhId, role: 'assistant', text: BUILD_ONBOARD_AGENT_INTRO_ZH },
        think2Id,
        planId,
        blueprintKind: 'agent',
      }

      setBuildSession({
        messages: [...baseMessages, { id: think1Id, role: 'assistant', text: '', isThinking: true }],
      })

      queue(() => {
        setBuildSession({
          messages: [
            ...baseMessages,
            {
              id: enId,
              role: 'assistant',
              text: BUILD_ONBOARD_AGENT_INTRO_EN,
              buildIntroTrace: true,
            },
          ],
        })
      }, BUILD_ONBOARD_INTRO_THINK_MS)
    },
    [clearPlanAssistantThinkTimer],
  )

  /** Build：输入「入职工作流」等与 Plan 同语义口令后的分段演示（节奏与入职智能体一致） */
  const scheduleBuildOnboardingWorkflowIntroSequence = useCallback(
    (baseMessages: JoyceChatMessage[]) => {
      if (sessionMessagesIncludeBuildOnboardingRichPair(baseMessages)) {
        setBuildSession({ messages: baseMessages })
        return
      }

      clearPlanAssistantThinkTimer()
      setPlanFlowTurn(null)
      setPlanAgentCreationVisible(false)
      setPlanConversationKind('workflow')
      setPlanAgentBlueprint(null)
      setPlanWorkflowBlueprint(null)

      const ts = Date.now()
      const think1Id = `bw-think1-${ts}`
      const enId = `bw-en-${ts}`
      const zhId = `bw-zh-${ts}`
      const think2Id = `bw-think2-${ts}`
      const planId = `bw-plan-${ts}`

      const queue = (fn: () => void, delay: number) => {
        const id = window.setTimeout(fn, delay)
        buildOnboardingSeqTimerIdsRef.current.push(id)
      }

      buildIntroTraceEnMessageIdRef.current = enId
      buildOnboardPendingTailRef.current = {
        base: baseMessages,
        zh: { id: zhId, role: 'assistant', text: BUILD_WORKFLOW_ONBOARD_INTRO_ZH },
        think2Id,
        planId,
        blueprintKind: 'workflow',
      }

      setBuildSession({
        messages: [...baseMessages, { id: think1Id, role: 'assistant', text: '', isThinking: true }],
      })

      queue(() => {
        setBuildSession({
          messages: [
            ...baseMessages,
            {
              id: enId,
              role: 'assistant',
              text: BUILD_WORKFLOW_ONBOARD_INTRO_EN,
              buildIntroTrace: true,
            },
          ],
        })
      }, BUILD_ONBOARD_INTRO_THINK_MS)
    },
    [clearPlanAssistantThinkTimer],
  )

  const goHomeLanding = useCallback(() => {
    preservePlanBlueprintForWorkflowRef.current = false
    setPlanWorkflowEntryKey(0)
    clearPlanAssistantThinkTimer()
    clearUserRecruitJdThinkTimer()
    userRecruitRequirementsRef.current = createRecruitRequirements()
    setUserRecruitJdTurnBoth('idle')
    if (planCreationDismissTimerRef.current != null) {
      window.clearTimeout(planCreationDismissTimerRef.current)
      planCreationDismissTimerRef.current = null
    }
    if (planBlueprintRevealTimerRef.current != null) {
      window.clearTimeout(planBlueprintRevealTimerRef.current)
      planBlueprintRevealTimerRef.current = null
    }
    setPlanAgentCreationVisible(false)
    setPlanAgentCreateModalOpen(false)
    setPlanAgentCreateModalFromWorkflow(false)
    setActivePage('home')
    setBuildSession(null)
    setBuildAiInput('')
    setPlanFlowTurn(null)
    setPlanAgentBlueprint(null)
    setPlanWorkflowBlueprint(null)
    setPlanConversationKind('agent')
    setMode(homeLandingDefaultMode())
    hadHomeAiSessionRef.current = false
    planQ3AutoTriggeredForMsgIdRef.current = null
    setSelectedRunHistoryId(null)
    setActiveRunsTestPersistEntryId(null)
    setRunsTestRestoreRequest(null)
    setAgentRunTestResume(null)
  }, [clearPlanAssistantThinkTimer, clearUserRecruitJdThinkTimer, setUserRecruitJdTurnBoth])

  /** 侧栏「场景配置」：结束首页 Joyce 会话并进入场景配置主区（与 goHomeLanding 清理一致） */
  const navigateToScenariosPage = useCallback(
    (opts?: { selectedRunHistoryId?: string | null }) => {
      preservePlanBlueprintForWorkflowRef.current = false
      setPlanWorkflowEntryKey(0)
      clearPlanAssistantThinkTimer()
      clearUserRecruitJdThinkTimer()
      userRecruitRequirementsRef.current = createRecruitRequirements()
      setUserRecruitJdTurnBoth('idle')
      if (planCreationDismissTimerRef.current != null) {
        window.clearTimeout(planCreationDismissTimerRef.current)
        planCreationDismissTimerRef.current = null
      }
      if (planBlueprintRevealTimerRef.current != null) {
        window.clearTimeout(planBlueprintRevealTimerRef.current)
        planBlueprintRevealTimerRef.current = null
      }
      setPlanAgentCreationVisible(false)
      setPlanAgentCreateModalOpen(false)
      setPlanAgentCreateModalFromWorkflow(false)
      setUserAccountMenuOpen(false)
      setBuildSession(null)
      setBuildAiInput('')
      setPlanFlowTurn(null)
      setPlanAgentBlueprint(null)
      setPlanWorkflowBlueprint(null)
      setPlanConversationKind('agent')
      setMode(homeLandingDefaultMode())
      hadHomeAiSessionRef.current = false
      planQ3AutoTriggeredForMsgIdRef.current = null
      if (opts?.selectedRunHistoryId != null) {
        setSelectedRunHistoryId(opts.selectedRunHistoryId)
      } else {
        setSelectedRunHistoryId(null)
      }
      setActivePage('scenarios')
    },
    [clearPlanAssistantThinkTimer, clearUserRecruitJdThinkTimer, setUserRecruitJdTurnBoth],
  )

  /** 从侧栏等入口进入 Agent 库：与场景页一致，先结束首页 Plan/Build 会话态 */
  const navigateToAgentLibraryPage = useCallback(
    (opts?: { selectedRunHistoryId?: string | null }) => {
      preservePlanBlueprintForWorkflowRef.current = false
      setPlanWorkflowEntryKey(0)
      clearPlanAssistantThinkTimer()
      if (planCreationDismissTimerRef.current != null) {
        window.clearTimeout(planCreationDismissTimerRef.current)
        planCreationDismissTimerRef.current = null
      }
      if (planBlueprintRevealTimerRef.current != null) {
        window.clearTimeout(planBlueprintRevealTimerRef.current)
        planBlueprintRevealTimerRef.current = null
      }
      setPlanAgentCreationVisible(false)
      setPlanAgentCreateModalOpen(false)
      setPlanAgentCreateModalFromWorkflow(false)
      setUserAccountMenuOpen(false)
      setBuildSession(null)
      setBuildAiInput('')
      setPlanFlowTurn(null)
      setPlanAgentBlueprint(null)
      setPlanWorkflowBlueprint(null)
      setPlanConversationKind('agent')
      setMode(homeLandingDefaultMode())
      hadHomeAiSessionRef.current = false
      planQ3AutoTriggeredForMsgIdRef.current = null
      if (opts?.selectedRunHistoryId != null) {
        setSelectedRunHistoryId(opts.selectedRunHistoryId)
      } else {
        setSelectedRunHistoryId(null)
      }
      setActivePage('agent-library')
    },
    [clearPlanAssistantThinkTimer],
  )

  /** 侧栏对话类历史 → 右侧会话区载入快照，Build 模式下可继续输入 */
  const openRunHistoryFromSidebar = useCallback(
    (runId: string, messages: JoyceChatMessage[]) => {
      preservePlanBlueprintForWorkflowRef.current = false
      setPlanWorkflowEntryKey(0)
      clearPlanAssistantThinkTimer()
      if (planCreationDismissTimerRef.current != null) {
        window.clearTimeout(planCreationDismissTimerRef.current)
        planCreationDismissTimerRef.current = null
      }
      if (planBlueprintRevealTimerRef.current != null) {
        window.clearTimeout(planBlueprintRevealTimerRef.current)
        planBlueprintRevealTimerRef.current = null
      }
      setPlanAgentCreationVisible(false)
      setPlanAgentCreateModalOpen(false)
      setPlanAgentCreateModalFromWorkflow(false)
      setUserAccountMenuOpen(false)
      setActivePage('home')
      setMode('build')
      setPlanFlowTurn(null)
      setPlanAgentBlueprint(null)
      setPlanWorkflowBlueprint(null)
      setPlanConversationKind('agent')
      setBuildAiInput('')
      planQ3AutoTriggeredForMsgIdRef.current = null
      setSelectedRunHistoryId(runId)
      hadHomeAiSessionRef.current = false
      setBuildSession({ messages })
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
      })
    },
    [clearPlanAssistantThinkTimer],
  )

  const handleBuildComposerSend = useCallback(() => {
    setSelectedRunHistoryId(null)
    const text = prompt.trim()
    if (!text) return
    const ts = Date.now()
    if (isUserRole) {
      clearUserRecruitJdThinkTimer()
      userRecruitRequirementsRef.current = createRecruitRequirements()
      setUserRecruitJdTurnBoth('idle')
      setPlanFlowTurn(null)
      setPlanAgentBlueprint(null)
      setPlanWorkflowBlueprint(null)
      setPlanConversationKind('agent')
      handleUserRecruitJdLine(text, [])
      setPrompt('')
      return
    }
    if (mode === 'plan') {
      clearPlanAssistantThinkTimer()
      const userMsg: JoyceChatMessage = { id: `bu-${ts}`, role: 'user', text }
      if (isPlanEntryThinkingTrigger(text)) {
        setPlanConversationKind('agent')
        setPlanWorkflowBlueprint(null)
        setPlanAgentBlueprint(null)
        const J = planJoyceFor('agent')
        schedulePlanAssistantAfterThink(
          [userMsg],
          { id: `ba-${ts}`, role: 'assistant', text: J.q1, planOnboardingDetailQuiz: true },
          'awaitR1',
        )
      } else if (isPlanWorkflowEntryThinkingTrigger(text)) {
        setPlanConversationKind('workflow')
        setPlanAgentBlueprint(null)
        setPlanWorkflowBlueprint(null)
        const J = planJoyceFor('workflow')
        schedulePlanAssistantAfterThink(
          [userMsg],
          { id: `ba-${ts}`, role: 'assistant', text: J.q1, planWorkflowQuiz: 'scope' },
          'awaitR1',
          undefined,
          { workflowPlannerTraceLead: true },
        )
      } else {
        setPlanConversationKind('agent')
        setPlanWorkflowBlueprint(null)
        const J = planJoyceFor('agent')
        setBuildSession({
          messages: [
            userMsg,
            { id: `ba-${ts}`, role: 'assistant', text: J.q1, planOnboardingDetailQuiz: true },
          ],
        })
        setPlanFlowTurn('awaitR1')
        setPlanAgentBlueprint(null)
      }
    } else {
      if (isBuildModeOnboardAgentEntry(text)) {
        const userMsg: JoyceChatMessage = { id: `bu-${ts}`, role: 'user', text }
        scheduleBuildOnboardingAgentIntroSequence([userMsg])
      } else if (isBuildModeOnboardWorkflowEntry(text)) {
        const userMsg: JoyceChatMessage = { id: `bu-${ts}`, role: 'user', text }
        scheduleBuildOnboardingWorkflowIntroSequence([userMsg])
      } else {
        setBuildSession({
          messages: [
            { id: `bu-${ts}`, role: 'user', text },
            {
              id: `ba-${ts}`,
              role: 'assistant',
              text: '已收到。Joyce 将按 Build Mode 直接协助你搭建与配置（演示回复）。',
            },
          ],
        })
        setPlanFlowTurn(null)
        setPlanAgentBlueprint(null)
        setPlanWorkflowBlueprint(null)
        setPlanConversationKind('agent')
      }
    }
    setPrompt('')
  }, [
    isUserRole,
    mode,
    prompt,
    clearPlanAssistantThinkTimer,
    clearUserRecruitJdThinkTimer,
    setUserRecruitJdTurnBoth,
    handleUserRecruitJdLine,
    schedulePlanAssistantAfterThink,
    scheduleBuildOnboardingAgentIntroSequence,
    scheduleBuildOnboardingWorkflowIntroSequence,
  ])

  /** 用户确认生成后、实时输出未结束或草案未落地前锁定输入 */
  const planSessionTraceComposerLocked = useMemo(
    () =>
      Boolean(
        planAgentCreationVisible &&
          (planConversationKind === 'agent'
            ? planAgentBlueprint == null
            : planWorkflowBlueprint == null),
      ),
    [planAgentCreationVisible, planAgentBlueprint, planWorkflowBlueprint, planConversationKind],
  )

  useEffect(() => {
    if (!buildSession?.messages.length) {
      setPlanAgentCreationVisible(false)
    }
  }, [buildSession])

  const handlePlanBlueprintCreateClick = useCallback(() => {
    const wfName = planWorkflowBlueprint?.name?.trim()
    const agName = planAgentBlueprint?.name?.trim()
    if (wfName) {
      setPlanAgentCreateModalTitle(wfName)
    } else if (agName) {
      setPlanAgentCreateModalTitle(agName)
    } else {
      setPlanAgentCreateModalTitle('新员工入职管家')
    }
    setPlanAgentCreateModalFromWorkflow(planWorkflowBlueprint != null)
    setPlanAgentCreateModalOpen(true)
  }, [planWorkflowBlueprint, planAgentBlueprint])

  const handlePlanBlueprintNameChange = useCallback((name: string) => {
    setPlanAgentBlueprint((prev) => (prev ? { ...prev, name } : null))
  }, [])

  const handlePlanBlueprintRoleChange = useCallback((role: string) => {
    setPlanAgentBlueprint((prev) => (prev ? { ...prev, role } : null))
  }, [])

  const handlePlanBlueprintRolePromptChange = useCallback((rolePrompt: string) => {
    setPlanAgentBlueprint((prev) => (prev ? { ...prev, rolePrompt } : null))
  }, [])

  const handlePlanWorkflowEntryConsumed = useCallback(() => {
    setPlanWorkflowEntryKey(0)
  }, [])

  const handleStartPlanCreationFromWorkflowLibrary = useCallback(
    (rawText: string) => {
      const text = rawText.trim() || '从工作流画布返回，继续完善入职设计'
      const ts = Date.now()
      clearPlanAssistantThinkTimer()
      setActivePage('home')
      setMode('plan')
      setPlanAgentCreationVisible(false)
      setPlanAgentCreateModalOpen(false)
      setPlanAgentCreateModalFromWorkflow(false)
      setPlanConversationKind('agent')
      setPlanWorkflowBlueprint(null)
      const J = planJoyceFor('agent')
      setSelectedRunHistoryId(null)
      setBuildSession({
        messages: [
          { id: `bu-${ts}`, role: 'user', text },
          { id: `ba-${ts}`, role: 'assistant', text: J.q1, planOnboardingDetailQuiz: true },
        ],
      })
      setPlanFlowTurn('awaitR1')
      setBuildAiInput('')
      queueMicrotask(() => sessionComposerInputRef.current?.focus())
    },
    [clearPlanAssistantThinkTimer],
  )

  const clearScenarioOpenDeepLink = useCallback(() => {
    setScenarioOpenDeepLink(null)
  }, [])

  /** 侧栏历史：对话 → 右侧会话；入职场景工作流 → 右侧步骤主区(s1/s6/s3/s4/s5/s7)；「Onboarding 助手」→ h1 */
  const handleRunHistoryRowActivate = useCallback(
    (run: RunHistoryItem, _ctx?: { nestedUnderOnboarding?: boolean }) => {
      if (run.kind === 'scenario' && run.id === HISTORY_IDS.onboardingScenario) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.onboardingScenario)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.onboardingScenario, snap)
        return
      }
      if (run.kind === 'scenario' && run.id === HISTORY_IDS.salesManagerOnboarding) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.salesManagerOnboarding)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.salesManagerOnboarding, snap)
        return
      }
      if (run.kind === 'scenario' && run.id === HISTORY_IDS.seniorRdOnboarding) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.seniorRdOnboarding)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.seniorRdOnboarding, snap)
        return
      }
      if (run.kind === 'scenario' && run.id === HISTORY_IDS.identityVerification) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.identityVerification)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.identityVerification, snap)
        return
      }
      if (run.kind === 'scenario' && run.id === HISTORY_IDS.opsManagerOnboarding) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.opsManagerOnboarding)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.opsManagerOnboarding, snap)
        return
      }
      if (run.kind === 'scenario' && run.id === HISTORY_IDS.juniorOpsOnboarding) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.juniorOpsOnboarding)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.juniorOpsOnboarding, snap)
        return
      }
      if (run.kind === 'agent' && run.id === HISTORY_IDS.onboardingAssistantAgent) {
        const snap = getRunHistoryChatSnapshot(HISTORY_IDS.onboardingAssistantChat)
        if (snap) openRunHistoryFromSidebar(HISTORY_IDS.onboardingAssistantChat, snap)
        return
      }
      if (run.kind === 'chat') {
        const snap = getRunHistoryChatSnapshot(run.id)
        if (snap) openRunHistoryFromSidebar(run.id, snap)
      }
    },
    [getRunHistoryChatSnapshot, openRunHistoryFromSidebar],
  )

  const handlePlanCreateModalViewNow = useCallback(() => {
    const goScenario = planAgentCreateModalFromWorkflow
    setPlanAgentCreateModalOpen(false)
    setPlanAgentCreateModalFromWorkflow(false)
    if (goScenario) {
      navigateToScenariosPage()
      setScenarioOpenDeepLink({ token: Date.now(), name: '新员工入职', editorTab: 'build' })
      return
    }
    navigateToAgentLibraryPage()
    setLibraryOpenSingleAgentRequest({ token: Date.now(), agentName: '入职流程编排Agent' })
  }, [navigateToAgentLibraryPage, navigateToScenariosPage, planAgentCreateModalFromWorkflow])

  /** 应用市场「新员工入职引导场景」弹窗：使用模板完成后进入场景配置 Build 工作区 */
  const handleEmployeeOnboardingGuideTemplateApplied = useCallback(() => {
    navigateToScenariosPage()
    setScenarioOpenDeepLink({ token: Date.now(), name: '新员工入职', editorTab: 'build' })
  }, [navigateToScenariosPage])

  const handlePlanCreateModalDismiss = useCallback(() => {
    setPlanAgentCreateModalOpen(false)
    setPlanAgentCreateModalFromWorkflow(false)
  }, [])

  const handlePlanAgentCreationSequenceComplete = useCallback(() => {
    if (planBlueprintRevealTimerRef.current != null) {
      window.clearTimeout(planBlueprintRevealTimerRef.current)
      planBlueprintRevealTimerRef.current = null
    }
    planBlueprintRevealTimerRef.current = window.setTimeout(() => {
      planBlueprintRevealTimerRef.current = null
      if (planConversationKindRef.current === 'workflow') {
        setPlanWorkflowBlueprint(createPlanWorkflowBlueprintDemo())
      } else {
        setPlanAgentBlueprint(createPlanAgentBlueprintDemo())
      }
    }, 420)
    if (planCreationDismissTimerRef.current != null) {
      window.clearTimeout(planCreationDismissTimerRef.current)
    }
    planCreationDismissTimerRef.current = window.setTimeout(() => {
      planCreationDismissTimerRef.current = null
      setPlanAgentCreationVisible(false)
    }, 1800)
  }, [])

  const submitBuildOrPlanUserLine = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim()
      if (!trimmed || !buildSession) return

      clearPlanAssistantThinkTimer()

      const ts = Date.now()
      const uId = `bu-${ts}`
      const aId = `ba-${ts + 1}`

      if (isUserRole) {
        handleUserRecruitJdLine(trimmed, buildSession.messages)
        return
      }

      const sessionUsesPlanOnboardingFlow =
        planFlowTurn != null && (mode === 'plan' || mode === 'build')

      if (!sessionUsesPlanOnboardingFlow) {
        const buildWorkflowPostCreate =
          mode === 'build' &&
          planConversationKind === 'workflow' &&
          planWorkflowBlueprint != null
        if (buildWorkflowPostCreate) {
          const userMsg: JoyceChatMessage = { id: uId, role: 'user', text: trimmed }
          const assist: JoyceChatMessage = {
            id: aId,
            role: 'assistant',
            text: BUILD_MODE_WORKFLOW_BUILDER_EDIT_HINT,
            blueprintCreateButton: { label: '前往构建器', ariaLabel: '前往构建器，打开与侧栏创建相同的流程' },
          }
          setBuildSession({ messages: [...buildSession.messages, userMsg, assist] })
          return
        }

        const buildAgentPostCreate =
          mode === 'build' &&
          planConversationKind === 'agent' &&
          planAgentBlueprint != null &&
          planWorkflowBlueprint == null
        if (buildAgentPostCreate) {
          const userMsg: JoyceChatMessage = { id: uId, role: 'user', text: trimmed }
          const assist: JoyceChatMessage = {
            id: aId,
            role: 'assistant',
            text: BUILD_MODE_AGENT_BUILDER_EDIT_HINT,
            blueprintCreateButton: { label: '前往构建器', ariaLabel: '前往构建器，打开与侧栏创建相同的流程' },
          }
          setBuildSession({ messages: [...buildSession.messages, userMsg, assist] })
          return
        }

        const userMsg: JoyceChatMessage = { id: uId, role: 'user', text: trimmed }
        const assist: JoyceChatMessage = { id: aId, role: 'assistant', text: '（演示）已记录你的补充说明。' }
        const withUser = [...buildSession.messages, userMsg]
        if (mode === 'plan') {
          schedulePlanAssistantAfterThink(withUser, assist, null)
        } else if (isBuildModeOnboardAgentEntry(trimmed)) {
          scheduleBuildOnboardingAgentIntroSequence(withUser)
        } else if (mode === 'build' && isBuildModeOnboardWorkflowEntry(trimmed)) {
          scheduleBuildOnboardingWorkflowIntroSequence(withUser)
        } else {
          setBuildSession({ messages: [...withUser, assist] })
        }
        return
      }

      const J = planJoyceFor(planConversationKind)

      if (planFlowTurn === 'done') {
        const userMsg: JoyceChatMessage = { id: uId, role: 'user', text: trimmed }
        const nextWithUser = [...buildSession.messages, userMsg]
        if (planConversationKind === 'agent' && isPlanOfficeSuppliesFeatureRequest(trimmed)) {
          scheduleOfficeSuppliesPlanReply(nextWithUser)
          return
        }
        const assist: JoyceChatMessage = {
          id: aId,
          role: 'assistant',
          text: '（演示）Joyce 仍在同一对话里。接入后端后可继续优化草案或生成工作流。',
        }
        schedulePlanAssistantAfterThink(nextWithUser, assist, 'done')
        return
      }

      const nextBase: JoyceChatMessage[] = [...buildSession.messages, { id: uId, role: 'user', text: trimmed }]

      if (planFlowTurn === 'awaitR1Type') {
        /** 智能体 Plan：已取消第二轮（协作方式）问答，首轮补充后直接生成 */
        if (planConversationKind === 'agent') {
          setPlanAgentCreationVisible(true)
          schedulePlanAssistantAfterThink(
            nextBase,
            {
              id: aId,
              role: 'assistant',
              text: J.result,
              richBubble: 'plan-multi-agent-system-created',
            },
            'done',
          )
          return
        }
        schedulePlanAssistantAfterThink(
          nextBase,
          { id: aId, role: 'assistant', text: J.q2, planWorkflowQuiz: 'collaboration' },
          'awaitR2',
        )
        return
      }

      if (planFlowTurn === 'awaitR2Type') {
        if (planConversationKind === 'workflow') {
          setPlanAgentCreationVisible(true)
          schedulePlanAssistantAfterThink(
            nextBase,
            { id: aId, role: 'assistant', text: '', richBubble: 'onboarding-workflow-created' },
            'done',
          )
        } else {
          schedulePlanAssistantAfterThink(nextBase, { id: aId, role: 'assistant', text: J.q3 }, 'awaitR3')
        }
        return
      }

      if (planFlowTurn === 'awaitR3Type') {
        if (/确认|开始|好的|可以|行|OK|ok|生成/i.test(trimmed)) {
          setPlanAgentCreationVisible(true)
          const doneAssistant: JoyceChatMessage =
            planConversationKind === 'workflow'
              ? { id: aId, role: 'assistant', text: '', richBubble: 'onboarding-workflow-created' }
              : {
                  id: aId,
                  role: 'assistant',
                  text: J.result,
                  richBubble: 'plan-multi-agent-system-created',
                }
          schedulePlanAssistantAfterThink(nextBase, doneAssistant, 'done')
        } else {
          schedulePlanAssistantAfterThink(nextBase, { id: aId, role: 'assistant', text: PLAN_AFTER_FREE_ACK }, 'awaitR3')
        }
        return
      }

      if (planFlowTurn === 'awaitR1') {
        /** 智能体 Plan：问卷或首轮选项确认后不再展示第二问，直接进入创建动画与结果说明 */
        if (planConversationKind === 'agent' && trimmed.startsWith(PLAN_DETAIL_QUIZ_ACK_PREFIX)) {
          setPlanAgentCreationVisible(true)
          schedulePlanAssistantAfterThink(
            nextBase,
            {
              id: aId,
              role: 'assistant',
              text: J.result,
              richBubble: 'plan-multi-agent-system-created',
            },
            'done',
          )
          return
        }
        if (planConversationKind === 'agent' && J.c1.includes(trimmed)) {
          setPlanAgentCreationVisible(true)
          schedulePlanAssistantAfterThink(
            nextBase,
            {
              id: aId,
              role: 'assistant',
              text: J.result,
              richBubble: 'plan-multi-agent-system-created',
            },
            'done',
          )
          return
        }
        if (J.c1.includes(trimmed)) {
          schedulePlanAssistantAfterThink(
            nextBase,
            { id: aId, role: 'assistant', text: J.q2, planWorkflowQuiz: 'collaboration' },
            'awaitR2',
          )
        } else if (planConversationKind === 'workflow') {
          schedulePlanAssistantAfterThink(
            nextBase,
            {
              id: aId,
              role: 'assistant',
              text: PLAN_WORKFLOW_CHIP_NUDGE_R1,
              planWorkflowQuiz: 'scope',
            },
            'awaitR1',
          )
        } else {
          schedulePlanAssistantAfterThink(nextBase, { id: aId, role: 'assistant', text: J.r1Hint }, 'awaitR1Type')
        }
        return
      }

      if (planFlowTurn === 'awaitR2') {
        if (J.c2.includes(trimmed)) {
          if (planConversationKind === 'workflow') {
            setPlanAgentCreationVisible(true)
            schedulePlanAssistantAfterThink(
              nextBase,
              { id: aId, role: 'assistant', text: '', richBubble: 'onboarding-workflow-created' },
              'done',
            )
          } else {
            schedulePlanAssistantAfterThink(nextBase, { id: aId, role: 'assistant', text: J.q3 }, 'awaitR3')
          }
        } else if (planConversationKind === 'workflow') {
          schedulePlanAssistantAfterThink(
            nextBase,
            {
              id: aId,
              role: 'assistant',
              text: PLAN_WORKFLOW_CHIP_NUDGE_R2,
              planWorkflowQuiz: 'collaboration',
            },
            'awaitR2',
          )
        } else {
          schedulePlanAssistantAfterThink(nextBase, { id: aId, role: 'assistant', text: J.r2Hint }, 'awaitR2Type')
        }
        return
      }

      if (planFlowTurn === 'awaitR3') {
        if (trimmed === PLAN_R3_SUPPLEMENT) {
          schedulePlanAssistantAfterThink(nextBase, { id: aId, role: 'assistant', text: J.r3Hint }, 'awaitR3Type')
        } else if (/确认|开始|好的|可以|行|OK|ok/i.test(trimmed)) {
          setPlanAgentCreationVisible(true)
          const doneAssistant: JoyceChatMessage =
            planConversationKind === 'workflow'
              ? { id: aId, role: 'assistant', text: '', richBubble: 'onboarding-workflow-created' }
              : {
                  id: aId,
                  role: 'assistant',
                  text: J.result,
                  richBubble: 'plan-multi-agent-system-created',
                }
          schedulePlanAssistantAfterThink(nextBase, doneAssistant, 'done')
        } else {
          schedulePlanAssistantAfterThink(
            nextBase,
            {
              id: aId,
              role: 'assistant',
              text: `未匹配到选项。可直接输入「确认」或「开始」生成方案；或输入「${PLAN_R3_SUPPLEMENT}」补充后再试。`,
            },
            'awaitR3',
          )
        }
        return
      }
    },
    [
      isUserRole,
      buildSession,
      mode,
      planFlowTurn,
      planConversationKind,
      planWorkflowBlueprint,
      planAgentBlueprint,
      clearPlanAssistantThinkTimer,
      handleUserRecruitJdLine,
      schedulePlanAssistantAfterThink,
      scheduleOfficeSuppliesPlanReply,
      scheduleBuildOnboardingAgentIntroSequence,
      scheduleBuildOnboardingWorkflowIntroSequence,
    ],
  )

  const planQ3AutoGenerateKey = useMemo(() => {
    if (mode !== 'plan' || planFlowTurn !== 'awaitR3' || !buildSession?.messages.length) return null
    const last = buildSession.messages[buildSession.messages.length - 1]
    if (!last || last.role !== 'assistant' || last.isThinking) return null
    const isQ3 = last.text === PLAN_JOYCE_Q3 || last.text === PLAN_WORKFLOW_JOYCE_Q3
    if (!isQ3) return null
    return last.id
  }, [mode, planFlowTurn, buildSession])

  useLayoutEffect(() => {
    if (!planQ3AutoGenerateKey) {
      return
    }
    if (planQ3AutoTriggeredForMsgIdRef.current === planQ3AutoGenerateKey) {
      return
    }
    planQ3AutoTriggeredForMsgIdRef.current = planQ3AutoGenerateKey
    queueMicrotask(() => {
      submitBuildOrPlanUserLine('确认')
    })
  }, [planQ3AutoGenerateKey, submitBuildOrPlanUserLine])

  const handleBuildAiSend = useCallback(() => {
    const text = buildAiInput.trim()
    if (!text || !buildSession) return
    submitBuildOrPlanUserLine(text)
    setBuildAiInput('')
  }, [buildAiInput, buildSession, submitBuildOrPlanUserLine])

  const handlePlanQuickReply = useCallback(
    (text: string) => {
      if (!buildSession) return
      submitBuildOrPlanUserLine(text)
      setBuildAiInput('')
    },
    [buildSession, submitBuildOrPlanUserLine],
  )

  const handleUserRecruitJdQuickReply = useCallback(
    (text: string) => {
      if (!buildSession) return
      handleUserRecruitJdLine(text, buildSession.messages)
      setBuildAiInput('')
    },
    [buildSession, handleUserRecruitJdLine],
  )

  useEffect(() => {
    if (buildSession) {
      if (!hadHomeAiSessionRef.current) {
        hadHomeAiSessionRef.current = true
        const t = window.setTimeout(() => sessionComposerInputRef.current?.focus(), 480)
        return () => window.clearTimeout(t)
      }
    } else {
      hadHomeAiSessionRef.current = false
      planQ3AutoTriggeredForMsgIdRef.current = null
      setPlanAgentCreationVisible(false)
      setPlanConversationKind('agent')
      setPlanWorkflowBlueprint(null)
    }
  }, [buildSession])

  const handleMarkMarketItemInstalled = useCallback((id: string) => {
    setInstalledMarketItemIds((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }, [])

  const handleToolInstallStart = useCallback(() => {
    setIsToolInstallTransitioning(true)
  }, [])

  const handleToolInstallComplete = useCallback((item: Parameters<typeof createToolDirectoryItemFromAppMarket>[0]) => {
    setToolDirectoryItems((current) => {
      if (current.some((tool) => tool.id === item.id)) return current
      return [createToolDirectoryItemFromAppMarket(item), ...current]
    })
    setIsToolInstallTransitioning(false)
    setActivePage('tools')
  }, [])

  const handleMarketTemplateApplied = useCallback(
    (item: AppMarketItem) => {
      switch (item.productLine) {
        case 'agent-templates': {
          let createdAgentName: string | null = null
          setAgents((prev) => {
            const used = new Set(prev.map((agent) => agent.name))
            const nextAgent = buildWorkspaceAgentFromTemplate(item, locale, used)
            if (prev.some((agent) => agent.name === nextAgent.name)) return prev
            createdAgentName = nextAgent.name
            return [nextAgent, ...prev]
          })
          if (createdAgentName) {
            setMarketAgentTemplateApplyRequest({
              token: Date.now(),
              agentName: createdAgentName,
              item,
            })
          }
          setActivePage('agent-library')
          return
        }
        case 'scenario-templates': {
          let createdScenarioName: string | null = null
          setAgents((prev) => {
            const used = new Set(prev.map((agent) => agent.name))
            const nextAgent = buildWorkspaceAgentFromTemplate(item, locale, used)
            if (prev.some((agent) => agent.name === nextAgent.name)) return prev
            createdScenarioName = nextAgent.name
            return [nextAgent, ...prev]
          })
          if (createdScenarioName) {
            setMarketScenarioBlueprints((current) => ({
              ...current,
              [createdScenarioName as string]: item.workflowSteps ?? [],
            }))
          }
          setActivePage('scenarios')
          return
        }
        case 'tools':
          handleToolInstallComplete(item)
          return
        case 'skills':
          setActivePage('skills')
          return
        default:
          return
      }
    },
    [handleToolInstallComplete, locale],
  )

  const handleOpenAppMarketToolsAnchor = useCallback(() => {
    setAppMarketEntryRequest({ kind: 'tools-anchor', token: Date.now() })
    setActivePage('app-market')
  }, [])

  const handleOpenAppMarketSkillsAnchor = useCallback(() => {
    setAppMarketEntryRequest({ kind: 'skills-anchor', token: Date.now() })
    setActivePage('app-market')
  }, [])

  useEffect(() => {
    if (activePage !== 'home') {
      const preserveBlueprint = preservePlanBlueprintForWorkflowRef.current
      preservePlanBlueprintForWorkflowRef.current = false
      clearPlanAssistantThinkTimer()
      if (planCreationDismissTimerRef.current != null) {
        window.clearTimeout(planCreationDismissTimerRef.current)
        planCreationDismissTimerRef.current = null
      }
      if (planBlueprintRevealTimerRef.current != null) {
        window.clearTimeout(planBlueprintRevealTimerRef.current)
        planBlueprintRevealTimerRef.current = null
      }
      setPlanAgentCreationVisible(false)
      try {
        composerVoiceRecognitionRef.current?.abort()
      } catch {
        /* ignore */
      }
      composerVoiceRecognitionRef.current = null
      setComposerVoiceListening(false)
      setBuildSession(null)
      setBuildAiInput('')
      setPlanFlowTurn(null)
      if (!preserveBlueprint) {
        setPlanAgentBlueprint(null)
        setPlanWorkflowBlueprint(null)
        setPlanConversationKind('agent')
      }
      setMode(homeLandingDefaultMode())
      hadHomeAiSessionRef.current = false
      planQ3AutoTriggeredForMsgIdRef.current = null
    }
  }, [activePage, clearPlanAssistantThinkTimer])

  useEffect(() => {
    return () => {
      if (planCreationDismissTimerRef.current != null) {
        window.clearTimeout(planCreationDismissTimerRef.current)
        planCreationDismissTimerRef.current = null
      }
      if (planBlueprintRevealTimerRef.current != null) {
        window.clearTimeout(planBlueprintRevealTimerRef.current)
        planBlueprintRevealTimerRef.current = null
      }
      try {
        composerVoiceRecognitionRef.current?.abort()
      } catch {
        /* ignore */
      }
      composerVoiceRecognitionRef.current = null
    }
  }, [])

  const handleComposerVoiceClick = useCallback(() => {
    if (composerVoiceListening) {
      try {
        composerVoiceRecognitionRef.current?.stop()
      } catch {
        /* ignore */
      }
      return
    }

    const rec = createBrowserSpeechRecognition()
    const appendUnsupported = () => {
      const note = '（演示：当前浏览器不支持语音识别，请使用 Chrome 桌面版或手动输入。）'
      if (buildSession) {
        setBuildAiInput((p) => {
          const t = p.trim()
          return t ? `${t}${note}` : note
        })
        sessionComposerInputRef.current?.focus()
      } else {
        setPrompt((p) => {
          const t = p.trim()
          return t ? `${t}${note}` : note
        })
        composerInputRef.current?.focus()
      }
    }

    if (!rec) {
      appendUnsupported()
      return
    }

    composerVoiceRecognitionRef.current = rec
    rec.lang = 'zh-CN'
    rec.continuous = false
    rec.interimResults = false

    rec.onstart = () => setComposerVoiceListening(true)

    rec.onend = () => {
      composerVoiceRecognitionRef.current = null
      setComposerVoiceListening(false)
    }

    rec.onerror = () => {
      composerVoiceRecognitionRef.current = null
      setComposerVoiceListening(false)
    }

    rec.onresult = (event: ComposerSpeechRecognitionResultEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? '')
        .join('')
        .trim()
      if (!transcript) return
      if (buildSession) {
        setBuildAiInput((p) => {
          const base = p.trim()
          return base ? `${base} ${transcript}` : transcript
        })
        sessionComposerInputRef.current?.focus()
      } else {
        setPrompt((p) => {
          const base = p.trim()
          return base ? `${base} ${transcript}` : transcript
        })
        composerInputRef.current?.focus()
      }
    }

    try {
      rec.start()
    } catch {
      composerVoiceRecognitionRef.current = null
      setComposerVoiceListening(false)
    }
  }, [buildSession, composerVoiceListening])

  const initialAgents: Agent[] = [
    {
      name: '入职流程编排Agent',
      desc: 'Master coordinator managing the entire employee onboarding workflow by delegating tasks to…',
      meta: 'yesterday',
      createdBy: 'member-mgr-wang',
      provenance: 'manual',
    },
    {
      name: 'onboarding',
      desc: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',
      meta: '19 days ago',
      createdBy: 'member-mgr-wang',
      provenance: 'manual',
    },
    {
      name: 'Leave Approval Workflow Agent',
      desc: 'Multi-level PTO approval workflow agent that routes vacation requests through manager and H…',
      meta: '19 days ago',
      createdBy: 'member-hr-zhang',
      provenance: 'manual',
    },
    {
      name: 'Orientation Scheduler Agent',
      desc: 'Coordinates orientation schedules, team introductions, and first-day logistics',
      meta: '20 days ago',
      createdBy: 'member-hr-zhang',
      provenance: 'manual',
    },
    {
      name: 'Onboarding Support Agent',
      desc: 'Answers employee questions and provides support throughout the onboarding process',
      meta: '20 days ago',
      createdBy: 'member-onboarding-liu',
      provenance: 'manual',
    },
    {
      name: 'Training Coordinator Agent',
      desc: 'Assigns training courses and tracks employee training progress',
      meta: '20 days ago',
      createdBy: 'member-hr-zhang',
      provenance: 'manual',
    },
    {
      name: 'Account Setup Agent',
      desc: 'Creates and configures employee accounts and access credentials',
      meta: '20 days ago',
      createdBy: 'member-it-li',
      provenance: 'manual',
    },
    {
      name: 'Document Collection Agent',
      desc: 'Manages employee document collection and verification during onboarding',
      meta: '20 days ago',
      createdBy: 'member-hr-zhang',
      provenance: 'manual',
    },
    {
      name: 'HR Onboarding Agent',
      desc: 'Automates new-hire onboarding: generates personalized welcome emails, builds role-specific…',
      meta: '20 days ago',
      createdBy: 'member-hr-zhang',
      provenance: 'manual',
    },
    {
      name: 'Chief Technology Editor',
      desc: 'A senior editor who ensures article quality and coordinates the research and…',
      meta: '26 days ago',
      createdBy: 'member-mgr-wang',
      provenance: 'manual',
    },
    {
      name: 'Technology Writer',
      desc: 'A renowned technology writer skilled at making complex technical concepts accessible through…',
      meta: '27 days ago',
      provenance: 'app-market-template',
    },
    {
      name: 'Technology Researcher',
      desc: 'Skilled in gathering and validating the latest technical information to…',
      meta: '27 days ago',
      provenance: 'app-market-template',
    },
  ]

  const [agents, setAgents] = useState<Agent[]>(initialAgents)

  useEffect(() => {
    syncUserContentFromAgents(agents, {
      memberId: resolveCurrentMemberId(),
      locale,
    })
  }, [agents, locale])

  useEffect(() => {
    syncUserContentFromSkills(
      workspaceSkills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
      })),
      { memberId: resolveCurrentMemberId() },
    )
  }, [workspaceSkills])

  useEffect(() => {
    syncUserContentFromTools(
      toolDirectoryItems.map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
      })),
      { memberId: resolveCurrentMemberId() },
    )
  }, [toolDirectoryItems])

  useEffect(() => {
    const onDeleted = (event: Event) => {
      const contentKey = (event as CustomEvent<UserContentDeletedDetail>).detail.contentKey
      setAgents((prev) => prev.filter((agent) => agent.name !== contentKey))
    }
    window.addEventListener(USER_CONTENT_DELETED_EVENT, onDeleted)
    return () => window.removeEventListener(USER_CONTENT_DELETED_EVENT, onDeleted)
  }, [])

  useEffect(() => {
    const onMineContentNav = (event: Event) => {
      const detail = (event as CustomEvent<MineContentNavDetail>).detail
      const token = Date.now()
      if (detail.module === 'agent-library') {
        if (!canAccessPage('agent-library')) return
        setActivePage('agent-library')
        setAgentLibraryCardAction({ token, agentName: detail.contentKey, action: detail.action })
        return
      }
      if (!canAccessPage('scenarios')) return
      setActivePage('scenarios')
      setScenarioCardAction({ token, sourceName: detail.contentKey, action: detail.action })
    }
    window.addEventListener(MINE_CONTENT_NAV_EVENT, onMineContentNav)
    return () => window.removeEventListener(MINE_CONTENT_NAV_EVENT, onMineContentNav)
  }, [canAccessPage, setActivePage])

  useEffect(() => {
    return () => document.documentElement.classList.remove('theme-demo-dark')
  }, [])

  const layoutUserAccountMenu = useCallback(() => {
    if (!userAccountMenuOpen) return
    const btn = manusUserBtnRef.current
    const panel = manusUserMenuRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const pad = 8
    const width = Math.min(260, window.innerWidth - pad * 2)
    const left = Math.max(pad, Math.min(r.left, window.innerWidth - width - pad))
    const gap = 8
    const estH = 320
    let top = r.bottom + gap
    if (panel) {
      const h = panel.offsetHeight
      if (top + h > window.innerHeight - pad) {
        top = Math.max(pad, r.top - h - gap)
      }
    } else if (top + estH > window.innerHeight - pad) {
      top = Math.max(pad, r.top - estH - gap)
    }
    setUserAccountMenuLayout({ left, top, width })
  }, [userAccountMenuOpen])

  useLayoutEffect(() => {
    if (!userAccountMenuOpen) return
    layoutUserAccountMenu()
    const id = requestAnimationFrame(() => layoutUserAccountMenu())
    return () => cancelAnimationFrame(id)
  }, [layoutUserAccountMenu, userAccountMenuOpen, isSidebarExpanded])

  useEffect(() => {
    if (!userAccountMenuOpen) return
    const onResize = () => {
      layoutUserAccountMenu()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [userAccountMenuOpen, layoutUserAccountMenu])

  useEffect(() => {
    if (!userAccountMenuOpen) return
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (manusUserBtnRef.current?.contains(t)) return
      if (manusUserMenuRef.current?.contains(t)) return
      setUserAccountMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [userAccountMenuOpen])

  return (
    <>
    <div
      className={[
        isSidebarExpanded ? 'manus is-sidebar-expanded' : 'manus',
        activePage === 'home' && buildSession ? 'manus--home-ai-session' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <aside className="manus-sidebar" aria-label={t('navigation')}>
        <div className="manus-sidebar-top">
          <div className="manus-logo">
            <img className="manus-logo-img" src="/studio-x-logo.png" alt="Studio X" width={36} height={36} />
          </div>
          <div className="manus-sidebar-brand">
            <span className="manus-sidebar-brand-title">Studio X</span>
            <span className="manus-sidebar-brand-sub">{t('managersPortal')}</span>
          </div>
        </div>

        <button
          className="manus-sidebar-toggle"
          type="button"
          aria-label={isSidebarExpanded ? t('collapseSidebar') : t('expandSidebar')}
          aria-expanded={isSidebarExpanded}
          onClick={() => setIsSidebarExpanded((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={
              isSidebarExpanded
                ? undefined
                : { transform: 'scaleX(-1)', transformOrigin: 'center' }
            }
          >
            <path
              d="M6 5v14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M17 8l-5 4 5 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <nav className="manus-sidebar-nav" aria-label={t('features')}>
          <button
            className={activePage === 'home' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navHome')}
            title={t('navHome')}
            aria-current={activePage === 'home' ? 'page' : undefined}
            onClick={goHomeLanding}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M3 11.5 12 4l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-8.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navHome')}</span>
          </button>
          {canAccessPage('agent-library') ? (
          <button
            className={activePage === 'agent-library' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navAgentLibrary')}
            title={t('navAgentLibrary')}
            aria-current={activePage === 'agent-library' ? 'page' : undefined}
            onClick={() => {
              setActiveRunsTestPersistEntryId(null)
              setRunsTestRestoreRequest(null)
              setAgentRunTestResume(null)
              navigateToAgentLibraryPage()
            }}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 7V3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <rect
                  x="3.5"
                  y="7"
                  width="17"
                  height="14"
                  rx="2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                />
                <path
                  d="M3.5 14H1.75M20.5 14H22.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <rect x="8" y="10.5" width="3" height="6.5" rx="1.5" fill="currentColor" />
                <rect x="13" y="10.5" width="3" height="6.5" rx="1.5" fill="currentColor" />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navAgentLibrary')}</span>
          </button>
          ) : null}
          {canAccessPage('scenarios') ? (
          <button
            className={activePage === 'scenarios' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navScenarios')}
            title={t('navScenarios')}
            aria-current={activePage === 'scenarios' ? 'page' : undefined}
            onClick={() => {
              setActiveRunsTestPersistEntryId(null)
              setRunsTestRestoreRequest(null)
              setAgentRunTestResume(null)
              navigateToScenariosPage()
            }}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  d="M20 6H6V17H20V6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path
                  d="M42 31H28V42H42V31Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path
                  d="M42 6H28V23H42V6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 25H6V42H20V25Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navScenarios')}</span>
          </button>
          ) : null}
          {canAccessPage('experience') ? (
          <button
            className={activePage === 'experience' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navExperience')}
            title={t('navExperience')}
            aria-current={activePage === 'experience' ? 'page' : undefined}
            onClick={() => {
              setExperiencePageEntryKey((value) => value + 1)
              setActivePage('experience')
            }}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  d="M24 6C14.0589 6 6 14.0589 6 24C6 33.9411 14.0589 42 24 42C33.9411 42 42 33.9411 42 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33C28.9706 33 33 28.9706 33 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M24 24.0001L30.3 17.6943"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M30.2998 11.4264V17.7H36.6249L41.9999 12.3002H35.7031V6L30.2998 11.4264Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navExperience')}</span>
          </button>
          ) : null}
          {canAccessPage('team-collaboration-space') ? (
            <TeamCollaborationSidebarNav
              isSidebarExpanded={isSidebarExpanded}
              activeSection={teamCollaborationSection}
              isTeamCollaborationActive={activePage === 'team-collaboration-space'}
              navExpanded={teamCollaborationNavExpanded}
              onNavExpandedChange={setTeamCollaborationNavExpanded}
              onNavigate={openTeamCollaborationSection}
              navListId={`${tabListId}-team-collaboration-nav`}
            />
          ) : null}
          {canAccessPage('knowledge-base') ? (
          <button
            className={activePage === 'knowledge-base' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navKnowledgeBase')}
            title={t('navKnowledgeBase')}
            aria-current={activePage === 'knowledge-base' ? 'page' : undefined}
            onClick={() => setActivePage('knowledge-base')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  d="M44.0001 11C44.0001 11 44 36.0623 44 38C44 41.3137 35.0457 44 24 44C12.9543 44 4.00003 41.3137 4.00003 38C4.00003 36.1423 4 11 4 11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M44 29C44 32.3137 35.0457 35 24 35C12.9543 35 4 32.3137 4 29"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M44 20C44 23.3137 35.0457 26 24 26C12.9543 26 4 23.3137 4 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <ellipse
                  cx="24"
                  cy="10"
                  rx="20"
                  ry="6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navKnowledgeBase')}</span>
          </button>
          ) : null}
          {canAccessPage('tools') ? (
          <button
            className={activePage === 'tools' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navTools')}
            title={t('navTools')}
            aria-current={activePage === 'tools' ? 'page' : undefined}
            onClick={() => setActivePage('tools')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4 12.5V19C4 19.8284 4.67157 20.5 5.5 20.5H18.5C19.3284 20.5 20 19.8284 20 19V12.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 7.5C2.5 6.94772 2.94772 6.5 3.5 6.5H20.5C21.0523 6.5 21.5 6.94772 21.5 7.5V11.5C21.5 12.0523 21.0523 12.5 20.5 12.5H3.5C2.94772 12.5 2.5 12.0523 2.5 11.5V7.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.5 6.5V4.5C15.5 3.94772 15.0523 3.5 14.5 3.5H9.5C8.94772 3.5 8.5 3.94772 8.5 4.5V6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 11.5V14.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.5 11.5V14.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navTools')}</span>
          </button>
          ) : null}
          {canAccessPage('skills') ? (
          <button
            className={activePage === 'skills' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navSkills')}
            title={t('navSkills')}
            aria-current={activePage === 'skills' ? 'page' : undefined}
            onClick={() => setActivePage('skills')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  d="M19 4H37L26 18H41L17 44L22 25H8L19 4Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navSkills')}</span>
          </button>
          ) : null}
          {canAccessPage('app-market') ? (
          <button
            className={activePage === 'app-market' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navAppMarket')}
            title={t('navAppMarket')}
            aria-current={activePage === 'app-market' ? 'page' : undefined}
            onClick={() => {
              setActiveRunsTestPersistEntryId(null)
              setRunsTestRestoreRequest(null)
              setAgentRunTestResume(null)
              setActivePage('app-market')
            }}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path
                  d="M4 12H44V20L42.6015 20.8391C40.3847 22.1692 37.6153 22.1692 35.3985 20.8391L34 20L32.6015 20.8391C30.3847 22.1692 27.6153 22.1692 25.3985 20.8391L24 20L22.6015 20.8391C20.3847 22.1692 17.6153 22.1692 15.3985 20.8391L14 20L12.6015 20.8391C10.3847 22.1692 7.61531 22.1692 5.39853 20.8391L4 20V12Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 22.4889V44H40V22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 11.8222V4H40V12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="19"
                  y="32"
                  width="10"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navAppMarket')}</span>
          </button>
          ) : null}
          {canAccessPage('analytics') ? (
          <button
            className={activePage === 'analytics' ? 'manus-nav-item is-active' : 'manus-nav-item'}
            type="button"
            aria-label={t('navAnalytics')}
            title={t('navAnalytics')}
            aria-current={activePage === 'analytics' ? 'page' : undefined}
            onClick={() => setActivePage('analytics')}
          >
            <span className="manus-nav-item-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M5 19V10M12 19V5M19 19v-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="manus-nav-item-label">{t('navAnalytics')}</span>
          </button>
          ) : null}

          {canAccessPage('access-control') ? (
            <AccessControlSidebarNav
              isSidebarExpanded={isSidebarExpanded}
              activeSection={accessControlSection}
              isAccessControlActive={activePage === 'access-control'}
              navExpanded={accessControlNavExpanded}
              onNavExpandedChange={setAccessControlNavExpanded}
              onNavigate={openAccessControlSection}
              navListId={`${tabListId}-access-control-nav`}
            />
          ) : null}
        </nav>

        {isSidebarExpanded ? (
          <section className="manus-sidebar-runs" aria-label={t('historyRecords')}>
            <header className="manus-runs-header">
              <button
                className="manus-runs-title"
                type="button"
                aria-label={t('toggleHistoryRecords')}
                aria-expanded={isRunsExpanded}
                onClick={() => setIsRunsExpanded((v) => !v)}
              >
                <span
                  className={isRunsExpanded ? 'manus-runs-caret is-open' : 'manus-runs-caret'}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {t('historyRecords')}
              </button>
              <div className="manus-runs-actions" aria-label="actions">
                <button
                  className={runSearchOpen ? 'manus-runs-action is-active' : 'manus-runs-action'}
                  type="button"
                  aria-label={t('filterHistory')}
                  aria-expanded={runSearchOpen}
                  onClick={() => {
                    setIsRunsExpanded(true)
                    setRunSearchOpen((was) => {
                      const next = !was
                      if (next) {
                        setRunKindFilterHoverOpen(false)
                      }
                      return next
                    })
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16.8 16.8 21 21"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  className="manus-runs-action"
                  type="button"
                  aria-label={t('goHome')}
                  onClick={goHomeLanding}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M12 5v14M5 12h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {!isUserRole ? (
                <div
                  className="manus-runs-kind-filter-anchor"
                  onMouseEnter={openRunKindFilterHover}
                  onMouseLeave={scheduleRunKindFilterHoverClose}
                >
                  <button
                    ref={runKindFilterBtnRef}
                    className={
                      runKindFilterMenuOpen || runHistoryKindFilter !== 'all'
                        ? 'manus-runs-action is-active'
                        : 'manus-runs-action'
                    }
                    type="button"
                    aria-label={t('filterHistoryByType')}
                    aria-expanded={runKindFilterMenuOpen || runKindFilterHoverOpen}
                    aria-haspopup="true"
                    aria-controls={runKindFilterPanelId}
                    onClick={() => {
                      setIsRunsExpanded(true)
                      setRunKindFilterMenuOpen((was) => {
                        const next = !was
                        if (next) setRunSearchOpen(false)
                        return next
                      })
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M5 7h14M5 12h14M5 17h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {isRunsExpanded && runKindFilterHoverOpen ? (
                    <div
                      id={runKindFilterPanelId}
                      ref={runKindFilterPanelRef}
                      className="manus-runs-kind-filter"
                      role="menu"
                      aria-label={t('historyRecordTypes')}
                    >
                      {runHistoryKindFilterOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={runHistoryKindFilter === opt.value}
                          className={
                            runHistoryKindFilter === opt.value
                              ? 'manus-runs-kind-filter-btn is-selected'
                              : 'manus-runs-kind-filter-btn'
                          }
                          onClick={() => {
                            setRunHistoryKindFilter(opt.value)
                            setRunKindFilterHoverOpen(false)
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}
              </div>
            </header>

            {isRunsExpanded && runSearchOpen ? (
              <div className="manus-runs-filter">
                <label className="sr-only" htmlFor={runSearchInputId}>
                  {t('filterHistory')}
                </label>
                <input
                  id={runSearchInputId}
                  className="manus-runs-filter-input"
                  type="search"
                  placeholder={t('filterHistoryPlaceholder')}
                  value={runSearchQuery}
                  onChange={(e) => setRunSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
            ) : null}

            {isRunsExpanded ? (
              <div className="manus-runs-list-scroll" role="region" aria-label={t('historyRecordList')}>
                <div className="manus-runs-list" role="list">
                  {sidebarHistoryRenderRows.length === 0 ? (
                    <div className="manus-runs-empty" role="status">
                      {runSearchQuery.trim()
                        ? t('noMatchingRecords')
                        : runHistoryKindFilter !== 'all'
                          ? t('noRecordsInType')
                          : t('noRecords')}
                    </div>
                  ) : (
                    sidebarHistoryRenderRows.map((row, rowIndex) => {
                      const run = row.run
                      const nestedUnderOnboarding = row.nestedUnderOnboarding === true
                      const nestedUnderAgentChat = row.nestedUnderAgentChat === true
                      const listKey = row.rowKey ?? run.id
                      const isOnboardingScenarioRow =
                        run.kind === 'scenario' && run.id === HISTORY_IDS.onboardingScenario
                      const isJinnyOnboardingScenarioRow =
                        run.kind === 'scenario' && run.id === HISTORY_IDS.salesManagerOnboarding
                      const isProbationEvalScenarioRow =
                        run.kind === 'scenario' && run.id === HISTORY_IDS.seniorRdOnboarding
                      const isIdentityVerificationScenarioRow =
                        run.kind === 'scenario' && run.id === HISTORY_IDS.identityVerification
                      const isCrossDeptProjectScenarioRow =
                        run.kind === 'scenario' && run.id === HISTORY_IDS.opsManagerOnboarding
                      const isJuniorOpsOnboardingScenarioRow =
                        run.kind === 'scenario' && run.id === HISTORY_IDS.juniorOpsOnboarding
                      const isOnboardingAssistantAgentRow =
                        run.kind === 'agent' && run.id === HISTORY_IDS.onboardingAssistantAgent
                      const isChatHistoryRow = run.kind === 'chat' && hasRunHistoryChatSnapshot(run.id)
                      const isRunRowClickable =
                        isOnboardingScenarioRow ||
                        isJinnyOnboardingScenarioRow ||
                        isProbationEvalScenarioRow ||
                        isIdentityVerificationScenarioRow ||
                        isCrossDeptProjectScenarioRow ||
                        isJuniorOpsOnboardingScenarioRow ||
                        isChatHistoryRow ||
                        isOnboardingAssistantAgentRow
                      const showStatusDot =
                        run.kind === 'scenario' &&
                        run.status != null &&
                        !(runKindFilterMenuOpen && rowIndex === 0)
                      const statusClass =
                        run.status === 'warning'
                          ? 'manus-run-status is-warn'
                          : run.status === 'error'
                            ? 'manus-run-status is-error'
                            : 'manus-run-status is-ok'
                      const statusAria = getRunHistoryStatusAria(run.status, locale)
                      return (
                        <div
                          key={listKey}
                          className={[
                            'manus-run',
                            nestedUnderOnboarding || nestedUnderAgentChat
                              ? 'manus-run--onboarding-subflow'
                              : '',
                            nestedUnderAgentChat ? 'manus-run--agent-sub' : '',
                            isRunRowClickable ? 'manus-run--clickable' : '',
                            selectedRunHistoryId === run.id ? 'is-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role="listitem"
                          tabIndex={isRunRowClickable ? 0 : undefined}
                          aria-label={
                            isRunRowClickable
                              ? getRunHistoryRowAriaLabel(run, locale, {
                                  nestedUnderAgentChat,
                                  nestedUnderOnboarding,
                                  parentAgentId: run.linkedAgentId,
                                  parentAgentFallbackName: row.parentAgentLabel,
                                })
                              : undefined
                          }
                          aria-current={selectedRunHistoryId === run.id ? 'true' : undefined}
                          onClick={
                            isRunRowClickable
                              ? () =>
                                  handleRunHistoryRowActivate(run, {
                                    nestedUnderOnboarding: nestedUnderOnboarding === true,
                                  })
                              : undefined
                          }
                          onKeyDown={
                            isRunRowClickable
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleRunHistoryRowActivate(run, {
                                      nestedUnderOnboarding: nestedUnderOnboarding === true,
                                    })
                                  }
                                }
                              : undefined
                          }
                        >
                          <div className="manus-run-main">
                            {runKindFilterMenuOpen && !nestedUnderAgentChat ? (
                              <span className="manus-run-kind-icon">
                                <RunHistoryRowKindIcon kind={run.kind} />
                              </span>
                            ) : null}
                            <div className="manus-run-name">{run.name}</div>
                          </div>
                          {showStatusDot ? (
                            <span className={statusClass} aria-label={statusAria} title={statusAria} />
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="manus-sidebar-user" aria-label={t('userInfo')}>
          <button
            ref={manusUserBtnRef}
            className={`manus-user${userAccountMenuOpen ? ' is-menu-open' : ''}`}
            type="button"
            aria-label={t('openUserInfo')}
            aria-expanded={userAccountMenuOpen}
            aria-haspopup="dialog"
            aria-controls={userAccountMenuId}
            onClick={() => setUserAccountMenuOpen((v) => !v)}
          >
            <span className="manus-user-avatar" aria-hidden="true">
              m
            </span>
            <span className="manus-user-meta">
              <span className="manus-user-name">{roleLabel}</span>
              <span className="manus-user-sub">{email || t('sidebarUserName')}</span>
            </span>
          </button>
        </div>
      </aside>

      <div className={`manus-main${activePage === 'home' ? ' manus-main--home' : ''}`}>
        {activePage === 'home' && showHomePendingIcon ? (
          <div className="home-page-float-icon-wrap">
            <button
              ref={homePendingIconRef}
              type="button"
              className={`home-page-float-icon${homePendingPopoverOpen ? ' is-active' : ''}`}
              aria-label={t('homePendingApprovalIconAria')}
              aria-expanded={homePendingPopoverOpen}
              onClick={() => setHomePendingPopoverOpen((open) => !open)}
            >
              <svg viewBox="0 0 1024 1024" width="22" height="22" focusable="false" aria-hidden="true">
                <path
                  d="M416.512 128c18.24 0 35.648 7.232 48.512 20.096L539.136 222.08c12.8 12.928 30.336 20.16 48.512 20.16h200.192a68.544 68.544 0 0 1 68.544 68.544v525.696a68.544 68.544 0 0 1-68.544 68.608H239.232a68.544 68.544 0 0 1-68.544-68.608v-640C170.688 158.72 201.408 128 239.232 128h177.28z m0 68.544h-177.28v640h548.608V310.848H587.648c-34.176 0-67.072-12.736-92.352-35.712l-4.608-4.48-74.176-74.112z m-40.128 434.304v68.608H307.84V630.848H376.32z m342.848 0v68.608H422.08V630.848h297.152zM376.384 448v68.544H307.84V448H376.32z m342.848 0v68.544H422.08V448h297.152z"
                  fill="currentColor"
                />
              </svg>
              {homePendingBadgeCount > 0 ? (
                <span className="home-page-float-icon-badge" aria-hidden="true">
                  {homePendingBadgeCount}
                </span>
              ) : null}
            </button>
            <HomePendingApprovalPopover
              locale={locale}
              open={homePendingPopoverOpen}
              onClose={() => setHomePendingPopoverOpen(false)}
              onboardingItems={isUserRole ? userPendingOnboarding : []}
              approvalTasks={isUserRole ? [] : managerPendingApprovalTasks}
              anchorRef={homePendingIconRef}
              onNavigateToInbox={navigateToProjectSpaceInbox}
              onNavigateToTask={isUserRole ? undefined : navigateToProjectSpaceTask}
              onNavigateToRecruitJdReview={isUserRole ? undefined : navigateToProjectSpaceRecruitJdReview}
              onConfirmCandidate={isUserRole ? handleHomeConfirmOnboardingCandidate : undefined}
            />
          </div>
        ) : null}
        {activePage === 'home' && buildSession ? (
          <HomeSessionView
            key={buildSession.messages[0]?.id ?? 'session'}
            mode={mode}
            messages={buildSession.messages}
            buildAiInput={buildAiInput}
            setBuildAiInput={setBuildAiInput}
            onSend={handleBuildAiSend}
            onBack={goHomeLanding}
            sessionComposerInputRef={sessionComposerInputRef}
            planFlowTurn={planFlowTurn}
            onQuickReply={
              isUserRole && userRecruitJdTurn === 'awaitConfirm'
                ? handleUserRecruitJdQuickReply
                : !isUserRole &&
                    (mode === 'plan' || mode === 'build') &&
                    planFlowTurn &&
                    planFlowTurn !== 'done'
                  ? handlePlanQuickReply
                  : undefined
            }
            inputPlaceholder={
              isUserRole ? t('userChatPlaceholder') : '您可以提问任何问题，输入 @ 可以提及并使用任何资源'
            }
            chatOnly={isUserRole}
            onUserRecruitContextClick={showUserRecruitContextTag ? fillSessionComposerRecruitContext : undefined}
            composerVoiceListening={composerVoiceListening}
            onComposerVoiceClick={handleComposerVoiceClick}
            planAgentBlueprint={
              !isUserRole && (mode === 'plan' || mode === 'build') && planConversationKind === 'agent'
                ? planAgentBlueprint
                : null
            }
            planWorkflowBlueprint={
              !isUserRole && (mode === 'plan' || mode === 'build') && planConversationKind === 'workflow'
                ? planWorkflowBlueprint
                : null
            }
            onPlanBlueprintNameChange={handlePlanBlueprintNameChange}
            onPlanBlueprintRoleChange={handlePlanBlueprintRoleChange}
            onPlanBlueprintRolePromptChange={handlePlanBlueprintRolePromptChange}
            onPlanBlueprintCreate={handlePlanBlueprintCreateClick}
            showPlanAgentCreationSequence={!isUserRole && planAgentCreationVisible}
            onPlanAgentCreationComplete={handlePlanAgentCreationSequenceComplete}
            sessionComposerLocked={planSessionTraceComposerLocked}
            onBuildIntroTraceVanish={handleBuildIntroTraceVanish}
            buildIntroTraceTypingMs={BUILD_ONBOARD_TRACE_TYPE_MS}
            onWorkflowPlannerTraceVanish={handleWorkflowPlannerTraceVanish}
            workflowPlannerTraceTypingMs={WORKFLOW_PLANNER_TRACE_TYPING_MS}
            selectedRunHistoryId={selectedRunHistoryId}
          />
        ) : activePage === 'home' ? (
          <section className="manus-center" aria-label={t('content')}>
            <h1 className="manus-title">{t('homeTitle')}</h1>
            <p className="manus-title-en" lang="en">
              {t('homeSubtitle')}
            </p>

            <div className="composer">
              {!isUserRole ? (
              <div className="composer-mode-tabs" role="group" aria-label={t('modeQuickSwitch')}>
                {HOME_LANDING_PLAN_MODE_VISIBLE ? (
                  <button
                    type="button"
                    className={`composer-mode-tab composer-mode-tab--plan${mode === 'plan' ? ' is-active' : ''}`}
                    aria-pressed={mode === 'plan'}
                    onClick={() => setMode('plan')}
                  >
                    <span className="composer-mode-tab-ic" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <path
                          d="M4.5 7.5 12 3l7.5 4.5V16.5L12 21 4.5 16.5V7.5Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4.5 7.5 12 12l7.5-4.5M12 12v9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Plan Mode</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`composer-mode-tab composer-mode-tab--build${mode === 'build' ? ' is-active' : ''}`}
                  aria-pressed={mode === 'build'}
                  onClick={() => setMode('build')}
                >
                  <span className="composer-mode-tab-ic" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="15" height="15">
                      <path
                        d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.5 7 17 10.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>Build Mode</span>
                </button>
              </div>
              ) : null}
              <div className={`composer-surface${isUserRole ? ' composer-surface--solo' : ''}`}>
                <label className="sr-only" htmlFor="composer-input">
                  {isUserRole ? t('userChatInput') : t('enterTask')}
                </label>
                <div className="composer-input-wrap">
                  <textarea
                    ref={composerInputRef}
                    id="composer-input"
                    className="composer-input"
                    placeholder={isUserRole ? t('userChatPlaceholder') : t('composerPlaceholder')}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        if (isComposerActive) handleBuildComposerSend()
                      }
                    }}
                    rows={3}
                    aria-label={
                      isUserRole
                        ? t('userChatInput')
                        : mode === 'plan'
                          ? t('planModeInput')
                          : t('buildModeInput')
                    }
                  />
                  <button
                    className="composer-send"
                    type="button"
                    aria-label={t('send')}
                    title={t('send')}
                    disabled={!isComposerActive}
                    onClick={() => {
                      if (isComposerActive) handleBuildComposerSend()
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M12 19V6M7 10l5-5 5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    className={`composer-voice${composerVoiceListening ? ' composer-voice--listening' : ''}`}
                    type="button"
                    aria-label={composerVoiceListening ? t('stopVoiceInput') : t('voiceInput')}
                    aria-pressed={composerVoiceListening}
                    title={composerVoiceListening ? t('voiceInputStopTitle') : t('voiceInputStartTitle')}
                    onClick={handleComposerVoiceClick}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 11a7 7 0 0 1-14 0M12 18v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {showUserRecruitContextTag ? (
              <div className="manus-center-onboard">
                <div className="manus-home-session-onboard-actions">
                  <button
                    type="button"
                    className="manus-home-session-onboard-pill home-user-context-tag"
                    onClick={fillLandingComposerRecruitContext}
                  >
                    {t('userRecruitContextTag')}
                  </button>
                </div>
              </div>
            ) : !isUserRole ? (
            <div className="manus-center-onboard">
              <HomeOnboardingShortcuts
                onMulti={fillLandingComposerOnboardAgent}
                onSingle={handleLandingOnboardWorkflowShortcut}
              />
            </div>
            ) : null}
          </section>
        ) : activePage === 'experience' ? (
          <ExperienceHubPage
            key={experiencePageEntryKey}
            agents={agents}
            onboardingTrigger={experienceOnboardingTrigger}
          />
        ) : activePage === 'app-market' ? (
          <JoyceAiPanel sectionAriaLabel={t('navAppMarket')}>
            <AppMarketPage
              installedIds={installedMarketItemIds}
              onMarkInstalled={handleMarkMarketItemInstalled}
              onToolInstallStart={handleToolInstallStart}
              onToolInstallComplete={handleToolInstallComplete}
              onTemplateApplied={handleMarketTemplateApplied}
              importedItems={importedMarketItems}
              onImportedItemsChange={setImportedMarketItems}
              entryRequest={appMarketEntryRequest}
              onEntryRequestConsumed={() => setAppMarketEntryRequest(null)}
              onEmployeeOnboardingGuideTemplateApplied={handleEmployeeOnboardingGuideTemplateApplied}
            />
          </JoyceAiPanel>
        ) : activePage === 'knowledge-base' ? (
          <JoyceAiPanel sectionAriaLabel={t('sectionKnowledgeBase')}>
            <KnowledgeBasePage />
          </JoyceAiPanel>
        ) : activePage === 'team-collaboration-space' ? (
          <JoyceAiPanel sectionAriaLabel={t('sectionTeamCollaborationSpace')}>
            <TeamCollaborationSpacePage />
          </JoyceAiPanel>
        ) : activePage === 'access-control' ? (
          <AccessControlPage
            key={
              typeof window !== 'undefined'
                ? window.location.pathname
                : '/access-control'
            }
          />
        ) : activePage === 'skills' ? (
          <SkillsPage
            skills={workspaceSkills}
            onSkillsChange={setWorkspaceSkills}
            installedSkillTemplates={installedSkillTemplates}
            onBrowseLibrary={handleOpenAppMarketSkillsAnchor}
          />
        ) : (
          <JoyceAiPanel
            sectionAriaLabel={
              activePage === 'analytics'
                ? t('sectionAnalytics')
                : activePage === 'tools'
                  ? t('sectionTools')
                : activePage === 'agent-library'
                  ? t('sectionAgents')
                  : t('sectionScenarios')
            }
          >
            {activePage === 'agent-library' ? (
              <AgentLibraryPage
                agents={agents}
                setAgents={setAgents}
                skillOptions={skillDropdownOptions}
                toolDirectoryItems={toolDirectoryItems}
                planWorkflowEntryKey={planWorkflowEntryKey}
                onPlanWorkflowEntryConsumed={handlePlanWorkflowEntryConsumed}
                onStartPlanCreationFromWorkflowLibrary={handleStartPlanCreationFromWorkflowLibrary}
                onTestRunRecorded={handleTestRunHistoryRecord}
                agentRunTestResume={agentRunTestResume}
                onAgentRunTestResumeConsumed={clearAgentRunTestResume}
                libraryOpenSingleAgentRequest={libraryOpenSingleAgentRequest}
                onLibraryOpenSingleAgentConsumed={() => setLibraryOpenSingleAgentRequest(null)}
                agentLibraryCardAction={agentLibraryCardAction}
                onAgentLibraryCardActionConsumed={() => setAgentLibraryCardAction(null)}
                marketAgentTemplateApplyRequest={marketAgentTemplateApplyRequest}
                onMarketAgentTemplateApplyConsumed={() => setMarketAgentTemplateApplyRequest(null)}
              />
            ) : activePage === 'scenarios' ? (
              <ScenarioConfigPage
                agents={agents}
                setAgents={setAgents}
                marketScenarioBlueprints={marketScenarioBlueprints}
                openScenarioRequest={scenarioOpenDeepLink}
                onOpenScenarioRequestConsumed={clearScenarioOpenDeepLink}
                scenarioCardAction={scenarioCardAction}
                onScenarioCardActionConsumed={() => setScenarioCardAction(null)}
                onExperienceOnboardingTriggerChange={setExperienceOnboardingTrigger}
                onTestRunRecorded={handleTestRunHistoryRecord}
                runsTestPersistEntryId={activeRunsTestPersistEntryId}
                runsTestRestoreRequest={runsTestRestoreRequest}
                getRunsTestSnapshot={getRunsTestSnapshot}
                onRunsTestSnapshotChange={handleRunsTestSnapshotChange}
                onRunsTestRestoreConsumed={clearRunsTestRestoreRequest}
              />
            ) : activePage === 'tools' ? (
              <ToolsDirectoryPage
                items={toolDirectoryItems}
                onItemsChange={setToolDirectoryItems}
                onOpenToolTemplates={handleOpenAppMarketToolsAnchor}
              />
            ) : (
              <AnalyticsPage />
            )}
          </JoyceAiPanel>
        )}
      </div>
    </div>
    {isToolInstallTransitioning ? (
      <div
        className="manus-global-loading-overlay"
        role="status"
        aria-live="polite"
        aria-label={locale === 'zh' ? '正在安装工具' : 'Installing tool'}
      >
        <div className="manus-global-loading-card">
          <span className="scenario-workflow-run-loading-spinner" aria-hidden="true" />
          <strong>{locale === 'zh' ? '正在安装工具' : 'Installing tool'}</strong>
          <p>{locale === 'zh' ? '正在为你添加到工具列表并切换页面...' : 'Adding it to your tools and switching pages...'}</p>
        </div>
      </div>
    ) : null}
    {userAccountMenuOpen
      ? createPortal(
          <div
            id={userAccountMenuId}
            ref={manusUserMenuRef}
            className="manus-user-menu"
            role="dialog"
            aria-label={t('accountMenu')}
            style={{
              position: 'fixed',
              left: userAccountMenuLayout.left,
              top: userAccountMenuLayout.top,
              width: userAccountMenuLayout.width,
              zIndex: 10060,
            }}
          >
            <div className="manus-user-menu-head">
              <div className="manus-user-menu-head-name">{t('admin')}</div>
              <div className="manus-user-menu-head-sub">admin@gamil.com</div>
            </div>
            <div className="manus-user-menu-divider" role="separator" />
            <div className="manus-user-menu-toggle-row manus-user-menu-toggle-row--disabled">
              <span className="manus-user-menu-toggle-label" id={`${userAccountMenuId}-dark-label`}>
                {t('darkMode')}
              </span>
              <button
                type="button"
                className="manus-user-menu-switch"
                role="switch"
                aria-checked={false}
                aria-disabled="true"
                disabled
                aria-labelledby={`${userAccountMenuId}-dark-label`}
                title={t('darkModeUnavailable')}
              >
                <span className="manus-user-menu-switch-thumb" />
              </button>
            </div>
            <div className="manus-user-menu-toggle-row">
              <span className="manus-user-menu-toggle-label" id={`${userAccountMenuId}-lang-label`}>
                {t('language')}
              </span>
              <div
                className="manus-user-menu-lang-toggle"
                role="group"
                aria-labelledby={`${userAccountMenuId}-lang-label`}
              >
                <button
                  type="button"
                  className={`manus-user-menu-lang-option${locale === 'zh' ? ' is-active' : ''}`}
                  aria-pressed={locale === 'zh'}
                  onClick={() => setLocale('zh')}
                >
                  中文
                </button>
                <button
                  type="button"
                  className={`manus-user-menu-lang-option${locale === 'en' ? ' is-active' : ''}`}
                  aria-pressed={locale === 'en'}
                  onClick={() => setLocale('en')}
                >
                  EN
                </button>
              </div>
            </div>
            <div className="manus-user-menu-divider" role="separator" />
            <ul className="manus-user-menu-actions" role="menu">
              <li role="none">
                <button type="button" className="manus-user-menu-item" role="menuitem">
                  <span className="manus-user-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path
                        d="M8 4h10v12H8V4Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 8H4v12h12v-2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 8h4M14 12h4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>{t('export')}</span>
                </button>
              </li>
              <li role="none">
                <button type="button" className="manus-user-menu-item" role="menuitem">
                  <span className="manus-user-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path
                        d="M8 4h10v12H8V4Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 8H4v12h12v-2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 9v6M9.5 12.5 12 9l2.5 3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>{t('import')}</span>
                </button>
              </li>
              <li role="none">
                <button type="button" className="manus-user-menu-item" role="menuitem">
                  <span className="manus-user-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
                      <path
                        d="M12 10v5M12 8.2v.01"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>{t('versionInfo')}</span>
                </button>
              </li>
              <li role="none">
                <button type="button" className="manus-user-menu-item" role="menuitem">
                  <span className="manus-user-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
                      <path
                        d="M6.5 20.5v-1A5.5 5.5 0 0 1 12 14a5.5 5.5 0 0 1 5.5 5.5v1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>{t('accountSettings')}</span>
                </button>
              </li>
              {role === 'admin' ? (
                <li role="none">
                  <button
                    type="button"
                    className="manus-user-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setUserAccountMenuOpen(false)
                      openAccessControlSection('work-log')
                    }}
                  >
                    <span className="manus-user-menu-item-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
                        <path
                          d="M12 7v5l3 2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 19h16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span>{t('workLog')}</span>
                  </button>
                </li>
              ) : null}
              <li role="none">
                <button
                  type="button"
                  className="manus-user-menu-item manus-user-menu-item--danger"
                  role="menuitem"
                  onClick={() => {
                    setUserAccountMenuOpen(false)
                    onLogout?.()
                  }}
                >
                  <span className="manus-user-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path
                        d="M14 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M11 12h8M16 9l3 3-3 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>{t('signOut')}</span>
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )
      : null}

      <PlanAgentCreateModal
        open={planAgentCreateModalOpen}
        entityTitle={planAgentCreateModalTitle}
        onViewNow={handlePlanCreateModalViewNow}
        onDismiss={handlePlanCreateModalDismiss}
        onContinueCreate={goHomeLanding}
      />
    </>
  )
}
