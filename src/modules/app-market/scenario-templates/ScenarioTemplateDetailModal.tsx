import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { createPortal } from 'react-dom'



import { WfBlueprintStepsBlock, type WfPipelineStepDetail } from '../../../components/shared/WfBlueprintStepsBlock'

import type { AppLocale } from '../../../i18n/homeStrings'

import { appMarketT } from '../i18n/strings'

import type { AppMarketItem } from '../shared/types'

import {
  CUSTOMER_COMPLAINT_ANALYSIS_SCENARIO_TEMPLATE_ID,
  EMPLOYEE_ONBOARDING_GUIDE_SCENARIO_TEMPLATE_ID,
  GOOGLE_BUSINESS_AUTOMATION_SCENARIO_TEMPLATE_ID,
  HR_APPROVAL_COORDINATION_SCENARIO_TEMPLATE_ID,
  SLACK_1ON1_TALK_POINTS_SCENARIO_TEMPLATE_ID,
  NOTION_KNOWLEDGE_SYNC_SCENARIO_TEMPLATE_ID,
  VIRAL_CONTENT_CREATION_SCENARIO_TEMPLATE_ID,
  ZENDESK_TICKET_SUMMARY_SCENARIO_TEMPLATE_ID,
} from './data'
import { getScenarioTemplateWorkflowStepDetails } from './workflowStepDetails'

function resolveScenarioStepPlugins(item: AppMarketItem, stepIndex: number, locale: AppLocale): string[] {
  const step = item.workflowSteps?.[stepIndex]
  if (!step) return []
  return locale === 'zh'
    ? [...(step.pluginToolsZh ?? [])]
    : [...(step.pluginToolsEn ?? step.pluginToolsZh ?? [])]
}

function includesScenarioKeyword(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword))
}

function buildFallbackScenarioStepCopy(
  itemName: string,
  stepTitle: string,
  locale: AppLocale,
): Omit<WfPipelineStepDetail, 'plugins'> {
  const source = `${itemName} ${stepTitle}`.toLowerCase()

  if (includesScenarioKeyword(source, ['空间', 'workspace', 'project', 'role', '权限', 'permission', 'rbac', '治理'])) {
    if (includesScenarioKeyword(source, ['边界', '层级', '空间'])) {
      return {
        tasks:
          locale === 'zh'
            ? [
                '梳理组织、工作空间、项目之间的层级关系与责任边界',
                '对齐每一层的治理对象、默认规则与升级路径',
                '沉淀空间台账与命名规范，供后续权限配置直接引用',
              ]
            : [
                'Clarify the hierarchy and ownership boundaries across org, workspace, and project layers.',
                'Align the governed objects, default rules, and escalation paths at each layer.',
                'Produce a governance registry and naming conventions for downstream permission setup.',
              ],
        description:
          locale === 'zh'
            ? '先统一空间层级与治理边界，后续角色矩阵、成员分配与审计规则才有稳定的落点。'
            : 'Establish the hierarchy and governance boundaries first so role matrices, assignments, and audits have a stable foundation.',
        assignedAgentName: locale === 'zh' ? '空间治理规划子 Agent' : 'Space Governance Planning Sub-agent',
        assignedAgentRolePrompt:
          locale === 'zh'
            ? `你是「空间治理规划子 Agent」，负责梳理空间层级、治理对象与默认边界。

- 明确组织、工作空间、项目之间的关系与适用范围。
- 标注每层的治理对象、负责人、默认规则与升级路径。
- 输出可供后续权限与成员配置复用的治理台账。`
            : `You are the "Space Governance Planning Sub-agent" responsible for hierarchy design and boundary definition.

- Define how org, workspace, and project scopes relate to each other.
- Mark governed objects, owners, defaults, and escalation paths at each layer.
- Return a reusable governance registry for downstream permission and membership setup.`,
      }
    }

    if (includesScenarioKeyword(source, ['角色', '权限', '访问', '矩阵', '规则'])) {
      return {
        tasks:
          locale === 'zh'
            ? [
                '整理角色清单，并映射每类角色在不同空间层级下的职责范围',
                '配置访问矩阵，标注查看、编辑、审批与导出等关键动作权限',
                '输出例外规则与风险提示，避免越权、缺权或规则冲突',
              ]
            : [
                'Organize the role list and map responsibilities across hierarchy layers.',
                'Configure the access matrix for view, edit, approve, and export permissions.',
                'Document exceptions and risk notes to avoid over-permissioning or rule conflicts.',
              ],
        description:
          locale === 'zh'
            ? '把抽象权限设计收敛成可配置、可讨论的矩阵结构，便于后续真正落到成员分配与审批流程。'
            : 'Turn abstract permission ideas into a concrete matrix that can later drive assignments and approvals.',
        assignedAgentName: locale === 'zh' ? '角色权限设计子 Agent' : 'Role Permission Design Sub-agent',
        assignedAgentRolePrompt:
          locale === 'zh'
            ? `你是「角色权限设计子 Agent」，负责把治理规则翻译成可执行的角色与权限矩阵。

- 梳理角色类型、适用空间与关键动作边界。
- 输出查看、编辑、审批、导出等动作的访问矩阵。
- 标记例外场景、继承关系与风险提示，避免权限冲突。`
            : `You are the "Role Permission Design Sub-agent" translating governance rules into an executable role matrix.

- Define role types, scope coverage, and critical action boundaries.
- Produce an access matrix for view, edit, approve, and export actions.
- Mark inheritance, exceptions, and risk notes to prevent permission conflicts.`,
      }
    }

    if (includesScenarioKeyword(source, ['成员', '审批', '开通', '分配'])) {
      return {
        tasks:
          locale === 'zh'
            ? [
                '按空间与角色批量分配成员，并校验前置审批是否齐备',
                '同步开通协同工具、资源权限与待办状态，减少人工反复确认',
                '对异常开通、审批超时与角色冲突发起提醒与转派',
              ]
            : [
                'Assign members by space and role while validating prerequisite approvals.',
                'Sync collaboration tools, resource access, and task states to reduce manual checks.',
                'Trigger reminders and reroutes for failed enablement, delays, or role conflicts.',
              ],
        description:
          locale === 'zh'
            ? '把角色设计真正推进到执行层，确保成员加入空间后的开通与审批协同有状态可追。'
            : 'Move role design into execution so member onboarding, access, and approvals stay traceable.',
        assignedAgentName: locale === 'zh' ? '成员开通协同子 Agent' : 'Member Enablement Coordination Sub-agent',
        assignedAgentRolePrompt:
          locale === 'zh'
            ? `你是「成员开通协同子 Agent」，负责成员分配、审批联动与状态回写。

- 按空间和角色分配成员，校验前置审批、资源归属与生效时间。
- 协同开通工具账号、资源权限与待办任务，并同步状态。
- 对超时、失败与冲突场景提醒责任人并支持转派。`
            : `You are the "Member Enablement Coordination Sub-agent" responsible for assignments, approvals, and state sync.

- Assign members by scope and role while validating approvals and activation timing.
- Coordinate account enablement, resource access, and task state synchronization.
- Alert owners on delays, failures, and conflicts and support rerouting.`,
      }
    }

    return {
      tasks:
        locale === 'zh'
          ? [
              '聚合权限变更、审批流转与成员状态日志',
              '识别异常授权、超时节点与低频高风险操作',
              '输出空间治理健康度报表与后续优化建议',
            ]
          : [
              'Aggregate permission changes, approval logs, and membership state transitions.',
              'Identify abnormal grants, overdue nodes, and low-frequency high-risk actions.',
              'Return governance health reporting and optimization suggestions.',
            ],
      description:
        locale === 'zh'
          ? '在流程末端形成审计与复盘闭环，帮助团队判断当前空间治理设计是否稳定可扩展。'
          : 'Close the loop with auditing and review so the team can judge whether the governance model is stable and scalable.',
      assignedAgentName: locale === 'zh' ? '治理审计分析子 Agent' : 'Governance Audit Analysis Sub-agent',
      assignedAgentRolePrompt:
        locale === 'zh'
          ? `你是「治理审计分析子 Agent」，负责汇总权限变更、审计日志与治理健康度。

- 聚合关键变更、异常授权与审批超时记录。
- 识别高风险空间、冲突规则与低效协同点。
- 输出治理报表、风险摘要与后续优化建议。`
          : `You are the "Governance Audit Analysis Sub-agent" responsible for change logs, audit review, and governance health.

- Aggregate major changes, abnormal grants, and approval delays.
- Identify risky scopes, conflicting rules, and inefficient coordination patterns.
- Return governance dashboards, risk summaries, and next-step recommendations.`,
    }
  }

  if (includesScenarioKeyword(source, ['资料', '收集', '输入', 'capture', 'intake'])) {
    return {
      tasks:
        locale === 'zh'
          ? [
              '收集本阶段所需输入，并标注缺失字段、责任人与截止时间',
              '按照模板要求统一整理附件、上下文与前置条件',
              '输出可供下游节点直接引用的结构化输入清单',
            ]
          : [
              'Collect the required inputs for this phase and mark missing fields, owners, and deadlines.',
              'Normalize attachments, context, and prerequisites based on the template.',
              'Return a structured intake package for downstream steps.',
            ],
      description:
        locale === 'zh'
          ? '在执行前先统一输入口径，减少后续节点反复确认与信息缺失导致的返工。'
          : 'Normalize the inputs up front to reduce downstream rework caused by missing or inconsistent context.',
      assignedAgentName: locale === 'zh' ? '输入整理子 Agent' : 'Input Preparation Sub-agent',
      assignedAgentRolePrompt:
        locale === 'zh'
          ? `你是「输入整理子 Agent」，负责收集、核对并整理本阶段执行所需的输入信息。

- 校验关键字段、附件与前置条件是否完整。
- 标注缺失项、责任人与截止时间。
- 输出结构化输入清单，供下游节点直接引用。`
          : `You are the "Input Preparation Sub-agent" responsible for collecting and structuring the required inputs for this phase.

- Validate key fields, attachments, and prerequisites.
- Mark missing items, owners, and due dates.
- Return a structured input package for downstream steps.`,
    }
  }

  if (includesScenarioKeyword(source, ['编排', '执行', '路由', '审批', '同步', 'orchestration', 'route'])) {
    return {
      tasks:
        locale === 'zh'
          ? [
              '根据场景规则路由核心任务，并标注依赖顺序与阻塞点',
              '同步各节点执行状态、处理结果与需人工确认的事项',
              '在异常或超时场景下触发提醒、补偿或转派动作',
            ]
          : [
              'Route the core tasks based on scenario rules and mark dependencies or blockers.',
              'Sync execution states, outputs, and items that still need human confirmation.',
              'Trigger reminders, compensation flows, or reroutes on exceptions and delays.',
            ],
      description:
        locale === 'zh'
          ? '把模板中的关键动作串成可追踪的执行链路，确保每个节点都有明确的输入、输出与状态反馈。'
          : 'Turn the template into a traceable execution chain so each node has explicit inputs, outputs, and status feedback.',
      assignedAgentName: locale === 'zh' ? '流程编排子 Agent' : 'Workflow Orchestration Sub-agent',
      assignedAgentRolePrompt:
        locale === 'zh'
          ? `你是「流程编排子 Agent」，负责核心节点路由、状态同步与异常处理。

- 按规则推进任务顺序，标记阻塞点与人工确认事项。
- 同步各节点状态、输出结果与异常原因。
- 对超时、失败与冲突场景触发提醒、补偿或转派。`
          : `You are the "Workflow Orchestration Sub-agent" responsible for routing, state sync, and exception handling.

- Advance task order by rule and mark blockers or human checkpoints.
- Sync node states, outputs, and exception reasons.
- Trigger reminders, compensation, or reroutes for delays, failures, and conflicts.`,
    }
  }

  if (includesScenarioKeyword(source, ['结果', '复盘', '健康', '审计', 'report', 'review', 'close'])) {
    return {
      tasks:
        locale === 'zh'
          ? [
              '汇总本轮执行结果、异常记录与关键时间线',
              '对比目标与实际完成度，标注待补项与风险残留',
              '输出复盘摘要、健康度结论与下一步推进建议',
            ]
          : [
              'Summarize execution results, exceptions, and the key timeline from this run.',
              'Compare planned goals against actual completion and mark remaining risks.',
              'Return a review summary, health conclusion, and next-step recommendations.',
            ],
      description:
        locale === 'zh'
          ? '把执行数据沉淀为可复盘、可追踪的结果视图，方便后续优化模板与协同方式。'
          : 'Convert execution data into a reviewable and traceable result view for future template improvements.',
      assignedAgentName: locale === 'zh' ? '结果复盘子 Agent' : 'Outcome Review Sub-agent',
      assignedAgentRolePrompt:
        locale === 'zh'
          ? `你是「结果复盘子 Agent」，负责汇总执行结果、异常记录与后续动作建议。

- 汇总关键结果、异常与时间线。
- 对比目标与实际完成度，标记待补项和风险残留。
- 输出复盘摘要、健康结论与下一步计划。`
          : `You are the "Outcome Review Sub-agent" responsible for summaries, exceptions, and follow-up recommendations.

- Consolidate key outcomes, exceptions, and timelines.
- Compare goals against actual completion and mark residual risks.
- Return a review summary, health conclusion, and next-step plan.`,
    }
  }

  return {
    tasks:
      locale === 'zh'
        ? [
            `围绕“${stepTitle}”梳理当前阶段的输入信息、责任人和前置依赖`,
            `推进《${itemName}》在该节点的核心处理动作，并同步执行状态`,
            '输出供下游节点继续消费的结构化结果、风险提示与建议动作',
          ]
        : [
            `Clarify the inputs, owners, and dependencies for "${stepTitle}".`,
            `Advance the core work of "${itemName}" at this node and sync execution status.`,
            'Return structured outputs, risk notes, and recommended next actions for downstream steps.',
          ],
    description:
      locale === 'zh'
        ? `该步骤用于说明“${stepTitle}”在当前场景中的职责边界、交付结果与上下游衔接方式。`
        : `This step explains the role, deliverables, and handoff model of "${stepTitle}" in the current scenario.`,
    assignedAgentName:
      locale === 'zh'
        ? `${stepTitle}子 Agent`
        : `${stepTitle} Sub-agent`,
    assignedAgentRolePrompt:
      locale === 'zh'
        ? `你是「${stepTitle}子 Agent」，负责当前步骤的执行推进与结果整理。

- 识别当前步骤所需输入与约束条件。
- 完成本节点处理，并同步关键状态与异常提示。
- 输出供下游节点继续使用的结构化结果。`
        : `You are the "${stepTitle} Sub-agent" responsible for this step's execution and output packaging.

- Identify required inputs and constraints for this step.
- Complete the step and sync key states and exceptions.
- Return structured outputs that downstream steps can directly consume.`,
  }
}

function buildFallbackScenarioStepDetails(item: AppMarketItem, locale: AppLocale): WfPipelineStepDetail[] {
  const itemName = locale === 'zh' ? item.nameZh : item.nameEn
  const workflowSteps = item.workflowSteps ?? []

  return workflowSteps.map((step, stepIndex) => {
    const stepTitle = locale === 'zh' ? step.titleZh : step.titleEn
    const plugins = resolveScenarioStepPlugins(item, stepIndex, locale)
    const copy = buildFallbackScenarioStepCopy(itemName, stepTitle, locale)

    return { ...copy, plugins }
  })
}

function scenarioTemplateHidesAgentOriginLabels(templateId: string): boolean {
  return (
    templateId === EMPLOYEE_ONBOARDING_GUIDE_SCENARIO_TEMPLATE_ID ||
    templateId === HR_APPROVAL_COORDINATION_SCENARIO_TEMPLATE_ID ||
    templateId === GOOGLE_BUSINESS_AUTOMATION_SCENARIO_TEMPLATE_ID ||
    templateId === SLACK_1ON1_TALK_POINTS_SCENARIO_TEMPLATE_ID ||
    templateId === CUSTOMER_COMPLAINT_ANALYSIS_SCENARIO_TEMPLATE_ID ||
    templateId === VIRAL_CONTENT_CREATION_SCENARIO_TEMPLATE_ID ||
    templateId === NOTION_KNOWLEDGE_SYNC_SCENARIO_TEMPLATE_ID ||
    templateId === ZENDESK_TICKET_SUMMARY_SCENARIO_TEMPLATE_ID
  )
}



type ScenarioTemplateDetailModalProps = {

  locale: AppLocale

  item: AppMarketItem

  onClose: () => void

  onUseTemplate: () => void

}



type UseTemplatePhase = 'idle' | 'loading' | 'success'



const USE_TEMPLATE_LOADING_MS = 2000

const USE_TEMPLATE_SUCCESS_TOAST_MS = 3200



function ModalCloseIcon() {

  return (

    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">

      <path

        d="M18 6L6 18M6 6l12 12"

        fill="none"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

      />

    </svg>

  )

}



export function ScenarioTemplateDetailModal({

  locale,

  item,

  onClose,

  onUseTemplate,

}: ScenarioTemplateDetailModalProps) {

  const reactId = useId()

  const titleId = `${reactId}-scenario-template-modal-title`

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const successToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [usePhase, setUsePhase] = useState<UseTemplatePhase>('idle')

  const [successToastOpen, setSuccessToastOpen] = useState(false)



  const name = locale === 'zh' ? item.nameZh : item.nameEn

  const description =

    locale === 'zh'

      ? (item.modalDescriptionZh ?? item.descriptionZh)

      : (item.modalDescriptionEn ?? item.descriptionEn)

  const workflowSteps = item.workflowSteps ?? []

  const stepDetails = useMemo(() => {
    const staticStepDetails = getScenarioTemplateWorkflowStepDetails(item.id) ?? []
    if (staticStepDetails.length > 0) return staticStepDetails
    return buildFallbackScenarioStepDetails(item, locale)
  }, [item, locale])

  const wfSteps = useMemo(

    () =>

      workflowSteps.map((step) => ({

        id: step.id,

        title: locale === 'zh' ? step.titleZh : step.titleEn,

      })),

    [workflowSteps, locale],

  )



  const clearSuccessToastTimer = () => {

    if (successToastTimerRef.current) {

      clearTimeout(successToastTimerRef.current)

      successToastTimerRef.current = null

    }

  }



  const showSuccessToast = () => {

    setSuccessToastOpen(true)

    clearSuccessToastTimer()

    successToastTimerRef.current = setTimeout(() => {

      setSuccessToastOpen(false)

      successToastTimerRef.current = null

    }, USE_TEMPLATE_SUCCESS_TOAST_MS)

  }



  useEffect(() => {

    return () => {

      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)

      clearSuccessToastTimer()

    }

  }, [item.id])



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if (e.key === 'Escape' && usePhase !== 'loading') onClose()

    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)

  }, [onClose, usePhase])



  useEffect(() => {

    const prev = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {

      document.body.style.overflow = prev

    }

  }, [])



  const handleUseTemplate = () => {

    if (usePhase === 'loading') return

    setUsePhase('loading')

    loadingTimerRef.current = setTimeout(() => {

      onUseTemplate()

      setUsePhase('success')

      showSuccessToast()

      loadingTimerRef.current = null

    }, USE_TEMPLATE_LOADING_MS)

  }



  const useTemplateLabel =

    usePhase === 'loading'

      ? appMarketT(locale, 'useTemplateCreating')

      : usePhase === 'success'

        ? appMarketT(locale, 'useTemplateAgain')

        : appMarketT(locale, 'useTemplate')



  const useTemplateBtnClass =

    usePhase === 'success'

      ? 'app-market-template-modal-btn app-market-template-modal-btn--ghost'

      : 'app-market-template-modal-btn app-market-template-modal-btn--primary'



  const successToast =

    successToastOpen && usePhase === 'success'

      ? createPortal(

          <div className="app-market-template-success-toast" role="status" aria-live="polite">

            <span className="app-market-template-success-toast__icon" aria-hidden="true">

              ✓

            </span>

            <div className="app-market-template-success-toast__text">

              <strong className="app-market-template-success-toast__title">

                {appMarketT(locale, 'useTemplateSuccessTitle')}

              </strong>

              <span className="app-market-template-success-toast__sub">

                {appMarketT(locale, 'useTemplateSuccessSub')}

              </span>

            </div>

          </div>,

          document.body,

        )

      : null



  return createPortal(

    <>

      {successToast}

      <div className="app-market-template-modal-root" role="presentation">

        <button

          type="button"

          className="app-market-template-modal-backdrop"

          aria-label={appMarketT(locale, 'modalClose')}

          onClick={onClose}

          disabled={usePhase === 'loading'}

        />

        <div

          className="app-market-template-modal-panel"

          role="dialog"

          aria-modal="true"

          aria-labelledby={titleId}

          onClick={(e) => e.stopPropagation()}

        >

          <div className="app-market-template-modal-header">

            <h2 id={titleId} className="app-market-template-modal-title">

              {name}

            </h2>

            <button

              type="button"

              className="app-market-template-modal-close"

              aria-label={appMarketT(locale, 'modalClose')}

              onClick={onClose}

              disabled={usePhase === 'loading'}

            >

              <ModalCloseIcon />

            </button>

          </div>



          <div className="app-market-template-modal-body">

            <div className="app-market-template-modal-content">

              <div className="app-market-template-modal-intro">

                <p className="app-market-template-modal-desc">{description}</p>

              </div>



              {wfSteps.length > 0 ? (

                <WfBlueprintStepsBlock

                  key={item.id}

                  steps={wfSteps}

                  stepDetails={stepDetails}

                  idPrefix={reactId}

                  headingLabel={appMarketT(locale, 'scenarioWorkflow')}

                  pipelineAriaLabel={locale === 'zh' ? '工作流步骤' : 'Workflow steps'}

                  hideExistsAgentOriginLabel={scenarioTemplateHidesAgentOriginLabels(item.id)}
                  hideNewAgentOriginLabel={scenarioTemplateHidesAgentOriginLabels(item.id)}
                  hideTaskStatusIcons
                  showTaskBulletMarkers

                />

              ) : null}

            </div>

          </div>



          <div className="app-market-template-modal-footer">

            <button

              type="button"

              className={`${useTemplateBtnClass}${usePhase === 'loading' ? ' is-loading' : ''}`}

              disabled={usePhase === 'loading'}

              aria-busy={usePhase === 'loading'}

              onClick={handleUseTemplate}

            >

              {usePhase === 'loading' ? (

                <span className="app-market-template-modal-btn-spinner" aria-hidden="true" />

              ) : null}

              {useTemplateLabel}

            </button>

          </div>

        </div>

      </div>

    </>,

    document.body,

  )

}



export function hasScenarioTemplateDetailModal(item: AppMarketItem): boolean {
  if (item.productLine !== 'scenario-templates') return false
  const stepCount = item.workflowSteps?.length ?? 0
  return stepCount > 0
}


