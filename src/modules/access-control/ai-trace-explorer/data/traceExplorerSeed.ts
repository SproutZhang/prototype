export type TraceRunStatus = 'success' | 'error' | 'running'

export type TraceRiskLevel = 'low' | 'medium' | 'high'

export type TraceFlowStepKind = 'user' | 'agent' | 'retrieval' | 'llm' | 'tool'

export type TraceFlowStep = {
  id: string
  labelZh: string
  labelEn: string
  kind: TraceFlowStepKind
  latencyMs: number
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  detailZh?: string
  detailEn?: string
}

export type TraceKbHit = {
  id: string
  titleZh: string
  titleEn: string
  source: string
  snippetZh: string
  snippetEn: string
  score: number
}

export type TraceToolCall = {
  id: string
  name: string
  latencyMs: number
  inputJson: string
  outputJson: string
}

export type TraceSecurityCheck = {
  overallRisk: TraceRiskLevel
  promptInjectionDetected: boolean
  promptInjectionDetailZh: string
  promptInjectionDetailEn: string
  dataLeakRisk: TraceRiskLevel
  dataLeakDetailZh: string
  dataLeakDetailEn: string
}

export type AiTraceRecord = {
  id: string
  sessionId: string
  workflowKey?: string
  agentLabelZh: string
  agentLabelEn: string
  model: string
  status: TraceRunStatus
  riskLevel: TraceRiskLevel
  costUsd: number
  latencySec: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  occurredAt: string
  promptPreviewZh: string
  promptPreviewEn: string
  userInputZh: string
  userInputEn: string
  aiResponseZh: string
  aiResponseEn: string
  flowSteps: TraceFlowStep[]
  kbHits: TraceKbHit[]
  toolCalls: TraceToolCall[]
  security: TraceSecurityCheck
}

export const AI_TRACE_RECORDS: AiTraceRecord[] = [
  {
    id: 'tr-9f2a1c',
    sessionId: 'sess-cs-20260626-001',
    agentLabelZh: '客服助手',
    agentLabelEn: 'Customer Service Assistant',
    model: 'GPT-4.1',
    status: 'success',
    riskLevel: 'low',
    costUsd: 0.0312,
    latencySec: 2.85,
    totalTokens: 1552,
    inputTokens: 1240,
    outputTokens: 312,
    occurredAt: '2026-06-26T14:03:22+08:00',
    promptPreviewZh: '我想查询订单 ORD-8821 的物流状态…',
    promptPreviewEn: 'I want to check the shipping status of order ORD-8821…',
    userInputZh: '你好，我想查询订单 ORD-8821 的物流状态，预计什么时候能送到？',
    userInputEn: 'Hi, I want to check the shipping status of order ORD-8821. When will it arrive?',
    aiResponseZh:
      '您好！订单 ORD-8821 已于 6 月 24 日发货，当前状态为「运输中」，预计 6 月 28 日前送达。如需修改收货地址，请在送达前联系客服。',
    aiResponseEn:
      'Hello! Order ORD-8821 was shipped on Jun 24 and is currently in transit. Estimated delivery is before Jun 28. Contact support to change the address before delivery.',
    flowSteps: [
      {
        id: 'user',
        labelZh: '用户输入',
        labelEn: 'User Input',
        kind: 'user',
        latencyMs: 0,
        detailZh: '订单物流查询',
        detailEn: 'Order shipping inquiry',
      },
      {
        id: 'orchestrator',
        labelZh: '客服编排器',
        labelEn: 'Customer Orchestrator',
        kind: 'agent',
        latencyMs: 120,
        detailZh: '识别意图：物流查询',
        detailEn: 'Intent: shipping inquiry',
      },
      {
        id: 'retrieval',
        labelZh: '知识库检索',
        labelEn: 'Knowledge Retrieval',
        kind: 'retrieval',
        latencyMs: 380,
        detailZh: '命中 2 篇文档',
        detailEn: '2 documents matched',
      },
      {
        id: 'llm',
        labelZh: 'GPT-4.1',
        labelEn: 'GPT-4.1',
        kind: 'llm',
        latencyMs: 1240,
        inputTokens: 1240,
        outputTokens: 312,
        costUsd: 0.0288,
      },
      {
        id: 'tool',
        labelZh: '订单查询',
        labelEn: 'Order Query',
        kind: 'tool',
        latencyMs: 210,
        costUsd: 0.0024,
        detailZh: 'query_order_status',
        detailEn: 'query_order_status',
      },
    ],
    kbHits: [
      {
        id: 'kb-1',
        titleZh: 'Logistics FAQ.pdf',
        titleEn: 'Logistics FAQ.pdf',
        source: 'IKEA KB',
        snippetZh: '标准配送时效为 3-5 个工作日，偏远地区可能延长至 7 个工作日…',
        snippetEn: 'Standard delivery is 3-5 business days; remote areas may take up to 7 days…',
        score: 0.94,
      },
      {
        id: 'kb-2',
        titleZh: 'Return Policy.docx',
        titleEn: 'Return Policy.docx',
        source: 'Policy KB',
        snippetZh: '已发货订单可在送达前通过客服修改收货地址…',
        snippetEn: 'Shipped orders can update the delivery address via support before arrival…',
        score: 0.81,
      },
    ],
    toolCalls: [
      {
        id: 'tool-1',
        name: 'query_order_status',
        latencyMs: 210,
        inputJson: '{\n  "order_id": "ORD-8821",\n  "include_tracking": true\n}',
        outputJson:
          '{\n  "status": "in_transit",\n  "shipped_at": "2026-06-24",\n  "eta": "2026-06-28"\n}',
      },
    ],
    security: {
      overallRisk: 'low',
      promptInjectionDetected: false,
      promptInjectionDetailZh: '未检测到 Prompt Injection，输入内容安全',
      promptInjectionDetailEn: 'No prompt injection detected; input is safe',
      dataLeakRisk: 'low',
      dataLeakDetailZh: '未检测到敏感数据外泄',
      dataLeakDetailEn: 'No sensitive data leakage detected',
    },
  },
  {
    id: 'tr-3b8e72',
    sessionId: 'sess-doc-20260626-002',
    agentLabelZh: '文档摘要助手',
    agentLabelEn: 'Document Summary Assistant',
    model: 'Claude 3.7',
    status: 'success',
    riskLevel: 'low',
    costUsd: 0.0186,
    latencySec: 1.92,
    totalTokens: 2160,
    inputTokens: 1840,
    outputTokens: 320,
    occurredAt: '2026-06-26T13:18:00+08:00',
    promptPreviewZh: '请总结这份 12 页的产品需求文档…',
    promptPreviewEn: 'Summarize this 12-page product requirements doc…',
    userInputZh: '请总结这份产品需求文档的核心功能点和里程碑。',
    userInputEn: 'Summarize the core features and milestones in this PRD.',
    aiResponseZh: '文档共定义 4 个核心模块：用户管理、工作流编排、知识库集成与审计日志。里程碑分三阶段，首阶段 MVP 目标为 7 月底。',
    aiResponseEn:
      'The doc defines four core modules: user management, workflow orchestration, knowledge base integration, and audit logs. Milestones span three phases; MVP target is end of July.',
    flowSteps: [
      { id: 'user', labelZh: '用户输入', labelEn: 'User Input', kind: 'user', latencyMs: 0 },
      { id: 'chunk', labelZh: '文档分块', labelEn: 'Document Chunker', kind: 'tool', latencyMs: 142 },
      { id: 'retrieval', labelZh: '文档知识库', labelEn: 'Document KB', kind: 'retrieval', latencyMs: 290 },
      {
        id: 'llm',
        labelZh: 'Claude 3.7',
        labelEn: 'Claude 3.7',
        kind: 'llm',
        latencyMs: 1120,
        inputTokens: 1840,
        outputTokens: 320,
        costUsd: 0.0168,
      },
    ],
    kbHits: [
      {
        id: 'kb-1',
        titleZh: 'PRD-v2.pdf',
        titleEn: 'PRD-v2.pdf',
        source: 'Product KB',
        snippetZh: 'Phase 1 MVP includes workflow editor and agent library…',
        snippetEn: 'Phase 1 MVP includes workflow editor and agent library…',
        score: 0.92,
      },
    ],
    toolCalls: [],
    security: {
      overallRisk: 'low',
      promptInjectionDetected: false,
      promptInjectionDetailZh: '未检测到 Prompt Injection',
      promptInjectionDetailEn: 'No prompt injection detected',
      dataLeakRisk: 'low',
      dataLeakDetailZh: '文档为内部公开资料，无外泄风险',
      dataLeakDetailEn: 'Internal public document; no leakage risk',
    },
  },
  {
    id: 'tr-7c4d91',
    sessionId: 'sess-onb-20260626-003',
    workflowKey: 'onboarding',
    agentLabelZh: '入职流程编排 Agent',
    agentLabelEn: 'Onboarding Orchestrator Agent',
    model: 'GPT-4.1',
    status: 'running',
    riskLevel: 'medium',
    costUsd: 0.0428,
    latencySec: 3.24,
    totalTokens: 1896,
    inputTokens: 1520,
    outputTokens: 376,
    occurredAt: '2026-06-26T11:05:00+08:00',
    promptPreviewZh: '为新员工张三启动 onboarding 流程…',
    promptPreviewEn: 'Start onboarding flow for new hire Zhang San…',
    userInputZh: '请为新员工张三启动入职流程，并发送资料收集清单。',
    userInputEn: 'Start onboarding for Zhang San and send the document checklist.',
    aiResponseZh: '已创建入职工单 #ONB-2026-042，正在调度 Document Collection Agent 收集资料…',
    aiResponseEn: 'Created onboarding ticket #ONB-2026-042. Dispatching Document Collection Agent…',
    flowSteps: [
      { id: 'user', labelZh: '用户输入', labelEn: 'User Input', kind: 'user', latencyMs: 0 },
      { id: 'kickoff', labelZh: '入职启动 Agent', labelEn: 'Onboarding Kickoff Agent', kind: 'agent', latencyMs: 86 },
      { id: 'workflow', labelZh: 'onboarding', labelEn: 'onboarding', kind: 'tool', latencyMs: 120 },
      { id: 'doc', labelZh: 'Document Collection', labelEn: 'Document Collection', kind: 'agent', latencyMs: 420 },
      {
        id: 'llm',
        labelZh: 'GPT-4.1',
        labelEn: 'GPT-4.1',
        kind: 'llm',
        latencyMs: 780,
        inputTokens: 1520,
        outputTokens: 376,
        costUsd: 0.038,
      },
    ],
    kbHits: [
      {
        id: 'kb-1',
        titleZh: 'HR 入职知识库',
        titleEn: 'HR Onboarding KB',
        source: 'HR KB',
        snippetZh: '新员工需在入职前 3 天完成资料提交…',
        snippetEn: 'New hires must submit documents 3 days before start…',
        score: 0.88,
      },
    ],
    toolCalls: [
      {
        id: 'tool-1',
        name: 'create_onboarding_ticket',
        latencyMs: 185,
        inputJson: '{\n  "employee": "张三",\n  "department": "产品部"\n}',
        outputJson: '{\n  "ticket_id": "ONB-2026-042",\n  "status": "created"\n}',
      },
    ],
    security: {
      overallRisk: 'medium',
      promptInjectionDetected: false,
      promptInjectionDetailZh: '未检测到注入攻击',
      promptInjectionDetailEn: 'No injection attack detected',
      dataLeakRisk: 'medium',
      dataLeakDetailZh: '流程含员工 PII，已脱敏输出',
      dataLeakDetailEn: 'Flow contains employee PII; output redacted',
    },
  },
  {
    id: 'tr-2a9f55',
    sessionId: 'sess-leave-20260626-004',
    workflowKey: 'leave-approval',
    agentLabelZh: '请假审批助手',
    agentLabelEn: 'Leave Approval Assistant',
    model: 'GPT-4o-mini',
    status: 'error',
    riskLevel: 'high',
    costUsd: 0.0094,
    latencySec: 1.18,
    totalTokens: 680,
    inputTokens: 520,
    outputTokens: 0,
    occurredAt: '2026-06-26T09:40:00+08:00',
    promptPreviewZh: '帮我提交 6 月 30 日的年假申请…',
    promptPreviewEn: 'Submit annual leave request for Jun 30…',
    userInputZh: '帮我提交 6 月 30 日年假申请，共 1 天。',
    userInputEn: 'Submit a 1-day annual leave request for Jun 30.',
    aiResponseZh: '审批流程执行失败：政策校验未通过，当前余额不足。',
    aiResponseEn: 'Approval flow failed: policy validation rejected due to insufficient balance.',
    flowSteps: [
      { id: 'user', labelZh: '用户输入', labelEn: 'User Input', kind: 'user', latencyMs: 0 },
      { id: 'orchestrator', labelZh: '审批编排器', labelEn: 'Approval Orchestrator', kind: 'agent', latencyMs: 95 },
      { id: 'policy', labelZh: '政策校验', labelEn: 'Policy Validator', kind: 'tool', latencyMs: 180 },
      { id: 'llm', labelZh: 'GPT-4o-mini', labelEn: 'GPT-4o-mini', kind: 'llm', latencyMs: 0, inputTokens: 520, outputTokens: 0 },
    ],
    kbHits: [],
    toolCalls: [
      {
        id: 'tool-1',
        name: 'validate_leave_balance',
        latencyMs: 180,
        inputJson: '{\n  "employee_id": "E-205",\n  "days": 1,\n  "date": "2026-06-30"\n}',
        outputJson: '{\n  "valid": false,\n  "reason": "insufficient_balance"\n}',
      },
    ],
    security: {
      overallRisk: 'high',
      promptInjectionDetected: true,
      promptInjectionDetailZh: '检测到疑似指令覆盖片段，已阻断后续工具调用',
      promptInjectionDetailEn: 'Suspected instruction override detected; downstream tools blocked',
      dataLeakRisk: 'low',
      dataLeakDetailZh: '无数据外泄',
      dataLeakDetailEn: 'No data leakage',
    },
  },
  {
    id: 'tr-5e1b88',
    sessionId: 'sess-train-20260625-005',
    workflowKey: 'onboarding',
    agentLabelZh: '培训协调助手',
    agentLabelEn: 'Training Coordinator Assistant',
    model: 'GPT-4.1',
    status: 'success',
    riskLevel: 'low',
    costUsd: 0.0152,
    latencySec: 2.08,
    totalTokens: 822,
    inputTokens: 680,
    outputTokens: 142,
    occurredAt: '2026-06-25T16:18:00+08:00',
    promptPreviewZh: '推荐适合新员工的培训课程…',
    promptPreviewEn: 'Recommend training courses for new hires…',
    userInputZh: '请推荐适合新员工的前三门培训课程。',
    userInputEn: 'Recommend the top three training courses for new hires.',
    aiResponseZh: '推荐课程：1) 公司文化与价值观 2) 信息安全基础 3) 协作工具入门。已同步至学习平台。',
    aiResponseEn:
      'Recommended: 1) Company culture 2) InfoSec basics 3) Collaboration tools intro. Synced to LMS.',
    flowSteps: [
      { id: 'user', labelZh: '用户输入', labelEn: 'User Input', kind: 'user', latencyMs: 0 },
      { id: 'orchestrator', labelZh: '培训编排器', labelEn: 'Training Orchestrator', kind: 'agent', latencyMs: 88 },
      { id: 'retrieval', labelZh: '培训资料库', labelEn: 'Training KB', kind: 'retrieval', latencyMs: 260 },
      {
        id: 'llm',
        labelZh: 'GPT-4.1',
        labelEn: 'GPT-4.1',
        kind: 'llm',
        latencyMs: 920,
        inputTokens: 680,
        outputTokens: 142,
        costUsd: 0.0124,
      },
      { id: 'notify', labelZh: 'Slack 通知', labelEn: 'Slack Notify', kind: 'tool', latencyMs: 120, costUsd: 0.0002 },
    ],
    kbHits: [
      {
        id: 'kb-1',
        titleZh: 'New Hire Training Catalog',
        titleEn: 'New Hire Training Catalog',
        source: 'LMS',
        snippetZh: '必修：公司文化、信息安全、协作工具；选修：产品概览…',
        snippetEn: 'Required: culture, infosec, tools; elective: product overview…',
        score: 0.9,
      },
    ],
    toolCalls: [
      {
        id: 'tool-1',
        name: 'sync_lms_recommendations',
        latencyMs: 120,
        inputJson: '{\n  "user_id": "U-091",\n  "courses": ["CUL-101", "SEC-201", "TOOL-301"]\n}',
        outputJson: '{\n  "synced": true,\n  "count": 3\n}',
      },
    ],
    security: {
      overallRisk: 'low',
      promptInjectionDetected: false,
      promptInjectionDetailZh: '未检测到 Prompt Injection',
      promptInjectionDetailEn: 'No prompt injection detected',
      dataLeakRisk: 'low',
      dataLeakDetailZh: '输出为公开培训目录',
      dataLeakDetailEn: 'Output is public training catalog',
    },
  },
]
