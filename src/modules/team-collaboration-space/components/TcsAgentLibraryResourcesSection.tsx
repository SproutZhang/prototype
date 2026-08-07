import { useMemo, useState } from 'react'

import { AgentCardsGrid } from '../../../components/shared/AgentCardsGrid'
import type { AppLocale } from '../../../i18n/homeStrings'
import {
  localizeScenarioMeta,
  localizeScenarioSeedDesc,
  ONBOARDING_SCENARIO_SOURCE_NAME,
} from '../../../i18n/scenarioStrings'

type AgentLibraryResourceItem = {
  name: string
  desc: string
  meta: string
  tag: 'Single Agent' | 'Managerial Agent'
}

const HR_PINNED_AGENT_SEED: AgentLibraryResourceItem = {
  name: ONBOARDING_SCENARIO_SOURCE_NAME,
  desc: 'Master coordinator managing the entire employee onboarding workflow by delegating tasks to…',
  meta: 'yesterday',
  tag: 'Managerial Agent',
}

function getAgentCardTagLabel(tag: string, locale: AppLocale): string {
  if (locale === 'zh') return tag === 'Managerial Agent' ? '管理 Agent' : '单 Agent'
  return tag === 'Managerial Agent' ? 'Manager Agent' : 'Agent'
}

function makeDuplicateName(baseName: string, usedNames: Set<string>, locale: AppLocale): string {
  const suffix = locale === 'zh' ? ' 副本' : ' Copy'
  let candidate = `${baseName}${suffix}`
  let index = 2
  while (usedNames.has(candidate)) {
    candidate = `${baseName}${suffix} ${index}`
    index += 1
  }
  return candidate
}

function navigateToAgentLibrary() {
  window.history.pushState(null, '', '/agents')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

type TcsAgentLibraryResourcesGridProps = {
  locale: AppLocale
  embedInParentGrid?: boolean
  showItemTag?: boolean
}

/** HR 空间：Agent 库卡片网格（含完整 ⋮ 菜单），无区块标题 */
export function TcsAgentLibraryResourcesGrid({
  locale,
  embedInParentGrid = false,
  showItemTag = true,
}: TcsAgentLibraryResourcesGridProps) {
  const [agents, setAgents] = useState<AgentLibraryResourceItem[]>(() => [HR_PINNED_AGENT_SEED])

  const displayAgents = useMemo(
    () =>
      agents.map((agent) => ({
        ...agent,
        desc: localizeScenarioSeedDesc(agent.name, agent.desc, locale),
        meta: localizeScenarioMeta(agent.meta, locale),
      })),
    [agents, locale],
  )

  return (
    <AgentCardsGrid
      title=""
      primaryActionLabel=""
      showHeader={false}
      showTabs={false}
      showToolbar={false}
      tabs={[]}
      activeTab="all"
      onTabChange={() => {}}
      items={displayAgents}
      tagLabel={(item) => getAgentCardTagLabel(item.tag, locale)}
      showItemTag={showItemTag}
      onEditItem={() => navigateToAgentLibrary()}
      onOpenManagerialAgent={() => navigateToAgentLibrary()}
      onDuplicateItem={(item) => {
        setAgents((current) => {
          const source = current.find((agent) => agent.name === item.name)
          if (!source) return current
          const used = new Set(current.map((agent) => agent.name))
          const copyName = makeDuplicateName(source.name, used, locale)
          const copy: AgentLibraryResourceItem = {
            name: copyName,
            desc: source.desc,
            meta: locale === 'zh' ? '刚刚' : 'just now',
            tag: source.tag,
          }
          const index = current.findIndex((agent) => agent.name === source.name)
          return index === -1
            ? [copy, ...current]
            : [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
        })
      }}
      onDeleteItem={(item) => {
        setAgents((current) => current.filter((agent) => agent.name !== item.name))
      }}
      embedInParentGrid={embedInParentGrid}
    />
  )
}
