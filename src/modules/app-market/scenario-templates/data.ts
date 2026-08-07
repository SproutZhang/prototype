import type { AppMarketItem } from '../shared/types'

/** 应用市场场景模板：点击「使用模板」后跳转至场景配置「新员工入职」工作区 */
export const EMPLOYEE_ONBOARDING_GUIDE_SCENARIO_TEMPLATE_ID = 'employee-onboarding-guide'

/** HR 审批协同场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const HR_APPROVAL_COORDINATION_SCENARIO_TEMPLATE_ID = 'hr-approval-coordination'

/** Google 商家自动化助手场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const GOOGLE_BUSINESS_AUTOMATION_SCENARIO_TEMPLATE_ID = 'google-business-automation'

/** Slack 一对一谈话要点生成器场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const SLACK_1ON1_TALK_POINTS_SCENARIO_TEMPLATE_ID = 'slack-1on1-talk-points'

/** 客户投诉分析助手场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const CUSTOMER_COMPLAINT_ANALYSIS_SCENARIO_TEMPLATE_ID = 'customer-complaint-analysis'

/** 爆款内容创作代理场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const VIRAL_CONTENT_CREATION_SCENARIO_TEMPLATE_ID = 'viral-content-creation'

/** Notion 知识同步助手场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const NOTION_KNOWLEDGE_SYNC_SCENARIO_TEMPLATE_ID = 'notion-knowledge-sync'

/** Zendesk 工单摘要代理场景模板（弹窗内隐藏 Agent 来源 new / 原有 标签） */
export const ZENDESK_TICKET_SUMMARY_SCENARIO_TEMPLATE_ID = 'zendesk-ticket-summary'

export const SCENARIO_TEMPLATE_CATALOG: AppMarketItem[] = [
  {
    id: 'employee-onboarding-guide',
    nameZh: '新员工入职引导场景',
    nameEn: 'Employee Onboarding Guide Scenario',
    descriptionZh: '覆盖资料提交、账号开通、培训安排与进度跟踪的完整入职场景模板。',
    modalDescriptionZh:
      '对新员工入职全流程进行结构化引导——从欢迎通知、材料收集、审批协同到账号开通、培训安排与进度跟踪——并输出可执行的入职任务清单与跟进计划。',
    descriptionEn:
      'End-to-end onboarding scenario covering document intake, account provisioning, training, and progress tracking.',
    modalDescriptionEn:
      'Guide the full new-hire journey—from welcome notices and document collection through approvals, account setup, training, and progress tracking—and produce actionable onboarding task lists and follow-up plans.',
    productLine: 'scenario-templates',
    templateCategory: 'hr-recruitment',
    publisher: 'Studio X',
    installs: '1.8k',
    rating: 4.9,
    badge: 'featured',
    iconFrom: '#7f7cff',
    iconTo: '#5b7cff',
    tagsZh: ['人力资源', '入职办理', '培训管理', '员工体验', 'HR'],
    tagsEn: ['Human Resources', 'Onboarding', 'Training', 'Employee Experience', 'HR'],
    workflowSteps: [
      {
        id: 'wf-step-1',
        titleZh: '创建入职项目与计划',
        titleEn: 'Create onboarding project and plan',
      },
      {
        id: 'wf-step-send-welcome',
        titleZh: '准备并发送欢迎邮件',
        titleEn: 'Prepare and send welcome email',
      },
      {
        id: 'wf-step-2',
        titleZh: '配置IT设备和账户',
        titleEn: 'Configure IT equipment and accounts',
      },
      {
        id: 'wf-step-3',
        titleZh: '制定个性化培训计划',
        titleEn: 'Develop personalized training plan',
      },
      {
        id: 'wf-step-4',
        titleZh: '监督验证整个流程',
        titleEn: 'Supervise and validate the entire process',
      },
    ],
  },
  {
    id: 'hr-approval-coordination',
    nameZh: 'HR 审批协同场景',
    nameEn: 'HR Approval Coordination Scenario',
    descriptionZh: '串联材料审核、合同确认与跨部门审批节点的 HR 协同场景模板。',
    modalDescriptionZh:
      '将 HR 侧材料收集、多角色审批路由、合同会签到结果通知与归档串联为可追踪流程，降低缺件反复与审批超时风险。',
    descriptionEn:
      'HR coordination scenario linking document review, contract confirmation, and cross-team approval steps.',
    modalDescriptionEn:
      'Chain document intake, multi-role approval routing, contract sign-off, and closure notifications into a traceable HR workflow that cuts rework and SLA misses.',
    productLine: 'scenario-templates',
    templateCategory: 'hr-recruitment',
    publisher: 'Studio X',
    installs: '960',
    rating: 4.7,
    iconFrom: '#ffd36a',
    iconTo: '#ff7b72',
    tagsZh: ['人力资源', '审批协同', '合同管理', '合规', 'HR'],
    tagsEn: ['Human Resources', 'Approvals', 'Contracts', 'Compliance', 'HR'],
    workflowSteps: [
      { id: 'hr-wf-materials', titleZh: '收集与核对入职材料', titleEn: 'Collect and verify onboarding documents' },
      { id: 'hr-wf-routing', titleZh: '路由多角色审批', titleEn: 'Route multi-role approvals' },
      { id: 'hr-wf-contract', titleZh: '合同比对与会签', titleEn: 'Contract review and sign-off' },
      { id: 'hr-wf-close', titleZh: '结果通知与归档', titleEn: 'Notify outcomes and archive' },
    ],
  },
  {
    id: 'google-business-automation',
    nameZh: 'Google 商家自动化助手',
    nameEn: 'Google Business Automation Assistant',
    descriptionZh: '自动同步商家资料、回复评价并生成运营日报的场景模板。',
    modalDescriptionZh:
      '自动化维护 Google 商家档案、评价回复与运营日报，并在异常波动时及时通知值班运营，形成「同步—互动—分析—告警」闭环。',
    descriptionEn:
      'Scenario template for syncing business profiles, replying to reviews, and generating daily ops reports.',
    modalDescriptionEn:
      'Automate Google Business Profile upkeep, review replies, and daily ops reports—with alerts when metrics spike—covering sync, engagement, analytics, and escalation.',
    productLine: 'scenario-templates',
    templateCategory: 'marketing',
    publisher: 'Growth Lab',
    installs: '720',
    rating: 4.6,
    iconFrom: '#34d399',
    iconTo: '#059669',
    tagsZh: ['本地生活', '商家运营', '评价管理', '增长', '自动化'],
    tagsEn: ['Local Business', 'Operations', 'Reviews', 'Growth', 'Automation'],
    workflowSteps: [
      { id: 'gb-wf-profile', titleZh: '同步商家资料', titleEn: 'Sync business profile' },
      { id: 'gb-wf-reviews', titleZh: '回复与管理评价', titleEn: 'Reply to and manage reviews' },
      { id: 'gb-wf-report', titleZh: '生成运营日报', titleEn: 'Generate daily ops report' },
      { id: 'gb-wf-alert', titleZh: '异常监测与分派', titleEn: 'Monitor anomalies and assign follow-ups' },
    ],
  },
  {
    id: 'slack-1on1-talk-points',
    nameZh: 'Slack 一对一谈话要点生成器',
    nameEn: 'Slack 1:1 Talk Points Generator',
    descriptionZh: '基于近期工作与反馈，自动生成经理一对一谈话提纲的场景模板。',
    modalDescriptionZh:
      '从 Slack 与协作工具拉取近期工作事实与反馈要点，生成结构化 1:1 谈话提纲，并在会前提醒与会后行动项跟进中保持节奏。',
    descriptionEn:
      'Scenario template that drafts manager 1:1 agendas from recent work updates and feedback.',
    modalDescriptionEn:
      'Pull recent work and feedback from Slack and collaboration tools, draft structured 1:1 agendas, and keep momentum with pre-meeting reminders and post-meeting action follow-ups.',
    productLine: 'scenario-templates',
    templateCategory: 'productivity',
    publisher: 'People Ops',
    installs: '540',
    rating: 4.5,
    badge: 'new',
    iconFrom: '#a78bfa',
    iconTo: '#7c3aed',
    tagsZh: ['People', '一对一', '经理辅导', 'Slack', '生产力'],
    tagsEn: ['People Ops', '1:1 Meetings', 'Manager Coaching', 'Slack', 'Productivity'],
    workflowSteps: [
      { id: 'slack-wf-context', titleZh: '汇总近期工作上下文', titleEn: 'Summarize recent work context' },
      { id: 'slack-wf-feedback', titleZh: '整合反馈要点', titleEn: 'Consolidate feedback highlights' },
      { id: 'slack-wf-agenda', titleZh: '生成谈话提纲', titleEn: 'Generate talk agenda' },
      { id: 'slack-wf-followup', titleZh: '会前提醒与行动跟进', titleEn: 'Pre-meeting reminders and action follow-up' },
    ],
  },
  {
    id: 'customer-complaint-analysis',
    nameZh: '客户投诉分析助手',
    nameEn: 'Customer Complaint Analysis Assistant',
    descriptionZh: '汇总投诉工单、识别根因并输出改进建议的场景模板。',
    modalDescriptionZh:
      '聚合投诉工单、进行主题与根因分析，输出可排期的改进建议并跟踪闭环，用数据验证投诉趋势是否好转。',
    descriptionEn:
      'Scenario template for aggregating complaint tickets, surfacing root causes, and suggesting fixes.',
    modalDescriptionEn:
      'Aggregate complaint tickets, analyze themes and root causes, propose schedulable improvements, and track closure with data that proves trends are improving.',
    productLine: 'scenario-templates',
    templateCategory: 'customer-support',
    publisher: 'CX Studio',
    installs: '680',
    rating: 4.4,
    iconFrom: '#fb7185',
    iconTo: '#e11d48',
    tagsZh: ['客户体验', '投诉分析', '根因', '改进跟踪', '客服'],
    tagsEn: ['Customer Experience', 'Complaints', 'Root Cause', 'Improvement Tracking', 'Support'],
    workflowSteps: [
      { id: 'cx-wf-aggregate', titleZh: '聚合投诉工单', titleEn: 'Aggregate complaint tickets' },
      { id: 'cx-wf-rootcause', titleZh: '根因与主题分析', titleEn: 'Root cause and theme analysis' },
      { id: 'cx-wf-improve', titleZh: '输出改进建议', titleEn: 'Propose improvements' },
      { id: 'cx-wf-close', titleZh: '跟踪闭环与复盘', titleEn: 'Track closure and review' },
    ],
  },
  {
    id: 'viral-content-creation',
    nameZh: '爆款内容创作代理',
    nameEn: 'Viral Content Creation Agent',
    descriptionZh: '从选题、脚本到多渠道分发的内容创作场景模板。',
    modalDescriptionZh:
      '覆盖选题研究、脚本撰写、素材制作到多渠道排期分发，并在发布后回收数据指导下一轮创作，形成内容增长闭环。',
    descriptionEn:
      'Content creation scenario from topic ideation and scripting through multi-channel distribution.',
    modalDescriptionEn:
      'Span topic research, scripting, asset production, and multi-channel scheduling—with post-publish metrics feeding the next creative cycle.',
    productLine: 'scenario-templates',
    templateCategory: 'marketing',
    publisher: 'Content Forge',
    installs: '890',
    rating: 4.6,
    iconFrom: '#f472b6',
    iconTo: '#db2777',
    tagsZh: ['内容营销', '短视频', '选题', '分发', '增长'],
    tagsEn: ['Content Marketing', 'Short Video', 'Ideation', 'Distribution', 'Growth'],
    workflowSteps: [
      { id: 'content-wf-ideation', titleZh: '选题研究与评分', titleEn: 'Topic research and scoring' },
      { id: 'content-wf-script', titleZh: '脚本撰写与审批', titleEn: 'Script writing and approval' },
      { id: 'content-wf-assets', titleZh: '素材制作与评审', titleEn: 'Asset production and review' },
      { id: 'content-wf-distribute', titleZh: '多渠道排期分发', titleEn: 'Multi-channel scheduling' },
    ],
  },
  {
    id: 'notion-knowledge-sync',
    nameZh: 'Notion 知识同步助手',
    nameEn: 'Notion Knowledge Sync Assistant',
    descriptionZh: '将会议纪要与文档变更同步到 Notion 知识库的场景模板。',
    modalDescriptionZh:
      '自动抓取会议纪要与企业文档变更，幂等写入 Notion 知识库，并在冲突与权限异常时保留人工裁决入口。',
    descriptionEn:
      'Scenario template for syncing meeting notes and document updates into Notion knowledge bases.',
    modalDescriptionEn:
      'Capture meeting notes and document changes, idempotently sync them into Notion, and keep human review paths for conflicts and permission issues.',
    productLine: 'scenario-templates',
    templateCategory: 'productivity',
    publisher: 'Knowledge Hub',
    installs: '610',
    rating: 4.5,
    iconFrom: '#38bdf8',
    iconTo: '#0284c7',
    tagsZh: ['知识管理', 'Notion', '会议纪要', '文档同步', '协作'],
    tagsEn: ['Knowledge Management', 'Notion', 'Meeting Notes', 'Doc Sync', 'Collaboration'],
    workflowSteps: [
      { id: 'notion-wf-meetings', titleZh: '抓取会议纪要', titleEn: 'Capture meeting notes' },
      { id: 'notion-wf-docs', titleZh: '解析文档变更', titleEn: 'Parse document changes' },
      { id: 'notion-wf-sync', titleZh: '同步至 Notion', titleEn: 'Sync to Notion' },
      { id: 'notion-wf-conflict', titleZh: '冲突处理与健康度', titleEn: 'Resolve conflicts and report health' },
    ],
  },
  {
    id: 'zendesk-ticket-summary',
    nameZh: 'Zendesk 工单摘要代理',
    nameEn: 'Zendesk Ticket Summary Agent',
    descriptionZh: '自动归纳工单上下文、历史往来与待办动作的场景模板。',
    modalDescriptionZh:
      '在客服打开工单前快速汇总上下文、往来时间线与待办动作，并生成可复制的处理摘要与回复要点，提升首次响应与交接效率。',
    descriptionEn:
      'Scenario template for summarizing ticket context, conversation history, and next actions.',
    modalDescriptionEn:
      'Before agents open a ticket, summarize context, conversation timelines, and next actions—plus copy-ready reply hints—to improve first response and handoffs.',
    productLine: 'scenario-templates',
    templateCategory: 'customer-support',
    publisher: 'Support AI',
    installs: '770',
    rating: 4.7,
    iconFrom: '#fbbf24',
    iconTo: '#d97706',
    tagsZh: ['客服', 'Zendesk', '工单摘要', 'SLA', '支持效率'],
    tagsEn: ['Support', 'Zendesk', 'Ticket Summary', 'SLA', 'Efficiency'],
    workflowSteps: [
      { id: 'zd-wf-context', titleZh: '读取工单上下文', titleEn: 'Load ticket context' },
      { id: 'zd-wf-history', titleZh: '归纳历史往来', titleEn: 'Summarize conversation history' },
      { id: 'zd-wf-actions', titleZh: '提取待办动作', titleEn: 'Extract next actions' },
      { id: 'zd-wf-summary', titleZh: '生成处理摘要', titleEn: 'Generate handling summary' },
    ],
  },
]

export function findScenarioTemplateById(id: string): AppMarketItem | undefined {
  return SCENARIO_TEMPLATE_CATALOG.find((item) => item.id === id)
}
