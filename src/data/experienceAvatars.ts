import type { IciAgentKey } from './experienceIciOnboardingFlow'
import { ICI_AGENT_LABELS } from './experienceIciOnboardingFlow'
import bot1 from '../assets/AgentAvatar/bot1.png'
import bot2 from '../assets/AgentAvatar/bot2.png'
import bot3 from '../assets/AgentAvatar/bot3.png'
import bot4 from '../assets/AgentAvatar/bot4.png'
import bot5 from '../assets/AgentAvatar/bot5.png'
import bot6 from '../assets/AgentAvatar/bot6.png'
import bot7 from '../assets/AgentAvatar/bot7.png'
import bot8 from '../assets/AgentAvatar/bot8.png'
import bot9 from '../assets/AgentAvatar/bot9.png'
import bot10 from '../assets/AgentAvatar/bot10.png'
import bot11 from '../assets/AgentAvatar/bot11.png'
import bot12 from '../assets/AgentAvatar/bot12.png'
import bot13 from '../assets/AgentAvatar/bot13.png'
import bot14 from '../assets/AgentAvatar/bot14.png'
import bot15 from '../assets/AgentAvatar/bot15.png'

export const AGENT_AVATAR_BOTS = [
  bot1,
  bot2,
  bot3,
  bot4,
  bot5,
  bot6,
  bot7,
  bot8,
  bot9,
  bot10,
  bot11,
  bot12,
  bot13,
  bot14,
  bot15,
] as const

export const EXPERIENCE_SIDEBAR_AGENTS = [
  {
    id: 'info-collect',
    labelZh: ICI_AGENT_LABELS.info.zh,
    labelEn: ICI_AGENT_LABELS.info.en,
    src: bot2,
  },
  {
    id: 'case-register',
    labelZh: ICI_AGENT_LABELS.case.zh,
    labelEn: ICI_AGENT_LABELS.case.en,
    src: bot3,
  },
  {
    id: 'task-create',
    labelZh: ICI_AGENT_LABELS.task.zh,
    labelEn: ICI_AGENT_LABELS.task.en,
    src: bot4,
  },
  {
    id: 'comm',
    labelZh: ICI_AGENT_LABELS.comm.zh,
    labelEn: ICI_AGENT_LABELS.comm.en,
    src: bot5,
  },
  {
    id: 'schedule',
    labelZh: ICI_AGENT_LABELS.schedule.zh,
    labelEn: ICI_AGENT_LABELS.schedule.en,
    src: bot6,
  },
] as const

export type ExperienceSidebarAgentId = (typeof EXPERIENCE_SIDEBAR_AGENTS)[number]['id']

export const EXPERIENCE_SIDEBAR_AVATAR_MAP = EXPERIENCE_SIDEBAR_AGENTS.reduce<Record<ExperienceSidebarAgentId, string>>(
  (acc, item) => {
    acc[item.id] = item.src
    return acc
  },
  {} as Record<ExperienceSidebarAgentId, string>,
)

const RUNTIME_TO_SIDEBAR: Record<string, ExperienceSidebarAgentId> = {
  hr: 'info-collect',
  it: 'case-register',
  device: 'task-create',
  followup: 'comm',
  schedule: 'schedule',
  progress: 'comm',
  taskowner: 'task-create',
  sla: 'comm',
}

export function mapRuntimeAgentToSidebarAgent(agentId: string): ExperienceSidebarAgentId {
  return RUNTIME_TO_SIDEBAR[agentId] ?? 'info-collect'
}

export function mapIciAgentKeyToSidebarAgent(agent: IciAgentKey): ExperienceSidebarAgentId {
  switch (agent) {
    case 'info':
      return 'info-collect'
    case 'case':
      return 'case-register'
    case 'task':
      return 'task-create'
    case 'comm':
    case 'progress':
    case 'taskowner':
    case 'sla':
      return 'comm'
    case 'schedule':
      return 'schedule'
    default:
      return 'info-collect'
  }
}

export const EXPERIENCE_AVATAR_OPTIONS = AGENT_AVATAR_BOTS.map((src, index) => ({
  id: `bot${index + 1}`,
  label: index === 0 ? 'Joyce AI' : `Bot ${index + 1}`,
  src,
}))

export const EXPERIENCE_AVATAR_MAP = {
  joyce: bot1,
  hr: bot2,
  it: bot3,
  device: bot4,
  followup: bot5,
  schedule: bot6,
  culture: bot5,
} as const
