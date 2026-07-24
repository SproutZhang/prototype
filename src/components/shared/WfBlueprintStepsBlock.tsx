import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react'

export type WfBlueprintStep = {
  id: string
  title: string
}

/** 工作流步骤卡片展开区：演示用任务、插件与描述（与 demo 步骤顺序一致） */
export type WfPipelineStepDetail = {
  tasks: readonly string[]
  plugins: readonly string[]
  description: string
  assignedAgentName: string
  assignedAgentRolePrompt: string
}

export const ONBOARDING_WF_PIPELINE_STEP_DETAILS: readonly WfPipelineStepDetail[] = [
  {
    tasks: [
      '从 HRIS 或 Offer 状态生成入职项目条目，并关联候选人、岗位与到岗日期',
      '拆解入职检查清单（材料、审批、资产、培训）并指派默认负责人与截止时间',
      '在日历中创建里程碑与提醒节奏，并向用人经理与 HR 发送对齐邮件',
    ],
    plugins: ['Trello', 'Google Calendar', 'Gmail'],
    description:
      '本阶段把零散信息沉淀为可执行的项目结构，让后续账号开通、欢迎邮件与培训都在同一上下文里推进，减少反复对齐与遗漏。',
    assignedAgentName: '信息收集子 Agent',
    assignedAgentRolePrompt: `你是「信息收集子 Agent」，在本步骤负责把 Offer / HRIS 中的候选人信息整理为可执行的入职项目。

- 校验必填字段（姓名、部门、岗位、到岗日、工作模式等），对缺失项生成可点击的补充清单。
- 将检查清单拆解为带负责人与截止日的子任务，并写入项目看板或追踪表。
- 在日历中创建里程碑与提醒，并向用人经理与 HR 发送对齐邮件；所有输出需带上项目 ID 便于下游节点引用。`,
  },
  {
    tasks: [
      '根据模板生成欢迎邮件正文，合并员工姓名、部门与首日议程链接',
      '按需附带 IT 须知、内网入口与紧急联系人，并走简单审批后发送',
      '将发送结果与打开情况回写到入职追踪表（演示占位）',
    ],
    plugins: ['Gmail'],
    description:
      '在新员工确认入职后第一时间发出统一口径的欢迎邮件，前置关键信息与下一步动作，提升首日体验与到达率。',
    assignedAgentName: '信息收集子 Agent',
    assignedAgentRolePrompt: `你是「信息收集子 Agent」，在本步骤负责欢迎邮件的内容拼装与发送前校验。

- 使用经审批的邮件模板，合并姓名、部门、首日议程链接与内网入口等变量；敏感字段脱敏展示。
- 在发送前执行拼写检查、链接可达性（演示占位）与简单审批流占位。
- 将发送结果、打开情况与退信原因回写到入职追踪表，供后续 IT / 培训节点消费。`,
  },
  {
    tasks: [
      '按岗位模板勾选需开通的邮箱、VPN、协作套件与业务系统权限',
      '向 IT 队列推送工单并附带设备与软件清单，跟踪开通与签收状态',
      '对异常或未回写节点触发提醒，直至权限与设备状态闭环',
    ],
    plugins: ['Microsoft Intune', 'Jamf', 'PDQ Deploy'],
    description:
      '面向公司发放设备与 BYOD 等混合场景，用统一入口发起账号与终端策略配置，降低漏配、重复沟通与合规风险。',
    assignedAgentName: 'IT 开通子 Agent',
    assignedAgentRolePrompt: `你是「IT 开通子 Agent」，在本步骤负责按岗位模板开通邮箱、VPN、协作套件与业务权限。

- 根据岗位与地区策略勾选权限集，生成工单并附带设备与软件清单；禁止越权申请。
- 跟踪工单状态与签收，对超时或未回写节点自动提醒责任人直至闭环。
- 为员工输出简明使用指引（首次登录、VPN、协作工具），并在异常时给出可操作的排障建议（演示）。`,
  },
  {
    tasks: [
      '按岗位映射必修与选修课程，并生成培训基地页面或清单',
      '为导师与直线经理生成待办（见面、目标对齐、首周检查点）',
      '与会议工具联动排期，避免培训与报到日程冲突',
    ],
    plugins: ['Trello', 'Notion', 'Microsoft Teams'],
    description:
      '把「培训包」从静态文档变成可跟踪的任务网络，确保新员工、导师与经理在同一节奏上完成融入动作。',
    assignedAgentName: '培训与文化子 Agent',
    assignedAgentRolePrompt: `你是「培训与文化子 Agent」，在本步骤负责把岗位映射为必修 / 选修课程与融入节奏。

- 生成培训基地页面或清单，并同步导师与直线经理的待办（见面、目标对齐、首周检查点）。
- 与会议工具联动排期，检测与报到、IT 窗口的冲突并给出改期建议。
- 记录完成度与缺席原因，供收尾审计阶段汇总（演示）。`,
  },
  {
    tasks: [
      '汇总各阶段完成度、超时与异常工单，形成健康度视图',
      '对关键节点未闭环自动提醒责任人，并支持一键升级或转派',
      '在流程结束后输出可审计的完成报告与归档摘要',
    ],
    plugins: ['Notion', 'Zapier', 'Power BI'],
    description:
      '在流程末端把执行结果数据化，便于 HR 与管理层复盘首周/首月闭环质量，并为后续流程优化提供依据。',
    assignedAgentName: '新员工入职管家 (Onboarding Concierge)',
    assignedAgentRolePrompt: `你是「新员工入职管家」，在本步骤负责全流程监督、异常升级与终态报告。

- 汇总各阶段完成度、超时与异常工单，形成健康度视图；对关键未闭环节点自动提醒并可一键升级。
- 在流程结束后输出可审计的完成报告与归档摘要，标注责任人与时间线。
- 与行政、IT、培训子 Agent 的产出对齐口径，避免重复通知与数据不一致（演示）。`,
  },
]

type PlanBlueprintToolKind =
  | 'notion'
  | 'slack'
  | 'google-drive'
  | 'google-sheets'
  | 'google-workspace'
  | 'knowledge'
  | 'gmail'
  | 'calendar'
  | 'trello'
  | 'intune'
  | 'jamf'
  | 'pdq-deploy'
  | 'zapier'
  | 'power-bi'
  | 'teams'
  | 'generic'

function planBlueprintToolKind(label: string): PlanBlueprintToolKind {
  const s = label.trim().toLowerCase()
  if (s.includes('gmail')) return 'gmail'
  if (s.includes('trello')) return 'trello'
  if (s.includes('intune')) return 'intune'
  if (s.includes('jamf')) return 'jamf'
  if (s.includes('pdq')) return 'pdq-deploy'
  if (s.includes('zapier') || s.includes('zapie')) return 'zapier'
  if (s.includes('power bi') || s.includes('powerb') || s.includes('power b')) return 'power-bi'
  if (s.includes('microsoft teams') || s === 'teams') return 'teams'
  if (s.includes('google sheets') || s.includes('google sheet')) return 'google-sheets'
  if (s.includes('calendar') || s.includes('日历')) return 'calendar'
  if (s.includes('notion')) return 'notion'
  if (s.includes('slack')) return 'slack'
  if (s.includes('google drive')) return 'google-drive'
  if (s.includes('google workspace') || (s.includes('workspace') && s.includes('google'))) return 'google-workspace'
  if (s.includes('知识') || s.includes('knowledge')) return 'knowledge'
  return 'generic'
}

/** Plan 侧栏「使用的工具」与工作流步骤插件 pill 共用图标（简化矢量，演示用） */
export function PlanBlueprintToolIcon({ label }: { label: string }) {
  const k = planBlueprintToolKind(label)
  const svg = (children: ReactNode) => (
    <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )

  switch (k) {
    case 'notion':
      return svg(
        <path
          fill="#000000"
          d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
        />,
      )
    case 'slack':
      return svg(
        <>
          <path
            fill="#E01E5A"
            d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
          />
          <path
            fill="#36C5F0"
            d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
          />
          <path
            fill="#2EB67D"
            d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
          />
          <path
            fill="#ECB22E"
            d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
          />
        </>,
      )
    case 'google-drive':
      return svg(
        <>
          <path fill="#0066DA" d="M7.66 3h8.68L24 14.5 16.34 21H7.66L0 14.5 7.66 3z" />
          <path fill="#00AC47" d="M12 3 4.5 14.5h15L12 3z" />
          <path fill="#EA4335" d="M0 14.5 7.66 21h8.68L24 14.5H0z" />
        </>,
      )
    case 'google-sheets':
      return svg(
        <>
          <path fill="#0F9D58" d="M5 2h10l4 4v16H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path fill="#34A853" d="M15 2v4h4z" />
          <path fill="#ffffff" d="M8 9h8v1.8H8zm0 3.6h8v1.8H8zm0 3.6h5.4V18H8z" />
          <path fill="#ffffff" d="M6.8 8.2h1.2v10.4H6.8zM11.4 8.2h1.2v10.4h-1.2zM16 8.2h1.2V18H16z" opacity=".18" />
        </>,
      )
    case 'gmail':
    case 'google-workspace':
      return svg(
        <>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </>,
      )
    case 'knowledge':
      return svg(
        <path
          fill="none"
          stroke="#1890ff"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        />,
      )
    case 'calendar':
      return svg(
        <path
          fill="#4285F4"
          d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z"
        />,
      )
    case 'trello':
      return svg(
        <path
          fill="#0052CC"
          d="M21.147 0H2.853A2.86 2.86 0 0 0 0 2.853v18.294A2.86 2.86 0 0 0 2.853 24h18.294A2.86 2.86 0 0 0 0024 21.147V2.853A2.86 2.86 0 0 0021.147 0zM10.34 17.287a.953.953 0 01-.953.953h-4a.954.954 0 01-.954-.953V5.38a.953.953 0 01.954-.953h4a.954.954 0 01.953.953zm9.233-5.467a.944.944 0 01-.953.947h-4a.947.947 0 01-.953-.947V5.38a.953.953 0 01.953-.953h4a.954.954 0 01.953.953z"
        />,
      )
    case 'teams':
      return svg(
        <path
          fill="#6264A7"
          d="M20.625 8.127q-.55 0-1.025-.205-.475-.205-.832-.563-.358-.357-.563-.832Q18 6.053 18 5.502q0-.54.205-1.02t.563-.837q.357-.358.832-.563.474-.205 1.025-.205.54 0 1.02.205t.837.563q.358.357.563.837.205.48.205 1.02 0 .55-.205 1.025-.205.475-.563.832-.357.358-.837.563-.48.205-1.02.205zm0-3.75q-.469 0-.797.328-.328.328-.328.797 0 .469.328.797.328.328.797.328.469 0 .797-.328.328-.328.328-.797 0-.469-.328-.797-.328-.328-.797-.328zM24 10.002v5.578q0 .774-.293 1.46-.293.685-.803 1.194-.51.51-1.195.803-.686.293-1.459.293-.445 0-.908-.105-.463-.106-.85-.329-.293.95-.855 1.729-.563.78-1.319 1.336-.756.557-1.67.861-.914.305-1.898.305-1.148 0-2.162-.398-1.014-.399-1.805-1.102-.79-.703-1.312-1.664t-.674-2.086h-5.8q-.411 0-.704-.293T0 16.881V6.873q0-.41.293-.703t.703-.293h8.59q-.34-.715-.34-1.5 0-.727.275-1.365.276-.639.75-1.114.475-.474 1.114-.75.638-.275 1.365-.275t1.365.275q.639.276 1.114.75.474.475.75 1.114.275.638.275 1.365t-.275 1.365q-.276.639-.75 1.113-.475.475-1.114.75-.638.276-1.365.276-.188 0-.375-.024-.188-.023-.375-.058v1.078h10.875q.469 0 .797.328.328.328.328.797zM12.75 2.373q-.41 0-.78.158-.368.158-.638.434-.27.275-.428.639-.158.363-.158.773 0 .41.158.78.159.368.428.638.27.27.639.428.369.158.779.158.41 0 .773-.158.364-.159.64-.428.274-.27.433-.639.158-.369.158-.779 0-.41-.158-.773-.159-.364-.434-.64-.275-.275-.639-.433-.363-.158-.773-.158zM6.937 9.814h2.25V7.94H2.814v1.875h2.25v6h1.875zm10.313 7.313v-6.75H12v6.504q0 .41-.293.703t-.703.293H8.309q.152.809.556 1.5.405.691.985 1.19.58.497 1.318.779.738.281 1.582.281.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752zm5.25-1.547v-5.203h-3.75v6.855q.305.305.691.452.387.146.809.146.469 0 .879-.176.41-.175.715-.48.304-.305.48-.715t.176-.879Z"
        />,
      )
    case 'intune':
      return svg(
        <>
          <path fill="#F25022" d="M0 0v11.408h11.408V0z" />
          <path fill="#7FBA00" d="M12.594 0v11.408H24V0z" />
          <path fill="#00A4EF" d="M0 12.594V24h11.408V12.594z" />
          <path fill="#FFB900" d="M12.594 12.594V24H24V12.594z" />
        </>,
      )
    case 'jamf':
      return svg(
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#55B548" />
          <path
            fill="#fff"
            d="M15.2 12.8c.1-2.1-1.7-3.1-2.5-3.1-.9 0-1.6.5-2 .5s-1-.5-1.9-.5c-1 .1-2.9 1.1-2.9 4.3 0 .9.3 1.9.7 2.6.4.7.9 1.3 1.5 1.3.6 0 .9-.4 1.8-.4s1.1.4 1.8.3c.7 0 1.2-.7 1.6-1.3.5-.8.7-1.6.7-1.7-.1 0-3.5-1.3-3.5-5.2z"
          />
          <path
            fill="#fff"
            d="M13.3 9.2c.5-.6.9-1.4.8-2.2-.8 0-1.7.5-2.2 1.1-.5.6-.9 1.4-.8 2.2.9.1 1.8-.4 2.2-1.1z"
          />
        </>,
      )
    case 'pdq-deploy':
      return svg(
        <path
          fill="#231F20"
          d="M18.813 7.373a4.655 4.655 0 0 0-3.323 1.354 4.621 4.621 0 0 0-1.2 2.078 4.213 4.213 0 0 0-.696-1.59 3.725 3.725 0 0 0-1.084-1.027c-.323-.2-.731-.4-1.184-.5-.479-.104-.994-.14-1.625-.14H6.707v8.891h3.502a4.493 4.493 0 0 0 1.727-.322c.502-.202.953-.51 1.324-.904.376-.409.664-.89.847-1.414.07-.191.127-.39.172-.596a4.463 4.463 0 0 0 1.237 2.09c.442.415.96.742 1.525.965a5 5 0 0 0 1.89.353c.848.001 1.654-.23 2.42-.693.206.221.492.394.858.52.397.13.813.192 1.23.187.188.004.374-.017.561-.025v-1.801c-.082-.001-.11.014-.188.013-.419 0-.744-.104-.976-.316.25-.365.447-.766.582-1.187.123-.412.185-.839.182-1.268a4.595 4.595 0 0 0-.368-1.838 4.532 4.532 0 0 0-1.017-1.482 4.888 4.888 0 0 0-3.402-1.348ZM0 7.549v8.89l2.18-.002v-2.785h.976c.633 0 1.15-.058 1.551-.173 1.117-.318 1.588-1.234 1.738-1.612.17-.41.256-.85.254-1.293a3.299 3.299 0 0 0-.267-1.332 2.7 2.7 0 0 0-1.256-1.34c-.319-.156-.746-.279-1.31-.32a11.989 11.989 0 0 0-.95-.033Zm18.81 1.824c.346-.003.689.06 1.01.188.653.259 1.098.772 1.319 1.334.127.322.19.665.187 1.011.003.227 0 .573-.308 1.32a19.46 19.46 0 0 1-.32-.372c-.24-.288-.534-.513-.91-.788-1.65-1.15-2.842-.697-3.37-.453.116-.693.389-1.24.816-1.64.428-.4.953-.6 1.577-.6Zm-16.63.174h.828c.535 0 .922.082 1.158.248.236.165.354.437.354.812 0 .698-.473 1.047-1.418 1.047H2.18zm6.8 0h.989c.695 0 1.23.214 1.605.64.375.427.56 1.04.56 1.84.001.782-.184 1.38-.554 1.793-.37.413-.912.62-1.625.62H8.98Zm8.467 3.43c.348-.003.692.075 1.004.226.242.105.467.243.668.412.227.202.432.427.615.668-.453.328-.762.337-.949.332-.455 0-.899-.142-1.27-.406a2.404 2.404 0 0 1-.869-1.086c.575-.197.792-.131.801-.146z"
        />,
      )
    case 'zapier':
      return svg(
        <path
          fill="#FF4F00"
          d="M4.157 0A4.151 4.151 0 0 0 0 4.161v15.678A4.151 4.151 0 0 0 4.157 24h15.682A4.152 4.152 0 0 0 24 19.839V4.161A4.152 4.152 0 0 0 19.839 0H4.157Zm10.61 8.761h.03a.577.577 0 0 1 .23.038.585.585 0 0 1 .201.124.63.63 0 0 1 .162.431.612.612 0 0 1-.162.435.58.58 0 0 1-.201.128.58.58 0 0 1-.23.042.529.529 0 0 1-.235-.042.585.585 0 0 1-.332-.328.559.559 0 0 1-.038-.235.613.613 0 0 1 .17-.431.59.59 0 0 1 .405-.162Zm2.853 1.572c.03.004.061.004.095.004.325-.011.646.064.937.219.238.144.431.355.552.609.128.279.189.582.185.888v.193a2 2 0 0 1 0 .219h-2.498c.003.227.075.45.204.642a.78.78 0 0 0 .646.265.714.714 0 0 0 .484-.136.642.642 0 0 0 .23-.318l.915.257a1.398 1.398 0 0 1-.28.537c-.14.159-.321.284-.521.355a2.234 2.234 0 0 1-.836.136 1.923 1.923 0 0 1-1.001-.245 1.618 1.618 0 0 1-.665-.703 2.221 2.221 0 0 1-.227-1.036 1.95 1.95 0 0 1 .48-1.398 1.9 1.9 0 0 1 1.3-.488Zm-9.607.023c.162.004.325.026.48.079.207.065.4.174.563.314.26.302.393.692.366 1.088v2.276H8.53l-.109-.711h-.065c-.064.163-.155.31-.272.439a1.122 1.122 0 0 1-.374.264 1.023 1.023 0 0 1-.453.083 1.334 1.334 0 0 1-.866-.264.965.965 0 0 1-.329-.801.993.993 0 0 1 .076-.431 1.02 1.02 0 0 1 .242-.363 1.478 1.478 0 0 1 1.043-.303h.952v-.181a.696.696 0 0 0-.136-.454.553.553 0 0 0-.438-.154.695.695 0 0 0-.378.086.48.48 0 0 0-.193.254l-.99-.144a1.26 1.26 0 0 1 .257-.563c.14-.174.321-.302.533-.378.261-.091.54-.136.82-.129.053-.003.106-.007.163-.007Zm4.384.007c.174 0 .347.038.506.114.182.083.34.211.458.374.257.423.377.911.351 1.406a2.53 2.53 0 0 1-.355 1.448 1.148 1.148 0 0 1-1.009.517c-.204 0-.401-.045-.582-.136a1.052 1.052 0 0 1-.48-.457 1.298 1.298 0 0 1-.114-.234h-.045l.004 1.784h-1.059v-4.713h.904l.117.805h.057c.068-.208.177-.401.328-.56a1.129 1.129 0 0 1 .843-.344h.076v-.004Zm7.559.084h.903l.113.805h.053a1.37 1.37 0 0 1 .235-.484.813.813 0 0 1 .313-.242.82.82 0 0 1 .39-.076h.234v1.051h-.401a.662.662 0 0 0-.313.008.623.623 0 0 0-.272.155.663.663 0 0 0-.174.26.683.683 0 0 0-.027.314v1.875h-1.054v-3.666Zm-17.515.003h3.262v.896L3.73 13.104l.034.113h1.973l.042.9H2.4v-.9l1.931-1.754-.045-.117H2.441v-.896Zm11.815 0h1.055v3.659h-1.055V10.45Zm3.443.684.019.016a.69.69 0 0 0-.351.045.756.756 0 0 0-.287.204c-.11.155-.174.336-.189.522h1.545c-.034-.526-.257-.787-.74-.787h.003Zm-5.718.163c-.026 0-.057 0-.083.004a.78.78 0 0 0-.31.053.746.746 0 0 0-.257.189 1.016 1.016 0 0 0-.204.695v.064c-.015.257.057.507.204.711a.634.634 0 0 0 .253.196.638.638 0 0 0 .314.061.644.644 0 0 0 .578-.265c.14-.223.204-.48.189-.74a1.216 1.216 0 0 0-.181-.711.677.677 0 0 0-.503-.257Zm-4.509 1.266a.464.464 0 0 0-.268.102.373.373 0 0 0-.114.276c0 .053.008.106.027.155a.375.375 0 0 0 .087.132.576.576 0 0 0 .397.11v.004a.863.863 0 0 0 .563-.182.573.573 0 0 0 .211-.457v-.14h-.903Z"
        />,
      )
    case 'power-bi':
      return svg(
        <path
          fill="#F2C811"
          d="M10 12a1 1 0 0 1 1 1v11H4a1 1 0 0 1-1-1V13a1 1 0 0 1 1-1h6Zm-2-.5V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17h-4.5V13a1.5 1.5 0 0 0-1.5-1.5H8Zm5-6V1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v22a1 1 0 0 1-1 1h-3.5V7A1.5 1.5 0 0 0 15 5.5h-2Z"
        />,
      )
    default:
      return svg(
        <path
          fill="none"
          stroke="#1890ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        />,
      )
  }
}

export function wfAssignedAgentOriginTag(agentName: string): 'new' | 'exists' {
  let h = 0
  for (let i = 0; i < agentName.length; i++) {
    h = (h * 31 + agentName.charCodeAt(i)) >>> 0
  }
  return h % 2 === 0 ? 'new' : 'exists'
}

function WfPipelineTaskCompleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WfPipelineTaskWarningIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
      <path
        d="M12 8v5M12 16h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type WorkflowItemStatus = 'complete' | 'warning'

function WfPipelineStepDetailBody({
  detail,
  taskStatuses,
  hideExistsAgentOriginLabel = false,
  hideNewAgentOriginLabel = false,
  hideTaskStatusIcons = false,
  showTaskBulletMarkers = false,
}: {
  detail: WfPipelineStepDetail
  taskStatuses?: readonly WorkflowItemStatus[]
  /** 为 true 时不展示「原有」来源标签（仅影响 exists，new 仍展示） */
  hideExistsAgentOriginLabel?: boolean
  /** 为 true 时不展示「new」来源标签（仅影响 new，原有仍展示） */
  hideNewAgentOriginLabel?: boolean
  /** 为 true 时不展示具体任务行尾部的完成/警告态图标 */
  hideTaskStatusIcons?: boolean
  /** 为 true 时在具体任务行前展示黑色圆点 */
  showTaskBulletMarkers?: boolean
}) {
  const agentOrigin = wfAssignedAgentOriginTag(detail.assignedAgentName)
  const agentOriginLabel = agentOrigin === 'new' ? 'new' : '原有'
  const agentOriginHint =
    agentOrigin === 'new'
      ? '该 Agent 为本流程中新创建的（演示）'
      : '该 Agent 引用已存在的配置（演示）'
  const showAgentOriginLabel =
    !(hideExistsAgentOriginLabel && agentOrigin === 'exists') &&
    !(hideNewAgentOriginLabel && agentOrigin === 'new')

  return (
    <div className="manus-wf-pipeline-card__detail-inner">
      <section className="manus-wf-pipeline-card__detail-block" aria-label="版块描述">
        <h4 className="manus-wf-pipeline-card__detail-section-title">版块描述</h4>
        <p className="manus-wf-pipeline-card__detail-desc">{detail.description}</p>
      </section>
      <section className="manus-wf-pipeline-card__detail-block manus-wf-assign-root" aria-label="任务分配给">
        <div className="manus-wf-assign-toolbar">
          <h4 className="manus-wf-assign-toolbar-title">任务分配给</h4>
        </div>
        <div className="manus-wf-assign-card">
          <div className="manus-wf-assign-card-name-row">
            <div className="manus-wf-assign-card-name">{detail.assignedAgentName}</div>
            {showAgentOriginLabel ? (
              <span
                className={`manus-wf-assign-card-origin manus-wf-assign-card-origin--${agentOrigin}`}
                title={agentOriginHint}
                aria-label={agentOriginHint}
              >
                {agentOriginLabel}
              </span>
            ) : null}
          </div>
          <div className="manus-wf-assign-card-prompt">{detail.assignedAgentRolePrompt}</div>
        </div>
      </section>
      <section className="manus-wf-pipeline-card__detail-block" aria-label="具体任务">
        <h4 className="manus-wf-pipeline-card__detail-section-title">具体任务</h4>
        <ul
          className={
            showTaskBulletMarkers
              ? 'manus-wf-pipeline-card__detail-tasks manus-wf-pipeline-card__detail-tasks--bullet'
              : 'manus-wf-pipeline-card__detail-tasks'
          }
        >
          {detail.tasks.map((t, taskIdx) => {
            const taskStatus = taskStatuses?.[taskIdx] ?? 'complete'
            const taskStatusLabel = taskStatus === 'complete' ? '已完成' : '未完成'
            return (
              <li
                key={t}
                className={
                  showTaskBulletMarkers
                    ? 'manus-wf-pipeline-card__detail-task-item manus-wf-pipeline-card__detail-task-item--bullet'
                    : 'manus-wf-pipeline-card__detail-task-item'
                }
              >
                <span className="manus-wf-pipeline-card__detail-task-text">{t}</span>
                {!hideTaskStatusIcons ? (
                  <span
                    className={
                      taskStatus === 'warning'
                        ? 'manus-wf-pipeline-card__detail-task-check manus-wf-pipeline-card__detail-task-check--warning'
                        : 'manus-wf-pipeline-card__detail-task-check'
                    }
                    title={taskStatusLabel}
                    aria-label={taskStatusLabel}
                  >
                    {taskStatus === 'complete' ? <WfPipelineTaskCompleteIcon /> : <WfPipelineTaskWarningIcon />}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>
      <section className="manus-wf-pipeline-card__detail-block" aria-label="使用的插件">
        <h4 className="manus-wf-pipeline-card__detail-section-title">使用的插件</h4>
        <div className="manus-wf-pipeline-card__detail-plugins">
          {detail.plugins.map((p) => (
            <span key={p} className="manus-wf-pipeline-card__detail-plugin-pill" title={p}>
              <span className="manus-wf-pipeline-card__detail-plugin-icon" aria-hidden="true">
                <PlanBlueprintToolIcon label={p} />
              </span>
              <span className="manus-wf-pipeline-card__detail-plugin-label">{p}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

function WfPipelineCardHeaderPlugins({ plugins }: { plugins: readonly string[] }) {
  if (plugins.length === 0) return null
  return (
    <div className="manus-wf-pipeline-card__step-plugins" aria-label="使用的插件">
      {plugins.map((p) => (
        <span
          key={p}
          className="manus-wf-pipeline-card__step-plugin-pill"
          title={p}
          role="img"
          aria-label={p}
        >
          <span className="manus-wf-pipeline-card__step-plugin-icon" aria-hidden="true">
            <PlanBlueprintToolIcon label={p} />
          </span>
        </span>
      ))}
    </div>
  )
}

function WfPipelineCardDropdownIcon() {
  return (
    <span className="manus-wf-pipeline-card__dropdown-icon" aria-hidden="true">
      <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true" focusable="false">
        <path
          d="M2.75 4.25L6 7.5l3.25-3.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export type WfBlueprintStepsBlockProps = {
  steps: readonly WfBlueprintStep[]
  stepDetails?: readonly WfPipelineStepDetail[]
  headingLabel?: string
  idPrefix?: string
  pipelineAriaLabel?: string
  /** 为 true 时不展示「原有」来源标签（仅影响 exists，new 仍展示） */
  hideExistsAgentOriginLabel?: boolean
  /** 为 true 时不展示「new」来源标签（仅影响 new，原有仍展示） */
  hideNewAgentOriginLabel?: boolean
  /** 为 true 时不展示具体任务行尾部的完成/警告态图标 */
  hideTaskStatusIcons?: boolean
  /** 为 true 时在具体任务行前展示黑色圆点 */
  showTaskBulletMarkers?: boolean
}

export function WfBlueprintStepsBlock({
  steps,
  stepDetails = ONBOARDING_WF_PIPELINE_STEP_DETAILS,
  headingLabel = '工作流程',
  idPrefix = 'wf',
  pipelineAriaLabel = '工作流步骤',
  hideExistsAgentOriginLabel = false,
  hideNewAgentOriginLabel = false,
  hideTaskStatusIcons = false,
  showTaskBulletMarkers = false,
}: WfBlueprintStepsBlockProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)

  useEffect(() => {
    setExpandedStepId(null)
  }, [steps])

  const toggleStepDetail = useCallback((stepId: string) => {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId))
  }, [])

  return (
    <div className="manus-wf-blueprint-editor">
      <div className="manus-wf-steps-block">
        <div className="manus-wf-steps-heading">
          <span className="manus-wf-field-label">{headingLabel}</span>
        </div>
        <div className="manus-wf-pipeline" role="list" aria-label={pipelineAriaLabel}>
          {steps.map((step, stepIdx) => {
            const isExpanded = expandedStepId === step.id
            const stepDetail = stepDetails[stepIdx]
            const detailPanelId = `${idPrefix}-step-detail-${step.id}`
            const headerId = `${idPrefix}-step-header-${step.id}`
            return (
              <Fragment key={step.id}>
                <div className="manus-wf-pipeline-connector" aria-hidden="true" />
                <div
                  className={`manus-wf-pipeline-card${isExpanded ? ' manus-wf-pipeline-card--expanded' : ''}`}
                  role="listitem"
                >
                  <div
                    id={headerId}
                    role="button"
                    tabIndex={0}
                    className="manus-wf-pipeline-card__header"
                    aria-expanded={isExpanded}
                    aria-controls={detailPanelId}
                    onClick={() => toggleStepDetail(step.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleStepDetail(step.id)
                      }
                    }}
                  >
                    <div className="manus-wf-pipeline-card__step-left">
                      <div className="manus-wf-pipeline-card__step-main">
                        <span className="manus-wf-pipeline-card__step-num">{stepIdx + 1}</span>
                        <span className="manus-wf-pipeline-card__step-title">{step.title}</span>
                      </div>
                      {stepDetail ? <WfPipelineCardHeaderPlugins plugins={stepDetail.plugins} /> : null}
                    </div>
                    <div className="manus-wf-pipeline-card__trailing">
                      <WfPipelineCardDropdownIcon />
                    </div>
                  </div>
                  {isExpanded ? (
                    <div
                      id={detailPanelId}
                      className="manus-wf-pipeline-card__detail"
                      role="region"
                      aria-labelledby={headerId}
                    >
                      {stepDetail ? (
                        <WfPipelineStepDetailBody
                          detail={stepDetail}
                          hideExistsAgentOriginLabel={hideExistsAgentOriginLabel}
                          hideNewAgentOriginLabel={hideNewAgentOriginLabel}
                          hideTaskStatusIcons={hideTaskStatusIcons}
                          showTaskBulletMarkers={showTaskBulletMarkers}
                        />
                      ) : (
                        <p className="manus-wf-pipeline-card__detail-empty">暂无该步骤的演示详情。</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
