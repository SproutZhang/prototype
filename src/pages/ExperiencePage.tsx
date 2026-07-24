import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  JoyceExperienceTab,
  createJoyceExperienceInitialSnapshot,
  type JoyceExperienceSnapshot,
} from '../components/shared/JoyceExperienceTab'
import {
  EXPERIENCE_SIDEBAR_AGENTS,
  EXPERIENCE_SIDEBAR_AVATAR_MAP,
  mapRuntimeAgentToSidebarAgent,
  type ExperienceSidebarAgentId,
} from '../data/experienceAvatars'
import { useLocale } from '../i18n/LocaleContext'
import {
  createSeededExperienceSessionRecords,
  type ExperienceSessionRecord,
} from '../data/experienceSessionRecords'
import type { Agent } from '../types/agent'
import { buildIciProgressSteps } from '../data/experienceIciOnboardingFlow'
import type { SharedOnboardingTriggerKind } from '../types/onboardingTrigger'

type ExperiencePageProps = {
  agents: Agent[]
  onboardingTrigger: SharedOnboardingTriggerKind
  detailTitle?: string
  onBack?: () => void
}

type ExperienceAgent = {
  id: ExperienceSidebarAgentId
  name: string
  role?: string
  avatar: string
  isManager?: boolean
}

type ExperienceProgressStatus = 'completed' | 'active' | 'pending'

type ExperienceFlowStep = {
  id: string
  label: string
  status: ExperienceProgressStatus
  agentName?: string
  kind?: 'default' | 'approval' | 'branch'
  approvalMeta?: {
    approver: string
    time: string
    result: 'approved' | 'rejected' | null
  }
  branchMeta?: {
    paths: Array<{ id: string; label: string }>
    selectedPathId: string | null
  }
}

type ExperienceRecordSummary = {
  id: string
  experiencedAt: string
  updatedAt: string
  experiencer: string
  statusLabel: string
  currentStage: string
  preview: string
  completionRate: number
  progressedCount: number
  totalCount: number
  highlights: string[]
}

type ActiveRuntimeSession = {
  runtimeSessionId: string
  boundRecordId: string | null
  sourceSnapshot: JoyceExperienceSnapshot
  workingSnapshot: JoyceExperienceSnapshot
  status: 'hydrating' | 'ready'
  dirty: boolean
}

const EXPERIENCE_STAGE_LABELS: Record<JoyceExperienceSnapshot['stage'], Record<'zh' | 'en', string>> = {
  welcome: { zh: '等待开始体验', en: 'Waiting to start' },
  hr: { zh: '信息收集', en: 'Information collection' },
  it: { zh: '创建案件并追踪进度', en: 'Case creation and tracking' },
  device: { zh: '创建任务', en: 'Task creation' },
  culture: { zh: '创建任务', en: 'Task creation' },
  followup: { zh: '发送邮件', en: 'Send email' },
  schedule: { zh: '日程创建', en: 'Schedule creation' },
}

const TRIGGER_LABELS: Record<SharedOnboardingTriggerKind, Record<'zh' | 'en', string>> = {
  chat: { zh: '聊天触发', en: 'Chat trigger' },
  scheduled: { zh: '定时触发', en: 'Scheduled trigger' },
  form: { zh: '表单触发', en: 'Form trigger' },
}

function formatExperienceRecordTime(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function getExperienceStageLabel(stage: JoyceExperienceSnapshot['stage'], locale: 'zh' | 'en') {
  return EXPERIENCE_STAGE_LABELS[stage][locale]
}

function getTriggerLabel(trigger: SharedOnboardingTriggerKind, locale: 'zh' | 'en') {
  return TRIGGER_LABELS[trigger][locale]
}

function hasStartedOnboardingFlow(snapshot: JoyceExperienceSnapshot) {
  return snapshot.stage !== 'welcome' || Object.values(snapshot.progress).some((status) => status !== 'pending')
}

function cloneExperienceSnapshot(snapshot: JoyceExperienceSnapshot): JoyceExperienceSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as JoyceExperienceSnapshot
}

function areSnapshotsEqual(left: JoyceExperienceSnapshot | null, right: JoyceExperienceSnapshot | null) {
  if (!left || !right) return false
  return JSON.stringify(left) === JSON.stringify(right)
}

function createRuntimeSession(
  runtimeSessionId: string,
  snapshot: JoyceExperienceSnapshot,
  boundRecordId: string | null,
): ActiveRuntimeSession {
  return {
    runtimeSessionId,
    boundRecordId,
    sourceSnapshot: cloneExperienceSnapshot(snapshot),
    workingSnapshot: cloneExperienceSnapshot(snapshot),
    status: 'hydrating',
    dirty: false,
  }
}

function createSessionRecord(
  snapshot: JoyceExperienceSnapshot,
  locale: 'zh' | 'en',
  experiencedAt = formatExperienceRecordTime(new Date()),
): ExperienceSessionRecord {
  const createdAt = formatExperienceRecordTime(new Date())
  return {
    id: `record-live-${Date.now()}`,
    title:
      locale === 'zh'
        ? `${snapshot.employeeDraft.fullName || snapshot.triggerFormDraft.fullName || '当前体验用户'} 的入职体验`
        : `${snapshot.employeeDraft.fullName || snapshot.triggerFormDraft.fullName || 'Current user'} onboarding experience`,
    experiencedAt,
    updatedAt: createdAt,
    snapshot,
  }
}

function buildExperienceRecordSummary(record: ExperienceSessionRecord, locale: 'zh' | 'en'): ExperienceRecordSummary {
  const { snapshot } = record
  const progressEntries = Object.entries(snapshot.progress) as [keyof JoyceExperienceSnapshot['progress'], ExperienceProgressStatus][]
  const completedCount = progressEntries.filter(([, status]) => status === 'completed').length
  const activeCount = progressEntries.filter(([, status]) => status === 'active').length
  const progressedCount = completedCount + activeCount
  const totalCount = progressEntries.length
  const completionRate =
    snapshot.progressPercentOverride ?? Math.round(((completedCount + activeCount * 0.5) / totalCount) * 100)
  const experiencer = snapshot.employeeDraft.fullName || snapshot.triggerFormDraft.fullName || (locale === 'zh' ? '当前体验用户' : 'Current user')
  const currentStage =
    snapshot.progress.followup === 'completed'
      ? locale === 'zh'
        ? '已完成归档'
        : 'Archived'
      : snapshot.bootstrapped
        ? getExperienceStageLabel(snapshot.stage, locale)
        : locale === 'zh'
          ? `待通过${getTriggerLabel(snapshot.onboardingTrigger, locale)}启动`
          : `Waiting for ${getTriggerLabel(snapshot.onboardingTrigger, locale)}`
  const statusLabel =
    snapshot.progress.followup === 'completed'
      ? locale === 'zh'
        ? '已完成'
        : 'Completed'
      : snapshot.bootstrapped
        ? activeCount > 0
          ? locale === 'zh'
            ? '进行中'
            : 'In progress'
          : locale === 'zh'
            ? '待开始'
            : 'Not started'
        : locale === 'zh'
          ? '待触发'
          : 'Pending trigger'
  const highlights = [
    locale === 'zh'
      ? `${getTriggerLabel(snapshot.onboardingTrigger, locale)}已配置`
      : `${getTriggerLabel(snapshot.onboardingTrigger, locale)} configured`,
    snapshot.progress.personal !== 'pending'
      ? locale === 'zh'
        ? `已同步姓名 ${snapshot.employeeDraft.fullName}`
        : `Name synced: ${snapshot.employeeDraft.fullName}`
      : null,
    snapshot.progress.account !== 'pending'
      ? locale === 'zh'
        ? '账号权限方案已进入处理链路'
        : 'Account access plan is in progress'
      : null,
    snapshot.progress.device !== 'pending'
      ? locale === 'zh'
        ? `设备地址已绑定为 ${snapshot.deviceDraft.address}`
        : `Device address bound to ${snapshot.deviceDraft.address}`
      : null,
    snapshot.viewedCultureModuleIds.length > 0
      ? locale === 'zh'
        ? `已浏览 ${snapshot.viewedCultureModuleIds.length} 个文化模块`
        : `${snapshot.viewedCultureModuleIds.length} culture modules viewed`
      : null,
  ].filter(Boolean) as string[]
  const preview = snapshot.bootstrapped
    ? locale === 'zh'
      ? `当前体验由${getTriggerLabel(snapshot.onboardingTrigger, locale)}启动，已推进到 ${progressedCount}/${totalCount} 个流程节点，当前处于「${currentStage}」，点击后可恢复该时点的对话与表单状态并继续执行。`
      : `This experience started with ${getTriggerLabel(snapshot.onboardingTrigger, locale)} and has progressed through ${progressedCount}/${totalCount} flow steps. Current stage: "${currentStage}". Click to resume the conversation and forms from this point.`
    : locale === 'zh'
      ? `当前体验尚未正式启动，已预填体验人 ${experiencer}，等待通过${getTriggerLabel(snapshot.onboardingTrigger, locale)}进入 onboarding 流程。`
      : `This experience has not started yet. ${experiencer} is prefilled and waiting to enter the onboarding flow via ${getTriggerLabel(snapshot.onboardingTrigger, locale)}.`

  return {
    id: record.id,
    experiencedAt: record.experiencedAt,
    updatedAt: record.updatedAt,
    experiencer,
    statusLabel,
    currentStage,
    preview,
    completionRate,
    progressedCount,
    totalCount,
    highlights,
  }
}

export function ExperiencePage({ agents, onboardingTrigger, detailTitle, onBack }: ExperiencePageProps) {
  void agents
  const { locale } = useLocale()
  const [experienceRecords, setExperienceRecords] = useState<ExperienceSessionRecord[]>(() =>
    createSeededExperienceSessionRecords(onboardingTrigger),
  )
  const [activeRuntimeSession, setActiveRuntimeSession] = useState<ActiveRuntimeSession>(() =>
    createRuntimeSession(
      'runtime-initial',
      createJoyceExperienceInitialSnapshot(onboardingTrigger, 'active-session-initial'),
      null,
    ),
  )
  const [currentSidebarAgentId, setCurrentSidebarAgentId] = useState<ExperienceSidebarAgentId>('info-collect')
  const [isSidebarAgentsExpanded, setIsSidebarAgentsExpanded] = useState(false)
  const [activeExperienceTab, setActiveExperienceTab] = useState<'chat' | 'execution'>('chat')
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(() => Boolean(onBack))
  const [executionTabHasLoaded, setExecutionTabHasLoaded] = useState(false)
  const [isExecutionTabLoading, setIsExecutionTabLoading] = useState(false)
  const [experienceNoticeToast, setExperienceNoticeToast] = useState<{ title: string; sub?: string } | null>(null)

  const executionTabLoadTimerRef = useRef<number | null>(null)
  const experienceNoticeTimerRef = useRef<number | null>(null)
  const activeRuntimeSessionRef = useRef<ActiveRuntimeSession | null>(activeRuntimeSession)
  const sessionSerialRef = useRef(0)

  const noticeText = useMemo(
    () => ({
      experienceCreated: locale === 'zh' ? '创建成功' : 'Created',
      experienceCreatedSub: locale === 'zh' ? '体验记录已添加到列表。' : 'The experience record has been added to your list.',
      experienceDeleted: locale === 'zh' ? '已删除体验' : 'Experience deleted',
      experienceDeletedSub:
        locale === 'zh' ? '体验记录已从列表中移除。' : 'The experience record has been removed from your list.',
    }),
    [locale],
  )

  const showExperienceNotice = useCallback((title: string, sub?: string) => {
    setExperienceNoticeToast({ title, sub: sub?.trim() || undefined })
    if (experienceNoticeTimerRef.current != null) {
      window.clearTimeout(experienceNoticeTimerRef.current)
    }
    experienceNoticeTimerRef.current = window.setTimeout(() => {
      setExperienceNoticeToast(null)
      experienceNoticeTimerRef.current = null
    }, 2000)
  }, [])

  const renderExperienceNoticeToast = () =>
    experienceNoticeToast
      ? createPortal(
          <div className="agents-publish-success-toast" role="status" aria-live="polite">
            <span className="agents-publish-success-toast__icon" aria-hidden="true">
              ✓
            </span>
            <div className="agents-publish-success-toast__text">
              <strong className="agents-publish-success-toast__title">{experienceNoticeToast.title}</strong>
              {experienceNoticeToast.sub ? (
                <span className="agents-publish-success-toast__sub">{experienceNoticeToast.sub}</span>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null

  const experienceAgents = useMemo<ExperienceAgent[]>(
    () =>
      EXPERIENCE_SIDEBAR_AGENTS.map((agent) => ({
        id: agent.id,
        name: locale === 'zh' ? agent.labelZh : agent.labelEn,
        avatar: EXPERIENCE_SIDEBAR_AVATAR_MAP[agent.id],
      })),
    [locale],
  )

  const workflowProgress = activeRuntimeSession.workingSnapshot.progress
  const iciFlowStepId = activeRuntimeSession.workingSnapshot.iciFlowStepId ?? 'info-collect'
  const iciFlowContext = activeRuntimeSession.workingSnapshot.iciFlowContext
  const iciFlowCompleted = activeRuntimeSession.workingSnapshot.iciFlowCompleted
  const hasExecutionRecords = useMemo(
    () => Object.values(activeRuntimeSession.workingSnapshot.executionVisibility).some((visibility) => visibility.revealed),
    [activeRuntimeSession.workingSnapshot.executionVisibility],
  )
  const visibleExperienceTab = hasExecutionRecords ? activeExperienceTab : 'chat'
  const experienceRecordSummaries = useMemo(
    () => experienceRecords.map((record) => buildExperienceRecordSummary(record, locale)),
    [experienceRecords, locale],
  )

  const flowSteps = useMemo<ExperienceFlowStep[]>(() => {
    const currentStepId = iciFlowCompleted ? 'completed' : iciFlowStepId
    return buildIciProgressSteps(iciFlowContext, currentStepId, locale).map((step) => ({
      id: step.id,
      label: step.label,
      status: step.status,
      agentName: step.agentName,
      kind: step.kind,
      branchMeta: step.branchMeta,
    }))
  }, [iciFlowCompleted, iciFlowContext, iciFlowStepId, locale])

  const totalStepCount = flowSteps.length
  const currentStepNumber = useMemo(() => {
    const activeIndex = flowSteps.findIndex((step) => step.status === 'active')
    if (activeIndex >= 0) return activeIndex + 1
    if (flowSteps.every((step) => step.status === 'completed')) return totalStepCount
    const firstPendingIndex = flowSteps.findIndex((step) => step.status === 'pending')
    return firstPendingIndex >= 0 ? firstPendingIndex + 1 : 1
  }, [flowSteps, totalStepCount])
  const activeSessionRecordSummary = useMemo(
    () =>
      activeRuntimeSession.boundRecordId
        ? experienceRecordSummaries.find((record) => record.id === activeRuntimeSession.boundRecordId) ?? null
        : null,
    [activeRuntimeSession.boundRecordId, experienceRecordSummaries],
  )

  useEffect(
    () => () => {
      if (executionTabLoadTimerRef.current) {
        window.clearTimeout(executionTabLoadTimerRef.current)
      }
      if (experienceNoticeTimerRef.current != null) {
        window.clearTimeout(experienceNoticeTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!isRecordsModalOpen) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsRecordsModalOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecordsModalOpen])

  useEffect(() => {
    activeRuntimeSessionRef.current = activeRuntimeSession
  }, [activeRuntimeSession])

  const handleExecutionToggle = () => {
    if (!hasExecutionRecords || isExecutionTabLoading) return

    if (activeExperienceTab === 'execution') {
      setActiveExperienceTab('chat')
      return
    }

    setActiveExperienceTab('execution')
    if (executionTabHasLoaded) return

    setIsExecutionTabLoading(true)
    if (executionTabLoadTimerRef.current) {
      window.clearTimeout(executionTabLoadTimerRef.current)
    }
    executionTabLoadTimerRef.current = window.setTimeout(() => {
      setIsExecutionTabLoading(false)
      setExecutionTabHasLoaded(true)
      executionTabLoadTimerRef.current = null
    }, 720)
  }

  const handleCloseRecordsModal = () => {
    setIsRecordsModalOpen(false)
  }

  const handleOpenRecordsModal = () => {
    setIsRecordsModalOpen(true)
  }

  const handleOpenRecordDetail = (recordId: string) => {
    const selectedRecord = experienceRecords.find((record) => record.id === recordId)
    if (!selectedRecord) return
    sessionSerialRef.current += 1
    const runtimeSessionId = `record-view-${recordId}-${sessionSerialRef.current}`
    const nextRuntimeSession = createRuntimeSession(runtimeSessionId, selectedRecord.snapshot, recordId)
    setActiveRuntimeSession(nextRuntimeSession)
    setCurrentSidebarAgentId(mapRuntimeAgentToSidebarAgent(selectedRecord.snapshot.currentAgentId))
    setActiveExperienceTab('chat')
    setExecutionTabHasLoaded(false)
    setIsExecutionTabLoading(false)
    setIsRecordsModalOpen(false)
  }

  const handleCreateExperienceRecord = () => {
    sessionSerialRef.current += 1
    const serial = sessionSerialRef.current
    const sessionId = `active-session-${serial}`
    const snapshot = createJoyceExperienceInitialSnapshot(onboardingTrigger, sessionId)
    const newRecord: ExperienceSessionRecord = {
      id: `record-live-${serial}`,
        title: locale === 'zh' ? '新的入职体验' : 'New onboarding experience',
      experiencedAt: formatExperienceRecordTime(new Date()),
      updatedAt: formatExperienceRecordTime(new Date()),
      snapshot,
    }
    setExperienceRecords((prev) => [newRecord, ...prev])
    setActiveRuntimeSession(createRuntimeSession(`record-view-${newRecord.id}-${serial}`, snapshot, newRecord.id))
    setCurrentSidebarAgentId('info-collect')
    setActiveExperienceTab('chat')
    setExecutionTabHasLoaded(false)
    setIsExecutionTabLoading(false)
    setIsRecordsModalOpen(false)
    showExperienceNotice(noticeText.experienceCreated, noticeText.experienceCreatedSub)
  }

  const handleDeleteExperienceRecord = (recordId: string) => {
    const deleteConfirmText =
      locale === 'zh' ? '确认删除该体验记录吗？此操作不可撤销。' : 'Delete this experience record? This action cannot be undone.'
    if (!window.confirm(deleteConfirmText)) return

    setExperienceRecords((prev) => prev.filter((record) => record.id !== recordId))

    if (activeRuntimeSession.boundRecordId === recordId) {
      sessionSerialRef.current += 1
      const serial = sessionSerialRef.current
      const sessionId = `active-session-${serial}`
      const snapshot = createJoyceExperienceInitialSnapshot(onboardingTrigger, sessionId)
      setActiveRuntimeSession(createRuntimeSession(`runtime-reset-${serial}`, snapshot, null))
      setCurrentSidebarAgentId('info-collect')
      setActiveExperienceTab('chat')
      setExecutionTabHasLoaded(false)
      setIsExecutionTabLoading(false)
    }

    showExperienceNotice(noticeText.experienceDeleted, noticeText.experienceDeletedSub)
  }

  const handleExperienceStateChange = useCallback(
    ({
      runtimeSessionId,
      snapshot,
      interactionCommitted,
    }: {
      runtimeSessionId: string
      snapshot: JoyceExperienceSnapshot
      interactionCommitted: boolean
    }) => {
      const currentRuntimeSession = activeRuntimeSessionRef.current
      if (!currentRuntimeSession || runtimeSessionId !== currentRuntimeSession.runtimeSessionId) {
        return
      }

      setCurrentSidebarAgentId(mapRuntimeAgentToSidebarAgent(snapshot.currentAgentId))

      const nextDirty = currentRuntimeSession.dirty || interactionCommitted
      const boundRecordId = currentRuntimeSession.boundRecordId
      const shouldWriteBack =
        interactionCommitted &&
        boundRecordId !== null &&
        !areSnapshotsEqual(snapshot, currentRuntimeSession.sourceSnapshot)

      setActiveRuntimeSession((prev) => {
        if (!prev || prev.runtimeSessionId !== runtimeSessionId) return prev
        return {
          ...prev,
          workingSnapshot: cloneExperienceSnapshot(snapshot),
          sourceSnapshot: shouldWriteBack ? cloneExperienceSnapshot(snapshot) : prev.sourceSnapshot,
          status: 'ready',
          dirty: nextDirty,
        }
      })

      if (shouldWriteBack && boundRecordId) {
        const updatedAt = formatExperienceRecordTime(new Date())
        setExperienceRecords((prev) =>
          prev.map((record) =>
            record.id === boundRecordId
              ? {
                  ...record,
                  title: `${snapshot.employeeDraft.fullName || snapshot.triggerFormDraft.fullName || '当前体验用户'} 的入职体验`,
                  updatedAt,
                  snapshot: cloneExperienceSnapshot(snapshot),
                }
              : record,
          ),
        )
        return
      }

      if (!interactionCommitted || !hasStartedOnboardingFlow(snapshot) || boundRecordId) return

      const newRecord = createSessionRecord(snapshot, locale)
      setExperienceRecords((prev) => [newRecord, ...prev])
      setActiveRuntimeSession((prev) => {
        if (!prev || prev.runtimeSessionId !== runtimeSessionId) return prev
        return {
          ...prev,
          boundRecordId: newRecord.id,
          sourceSnapshot: cloneExperienceSnapshot(snapshot),
          workingSnapshot: cloneExperienceSnapshot(snapshot),
          status: 'ready',
          dirty: true,
        }
      })
    },
    [],
  )

  return (
    <section className="experience-page" aria-label={locale === 'zh' ? '体验页面' : 'Experience page'}>
      {isRecordsModalOpen ? (
        <div className="experience-records-stage">
          <section
            className="experience-records-modal experience-records-panel"
            aria-label={locale === 'zh' ? '体验记录' : 'Experience records'}
          >
            <div className="experience-records-modal-head">
              <div className="experience-records-modal-head-main">
                <button
                  type="button"
                  className="agents-back-btn"
                  aria-label={locale === 'zh' ? '返回用户体验页面' : 'Back to experience'}
                  onClick={handleCloseRecordsModal}
                >
                  ←
                </button>
                <div className="experience-records-modal-head-copy">
                  <div className="experience-records-modal-title">{locale === 'zh' ? '体验记录' : 'Experience records'}</div>
                  <div className="experience-records-modal-subtitle">
                    {locale === 'zh'
                      ? '查看最近的会话记录，并恢复一条历史会话继续执行。'
                      : 'Review recent experience sessions and restore one to continue.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="experience-records-list-wrap">
              <div className="experience-records-list">
                {experienceRecordSummaries.map((record) => (
                  <article key={record.id} className="experience-record-row">
                    <div className="experience-record-row-main">
                      <div className="experience-record-row-top">
                        <div className="experience-record-row-person">
                          <strong>{record.experiencer}</strong>
                          <span>{record.experiencedAt}</span>
                          {activeSessionRecordSummary?.id === record.id ? (
                            <span className="experience-record-chip is-muted">{locale === 'zh' ? '当前会话' : 'Current session'}</span>
                          ) : null}
                        </div>
                        <div className="experience-record-row-stage">
                          <span className="experience-record-chip">{record.statusLabel}</span>
                          <span className="experience-record-chip is-muted">{record.currentStage}</span>
                        </div>
                      </div>
                      <div className="experience-record-row-preview">{record.preview}</div>
                      <div className="experience-record-row-meta">
                        <div className="experience-record-progress">
                          <span>{locale === 'zh' ? '体验进度' : 'Progress'}</span>
                          <strong>{record.completionRate}%</strong>
                        </div>
                        <div className="experience-record-progress-bar" aria-hidden="true">
                          <span style={{ width: `${record.completionRate}%` }} />
                        </div>
                        <div className="experience-record-summary">
                          {locale === 'zh'
                            ? `已推进到 ${record.progressedCount}/${record.totalCount} 个节点`
                            : `${record.progressedCount}/${record.totalCount} steps progressed`}
                        </div>
                      </div>
                    </div>
                    <div className="experience-record-row-side">
                      <button
                        type="button"
                        className="experience-record-detail-btn"
                        onClick={() => handleOpenRecordDetail(record.id)}
                      >
                        {locale === 'zh' ? '查看详情' : 'View details'}
                      </button>
                      <button
                        type="button"
                        className="experience-record-delete-btn"
                        onClick={() => handleDeleteExperienceRecord(record.id)}
                      >
                        {locale === 'zh' ? '删除' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="experience-records-list-footer">
                <button type="button" className="experience-record-create-btn" onClick={handleCreateExperienceRecord}>
                  {locale === 'zh' ? '新建体验' : 'Create experience'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <>
          {onBack ? (
            <div className="experience-detail-topbar-shell">
              <header
                className="onboarding-workflow-topbar experience-detail-topbar"
                aria-label={locale === 'zh' ? '体验详情顶部栏' : 'Experience detail header'}
              >
                <div className="onboarding-workflow-topbar-left">
                  <button
                    className="agents-back-btn"
                    type="button"
                    aria-label={locale === 'zh' ? '返回体验列表' : 'Back to experience list'}
                    onClick={onBack}
                  >
                    ←
                  </button>
                  <div className="onboarding-workflow-meta">
                    <div className="onboarding-workflow-title">
                      {detailTitle ?? (locale === 'zh' ? '新员工入职' : 'New Employee Onboarding')}
                    </div>
                  </div>
                </div>
                <div className="onboarding-workflow-topbar-right">
                  <div className="onboarding-workflow-actions">
                    <button type="button" className="onboarding-workflow-ghost-btn" onClick={handleOpenRecordsModal}>
                      {locale === 'zh' ? '体验记录' : 'Experience records'}
                    </button>
                  </div>
                </div>
              </header>
            </div>
          ) : null}
          <div className="experience-shell">
        <aside className="experience-sidebar" aria-label={locale === 'zh' ? '你的Agents' : 'Your agents'}>
          <div className="experience-sidebar-card">
            <div className="experience-sidebar-title-row">
              <span className="experience-sidebar-kicker">AI</span>
              <span className="experience-sidebar-title">{locale === 'zh' ? '你的Agents' : 'Your agents'}</span>
            </div>

            <div className="experience-agent-list">
              {experienceAgents.map((agent) => {
                const isManagerAgent = Boolean(agent.isManager)
                const itemClassName = [
                  'experience-agent-item',
                  currentSidebarAgentId === agent.id ? 'is-active' : '',
                  isManagerAgent ? 'is-top-level is-manager-top-level' : 'is-top-level is-peer-top-level',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                <div
                  key={agent.id}
                  className={itemClassName}
                >
                  <img className="experience-agent-avatar" src={agent.avatar} alt={agent.name} />
                  <div className="experience-agent-copy">
                    <div className="experience-agent-name-row">
                      <span className="experience-agent-name">{agent.name}</span>
                      {isManagerAgent ? (
                        <>
                          <span className="experience-agent-badge is-main">{locale === 'zh' ? '管理者' : 'Manager'}</span>
                          <button
                            type="button"
                            className={isSidebarAgentsExpanded ? 'experience-agent-chevron is-expanded' : 'experience-agent-chevron'}
                            aria-label={
                              isSidebarAgentsExpanded
                                ? locale === 'zh'
                                  ? '折叠其他Agent'
                                  : 'Collapse other agents'
                                : locale === 'zh'
                                  ? '展开其他Agent'
                                  : 'Expand other agents'
                            }
                            aria-expanded={isSidebarAgentsExpanded}
                            onClick={() => setIsSidebarAgentsExpanded((value) => !value)}
                          >
                            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                              <path
                                d="M6 8l4 4 4-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>

          <div className="experience-progress-card">
            <div className="experience-progress-head">
              <div className="experience-progress-title">{locale === 'zh' ? '入职流程进度' : 'Onboarding progress'}</div>
            </div>

            <div className="experience-progress-summary">
              <div className="experience-progress-rate">
                <strong>
                  {locale === 'zh'
                    ? `第${currentStepNumber}步 共${totalStepCount}步`
                    : `Step ${currentStepNumber} of ${totalStepCount}`}
                </strong>
              </div>
              <div
                className={[
                  'experience-progress-meter',
                  totalStepCount > 10 ? 'is-dense' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              >
                {flowSteps.map((step) => (
                  <span
                    key={step.id}
                    className={
                      step.status === 'completed'
                        ? 'experience-progress-meter-dot is-completed'
                        : step.status === 'active'
                          ? 'experience-progress-meter-dot is-active'
                          : 'experience-progress-meter-dot'
                    }
                  />
                ))}
              </div>
            </div>

            <div className="experience-progress-list">
              {flowSteps.map((step) => {
                const isApproval = step.kind === 'approval'
                const isBranch = step.kind === 'branch' && Boolean(step.branchMeta)
                const itemClassName = [
                  'experience-progress-item',
                  step.status === 'completed'
                    ? 'is-completed'
                    : step.status === 'active'
                      ? 'is-active'
                      : '',
                  isApproval ? 'is-approval' : '',
                  isBranch ? 'is-branch' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                const approvalSubtitle =
                  step.approvalMeta && step.status === 'completed' && step.approvalMeta.result === 'approved'
                    ? locale === 'zh'
                      ? `人工审批 · ${step.approvalMeta.approver}已同意 ${step.approvalMeta.time}`
                      : `Manual approval · ${step.approvalMeta.approver} approved at ${step.approvalMeta.time}`
                    : step.approvalMeta && step.status === 'completed' && step.approvalMeta.result === 'rejected'
                      ? locale === 'zh'
                        ? `人工审批 · ${step.approvalMeta.approver}已拒绝 ${step.approvalMeta.time}`
                        : `Manual approval · ${step.approvalMeta.approver} rejected at ${step.approvalMeta.time}`
                      : step.status === 'active'
                        ? locale === 'zh'
                          ? '人工审批 · 等待上级审批'
                          : 'Manual approval · Awaiting review'
                        : locale === 'zh'
                          ? '人工审批 · 待触发'
                          : 'Manual approval · Pending'

                const selectedBranchPath = step.branchMeta?.paths.find(
                  (path) => path.id === step.branchMeta?.selectedPathId,
                )
                const branchSubtitle =
                  step.status === 'completed' && selectedBranchPath
                    ? locale === 'zh'
                      ? `条件分支 · 已命中${selectedBranchPath.label}`
                      : `Branch · Matched ${selectedBranchPath.label}`
                    : step.status === 'active'
                      ? locale === 'zh'
                        ? '条件分支 · 判断中'
                        : 'Branch · Evaluating'
                      : locale === 'zh'
                        ? '条件分支 · 待执行'
                        : 'Branch · Pending'

                return (
                  <Fragment key={step.id}>
                    <div className={itemClassName}>
                      <span className="experience-progress-dot" aria-hidden="true" />
                      <div className="experience-progress-copy">
                        <span>{step.label}</span>
                        {isApproval ? (
                          <>
                            <small className="experience-progress-approval-meta">{approvalSubtitle}</small>
                            {step.status !== 'pending' && step.approvalMeta ? (
                              <div className="experience-progress-approval-result">
                                <div className="experience-progress-approval-result-label">
                                  {locale === 'zh' ? '审批结果' : 'Approval result'}
                                </div>
                                <div
                                  className="experience-progress-approval-pills"
                                  role="group"
                                  aria-label={locale === 'zh' ? '审批结果' : 'Approval result'}
                                >
                                  <span
                                    className={[
                                      'experience-progress-approval-pill',
                                      step.approvalMeta.result === 'approved' ? 'is-selected is-approved' : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    ✓ {locale === 'zh' ? '同意' : 'Agree'}
                                  </span>
                                  <span
                                    className={[
                                      'experience-progress-approval-pill',
                                      step.approvalMeta.result === 'rejected' ? 'is-selected is-rejected' : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    {locale === 'zh' ? '拒绝' : 'Reject'}
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : isBranch && step.branchMeta ? (
                          <>
                            <small className="experience-progress-branch-meta">{branchSubtitle}</small>
                            <div className="experience-progress-branch-paths">
                              <div className="experience-progress-branch-paths-label">
                                {locale === 'zh' ? '可能路径' : 'Possible paths'}
                              </div>
                              <div
                                className="experience-progress-branch-path-pills"
                                role="list"
                                aria-label={locale === 'zh' ? '可能路径' : 'Possible paths'}
                              >
                                {step.branchMeta.paths.map((path) => (
                                  <span
                                    key={path.id}
                                    role="listitem"
                                    className={[
                                      'experience-progress-branch-path-pill',
                                      step.branchMeta?.selectedPathId === path.id ? 'is-selected' : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    {path.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <small>
                            {step.agentName}
                            {step.status === 'active' ? (
                              <span className="experience-progress-running-label">
                                {' · '}
                                {locale === 'zh' ? '执行中...' : 'Running...'}
                              </span>
                            ) : null}
                          </small>
                        )}
                      </div>
                    </div>
                    {isBranch && step.status !== 'completed' ? (
                      <div className="experience-progress-item is-branch-placeholder">
                        <span className="experience-progress-dot" aria-hidden="true" />
                        <div className="experience-progress-branch-placeholder" role="note">
                          <span className="experience-progress-branch-placeholder-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                              <circle cx="12" cy="5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
                              <path
                                d="M12 7.4V10.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 10.5c-2.6 0-4.7 1.9-4.7 4.3V18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 10.5c2.6 0 4.7 1.9 4.7 4.3V18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                              <circle cx="7.3" cy="18.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
                              <circle cx="16.7" cy="18.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          </span>
                          <span className="experience-progress-branch-placeholder-text">
                            {locale === 'zh' ? '后续步骤取决于分支结果' : 'Subsequent steps depend on the branch result'}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </Fragment>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="experience-main">
            <div className="experience-chat-shell">
              <div className="experience-chat-toolbar" aria-label={locale === 'zh' ? '体验会话工具栏' : 'Experience toolbar'}>
                <div className="experience-chat-toolbar-title-group">
                  <div className="experience-chat-toolbar-title">
                    {locale === 'zh' ? '新员工入职场景体验' : 'New employee onboarding experience'}
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    visibleExperienceTab === 'execution'
                      ? isExecutionTabLoading
                        ? 'experience-chat-toolbar-action is-active is-loading'
                        : 'experience-chat-toolbar-action is-active'
                      : !hasExecutionRecords
                        ? 'experience-chat-toolbar-action is-disabled'
                        : isExecutionTabLoading
                          ? 'experience-chat-toolbar-action is-loading'
                          : 'experience-chat-toolbar-action'
                  }
                  aria-pressed={visibleExperienceTab === 'execution'}
                  aria-disabled={!hasExecutionRecords}
                  disabled={!hasExecutionRecords}
                  onClick={handleExecutionToggle}
                >
                  <span>
                    {visibleExperienceTab === 'execution'
                      ? locale === 'zh'
                        ? '隐藏执行记录'
                        : 'Hide execution log'
                      : locale === 'zh'
                        ? '显示执行记录'
                        : 'Show execution log'}
                  </span>
                  {isExecutionTabLoading ? (
                    <span className="experience-chat-toolbar-action-spinner" aria-hidden="true" />
                  ) : null}
                </button>
              </div>
              <div className="experience-tab-panel">
                <JoyceExperienceTab
                  key={activeRuntimeSession.runtimeSessionId}
                  runtimeSessionId={activeRuntimeSession.runtimeSessionId}
                  initialSnapshot={activeRuntimeSession.workingSnapshot}
                  onboardingTrigger={activeRuntimeSession.workingSnapshot.onboardingTrigger}
                  showExecutionRecords={visibleExperienceTab === 'execution' && !isExecutionTabLoading}
                  onStateChange={handleExperienceStateChange}
                />
              </div>
            </div>
        </div>
      </div>
        </>
      )}
      {renderExperienceNoticeToast()}
    </section>
  )
}
