import type { WfPipelineStepDetail } from '../../../components/shared/WfBlueprintStepsBlock'
import { ONBOARDING_WF_PIPELINE_STEP_DETAILS } from '../../../components/shared/WfBlueprintStepsBlock'

const HR_APPROVAL_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '从 HRIS / 共享盘拉取候选人材料清单，标注缺失项与过期文件',
      '按岗位与地区规则生成材料核对表，并指派补交责任人',
      '将核对结果写入审批追踪表，供后续节点引用',
    ],
    plugins: ['Google Drive', 'Gmail', 'Notion'],
    description:
      '在审批启动前统一材料口径，减少因缺件导致的反复沟通，并为跨部门审批提供可追溯的上下文。',
    assignedAgentName: '材料收集子 Agent',
    assignedAgentRolePrompt: `你是「材料收集子 Agent」，负责本步骤的材料清单核对与缺件追踪。

- 从 HRIS 或共享盘拉取清单，标注缺失、过期与需重签文件；生成可点击补交清单。
- 按岗位与地区规则输出核对表，并指派补交责任人与截止时间。
- 将核对结果与附件链接写入审批追踪表，供路由与合同节点消费。`,
  },
  {
    tasks: [
      '根据审批矩阵自动路由至用人经理、HRBP 与合规节点',
      '对超时节点发送提醒，并支持一键升级或转派',
      '记录各节点意见与附件版本，形成时间线',
    ],
    plugins: ['Slack', 'Gmail', 'Zapier'],
    description:
      '把多角色审批从邮件串联改为可追踪的任务流，确保每个节点在 SLA 内完成并留痕。',
    assignedAgentName: '审批路由子 Agent',
    assignedAgentRolePrompt: `你是「审批路由子 Agent」，负责按矩阵发起审批并跟踪 SLA。

- 依据审批矩阵自动创建待办并路由至正确角色；禁止越级跳过必填节点。
- 对超时、驳回与转派场景发送提醒，并记录原因码便于复盘。
- 汇总各节点意见与附件版本，输出可审计时间线（演示）。`,
  },
  {
    tasks: [
      '比对 Offer 与合同模板变量，高亮差异条款',
      '触发法务 / HR 会签占位，并锁定待签版本',
      '在双方确认后生成签署包与归档路径',
    ],
    plugins: ['Google Drive', 'Gmail'],
    description:
      '在合同确认环节降低条款偏差风险，并保证签署版本与审批结论一致。',
    assignedAgentName: '合同协同子 Agent',
    assignedAgentRolePrompt: `你是「合同协同子 Agent」，负责 Offer 与合同模板的差异比对与会签协同。

- 自动填充模板变量并高亮与 Offer 不一致的条款；敏感字段脱敏展示。
- 触发法务 / HR 会签占位，锁定待签版本，禁止并行多版本混用。
- 生成签署包、归档路径与回执占位，写入审批追踪表。`,
  },
  {
    tasks: [
      '汇总审批结论与合同状态，向候选人与用人方发送结果通知',
      '将终态文档归档至 HRIS 指定目录',
      '输出审批健康度简报供 HR 复盘',
    ],
    plugins: ['Notion', 'Gmail', 'Power BI'],
    description:
      '在流程末端完成通知与归档闭环，为后续入职或编制调整提供可信数据源。',
    assignedAgentName: 'HR 协同管家',
    assignedAgentRolePrompt: `你是「HR 协同管家」，负责本流程收尾通知、归档与健康度汇总。

- 汇总审批与合同终态，向候选人、用人经理发送统一口径通知。
- 将签署件与审批记录归档至 HRIS 指定目录，并标注责任人时间线。
- 输出超时、驳回与异常统计简报，供 HR 月度复盘（演示）。`,
  },
]

const GOOGLE_BUSINESS_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '从 Google 商家资料 API 拉取门店基础信息与营业时间',
      '比对官网 / 地图数据差异并生成修订建议',
      '一键提交变更草稿并等待运营确认',
    ],
    plugins: ['Google Workspace', 'Google Drive'],
    description: '保持线上商家信息与线下实际一致，减少因信息过期导致的客诉与流失。',
    assignedAgentName: '商家资料同步子 Agent',
    assignedAgentRolePrompt: `你是「商家资料同步子 Agent」，负责商家档案的拉取、比对与变更草稿。

- 定期同步门店信息、营业时间与特色服务；高亮与官网不一致字段。
- 生成修订建议清单，需经运营确认后再提交（演示占位）。
- 记录每次同步批次 ID，便于评价回复与日报节点引用。`,
  },
  {
    tasks: [
      '聚合新评价并按情感与主题分类',
      '为低分评价生成回复草稿并标注需人工复核项',
      '在确认后发布回复并记录响应时长',
    ],
    plugins: ['Gmail', 'Slack'],
    description: '提升评价响应效率与口径一致性，同时保留人工审核以避免不当公开回复。',
    assignedAgentName: '评价运营子 Agent',
    assignedAgentRolePrompt: `你是「评价运营子 Agent」，负责评价聚合、回复草稿与发布留痕。

- 按星级、主题与语言聚类评价；低分评价优先排队并附根因标签（演示）。
- 生成符合品牌语气的回复草稿，敏感内容标记需人工复核。
- 发布后经确认的回写响应时长与处理人，供日报统计。`,
  },
  {
    tasks: [
      '汇总曝光、点击、来电与预约等核心指标',
      '对比近 7 / 30 日趋势并标注异常波动',
      '生成运营日报并推送至指定 Slack 频道',
    ],
    plugins: ['Slack', 'Power BI', 'Zapier'],
    description: '把分散在商家后台的数据转为可行动的日报，帮助运营快速发现机会与风险。',
    assignedAgentName: '运营分析子 Agent',
    assignedAgentRolePrompt: `你是「运营分析子 Agent」，负责指标汇总、趋势解读与日报推送。

- 拉取曝光、点击、来电、预约等指标，计算环比与同比（演示数据）。
- 对异常波动给出可能原因与建议动作（活动、差评、信息变更等）。
- 生成结构化日报并推送 Slack，附带跳转链接与批次 ID。`,
  },
  {
    tasks: [
      '监控差评激增、信息驳回与 API 失败等异常',
      '按规则通知值班运营并创建跟进任务',
      '在闭环后更新异常台账',
    ],
    plugins: ['Slack', 'Trello', 'Zapier'],
    description: '对关键异常做到早发现、早分派，避免小问题演化为品牌危机。',
    assignedAgentName: '商家自动化管家',
    assignedAgentRolePrompt: `你是「商家自动化管家」，负责异常监测、分派与台账闭环。

- 监听差评激增、资料驳回、同步失败等信号，按严重级别路由值班人。
- 创建跟进任务并跟踪 SLA，闭环后更新异常台账与复盘备注。
- 与资料、评价、日报子 Agent 对齐批次 ID，避免重复告警。`,
  },
]

const SLACK_1ON1_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '从 Slack 频道与项目管理工具拉取近两周工作更新',
      '提取完成项、阻塞项与跨团队协作记录',
      '去重并结构化为主题条目',
    ],
    plugins: ['Slack', 'Trello', 'Notion'],
    description: '为经理会前准备提供可信的工作事实基础，减少临时回忆与遗漏。',
    assignedAgentName: '工作上下文子 Agent',
    assignedAgentRolePrompt: `你是「工作上下文子 Agent」，负责从 Slack 与协作工具汇总近期工作事实。

- 拉取指定成员近两周消息、任务状态与里程碑，过滤噪声与重复条目。
- 标注完成项、阻塞项与需经理决策的依赖，输出结构化主题列表。
- 所有条目附来源链接与时间戳，供提纲生成节点引用。`,
  },
  {
    tasks: [
      '汇总 360 / 脉冲调研中的关键反馈片段',
      '标注正向亮点与需改进行为，并去标识化处理',
      '与绩效周期备注对齐，避免口径冲突',
    ],
    plugins: ['Slack', 'Google Drive', 'Notion'],
    description: '把分散反馈收敛为可讨论的要点，帮助经理在 1:1 中聚焦发展而非琐事。',
    assignedAgentName: '反馈整合子 Agent',
    assignedAgentRolePrompt: `你是「反馈整合子 Agent」，负责反馈片段的汇总、去标识与要点提炼。

- 聚合调研、Slack 与文档中的反馈，去除可识别个人信息（演示规则）。
- 区分行为观察与结果评价，输出 3–5 条可讨论要点。
- 与绩效备注对齐，标记可能冲突处供经理会前确认。`,
  },
  {
    tasks: [
      '基于上下文与反馈生成 1:1 谈话提纲（开场、回顾、发展、收尾）',
      '为每个主题附建议提问与倾听提示',
      '输出可分享的 Notion 页面或 Slack 摘要',
    ],
    plugins: ['Notion', 'Slack'],
    description: '将经理从「临时想话题」解放出来，确保每次 1:1 有结构、有重点、可跟进。',
    assignedAgentName: '谈话提纲子 Agent',
    assignedAgentRolePrompt: `你是「谈话提纲子 Agent」，负责生成结构化 1:1 议程与提问建议。

- 按开场、回顾、发展、收尾四段生成提纲，每段 2–4 个主题。
- 为每个主题附建议提问、倾听提示与可选练习（演示）。
- 导出 Notion 页面或 Slack 摘要，并预留行动项占位。`,
  },
  {
    tasks: [
      '在会前 24h 向经理与员工发送议程提醒',
      '会后将行动项写入待办并设定跟进节奏',
      '统计议题完成度供 People Ops 复盘',
    ],
    plugins: ['Slack', 'Google Calendar', 'Zapier'],
    description: '保证 1:1 不只「聊完就算」，而是形成可追踪的后续行动与节奏。',
    assignedAgentName: 'People 1:1 管家',
    assignedAgentRolePrompt: `你是「People 1:1 管家」，负责会前提醒、行动项跟进与节奏统计。

- 会前发送议程提醒与材料链接；支持改期建议（演示）。
- 会后解析行动项，写入待办并设定 1–2 周跟进检查点。
- 汇总议题覆盖与行动闭环率，供 People Ops 季度复盘。`,
  },
]

const CUSTOMER_COMPLAINT_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '从客服系统拉取近 30 天投诉工单并去重合并',
      '按产品、渠道、地区维度打标签',
      '识别重复投诉用户并标注优先级',
    ],
    plugins: ['Zendesk', 'Slack'],
    description: '在分析前建立干净的投诉数据集，避免重复计数与口径不一致。',
    assignedAgentName: '工单聚合子 Agent',
    assignedAgentRolePrompt: `你是「工单聚合子 Agent」，负责投诉工单的拉取、去重与多维标签。

- 同步近 30 天投诉工单，合并重复会话并保留原始 ID 映射。
- 按产品、渠道、地区打标签，识别高频重复用户并提升优先级。
- 输出聚合批次号，供根因与改进节点引用。`,
  },
  {
    tasks: [
      '对投诉文本做主题聚类与情感分析',
      '关联已知缺陷与物流 / 计费异常事件',
      '输出 Top 根因假设及置信度（演示）',
    ],
    plugins: ['Zendesk', 'Power BI', 'Notion'],
    description: '从海量投诉中快速定位结构性问题，而不是停留在个案处理。',
    assignedAgentName: '根因分析子 Agent',
    assignedAgentRolePrompt: `你是「根因分析子 Agent」，负责主题聚类、情感分析与根因假设。

- 对投诉文本聚类并计算情感分布，关联已知缺陷与外部事件时间线。
- 输出 Top 根因假设、影响面估算与置信度（演示占位）。
- 将假设与证据链接写入 Notion 分析页，供改进建议节点使用。`,
  },
  {
    tasks: [
      '针对每个根因生成短期缓解与长期修复建议',
      '指派责任团队并估算工作量区间',
      '生成面向管理层的改进简报',
    ],
    plugins: ['Notion', 'Slack', 'Trello'],
    description: '把分析结论转化为可排期的改进动作，缩短从洞察到执行的周期。',
    assignedAgentName: '改进建议子 Agent',
    assignedAgentRolePrompt: `你是「改进建议子 Agent」，负责将根因转化为可排期的改进方案。

- 为每个根因生成短期缓解与长期修复动作，附责任团队与工作量区间（演示）。
- 创建 Trello 卡片或 Jira 占位，并 @ 相关负责人评审。
- 输出一页管理层简报，含影响面、优先级与预期收益。`,
  },
  {
    tasks: [
      '跟踪改进项状态与投诉复发率',
      '对超期项自动提醒并支持升级',
      '输出月度闭环报告',
    ],
    plugins: ['Trello', 'Power BI', 'Gmail'],
    description: '确保改进建议真正落地，并用数据验证投诉趋势是否好转。',
    assignedAgentName: 'CX 闭环管家',
    assignedAgentRolePrompt: `你是「CX 闭环管家」，负责改进项跟踪、复发监测与月度报告。

- 跟踪改进卡片状态，对超期项提醒并可升级至负责人（演示）。
- 对比改进前后投诉量与复发率，标注未见效的根因。
- 生成月度闭环报告并邮件推送相关干系人。`,
  },
]

const VIRAL_CONTENT_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '抓取行业热点、竞品爆款与搜索趋势',
      '结合品牌调性生成 5–10 个选题候选',
      '输出选题评分与推荐渠道组合',
    ],
    plugins: ['Google Drive', 'Notion', 'Slack'],
    description: '在创作起点提高选题命中率，减少盲目跟风与调性不符的风险。',
    assignedAgentName: '选题研究子 Agent',
    assignedAgentRolePrompt: `你是「选题研究子 Agent」，负责热点抓取、选题候选与渠道建议。

- 汇总行业热点、竞品案例与搜索趋势，过滤与品牌调性不符话题。
- 生成 5–10 个选题候选，附受众、钩子与推荐渠道组合（演示评分）。
- 将入选选题写入 Notion 看板，供脚本节点接力。`,
  },
  {
    tasks: [
      '按选定选题生成短视频 / 图文脚本结构',
      '补充分镜、口播要点与 CTA',
      '走简单审批流后锁定脚本版本',
    ],
    plugins: ['Notion', 'Gmail', 'Google Drive'],
    description: '把创意构想到可拍摄的脚本，统一团队对内容结构与卖点的理解。',
    assignedAgentName: '脚本撰写子 Agent',
    assignedAgentRolePrompt: `你是「脚本撰写子 Agent」，负责结构化脚本、分镜与 CTA 设计。

- 按选题生成钩子、主体、转折与 CTA，区分短视频与图文结构。
- 补充分镜与口播要点，标注需实拍 / 素材库的段落。
- 脚本经审批后锁定版本号，供制作与分发节点引用。`,
  },
  {
    tasks: [
      '根据脚本列出素材清单（封面、B-roll、字幕模板）',
      '调用设计工具占位生成初版素材',
      '组织评审并收集修改意见',
    ],
    plugins: ['Google Drive', 'Slack', 'Trello'],
    description: '让制作环节有章可循，缩短从脚本到可发布素材的等待时间。',
    assignedAgentName: '素材制作子 Agent',
    assignedAgentRolePrompt: `你是「素材制作子 Agent」，负责素材清单、初版生成与评审协同。

- 从脚本拆解封面、B-roll、字幕与配乐需求，创建制作任务卡。
- 调用设计工具占位输出初版素材，并记录版本与修改意见。
- 评审通过后标记「可分发」，同步至渠道排期表。`,
  },
  {
    tasks: [
      '按渠道规格适配标题、封面与发布时间',
      '创建排期表并同步至各平台草稿箱（演示）',
      '汇总发布后 48h 核心指标快报',
    ],
    plugins: ['Slack', 'Zapier', 'Power BI'],
    description: '一次创作、多渠道适配，并在发布后快速回收数据指导下一轮选题。',
    assignedAgentName: '内容分发管家',
    assignedAgentRolePrompt: `你是「内容分发管家」，负责多渠道适配、排期与效果快报。

- 按平台规格适配标题、封面与标签，生成排期表与草稿占位。
- 发布后 48h 汇总播放、互动与转化指标，标注异常渠道。
- 将效果结论回写选题看板，形成创作闭环（演示）。`,
  },
]

const NOTION_KNOWLEDGE_SYNC_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '从日历与会议工具拉取近 7 天会议纪要',
      '提取决策、行动项与负责人',
      '过滤重复或过短记录',
    ],
    plugins: ['Google Calendar', 'Slack', 'Notion'],
    description: '把会议产出从个人笔记变为团队可检索的知识输入。',
    assignedAgentName: '会议纪要子 Agent',
    assignedAgentRolePrompt: `你是「会议纪要子 Agent」，负责会议纪要的拉取、结构化与去重。

- 同步近 7 天会议纪要，提取决策、行动项、负责人与截止日期。
- 过滤空白、重复或过短记录，保留来源会议链接。
- 输出结构化条目批次，供 Notion 同步节点写入。`,
  },
  {
    tasks: [
      '监听共享盘 / Wiki 变更事件',
      '比对文档版本差异并生成变更摘要',
      '标注需人工确认的高风险修改',
    ],
    plugins: ['Google Drive', 'Notion', 'Slack'],
    description: '避免知识库静默漂移，让重要文档变更可被团队及时感知。',
    assignedAgentName: '文档变更子 Agent',
    assignedAgentRolePrompt: `你是「文档变更子 Agent」，负责文档版本 diff 与变更摘要。

- 监听共享盘 / Wiki 变更，生成段落级 diff 摘要与影响范围说明。
- 对权限、合规相关章节标注需人工确认（演示规则）。
- 将摘要与链接写入待同步队列，附版本号。`,
  },
  {
    tasks: [
      '将结构化条目写入 Notion 对应数据库',
      '维护标签、关联项目与归档路径',
      '避免重复页面创建',
    ],
    plugins: ['Notion', 'Zapier'],
    description: '统一知识落点，让检索、关联与权限在 Notion 内一站式完成。',
    assignedAgentName: 'Notion 同步子 Agent',
    assignedAgentRolePrompt: `你是「Notion 同步子 Agent」，负责向 Notion 数据库的幂等写入与元数据维护。

- 按映射规则写入会议与文档条目，更新标签、项目关联与归档路径。
- 使用外部 ID 做幂等校验，避免重复创建页面。
- 同步失败时写入重试队列并通知知识管理员（演示）。`,
  },
  {
    tasks: [
      '检测标题冲突、权限不一致与断链引用',
      '生成合并建议或人工处理待办',
      '输出同步健康度周报',
    ],
    plugins: ['Notion', 'Slack', 'Power BI'],
    description: '在自动化同步中保留人工裁决入口，确保知识库质量可控。',
    assignedAgentName: '知识库管家',
    assignedAgentRolePrompt: `你是「知识库管家」，负责冲突处理、待办分派与同步健康度报告。

- 检测标题冲突、权限不一致与断链，给出合并建议或人工待办。
- 跟踪待办 SLA，闭环后更新同步台账。
- 每周输出同步成功率、冲突率与 Top 失败原因简报。`,
  },
]

const ZENDESK_TICKET_SUMMARY_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '读取工单主题、优先级、客户层级与产品版本',
      '拉取关联订单 / 订阅信息（演示占位）',
      '生成一句话问题陈述',
    ],
    plugins: ['Zendesk', 'Slack'],
    description: '让客服在处理工单前 30 秒内掌握关键背景，减少反复询问客户。',
    assignedAgentName: '工单上下文子 Agent',
    assignedAgentRolePrompt: `你是「工单上下文子 Agent」，负责工单元数据与客户背景的快速汇总。

- 读取主题、优先级、客户层级、产品版本与 SLA 时钟。
- 关联订单 / 订阅占位信息，生成一句话问题陈述。
- 输出上下文卡片 ID，供历史归纳节点引用。`,
  },
  {
    tasks: [
      '按时间线整理公开回复与内部备注',
      '标注客户情绪转折与承诺事项',
      '高亮未兑现的历史承诺',
    ],
    plugins: ['Zendesk', 'Gmail'],
    description: '避免客服重复踩坑，尤其在长周期、多人接手工单中尤为重要。',
    assignedAgentName: '往来归纳子 Agent',
    assignedAgentRolePrompt: `你是「往来归纳子 Agent」，负责对话时间线、情绪与承诺追踪。

- 按时间线整理公开回复与内部备注，去重系统自动化消息。
- 标注情绪转折、升级节点与已承诺未兑现事项。
- 生成往来摘要附引用消息 ID（演示）。`,
  },
  {
    tasks: [
      '提取待客户确认、待内部协作与待外部依赖动作',
      '为每项标注责任方与建议截止时间',
      '与 SLA 规则对齐并标红风险项',
    ],
    plugins: ['Zendesk', 'Trello', 'Slack'],
    description: '把「下一步做什么」说清楚，降低工单悬挂与责任模糊。',
    assignedAgentName: '待办提取子 Agent',
    assignedAgentRolePrompt: `你是「待办提取子 Agent」，负责从工单中抽取可执行待办与责任归属。

- 区分客户侧、内部协作与外部依赖动作，每项附建议截止时间。
- 与 SLA 规则比对，标红即将超时或已超时项。
- 可一键创建 Trello / 内部任务占位（演示）。`,
  },
  {
    tasks: [
      '合并上下文、往来与待办为客服可读摘要',
      '附建议回复要点与升级路径',
      '在工单关闭后归档摘要供质检抽样',
    ],
    plugins: ['Zendesk', 'Notion', 'Gmail'],
    description: '提供一站式摘要视图，提升首次响应质量与交接效率。',
    assignedAgentName: '工单摘要管家',
    assignedAgentRolePrompt: `你是「工单摘要管家」，负责终态摘要、回复建议与归档。

- 合并上下文、往来与待办为结构化摘要，附建议回复要点与升级路径。
- 支持复制到回复框或内部备注（演示交互占位）。
- 关闭工单后归档摘要，供质检抽样与培训案例库。`,
  },
]

export const SCENARIO_TEMPLATE_WORKFLOW_STEP_DETAILS: Record<
  string,
  readonly WfPipelineStepDetail[]
> = {
  'employee-onboarding-guide': ONBOARDING_WF_PIPELINE_STEP_DETAILS,
  'hr-approval-coordination': HR_APPROVAL_STEP_DETAILS,
  'google-business-automation': GOOGLE_BUSINESS_STEP_DETAILS,
  'slack-1on1-talk-points': SLACK_1ON1_STEP_DETAILS,
  'customer-complaint-analysis': CUSTOMER_COMPLAINT_STEP_DETAILS,
  'viral-content-creation': VIRAL_CONTENT_STEP_DETAILS,
  'notion-knowledge-sync': NOTION_KNOWLEDGE_SYNC_STEP_DETAILS,
  'zendesk-ticket-summary': ZENDESK_TICKET_SUMMARY_STEP_DETAILS,
}

export function getScenarioTemplateWorkflowStepDetails(
  templateId: string,
): readonly WfPipelineStepDetail[] | undefined {
  return SCENARIO_TEMPLATE_WORKFLOW_STEP_DETAILS[templateId]
}
