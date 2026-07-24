import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'
import { ExperiencePage } from './ExperiencePage'
import { isLoginRoleTier } from '../auth/types'
import { useRbac } from '../auth/useRbac'
import { useLocale } from '../i18n/LocaleContext'
import type { Agent } from '../types/agent'
import type { SharedOnboardingTriggerKind } from '../types/onboardingTrigger'

type ExperienceHubPageProps = {
  agents: Agent[]
  onboardingTrigger: SharedOnboardingTriggerKind
}

type ExperienceEntryCard = {
  id: string
  name: string
  desc: string
  meta: string
  tag: string
  category: 'onboarding' | 'hr' | 'training'
  iconStyle: CSSProperties
}

const EXPERIENCE_ICON_PALETTES = [
  {
    from: '#7f7cff',
    via: '#8b5cf6',
    to: '#ff9a62',
    shadow: 'rgba(124, 92, 255, 0.28)',
  },
  {
    from: '#62d6a5',
    via: '#33c0b8',
    to: '#3f8cff',
    shadow: 'rgba(51, 192, 184, 0.24)',
  },
  {
    from: '#5ea8ff',
    via: '#5b7cff',
    to: '#7b61ff',
    shadow: 'rgba(91, 124, 255, 0.24)',
  },
  {
    from: '#ff8cb7',
    via: '#ff7d95',
    to: '#9a6bff',
    shadow: 'rgba(255, 125, 149, 0.25)',
  },
  {
    from: '#ffd36a',
    via: '#ffab5b',
    to: '#ff7b72',
    shadow: 'rgba(255, 171, 91, 0.26)',
  },
] as const

function buildIconStyle(palette: (typeof EXPERIENCE_ICON_PALETTES)[number]): CSSProperties {
  return {
    '--agent-icon-from': palette.from,
    '--agent-icon-via': palette.via,
    '--agent-icon-to': palette.to,
    '--agent-icon-shadow': palette.shadow,
  } as CSSProperties
}

function buildDefaultExperienceCards(locale: 'zh' | 'en'): ExperienceEntryCard[] {
  return [
    {
      id: 'new-employee-onboarding',
      name: locale === 'zh' ? '新员工入职' : 'New Employee Onboarding',
      desc:
        locale === 'zh'
          ? '覆盖触发前置交互、多 Agent 协作与 onboarding 对话流的完整体验入口。'
          : 'Entry experience covering trigger setup, multi-agent collaboration, and the onboarding conversation flow.',
      meta: locale === 'zh' ? '今天' : 'today',
      tag: locale === 'zh' ? '入职' : 'Onboarding',
      category: 'onboarding',
      iconStyle: buildIconStyle(EXPERIENCE_ICON_PALETTES[0]),
    },
    {
      id: 'offer-to-onboard',
      name: locale === 'zh' ? 'Offer 接收到入职确认' : 'Offer to Onboarding Confirmation',
      desc:
        locale === 'zh'
          ? '从候选人确认 offer 到首轮入职材料提醒的体验预览。'
          : 'Preview the path from offer acceptance to the first onboarding material reminder.',
      meta: locale === 'zh' ? '昨天' : 'yesterday',
      tag: 'HR',
      category: 'hr',
      iconStyle: buildIconStyle(EXPERIENCE_ICON_PALETTES[1]),
    },
    {
      id: 'it-prep',
      name: locale === 'zh' ? '账号与设备预配置' : 'Account and Device Preparation',
      desc:
        locale === 'zh'
          ? '展示账号开通、设备准备与阻塞提醒的体验流程。'
          : 'Experience flow for account provisioning, device preparation, and blocker reminders.',
      meta: locale === 'zh' ? '2 天前' : '2 days ago',
      tag: locale === 'zh' ? '入职' : 'Onboarding',
      category: 'onboarding',
      iconStyle: buildIconStyle(EXPERIENCE_ICON_PALETTES[2]),
    },
    {
      id: 'day-one-training',
      name: locale === 'zh' ? '首日培训与文化引导' : 'Day 1 Training and Culture Intro',
      desc:
        locale === 'zh'
          ? '展示 Day 1 培训编排、文化导览与任务确认的体验入口。'
          : 'Entry experience for Day 1 training, culture introduction, and task confirmation.',
      meta: locale === 'zh' ? '2 天前' : '2 days ago',
      tag: locale === 'zh' ? '培训' : 'Training',
      category: 'training',
      iconStyle: buildIconStyle(EXPERIENCE_ICON_PALETTES[3]),
    },
    {
      id: 'probation-followup',
      name: locale === 'zh' ? '试用期跟进' : 'Probation Follow-up',
      desc:
        locale === 'zh'
          ? '预览首周、首月与试用期回访节点的体验流程。'
          : 'Preview the experience flow for first-week, first-month, and probation follow-up checkpoints.',
      meta: locale === 'zh' ? '3 天前' : '3 days ago',
      tag: 'HR',
      category: 'hr',
      iconStyle: buildIconStyle(EXPERIENCE_ICON_PALETTES[4]),
    },
  ]
}

function ExperienceHubPageTagline() {
  const { locale } = useLocale()

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={locale === 'zh' ? '场景·交互·流程·动作·可视化' : 'Scenario · Interaction · Flow · Actions · Visualization'}
    >
      <span className="agents-subtitle-part">{locale === 'zh' ? '场景' : 'Scenario'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '交互' : 'Interaction'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '流程' : 'Flow'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '动作' : 'Actions'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '可视化' : 'Visualization'}</span>
    </div>
  )
}

export function ExperienceHubPage({ agents, onboardingTrigger }: ExperienceHubPageProps) {
  const { locale } = useLocale()
  const { role } = useRbac()
  const canManageExperienceCards = !isLoginRoleTier(role, 'user')
  const [experienceNoticeToast, setExperienceNoticeToast] = useState<{ title: string; sub?: string } | null>(null)
  const [cards, setCards] = useState<ExperienceEntryCard[]>(() => buildDefaultExperienceCards(locale))
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null)
  const [experienceTab, setExperienceTab] = useState<'all' | 'onboarding' | 'hr' | 'training'>('all')
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const experienceNoticeTimerRef = useRef<number | null>(null)

  const noticeText = useMemo(
    () => ({
      experienceDeleted: locale === 'zh' ? '已删除体验' : 'Experience deleted',
      experienceDeletedSub: locale === 'zh' ? '体验已从列表中移除。' : 'The experience has been removed from your list.',
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

  useEffect(() => {
    return () => {
      if (experienceNoticeTimerRef.current != null) {
        window.clearTimeout(experienceNoticeTimerRef.current)
      }
    }
  }, [])

  const filteredCards = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    return cards.filter((card) => {
      if (experienceTab !== 'all' && card.category !== experienceTab) return false
      if (!keyword) return true
      return `${card.name} ${card.desc} ${card.tag}`.toLowerCase().includes(keyword)
    })
  }, [cards, experienceTab, searchValue])

  const onboardingCount = cards.filter((card) => card.category === 'onboarding').length
  const hrCount = cards.filter((card) => card.category === 'hr').length
  const trainingCount = cards.filter((card) => card.category === 'training').length

  const selectedExperienceCard =
    selectedExperienceId == null ? null : (cards.find((card) => card.id === selectedExperienceId) ?? null)

  if (selectedExperienceCard?.id === 'new-employee-onboarding') {
    return (
      <>
        <ExperiencePage
          agents={agents}
          onboardingTrigger={onboardingTrigger}
          detailTitle={selectedExperienceCard.name}
          onBack={() => setSelectedExperienceId(null)}
        />
        {renderExperienceNoticeToast()}
      </>
    )
  }

  return (
    <section
      className="agents-page experience-entry-page experience-hub-page"
      aria-label={locale === 'zh' ? '体验列表页面' : 'Experience list page'}
    >
      <div className="agents-page-main experience-entry-page-main">
        <AgentCardsGrid
          title={locale === 'zh' ? '体验' : 'Experience'}
          subtitle={<ExperienceHubPageTagline />}
          primaryActionLabel=""
          showPrimaryAction={false}
          tabs={[
            { key: 'all', label: locale === 'zh' ? '全部' : 'All', count: cards.length },
            { key: 'onboarding', label: locale === 'zh' ? '入职' : 'Onboarding', count: onboardingCount },
            { key: 'hr', label: 'HR', count: hrCount },
            { key: 'training', label: locale === 'zh' ? '培训' : 'Training', count: trainingCount },
          ]}
          activeTab={experienceTab}
          onTabChange={(key) => setExperienceTab(key as typeof experienceTab)}
          items={filteredCards}
          tagLabel={(card) => card.tag}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isCardClickable={(card) => card.id === 'new-employee-onboarding'}
          getCardAriaLabel={(card) =>
            card.id === 'new-employee-onboarding'
              ? locale === 'zh'
                ? `打开体验：${card.name}`
                : `Open experience: ${card.name}`
              : undefined
          }
          getItemIconStyle={(card) => card.iconStyle}
          showCardMenu={canManageExperienceCards}
          onCardClick={(card) => {
            if (card.id !== 'new-employee-onboarding') return
            setSelectedExperienceId(card.id)
          }}
          onDeleteItem={
            canManageExperienceCards
              ? (item) => {
                  setCards((prev) => prev.filter((card) => card.id !== item.id))
                  if (selectedExperienceId === item.id) {
                    setSelectedExperienceId(null)
                  }
                  showExperienceNotice(noticeText.experienceDeleted, noticeText.experienceDeletedSub)
                }
              : undefined
          }
        />
      </div>
      {renderExperienceNoticeToast()}
    </section>
  )
}
