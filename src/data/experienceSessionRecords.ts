import {
  createInitialExecutionVisibility,
  createJoyceExperienceInitialSnapshot,
  type ExecutionVisibilityState,
  type ExperienceMessage,
  type JoyceExperienceSnapshot,
} from '../components/shared/JoyceExperienceTab'
import { createDefaultIciFlowContext } from './experienceIciOnboardingFlow'
import type { SharedOnboardingTriggerKind } from '../types/onboardingTrigger'

export type ExperienceSessionRecord = {
  id: string
  title: string
  experiencedAt: string
  updatedAt: string
  snapshot: JoyceExperienceSnapshot
}

function withExecutionVisibility(overrides: Partial<ExecutionVisibilityState>): ExecutionVisibilityState {
  return {
    ...createInitialExecutionVisibility(),
    ...overrides,
  }
}

function finalizeSeq(messages: ExperienceMessage[]) {
  return messages.reduce((max, message) => {
    const match = message.id.match(/joyce-exp-(\d+)/)
    if (!match) return max
    return Math.max(max, Number(match[1]))
  }, 0)
}

function syncSeededSummaryMessages(
  messages: ExperienceMessage[],
  snapshot: Pick<JoyceExperienceSnapshot, 'employeeDraft' | 'deviceDraft'>,
): ExperienceMessage[] {
  return messages.map((message) => {
    if (message.kind !== 'summary') return message

    if (message.title === '信息收集摘要') {
      return {
        ...message,
        items: [
          { label: '姓名', value: snapshot.employeeDraft.fullName },
          { label: '邮箱', value: snapshot.employeeDraft.email },
          { label: '部门', value: snapshot.employeeDraft.department },
        ],
      }
    }

    if (message.title === '任务已创建') {
      return {
        ...message,
        items: [
          { label: '任务数量', value: '3 项跟进任务' },
          { label: '负责人', value: '业务负责人 / 执行同学 / 协作支持' },
          { label: '下一步', value: '进入邮件发送' },
        ],
      }
    }

    if (message.title === '任务已更新') {
      return {
        ...message,
        items: [
          { label: '收件人', value: snapshot.deviceDraft.receiver },
          { label: '手机号', value: snapshot.deviceDraft.mobile },
          { label: '详细地址', value: snapshot.deviceDraft.address },
        ],
      }
    }

    return message
  })
}

function buildSnapshot(
  onboardingTrigger: SharedOnboardingTriggerKind,
  sessionId: string,
  overrides: Partial<JoyceExperienceSnapshot>,
): JoyceExperienceSnapshot {
  const base = createJoyceExperienceInitialSnapshot(onboardingTrigger, sessionId)
  const snapshot = {
    ...base,
    ...overrides,
  }
  return {
    ...snapshot,
    messages: syncSeededSummaryMessages(snapshot.messages ?? [], snapshot),
    nextMessageSeq: snapshot.nextMessageSeq ?? finalizeSeq(snapshot.messages ?? []),
  }
}

export function createSeededExperienceSessionRecords(
  onboardingTrigger: SharedOnboardingTriggerKind,
): ExperienceSessionRecord[] {
  const caseActiveMessages: ExperienceMessage[] = [
    { id: 'joyce-exp-1', kind: 'user', text: '你好，我想发起一个新的协作流程。' },
    {
      id: 'joyce-exp-2',
      kind: 'agent',
      agentId: 'hr',
      text: '你好，我是信息收集智能体，接下来需要你提供以下新员工的入职信息：新员工姓名、新员工邮箱、入职类型（全职/兼职/实习/合同工/Postee）、入职日期、是否远程办公、部门、直属经理、招聘负责人。',
    },
    {
      id: 'joyce-exp-3',
      kind: 'task',
      agentId: 'hr',
      taskKey: 'hr',
      title: '填写基础信息',
      description: '请核对姓名、出生日期、联系方式和现居住地址，确认后即可进入案件创建阶段。',
      statusLabel: '已完成',
      note: '预计耗时约 2-3 分钟，完成后系统会自动推进到创建案件并追踪进度。',
      actions: [
        { id: 'hr-start', label: '开始填写', primary: true },
        { id: 'hr-later', label: '稍后填写' },
      ],
    },
    { id: 'joyce-exp-4', kind: 'user', text: '姓名：王启航，邮箱：tech.workapp@infosysaai.com，入职类型：全职，入职日期：2026-07-20，是否远程办公：否，部门：产品研发部，直属经理：张梦雅，招聘负责人：俞旻莎' },
    {
      id: 'joyce-exp-4b',
      kind: 'agent',
      agentId: 'hr',
      text: '我已经收到你提供的信息，正在核对并整理中，请稍等。如果有缺失，我会继续向你询问缺失项。',
    },
    {
      id: 'joyce-exp-6',
      kind: 'summary',
      agentId: 'hr',
      title: '信息收集摘要',
      items: [
        { label: '姓名', value: '王启航' },
        { label: '邮箱', value: 'tech.workapp@infosysaai.com' },
        { label: '部门', value: '产品研发部' },
      ],
    },
    {
      id: 'joyce-exp-7',
      kind: 'handoff',
      from: 'hr',
      to: 'it',
      title: '信息收集 -> 创建案件并追踪进度',
      hint: '基础信息已收集完成，可以进入案件创建与进度追踪阶段。',
    },
    {
      id: 'joyce-exp-8',
      kind: 'agent',
      agentId: 'it',
      text: '您好，我是创建案件并追踪进度 Agent。我会基于已收集的信息创建案件，并生成可追踪的进度视图。',
    },
    {
      id: 'joyce-exp-9',
      kind: 'task',
      agentId: 'it',
      taskKey: 'it',
      title: '创建案件并确认追踪方案',
      description: '默认案件模板已准备好。你可以直接确认创建，或者补充案件说明与优先级。',
      statusLabel: '进行中',
      note: '确认后系统会自动把任务交接给创建任务 Agent。',
      actions: [
        { id: 'it-confirm-default', label: '确认创建案件', primary: true },
        { id: 'it-open-extra', label: '补充案件说明' },
      ],
    },
  ]

  const taskActiveMessages: ExperienceMessage[] = [
    ...caseActiveMessages.slice(0, -1),
    {
      id: 'joyce-exp-9',
      kind: 'task',
      agentId: 'it',
      taskKey: 'it',
      title: '创建案件并确认追踪方案',
      description: '默认案件模板已准备好。你可以直接确认创建，或者补充案件说明与优先级。',
      statusLabel: '已完成',
      note: '确认后系统会自动把任务交接给创建任务 Agent。',
      actions: [
        { id: 'it-confirm-default', label: '确认创建案件', primary: true },
        { id: 'it-open-extra', label: '补充案件说明' },
      ],
    },
    {
      id: 'joyce-exp-10',
      kind: 'summary',
      agentId: 'it',
      title: '案件已创建',
      items: [
        { label: '案件编号', value: 'CASE-2026-0512-001' },
        { label: '当前状态', value: '已进入进度追踪' },
        { label: '下一步', value: '进入任务创建' },
      ],
    },
    {
      id: 'joyce-exp-11',
      kind: 'handoff',
      from: 'it',
      to: 'device',
      title: '创建案件并追踪进度 -> 创建任务',
      hint: '案件已创建并进入追踪，可以开始拆解后续执行任务。',
    },
    {
      id: 'joyce-exp-12',
      kind: 'agent',
      agentId: 'device',
      text: '您好，我是创建任务 Agent。我会根据案件拆解后续执行任务，并安排负责人、截止时间和执行说明。',
    },
    {
      id: 'joyce-exp-13',
      kind: 'task',
      agentId: 'device',
      taskKey: 'device',
      title: '创建跟进任务',
      description: '请确认任务清单与负责人安排；如需调整，可以直接修改后再继续。',
      statusLabel: '进行中',
      note: '确认后系统会继续推进到发送邮件阶段。',
      actions: [
        { id: 'device-confirm-address', label: '确认任务清单', primary: true },
        { id: 'device-edit-address', label: '调整任务' },
      ],
    },
  ]

  const completedMessages: ExperienceMessage[] = [
    ...taskActiveMessages.slice(0, -1),
    {
      id: 'joyce-exp-13',
      kind: 'task',
      agentId: 'device',
      taskKey: 'device',
      title: '创建跟进任务',
      description: '请确认任务清单与负责人安排；如需调整，可以直接修改后再继续。',
      statusLabel: '已完成',
      note: '确认后系统会继续推进到发送邮件阶段。',
      actions: [
        { id: 'device-confirm-address', label: '确认任务清单', primary: true },
        { id: 'device-edit-address', label: '调整任务' },
      ],
    },
    {
      id: 'joyce-exp-14',
      kind: 'summary',
      agentId: 'device',
      title: '任务已创建',
      items: [
        { label: '任务数量', value: '3 项跟进任务' },
        { label: '负责人', value: '业务负责人 / 执行同学 / 协作支持' },
        { label: '下一步', value: '进入邮件发送' },
      ],
    },
    {
      id: 'joyce-exp-15',
      kind: 'handoff',
      from: 'device',
      to: 'followup',
      title: '创建任务 -> 发送邮件',
      hint: '任务清单已确认，流程可以进入邮件通知阶段。',
    },
    {
      id: 'joyce-exp-16',
      kind: 'agent',
      agentId: 'followup',
      text: '您好，我是发送邮件 Agent。我会汇总前序结果，生成通知邮件并发送给相关干系人。',
    },
    {
      id: 'joyce-exp-17',
      kind: 'summary',
      agentId: 'followup',
      title: '邮件发送预览',
      items: [
        { label: '收件人', value: '业务负责人 / 执行同学 / 相关协作方' },
        { label: '邮件主题', value: '【流程通知】信息收集、案件与任务已全部完成' },
        { label: '发送状态', value: '已发送' },
      ],
    },
    {
      id: 'joyce-exp-18',
      kind: 'agent',
      agentId: 'followup',
      text: `🎉 全流程已经顺利完成。
📝 信息收集结果已归档
📂 案件已创建并进入追踪
✅ 跟进任务已生成并分配
📧 通知邮件已发送给相关干系人
如需查看案件进度或任务详情，可以继续在这里提问。`,
    },
  ]

  const records: ExperienceSessionRecord[] = [
    {
      id: 'record-2026-05-09',
      title: '林若溪的协作体验',
      experiencedAt: '2026-05-09 14:30',
      updatedAt: '2026-05-09 15:08',
      snapshot: buildSnapshot(onboardingTrigger, 'record-session-2026-05-09', {
        iciFlowStepId: 'prep-it-email',
        iciFlowContext: createDefaultIciFlowContext({
          employeeName: '林若溪',
          employeeEmail: 'linruoxi@company.com',
          department: '产品研发部',
        }),
        iciFlowCompleted: false,
        progress: {
          personal: 'completed',
          account: 'completed',
          device: 'active',
          culture: 'completed',
          followup: 'pending',
        },
        messages: taskActiveMessages,
        employeeDraft: {
          fullName: '林若溪',
          email: 'linruoxi@company.com',
          employmentType: 'fulltime',
          startDate: '2026-07-20',
          isRemote: '否',
          department: '产品研发部',
          directManager: '张梦雅',
          recruiter: '俞旻莎',
        },
        deviceDraft: {
          receiver: '林若溪',
          mobile: '13800002222',
          address: '上海市浦东新区张江路 88 号',
        },
        executionVisibility: withExecutionVisibility({
          hr: { revealed: true, revealedStepCount: 2, showHandover: true },
          it: { revealed: true, revealedStepCount: 2, showHandover: true },
          device: { revealed: true, revealedStepCount: 1, showHandover: false },
        }),
      }),
    },
    {
      id: 'record-2026-05-08',
      title: '陈思涵的协作体验',
      experiencedAt: '2026-05-08 10:05',
      updatedAt: '2026-05-08 10:49',
      snapshot: buildSnapshot(onboardingTrigger, 'record-session-2026-05-08', {
        bootstrapped: true,
        stage: 'followup',
        currentAgentId: 'followup',
        iciFlowStepId: 'completed',
        iciFlowContext: createDefaultIciFlowContext({
          employeeName: '陈思涵',
          employeeEmail: 'chensihan@company.com',
          department: '产品研发部',
        }),
        iciFlowCompleted: true,
        progress: {
          personal: 'completed',
          account: 'completed',
          device: 'completed',
          culture: 'completed',
          followup: 'completed',
        },
        messages: completedMessages,
        employeeDraft: {
          fullName: '陈思涵',
          email: 'chensihan@company.com',
          employmentType: 'fulltime',
          startDate: '2026-07-20',
          isRemote: '否',
          department: '产品研发部',
          directManager: '张梦雅',
          recruiter: '俞旻莎',
        },
        executionVisibility: withExecutionVisibility({
          hr: { revealed: true, revealedStepCount: 2, showHandover: true },
          it: { revealed: true, revealedStepCount: 2, showHandover: true },
          device: { revealed: true, revealedStepCount: 2, showHandover: true },
          followup: { revealed: true, revealedStepCount: 1, showHandover: false },
        }),
      }),
    },
    {
      id: 'record-2026-05-07',
      title: '王启航的协作体验',
      experiencedAt: '2026-05-07 16:42',
      updatedAt: '2026-05-07 17:03',
      snapshot: buildSnapshot(onboardingTrigger, 'record-session-2026-05-07', {
        iciFlowStepId: 'case-register',
        iciFlowContext: createDefaultIciFlowContext({ employeeName: '王启航', employeeEmail: 'tech.workapp@infosysaai.com' }),
        iciFlowCompleted: false,
        bootstrapped: true,
        stage: 'it',
        currentAgentId: 'it',
        progress: {
          personal: 'completed',
          account: 'active',
          device: 'pending',
          culture: 'pending',
          followup: 'pending',
        },
        messages: caseActiveMessages,
        employeeDraft: {
          fullName: '王启航',
          email: 'tech.workapp@infosysaai.com',
          employmentType: 'fulltime',
          startDate: '2026-07-20',
          isRemote: '否',
          department: '产品研发部',
          directManager: '张梦雅',
          recruiter: '俞旻莎',
        },
        progressPercentOverride: 50,
        executionVisibility: withExecutionVisibility({
          hr: { revealed: true, revealedStepCount: 2, showHandover: true },
          it: { revealed: true, revealedStepCount: 1, showHandover: false },
        }),
      }),
    },
  ]

  return records
}
