import { ONBOARDING_SCENARIO_SOURCE_NAME } from '../../../i18n/scenarioStrings'
import type { TcsResourceCatalogItem } from '../types'
import { getPublishedResourceCatalogExtras } from '../utils/publishedResourceCatalogExtras'

/** 与 Home / Agent 库、场景配置列表共用的演示种子数据 */
const RESOURCE_SEED: Array<Pick<TcsResourceCatalogItem, 'id' | 'desc' | 'meta'>> = [
  {
    id: ONBOARDING_SCENARIO_SOURCE_NAME,
    desc: 'Master coordinator managing the entire employee onboarding workflow by delegating tasks to…',
    meta: 'yesterday',
  },
  {
    id: 'onboarding',
    desc: '帮你创建一个多智能体项目，实现员工入职、培训一系列流程…',
    meta: '19 days ago',
  },
  {
    id: 'Leave Approval Workflow Agent',
    desc: 'Multi-level PTO approval workflow agent that routes vacation requests through manager and H…',
    meta: '19 days ago',
  },
  {
    id: 'Orientation Scheduler Agent',
    desc: 'Coordinates orientation schedules, team introductions, and first-day logistics',
    meta: '20 days ago',
  },
  {
    id: 'Onboarding Support Agent',
    desc: 'Answers employee questions and provides support throughout the onboarding process',
    meta: '20 days ago',
  },
  {
    id: 'Training Coordinator Agent',
    desc: 'Assigns training courses and tracks employee training progress',
    meta: '20 days ago',
  },
  {
    id: 'Account Setup Agent',
    desc: 'Creates and configures employee accounts and access credentials',
    meta: '20 days ago',
  },
  {
    id: 'Document Collection Agent',
    desc: 'Manages employee document collection and verification during onboarding',
    meta: '20 days ago',
  },
  {
    id: 'HR Onboarding Agent',
    desc: 'Automates new-hire onboarding: generates personalized welcome emails, builds role-specific…',
    meta: '20 days ago',
  },
  {
    id: 'Chief Technology Editor',
    desc: 'A senior editor who ensures article quality and coordinates the research and…',
    meta: '26 days ago',
  },
  {
    id: 'Technology Writer',
    desc: 'A renowned technology writer skilled at making complex technical concepts accessible through…',
    meta: '27 days ago',
  },
  {
    id: 'Technology Researcher',
    desc: 'Skilled in gathering and validating the latest technical information to…',
    meta: '27 days ago',
  },
  {
    id: 'Game Sprint Pipeline',
    desc: 'Coordinates sprint planning, task assignment, and release checkpoints for game iterations.',
    meta: '2 days ago',
  },
  {
    id: 'Art Asset Collaborator',
    desc: 'Manages character, scene, and UI asset reviews across the game art pipeline.',
    meta: '3 days ago',
  },
  {
    id: 'Game Bug Triage Agent',
    desc: 'Prioritizes defects, routes fixes, and tracks acceptance for game builds.',
    meta: '5 days ago',
  },
]

const WORKFLOW_SOURCE_NAMES = new Set<string>([
  ONBOARDING_SCENARIO_SOURCE_NAME,
  'onboarding',
  'Leave Approval Workflow Agent',
  'Game Sprint Pipeline',
])

export function getResourceCatalog(): TcsResourceCatalogItem[] {
  const seed = RESOURCE_SEED.map((item) => {
    const isWorkflow = WORKFLOW_SOURCE_NAMES.has(item.id)
    return {
      ...item,
      kind: isWorkflow ? 'workflow' : 'agent',
      sourceModule: isWorkflow ? 'scenario-config' : 'agent-library',
    } as TcsResourceCatalogItem
  })
  const seedIds = new Set(seed.map((item) => item.id))
  const extras = getPublishedResourceCatalogExtras().filter((item) => !seedIds.has(item.id))
  return [...seed, ...extras]
}
