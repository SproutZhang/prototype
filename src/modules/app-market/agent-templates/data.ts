import type { AppMarketItem, AppMarketTemplateSubAgent } from '../shared/types'

const EMPLOYEE_SELF_ONBOARD_SUB_AGENTS: AppMarketTemplateSubAgent[] = [
  {
    id: 'doc-submit',
    nameZh: '资料提交子代理',
    nameEn: 'Document Submission Sub-agent',
    promptZh:
      '您是资料提交子代理，负责引导新员工提交个人信息、证件材料、合同资料与紧急联系人信息。请逐步说明每项材料的要求、格式与截止时间，并核对是否齐全；缺失项需明确列出并给出补交指引。',
    promptEn:
      'You are the Document Submission sub-agent. Guide new hires to submit personal information, ID documents, contract materials, and emergency contacts. Explain requirements, formats, and deadlines step by step; flag missing items and provide clear resubmission instructions.',
    pluginToolsZh: ['Google Workspace 连接器', 'Google Drive', '入职办理引导技能'],
    pluginToolsEn: ['Google Workspace Bridge', 'Google Drive', 'Onboarding Guide Skill'],
  },
  {
    id: 'form-fill',
    nameZh: '表单填写子代理',
    nameEn: 'Form Completion Sub-agent',
    promptZh:
      '您是表单填写子代理，负责生成并协助完成入职相关表单。请检查必填项、附件上传与电子签署状态是否完整，对未完成字段给出具体填写建议，并避免员工重复提交已生效内容。',
    promptEn:
      'You are the Form Completion sub-agent. Help generate and complete onboarding forms. Verify required fields, attachments, and e-signature status; give specific guidance for incomplete fields and prevent duplicate submissions of accepted data.',
    pluginToolsZh: ['人工审批节点工具', 'Google Workspace 连接器', '入职办理引导技能'],
    pluginToolsEn: ['HITL Approval Step', 'Google Workspace Bridge', 'Onboarding Guide Skill'],
  },
  {
    id: 'it-provision',
    nameZh: 'IT 开通子代理',
    nameEn: 'IT Provisioning Sub-agent',
    promptZh:
      '您是 IT 开通子代理，负责协调邮箱、OA、VPN、办公软件、权限系统与设备确认。请根据岗位与部门说明预计开通时间与依赖审批，对延迟或异常权限及时标注并建议联系 IT 或直属经理。',
    promptEn:
      'You are the IT Provisioning sub-agent. Coordinate email, OA, VPN, office software, access rights, and device setup. Explain expected timelines and approval dependencies by role and department; flag delays or access issues and suggest contacting IT or the manager.',
    pluginToolsZh: ['Gmail', 'Slack', 'Google Workspace 连接器'],
    pluginToolsEn: ['Gmail', 'Slack', 'Google Workspace Bridge'],
  },
  {
    id: 'training-checkin',
    nameZh: '培训签到子代理',
    nameEn: 'Training Check-in Sub-agent',
    promptZh:
      '您是培训签到子代理，负责安排首日及阶段性培训，发送签到与日程提醒，并跟进培训完成情况。请用清晰时间表说明地点、链接与必备准备，对未签到或未完成的课程主动催办。',
    promptEn:
      'You are the Training Check-in sub-agent. Schedule first-day and staged training, send check-in and calendar reminders, and track completion. Provide clear schedules with location, links, and prerequisites; follow up on missed check-ins or incomplete courses.',
    pluginToolsZh: ['Slack', 'Gmail', '通知与状态跟踪技能'],
    pluginToolsEn: ['Slack', 'Gmail', 'Notification Tracking Skill'],
  },
]

const SALES_MANAGER_ONBOARD_SUB_AGENTS: AppMarketTemplateSubAgent[] = [
  {
    id: 'onboard-plan',
    nameZh: '入职计划子代理',
    nameEn: 'Onboarding Plan Sub-agent',
    promptZh:
      '您是入职计划子代理，负责生成销售经理入职计划，涵盖组织介绍、产品培训、销售流程、客户体系与业绩目标。请按阶段拆解里程碑、责任人与完成标准，并标注需 HR 或业务负责人确认的事项。',
    promptEn:
      'You are the Onboarding Plan sub-agent. Build a sales manager onboarding plan covering org intro, product training, sales process, customer framework, and quota goals. Break down milestones, owners, and completion criteria; flag items needing HR or business lead confirmation.',
    pluginToolsZh: ['CRM MCP', 'Salesforce 连接器', 'Gmail'],
    pluginToolsEn: ['CRM MCP', 'Salesforce Connector', 'Gmail'],
  },
  {
    id: 'training-schedule',
    nameZh: '培训安排子代理',
    nameEn: 'Training Schedule Sub-agent',
    promptZh:
      '您是培训安排子代理，负责安排 CRM 使用、销售话术、渠道策略、报价流程与商务规范等关键培训。请输出培训日程、参与方、前置准备与考核方式，并跟进完成情况。',
    promptEn:
      'You are the Training Schedule sub-agent. Arrange key training on CRM usage, sales talk tracks, channel strategy, quoting, and commercial policies. Provide schedules, attendees, prerequisites, assessment methods, and track completion.',
    pluginToolsZh: ['CRM MCP', 'Gmail', '模型路由'],
    pluginToolsEn: ['CRM MCP', 'Gmail', 'Model Routing'],
  },
  {
    id: 'coaching-review',
    nameZh: '带教考核子代理',
    nameEn: 'Coaching & Review Sub-agent',
    promptZh:
      '您是带教考核子代理，负责为直属领导生成带教与考核清单，包括陪访安排、目标制定与阶段评估节点。请明确带教周期、评估标准与反馈模板，便于经理执行与留痕。',
    promptEn:
      'You are the Coaching & Review sub-agent. Produce coaching and review checklists for the direct manager, including ride-alongs, goal setting, and staged evaluations. Specify coaching cadence, criteria, and feedback templates for accountable follow-through.',
    pluginToolsZh: ['CRM MCP', 'Salesforce 连接器', '人工审批节点工具'],
    pluginToolsEn: ['CRM MCP', 'Salesforce Connector', 'HITL Approval Step'],
  },
  {
    id: 'deliverables',
    nameZh: '交付输出子代理',
    nameEn: 'Deliverables Sub-agent',
    promptZh:
      '您是交付输出子代理，负责汇总并输出可直接使用的任务清单、培训日程、考核模板与跟进文案。请确保格式统一、字段完整，并标注草稿与已定稿内容。',
    promptEn:
      'You are the Deliverables sub-agent. Consolidate ready-to-use task lists, training calendars, review templates, and follow-up copy. Keep formats consistent and fields complete; distinguish drafts from finalized content.',
    pluginToolsZh: ['Gmail', '模型路由', 'CRM MCP'],
    pluginToolsEn: ['Gmail', 'Model Routing', 'CRM MCP'],
  },
]

export const AGENT_TEMPLATE_CATALOG: AppMarketItem[] = [
  {
    id: 'onboarding-starter-pack',
    nameZh: '新员工入职模板包',
    nameEn: 'Onboarding Starter Pack',
    descriptionZh: '含入职表单触发、HR 协同 Agent 与首日培训流程的可安装模板集合。',
    modalDescriptionZh: `当您需要“新员工入职模板包”时，我将负责监督任务并委派给子智能体：

1. 生成入职表单清单：资料、设备、账号、合同与合规确认。
2. 协助 HR 跟进关键节点：材料、审批、合同、账号和设备。
3. 安排首日培训流程：公司介绍、制度、IT 工具、岗位培训和团队见面。
4. 输出可直接使用的任务清单、日程、风险提醒和通知文案。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn:
      'Installable templates with onboarding form triggers, HR collaboration agents, and Day-1 training flows.',
    subAgents: EMPLOYEE_SELF_ONBOARD_SUB_AGENTS,
    productLine: 'agent-templates',
    templateCategory: 'hr-recruitment',
    publisher: 'Studio X',
    installs: '2.4k',
    rating: 4.9,
    badge: 'featured',
    iconFrom: '#7f7cff',
    iconTo: '#ff9a62',
    pluginToolsZh: ['人工审批节点工具', 'Google Workspace 连接器', 'Gmail', 'Slack', '入职办理引导技能'],
    pluginToolsEn: [
      'HITL Approval Step',
      'Google Workspace Bridge',
      'Gmail',
      'Slack',
      'Onboarding Guide Skill',
    ],
  },
  {
    id: 'culture-quiz-module',
    nameZh: '文化导览测验模块',
    nameEn: 'Culture Quiz Module',
    descriptionZh: '首日文化培训互动测验与完成度追踪，可嵌入体验中心流程。',
    modalDescriptionZh: `当您需要“文化导览测验模块”时，我将：

1. 生成文化导览内容：公司价值观、行为准则、协作方式和文化故事。
2. 设计测验题目：单选、多选、判断题和场景题。
3. 自动给出答案与解析，帮助新员工理解文化要点。
4. 输出可直接使用的导览材料、测验题库、评分规则和反馈文案。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn: 'Day-1 culture quiz with completion tracking, embeddable in the experience hub.',
    productLine: 'agent-templates',
    templateCategory: 'hr-recruitment',
    publisher: 'Joyce Templates',
    installs: '720',
    rating: 4.5,
    iconFrom: '#ff8cb7',
    iconTo: '#9a6bff',
    pluginToolsZh: ['评测框架', 'Notion HR 套件', '通知与状态跟踪技能', '网页搜索'],
    pluginToolsEn: ['Eval Framework', 'Notion HR Kit', 'Notification Tracking Skill', 'Web Search'],
  },
  {
    id: 'probation-checklist',
    nameZh: '试用期回访清单',
    nameEn: 'Probation Check-in Checklist',
    descriptionZh: '首周、首月回访任务模板，含经理评价与员工反馈采集。',
    modalDescriptionZh: `当您需要“试用期回访清单”时，我将：

1. 生成试用期回访计划：包含 7 天、30 天、60 天和转正前关键节点。
2. 为 HR 与直属经理生成回访问题与沟通清单。
3. 跟进工作适应、培训完成、团队融入和绩效表现等情况。
4. 输出可直接使用的回访记录、风险提醒、改进建议和转正评估模板。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn: 'Week-1 and month-1 check-in templates with manager review and employee feedback.',
    productLine: 'agent-templates',
    templateCategory: 'hr-recruitment',
    publisher: 'HR Templates',
    installs: '410',
    rating: 4.2,
    iconFrom: '#ffb86c',
    iconTo: '#ff6ea8',
    pluginToolsZh: ['人工审批节点工具', 'Google Sheets', 'Slack', 'Teams'],
    pluginToolsEn: ['HITL Approval Step', 'Google Sheets', 'Slack', 'Teams'],
  },
  {
    id: 'sales-manager-onboard',
    nameZh: '销售经理入职模板',
    nameEn: 'Sales Manager Onboarding',
    descriptionZh: '覆盖 CRM 权限、业绩目标对齐与渠道伙伴介绍的 Agent 编排模板。',
    modalDescriptionZh: `当您需要“销售经理入职模板”时，我将负责监督任务并委派给子智能体：

1. 制定销售经理入职计划：涵盖组织介绍、产品培训、销售流程、客户体系和业绩目标。
2. 安排核心培训内容：包括 CRM 使用、销售话术、渠道策略、报价流程和商务规范。
3. 生成带教与考核清单：支持直属领导开展陪访辅导、目标制定和阶段评估。
4. 输出可直接使用的任务清单、培训日程、考核模板和跟进文案。

信息不完整时，我会先生成草案，并标注待确认项。`,
    descriptionEn: 'Agent workflow for CRM access, quota alignment, and partner introductions.',
    subAgents: SALES_MANAGER_ONBOARD_SUB_AGENTS,
    productLine: 'agent-templates',
    templateCategory: 'business-dev',
    publisher: 'Studio X',
    installs: '680',
    rating: 4.6,
    iconFrom: '#5ea8ff',
    iconTo: '#7b61ff',
    pluginToolsZh: ['CRM MCP', '模型路由', 'Salesforce 连接器', 'Gmail'],
    pluginToolsEn: ['CRM MCP', 'Model Routing', 'Salesforce Connector', 'Gmail'],
  },
  {
    id: 'remote-hire-kit',
    nameZh: '远程入职模板包',
    nameEn: 'Remote Hire Kit',
    descriptionZh: '设备寄送、账号预配与线上首日议程的远程入职 Agent 模板。',
    modalDescriptionZh: `当您需要“远程入职模板包”时，我将：

1. 生成远程入职流程：包含设备寄送、账号开通、线上签到和远程协作安排。
2. 安排线上培训内容：公司文化、制度说明、IT 工具、沟通规范和岗位培训。
3. 协助 HR 与直属经理跟进设备、权限、会议和融入情况。
4. 输出可直接使用的任务清单、线上培训日程、通知文案和风险提醒。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn: 'Remote onboarding agents for equipment shipping, accounts, and virtual Day-1 agenda.',
    productLine: 'agent-templates',
    templateCategory: 'operations',
    publisher: 'Joyce Templates',
    installs: '520',
    rating: 4.4,
    badge: 'new',
    iconFrom: '#62d6a5',
    iconTo: '#3f8cff',
    pluginToolsZh: ['Google Workspace 连接器', 'Webhook 侦听', '队列执行器', '飞书助手 MCP'],
    pluginToolsEn: ['Google Workspace Bridge', 'Webhook Listener', 'Queue Runner', 'Feishu MCP'],
  },
  {
    id: 'compliance-onboard',
    nameZh: '合规入职审查模板',
    nameEn: 'Compliance Onboarding Review',
    descriptionZh: '证件核验、背景调查与合规培训节点的可配置 Agent 模板。',
    modalDescriptionZh: `当您需要“合规入职审查模板”时，我将：

1. 生成入职合规检查清单：包含身份材料、合同文件、保密协议和政策确认。
2. 审查关键合规节点：用工类型、审批流程、权限申请和数据安全要求。
3. 识别缺失材料、流程风险和潜在合规问题。
4. 输出可直接使用的审查清单、风险提醒、整改建议和确认文案。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn: 'Configurable agents for ID checks, background screening, and compliance training.',
    productLine: 'agent-templates',
    templateCategory: 'customer-support',
    publisher: 'HR Templates',
    installs: '390',
    rating: 4.3,
    iconFrom: '#19c7c7',
    iconTo: '#6d6bff',
    pluginToolsZh: ['PDF 解析', 'OCR 流式抽取', '身份核验节点', '人工审批节点工具'],
    pluginToolsEn: ['PDF Parser', 'OCR Extract', 'Identity Verification Step', 'HITL Approval Step'],
  },
  {
    id: 'it-provisioning-agent',
    nameZh: 'IT 开通协调 Agent 模板',
    nameEn: 'IT Provisioning Agent',
    descriptionZh: '账号、权限与设备清单协同的多 Agent 入职子流程模板。',
    modalDescriptionZh: `当您需要“IT 开通协调 Agent 模板”时，我将：

1. 生成 IT 开通清单：包含邮箱、办公软件、OA、VPN、权限系统和设备配置。
2. 协调 HR、直属经理与 IT 跟进账号、权限、设备和安全设置。
3. 识别开通延迟、权限缺失、设备未到位和安全配置风险。
4. 输出可直接使用的任务清单、状态跟踪表、提醒文案和交接确认模板。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn: 'Multi-agent subflow template for accounts, permissions, and equipment lists.',
    productLine: 'agent-templates',
    templateCategory: 'it-engineering',
    publisher: 'Kyms Templates',
    installs: '860',
    rating: 4.7,
    iconFrom: '#7ad7ff',
    iconTo: '#7c73ff',
    pluginToolsZh: ['数据库 MCP', 'Slack', 'SSO 权限同步', 'HR 开通协调技能', '重试策略'],
    pluginToolsEn: ['Database MCP', 'Slack', 'SSO Permission Sync', 'HR Provisioning Skill', 'Retry Policy'],
  },
  {
    id: 'employee-self-onboard',
    nameZh: '员工自助入职模板',
    nameEn: 'Employee Self-Service Onboarding',
    descriptionZh: '员工端问答引导、材料提交与进度查询的自助 Agent 模板。',
    modalDescriptionZh: `当您需要“员工自助入职指导模板”时，我将负责监督任务并委派给子智能体：

1. 生成入职任务清单：账号开通、材料提交、合同与保密协议确认、培训安排和团队介绍。
2. 指导关键步骤：根据员工角色和部门拆解流程，提醒待办事项，说明系统使用和政策要求。
3. 识别潜在问题：缺失材料、未完成任务或流程阻碍。
4. 输出可直接使用的操作指引、风险提醒、整改建议和确认文案。

信息不完整时，我会先生成草案并标注待确认项。`,
    descriptionEn: 'Self-service agents for Q&A, document upload, and progress tracking.',
    subAgents: EMPLOYEE_SELF_ONBOARD_SUB_AGENTS,
    productLine: 'agent-templates',
    templateCategory: 'productivity',
    publisher: 'Studio X',
    installs: '1.1k',
    rating: 4.5,
    iconFrom: '#ffd36a',
    iconTo: '#ff7b72',
    pluginToolsZh: ['入职办理引导技能', 'Gmail', '网页搜索', 'Google Drive', '通知与状态跟踪技能'],
    pluginToolsEn: [
      'Onboarding Guide Skill',
      'Gmail',
      'Web Search',
      'Google Drive',
      'Notification Tracking Skill',
    ],
  },
]

export function findAgentTemplateById(id: string): AppMarketItem | undefined {
  return AGENT_TEMPLATE_CATALOG.find((item) => item.id === id)
}
