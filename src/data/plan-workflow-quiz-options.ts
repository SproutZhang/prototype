/** Plan「入职工作流」问卷选项：与 Home.tsx 状态机 `J.c1` / `J.c2` 的 includes 判定必须一致 */

export type PlanWorkflowQuizRow = {
  id: string
  /** 提交给会话状态机的完整文案（与旧 chip 选项一致） */
  line: string
  subtitle: string
}

export const PLAN_WORKFLOW_QUIZ_SCOPE_ROWS: readonly PlanWorkflowQuizRow[] = [
  {
    id: 'wf-scope-offer',
    line: 'Offer 承接到入职日：材料、合同与账号',
    subtitle: '从录用确认到到岗日，聚焦材料、合同与账号开通',
  },
  {
    id: 'wf-scope-week',
    line: '入职周：工位、设备、培训与首次跟进',
    subtitle: '到岗首周内的工位、资产、培训与融入安排',
  },
  {
    id: 'wf-scope-full',
    line: '全流程（Offer 至首周/首月检查）',
    subtitle: '从 Offer 到首周或首月闭环与检查点',
  },
] as const

export const PLAN_WORKFLOW_QUIZ_COLLAB_ROWS: readonly PlanWorkflowQuizRow[] = [
  {
    id: 'wf-collab-hr',
    line: 'HR 发起，IT/行政按工单执行',
    subtitle: 'HR 建单，IT 与行政按工单推进并回写状态',
  },
  {
    id: 'wf-collab-parallel',
    line: '多方并行（HR / 经理 / IT / 行政）后在节点汇合',
    subtitle: '多角色并行处理后在关键节点对齐与汇合',
  },
  {
    id: 'wf-collab-self',
    line: '员工自助为主，关键节点人工审批',
    subtitle: '员工自助办理，敏感步骤保留人工审批',
  },
] as const

export const PLAN_WORKFLOW_SCOPE_CHOICE_LINES: readonly string[] = PLAN_WORKFLOW_QUIZ_SCOPE_ROWS.map((r) => r.line)

export const PLAN_WORKFLOW_COLLAB_CHOICE_LINES: readonly string[] = PLAN_WORKFLOW_QUIZ_COLLAB_ROWS.map((r) => r.line)
